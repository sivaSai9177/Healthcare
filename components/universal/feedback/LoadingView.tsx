import React from 'react';
import { ActivityIndicator } from 'react-native';
import { Box } from '@/components/universal/layout/Box';
import { Text } from '@/components/universal/typography/Text';
import { SpacingScale } from '@/lib/design';
import { cn } from '@/lib/core/utils';

interface LoadingViewProps {
  message?: string;
  color?: string;
  backgroundColor?: string;
  className?: string;
}

export function LoadingView({ 
  message = 'Loading...', 
  color,
  backgroundColor,
  className
}: LoadingViewProps) {

  return (
    <Box 
      flex={1} 
      justifyContent="center" 
      alignItems="center"
      className={cn("bg-background", className)}
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      <ActivityIndicator size="large" className={color ? undefined : "text-primary"} color={color} />
      {message && (
        <Text 
          size="base" 
          className="text-muted-foreground" 
          align="center"
          mt={3 as SpacingScale}
        >
          {message}
        </Text>
      )}
    </Box>
  );
}