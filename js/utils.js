/**
 * Utility Functions for Supabase Security Testing Suite
 * Provides common helper functions for the application
 */

// DOM Utility Functions
const Utils = {
    /**
     * Get element by ID with error handling
     * @param {string} id - Element ID
     * @returns {HTMLElement|null} - Element or null if not found
     */
    getElementById: function(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with ID '${id}' not found`);
        }
        return element;
    },

    /**
     * Get elements by class name
     * @param {string} className - Class name
     * @returns {NodeList} - List of elements
     */
    getElementsByClassName: function(className) {
        return document.getElementsByClassName(className);
    },

    /**
     * Query selector with error handling
     * @param {string} selector - CSS selector
     * @returns {HTMLElement|null} - Element or null if not found
     */
    querySelector: function(selector) {
        const element = document.querySelector(selector);
        if (!element) {
            console.warn(`Element with selector '${selector}' not found`);
        }
        return element;
    },

    /**
     * Query all elements with selector
     * @param {string} selector - CSS selector
     * @returns {NodeList} - List of elements
     */
    querySelectorAll: function(selector) {
        return document.querySelectorAll(selector);
    },

    /**
     * Add event listener with error handling
     * @param {HTMLElement} element - Target element
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     */
    addEventListener: function(element, event, handler) {
        if (element && typeof handler === 'function') {
            element.addEventListener(event, handler);
        } else {
            console.error('Invalid element or handler for event listener');
        }
    },

    /**
     * Remove event listener
     * @param {HTMLElement} element - Target element
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     */
    removeEventListener: function(element, event, handler) {
        if (element && typeof handler === 'function') {
            element.removeEventListener(event, handler);
        }
    }
};

// String Utility Functions
const StringUtils = {
    /**
     * Validate URL format
     * @param {string} url - URL to validate
     * @returns {boolean} - True if valid URL
     */
    isValidUrl: function(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} - True if valid email
     */
    isValidEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Sanitize HTML string
     * @param {string} str - String to sanitize
     * @returns {string} - Sanitized string
     */
    sanitizeHtml: function(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Escape HTML entities
     * @param {string} str - String to escape
     * @returns {string} - Escaped string
     */
    escapeHtml: function(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    /**
     * Generate random string
     * @param {number} length - Length of string
     * @returns {string} - Random string
     */
    generateRandomString: function(length = 10) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    /**
     * Truncate string with ellipsis
     * @param {string} str - String to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} - Truncated string
     */
    truncate: function(str, maxLength = 50) {
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength - 3) + '...';
    }
};

// Date and Time Utilities
const DateUtils = {
    /**
     * Format date to readable string
     * @param {Date} date - Date object
     * @returns {string} - Formatted date string
     */
    formatDate: function(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Get current timestamp
     * @returns {string} - ISO timestamp
     */
    getCurrentTimestamp: function() {
        return new Date().toISOString();
    },

    /**
     * Calculate time difference in minutes
     * @param {Date} startTime - Start time
     * @param {Date} endTime - End time
     * @returns {number} - Difference in minutes
     */
    getTimeDifferenceMinutes: function(startTime, endTime) {
        const diffMs = endTime - startTime;
        return Math.round(diffMs / (1000 * 60));
    },

    /**
     * Format duration in human readable format
     * @param {number} milliseconds - Duration in milliseconds
     * @returns {string} - Formatted duration
     */
    formatDuration: function(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
};

// HTTP Request Utilities
const HttpUtils = {
    /**
     * Make HTTP GET request
     * @param {string} url - Request URL
     * @param {Object} headers - Request headers
     * @returns {Promise} - Response promise
     */
    get: async function(url, headers = {}) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('GET request failed:', error);
            throw error;
        }
    },

    /**
     * Make HTTP POST request
     * @param {string} url - Request URL
     * @param {Object} data - Request data
     * @param {Object} headers - Request headers
     * @returns {Promise} - Response promise
     */
    post: async function(url, data = {}, headers = {}) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                body: JSON.stringify(data)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('POST request failed:', error);
            throw error;
        }
    },

    /**
     * Handle HTTP response
     * @param {Response} response - Fetch response
     * @returns {Promise} - Parsed response
     */
    handleResponse: async function(response) {
        const contentType = response.headers.get('content-type');
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            return await response.text();
        }
    },

    /**
     * Check if URL is reachable
     * @param {string} url - URL to check
     * @returns {Promise<boolean>} - True if reachable
     */
    isUrlReachable: async function(url) {
        try {
            await fetch(url, {
                method: 'HEAD',
                mode: 'no-cors'
            });
            return true;
        } catch {
            return false;
        }
    }
};

// Local Storage Utilities
const StorageUtils = {
    /**
     * Set item in localStorage
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     */
    setItem: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    },

    /**
     * Get item from localStorage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if not found
     * @returns {*} - Stored value or default
     */
    getItem: function(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Failed to read from localStorage:', error);
            return defaultValue;
        }
    },

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     */
    removeItem: function(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
        }
    },

    /**
     * Clear all localStorage
     */
    clear: function() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Failed to clear localStorage:', error);
        }
    }
};

// Security Utilities
const SecurityUtils = {
    /**
     * Validate JWT token format (basic check)
     * @param {string} token - JWT token
     * @returns {boolean} - True if valid format
     */
    isValidJwtFormat: function(token) {
        if (!token || typeof token !== 'string') return false;
        const parts = token.split('.');
        return parts.length === 3;
    },

    /**
     * Decode JWT payload (without verification)
     * @param {string} token - JWT token
     * @returns {Object|null} - Decoded payload or null
     */
    decodeJwtPayload: function(token) {
        try {
            if (!this.isValidJwtFormat(token)) return null;
            const payload = token.split('.')[1];
            const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
            return JSON.parse(decoded);
        } catch (error) {
            console.error('Failed to decode JWT payload:', error);
            return null;
        }
    },

    /**
     * Check if JWT token is expired
     * @param {string} token - JWT token
     * @returns {boolean} - True if expired
     */
    isJwtExpired: function(token) {
        const payload = this.decodeJwtPayload(token);
        if (!payload || !payload.exp) return true;
        return Date.now() >= payload.exp * 1000;
    },

    /**
     * Generate secure random ID
     * @returns {string} - Random ID
     */
    generateSecureId: function() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Mask sensitive data for display
     * @param {string} data - Sensitive data
     * @param {number} visibleChars - Number of visible characters
     * @returns {string} - Masked data
     */
    maskSensitiveData: function(data, visibleChars = 4) {
        if (!data || data.length <= visibleChars) return data;
        const visible = data.substring(0, visibleChars);
        const masked = '*'.repeat(Math.min(data.length - visibleChars, 8));
        return visible + masked;
    }
};

// UI Utilities
const UIUtils = {
    /**
     * Show loading spinner
     * @param {HTMLElement} element - Target element
     */
    showLoading: function(element) {
        if (!element) return;
        element.innerHTML = '<div class="spinner"></div>';
        element.disabled = true;
    },

    /**
     * Hide loading spinner
     * @param {HTMLElement} element - Target element
     * @param {string} originalText - Original text to restore
     */
    hideLoading: function(element, originalText = '') {
        if (!element) return;
        element.innerHTML = originalText;
        element.disabled = false;
    },

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds
     */
    showNotification: function(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} fixed top-4 right-4 z-50 max-w-sm`;
        notification.innerHTML = `
            <div class="flex items-center">
                <span class="flex-1">${StringUtils.escapeHtml(message)}</span>
                <button class="ml-2 text-lg font-bold" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, duration);
        }
    },

    /**
     * Update progress bar
     * @param {HTMLElement} progressBar - Progress bar element
     * @param {number} percentage - Progress percentage (0-100)
     */
    updateProgressBar: function(progressBar, percentage) {
        if (!progressBar) return;
        progressBar.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
    },

    /**
     * Toggle element visibility
     * @param {HTMLElement} element - Target element
     * @param {boolean} show - Show or hide
     */
    toggleVisibility: function(element, show) {
        if (!element) return;
        if (show) {
            element.classList.remove('hidden');
            element.style.display = '';
        } else {
            element.classList.add('hidden');
            element.style.display = 'none';
        }
    },

    /**
     * Scroll to element
     * @param {HTMLElement} element - Target element
     * @param {string} behavior - Scroll behavior
     */
    scrollToElement: function(element, behavior = 'smooth') {
        if (!element) return;
        element.scrollIntoView({ behavior, block: 'start' });
    }
};

// Validation Utilities
const ValidationUtils = {
    /**
     * Validate form data
     * @param {Object} data - Form data to validate
     * @param {Object} rules - Validation rules
     * @returns {Object} - Validation result
     */
    validateForm: function(data, rules) {
        const errors = {};
        let isValid = true;

        for (const field in rules) {
            const value = data[field];
            const rule = rules[field];

            if (rule.required && (!value || value.trim() === '')) {
                errors[field] = `${field} is required`;
                isValid = false;
                continue;
            }

            if (value && rule.type) {
                switch (rule.type) {
                    case 'email':
                        if (!StringUtils.isValidEmail(value)) {
                            errors[field] = 'Invalid email format';
                            isValid = false;
                        }
                        break;
                    case 'url':
                        if (!StringUtils.isValidUrl(value)) {
                            errors[field] = 'Invalid URL format';
                            isValid = false;
                        }
                        break;
                    case 'jwt':
                        if (!SecurityUtils.isValidJwtFormat(value)) {
                            errors[field] = 'Invalid JWT token format';
                            isValid = false;
                        }
                        break;
                }
            }

            if (value && rule.minLength && value.length < rule.minLength) {
                errors[field] = `Minimum length is ${rule.minLength} characters`;
                isValid = false;
            }

            if (value && rule.maxLength && value.length > rule.maxLength) {
                errors[field] = `Maximum length is ${rule.maxLength} characters`;
                isValid = false;
            }
        }

        return { isValid, errors };
    },

    /**
     * Display validation errors
     * @param {Object} errors - Validation errors
     */
    displayErrors: function(errors) {
        // Clear existing errors
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(el => el.remove());

        // Display new errors
        for (const field in errors) {
            const input = document.querySelector(`[name="${field}"]`);
            if (input) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message text-red-600 text-sm mt-1';
                errorDiv.textContent = errors[field];
                input.parentElement.appendChild(errorDiv);
                input.classList.add('border-red-500');
            }
        }
    },

    /**
     * Clear validation errors
     */
    clearErrors: function() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(el => el.remove());

        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => input.classList.remove('border-red-500'));
    }
};

// Utilities are available globally in browser environment