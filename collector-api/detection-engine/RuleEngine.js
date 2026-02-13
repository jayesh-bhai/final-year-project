import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RuleEngine {
  constructor(rulesFilePath = path.join(__dirname, 'rules.json')) {
    this.rules = this.loadRules(rulesFilePath);
    this.compiledRegexes = new Map();
  }

  /**
   * Reloads rules from the file system.
   * Useful for runtime updates without restarting the service.
   */
  async initialize() {
    this.rules = this.loadRules(path.join(__dirname, 'rules.json'));
    this.compiledRegexes.clear(); // Clear cache on reload
    return Promise.resolve();
  }

  getRules() {
    return this.rules;
  }

  /**
   * Wrapper for processEvent to maintain compatibility
   */
  async runRuleEngine(event) {
    return this.processEvent(event);
  }

  loadRules(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        console.warn(`Rules file not found at: ${filePath}`);
        return [];
      }
      const rulesData = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(rulesData);
    } catch (error) {
      console.error(`Error loading rules from ${filePath}:`, error.message);
      return [];
    }
  }

  /**
   * Resolves a value from a nested object using dot notation.
   * Returns undefined only if the path does not exist.
   * @param {Object} obj - The event object
   * @param {string} fieldPath - Dot notation path (e.g., "behavior.failed_auth_attempts")
   */
  getFieldValue(obj, fieldPath) {
    if (!fieldPath || typeof fieldPath !== 'string') return undefined;
    
    const parts = fieldPath.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Compiles and caches regex patterns.
   * Enforces 'i' flag (case-insensitive) and prohibits 'g' flag per requirements.
   */
  compileRegex(pattern) {
    if (this.compiledRegexes.has(pattern)) {
      return this.compiledRegexes.get(pattern);
    }

    try {
      const regex = new RegExp(pattern, 'i');
      this.compiledRegexes.set(pattern, regex);
      return regex;
    } catch (e) {
      console.error(`Invalid regex pattern: ${pattern}`, e);
      return null;
    }
  }

  /**
   * Evaluates a single condition against the event data.
   * @returns {Object} { matched: boolean, matchedValue: any }
   */
  evaluateCondition(condition, event) {
    const { field, operator } = condition;
    // Support both 'expected' (standard) and 'value' (legacy) keys
    const expected = condition.expected !== undefined ? condition.expected : condition.value;

    const fieldValue = this.getFieldValue(event, field);

    // If field is missing entirely, condition fails immediately
    if (fieldValue === undefined) {
      return { matched: false };
    }

    // Normalize operator
    const normalizedOperator = operator ? operator.toLowerCase() : '';
    switch (normalizedOperator) {
      case 'equals':
      case 'eq':
        return {
          matched: fieldValue === expected,
          matchedValue: fieldValue
        };

      case 'contains':
        // Case-insensitive string inclusion
        if (typeof fieldValue === 'string' && typeof expected === 'string') {
          return {
            matched: fieldValue.toLowerCase().includes(expected.toLowerCase()),
            matchedValue: fieldValue
          };
        }
        // Array handling
        if (Array.isArray(fieldValue)) {
          for (const item of fieldValue) {
            // Check strings directly
            if (typeof item === 'string' && item.toLowerCase().includes(String(expected).toLowerCase())) {
              return { matched: true, matchedValue: item };
            }
            // Check object .value property
            if (item && typeof item === 'object' && item.value && typeof item.value === 'string') {
               if (item.value.toLowerCase().includes(String(expected).toLowerCase())) {
                 return { matched: true, matchedValue: item.value };
               }
            }
          }
        }
        return { matched: false };

      case 'regex':
      case 'matches_regex':
        if (typeof expected !== 'string') return { matched: false };
        
        const regex = this.compileRegex(expected);
        if (!regex) return { matched: false };

        // 1. Direct String Match
        if (typeof fieldValue === 'string') {
          if (regex.test(fieldValue)) {
            return { matched: true, matchedValue: fieldValue };
          }
        }
        // 2. Array of Objects (e.g., Payloads) or Strings
        else if (Array.isArray(fieldValue)) {
          for (const item of fieldValue) {
            // Priority: Check item.value (common in payload structures)
            if (item && typeof item === 'object' && item.value && typeof item.value === 'string') {
              if (regex.test(item.value)) {
                return { matched: true, matchedValue: item.value };
              }
            }
            // Fallback: Check if item itself is a string
            else if (typeof item === 'string') {
              if (regex.test(item)) {
                return { matched: true, matchedValue: item };
              }
            }
          }
        }
        // 3. Object (e.g., query_params) - Iterate values
        else if (typeof fieldValue === 'object' && fieldValue !== null) {
          for (const key of Object.keys(fieldValue)) {
            const val = fieldValue[key];
            if (typeof val === 'string' && regex.test(val)) {
              return { matched: true, matchedValue: val };
            }
          }
        }
        return { matched: false };

      case '>':
      case 'greater_than': {
        const val = Number(fieldValue);
        const exp = Number(expected);
        return {
          matched: !isNaN(val) && !isNaN(exp) && val > exp,
          matchedValue: fieldValue
        };
      }

      case '<':
      case 'less_than': {
        const val = Number(fieldValue);
        const exp = Number(expected);
        return {
          matched: !isNaN(val) && !isNaN(exp) && val < exp,
          matchedValue: fieldValue
        };
      }

      case 'in_list':
        if (Array.isArray(expected)) {
          return {
            matched: expected.includes(fieldValue),
            matchedValue: fieldValue
          };
        }
        return { matched: false };

      default:
        // No silent failures for unknown operators
        throw new Error(`Unknown operator in rule condition: ${operator}`);
    }
  }

  /**
   * Processes an event against all loaded rules.
   * Returns a list of rule hits with structured evidence.
   */
  processEvent(event) {
    const ruleHits = [];

    if (!this.rules || !Array.isArray(this.rules)) {
      return ruleHits;
    }

    for (const rule of this.rules) {
      const evidence = [];
      let allConditionsMet = true;

      // Ensure conditions exist
      if (!rule.conditions || !Array.isArray(rule.conditions)) {
        continue;
      }

      for (const condition of rule.conditions) {
        try {
          const result = this.evaluateCondition(condition, event);

          if (result.matched) {
            // Push structured evidence as required
            evidence.push({
              field: condition.field,
              operator: condition.operator,
              expected: condition.expected !== undefined ? condition.expected : condition.value,
              value: result.matchedValue
            });
          } else {
            allConditionsMet = false;
            break; // Logic AND: one failure invalidates the rule
          }
        } catch (error) {
          console.error(`Error evaluating rule ${rule.rule_id}: ${error.message}`);
          allConditionsMet = false;
          break;
        }
      }

      if (allConditionsMet && evidence.length > 0) {
        ruleHits.push({
          rule_id: rule.rule_id,
          name: rule.name, // Pass through name if available
          severity: rule.severity,
          description: rule.description,
          evidence: evidence
        });
      }
    }

    return ruleHits;
  }
}

export { RuleEngine };