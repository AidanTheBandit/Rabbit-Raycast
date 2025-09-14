/**
 * Core Testing Framework for Supabase Security Testing Suite
 * Handles test execution, coordination, and result management
 */

class SecurityTestingFramework {
    constructor() {
        this.tests = new Map();
        this.testResults = new Map();
        this.isRunning = false;
        this.currentTest = null;
        this.startTime = null;
        this.endTime = null;
        this.config = null;
        this.eventListeners = new Map();
        
        // Test categories
        this.categories = {
            SUPABASE: 'supabase',
            POSTGRESQL: 'postgresql'
        };
        
        // Test statuses
        this.statuses = {
            PENDING: 'pending',
            RUNNING: 'running',
            PASSED: 'passed',
            FAILED: 'failed',
            WARNING: 'warning',
            ERROR: 'error',
            SKIPPED: 'skipped'
        };
        
        // Severity levels
        this.severities = {
            CRITICAL: 'critical',
            HIGH: 'high',
            MEDIUM: 'medium',
            LOW: 'low',
            INFO: 'info'
        };
        
        this.initializeFramework();
    }
    
    /**
     * Initialize the testing framework
     */
    initializeFramework() {
        console.log('Initializing Security Testing Framework');
        this.registerEventHandlers();
    }
    
    /**
     * Register a security test
     * @param {string} id - Test identifier
     * @param {Object} testConfig - Test configuration
     */
    registerTest(id, testConfig) {
        if (!id || !testConfig) {
            throw new Error('Test ID and configuration are required');
        }
        
        const test = {
            id,
            name: testConfig.name || id,
            description: testConfig.description || '',
            category: testConfig.category || this.categories.SUPABASE,
            severity: testConfig.severity || this.severities.MEDIUM,
            enabled: testConfig.enabled !== false,
            timeout: testConfig.timeout || 30000, // 30 seconds default
            dependencies: testConfig.dependencies || [],
            execute: testConfig.execute,
            validate: testConfig.validate || (() => true),
            cleanup: testConfig.cleanup || (() => {}),
            metadata: testConfig.metadata || {}
        };
        
        if (typeof test.execute !== 'function') {
            throw new Error(`Test ${id} must have an execute function`);
        }
        
        this.tests.set(id, test);
        console.log(`Registered test: ${id}`);
        
        // Initialize test result
        this.testResults.set(id, {
            status: this.statuses.PENDING,
            startTime: null,
            endTime: null,
            duration: 0,
            findings: [],
            errors: [],
            metadata: {}
        });
    }
    
    /**
     * Set configuration for testing
     * @param {Object} config - Configuration object
     */
    setConfiguration(config) {
        if (!config) {
            throw new Error('Configuration is required');
        }
        
        // Validate required configuration
        const requiredFields = ['supabaseUrl', 'apiKey'];
        for (const field of requiredFields) {
            if (!config[field]) {
                throw new Error(`Configuration field '${field}' is required`);
            }
        }
        
        // Validate Supabase URL
        if (!StringUtils.isValidUrl(config.supabaseUrl)) {
            throw new Error('Invalid Supabase URL format');
        }
        
        // Validate API key format (basic JWT check)
        if (!SecurityUtils.isValidJwtFormat(config.apiKey)) {
            throw new Error('Invalid API key format');
        }
        
        this.config = {
            supabaseUrl: config.supabaseUrl.replace(/\/$/, ''), // Remove trailing slash
            apiKey: config.apiKey,
            testEmail: config.testEmail || null,
            testPassword: config.testPassword || null,
            timeout: config.timeout || 30000,
            maxRetries: config.maxRetries || 3,
            delayBetweenTests: config.delayBetweenTests || 1000
        };
        
        console.log('Configuration set successfully');
        this.emit('configurationSet', this.config);
    }
    
    /**
     * Get list of available tests
     * @param {string} category - Optional category filter
     * @returns {Array} - Array of test objects
     */
    getTests(category = null) {
        const tests = Array.from(this.tests.values());
        if (category) {
            return tests.filter(test => test.category === category);
        }
        return tests;
    }
    
    /**
     * Get test by ID
     * @param {string} id - Test ID
     * @returns {Object|null} - Test object or null
     */
    getTest(id) {
        return this.tests.get(id) || null;
    }
    
    /**
     * Get test result by ID
     * @param {string} id - Test ID
     * @returns {Object|null} - Test result or null
     */
    getTestResult(id) {
        return this.testResults.get(id) || null;
    }
    
    /**
     * Get all test results
     * @returns {Map} - Map of test results
     */
    getAllResults() {
        return new Map(this.testResults);
    }
    
