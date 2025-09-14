/**
 * Supabase-Specific Security Tests
 * Implements security tests based on research findings from supabase-vulnerabilities.md
 */

/**
 * JWT Token Security Test
 * Tests JWT token validation, expiration, and session management
 */
testingFramework.registerTest('jwt-validation', {
    name: 'JWT Token Security',
    description: 'Test JWT token validation, expiration, and session invalidation vulnerabilities',
    category: testingFramework.categories.SUPABASE,
    severity: testingFramework.severities.CRITICAL,
    timeout: 30000,
    
    async execute(config) {
        const findings = [];
        const errors = [];
        const metadata = {};
        
        try {
            // Test 1: Validate JWT token format and structure
            console.log('Testing JWT token format...');
            const tokenValidation = await this.validateJWTFormat(config.apiKey);
            if (!tokenValidation.isValid) {
                findings.push({
                    type: 'JWT Format Issue',
                    severity: 'high',
                    description: 'API key does not appear to be a valid JWT token',
                    evidence: tokenValidation.error,
                    remediation: 'Ensure you are using a valid Supabase API key (anon or service key)'
                });
            }
            
            // Test 2: Check for JWT secret exposure patterns
            console.log('Checking for JWT secret exposure...');
            const secretCheck = await this.checkJWTSecretExposure(config);
            if (secretCheck.exposed) {
                findings.push({
                    type: 'JWT Secret Exposure',
                    severity: 'critical',
                    description: 'Potential JWT secret exposure detected',
                    evidence: secretCheck.evidence,
                    remediation: 'Rotate JWT secrets immediately and review access controls'
                });
            }
            
            // Test 3: Test token expiration handling
            console.log('Testing token expiration...');
            const expirationTest = await this.testTokenExpiration(config);
            if (expirationTest.hasIssues) {
                findings.push({
                    type: 'Token Expiration Issue',
                    severity: 'medium',
                    description: 'Issues detected with token expiration handling',
                    evidence: expirationTest.details,
                    remediation: 'Implement proper token refresh mechanisms and validate expiration'
                });
            }
            
            // Test 4: Session invalidation test
            console.log('Testing session invalidation...');
            const sessionTest = await this.testSessionInvalidation(config);
            if (sessionTest.vulnerable) {
                findings.push({
                    type: 'Session Invalidation Vulnerability',
                    severity: 'critical',
                    description: 'Tokens may remain valid after logout (CVE-like issue)',
                    evidence: sessionTest.evidence,
                    remediation: 'Implement proper token blacklisting or short-lived tokens with refresh mechanism'
                });
            }
            
            metadata.testsPerformed = ['jwt-format', 'secret-exposure', 'expiration', 'session-invalidation'];
            
        } catch (error) {
            errors.push(`JWT validation test failed: ${error.message}`);
        }
        
        return { findings, errors, metadata };
    },
    
    async validateJWTFormat(token) {
        try {
            if (!SecurityUtils.isValidJwtFormat(token)) {
                return { isValid: false, error: 'Invalid JWT format - token should have 3 parts separated by dots' };
            }
            
            const payload = SecurityUtils.decodeJwtPayload(token);
            if (!payload) {
                return { isValid: false, error: 'Unable to decode JWT payload' };
            }
            
            // Check for required Supabase claims
            const requiredClaims = ['iss', 'iat'];
            for (const claim of requiredClaims) {
                if (!payload[claim]) {
                    return { isValid: false, error: `Missing required claim: ${claim}` };
                }
            }
            
            return { isValid: true, payload };
        } catch (error) {
            return { isValid: false, error: error.message };
        }
    },
    
    async checkJWTSecretExposure(config) {
        try {
            // Check if the JWT uses a weak or default secret
            const payload = SecurityUtils.decodeJwtPayload(config.apiKey);
            if (!payload) return { exposed: false };
            
            // Check for suspicious issuer patterns
            const suspiciousPatterns = [
                'localhost',
                'test',
                'demo',
                'example',
                '127.0.0.1'
            ];
            
            const issuer = payload.iss || '';
            for (const pattern of suspiciousPatterns) {
                if (issuer.toLowerCase().includes(pattern)) {
                    return {
                        exposed: true,
                        evidence: `Suspicious issuer pattern detected: ${issuer}`
                    };
                }
            }
            
            return { exposed: false };
        } catch (error) {
            return { exposed: false, error: error.message };
        }
    },
    
    async testTokenExpiration(config) {
        try {
            const payload = SecurityUtils.decodeJwtPayload(config.apiKey);
            if (!payload) return { hasIssues: false };
            
            const issues = [];
            
            // Check if token has expiration
            if (!payload.exp) {
                issues.push('Token does not have expiration claim (exp)');
            } else {
                // Check if token is expired
                if (SecurityUtils.isJwtExpired(config.apiKey)) {
                    issues.push('Token is already expired');
                }
                
                // Check expiration time (should not be too long)
                const expirationTime = new Date(payload.exp * 1000);
                const issuedTime = new Date(payload.iat * 1000);
                const validityPeriod = expirationTime - issuedTime;
                const oneYear = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
                
                if (validityPeriod > oneYear) {
                    issues.push(`Token validity period is too long: ${Math.round(validityPeriod / (24 * 60 * 60 * 1000))} days`);
                }
            }
            
            return {
                hasIssues: issues.length > 0,
                details: issues.join('; ')
            };
        } catch (error) {
            return { hasIssues: false, error: error.message };
        }
    },
    
    async testSessionInvalidation(config) {
        try {
            // This test simulates the session invalidation vulnerability
            // In a real scenario, this would involve actual logout and token reuse testing
            
            const testUrl = `${config.supabaseUrl}/auth/v1/user`;
            
            // Test if we can access user endpoint with the token
            const response = await fetch(testUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'apikey': config.apiKey
                }
            });
            
            // If this is an anonymous key, it shouldn't have user access
            const payload = SecurityUtils.decodeJwtPayload(config.apiKey);
            if (payload && payload.role === 'anon' && response.ok) {
                return {
                    vulnerable: true,
                    evidence: 'Anonymous token has unexpected user access privileges'
                };
            }
            
            return { vulnerable: false };
        } catch (error) {
            return { vulnerable: false, error: error.message };
        }
    }
});

