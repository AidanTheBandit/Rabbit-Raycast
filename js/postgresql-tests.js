/**
 * PostgreSQL-Specific Security Tests
 * Implements database-level security tests based on research findings from postgresql-security.md
 */

/**
 * SQL Injection Test
 * Tests for SQL injection vulnerabilities in PostgreSQL endpoints
 */
testingFramework.registerTest('sql-injection', {
    name: 'SQL Injection Vulnerability Test',
    description: 'Test for SQL injection vulnerabilities using PostgreSQL-specific injection techniques',
    category: testingFramework.categories.POSTGRESQL,
    severity: testingFramework.severities.CRITICAL,
    timeout: 45000,
    
    async execute(config) {
        const findings = [];
        const errors = [];
        const metadata = {};
        
        try {
            // Test 1: Basic SQL injection patterns
            console.log('Testing basic SQL injection patterns...');
            const basicInjectionTest = await this.testBasicSQLInjection(config);
            if (basicInjectionTest.vulnerable) {
                findings.push({
                    type: 'SQL Injection Vulnerability',
                    severity: 'critical',
                    description: 'Basic SQL injection vulnerability detected',
                    evidence: basicInjectionTest.evidence,
                    remediation: 'Use parameterized queries and input validation to prevent SQL injection attacks'
                });
            }
            
            // Test 2: PostgreSQL-specific injection techniques
            console.log('Testing PostgreSQL-specific injection techniques...');
            const pgInjectionTest = await this.testPostgreSQLInjection(config);
            if (pgInjectionTest.vulnerable) {
                findings.push({
                    type: 'PostgreSQL-Specific Injection',
                    severity: 'critical',
                    description: 'PostgreSQL-specific injection vulnerability detected',
                    evidence: pgInjectionTest.evidence,
                    remediation: 'Implement PostgreSQL-specific input validation and disable dangerous functions'
                });
            }
            
            // Test 3: Union-based injection
            console.log('Testing union-based injection...');
            const unionInjectionTest = await this.testUnionBasedInjection(config);
            if (unionInjectionTest.vulnerable) {
                findings.push({
                    type: 'Union-Based SQL Injection',
                    severity: 'high',
                    description: 'Union-based SQL injection vulnerability detected',
                    evidence: unionInjectionTest.evidence,
                    remediation: 'Implement proper input validation and use prepared statements'
                });
            }
            
            // Test 4: Boolean-based blind injection
            console.log('Testing boolean-based blind injection...');
            const booleanInjectionTest = await this.testBooleanBasedInjection(config);
            if (booleanInjectionTest.vulnerable) {
                findings.push({
                    type: 'Boolean-Based Blind Injection',
                    severity: 'high',
                    description: 'Boolean-based blind SQL injection vulnerability detected',
                    evidence: booleanInjectionTest.evidence,
                    remediation: 'Implement consistent error handling and input validation'
                });
            }
            
            // Test 5: Time-based blind injection
            console.log('Testing time-based blind injection...');
            const timeInjectionTest = await this.testTimeBasedInjection(config);
            if (timeInjectionTest.vulnerable) {
                findings.push({
                    type: 'Time-Based Blind Injection',
                    severity: 'high',
                    description: 'Time-based blind SQL injection vulnerability detected',
                    evidence: timeInjectionTest.evidence,
                    remediation: 'Disable time-delay functions and implement proper input validation'
                });
            }
            
            metadata.testsPerformed = ['basic-injection', 'postgresql-specific', 'union-based', 'boolean-blind', 'time-blind'];
            
        } catch (error) {
            errors.push(`SQL injection test failed: ${error.message}`);
        }
        
        return { findings, errors, metadata };
    },
    
    async testBasicSQLInjection(config) {
        try {
            // Test basic SQL injection payloads
            const injectionPayloads = [
                "' OR '1'='1",
                "'; DROP TABLE users; --",
                "' UNION SELECT version() --",
                "' AND 1=1 --",
                "' AND 1=2 --"
            ];
            
            const vulnerabilities = [];
            
            for (const payload of injectionPayloads) {
                try {
                    // Test injection in REST API endpoints
                    const testUrl = `${config.supabaseUrl}/rest/v1/test?id=${encodeURIComponent(payload)}`;
                    
                    const response = await fetch(testUrl, {
                        method: 'GET',
                        headers: {
                            'apikey': config.apiKey,
                            'Authorization': `Bearer ${config.apiKey}`
                        }
                    });
                    
                    const responseText = await response.text();
                    
                    // Check for SQL error messages or unexpected behavior
                    if (this.containsSQLErrorSignatures(responseText)) {
                        vulnerabilities.push(`SQL error detected with payload: ${payload}`);
                    }
                    
                    // Check for version disclosure
                    if (responseText.toLowerCase().includes('postgresql')) {
                        vulnerabilities.push(`Database version disclosure with payload: ${payload}`);
                    }
                    
                } catch (error) {
                    // Network errors are expected for some payloads
                    continue;
                }
            }
            
            return {
                vulnerable: vulnerabilities.length > 0,
                evidence: vulnerabilities.join('; ')
            };
            
        } catch (error) {
            return { vulnerable: false, error: error.message };
        }
    },
    
    async testPostgreSQLInjection(config) {
        try {
            // PostgreSQL-specific injection payloads
            const pgPayloads = [
                "'; SELECT version(); --",
                "'; SELECT current_database(); --",
                "'; SELECT current_user; --",
                "' UNION SELECT table_name FROM information_schema.tables --",
                "' UNION SELECT column_name FROM information_schema.columns --"
            ];
            
            const vulnerabilities = [];
            
            for (const payload of pgPayloads) {
                try {
                    const testUrl = `${config.supabaseUrl}/rest/v1/test?filter=${encodeURIComponent(payload)}`;
                    
                    const response = await fetch(testUrl, {
                        method: 'GET',
                        headers: {
                            'apikey': config.apiKey,
                            'Authorization': `Bearer ${config.apiKey}`
                        }
                    });
                    
                    const responseText = await response.text();
                    
                    // Check for PostgreSQL-specific information disclosure
                    if (this.containsPostgreSQLSignatures(responseText)) {
                        vulnerabilities.push(`PostgreSQL information disclosure with payload: ${payload}`);
                    }
                    
                } catch (error) {
                    continue;
                }
            }
            
            return {
                vulnerable: vulnerabilities.length > 0,
                evidence: vulnerabilities.join('; ')
            };
            
        } catch (error) {
            return { vulnerable: false, error: error.message };
        }
    },
    
    async testUnionBasedInjection(config) {
        try {
            // Union-based injection payloads
            const unionPayloads = [
                "' UNION SELECT null,version(),null,null --",
                "' UNION SELECT table_name,null,null,null FROM information_schema.tables --",
                "' UNION SELECT column_name,data_type,null,null FROM information_schema.columns --"
            ];
            
            const vulnerabilities = [];
            
            for (const payload of unionPayloads) {
                try {
                    const testUrl = `${config.supabaseUrl}/rest/v1/test?select=*&id=eq.${encodeURIComponent(payload)}`;
                    
                    const response = await fetch(testUrl, {
                        method: 'GET',
                        headers: {
                            'apikey': config.apiKey,
                            'Authorization': `Bearer ${config.apiKey}`
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        
                        // Check if union query returned unexpected data
                        if (Array.isArray(data) && data.length > 0) {
                            const firstRow = data[0];
                            if (this.containsSystemInformation(firstRow)) {
                                vulnerabilities.push(`Union injection successful with payload: ${payload}`);
                            }
                        }
                    }
                    
                } catch (error) {
                    continue;
                }
            }
            
            return {
                vulnerable: vulnerabilities.length > 0,
                evidence: vulnerabilities.join('; ')
            };
            
        } catch (error) {
            return { vulnerable: false, error: error.message };
        }
    },
    
    async testBooleanBasedInjection(config) {
        try {
            // Boolean-based blind injection test
            const baseUrl = `${config.supabaseUrl}/rest/v1/test`;
            
            // Test true condition
            const trueCondition = "' AND (SELECT SUBSTRING(version(),1,1))='P' --";
            const trueResponse = await this.makeInjectionRequest(baseUrl, trueCondition, config);
            
            // Test false condition
            const falseCondition = "' AND (SELECT SUBSTRING(version(),1,1))='X' --";
            const falseResponse = await this.makeInjectionRequest(baseUrl, falseCondition, config);
            
            // Compare responses
            if (trueResponse && falseResponse) {
                const responseDifference = this.compareResponses(trueResponse, falseResponse);
                
                if (responseDifference.significant) {
                    return {
                        vulnerable: true,
                        evidence: `Boolean-based injection detected: ${responseDifference.details}`
                    };
                }
            }
            
            return { vulnerable: false };
            
        } catch (error) {
            return { vulnerable: false, error: error.message };
        }
    },
    
    async testTimeBasedInjection(config) {
        try {
            // Time-based blind injection payloads
            const timePayloads = [
                "'; SELECT pg_sleep(5); --",
                "'; SELECT CASE WHEN (1=1) THEN pg_sleep(3) ELSE pg_sleep(0) END; --"
            ];
            
            const vulnerabilities = [];
            
            for (const payload of timePayloads) {
                const startTime = Date.now();
                
                try {
                    const testUrl = `${config.supabaseUrl}/rest/v1/test?id=${encodeURIComponent(payload)}`;
                    
                    await fetch(testUrl, {
                        method: 'GET',
                        headers: {
                            'apikey': config.apiKey,
                            'Authorization': `Bearer ${config.apiKey}`
                        }
                    });
                    
                    const endTime = Date.now();
                    const responseTime = endTime - startTime;
                    
                    // Check if response time indicates time-based injection
                    if (responseTime > 3000) { // 3 seconds delay threshold
                        vulnerabilities.push(`Time-based injection detected with ${responseTime}ms delay using payload: ${payload}`);
                    }
                    
                } catch (error) {
                    const endTime = Date.now();
                    const responseTime = endTime - startTime;
                    
                    if (responseTime > 3000) {
                        vulnerabilities.push(`Time-based injection detected (with error) with ${responseTime}ms delay`);
                    }
                }
            }
            
            return {
                vulnerable: vulnerabilities.length > 0,
                evidence: vulnerabilities.join('; ')
            };
            
        } catch (error) {
            return { vulnerable: false, error: error.message };
        }
    },
    
    containsSQLErrorSignatures(text) {
        const errorSignatures = [
            'syntax error',
            'unterminated quoted string',
            'column does not exist',
            'relation does not exist',
            'permission denied',
            'invalid input syntax',
            'duplicate key value',
            'violates foreign key constraint'
        ];
        
        const lowerText = text.toLowerCase();
        return errorSignatures.some(signature => lowerText.includes(signature));
    },
    
    containsPostgreSQLSignatures(text) {
        const pgSignatures = [
            'postgresql',
            'pg_',
            'information_schema',
            'current_database',
            'current_user',
            'version()'
        ];
        
        const lowerText = text.toLowerCase();
        return pgSignatures.some(signature => lowerText.includes(signature));
    },
    
    containsSystemInformation(data) {
        if (!data || typeof data !== 'object') return false;
        
        const dataString = JSON.stringify(data).toLowerCase();
        return dataString.includes('postgresql') || 
               dataString.includes('version') || 
               dataString.includes('information_schema');
    },
    
    async makeInjectionRequest(baseUrl, payload, config) {
        try {
            const response = await fetch(`${baseUrl}?id=${encodeURIComponent(payload)}`, {
                method: 'GET',
                headers: {
                    'apikey': config.apiKey,
                    'Authorization': `Bearer ${config.apiKey}`
                }
            });
            
            return {
                status: response.status,
                text: await response.text(),
                headers: Object.fromEntries(response.headers.entries())
            };
        } catch (error) {
            return null;
        }
    },
    
    compareResponses(response1, response2) {
        if (!response1 || !response2) {
            return { significant: false, details: 'Unable to compare responses' };
        }
        
        // Compare status codes
        if (response1.status !== response2.status) {
            return {
                significant: true,
                details: `Status code difference: ${response1.status} vs ${response2.status}`
            };
        }
        
        // Compare response lengths
        const lengthDiff = Math.abs(response1.text.length - response2.text.length);
        if (lengthDiff > 10) {
            return {
                significant: true,
                details: `Response length difference: ${lengthDiff} characters`
            };
        }
        
        return { significant: false, details: 'No significant differences detected' };
    }
});

/**
 * Privilege Escalation Test
 * Tests for privilege escalation vulnerabilities
 */
testingFramework.registerTest('privilege-escalation', {
    name: 'Privilege Escalation Test',
    description: 'Test for privilege escalation vulnerabilities and excessive permissions',
    category: testingFramework.categories.POSTGRESQL,
    severity: testingFramework.severities.HIGH,
    timeout: 30000,
    
    async execute(config) {
        const findings = [];
        const errors = [];
        const metadata = {};
        
        try {
            // Test 1: Check for excessive API permissions
            console.log('Testing API permission levels...');
            const permissionTest = await this.testAPIPermissions(config);
            if (permissionTest.hasExcessivePermissions) {
                findings.push({
                    type: 'Excessive API Permissions',
                    severity: 'high',
                    description: 'API key has excessive permissions that could lead to privilege escalation',
                    evidence: permissionTest.evidence,
                    remediation: 'Use principle of least privilege and restrict API key permissions'
                });
            }
            
            // Test 2: Test for role-based access control bypass
            console.log('Testing role-based access control...');
            const rbacTest = await this.testRoleBasedAccess(config);
            if (rbacTest.bypassPossible) {
                findings.push({
                    type: 'RBAC Bypass Vulnerability',
                    severity: 'high',
                    description: 'Role-based access control bypass detected',
                    evidence: rbacTest.evidence,
                    remediation: 'Implement proper role validation and access controls'
                });
            }
            
            // Test 3: Test for horizontal privilege escalation
            console.log('Testing horizontal privilege escalation...');
            const horizontalTest = await this.testHorizontalPrivilegeEscalation(config);
            if (horizontalTest.vulnerable) {
                findings.push({
                    type: 'Horizontal Privilege Escalation',
                    severity: 'medium',
                    description: 'Horizontal privilege escalation vulnerability detected',
                    evidence: horizontalTest.evidence,
                    remediation: 'Implement proper user context validation and data isolation'
                });
            }
            
            metadata.testsPerformed = ['api-permissions', 'rbac-bypass', 'horizontal-escalation'];
            
        } catch (error) {
            errors.push(`Privilege escalation test failed: ${error.message}`);
        }
        
        return { findings, errors, metadata };
    },
    
    async testAPIPermissions(config) {
        try {
            const issues = [];
            
            // Decode JWT to check permissions
            const payload = SecurityUtils.decodeJwtPayload(config.apiKey);
            if (!payload) {
                return { hasExcessivePermissions: false, error: 'Unable to decode API key' };
            }
            
            // Check for service role permissions
            if (payload.role === 'service_role') {
                issues.push('Using service role key with full database access');
            }
            
            // Test administrative endpoints
            const adminEndpoints = [
                '/rest/v1/rpc/',
                '/auth/v1/admin/',
                '/storage/v1/admin/'
            ];
            
            for (const endpoint of adminEndpoints) {
                try {
                    const response = await fetch(`${config.supabaseUrl}${endpoint}`, {
                        method: 'GET',
                        headers: {
                            'apikey': config.apiKey,
                            'Authorization': `Bearer ${config.apiKey}`
                        }
                    });
                    
                    if (response.ok || response.status === 404) {
                        issues.push(`Access to administrative endpoint: ${endpoint}`);
                    }
                } catch (error) {
                    // Expected for restricted endpoints
                    continue;
                }
            }
            
            return {
                hasExcessivePermissions: issues.length > 0,
                evidence: issues.join('; ')
            };
            
        } catch (error) {
            return { hasExcessivePermissions: false, error: error.message };
        }
    },
    
    async testRoleBasedAccess(config) {
        try {
            const bypassAttempts = [];
            
            // Test role manipulation in requests
            const roleManipulationTests = [
                { header: 'X-User-Role', value: 'admin' },
                { header: 'X-Role', value: 'superuser' },
                { header: 'Role', value: 'service_role' }
            ];
            
            for (const test of roleManipulationTests) {
                try {
                    const response = await fetch(`${config.supabaseUrl}/rest/v1/`, {
                        method: 'GET',
                        headers: {
                            'apikey': config.apiKey,
                            'Authorization': `Bearer ${config.apiKey}`,
                            [test.header]: test.value
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.text();
                        if (data && data.length > 100) {
                            bypassAttempts.push(`Role manipulation successful with ${test.header}: ${test.value}`);
                        }
                    }
                } catch (error) {
                    continue;
                }
            }
            
            return {
                bypassPossible: bypassAttempts.length > 0,
                evidence: bypassAttempts.join('; ')
            };
            
        } catch (error) {
            return { bypassPossible: false, error: error.message };
        }
    },
    
    async testHorizontalPrivilegeEscalation(config) {
        try {
            const vulnerabilities = [];
            
            // Test user ID manipulation
            const userIdTests = [
                '1',
                '2',
                '999',
                'admin',
                'null'
            ];
            
            for (const userId of userIdTests) {
                try {
                    const response = await fetch(`${config.supabaseUrl}/rest/v1/profiles?user_id=eq.${userId}`, {
                        method: 'GET',
                        headers: {
                            'apikey': config.apiKey,
                            'Authorization': `Bearer ${config.apiKey}`
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (Array.isArray(data) && data.length > 0) {
                            vulnerabilities.push(`Unauthorized access to user data for ID: ${userId}`);
                        }
                    }
                } catch (error) {
                    continue;
                }
            }
            
            return {
                vulnerable: vulnerabilities.length > 0,
                evidence: vulnerabilities.join('; ')
            };
            
        } catch (error) {
            return { vulnerable: false, error: error.message };
        }
    }
});

/**
 * Default Credentials Test
 * Tests for default or weak credentials
 */
testingFramework.registerTest('default-credentials', {
    name: 'Default Credentials Test',
    description: 'Check for default or weak credentials in database configuration',
    category: testingFramework.categories.POSTGRESQL,
    severity: testingFramework.severities.HIGH,
    timeout: 30000,
    
    async execute(config) {
        const findings = [];
        const errors = [];
        const metadata = {};
        
        try {
            // Test 1: Check for weak API keys
            console.log('Testing API key strength...');
            const keyStrengthTest = await this.testAPIKeyStrength(config);
            if (keyStrengthTest.isWeak) {
                findings.push({
                    type: 'Weak API Key',
                    severity: 'medium',
                    description: 'API key appears to be weak or follows predictable patterns',
                    evidence: keyStrengthTest.evidence,
                    remediation: 'Generate strong, random API keys and rotate them regularly'
                });
            }
            
            // Test 2: Check for default configurations
            console.log('Testing for default configurations...');
            const defaultConfigTest = await this.testDefaultConfigurations(config);
            if (defaultConfigTest.hasDefaults) {
                findings.push({
                    type: 'Default Configuration Detected',
                    severity: 'medium',
                    description: 'Default configuration settings detected',
                    evidence: defaultConfigTest.evidence,
                    remediation: 'Change all default configurations and credentials'
                });
            }
            
            metadata.testsPerformed = ['api-key-strength', 'default-configurations'];
            
        } catch (error) {
            errors.push(`Default credentials test failed: ${error.message}`);
        }
        
        return { findings, errors, metadata };
    },
    
    async testAPIKeyStrength(config) {
        try {
            const issues = [];
            
            // Decode and analyze JWT
            const payload = SecurityUtils.decodeJwtPayload(config.apiKey);
            if (!payload) {
                return { isWeak: false, error: 'Unable to decode API key' };
            }
            
            // Check for weak patterns in issuer
            const issuer = payload.iss || '';
            const weakPatterns = [
                'localhost',
                '127.0.0.1',
                'test',
                'demo',
                'example',
                'default'
            ];
            
            for (const pattern of weakPatterns) {
                if (issuer.toLowerCase().includes(pattern)) {
                    issues.push(`Weak issuer pattern detected: ${pattern}`);
                }
            }
            
            // Check token age
            if (payload.iat) {
                const issuedDate = new Date(payload.iat * 1000);
                const daysSinceIssued = (Date.now() - issuedDate.getTime()) / (1000 * 60 * 60 * 24);
                
                if (daysSinceIssued > 365) {
                    issues.push(`API key is very old (${Math.round(daysSinceIssued)} days)`);
                }
            }
            
            return {
                isWeak: issues.length > 0,
                evidence: issues.join('; ')
            };
            
        } catch (error) {
            return { isWeak: false, error: error.message };
        }
    },
    
    async testDefaultConfigurations(config) {
        try {
            const defaults = [];
            
            // Test for default project patterns
            const url = new URL(config.supabaseUrl);
            const hostname = url.hostname;
            
            // Check for default-looking project names
            const defaultPatterns = [
                'test',
                'demo',
                'example',
                'default',
                'sample'
            ];
            
            for (const pattern of defaultPatterns) {
                if (hostname.toLowerCase().includes(pattern)) {
                    defaults.push(`Default project name pattern: ${pattern}`);
                }
            }
            
            return {
                hasDefaults: defaults.length > 0,
                evidence: defaults.join('; ')
            };
            
        } catch (error) {
            return { hasDefaults: false, error: error.message };
        }
    }
});

/**
 * Connection Security Test
 * Tests SSL/TLS configuration and connection security
 */
testingFramework.registerTest('connection-security', {
    name: 'Connection Security Test',
    description: 'Test SSL/TLS configuration and connection security measures',
    category: testingFramework.categories.POSTGRESQL,
    severity: testingFramework.severities.MEDIUM,
    timeout: 30000,
    
    async execute(config) {
        const findings = [];
        const errors = [];
        const metadata = {};
        
        try {
            // Test 1: Check HTTPS enforcement
            console.log('Testing HTTPS enforcement...');
            const httpsTest = await this.testHTTPSEnforcement(config);
            if (!httpsTest.enforced) {
                findings.push({
                    type: 'HTTPS Not Enforced',
                    severity: 'medium',
                    description: 'HTTPS is not properly enforced for API connections',
                    evidence: httpsTest.evidence,
                    remediation: 'Enforce HTTPS for all API connections and redirect HTTP to HTTPS'
                });
            }
            
            // Test 2: Check security headers
            console.log('Testing security headers...');
            const headersTest = await this.testSecurityHeaders(config);
            if (headersTest.missingHeaders.length > 0) {
                findings.push({
                    type: 'Missing Security Headers',
                    severity: 'low',
                    description: 'Important security headers are missing',
                    evidence: `Missing headers: ${headersTest.missingHeaders.join(', ')}`,
                    remediation: 'Implement proper security headers including HSTS, CSP, and X-Frame-Options'
                });
            }
            
            metadata.testsPerformed = ['https-enforcement', 'security-headers'];
            
        } catch (error) {
            errors.push(`Connection security test failed: ${error.message}`);
        }
        
        return { findings, errors, metadata };
    },
    
    async testHTTPSEnforcement(config) {
        try {
            // Test if HTTP version is accessible
            const httpsUrl = config.supabaseUrl;
            const httpUrl = httpsUrl.replace('https://', 'http://');
            
            try {
                const httpResponse = await fetch(httpUrl, {
                    method: 'GET',
                    headers: {
                        'apikey': config.apiKey
                    }
                });
                
                if (httpResponse.ok) {
                    return {
                        enforced: false,
                        evidence: 'HTTP version of API is accessible without redirect'
                    };
                }
            } catch (error) {
                // HTTP not accessible is good
            }
            
            return { enforced: true };
            
        } catch (error) {
            return { enforced: true, error: error.message };
        }
    },
    
    async testSecurityHeaders(config) {
        try {
            const response = await fetch(config.supabaseUrl, {
                method: 'GET',
                headers: {
                    'apikey': config.apiKey
                }
            });
            
            const headers = response.headers;
            const requiredHeaders = [
                'strict-transport-security',
                'x-content-type-options',
                'x-frame-options',
                'x-xss-protection',
                'content-security-policy'
            ];
            
            const missingHeaders = requiredHeaders.filter(header => !headers.has(header));
            
            return { missingHeaders };
            
        } catch (error) {
            return { missingHeaders: [], error: error.message };
        }
    }
});

/**
 * Information Disclosure Test
 * Tests for information leakage vulnerabilities
 */
testingFramework.registerTest('information-disclosure', {
    name: 'Information Disclosure Test',
    description: 'Test for information leakage and verbose error messages',
    category: testingFramework.categories.POSTGRESQL,
    severity: testingFramework.severities.MEDIUM,
    timeout: 30000,
    
    async execute(config) {
        const findings = [];
        const errors = [];
        const metadata = {};
        
        try {
            // Test 1: Check for verbose error messages
            console.log('Testing error message disclosure...');
            const errorTest = await this.testErrorDisclosure(config);
            if (errorTest.hasDisclosure) {
                findings.push({
                    type: 'Information Disclosure in Errors',
                    severity: 'low',
                    description: 'Verbose error messages may disclose sensitive information',
                    evidence: errorTest.evidence,
                    remediation: 'Implement generic error messages and proper error handling'
                });
            }
            
            // Test 2: Check for version disclosure
            console.log('Testing version disclosure...');
            const versionTest = await this.testVersionDisclosure(config);
            if (versionTest.disclosed) {
                findings.push({
                    type: 'Version Information Disclosure',
                    severity: 'info',
                    description: 'Database or server version information is disclosed',
                    evidence: versionTest.evidence,
                    remediation: 'Hide version information in HTTP headers and error messages'
                });
            }
            
            metadata.testsPerformed = ['error-disclosure', 'version-disclosure'];
            
        } catch (error) {
            errors.push(`Information disclosure test failed: ${error.message}`);
        }
        
        return { findings, errors, metadata };
    },
    
    async testErrorDisclosure(config) {
        try {
            const disclosures = [];
            
            // Test malformed requests to trigger errors
            const errorTriggers = [
                '/rest/v1/nonexistent_table',
                '/rest/v1/test?select=invalid_column',
                '/rest/v1/test?invalid_parameter=value'
            ];
            
            for (const trigger of errorTriggers) {
                try {
                    const response = await fetch(`${config.supabaseUrl}${trigger}`, {
                        method: 'GET',
                        headers: {
                            'apikey': config.apiKey,
                            'Authorization': `Bearer ${config.apiKey}`
                        }
                    });
                    
                    const errorText = await response.text();
                    
                    // Check for sensitive information in error messages
                    if (this.containsSensitiveInfo(errorText)) {
                        disclosures.push(`Sensitive information in error for: ${trigger}`);
                    }
                    
                } catch (error) {
                    continue;
                }
            }
            
            return {
                hasDisclosure: disclosures.length > 0,
                evidence: disclosures.join('; ')
            };
            
        } catch (error) {
            return { hasDisclosure: false, error: error.message };
        }
    },
    
    async testVersionDisclosure(config) {
        try {
            const response = await fetch(config.supabaseUrl, {
                method: 'GET',
                headers: {
                    'apikey': config.apiKey
                }
            });
            
            const headers = response.headers;
            const body = await response.text();
            
            const versionHeaders = [
                'server',
                'x-powered-by',
                'x-version'
            ];
            
            const disclosures = [];
            
            // Check headers for version information
            for (const header of versionHeaders) {
                const value = headers.get(header);
                if (value && this.containsVersionInfo(value)) {
                    disclosures.push(`Version info in ${header}: ${value}`);
                }
            }
            
            // Check body for version information
            if (this.containsVersionInfo(body)) {
                disclosures.push('Version information in response body');
            }
            
            return {
                disclosed: disclosures.length > 0,
                evidence: disclosures.join('; ')
            };
            
        } catch (error) {
            return { disclosed: false, error: error.message };
        }
    },
    
    containsSensitiveInfo(text) {
        const sensitivePatterns = [
            'password',
            'secret',
            'key',
            'token',
            'credential',
            'connection string',
            'database',
            'schema',
            'table',
            'column'
        ];
        
        const lowerText = text.toLowerCase();
        return sensitivePatterns.some(pattern => lowerText.includes(pattern));
    },
    
    containsVersionInfo(text) {
        const versionPatterns = [
            /postgresql\s+[\d.]+/i,
            /supabase\s+[\d.]+/i,
            /version\s+[\d.]+/i,
            /\d+\.\d+\.\d+/
        ];
        
        return versionPatterns.some(pattern => pattern.test(text));
    }
});

/**
 * Configuration Audit Test
 * Audits database security configuration
 */
testingFramework.registerTest('configuration-audit', {
    name: 'Configuration Security Audit',
    description: 'Audit database and API security configuration settings',
    category: testingFramework.categories.POSTGRESQL,
    severity: testingFramework.severities.MEDIUM,
    timeout: 30000,
    
    async execute(config) {
        const findings = [];
        const errors = [];
        const metadata = {};
        
        try {
            // Test 1: Audit API configuration
            console.log('Auditing API configuration...');
            const apiAudit = await this.auditAPIConfiguration(config);
            if (apiAudit.issues.length > 0) {
                findings.push({
                    type: 'API Configuration Issues',
                    severity: 'medium',
                    description: 'Issues found in API configuration',
                    evidence: apiAudit.issues.join('; '),
                    remediation: 'Review and harden API configuration settings'
                });
            }
            
            // Test 2: Check rate limiting
            console.log('Testing rate limiting...');
            const rateLimitTest = await this.testRateLimiting(config);
            if (!rateLimitTest.implemented) {
                findings.push({
                    type: 'Missing Rate Limiting',
                    severity: 'medium',
                    description: 'Rate limiting is not properly implemented',
                    evidence: rateLimitTest.evidence,
                    remediation: 'Implement proper rate limiting to prevent abuse'
                });
            }
            
            metadata.testsPerformed = ['api-configuration', 'rate-limiting'];
            
        } catch (error) {
            errors.push(`Configuration audit failed: ${error.message}`);
        }
        
        return { findings, errors, metadata };
    },
    
    async auditAPIConfiguration(config) {
        try {
            const issues = [];
            
            // Check JWT configuration
            const payload = SecurityUtils.decodeJwtPayload(config.apiKey);
            if (payload) {
                // Check for missing security claims
                if (!payload.exp) {
                    issues.push('JWT token does not have expiration');
                }
                
                if (!payload.aud) {
                    issues.push('JWT token does not specify audience');
                }
                
                // Check role configuration
                if (payload.role === 'anon' && !payload.exp) {
                    issues.push('Anonymous role without expiration');
                }
            }
            
            return { issues };
            
        } catch (error) {
            return { issues: [], error: error.message };
        }
    },
    
    async testRateLimiting(config) {
        try {
            // Test rate limiting by making rapid requests
            const requests = [];
            const testUrl = `${config.supabaseUrl}/rest/v1/`;
            
            // Make 10 rapid requests
            for (let i = 0; i < 10; i++) {
                requests.push(
                    fetch(testUrl, {
                        method: 'GET',
                        headers: {
                            'apikey': config.apiKey,
                            'Authorization': `Bearer ${config.apiKey}`
                        }
                    })
                );
            }
            
            const responses = await Promise.all(requests);
            
            // Check if any requests were rate limited
            const rateLimited = responses.some(response => response.status === 429);
            
            if (!rateLimited) {
                return {
                    implemented: false,
                    evidence: 'No rate limiting detected after 10 rapid requests'
                };
            }
            
            return { implemented: true };
            
        } catch (error) {
            return { implemented: false, error: error.message };
        }
    }
});

console.log('PostgreSQL security tests registered successfully');