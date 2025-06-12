// Conditional export for email service
// Use mock in React Native, real service in Node.js

let emailService: any;

if (typeof window !== 'undefined') {
  // React Native environment - use mock
  const { emailService: mockService } = require('./email-mock');
  emailService = mockService;
} else {
  // Node.js environment - use real service
  const { emailService: realService } = require('./email');
  emailService = realService;
}

export { emailService };
export type { EmailOptions, EmailResult } from './email-mock';