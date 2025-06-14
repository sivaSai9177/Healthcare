export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: string;
  organizationCode?: string;
  organizationName?: string;
  organizationId?: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

export interface RegisterProps {
  onSubmit: (data: RegisterFormData) => Promise<void>;
  onCheckEmail?: (email: string) => Promise<{ exists: boolean }>;
  onSignIn?: () => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export interface PasswordStrengthProps {
  password: string;
}

export interface RegisterHookReturn {
  register: (data: RegisterFormData) => Promise<void>;
  checkEmail: (email: string) => Promise<{ exists: boolean }>;
  isLoading: boolean;
  error?: string;
}