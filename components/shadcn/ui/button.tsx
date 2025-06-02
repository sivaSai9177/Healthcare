import * as React from "react";
import { Pressable, Text, PressableProps, Platform, View } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/core/utils";
import "@/app/global.css";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:bg-muted disabled:text-muted-foreground",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:bg-muted disabled:text-muted-foreground disabled:border-muted",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:bg-muted disabled:text-muted-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground disabled:text-muted-foreground",
        link: "text-primary underline-offset-4 hover:underline disabled:text-muted-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends Omit<PressableProps, "className">,
    VariantProps<typeof buttonVariants> {
  className?: string;
  children?: React.ReactNode;
  type?: "button" | "submit" | "reset";
  onClick?: () => void; // For web compatibility
}

const Button = React.forwardRef<View, ButtonProps>(
  ({ className, variant, size, children, disabled, onPress, onClick, type, ...props }, ref) => {
    // Handle form submission for web
    const handlePress = React.useCallback(() => {
      if (Platform.OS === "web" && type === "submit") {
        // For web form submission, we need to trigger the form's submit event
        const form = (ref as any)?.current?.closest("form");
        if (form) {
          const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
          return;
        }
      }
      
      // Use onClick for web, onPress for native
      if (onClick) onClick();
      if (onPress) onPress(null as any);
    }, [onClick, onPress, type, ref]);

    return (
      <Pressable
        ref={ref}
        className={cn(
          buttonVariants({ variant, size, className }),
          disabled && "opacity-50"
        )}
        disabled={disabled}
        onPress={handlePress}
        style={({ pressed }) => [
          { opacity: pressed && !disabled ? 0.7 : disabled ? 0.5 : 1 }
        ]}
        {...props}
      >
        {({ pressed }) => (
          <Text
            className={cn(
              "text-sm font-medium",
              !disabled && variant === "default" && "text-primary-foreground",
              !disabled && variant === "destructive" && "text-destructive-foreground",
              !disabled && variant === "outline" && "text-foreground",
              !disabled && variant === "secondary" && "text-secondary-foreground",
              !disabled && variant === "ghost" && "text-foreground",
              !disabled && variant === "link" && "text-primary",
              disabled && "text-muted-foreground",
              pressed && !disabled && "opacity-70"
            )}
            style={{
              color: disabled ? '#999999' :
                variant === "default" ? '#ffffff' :
                variant === "destructive" ? '#ffffff' :
                variant === "secondary" ? '#333333' :
                variant === "link" ? '#0066cc' :
                '#333333', // For outline and ghost variants
            }}
          >
            {children}
          </Text>
        )}
      </Pressable>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };