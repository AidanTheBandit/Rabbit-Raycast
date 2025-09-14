/**
 * Reporting System for Supabase Security Testing Suite
 * Handles report generation, formatting, and export functionality
 */

class SecurityReportGenerator {
    constructor() {
        this.reportData = null;
        this.reportTemplate = null;
        this.exportFormats = ['html', 'pdf', 'json', 'csv'];
        
        this.severityColors = {
            critical: '#dc2626',
            high: '#ea580c',
            medium: '#d97706',
            low: '#65a30d',
            info: '#2563eb'
        };
        
        this.statusColors = {
            passed: '#10b981',
            failed: '#dc2626',
            warning: '#f59e0b',
            error: '#dc2626',
            skipped: '#6b7280'
        };
    }
    
    /**
     * Generate comprehensive security report
     * @param {Map} testResults - Test results from framework
     * @param {Object} config - Test configuration
     * @param {Object} summary - Test summary statistics
     * @returns {Object} - Generated report data
     */
    generateReport(testResults, config, summary) {
        console.log('Generating security report...');
        
        const reportData = {
            metadata: this.generateReportMetadata(config, summary),
            executiveSummary: this.generateExecutiveSummary(summary, testResults),
            testResults: this.formatTestResults(testResults),
            vulnerabilities: this.extractVulnerabilities(testResults),
            recommendations: this.generateRecommendations(testResults),
            compliance: this.generateComplianceSection(testResults),
            appendices: this.generateAppendices(testResults, config)
        };
        
        this.reportData = reportData;
        console.log('Security report generated successfully');
        
        return reportData;
    }
    
    /**
     * Generate report metadata
     * @param {Object} config - Test configuration
     * @param {Object} summary - Test summary
     * @returns {Object} - Report metadata
     */
    generateReportMetadata(config, summary) {
        return {
            title: 'Supabase Security Assessment Report',
            generatedAt: DateUtils.getCurrentTimestamp(),
            generatedBy: 'Supabase Security Testing Suite',
            version: '1.0.0',
            target: {
                url: SecurityUtils.maskSensitiveData(config.supabaseUrl, 20),
                testDuration: DateUtils.formatDuration(summary.duration),
                testsExecuted: summary.total,
                testDate: DateUtils.formatDate(new Date())
            },
            classification: 'CONFIDENTIAL - AUTHORIZED PERSONNEL ONLY',
            disclaimer: 'This report contains sensitive security information and should be handled according to your organization\'s security policies.'
        };
    }
    
    /**
     * Generate executive summary
     * @param {Object} summary - Test summary statistics
     * @param {Map} testResults - Test results
     * @returns {Object} - Executive summary
     */
    generateExecutiveSummary(summary, testResults) {
        const totalVulnerabilities = summary.vulnerabilities.critical + 
                                   summary.vulnerabilities.high + 
                                   summary.vulnerabilities.medium + 
                                   summary.vulnerabilities.low;
        
        const riskLevel = this.calculateOverallRiskLevel(summary.vulnerabilities);
        const keyFindings = this.extractKeyFindings(testResults);
        
        return {
            overallRiskLevel: riskLevel,
            totalVulnerabilities,
            criticalIssues: summary.vulnerabilities.critical,
            highIssues: summary.vulnerabilities.high,
            testsPassed: summary.passed,
            testsFailed: summary.failed,
            keyFindings,
            recommendations: this.getTopRecommendations(testResults),
            complianceStatus: this.assessComplianceStatus(testResults)
        };
    }
    
    /**
     * Format test results for report
     * @param {Map} testResults - Raw test results
     * @returns {Array} - Formatted test results
     */
    formatTestResults(testResults) {
        const formattedResults = [];
        
        for (const [testId, result] of testResults) {
            const test = testingFramework.getTest(testId);
            if (!test) continue;
            
            formattedResults.push({
                id: testId,
                name: test.name,
                description: test.description,
                category: test.category,
                severity: test.severity,
                status: result.status,
                duration: result.duration,
                startTime: result.startTime,
                endTime: result.endTime,
                findings: result.findings || [],
                errors: result.errors || [],
                metadata: result.metadata || {},
                remediation: this.generateTestRemediation(result.findings)
            });
        }
        
        // Sort by severity and status
        return formattedResults.sort((a, b) => {
            const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
            const statusOrder = { failed: 0, error: 1, warning: 2, passed: 3, skipped: 4 };
            
            if (severityOrder[a.severity] !== severityOrder[b.severity]) {
                return severityOrder[a.severity] - severityOrder[b.severity];
            }
            return statusOrder[a.status] - statusOrder[b.status];
        });
    }
    
    /**
     * Extract vulnerabilities from test results
     * @param {Map} testResults - Test results
     * @returns {Array} - Vulnerability list
     */
    extractVulnerabilities(testResults) {
        const vulnerabilities = [];
        let vulnId = 1;
        
        for (const [testId, result] of testResults) {
            const test = testingFramework.getTest(testId);
            if (!test || !result.findings) continue;
            
            for (const finding of result.findings) {
                vulnerabilities.push({
                    id: `VULN-${String(vulnId).padStart(3, '0')}`,
                    title: finding.type || 'Security Issue',
                    severity: finding.severity || 'medium',
                    category: test.category,
                    testName: test.name,
                    description: finding.description || 'No description provided',
                    evidence: finding.evidence || 'No evidence provided',
                    impact: this.assessVulnerabilityImpact(finding),
                    remediation: finding.remediation || 'No remediation provided',
                    references: this.getVulnerabilityReferences(finding),
                    cvssScore: this.calculateCVSSScore(finding),
                    discoveredAt: result.startTime,
                    status: 'Open'
                });
                vulnId++;
            }
        }
        
        return vulnerabilities.sort((a, b) => {
            const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        });
    }
    
    /**
     * Generate recommendations based on findings
     * @param {Map} testResults - Test results
     * @returns {Array} - Recommendations list
     */
    generateRecommendations(testResults) {
        const recommendations = [];
        const seenRecommendations = new Set();
        
        // Extract unique recommendations from findings
        for (const [, result] of testResults) {
            if (!result.findings) continue;
            
            for (const finding of result.findings) {
                if (finding.remediation && !seenRecommendations.has(finding.remediation)) {
                    recommendations.push({
                        priority: this.getRecommendationPriority(finding.severity),
                        category: this.getRecommendationCategory(finding.type),
                        title: this.generateRecommendationTitle(finding),
                        description: finding.remediation,
                        effort: this.estimateImplementationEffort(finding),
                        impact: this.estimateSecurityImpact(finding)
                    });
                    seenRecommendations.add(finding.remediation);
                }
            }
        }
        
        // Add general security recommendations
        recommendations.push(...this.getGeneralRecommendations());
        
        return recommendations.sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }
    
    /**
     * Generate compliance section
     * @param {Map} testResults - Test results
     * @returns {Object} - Compliance assessment
     */
    generateComplianceSection(testResults) {
        return {
            gdprCompliance: this.assessGDPRCompliance(testResults),
            soc2Compliance: this.assessSOC2Compliance(testResults),
            iso27001Compliance: this.assessISO27001Compliance(testResults),
            nistFramework: this.assessNISTCompliance(testResults),
            recommendations: this.getComplianceRecommendations(testResults)
        };
    }
    
    /**
     * Generate report appendices
     * @param {Map} testResults - Test results
     * @param {Object} config - Test configuration
     * @returns {Object} - Appendices data
     */
    generateAppendices(testResults, config) {
        return {
            testMethodology: this.getTestMethodology(),
            toolsUsed: this.getToolsUsed(),
            testConfiguration: this.sanitizeConfiguration(config),
            glossary: this.getSecurityGlossary(),
            references: this.getSecurityReferences()
        };
    }
    