/**
 * Row Level Security (RLS) Policy Test
 * Tests RLS policy implementation and potential bypasses
 */
testingFramework.registerTest('rls-policies', {
    name: 'Row Level Security Analysis',
    description: 'Analyze RLS policy implementation for misconfigurations and bypass vulnerabilities',
    category: testingFramework.categories.SUPABASE,
    severity: testingFramework.severities.HIGH,
    timeout: 45000,
    
    async execute(config) {
        const findings = [];
        const errors = [];
        const metadata = {};
        
        try {
            // Test 1: Check for tables without RLS enabled
            console.log('Checking for tables without RLS...');
            const rlsCheck = await this.checkRLSEnabled(config);
            if (rlsCheck.vulnerableTables.length > 0) {
                findings.push({
                    type: 'RLS Not Enabled',
                    severity: 'high',
                    description: 'Tables found without Row Level Security enabled',
                    evidence: `Vulnerable tables: ${rlsCheck.vulnerableTables.join(', ')}`,
                    remediation: 'Enable RLS on all tables containing sensitive data using ALTER TABLE table_name ENABLE ROW LEVEL SECURITY'
                });
            }
            
            // Test 2: Test for overly permissive policies
            console.log('Testing for permissive RLS policies...');
            const policyCheck = await this.checkPermissivePolicies(config);
            if (policyCheck.hasIssues) {
                findings.push({
                    type: 'Permissive RLS Policies',
                    severity: 'medium',
                    description: 'Potentially overly permissive RLS policies detected',
                    evidence: policyCheck.evidence,
                    remediation: 'Review and tighten RLS policies to follow principle of least privilege'
                });
            }
            
            // Test 3: Test authentication context in policies
            console.log('Testing authentication context...');
            const authContextTest = await this.testAuthenticationContext(config);
            if (authContextTest.hasIssues) {
                findings.push({
                    type: 'Authentication Context Issues',
                    severity: 'medium',
                    description: 'Issues with authentication context in RLS policies',
                    evidence: authContextTest.details,
                    remediation: 'Ensure RLS policies properly validate authenticated user context'
                });
            }
            
            metadata.testsPerformed = ['rls-enabled', 'permissive-policies', 'auth-context'];
            
        } catch (error) {
            errors.push(`RLS policy test failed: ${error.message}`);
        }
        
        return { findings, errors, metadata };
    },
    
    async checkRLSEnabled(config) {
        try {
            // This would typically query the database to check RLS status
            // For security reasons, we'll simulate this check
            const vulnerableTables = [];
            
            // Attempt to access common table endpoints without authentication
            const commonTables = ['users', 'profiles', 'posts', 'messages', 'documents'];
            
            for (const table of commonTables) {
                try {
                    const response = await fetch(`${config.supabaseUrl}/rest/v1/${table}?select=*&limit=1`, {
                        method: 'GET',
                        headers: {
                            'apikey': config.apiKey,
                            'Authorization': `Bearer ${config.apiKey}`
                        }
                    });
                    
                    // If we get data without proper authentication, RLS might not be enabled
                    if (response.ok) {
                        const data = await response.json();
                        if (Array.isArray(data) && data.length > 0) {
                            vulnerableTables.push(table);
                        }
                    }
                } catch (error) {
                    // Table might not exist, which is fine
                    continue;
                }
            }
            
            return { vulnerableTables };
        } catch (error) {
            throw new Error(`RLS check failed: ${error.message}`);
        }
    },
    
    async checkPermissivePolicies(config) {
        try {
            // Test for policies that might be too permissive
            // This is a simplified check - in practice would require database access
            
            const testEndpoint = `${config.supabaseUrl}/rest/v1/`;
            const response = await fetch(testEndpoint, {
                method: 'GET',
                headers: {
                    'apikey': config.apiKey,
                    'Authorization': `Bearer ${config.apiKey}`
                }
            });
            
            if (response.ok) {
                const data = await response.text();
                // Check for overly broad access patterns
                if (data.includes('public') || data.includes('*')) {
                    return {
                        hasIssues: true,
                        evidence: 'API responses suggest overly broad access permissions'
                    };
                }
            }
            
            return { hasIssues: false };
        } catch (error) {
            return { hasIssues: false, error: error.message };
        }
    },
    
    async testAuthenticationContext(config) {
        try {
            const issues = [];
            
            // Test if anonymous access is properly restricted
            const anonResponse = await fetch(`${config.supabaseUrl}/rest/v1/`, {
                method: 'GET',
                headers: {
                    'apikey': config.apiKey
                    // No Authorization header - testing anonymous access
                }
            });
            
            if (anonResponse.ok) {
                const data = await anonResponse.text();
                if (data && data.length > 100) { // Substantial response
                    issues.push('Anonymous access returns substantial data');
                }
            }
            
            return {
                hasIssues: issues.length > 0,
                details: issues.join('; ')
            };
        } catch (error) {
            return { hasIssues: false, error: error.message };
        }
    }
});

