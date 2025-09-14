/**
 * Main Application Controller for Supabase Security Testing Suite
 * Coordinates all components and handles user interface interactions
 */

class SupabaseSecurityApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.isConfigured = false;
        this.isTestingInProgress = false;
        this.testResults = new Map();
        this.currentConfig = null;
        
        // UI Elements
        this.elements = {
            // Navigation
            navButtons: null,
            sections: null,
            
            // Configuration
            configForm: null,
            supabaseUrlInput: null,
            apiKeyInput: null,
            testEmailInput: null,
            testPasswordInput: null,
            authorizationCheckbox: null,
            
            // Status
            connectionStatus: null,
            testsCount: null,
            lastScan: null,
            vulnCount: null,
            
            // Testing
            runAllTestsBtn: null,
            testButtons: null,
            testProgress: null,
            progressBar: null,
            progressText: null,
            currentTestInfo: null,
            
            // Reports
            reportContent: null,
            exportHtmlBtn: null,
            exportPdfBtn: null
        };
        
        this.init();
    }
    
    /**
     * Initialize the application
     */
    init() {
        console.log('Initializing Supabase Security Testing Suite...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
            this.initializeApp();
        }
    }
    
    /**
     * Initialize application after DOM is ready
     */
    initializeApp() {
        try {
            this.initializeElements();
            this.setupEventListeners();
            this.setupTestingFramework();
            this.loadStoredConfiguration();
            this.updateUI();
            
            console.log('Application initialized successfully');
            UIUtils.showNotification('Application loaded successfully', 'success', 3000);
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            UIUtils.showNotification('Failed to initialize application', 'error');
        }
    }
    
    /**
     * Initialize DOM elements
     */
    initializeElements() {
        // Navigation elements
        this.elements.navButtons = Utils.querySelectorAll('.nav-btn');
        this.elements.sections = Utils.querySelectorAll('.section');
        
        // Configuration elements
        this.elements.configForm = Utils.getElementById('config-form');
        this.elements.supabaseUrlInput = Utils.getElementById('supabase-url');
        this.elements.apiKeyInput = Utils.getElementById('api-key');
        this.elements.testEmailInput = Utils.getElementById('test-email');
        this.elements.testPasswordInput = Utils.getElementById('test-password');
        this.elements.authorizationCheckbox = Utils.getElementById('authorization-checkbox');
        
        // Status elements
        this.elements.connectionStatus = Utils.getElementById('connection-status');
        this.elements.testsCount = Utils.getElementById('tests-count');
        this.elements.lastScan = Utils.getElementById('last-scan');
        this.elements.vulnCount = Utils.getElementById('vuln-count');
        
        // Testing elements
        this.elements.runAllTestsBtn = Utils.getElementById('run-all-tests');
        this.elements.testButtons = Utils.querySelectorAll('.test-btn');
        this.elements.testProgress = Utils.getElementById('test-progress');
        this.elements.progressBar = Utils.getElementById('progress-bar');
        this.elements.progressText = Utils.getElementById('progress-text');
        this.elements.currentTestInfo = Utils.getElementById('current-test');
        
        // Report elements
        this.elements.reportContent = Utils.getElementById('report-content');
        this.elements.exportHtmlBtn = Utils.getElementById('export-html');
        this.elements.exportPdfBtn = Utils.getElementById('export-pdf');
        
        console.log('DOM elements initialized');
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Navigation
        this.elements.navButtons.forEach(btn => {
            Utils.addEventListener(btn, 'click', (e) => this.handleNavigation(e));
        });
        
        // Configuration form
        if (this.elements.configForm) {
            Utils.addEventListener(this.elements.configForm, 'submit', (e) => this.handleConfigSubmit(e));
        }
        
        // Test buttons
        if (this.elements.runAllTestsBtn) {
            Utils.addEventListener(this.elements.runAllTestsBtn, 'click', () => this.runAllTests());
        }
        
        this.elements.testButtons.forEach(btn => {
            Utils.addEventListener(btn, 'click', (e) => this.handleTestButtonClick(e));
        });
        
        // Export buttons
        if (this.elements.exportHtmlBtn) {
            Utils.addEventListener(this.elements.exportHtmlBtn, 'click', () => this.exportReport('html'));
        }
        
        if (this.elements.exportPdfBtn) {
            Utils.addEventListener(this.elements.exportPdfBtn, 'click', () => this.exportReport('pdf'));
        }
        
        // Window events
        Utils.addEventListener(window, 'beforeunload', (e) => this.handleBeforeUnload(e));
        
        console.log('Event listeners setup complete');
    }
    
    /**
     * Setup testing framework event handlers
     */
    setupTestingFramework() {
        // Configuration events
        testingFramework.on('configurationSet', (config) => {
            this.isConfigured = true;
            this.currentConfig = config;
            this.updateConnectionStatus('connected');
            this.updateUI();
        });
        
        // Test progress events
        testingFramework.on('testSuiteStarted', (data) => {
            this.isTestingInProgress = true;
            this.showTestProgress();
            this.updateUI();
            UIUtils.showNotification(`Starting ${data.testIds.length} security tests...`, 'info');
        });
        
        testingFramework.on('testProgress', (data) => {
            this.updateTestProgress(data);
        });
        
        testingFramework.on('testStarted', (data) => {
            this.updateCurrentTestInfo(data.test.name);
            this.updateTestButtonStatus(data.testId, 'running');
        });
        
        testingFramework.on('testCompleted', (data) => {
            this.updateTestButtonStatus(data.testId, data.result.status);
            this.displayTestResult(data.testId, data.result);
        });
        
        testingFramework.on('testSuiteCompleted', (data) => {
            this.isTestingInProgress = false;
            this.testResults = data.results;
            this.hideTestProgress();
            this.updateUI();
            this.generateReport(data);
            
            const summary = data.summary;
            const message = `Tests completed: ${summary.passed} passed, ${summary.failed} failed, ${summary.errors} errors`;
            UIUtils.showNotification(message, summary.failed > 0 || summary.errors > 0 ? 'warning' : 'success');
            
            // Update last scan time
            if (this.elements.lastScan) {
                this.elements.lastScan.textContent = DateUtils.formatDate(new Date());
            }
            
            // Update vulnerability count
            const totalVulns = Object.values(summary.vulnerabilities).reduce((a, b) => a + b, 0);
            if (this.elements.vulnCount) {
                this.elements.vulnCount.textContent = totalVulns;
                this.elements.vulnCount.className = totalVulns > 0 ? 'text-red-600' : 'text-green-600';
            }
        });
        
        testingFramework.on('testError', (data) => {
            console.error(`Test error in ${data.testId}:`, data.error);
            this.updateTestButtonStatus(data.testId, 'error');
            UIUtils.showNotification(`Test ${data.testId} failed: ${data.error.message}`, 'error');
        });
        
        console.log('Testing framework event handlers setup complete');
    }
    
    /**
     * Handle navigation between sections
     * @param {Event} e - Click event
     */
    handleNavigation(e) {
        e.preventDefault();
        const targetSection = e.target.dataset.section;
        
        if (targetSection && targetSection !== this.currentSection) {
            this.switchSection(targetSection);
        }
    }
    
    /**
     * Switch to a different section
     * @param {string} sectionId - Section identifier
     */
    switchSection(sectionId) {
        // Update navigation buttons
        this.elements.navButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.section === sectionId) {
                btn.classList.add('active');
            }
        });
        
        // Update sections
        this.elements.sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === sectionId) {
                section.classList.add('active');
            }
        });
        
        this.currentSection = sectionId;
        console.log(`Switched to section: ${sectionId}`);
    }
    
    /**
     * Handle configuration form submission
     * @param {Event} e - Submit event
     */
    async handleConfigSubmit(e) {
        e.preventDefault();
        
        try {
            // Clear previous errors
            ValidationUtils.clearErrors();
            
            // Get form data
            const formData = new FormData(this.elements.configForm);
            const config = {
                supabaseUrl: formData.get('supabase-url'),
                apiKey: formData.get('api-key'),
                testEmail: formData.get('test-email') || null,
                testPassword: formData.get('test-password') || null,
                authorization: formData.get('authorization') === 'on'
            };
            
            // Validate configuration
            const validation = this.validateConfiguration(config);
            if (!validation.isValid) {
                ValidationUtils.displayErrors(validation.errors);
                return;
            }
            
            // Show loading state
            const submitBtn = this.elements.configForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            UIUtils.showLoading(submitBtn);
            
            try {
                // Test connection
                await this.testConnection(config);
                
                // Set configuration in testing framework
                testingFramework.setConfiguration(config);
                
                // Store configuration (without sensitive data)
                this.storeConfiguration(config);
                
                UIUtils.showNotification('Configuration validated successfully', 'success');
                
            } catch (error) {
                console.error('Configuration validation failed:', error);
                UIUtils.showNotification(`Configuration failed: ${error.message}`, 'error');
                this.updateConnectionStatus('error');
            } finally {
                UIUtils.hideLoading(submitBtn, originalText);
            }
            
        } catch (error) {
            console.error('Configuration submission failed:', error);
            UIUtils.showNotification('Configuration submission failed', 'error');
        }
    }
    
    /**
     * Validate configuration data
     * @param {Object} config - Configuration object
     * @returns {Object} - Validation result
     */
    validateConfiguration(config) {
        const rules = {
            'supabase-url': {
                required: true,
                type: 'url'
            },
            'api-key': {
                required: true,
                type: 'jwt',
                minLength: 100
            },
            'test-email': {
                type: 'email'
            },
            authorization: {
                required: true
            }
        };
        
        const data = {
            'supabase-url': config.supabaseUrl,
            'api-key': config.apiKey,
            'test-email': config.testEmail,
            authorization: config.authorization
        };
        
        const result = ValidationUtils.validateForm(data, rules);
        
        // Additional custom validations
        if (config.supabaseUrl && !config.supabaseUrl.includes('supabase.co')) {
            result.isValid = false;
            result.errors['supabase-url'] = 'URL should be a valid Supabase project URL';
        }
        
        if (!config.authorization) {
            result.isValid = false;
            result.errors.authorization = 'You must confirm authorization to test this system';
        }
        
        return result;
    }
    
    /**
     * Test connection to Supabase
     * @param {Object} config - Configuration object
     * @returns {Promise<void>}
     */
    async testConnection(config) {
        const testUrl = `${config.supabaseUrl}/rest/v1/`;
        
        const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
                'apikey': config.apiKey,
                'Authorization': `Bearer ${config.apiKey}`
            }
        });
        
        if (!response.ok && response.status !== 401) {
            throw new Error(`Connection test failed: HTTP ${response.status}`);
        }
        
        console.log('Connection test successful');
    }
    
    /**
     * Handle individual test button clicks
     * @param {Event} e - Click event
     */
    async handleTestButtonClick(e) {
        e.preventDefault();
        
        if (!this.isConfigured) {
            UIUtils.showNotification('Please configure the target first', 'warning');
            this.switchSection('dashboard');
            return;
        }
        
        if (this.isTestingInProgress) {
            UIUtils.showNotification('Tests are already running', 'warning');
            return;
        }
        
        const testItem = e.target.closest('.test-item');
        if (!testItem) return;
        
        const testId = testItem.dataset.test;
        if (!testId) return;
        
        try {
            UIUtils.showNotification(`Running test: ${testId}`, 'info');
            const result = await testingFramework.runTest(testId);
            console.log(`Test ${testId} completed:`, result);
            
        } catch (error) {
            console.error(`Failed to run test ${testId}:`, error);
            UIUtils.showNotification(`Test failed: ${error.message}`, 'error');
        }
    }
    
    /**
     * Run all security tests
     */
    async runAllTests() {
        if (!this.isConfigured) {
            UIUtils.showNotification('Please configure the target first', 'warning');
            this.switchSection('dashboard');
            return;
        }
        
        if (this.isTestingInProgress) {
            UIUtils.showNotification('Tests are already running', 'warning');
            return;
        }
        
        try {
            console.log('Starting all security tests...');
            const results = await testingFramework.runAllTests();
            console.log('All tests completed:', results);
            
        } catch (error) {
            console.error('Failed to run tests:', error);
            UIUtils.showNotification(`Tests failed: ${error.message}`, 'error');
        }
    }
    
    /**
     * Update test progress display
     * @param {Object} data - Progress data
     */
    updateTestProgress(data) {
        if (this.elements.progressBar) {
            UIUtils.updateProgressBar(this.elements.progressBar, data.percentage);
        }
        
        if (this.elements.progressText) {
            this.elements.progressText.textContent = `${data.completed}/${data.total} tests completed`;
        }
    }
    
    /**
     * Update current test information
     * @param {string} testName - Current test name
     */
    updateCurrentTestInfo(testName) {
        if (this.elements.currentTestInfo) {
            this.elements.currentTestInfo.innerHTML = `
                <div class="flex items-center">
                    <div class="spinner mr-2"></div>
                    <span>Running: ${testName}</span>
                </div>
            `;
        }
    }
    
    /**
     * Update test button status
     * @param {string} testId - Test ID
     * @param {string} status - Test status
     */
    updateTestButtonStatus(testId, status) {
        const testItem = Utils.querySelector(`[data-test="${testId}"]`);
        if (!testItem) return;
        
        const button = testItem.querySelector('.test-btn');
        if (!button) return;
        
        // Remove existing status classes
        button.classList.remove('running', 'passed', 'failed', 'error', 'warning');
        
        // Add new status class
        button.classList.add(status);
        
        // Update button text
        const statusText = {
            running: 'Running...',
            passed: 'Passed',
            failed: 'Failed',
            error: 'Error',
            warning: 'Warning',
            skipped: 'Skipped'
        };
        
        button.textContent = statusText[status] || 'Run Test';
        
        // Update test item class
        testItem.classList.remove('running', 'passed', 'failed', 'warning');
        testItem.classList.add(status);
    }
    
    /**
     * Display test result in UI
     * @param {string} testId - Test ID
     * @param {Object} result - Test result
     */
    displayTestResult(testId, result) {
        const testItem = Utils.querySelector(`[data-test="${testId}"]`);
        if (!testItem) return;
        
        // Remove existing result display
        const existingResult = testItem.querySelector('.test-result');
        if (existingResult) {
            existingResult.remove();
        }
        
        // Create result display
        const resultDiv = document.createElement('div');
        resultDiv.className = `test-result ${this.getResultClass(result)}`;
        
        let resultContent = '';
        
        if (result.findings && result.findings.length > 0) {
            resultContent += `<div class="result-title">Findings (${result.findings.length}):</div>`;
            result.findings.forEach(finding => {
                resultContent += `<div class="result-details">• ${finding.type}: ${finding.description}</div>`;
            });
        }
        
        if (result.errors && result.errors.length > 0) {
            resultContent += `<div class="result-title">Errors:</div>`;
            result.errors.forEach(error => {
                resultContent += `<div class="result-details">• ${error}</div>`;
            });
        }
        
        if (!resultContent) {
            resultContent = '<div class="result-title">Test completed successfully</div>';
        }
        
        resultDiv.innerHTML = resultContent;
        testItem.appendChild(resultDiv);
    }
    
    /**
     * Get CSS class for test result
     * @param {Object} result - Test result
     * @returns {string} - CSS class
     */
    getResultClass(result) {
        switch (result.status) {
            case 'passed': return 'success';
            case 'failed': return 'error';
            case 'warning': return 'warning';
            case 'error': return 'error';
            default: return 'info';
        }
    }
    
    /**
     * Show test progress section
     */
    showTestProgress() {
        if (this.elements.testProgress) {
            this.elements.testProgress.classList.remove('hidden');
        }
    }
    
    /**
     * Hide test progress section
     */
    hideTestProgress() {
        if (this.elements.testProgress) {
            this.elements.testProgress.classList.add('hidden');
        }
        
        if (this.elements.currentTestInfo) {
            this.elements.currentTestInfo.textContent = '';
        }
    }
    
    /**
     * Generate security report
     * @param {Object} data - Test suite completion data
     */
    generateReport(data) {
        try {
            console.log('Generating security report...');
            
            const report = reportGenerator.generateReport(
                data.results,
                this.currentConfig,
                data.summary
            );
            
            this.displayReport(report);
            this.enableExportButtons();
            
            console.log('Security report generated successfully');
            
        } catch (error) {
            console.error('Failed to generate report:', error);
            UIUtils.showNotification('Failed to generate report', 'error');
        }
    }
    
    /**
     * Display report in UI
     * @param {Object} report - Generated report
     */
    displayReport(report) {
        if (!this.elements.reportContent) return;
        
        const reportHtml = `
            <div class="report-summary">
                <h3 class="text-lg font-semibold mb-4">Security Assessment Summary</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div class="text-center p-4 bg-gray-50 rounded">
                        <div class="text-2xl font-bold text-gray-900">${report.executiveSummary.totalVulnerabilities}</div>
                        <div class="text-sm text-gray-600">Total Issues</div>
                    </div>
                    <div class="text-center p-4 bg-red-50 rounded">
                        <div class="text-2xl font-bold text-red-600">${report.executiveSummary.criticalIssues}</div>
                        <div class="text-sm text-gray-600">Critical</div>
                    </div>
                    <div class="text-center p-4 bg-orange-50 rounded">
                        <div class="text-2xl font-bold text-orange-600">${report.executiveSummary.highIssues}</div>
                        <div class="text-sm text-gray-600">High</div>
                    </div>
                    <div class="text-center p-4 bg-green-50 rounded">
                        <div class="text-2xl font-bold text-green-600">${report.executiveSummary.testsPassed}</div>
                        <div class="text-sm text-gray-600">Passed</div>
                    </div>
                </div>
                <div class="mb-6">
                    <h4 class="font-semibold mb-2">Overall Risk Level</h4>
                    <span class="px-3 py-1 rounded-full text-sm font-medium risk-${report.executiveSummary.overallRiskLevel.toLowerCase()}">
                        ${report.executiveSummary.overallRiskLevel}
                    </span>
                </div>
            </div>
            
            <div class="vulnerabilities-section">
                <h3 class="text-lg font-semibold mb-4">Key Vulnerabilities</h3>
                ${report.vulnerabilities.slice(0, 5).map(vuln => `
                    <div class="vulnerability-item mb-4 p-4 border rounded">
                        <div class="flex justify-between items-start mb-2">
                            <h4 class="font-medium">${vuln.title}</h4>
                            <span class="severity-badge ${vuln.severity}">${vuln.severity.toUpperCase()}</span>
                        </div>
                        <p class="text-sm text-gray-600 mb-2">${vuln.description}</p>
                        <div class="text-xs text-gray-500">
                            <strong>Evidence:</strong> ${StringUtils.truncate(vuln.evidence, 100)}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="recommendations-section mt-6">
                <h3 class="text-lg font-semibold mb-4">Top Recommendations</h3>
                ${report.recommendations.slice(0, 3).map((rec, index) => `
                    <div class="recommendation-item mb-3 p-3 border-l-4 border-blue-500 bg-blue-50">
                        <h4 class="font-medium">${index + 1}. ${rec.title}</h4>
                        <p class="text-sm text-gray-600">${rec.description}</p>
                    </div>
                `).join('')}
            </div>
        `;
        
        this.elements.reportContent.innerHTML = reportHtml;
    }
    
    /**
     * Enable export buttons
     */
    enableExportButtons() {
        if (this.elements.exportHtmlBtn) {
            this.elements.exportHtmlBtn.disabled = false;
        }
        
        if (this.elements.exportPdfBtn) {
            this.elements.exportPdfBtn.disabled = false;
        }
    }
    
    /**
     * Export report in specified format
     * @param {string} format - Export format
     */
    async exportReport(format) {
        try {
            console.log(`Exporting report as ${format}...`);
            
            const exportData = await reportGenerator.exportReport(format);
            
            // Create download
            const filename = `supabase-security-report-${DateUtils.getCurrentTimestamp().split('T')[0]}.${format}`;
            this.downloadFile(exportData, filename, format);
            
            UIUtils.showNotification(`Report exported as ${format.toUpperCase()}`, 'success');
            
        } catch (error) {
            console.error(`Failed to export report as ${format}:`, error);
            UIUtils.showNotification(`Export failed: ${error.message}`, 'error');
        }
    }
    
    /**
     * Download file
     * @param {string|Blob} data - File data
     * @param {string} filename - File name
     * @param {string} format - File format
     */
    downloadFile(data, filename, format) {
        let blob;
        
        if (data instanceof Blob) {
            blob = data;
        } else {
            const mimeTypes = {
                html: 'text/html',
                json: 'application/json',
                csv: 'text/csv',
                pdf: 'application/pdf'
            };
            
            blob = new Blob([data], { type: mimeTypes[format] || 'text/plain' });
        }
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Update connection status display
     * @param {string} status - Connection status
     */
    updateConnectionStatus(status) {
        if (!this.elements.connectionStatus) return;
        
        const statusIndicator = this.elements.connectionStatus.querySelector('.status-indicator') || 
                               this.elements.connectionStatus.querySelector('div');
        const statusText = this.elements.connectionStatus.querySelector('span');
        
        if (statusIndicator) {
            statusIndicator.className = `w-3 h-3 rounded-full mr-3 status-indicator ${status}`;
        }
        
        if (statusText) {
            const statusTexts = {
                connected: 'Connected',
                disconnected: 'Not Connected',
                error: 'Connection Error',
                testing: 'Testing Connection...'
            };
            statusText.textContent = statusTexts[status] || 'Unknown';
        }
    }
    
    /**
     * Update UI based on current state
     */
    updateUI() {
        // Update run tests button
        if (this.elements.runAllTestsBtn) {
            this.elements.runAllTestsBtn.disabled = !this.isConfigured || this.isTestingInProgress;
        }
        
        // Update individual test buttons
        this.elements.testButtons.forEach(btn => {
            btn.disabled = !this.isConfigured || this.isTestingInProgress;
        });
        
        // Update tests count
        if (this.elements.testsCount) {
            const stats = testingFramework.getStatistics();
            this.elements.testsCount.textContent = stats.enabledTests;
        }
    }
    
    /**
     * Store configuration (without sensitive data)
     * @param {Object} config - Configuration object
     */
    storeConfiguration(config) {
        const safeConfig = {
            supabaseUrl: config.supabaseUrl,
            testEmail: config.testEmail,
            hasApiKey: !!config.apiKey,
            timestamp: DateUtils.getCurrentTimestamp()
        };
        
        StorageUtils.setItem('supabase-security-config', safeConfig);
    }
    
    /**
     * Load stored configuration
     */
    loadStoredConfiguration() {
        const storedConfig = StorageUtils.getItem('supabase-security-config');
        
        if (storedConfig && storedConfig.supabaseUrl) {
            if (this.elements.supabaseUrlInput) {
                this.elements.supabaseUrlInput.value = storedConfig.supabaseUrl;
            }
            
            if (this.elements.testEmailInput && storedConfig.testEmail) {
                this.elements.testEmailInput.value = storedConfig.testEmail;
            }
            
            console.log('Stored configuration loaded');
        }
    }
    
    /**
     * Handle before unload event
     * @param {Event} e - Before unload event
     */
    handleBeforeUnload(e) {
        if (this.isTestingInProgress) {
            e.preventDefault();
            e.returnValue = 'Tests are currently running. Are you sure you want to leave?';
            return e.returnValue;
        }
    }
}

// Initialize application when script loads
const app = new SupabaseSecurityApp();

// Export for debugging
if (typeof window !== 'undefined') {
    window.SupabaseSecurityApp = app;
}

console.log('Supabase Security Testing Suite loaded successfully');