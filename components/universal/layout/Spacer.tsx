import React from 'react';
import { View, ViewStyle } from 'react-native';
import { SpacingScale } from '@/lib/design';
import { useSpacing } from '@/lib/stores/spacing-store';
import { cn } from '@/lib/core/utils';

export interface SpacerProps {
  size?: SpacingScale;
  horizontal?: boolean;
  flex?: boolean;
  className?: string;
  style?: ViewStyle;
}

export const Spacer = React.forwardRef<View, SpacerProps>(({
  size = 2,
  horizontal = false,
  flex = false,
  className,
  style,
}, ref) => {
  const { spacing } = useSpacing();
  
  const spacerClasses = cn(
    flex && 'flex-1',
    className
  );
  
  const spacerStyle: ViewStyle = {
    ...(horizontal ? { width: spacing[size] } : { height: spacing[size] }),
    ...style,
  };
  
  return (
    <View 
      ref={ref} 
      className={spacerClasses}
      style={spacerStyle} 
    />
  );
});

Spacer.displayName = 'Spacer';

// Convenience components
export const HSpacer: React.FC<{ size?: SpacingScale; className?: string }> = ({ size, className }) => (
  <Spacer size={size} horizontal className={className} />
);

export const VSpacer: React.FC<{ size?: SpacingScale; className?: string }> = ({ size, className }) => (
  <Spacer size={size} className={className} />
);

export const FlexSpacer: React.FC<{ className?: string }> = ({ className }) => (
  <Spacer flex className={className} />
);

HSpacer.displayName = 'HSpacer';
VSpacer.displayName = 'VSpacer';
FlexSpacer.displayName = 'FlexSpacer';