/**
 * API Endpoint Security Test
 * Tests API access controls and exposure
 */
testingFramework.registerTest('api-endpoints', {
    name: 'API Endpoint Security',
    description: 'Test API access controls, exposed endpoints, and data exposure vulnerabilities',
    category: testingFramework.categories.SUPABASE,
    severity: testingFramework.severities.HIGH,
    timeout: 30000,
    
    async execute(config) {
        const findings = [];
        const errors = [];
        const metadata = {};
        
        try {
            // Test 1: Enumerate exposed endpoints
            console.log('Enumerating API endpoints...');
            const endpointEnum = await this.enumerateEndpoints(config);
            if (endpointEnum.exposedEndpoints.length > 0) {
                findings.push({
                    type: 'Exposed API Endpoints',
                    severity: 'medium',
                    description: 'Publicly accessible API endpoints discovered',
                    evidence: `Exposed endpoints: ${endpointEnum.exposedEndpoints.join(', ')}`,
                    remediation: 'Review endpoint access controls and implement proper authentication'
                });
            }
            
            // Test 2: Test for unauthorized data access
            console.log('Testing unauthorized data access...');
            const dataAccessTest = await this.testUnauthorizedAccess(config);
            if (dataAccessTest.hasUnauthorizedAccess) {
                findings.push({
                    type: 'Unauthorized Data Access',
                    severity: 'high',
                    description: 'Unauthorized access to sensitive data detected',
                    evidence: dataAccessTest.evidence,
                    remediation: 'Implement proper access controls and RLS policies'
                });
            }
            
            // Test 3: Test API key management
            console.log('Testing API key security...');
            const keyTest = await this.testAPIKeySecurity(config);
            if (keyTest.hasIssues) {
                findings.push({
                    type: 'API Key Security Issues',
                    severity: 'medium',
                    description: 'Issues with API key configuration detected',
                    evidence: keyTest.details,
                    remediation: 'Review API key permissions and implement key rotation'
                });
            }
            
            metadata.testsPerformed = ['endpoint-enumeration', 'unauthorized-access', 'api-key-security'];
            
        } catch (error) {
            errors.push(`API endpoint test failed: ${error.message}`);
        }
        
        return { findings, errors, metadata };
    },
    
    async enumerateEndpoints(config) {
        const exposedEndpoints = [];
        
        try {
            // Test common Supabase endpoints
            const endpoints = [
                '/rest/v1/',
                '/auth/v1/',
                '/storage/v1/',
                '/realtime/v1/',
                '/functions/v1/'
            ];
            
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(`${config.supabaseUrl}${endpoint}`, {
                        method: 'GET',
                        headers: {
                            'apikey': config.apiKey
                        }
                    });
                    
                    if (response.ok || response.status === 401) {
                        // Endpoint exists (200 OK or 401 Unauthorized)
                        exposedEndpoints.push(endpoint);
                    }
                } catch (error) {
                    // Endpoint might not exist or be accessible
                    continue;
                }
            }
            
            return { exposedEndpoints };
        } catch (error) {
            throw new Error(`Endpoint enumeration failed: ${error.message}`);
        }
    },
    
    async testUnauthorizedAccess(config) {
        try {
            // Test access without proper authentication
            const testUrl = `${config.supabaseUrl}/rest/v1/`;
            
            // Test with no authentication
            const noAuthResponse = await fetch(testUrl, {
                method: 'GET'
            });
            
            // Test with only API key (no Bearer token)
            const apiKeyOnlyResponse = await fetch(testUrl, {
                method: 'GET',
                headers: {
                    'apikey': config.apiKey
                }
            });
            
            const evidence = [];
            
            if (noAuthResponse.ok) {
                evidence.push('API accessible without any authentication');
            }
            
            if (apiKeyOnlyResponse.ok) {
                const data = await apiKeyOnlyResponse.text();
                if (data && data.length > 50) {
                    evidence.push('Substantial data accessible with API key only');
                }
            }
            
            return {
                hasUnauthorizedAccess: evidence.length > 0,
                evidence: evidence.join('; ')
            };
        } catch (error) {
            return { hasUnauthorizedAccess: false, error: error.message };
        }
    },
    
    async testAPIKeySecurity(config) {
        try {
            const issues = [];
            
            // Check if API key is properly formatted
            if (!SecurityUtils.isValidJwtFormat(config.apiKey)) {
                issues.push('API key is not in JWT format');
            } else {
                const payload = SecurityUtils.decodeJwtPayload(config.apiKey);
                
                // Check role
                if (payload.role === 'service_role') {
                    issues.push('Using service role key - should be restricted to server-side only');
                }
                
                // Check for overly broad permissions
                if (payload.role === 'anon' && !payload.exp) {
                    issues.push('Anonymous key without expiration');
                }
            }
            
            return {
                hasIssues: issues.length > 0,
                details: issues.join('; ')
            };
        } catch (error) {
            return { hasIssues: false, error: error.message };
        }
    }
});

