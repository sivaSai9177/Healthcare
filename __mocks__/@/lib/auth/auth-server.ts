export const createAuthClient = jest.fn();

export const authClient = {
  signIn: {
    email: jest.fn(),
  },
  signUp: {
    email: jest.fn(),
  },
  signOut: jest.fn(),
  session: jest.fn(),
  getSession: jest.fn(),
  sendVerificationEmail: jest.fn(),
  verifyEmail: jest.fn(),
  forgetPassword: jest.fn(),
  resetPassword: jest.fn(),
};