import React, { useState, useCallback } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import { Text, TextProps } from './Text';
import { Button } from '@/components/universal/interaction';
import { cn } from '@/lib/core/utils';

interface TruncatedTextProps extends TextProps {
  /**
   * Number of lines to show before truncating
   */
  lines?: number;
  
  /**
   * Custom "show more" text
   */
  showMoreText?: string;
  
  /**
   * Custom "show less" text
   */
  showLessText?: string;
  
  /**
   * Whether to show expand/collapse button
   */
  expandable?: boolean;
  
  /**
   * Callback when text is expanded
   */
  onExpand?: () => void;
  
  /**
   * Callback when text is collapsed
   */
  onCollapse?: () => void;
  
  /**
   * Style for the expand/collapse button
   */
  buttonClassName?: string;
}

export const TruncatedText = React.forwardRef<any, TruncatedTextProps>(({
  lines = 3,
  showMoreText = 'Show more',
  showLessText = 'Show less',
  expandable = true,
  onExpand,
  onCollapse,
  buttonClassName,
  children,
  className,
  numberOfLines: propNumberOfLines,
  ...props
}, ref) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [textHeight, setTextHeight] = useState(0);
  const [truncatedHeight, setTruncatedHeight] = useState(0);
  
  // Handle text layout to detect if truncation is needed
  const handleTextLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (!isExpanded && truncatedHeight === 0) {
      setTruncatedHeight(height);
    } else if (isExpanded && textHeight === 0) {
      setTextHeight(height);
      // Check if text was actually truncated
      if (height > truncatedHeight) {
        setIsTruncated(true);
      }
    }
  }, [isExpanded, textHeight, truncatedHeight]);
  
  const toggleExpanded = useCallback(() => {
    const nextExpanded = !isExpanded;
    setIsExpanded(nextExpanded);
    
    if (nextExpanded) {
      onExpand?.();
    } else {
      onCollapse?.();
    }
  }, [isExpanded, onExpand, onCollapse]);
  
  const numberOfLines = isExpanded ? undefined : (propNumberOfLines || lines);
  
  return (
    <View className={cn('flex-col', className) as string}>
      <Text
        ref={ref}
        numberOfLines={numberOfLines}
        onLayout={handleTextLayout}
        {...props}
      >
        {children}
      </Text>
      
      {expandable && isTruncated && (
        <Button
          variant="link"
          size="sm"
          onPress={toggleExpanded}
          className={cn(
            'self-start p-0 h-auto mt-1',
            buttonClassName
          )}
        >
          {isExpanded ? showLessText : showMoreText}
        </Button>
      )}
    </View>
  );
});

TruncatedText.displayName = 'TruncatedText';

// Convenience component for single line truncation with ellipsis
export const EllipsisText = React.forwardRef<any, TextProps>(({
  className,
  ...props
}, ref) => (
  <Text
    ref={ref}
    numberOfLines={1}
    className={cn('truncate', className) as string}
    {...props}
  />
));

EllipsisText.displayName = 'EllipsisText';

// Multi-line clamped text without expand/collapse
export const ClampedText = React.forwardRef<any, TextProps & { lines?: number }>(({
  lines = 3,
  className,
  ...props
}, ref) => (
  <Text
    ref={ref}
    numberOfLines={lines}
    className={cn('line-clamp-' + lines, className) as string}
    {...props}
  />
));

ClampedText.displayName = 'ClampedText';