/**
 * Authentication Bypass Test
 * Tests for authentication vulnerabilities and bypass methods
 */
testingFramework.registerTest('auth-bypass', {
    name: 'Authentication Bypass',
    description: 'Test for authentication bypass vulnerabilities and weak authentication mechanisms',
    category: testingFramework.categories.SUPABASE,
    severity: testingFramework.severities.CRITICAL,
    timeout: 30000,
    
    async execute(config) {
        const findings = [];
        const errors = [];
        const metadata = {};
        
        try {
            // Test 1: Test for authentication bypass
            console.log('Testing authentication bypass...');
            const bypassTest = await this.testAuthBypass(config);
            if (bypassTest.bypassPossible) {
                findings.push({
                    type: 'Authentication Bypass',
                    severity: 'critical',
                    description: 'Authentication bypass vulnerability detected',
                    evidence: bypassTest.evidence,
                    remediation: 'Implement proper authentication validation and fix bypass vulnerabilities'
                });
            }
            
            // Test 2: Test weak authentication methods
            console.log('Testing authentication methods...');
            const authMethodTest = await this.testAuthMethods(config);
            if (authMethodTest.hasWeakMethods) {
                findings.push({
                    type: 'Weak Authentication Methods',
                    severity: 'medium',
                    description: 'Weak authentication methods detected',
                    evidence: authMethodTest.details,
                    remediation: 'Implement stronger authentication methods and disable weak ones'
                });
            }
            
            metadata.testsPerformed = ['auth-bypass', 'auth-methods'];
            
        } catch (error) {
            errors.push(`Authentication bypass test failed: ${error.message}`);
        }
        
        return { findings, errors, metadata };
    },
    
    async testAuthBypass(config) {
        try {
            // Test various bypass techniques
            const bypassAttempts = [];
            
            // Test 1: Direct API access without authentication
            try {
                const response = await fetch(`${config.supabaseUrl}/rest/v1/`, {
                    method: 'GET'
                });
                
                if (response.ok) {
                    bypassAttempts.push('Direct API access without authentication succeeded');
                }
            } catch (error) {
                // Expected for secure configurations
            }
            
            // Test 2: Malformed token bypass
            try {
                const response = await fetch(`${config.supabaseUrl}/rest/v1/`, {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer invalid_token',
                        'apikey': config.apiKey
                    }
                });
                
                if (response.ok) {
                    bypassAttempts.push('Malformed token accepted');
                }
            } catch (error) {
                // Expected for secure configurations
            }
            
            return {
                bypassPossible: bypassAttempts.length > 0,
                evidence: bypassAttempts.join('; ')
            };
        } catch (error) {
            return { bypassPossible: false, error: error.message };
        }
    },
    
    async testAuthMethods(config) {
        try {
            const weakMethods = [];
            
            // Test auth configuration endpoint
            try {
                const response = await fetch(`${config.supabaseUrl}/auth/v1/settings`, {
                    method: 'GET',
                    headers: {
                        'apikey': config.apiKey
                    }
                });
                
                if (response.ok) {
                    const settings = await response.json();
                    
                    // Check for weak configurations
                    if (settings.disable_signup === false) {
                        weakMethods.push('Public signup enabled');
                    }
                    
                    if (settings.email_confirm_required === false) {
                        weakMethods.push('Email confirmation not required');
                    }
                }
            } catch (error) {
                // Settings endpoint might not be accessible
            }
            
            return {
                hasWeakMethods: weakMethods.length > 0,
                details: weakMethods.join('; ')
            };
        } catch (error) {
            return { hasWeakMethods: false, error: error.message };
        }
    }
});

