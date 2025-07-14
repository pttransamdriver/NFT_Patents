/**
 * Security utilities for the NFT Patents application
 */

// Input validation and sanitization
export class SecurityUtils {
  
  /**
   * Sanitize user input to prevent XSS attacks
   */
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
      .slice(0, 1000); // Limit length
  }

  /**
   * Validate patent number format
   */
  static validatePatentNumber(patentNumber: string): boolean {
    if (!patentNumber || typeof patentNumber !== 'string') return false;
    
    // Basic USPTO patent number format validation
    const patentRegex = /^US-?\d{7,8}-?[A-Z]\d?$/i;
    return patentRegex.test(patentNumber.replace(/\s/g, ''));
  }

  /**
   * Validate Ethereum address format
   */
  static validateEthereumAddress(address: string): boolean {
    if (!address || typeof address !== 'string') return false;
    
    // Basic Ethereum address validation
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
  }

  /**
   * Validate API key format (basic check)
   */
  static validateApiKey(apiKey: string, provider: 'openai' | 'gemini' | 'claude'): boolean {
    if (!apiKey || typeof apiKey !== 'string') return false;
    
    switch (provider) {
      case 'openai':
        return apiKey.startsWith('sk-') && apiKey.length > 20;
      case 'gemini':
        return apiKey.length > 20 && /^[A-Za-z0-9_-]+$/.test(apiKey);
      case 'claude':
        return apiKey.startsWith('sk-ant-') && apiKey.length > 30;
      default:
        return false;
    }
  }

  /**
   * Secure localStorage operations
   */
  static secureLocalStorage = {
    setItem: (key: string, value: string): void => {
      try {
        // Add timestamp for expiration
        const item = {
          value,
          timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(item));
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    },

    getItem: (key: string, maxAge: number = 24 * 60 * 60 * 1000): string | null => {
      try {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;

        const item = JSON.parse(itemStr);
        const now = Date.now();

        // Check if item has expired
        if (now - item.timestamp > maxAge) {
          localStorage.removeItem(key);
          return null;
        }

        return item.value;
      } catch (error) {
        console.warn('Failed to read from localStorage:', error);
        return null;
      }
    },

    removeItem: (key: string): void => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('Failed to remove from localStorage:', error);
      }
    },

    clear: (): void => {
      try {
        localStorage.clear();
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
      }
    }
  };

  /**
   * Rate limiting utility
   */
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests: number[] = [];

    return {
      canMakeRequest: (): boolean => {
        const now = Date.now();
        
        // Remove old requests outside the window
        while (requests.length > 0 && requests[0] <= now - windowMs) {
          requests.shift();
        }

        // Check if we can make a new request
        if (requests.length < maxRequests) {
          requests.push(now);
          return true;
        }

        return false;
      },
      
      getRemainingRequests: (): number => {
        const now = Date.now();
        
        // Remove old requests outside the window
        while (requests.length > 0 && requests[0] <= now - windowMs) {
          requests.shift();
        }

        return Math.max(0, maxRequests - requests.length);
      }
    };
  }

  /**
   * Content Security Policy helpers
   */
  static setupCSP(): void {
    // Add meta tag for CSP if not already present
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Needed for React dev
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com https://api.anthropic.com https://*.infura.io wss://*.infura.io",
        "font-src 'self' data:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ');
      
      document.head.appendChild(meta);
    }
  }

  /**
   * Secure random string generation
   */
  static generateSecureRandom(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Check if running in secure context
   */
  static isSecureContext(): boolean {
    return window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
  }

  /**
   * Validate URL to prevent open redirect attacks
   */
  static validateUrl(url: string, allowedDomains: string[] = []): boolean {
    try {
      const urlObj = new URL(url);
      
      // Only allow https (except localhost)
      if (urlObj.protocol !== 'https:' && urlObj.hostname !== 'localhost') {
        return false;
      }

      // Check against allowed domains if provided
      if (allowedDomains.length > 0) {
        return allowedDomains.some(domain => 
          urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
        );
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Log security events (in production, send to monitoring service)
   */
  static logSecurityEvent(event: string, details: any = {}): void {
    const logData = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.warn('Security Event:', logData);
    }

    // In production, send to monitoring service
    // Example: sendToMonitoringService(logData);
  }
}

// Export rate limiter instances for common use cases
export const apiRateLimiter = SecurityUtils.createRateLimiter(10, 60000); // 10 requests per minute
export const searchRateLimiter = SecurityUtils.createRateLimiter(5, 60000); // 5 searches per minute
