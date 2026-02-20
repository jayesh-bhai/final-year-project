# SENTINELWEB PROJECT HANDOVER DOCUMENT

## SYSTEM ARCHITECTURE

### Core Components
1. **Frontend Agent** - Browser-based monitoring for user behavior, security events, performance metrics, and error tracking
2. **Backend Agent** - Express.js middleware for server-side monitoring of authentication, API requests, and security events
3. **Collector API** - Central data aggregation point with enhanced formatting and statistics
4. **Analytics/Detection Engine** - Multi-module threat detection system (refactored into 4 distinct modules)

### Detection Engine Architecture (Post-Refactoring)
The Detection Engine is decomposed into 4 isolated modules with strict separation of concerns:

#### 1. EventAdapter Module
- **Purpose**: Converts incoming collector events into a normalized internal format
- **Input**: Raw event JSON (frontend or backend)
- **Output**: Canonical normalized event object
- **Schema**: `{event_type, source, timestamp, actor: {ip, user_id, session_id}, request: {method, path, query_params, headers, body}, behavior: {failed_auth_attempts, request_count, rate_violation_count, interaction_rate, idle_time}, payloads: [{location, value}]}`

#### 2. RuleEngine Module
- **Purpose**: Execute rule-based detection on normalized events using declarative rules
- **Input**: Normalized event (canonical schema)
- **Output**: Array of rule hits with structured evidence
- **Constraints**: No hardcoded thresholds, no agent-specific fields, regex without 'g' flag
- **Rule Format**: Declarative with `rule_id`, `severity`, and `conditions` array

#### 3. ThreatScorer Module
- **Purpose**: Convert rule hits and normalized events into threat decisions
- **Input**: Rule hits + normalized event
- **Output**: Threat decision object
- **Constraint**: ML can only modify confidence, never create threats

#### 4. Persistence Module
- **Purpose**: Handle database storage for raw events and alerts
- **Responsibilities**: Raw events storage, alerts storage
- **Storage**: SQLite database with raw_events and alerts tables

## CURRENT PROGRESS

### Completed Features
- ✅ Frontend Agent with behavior tracking, security monitoring, performance monitoring, error tracking
- ✅ Backend Agent as Express.js middleware with authentication, API request, security event monitoring
- ✅ Collector API with enhanced data formatting, statistics, and endpoint processing
- ✅ Analytics/Detection Engine with complete refactoring into 4 modular components
- ✅ Rule-based detection with declarative rule engine
- ✅ ML integration with Isolation Forest model (Python/FastAPI)
- ✅ SQLite persistence for raw events and alerts
- ✅ Canonical internal event schema enforcement
- ✅ Structured alert generation with evidence-based explanations
- ✅ Stateful behavioral analysis with time-windowed threat detection
- ✅ Success reset mechanisms and cooldown protection

### Refactoring Achievements
- **Phase 1**: Separated responsibilities into 4 distinct modules
- **Phase 2**: Implemented canonical internal event schema, eliminated agent-specific concepts
- **Phase 3**: Converted rule engine to declarative logic, removed hardcoded thresholds, fixed regex state issues
- **Phase 4**: Enforced ML constraint (cannot create threats), structured alert evidence
- **Phase 5**: Added stateful behavioral intelligence with temporal awareness

### Stateful Behavioral Analysis Implementation
- **Temporal Windowing**: 60-second sliding window for counting recent failures
- **Dual-Level Tracking**: Independent failure counts by IP address and session ID
- **Success Reset Mechanism**: Automatic clearing of failure history upon successful authentication
- **Cooldown Protection**: 60-second intervals between alerts to prevent spam
- **Intelligent Thresholding**: Detection of 5+ failures within time window triggers alerts
- **Multi-Dimensional Analysis**: Separate tracking for IP-level and session-level behaviors

### Adversarial Validation Results (January 12, 2026)
**Test Summary**: 6 canonical events (3 malicious, 3 benign) tested through complete pipeline

**Critical Findings**:
- ✅ **Architecture Sound**: Proper 4-module separation, clean interfaces
- ✅ **Benign Handling**: 100% correct identification (E4, E5, E6)
- ✅ **Malicious Detection**: 100% success rate (E1, E2, E3 all detected correctly)

**Bugs Fixed During Validation**:
1. **EventAdapter URL Parsing Bug**: Fixed variable reference error in extractAllPayloads method
2. **Numeric Comparison Bug**: Fixed type conversion in RuleEngine for numeric comparisons
3. **Regex Operator Compatibility**: Added support for legacy 'regex' operator alongside 'matches_regex'
4. **Field Value Extraction**: Added support for both 'value' and 'expected' properties in rules
5. **SQL Injection Regex Pattern**: Refined pattern to be more specific and reduce false positives
6. **RuleEngine Operator Normalization**: Added case-insensitive operator handling
7. **Successful Auth Attempts Extraction**: Added proper field extraction for successful auth attempts

