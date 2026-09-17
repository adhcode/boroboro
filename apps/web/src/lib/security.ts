/**
 * Security utilities for input sanitization and validation
 */

// XSS protection - sanitize user input
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim()
    .slice(0, 1000); // Limit length
}

// Email validation (more strict than HTML5)
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 255;
}

// Password strength validation
export interface PasswordStrength {
  isValid: boolean;
  score: number; // 0-4
  feedback: string[];
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters');
    return { isValid: false, score: 0, feedback };
  }

  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score < 3) {
    feedback.push('Password should include uppercase, lowercase, and numbers');
  }

  // Check for common patterns
  const commonPatterns = ['password', '123456', 'qwerty', 'abc123'];
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    feedback.push('Password contains common patterns');
    score = Math.max(0, score - 2);
  }

  const isValid = score >= 3 && password.length >= 8;

  if (!isValid && feedback.length === 0) {
    feedback.push('Password is too weak');
  }

  return { isValid, score, feedback };
}

// Phone number sanitization
export function sanitizePhone(phone: string): string {
  return phone.replace(/[^0-9+\-() ]/g, '').slice(0, 20);
}

// Check if request is from same origin (CSRF protection)
export function isSameOrigin(url: string): boolean {
  if (typeof window === 'undefined') return true;
  
  try {
    const requestUrl = new URL(url, window.location.origin);
    return requestUrl.origin === window.location.origin;
  } catch {
    return false;
  }
}

// Generate CSRF token for forms
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Validate CSRF token
export function validateCSRFToken(token: string): boolean {
  const storedToken = sessionStorage.getItem('csrf_token');
  return storedToken === token;
}