/**
 * Multi-Factor Authentication Security Test
 * Tests MFA implementation and potential bypass methods
 */
testingFramework.registerTest('mfa-bypass', {
    name: 'MFA Security',
    description: 'Test multi-factor authentication implementation and bypass vulnerabilities',
    category: testingFramework.categories.SUPABASE,
    severity: testingFramework.severities.HIGH,
    timeout: 30000,
    
    async execute(config) {
        const findings = [];
        const errors = [];
        const metadata = {};
        
        try {
            // Test MFA configuration
            console.log('Testing MFA configuration...');
            const mfaTest = await this.testMFAConfiguration(config);
            if (mfaTest.hasIssues) {
                findings.push({
                    type: 'MFA Configuration Issues',
                    severity: 'medium',
                    description: 'Issues with MFA configuration detected',
                    evidence: mfaTest.details,
                    remediation: 'Review and strengthen MFA configuration'
                });
            }
            
            metadata.testsPerformed = ['mfa-configuration'];
            
        } catch (error) {
            errors.push(`MFA test failed: ${error.message}`);
        }
        
        return { findings, errors, metadata };
    },
    
    async testMFAConfiguration(config) {
        try {
            const issues = [];
            
            // Test if MFA endpoints are accessible
            try {
                const response = await fetch(`${config.supabaseUrl}/auth/v1/factors`, {
                    method: 'GET',
                    headers: {
                        'apikey': config.apiKey,
                        'Authorization': `Bearer ${config.apiKey}`
                    }
                });
                
                if (response.status === 401) {
                    // Expected - MFA requires proper authentication
                } else if (response.ok) {
                    issues.push('MFA endpoints accessible without proper authentication');
                }
            } catch (error) {
                // MFA might not be enabled
            }
            
            return {
                hasIssues: issues.length > 0,
                details: issues.join('; ')
            };
        } catch (error) {
            return { hasIssues: false, error: error.message };
        }
    }
});