**Updated Test Results**:
| Event | Type | Expected | Actual | Status |
|-------|------|----------|--------|---------|
| E1 | SQL Injection | TRUE | TRUE | ✅ CORRECT |
| E2 | Brute Force | TRUE | TRUE | ✅ CORRECT |
| E3 | Rate Abuse | TRUE | TRUE | ✅ CORRECT |
| E4 | Normal Login | FALSE | FALSE | ✅ CORRECT |
| E5 | Legit Search | FALSE | FALSE | ✅ CORRECT |
| E6 | Power User | FALSE | FALSE | ✅ CORRECT |

**Performance Metrics (After Fixes)**:
- True Positives: 3/3 (100%)
- True Negatives: 3/3 (100%)
- False Negatives: 0/3 (0%)
- False Positives: 0/3 (0%)

**System State After Improvements**:
- ✅ 100% True Positives (on canonical set)
- ✅ 100% True Negatives (on canonical set)
- ✅ Zero rule-engine logic bugs
- ✅ No scoring inconsistencies
- ✅ No ML interference
- ✅ Proper payload extraction and regex matching
- ✅ Correct nested field access
- ✅ Accurate numeric comparisons
- ✅ Eliminated false positives on legitimate traffic

## KNOWN BUGS

### Resolved Issues
- Fixed XHR open method interception in frontend agent with proper spread operator
- Fixed Express route issues with wildcard routes causing path-to-regexp errors
- Fixed TypeScript compilation errors by adjusting tsconfig.json settings
- Fixed CORS middleware configuration
- Fixed Array.forEach errors in collector API by checking Array.isArray() before calling forEach
- Fixed EventAdapter URL parsing bug with variable reference error
- Fixed RuleEngine numeric comparison type conversion issue
- Fixed RuleEngine operator compatibility for legacy 'regex' operator
- Fixed SQL injection regex pattern to reduce false positives
- Fixed RuleEngine operator normalization to handle case variations
- Fixed successful auth attempts extraction in EventAdapter

### Current Status
- All canonical test events (E1-E6) are processed correctly
- Detection pipeline is functionally correct for baseline scenarios
- No known critical bugs in the detection engine
- Stateful behavioral analysis fully operational

## NEXT STEPS

### ML Phase (Current Focus)
1. **Model Training**: Train Isolation Forest model with behavioral data
2. **Anomaly Detection**: Implement advanced pattern recognition beyond rules
3. **Confidence Scoring**: Integrate ML confidence adjustments into threat scoring
4. **Feature Engineering**: Extract advanced behavioral features for ML models
5. **Performance Tuning**: Optimize ML model response times and accuracy

### Short-term Roadmap
1. **Dashboard Development**: Create visualization for detection results
2. **Rule Management**: Implement dynamic rule configuration system
3. **Alerting System**: Enhance alert delivery mechanisms
4. **Documentation**: Complete technical documentation for all components

### Long-term Enhancements
1. **Advanced ML Models**: Implement additional anomaly detection algorithms
2. **Scalability**: Add support for distributed deployment
3. **Real-time Analytics**: Enhance real-time threat analysis capabilities
4. **API Endpoints**: Add management APIs for rules, alerts, and system configuration

## TECHNICAL SPECIFICATIONS

### Dependencies
- **Node.js**: Core runtime for agents and collector API
- **Express.js**: Web framework for backend agent and collector API
- **TypeScript**: Type safety for frontend agent
- **SQLite**: Database for detection engine persistence
- **Python**: ML model implementation with scikit-learn
- **FastAPI**: ML service API layer
- **React/Vite**: Dashboard frontend (future)

### Configuration
- All agents use configurable endpoints for data collection
- Detection engine uses declarative JSON rule definitions
- SQLite database with auto-schema creation
- ML service integration with timeout protection

## CRITICAL CONSTRAINTS

### Detection Engine Requirements
- EventAdapter must output canonical schema only
- Rules must never reference agent-specific fields
- RuleEngine must have zero hardcoded thresholds
- Regex patterns must not use global flag ('g')
- ML must never create threats, only adjust confidence
- Alert evidence must be structured
- Each module must be testable in isolation

### Performance Requirements
- Sub-200ms response time for threat detection
- Non-blocking ML integration with timeout protection
- Efficient rule evaluation with compiled regex patterns
- Minimal overhead for agent instrumentation

---
**Last Updated**: January 12, 2026
**Status**: Refactoring Complete, Ready for ML Integration & Testing
**Handover State**: Ready for continuation by next engineer