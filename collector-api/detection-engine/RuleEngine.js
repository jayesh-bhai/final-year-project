/**
 * Rule Engine Module
 * Purpose: Execute rule-based detection on normalized events using declarative rules
 * Input: normalized event
 * Output: list of rule hits
 * No DB, No ML, No hardcoded thresholds
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class RuleEngine {
  constructor() {
    this.rules = [];
  }

  /**
   * Initializes the rule engine by loading rules from JSON file
   */
  async initialize() {
    await this.loadRules();
  }

  /**
   * Loads rules from JSON file
   */
  async loadRules() {
    try {
      const rulesPath = path.join(__dirname, 'rules.json');
      const rulesData = fs.readFileSync(rulesPath, 'utf8');
      this.rules = JSON.parse(rulesData);
      
      // Compile regex patterns for rules that use regex operators
      this.rules = this.rules.map(rule => {
        if (rule.conditions) {
          rule.conditions = rule.conditions.map(condition => {
            if (condition.operator === 'regex' && condition.value) {
              // Create a RegExp object from the string pattern without global flag
              try {
                condition.compiled_regex = new RegExp(condition.value, 'i'); // Case insensitive, no global flag
              } catch (e) {
                console.error(`Invalid regex pattern in rule ${rule.rule_id}: ${condition.value}`);
              }
            }
            return condition;
          });
        }
        return rule;
      });
      
      console.log(`📋 Loaded ${this.rules.length} rules from JSON file`);
    } catch (error) {
      console.error('❌ Error loading rules from JSON file:', error);
      
      // Fallback to basic rules if JSON loading fails
      this.rules = [
        {
          rule_id: 'SQLI_001',
          severity: 'HIGH',
          conditions: [
            {
              field: 'payloads',
              operator: 'regex',
              value: '(?i)(union\\\\s+select|or\\\\s+1=1|drop\\\\s+table|exec\\\\s*\\()'
            }
          ]
        },
        {
          rule_id: 'XSS_001', 
          severity: 'HIGH',
          conditions: [
            {
              field: 'payloads',
              operator: 'regex',
              value: '(?i)(<script|javascript:|on\\\\w+\\\\s*=)'
            }
          ]
        },
        {
          rule_id: 'BRUTE_FORCE_001',
          severity: 'MEDIUM',
          conditions: [
            {
              field: 'behavior.failed_auth_attempts',
              operator: '>',
              value: 5
            }
          ]
        }
      ];
      
      console.log('📋 Loaded fallback rules');
    }
  }

  /**
   * Executes rule-based detection on a normalized event using declarative rules
   * @param {Object} normalizedEvent - Normalized event to analyze (canonical schema)
   * @returns {Array} Array of rule hits
   */
  async runRuleEngine(normalizedEvent) {
    const ruleHits = [];

    for (const rule of this.rules) {
      try {
        // Evaluate all conditions for this rule
        let allConditionsMet = true;
        const evidence = [];

        for (const condition of rule.conditions || []) {
          const fieldValue = this.getFieldValue(normalizedEvent, condition.field);
          
          if (this.evaluateCondition(fieldValue, condition)) {
            // Add evidence for this condition match
            evidence.push({
              field: condition.field,
              value: fieldValue,
              operator: condition.operator,
              expected: condition.value
            });
          } else {
            // If any condition fails, the whole rule fails
            allConditionsMet = false;
            break;
          }
        }

        // If all conditions are met, add the rule hit
        if (allConditionsMet && evidence.length > 0) {
          ruleHits.push({
            rule_id: rule.rule_id,
            severity: rule.severity,
            evidence: evidence,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.rule_id}:`, error);
      }
    }

    return ruleHits;
  }

  /**
   * Gets the value of a field from the normalized event using dot notation
   * @param {Object} obj - Object to get field value from
   * @param {string} fieldPath - Field path in dot notation (e.g., 'behavior.failed_auth_attempts')
   * @returns {*} Field value
   */
  getFieldValue(obj, fieldPath) {
    const keys = fieldPath.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[key];
    }
    
    // Special handling for payloads array
    if (fieldPath === 'payloads' && Array.isArray(value)) {
      // Return all payload values as an array
      return value;
    }
    
    return value;
  }

  /**
   * Evaluates a single condition against a field value
   * @param {*} fieldValue - Value of the field being checked
   * @param {Object} condition - Condition to evaluate
   * @returns {boolean} True if condition is satisfied
   */
  evaluateCondition(fieldValue, condition) {
    const operator = condition.operator;
    const expectedValue = condition.value;

    switch (operator) {
      case '>':
        return fieldValue !== undefined && fieldValue > expectedValue;
      
      case '<':
        return fieldValue !== undefined && fieldValue < expectedValue;
      
      case '>=':
        return fieldValue !== undefined && fieldValue >= expectedValue;
      
      case '<=':
        return fieldValue !== undefined && fieldValue <= expectedValue;
      
      case '==':
      case '=':
        return fieldValue !== undefined && fieldValue == expectedValue;
      
      case '===':
        return fieldValue !== undefined && fieldValue === expectedValue;
      
      case '!=':
        return fieldValue !== undefined && fieldValue != expectedValue;
      
      case '!==':
        return fieldValue !== undefined && fieldValue !== expectedValue;
      
      case 'contains':
        if (Array.isArray(fieldValue)) {
          return fieldValue.some(item => 
            typeof item === 'object' && item.value && item.value.includes(expectedValue)
          );
        }
        return fieldValue !== undefined && typeof fieldValue === 'string' && fieldValue.includes(expectedValue);
      
      case 'regex':
        if (condition.compiled_regex) {
          if (Array.isArray(fieldValue)) {
            // For payloads array, check if any payload matches the regex
            return fieldValue.some(payload => 
              payload && payload.value && condition.compiled_regex.test(payload.value)
            );
          }
          // For single values, test directly
          return fieldValue !== undefined && condition.compiled_regex.test(String(fieldValue));
        }
        return false;
      
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      
      case 'starts_with':
        return fieldValue !== undefined && typeof fieldValue === 'string' && fieldValue.startsWith(expectedValue);
      
      case 'ends_with':
        return fieldValue !== undefined && typeof fieldValue === 'string' && fieldValue.endsWith(expectedValue);
      
      default:
        console.warn(`Unknown operator: ${operator}`);
        return false;
    }
  }

  /**
   * Gets all loaded rules
   * @returns {Array} Array of rules
   */
  getRules() {
    return this.rules;
  }
}

export default RuleEngine;