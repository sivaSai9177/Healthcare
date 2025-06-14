import React, { useMemo } from 'react';
import { View } from 'react-native';
import { HStack, Text, Progress } from '@/components/universal';
import { cn } from '@/lib/core/utils';
import Animated, { FadeIn } from 'react-native-reanimated';

const AnimatedView = Animated.View;

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
  pattern?: RegExp;
}

const requirements: PasswordRequirement[] = [
  { label: '8+ chars', test: (p) => p.length >= 8 },
  { label: '12+ chars', test: (p) => p.length >= 12 },
  { label: 'Uppercase', test: (p) => /[A-Z]/.test(p), pattern: /[A-Z]/ },
  { label: 'Lowercase', test: (p) => /[a-z]/.test(p), pattern: /[a-z]/ },
  { label: 'Number', test: (p) => /[0-9]/.test(p), pattern: /[0-9]/ },
  { label: 'Special', test: (p) => /[^A-Za-z0-9]/.test(p), pattern: /[^A-Za-z0-9]/ },
];

export function PasswordStrengthIndicator({
  password,
  showRequirements = true,
  className,
}: PasswordStrengthIndicatorProps) {
  const { strength, strengthText, strengthColor, passedRequirements } = useMemo(() => {
    if (!password) return { 
      strength: 0, 
      strengthText: '', 
      strengthColor: '', 
      passedRequirements: [] as string[] 
    };

    let score = 0;
    const passed: string[] = [];

    requirements.forEach((req) => {
      if (req.test(password)) {
        passed.push(req.label);
        // Length requirements give less score
        if (req.label.includes('chars')) {
          score += 0.5;
        } else {
          score += 1;
        }
      }
    });

    // Normalize score to 0-4 range
    const normalizedScore = Math.min(4, Math.floor(score));

    const texts = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', 'destructive', 'warning', 'secondary', 'success'];

    return {
      strength: normalizedScore,
      strengthText: texts[normalizedScore],
      strengthColor: colors[normalizedScore],
      passedRequirements: passed,
    };
  }, [password]);

  if (!password) return null;

  return (
    <AnimatedView 
      entering={FadeIn} 
      className={cn("space-y-2", className)}
    >
      {/* Strength bar with text */}
      <HStack align="center" gap={2}>
        <View className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
          <View
            className={cn(
              "h-full transition-all duration-300",
              strength >= 1 && "bg-destructive",
              strength >= 2 && "bg-warning",
              strength >= 3 && "bg-secondary",
              strength >= 4 && "bg-success"
            )}
            style={{ width: `${(strength / 4) * 100}%` }}
          />
        </View>
        {strengthText && (
          <Text 
            size="xs" 
            className={cn(
              strength === 1 && "text-destructive",
              strength === 2 && "text-warning",
              strength === 3 && "text-secondary",
              strength === 4 && "text-success"
            )}
          >
            {strengthText}
          </Text>
        )}
      </HStack>

      {/* Requirements list */}
      {showRequirements && (
        <View className="flex-row flex-wrap gap-1">
          {requirements.map((req) => {
            const isPassed = passedRequirements.includes(req.label);
            return (
              <View
                key={req.label}
                className={cn(
                  "px-2 py-1 rounded-md",
                  isPassed ? "bg-success/10" : "bg-muted"
                )}
              >
                <Text 
                  size="xs" 
                  className={cn(
                    isPassed ? "text-success" : "text-muted-foreground"
                  )}
                >
                  {isPassed ? '✓' : '○'} {req.label}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </AnimatedView>
  );
}