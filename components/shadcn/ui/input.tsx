import * as React from "react";
import { TextInput, TextInputProps, View, Text } from "react-native";
import { cn } from "@/lib/utils";
import { useColorScheme } from "@/hooks/useColorScheme";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    const colorScheme = useColorScheme();
    
    // Dynamic placeholder text color based on theme
    const placeholderTextColor = colorScheme === 'dark' 
      ? 'hsl(240 5% 64.9%)' // Dark theme muted-foreground
      : 'hsl(240 3.8% 46.1%)'; // Light theme muted-foreground
    
    return (
      <View className="w-full">
        {label && (
          <Text className="text-sm font-medium text-foreground mb-1.5">
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground",
            "placeholder:text-muted-foreground",
            "focus:border-ring",
            "disabled:opacity-50",
            error && "border-destructive",
            className
          )}
          placeholderTextColor={placeholderTextColor}
          style={{
            color: 'hsl(var(--foreground))', // Ensure text color works in dark mode
            backgroundColor: 'hsl(var(--background))', // Ensure background works in dark mode
          }}
          {...props}
        />
        {error && (
          <Text className="text-xs text-destructive mt-1">{error}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = "Input";

export { Input };