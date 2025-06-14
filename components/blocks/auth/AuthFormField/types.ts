export interface AuthFormFieldProps {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  hint?: string;
  className?: string;
  required?: boolean;
  autoFocus?: boolean;
  animationDelay?: number;
}