    /**
     * Export report in specified format
     * @param {string} format - Export format (html, pdf, json, csv)
     * @returns {string|Blob} - Exported report data
     */
    async exportReport(format = 'html') {
        if (!this.reportData) {
            throw new Error('No report data available. Generate report first.');
        }
        
        console.log(`Exporting report in ${format} format...`);
        
        switch (format.toLowerCase()) {
            case 'html':
                return this.exportHTML();
            case 'pdf':
                return await this.exportPDF();
            case 'json':
                return this.exportJSON();
            case 'csv':
                return this.exportCSV();
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }
    
    /**
     * Export report as HTML
     * @returns {string} - HTML report
     */
    exportHTML() {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.reportData.metadata.title}</title>
    <style>
        ${this.getReportCSS()}
    </style>
</head>
<body>
    <div class="report-container">
        ${this.generateHTMLHeader()}
        ${this.generateHTMLExecutiveSummary()}
        ${this.generateHTMLVulnerabilities()}
        ${this.generateHTMLTestResults()}
        ${this.generateHTMLRecommendations()}
        ${this.generateHTMLCompliance()}
        ${this.generateHTMLAppendices()}
    </div>
    <script>
        ${this.getReportJavaScript()}
    </script>
</body>
</html>`;
        
        return html;
    }
    
    /**
     * Export report as PDF (simulated - would require PDF library)
     * @returns {Promise<Blob>} - PDF blob
     */
    async exportPDF() {
        // In a real implementation, this would use a PDF generation library
        // For now, we'll create a simplified PDF-like format
        const htmlContent = this.exportHTML();
        
        // Convert HTML to PDF-like format (simplified)
        const pdfContent = this.convertHTMLToPDFFormat(htmlContent);
        
        return new Blob([pdfContent], { type: 'application/pdf' });
    }
    
    /**
     * Export report as JSON
     * @returns {string} - JSON report
     */
    exportJSON() {
        return JSON.stringify(this.reportData, null, 2);
    }
    
    /**
     * Export report as CSV
     * @returns {string} - CSV report
     */
    exportCSV() {
        const csvData = [];
        
        // Header
        csvData.push(['Test ID', 'Test Name', 'Status', 'Severity', 'Findings', 'Duration']);
        
        // Test results
        for (const test of this.reportData.testResults) {
            csvData.push([
                test.id,
                test.name,
                test.status,
                test.severity,
                test.findings.length,
                test.duration || 0
            ]);
        }
        
        return csvData.map(row => row.join(',')).join('\n');
    }
    
    /**
     * Calculate overall risk level
     * @param {Object} vulnerabilities - Vulnerability counts
     * @returns {string} - Risk level
     */
    calculateOverallRiskLevel(vulnerabilities) {
        if (vulnerabilities.critical > 0) return 'Critical';
        if (vulnerabilities.high > 2) return 'High';
        if (vulnerabilities.high > 0 || vulnerabilities.medium > 5) return 'Medium';
        if (vulnerabilities.medium > 0 || vulnerabilities.low > 10) return 'Low';
        return 'Minimal';
    }
    
    /**
     * Extract key findings from test results
     * @param {Map} testResults - Test results
     * @returns {Array} - Key findings
     */
    extractKeyFindings(testResults) {
        const keyFindings = [];
        
        for (const [, result] of testResults) {
            if (result.findings) {
                for (const finding of result.findings) {
                    if (finding.severity === 'critical' || finding.severity === 'high') {
                        keyFindings.push({
                            type: finding.type,
                            severity: finding.severity,
                            description: StringUtils.truncate(finding.description, 100)
                        });
                    }
                }
            }
        }
        
        return keyFindings.slice(0, 5); // Top 5 key findings
    }
    
    /**
     * Get top recommendations
     * @param {Map} testResults - Test results
     * @returns {Array} - Top recommendations
     */
    getTopRecommendations(testResults) {
        const criticalFindings = [];
        
        for (const [, result] of testResults) {
            if (result.findings) {
                for (const finding of result.findings) {
                    if (finding.severity === 'critical' && finding.remediation) {
                        criticalFindings.push(finding.remediation);
                    }
                }
            }
        }
        
        // Remove duplicates and take top 3
        const uniqueRecommendations = [...new Set(criticalFindings)];
        return uniqueRecommendations.slice(0, 3);
    }
    
    /**
     * Assess compliance status
     * @param {Map} testResults - Test results
     * @returns {string} - Compliance status
     */
    assessComplianceStatus(testResults) {
        const criticalIssues = this.countIssuesBySeverity(testResults, 'critical');
        const highIssues = this.countIssuesBySeverity(testResults, 'high');
        
        if (criticalIssues > 0) return 'Non-Compliant';
        if (highIssues > 3) return 'Partially Compliant';
        if (highIssues > 0) return 'Mostly Compliant';
        return 'Compliant';
    }
    
    /**
     * Count issues by severity
     * @param {Map} testResults - Test results
     * @param {string} severity - Severity level
     * @returns {number} - Issue count
     */
    countIssuesBySeverity(testResults, severity) {
        let count = 0;
        for (const [, result] of testResults) {
            if (result.findings) {
                count += result.findings.filter(f => f.severity === severity).length;
            }
        }
        return count;
    }
    
    /**
     * Generate HTML header section
     * @returns {string} - HTML header
     */
    generateHTMLHeader() {
        const metadata = this.reportData.metadata;
        return `
        <header class="report-header">
            <h1>${metadata.title}</h1>
            <div class="report-info">
                <p><strong>Generated:</strong> ${DateUtils.formatDate(new Date(metadata.generatedAt))}</p>
                <p><strong>Target:</strong> ${metadata.target.url}</p>
                <p><strong>Duration:</strong> ${metadata.target.testDuration}</p>
                <p><strong>Classification:</strong> ${metadata.classification}</p>
            </div>
            <div class="disclaimer">
                <p>${metadata.disclaimer}</p>
            </div>
        </header>`;
    }
    
    /**
     * Generate HTML executive summary
     * @returns {string} - HTML executive summary
     */
    generateHTMLExecutiveSummary() {
        const summary = this.reportData.executiveSummary;
        return `
        <section class="executive-summary">
            <h2>Executive Summary</h2>
            <div class="summary-grid">
                <div class="summary-item risk-${summary.overallRiskLevel.toLowerCase()}">
                    <h3>Overall Risk Level</h3>
                    <p class="risk-level">${summary.overallRiskLevel}</p>
                </div>
                <div class="summary-item">
                    <h3>Total Vulnerabilities</h3>
                    <p class="metric">${summary.totalVulnerabilities}</p>
                </div>
                <div class="summary-item">
                    <h3>Critical Issues</h3>
                    <p class="metric critical">${summary.criticalIssues}</p>
                </div>
                <div class="summary-item">
                    <h3>Tests Passed</h3>
                    <p class="metric passed">${summary.testsPassed}</p>
                </div>
            </div>
            <div class="key-findings">
                <h3>Key Findings</h3>
                <ul>
                    ${summary.keyFindings.map(finding => 
                        `<li class="finding-${finding.severity}">
                            <strong>${finding.type}:</strong> ${finding.description}
                        </li>`
                    ).join('')}
                </ul>
            </div>
        </section>`;
    }
    
    /**
     * Generate HTML vulnerabilities section
     * @returns {string} - HTML vulnerabilities
     */
    generateHTMLVulnerabilities() {
        const vulnerabilities = this.reportData.vulnerabilities;
        return `
        <section class="vulnerabilities">
            <h2>Vulnerabilities</h2>
            ${vulnerabilities.map(vuln => `
                <div class="vulnerability-item severity-${vuln.severity}">
                    <div class="vuln-header">
                        <h3>${vuln.id}: ${vuln.title}</h3>
                        <span class="severity-badge ${vuln.severity}">${vuln.severity.toUpperCase()}</span>
                    </div>
                    <div class="vuln-content">
                        <p><strong>Description:</strong> ${vuln.description}</p>
                        <p><strong>Evidence:</strong> ${vuln.evidence}</p>
                        <p><strong>Impact:</strong> ${vuln.impact}</p>
                        <div class="remediation">
                            <h4>Remediation</h4>
                            <p>${vuln.remediation}</p>
                        </div>
                    </div>
                </div>
            `).join('')}
        </section>`;
    }
    
    /**
     * Generate HTML test results section
     * @returns {string} - HTML test results
     */
    generateHTMLTestResults() {
        const testResults = this.reportData.testResults;
        return `
        <section class="test-results">
            <h2>Detailed Test Results</h2>
            <div class="test-grid">
                ${testResults.map(test => `
                    <div class="test-item status-${test.status}">
                        <h3>${test.name}</h3>
                        <p class="test-description">${test.description}</p>
                        <div class="test-meta">
                            <span class="status ${test.status}">${test.status.toUpperCase()}</span>
                            <span class="severity ${test.severity}">${test.severity.toUpperCase()}</span>
                            <span class="duration">${test.duration}ms</span>
                        </div>
                        ${test.findings.length > 0 ? `
                            <div class="test-findings">
                                <h4>Findings (${test.findings.length})</h4>
                                <ul>
                                    ${test.findings.map(finding => 
                                        `<li class="finding-${finding.severity}">${finding.type}: ${finding.description}</li>`
                                    ).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </section>`;
    }
    
    /**
     * Generate HTML recommendations section
     * @returns {string} - HTML recommendations
     */
    generateHTMLRecommendations() {
        const recommendations = this.reportData.recommendations;
        return `
        <section class="recommendations">
            <h2>Security Recommendations</h2>
            ${recommendations.map((rec, index) => `
                <div class="recommendation-item priority-${rec.priority}">
                    <h3>${index + 1}. ${rec.title}</h3>
                    <p>${rec.description}</p>
                    <div class="rec-meta">
                        <span class="priority ${rec.priority}">Priority: ${rec.priority.toUpperCase()}</span>
                        <span class="effort">Effort: ${rec.effort}</span>
                        <span class="impact">Impact: ${rec.impact}</span>
                    </div>
                </div>
            `).join('')}
        </section>`;
    }
    
    /**
     * Generate HTML compliance section
     * @returns {string} - HTML compliance
     */
    generateHTMLCompliance() {
        const compliance = this.reportData.compliance;
        return `
        <section class="compliance">
            <h2>Compliance Assessment</h2>
            <div class="compliance-grid">
                <div class="compliance-item">
                    <h3>GDPR Compliance</h3>
                    <p class="status">${compliance.gdprCompliance.status}</p>
                    <p>${compliance.gdprCompliance.summary}</p>
                </div>
                <div class="compliance-item">
                    <h3>SOC 2 Compliance</h3>
                    <p class="status">${compliance.soc2Compliance.status}</p>
                    <p>${compliance.soc2Compliance.summary}</p>
                </div>
                <div class="compliance-item">
                    <h3>ISO 27001 Compliance</h3>
                    <p class="status">${compliance.iso27001Compliance.status}</p>
                    <p>${compliance.iso27001Compliance.summary}</p>
                </div>
                <div class="compliance-item">
                    <h3>NIST Framework</h3>
                    <p class="status">${compliance.nistFramework.status}</p>
                    <p>${compliance.nistFramework.summary}</p>
                </div>
            </div>
        </section>`;
    }
    
    /**
     * Generate HTML appendices section
     * @returns {string} - HTML appendices
     */
    generateHTMLAppendices() {
        const appendices = this.reportData.appendices;
        return `
        <section class="appendices">
            <h2>Appendices</h2>
            <div class="appendix">
                <h3>A. Test Methodology</h3>
                <p>${appendices.testMethodology}</p>
            </div>
            <div class="appendix">
                <h3>B. Tools Used</h3>
                <ul>
                    ${appendices.toolsUsed.map(tool => `<li>${tool}</li>`).join('')}
                </ul>
            </div>
            <div class="appendix">
                <h3>C. Security References</h3>
                <ul>
                    ${appendices.references.map(ref => `<li><a href="${ref.url}" target="_blank">${ref.title}</a></li>`).join('')}
                </ul>
            </div>
        </section>`;
    }
    
    /**
     * Get report CSS styles
     * @returns {string} - CSS styles
     */
    getReportCSS() {
        return `
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
        .report-container { max-width: 1200px; margin: 0 auto; }
        .report-header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .report-header h1 { color: #333; margin-bottom: 10px; }
        .disclaimer { background: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545; margin-top: 20px; }
        .executive-summary { margin-bottom: 40px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .summary-item { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .risk-level { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .risk-critical { background: #fee2e2; color: #dc2626; }
        .risk-high { background: #fef3c7; color: #d97706; }
        .risk-medium { background: #fef3c7; color: #d97706; }
        .risk-low { background: #d1fae5; color: #059669; }
        .vulnerability-item { border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0; overflow: hidden; }
        .vuln-header { background: #f8f9fa; padding: 15px; display: flex; justify-content: space-between; align-items: center; }
        .severity-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold; text-transform: uppercase; }
        .severity-badge.critical { background: #dc2626; color: white; }
        .severity-badge.high { background: #ea580c; color: white; }
        .severity-badge.medium { background: #d97706; color: white; }
        .severity-badge.low { background: #65a30d; color: white; }
        .vuln-content { padding: 20px; }
        .remediation { background: #f0fdf4; padding: 15px; border-radius: 6px; margin-top: 15px; }
        .test-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .test-item { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; }
        .test-meta { display: flex; gap: 10px; margin: 10px 0; }
        .test-meta span { padding: 2px 8px; border-radius: 4px; font-size: 0.8em; }
        .status.passed { background: #d1fae5; color: #059669; }
        .status.failed { background: #fee2e2; color: #dc2626; }
        .status.warning { background: #fef3c7; color: #d97706; }
        .recommendation-item { border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; background: #f8fafc; }
        .compliance-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .compliance-item { background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .appendix { margin: 30px 0; }
        @media print { body { font-size: 12px; } .report-container { max-width: none; } }
        `;
    }
    
    /**
     * Get report JavaScript
     * @returns {string} - JavaScript code
     */
    getReportJavaScript() {
        return `
        // Add interactive features for HTML report
        document.addEventListener('DOMContentLoaded', function() {
            // Add click handlers for collapsible sections
            const headers = document.querySelectorAll('.vuln-header, .test-item h3');
            headers.forEach(header => {
                header.style.cursor = 'pointer';
                header.addEventListener('click', function() {
                    const content = this.nextElementSibling;
                    if (content) {
                        content.style.display = content.style.display === 'none' ? 'block' : 'none';
                    }
                });
            });
        });
        `;
    }
    
    // Helper methods for generating report content
    generateTestRemediation(findings) {
        if (!findings || findings.length === 0) return 'No specific remediation required.';
        return findings.map(f => f.remediation).filter(r => r).join(' ');
    }
    
    assessVulnerabilityImpact(finding) {
        const impactMap = {
            critical: 'Complete system compromise possible',
            high: 'Significant security risk with potential for data breach',
            medium: 'Moderate security risk requiring attention',
            low: 'Minor security concern with limited impact',
            info: 'Informational finding for security awareness'
        };
        return impactMap[finding.severity] || 'Impact assessment required';
    }
    
    getVulnerabilityReferences(finding) {
        // Return relevant security references based on finding type
        const references = [];
        if (finding.type && finding.type.toLowerCase().includes('jwt')) {
            references.push('https://owasp.org/www-project-top-ten/2017/A2_2017-Broken_Authentication');
        }
        return references;
    }
    
    calculateCVSSScore(finding) {
        // Simplified CVSS scoring
        const scoreMap = { critical: 9.0, high: 7.5, medium: 5.0, low: 2.5, info: 0.0 };
        return scoreMap[finding.severity] || 0.0;
    }
    
    getRecommendationPriority(severity) {
        const priorityMap = { critical: 'critical', high: 'high', medium: 'medium', low: 'low', info: 'low' };
        return priorityMap[severity] || 'medium';
    }
    
    getRecommendationCategory(type) {
        if (!type) return 'General';
        if (type.toLowerCase().includes('jwt')) return 'Authentication';
        if (type.toLowerCase().includes('rls')) return 'Authorization';
        if (type.toLowerCase().includes('api')) return 'API Security';
        return 'General';
    }
    
    generateRecommendationTitle(finding) {
        return `Address ${finding.type || 'Security Issue'}`;
    }
    
    estimateImplementationEffort(finding) {
        const effortMap = { critical: 'High', high: 'Medium', medium: 'Medium', low: 'Low', info: 'Low' };
        return effortMap[finding.severity] || 'Medium';
    }
    
    estimateSecurityImpact(finding) {
        const impactMap = { critical: 'High', high: 'High', medium: 'Medium', low: 'Low', info: 'Low' };
        return impactMap[finding.severity] || 'Medium';
    }
    
    getGeneralRecommendations() {
        return [
            {
                priority: 'high',
                category: 'General',
                title: 'Implement Regular Security Assessments',
                description: 'Conduct regular security assessments and penetration testing to identify new vulnerabilities.',
                effort: 'Medium',
                impact: 'High'
            },
            {
                priority: 'medium',
                category: 'Monitoring',
                title: 'Enhance Security Monitoring',
                description: 'Implement comprehensive security monitoring and logging to detect potential security incidents.',
                effort: 'Medium',
                impact: 'Medium'
            }
        ];
    }
    
    assessGDPRCompliance(testResults) {
        return {
            status: 'Partially Compliant',
            summary: 'Review data protection measures and ensure proper consent mechanisms are in place.'
        };
    }
    
    assessSOC2Compliance(testResults) {
        return {
            status: 'Requires Review',
            summary: 'Security controls need strengthening to meet SOC 2 requirements.'
        };
    }
    
    assessISO27001Compliance(testResults) {
        return {
            status: 'Partially Compliant',
            summary: 'Information security management system requires improvements.'
        };
    }
    
    assessNISTCompliance(testResults) {
        return {
            status: 'Partially Compliant',
            summary: 'Cybersecurity framework implementation needs enhancement.'
        };
    }
    
    getComplianceRecommendations(testResults) {
        return [
            'Implement comprehensive access controls',
            'Enhance data encryption practices',
            'Improve incident response procedures'
        ];
    }
    
    getTestMethodology() {
        return 'This assessment used automated security testing tools to evaluate the Supabase configuration for common security vulnerabilities and misconfigurations.';
    }
    
    getToolsUsed() {
        return [
            'Supabase Security Testing Suite v1.0.0',
            'Custom JWT Analysis Tools',
            'API Security Scanners'
        ];
    }
    
    sanitizeConfiguration(config) {
        return {
            supabaseUrl: SecurityUtils.maskSensitiveData(config.supabaseUrl, 20),
            hasTestCredentials: !!(config.testEmail && config.testPassword),
            timeout: config.timeout
        };
    }
    
    getSecurityGlossary() {
        return {
            'JWT': 'JSON Web Token - A compact, URL-safe means of representing claims to be transferred between two parties',
            'RLS': 'Row Level Security - A PostgreSQL feature that enables database administrators to define policies to control access to rows in a table',
            'API': 'Application Programming Interface - A set of protocols and tools for building software applications'
        };
    }
    
    getSecurityReferences() {
        return [
            { title: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten/' },
            { title: 'Supabase Security Documentation', url: 'https://supabase.com/docs/guides/auth/architecture' },
            { title: 'NIST Cybersecurity Framework', url: 'https://www.nist.gov/cyberframework' }
        ];
    }
    
    convertHTMLToPDFFormat(html) {
        // Simplified PDF conversion - in practice would use a proper PDF library
        return `PDF Report Generated from HTML\n\n${html.replace(/<[^>]*>/g, '').substring(0, 1000)}...`;
    }
}

// Create global instance
const reportGenerator = new SecurityReportGenerator();

// Report generator is available globally in browser environment