    /**
     * Run a single test
     * @param {string} testId - Test ID to run
     * @returns {Promise<Object>} - Test result
     */
    async runTest(testId) {
        const test = this.tests.get(testId);
        if (!test) {
            throw new Error(`Test '${testId}' not found`);
        }
        
        if (!test.enabled) {
            console.log(`Test '${testId}' is disabled, skipping`);
            this.updateTestResult(testId, {
                status: this.statuses.SKIPPED,
                startTime: new Date(),
                endTime: new Date(),
                duration: 0
            });
            return this.testResults.get(testId);
        }
        
        if (!this.config) {
            throw new Error('Configuration not set. Call setConfiguration() first.');
        }
        
        console.log(`Starting test: ${testId}`);
        this.currentTest = testId;
        
        // Update test status
        const startTime = new Date();
        this.updateTestResult(testId, {
            status: this.statuses.RUNNING,
            startTime,
            endTime: null,
            duration: 0,
            findings: [],
            errors: []
        });
        
        this.emit('testStarted', { testId, test });
        
        try {
            // Check dependencies
            await this.checkTestDependencies(test);
            
            // Execute test with timeout
            const result = await this.executeTestWithTimeout(test);
            
            // Validate result
            const isValid = await test.validate(result, this.config);
            
            const endTime = new Date();
            const duration = endTime - startTime;
            
            // Update test result
            this.updateTestResult(testId, {
                status: isValid ? this.statuses.PASSED : this.statuses.FAILED,
                endTime,
                duration,
                findings: result.findings || [],
                errors: result.errors || [],
                metadata: result.metadata || {}
            });
            
            console.log(`Test '${testId}' completed: ${isValid ? 'PASSED' : 'FAILED'}`);
            this.emit('testCompleted', { testId, result: this.testResults.get(testId) });
            
        } catch (error) {
            const endTime = new Date();
            const duration = endTime - startTime;
            
            console.error(`Test '${testId}' failed with error:`, error);
            
            this.updateTestResult(testId, {
                status: this.statuses.ERROR,
                endTime,
                duration,
                errors: [error.message],
                metadata: { error: error.stack }
            });
            
            this.emit('testError', { testId, error });
        } finally {
            // Cleanup
            try {
                await test.cleanup(this.config);
            } catch (cleanupError) {
                console.warn(`Cleanup failed for test '${testId}':`, cleanupError);
            }
            
            this.currentTest = null;
        }
        
        return this.testResults.get(testId);
    }
    
    /**
     * Run multiple tests
     * @param {Array} testIds - Array of test IDs to run
     * @returns {Promise<Map>} - Map of test results
     */
    async runTests(testIds) {
        if (!Array.isArray(testIds) || testIds.length === 0) {
            throw new Error('Test IDs array is required');
        }
        
        if (this.isRunning) {
            throw new Error('Tests are already running');
        }
        
        this.isRunning = true;
        this.startTime = new Date();
        
        console.log(`Starting test suite with ${testIds.length} tests`);
        this.emit('testSuiteStarted', { testIds, startTime: this.startTime });
        
        const results = new Map();
        let completedTests = 0;
        
        try {
            for (const testId of testIds) {
                if (!this.isRunning) {
                    console.log('Test suite stopped by user');
                    break;
                }
                
                try {
                    const result = await this.runTest(testId);
                    results.set(testId, result);
                    completedTests++;
                    
                    // Emit progress update
                    this.emit('testProgress', {
                        completed: completedTests,
                        total: testIds.length,
                        percentage: Math.round((completedTests / testIds.length) * 100),
                        currentTest: testId
                    });
                    
                    // Delay between tests
                    if (completedTests < testIds.length && this.config.delayBetweenTests > 0) {
                        await this.delay(this.config.delayBetweenTests);
                    }
                    
                } catch (error) {
                    console.error(`Failed to run test '${testId}':`, error);
                    results.set(testId, {
                        status: this.statuses.ERROR,
                        errors: [error.message],
                        startTime: new Date(),
                        endTime: new Date(),
                        duration: 0
                    });
                }
            }
            
        } finally {
            this.isRunning = false;
            this.endTime = new Date();
            
            const summary = this.generateTestSummary(results);
            console.log('Test suite completed:', summary);
            
            this.emit('testSuiteCompleted', {
                results,
                summary,
                startTime: this.startTime,
                endTime: this.endTime,
                duration: this.endTime - this.startTime
            });
        }
        
        return results;
    }
    
    /**
     * Run all enabled tests
     * @returns {Promise<Map>} - Map of test results
     */
    async runAllTests() {
        const enabledTests = Array.from(this.tests.values())
            .filter(test => test.enabled)
            .map(test => test.id);
        
        return await this.runTests(enabledTests);
    }
    
    /**
     * Stop running tests
     */
    stopTests() {
        if (this.isRunning) {
            console.log('Stopping test suite...');
            this.isRunning = false;
            this.emit('testSuiteStopped');
        }
    }
    
