export interface SignInProps {
  onSubmit: (data: SignInFormData) => Promise<void>;
  onForgotPassword?: () => void;
  onSignUp?: () => void;
  onCheckEmail?: (email: string) => Promise<{ exists: boolean }>;
  isLoading?: boolean;
  error?: string | null;
  showRememberMe?: boolean;
  className?: string;
}

export interface SignInFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignInHookReturn {
  signIn: (data: SignInFormData) => Promise<void>;
  checkEmail: (email: string) => Promise<{ exists: boolean }>;
  isLoading: boolean;
  error?: string;
}