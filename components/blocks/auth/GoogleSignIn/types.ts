import { type ButtonProps } from "@/components/universal/interaction/Button";

export interface GoogleSignInProps extends Partial<ButtonProps> {
  showIcon?: boolean;
  text?: string;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  iconOnly?: boolean;
}