    /**
     * Execute test with timeout
     * @param {Object} test - Test object
     * @returns {Promise<Object>} - Test result
     */
    async executeTestWithTimeout(test) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Test '${test.id}' timed out after ${test.timeout}ms`));
            }, test.timeout);
            
            test.execute(this.config)
                .then(result => {
                    clearTimeout(timeout);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timeout);
                    reject(error);
                });
        });
    }
    
    /**
     * Check test dependencies
     * @param {Object} test - Test object
     * @returns {Promise<void>}
     */
    async checkTestDependencies(test) {
        if (!test.dependencies || test.dependencies.length === 0) {
            return;
        }
        
        for (const depId of test.dependencies) {
            const depResult = this.testResults.get(depId);
            if (!depResult || depResult.status !== this.statuses.PASSED) {
                throw new Error(`Test '${test.id}' depends on '${depId}' which has not passed`);
            }
        }
    }
    
    /**
     * Update test result
     * @param {string} testId - Test ID
     * @param {Object} updates - Updates to apply
     */
    updateTestResult(testId, updates) {
        const current = this.testResults.get(testId) || {};
        const updated = { ...current, ...updates };
        this.testResults.set(testId, updated);
        
        this.emit('testResultUpdated', { testId, result: updated });
    }
    
    /**
     * Generate test summary
     * @param {Map} results - Test results
     * @returns {Object} - Summary object
     */
    generateTestSummary(results) {
        const summary = {
            total: results.size,
            passed: 0,
            failed: 0,
            errors: 0,
            warnings: 0,
            skipped: 0,
            duration: 0,
            vulnerabilities: {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0,
                info: 0
            }
        };
        
        for (const [, result] of results) {
            switch (result.status) {
                case this.statuses.PASSED:
                    summary.passed++;
                    break;
                case this.statuses.FAILED:
                    summary.failed++;
                    break;
                case this.statuses.ERROR:
                    summary.errors++;
                    break;
                case this.statuses.WARNING:
                    summary.warnings++;
                    break;
                case this.statuses.SKIPPED:
                    summary.skipped++;
                    break;
            }
            
            summary.duration += result.duration || 0;
            
            // Count vulnerabilities by severity
            if (result.findings) {
                for (const finding of result.findings) {
                    if (finding.severity && summary.vulnerabilities[finding.severity] !== undefined) {
                        summary.vulnerabilities[finding.severity]++;
                    }
                }
            }
        }
        
        return summary;
    }
    
    /**
     * Clear all test results
     */
    clearResults() {
        for (const testId of this.tests.keys()) {
            this.testResults.set(testId, {
                status: this.statuses.PENDING,
                startTime: null,
                endTime: null,
                duration: 0,
                findings: [],
                errors: [],
                metadata: {}
            });
        }
        
        this.emit('resultsCleared');
        console.log('Test results cleared');
    }
    
    /**
     * Register event handler
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    on(event, handler) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(handler);
    }
    
    /**
     * Remove event handler
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    off(event, handler) {
        const handlers = this.eventListeners.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }
    
    /**
     * Emit event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        const handlers = this.eventListeners.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for '${event}':`, error);
                }
            });
        }
    }
    
    /**
     * Register default event handlers
     */
    registerEventHandlers() {
        // Default progress handler
        this.on('testProgress', (data) => {
            console.log(`Test progress: ${data.completed}/${data.total} (${data.percentage}%)`);
        });
        
        // Default error handler
        this.on('testError', (data) => {
            console.error(`Test '${data.testId}' error:`, data.error);
        });
    }
    
    /**
     * Utility function to create delay
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Get framework statistics
     * @returns {Object} - Framework statistics
     */
    getStatistics() {
        return {
            totalTests: this.tests.size,
            enabledTests: Array.from(this.tests.values()).filter(t => t.enabled).length,
            disabledTests: Array.from(this.tests.values()).filter(t => !t.enabled).length,
            categories: {
                supabase: this.getTests(this.categories.SUPABASE).length,
                postgresql: this.getTests(this.categories.POSTGRESQL).length
            },
            isRunning: this.isRunning,
            currentTest: this.currentTest,
            lastRunTime: this.endTime
        };
    }
    
    /**
     * Export test results
     * @param {string} format - Export format (json, csv)
     * @returns {string} - Exported data
     */
    exportResults(format = 'json') {
        const results = Array.from(this.testResults.entries()).map(([id, result]) => ({
            testId: id,
            testName: this.tests.get(id)?.name || id,
            ...result
        }));
        
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(results, null, 2);
            case 'csv':
                return this.convertToCSV(results);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }
    
    /**
     * Convert results to CSV format
     * @param {Array} results - Test results array
     * @returns {string} - CSV string
     */
    convertToCSV(results) {
        if (results.length === 0) return '';
        
        const headers = ['testId', 'testName', 'status', 'duration', 'findings', 'errors'];
        const csvRows = [headers.join(',')];
        
        for (const result of results) {
            const row = [
                result.testId,
                result.testName,
                result.status,
                result.duration || 0,
                result.findings?.length || 0,
                result.errors?.length || 0
            ];
            csvRows.push(row.join(','));
        }
        
        return csvRows.join('\n');
    }
}

// Create global instance
const testingFramework = new SecurityTestingFramework();

// Testing framework is available globally in browser environment