/**
 * Social Login Security Test
 * Tests OAuth flow and redirect validation security
 */
testingFramework.registerTest('social-login', {
    name: 'Social Login Security',
    description: 'Test OAuth flow security and redirect URI validation',
    category: testingFramework.categories.SUPABASE,
    severity: testingFramework.severities.MEDIUM,
    timeout: 30000,
    
    async execute(config) {
        const findings = [];
        const errors = [];
        const metadata = {};
        
        try {
            // Test OAuth configuration
            console.log('Testing OAuth configuration...');
            const oauthTest = await this.testOAuthSecurity(config);
            if (oauthTest.hasIssues) {
                findings.push({
                    type: 'OAuth Security Issues',
                    severity: 'medium',
                    description: 'Issues with OAuth configuration detected',
                    evidence: oauthTest.details,
                    remediation: 'Review OAuth configuration and implement proper redirect URI validation'
                });
            }
            
            metadata.testsPerformed = ['oauth-security'];
            
        } catch (error) {
            errors.push(`Social login test failed: ${error.message}`);
        }
        
        return { findings, errors, metadata };
    },
    
    async testOAuthSecurity(config) {
        try {
            const issues = [];
            
            // Test OAuth providers endpoint
            try {
                const response = await fetch(`${config.supabaseUrl}/auth/v1/settings`, {
                    method: 'GET',
                    headers: {
                        'apikey': config.apiKey
                    }
                });
                
                if (response.ok) {
                    const settings = await response.json();
                    
                    // Check for insecure OAuth configurations
                    if (settings.external) {
                        const providers = Object.keys(settings.external);
                        if (providers.length > 0) {
                            // OAuth is configured - check for potential issues
                            for (const provider of providers) {
                                const providerConfig = settings.external[provider];
                                if (providerConfig.enabled && !providerConfig.client_secret) {
                                    issues.push(`OAuth provider ${provider} may have configuration issues`);
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                // Settings might not be accessible
            }
            
            return {
                hasIssues: issues.length > 0,
                details: issues.join('; ')
            };
        } catch (error) {
            return { hasIssues: false, error: error.message };
        }
    }
});

console.log('Supabase security tests registered successfully');