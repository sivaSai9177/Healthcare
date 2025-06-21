import React, { useMemo, useEffect } from 'react';
import { View, ViewStyle, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { Text } from '@/components/universal/typography/Text';
import { Button } from '@/components/universal/interaction/Button';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Symbol } from '@/components/universal/display/Symbols';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PaginationAnimationType = 'scale' | 'fade' | 'slide' | 'none';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  showPageInfo?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'dots';
  style?: ViewStyle;
  testID?: string;
  
  // Animation props
  animated?: boolean;
  animationType?: PaginationAnimationType;
  animationDuration?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

export const Pagination = React.forwardRef<View, PaginationProps>(
  (
    {
      currentPage,
      totalPages,
      onPageChange,
      maxVisiblePages = 7,
      showFirstLast = true,
      showPrevNext = true,
      showPageInfo = false,
      disabled = false,
      size = 'md',
      variant = 'default',
      style,
      testID,
      animated = true,
      animationType = 'scale',
      useHaptics = true,
      animationConfig,
    },
    ref
  ) => {
    const { spacing } = useSpacing();
    const { shouldAnimate } = useAnimationStore();
    const config = animationConfig || {
      duration: { fast: 150, normal: 300, slow: 500 },
      spring: { damping: 20, stiffness: 300 }
    };

    // Calculate visible page numbers
    const visiblePages = useMemo(() => {
      if (totalPages <= maxVisiblePages) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }

      const halfVisible = Math.floor(maxVisiblePages / 2);
      const pages: (number | string)[] = [];

      // Always show first page
      pages.push(1);

      // Calculate start and end of visible range
      let start = Math.max(2, currentPage - halfVisible);
      let end = Math.min(totalPages - 1, currentPage + halfVisible);

      // Adjust range if at the edges
      if (currentPage <= halfVisible) {
        end = maxVisiblePages - 1;
      } else if (currentPage >= totalPages - halfVisible) {
        start = totalPages - maxVisiblePages + 2;
      }

      // Add ellipsis if needed
      if (start > 2) {
        pages.push('...');
      }

      // Add visible page numbers
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);

      return pages;
    }, [currentPage, totalPages, maxVisiblePages]);

    const handlePagePress = (page: number) => {
      if (!disabled && page >= 1 && page <= totalPages && page !== currentPage) {
        // Haptic feedback
        if (useHaptics && Platform.OS !== 'web') {
          haptic('selection');
        }
        onPageChange(page);
      }
    };

    const sizeConfig = {
      sm: {
        buttonSize: 28,
        fontSize: 12,
        iconSize: 14,
        gap: 1,
      },
      md: {
        buttonSize: 36,
        fontSize: 14,
        iconSize: 18,
        gap: 2,
      },
      lg: {
        buttonSize: 44,
        fontSize: 16,
        iconSize: 22,
        gap: 2,
      },
    }[size];

    const containerStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[sizeConfig.gap],
      opacity: disabled ? 0.5 : 1,
      ...style,
    };

    const buttonStyle: ViewStyle = {
      width: sizeConfig.buttonSize,
      height: sizeConfig.buttonSize,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8 as any,
      borderWidth: 1,
      borderColor: 'transparent',
    };

    // Animated Navigation Button Component
    const AnimatedNavigationButton = ({ 
      onPress, 
      disabled, 
      iconName, 
      iconSize,
      animated: localAnimated,
      animationConfig: localAnimationConfig,
    }: { 
      onPress: () => void;
      disabled: boolean;
      iconName: any;
      iconSize: number;
      animated: boolean;
      animationConfig?: any;
    }) => {
      const scale = useSharedValue(1);
      const { shouldAnimate: localShouldAnimate } = useAnimationStore();
      const localConfig = localAnimationConfig || {
        duration: { fast: 150, normal: 300, slow: 500 },
        spring: { damping: 20, stiffness: 300 }
      };
      
      const handlePressIn = () => {
        if (localAnimated && localShouldAnimate()) {
          scale.value = withSpring(0.8, { damping: 15, stiffness: 400 });
        }
      };
      
      const handlePressOut = () => {
        if (localAnimated && localShouldAnimate()) {
          scale.value = withSpring(1, localConfig.spring);
        }
      };
      
      const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: disabled ? 0.5 : 1,
      }));
      
      return (
        <AnimatedPressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          style={[
            animatedStyle,
            Platform.OS === 'web' && localAnimated && localShouldAnimate() && {
              transition: 'all 0.2s ease',
            } as any,
          ]}
        >
          <Symbol
            name={iconName}
            size={iconSize}
            color={disabled ? "#71717a" : "#09090b"}
          />
        </AnimatedPressable>
      );
    };

    const PageButton = ({ page, isActive }: { page: number | string; isActive: boolean }) => {
      const scale = useSharedValue(1);
      const opacity = useSharedValue(1);
      
      // Update animations when active state changes
      useEffect(() => {
        if (animated && shouldAnimate()) {
          if (animationType === 'scale' && isActive) {
            scale.value = withSpring(1.1, config.spring);
          } else {
            scale.value = withSpring(1, config.spring);
          }
          
          if (animationType === 'fade') {
            opacity.value = withTiming(isActive ? 1 : 0.6, { duration: typeof config.duration === 'number' ? config.duration : config.duration.normal });
          }
        }
      }, [isActive, scale, opacity]);
      
      const handlePressIn = () => {
        if (animated && shouldAnimate() && animationType === 'scale') {
          scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
        }
      };
      
      const handlePressOut = () => {
        if (animated && shouldAnimate() && animationType === 'scale') {
          scale.value = withSpring(isActive ? 1.1 : 1, config.spring);
        }
      };
      
      const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: animationType === 'fade' ? opacity.value : 1,
      }));
      
      if (page === '...') {
        return (
          <View style={[buttonStyle, { borderColor: 'transparent' }] as any}>
            <Text size={sizeConfig.fontSize as any} className="text-muted-foreground">
              •••
            </Text>
          </View>
        );
      }

      const pageNumber = page as number;
      const isDisabled = disabled || isActive;

      return (
        <AnimatedPressable
          onPress={() => handlePagePress(pageNumber)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isDisabled}
          entering={Platform.OS !== 'web' && animated && shouldAnimate() 
            ? FadeIn.duration(typeof config.duration === 'number' ? config.duration : config.duration.fast).delay(50)
            : undefined}
          style={[
            buttonStyle,
            animated && shouldAnimate() ? animatedStyle : {},
            Platform.OS === 'web' && animated && shouldAnimate() && {
              transition: 'all 0.2s ease',
            } as any,
          ]}
          className={`${
            isActive
              ? 'bg-primary border-primary'
              : 'bg-transparent border-border hover:bg-accent'
          }`}
        >
          <Text
            size={sizeConfig.fontSize as any}
            weight={isActive ? 'semibold' : 'normal'}
            className={isActive ? 'text-primary-foreground' : 'text-foreground'}
          >
            {pageNumber}
          </Text>
        </AnimatedPressable>
      );
    };

    if (variant === 'compact') {
      return (
        <View ref={ref} style={containerStyle} testID={testID}>
          <Button
            variant="outline"
            size={size === 'md' ? 'default' : size}
            onPress={() => handlePagePress(currentPage - 1)}
            disabled={disabled || currentPage === 1}
            leftIcon={<Symbol name="chevron.left" size={sizeConfig.iconSize} />}
          >
            Previous
          </Button>
          
          <View style={{ minWidth: 60, alignItems: 'center' }}>
            <Text size={sizeConfig.fontSize as any}>
              {currentPage} / {totalPages}
            </Text>
          </View>
          
          <Button
            variant="outline"
            size={size === 'md' ? 'default' : size}
            onPress={() => handlePagePress(currentPage + 1)}
            disabled={disabled || currentPage === totalPages}
            rightIcon={<Symbol name="chevron.right" size={sizeConfig.iconSize} />}
          >
            Next
          </Button>
        </View>
      );
    }

    if (variant === 'dots') {
      return (
        <View ref={ref} style={containerStyle} testID={testID}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            const DotButton = () => {
              const width = useSharedValue(page === currentPage ? 24 : 8);
              const scale = useSharedValue(1);
              const isCurrentPage = page === currentPage;
              
              useEffect(() => {
                if (animated && shouldAnimate()) {
                  width.value = withSpring(isCurrentPage ? 24 : 8, config.spring);
                }
              }, [isCurrentPage, width]);
              
              const handlePressIn = () => {
                if (animated && shouldAnimate()) {
                  scale.value = withSpring(0.8, { damping: 15, stiffness: 400 });
                }
              };
              
              const handlePressOut = () => {
                if (animated && shouldAnimate()) {
                  scale.value = withSpring(1, config.spring);
                }
              };
              
              const animatedStyle = useAnimatedStyle(() => ({
                width: width.value,
                transform: [{ scale: scale.value }],
              }));
              
              return (
                <AnimatedPressable
                  onPress={() => handlePagePress(page)}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  disabled={disabled || page === currentPage}
                  style={[
                    {
                      height: 8,
                      borderRadius: 4 as any,
                      opacity: page === currentPage ? 1 : 0.3,
                    },
                    animated && shouldAnimate() ? animatedStyle : { width: page === currentPage ? 24 : 8 },
                    Platform.OS === 'web' && animated && shouldAnimate() && {
                      transition: 'all 0.3s ease',
                    } as any,
                  ]}
                  className={page === currentPage ? 'bg-primary' : 'bg-muted-foreground'}
                />
              );
            };
            
            return <DotButton key={page} />;
          })}
        </View>
      );
    }

    // Default variant
    return (
      <View ref={ref} style={containerStyle} testID={testID}>
        {showFirstLast && currentPage > 2 && (
          <AnimatedNavigationButton
            onPress={() => handlePagePress(1)}
            disabled={disabled}
            iconName="play-back"
            iconSize={sizeConfig.iconSize}
            animated={animated}
            animationConfig={animationConfig}
          />
        )}

        {showPrevNext && (
          <AnimatedNavigationButton
            onPress={() => handlePagePress(currentPage - 1)}
            disabled={disabled || currentPage === 1}
            iconName="chevron-back"
            iconSize={sizeConfig.iconSize}
            animated={animated}
            animationConfig={animationConfig}
          />
        )}

        {visiblePages.map((page, index) => (
          <PageButton
            key={`${page}-${index}`}
            page={page}
            isActive={page === currentPage}
          />
        ))}

        {showPrevNext && (
          <AnimatedNavigationButton
            onPress={() => handlePagePress(currentPage + 1)}
            disabled={disabled || currentPage === totalPages}
            iconName="chevron-forward"
            iconSize={sizeConfig.iconSize}
            animated={animated}
            animationConfig={animationConfig}
          />
        )}

        {showFirstLast && currentPage < totalPages - 1 && (
          <AnimatedNavigationButton
            onPress={() => handlePagePress(totalPages)}
            disabled={disabled}
            iconName="play-forward"
            iconSize={sizeConfig.iconSize}
            animated={animated}
            animationConfig={animationConfig}
          />
        )}

        {showPageInfo && (
          <View style={{ marginLeft: spacing[4] }}>
            <Text size={sizeConfig.fontSize as any} className="text-muted-foreground">
              Page {currentPage} of {totalPages}
            </Text>
          </View>
        )}
      </View>
    );
  }
);

Pagination.displayName = 'Pagination';

// Pagination Info Component
export interface PaginationInfoProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  style?: ViewStyle;
  textSize?: 'xs' | 'sm' | 'md' | 'lg';
}

export const PaginationInfo: React.FC<PaginationInfoProps> = ({
  currentPage,
  pageSize,
  totalItems,
  style,
  textSize = 'sm',
}) => {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <View style={style}>
      <Text size={textSize === 'md' ? 'base' : textSize} className="text-muted-foreground">
        Showing {start}-{end} of {totalItems} items
      </Text>
    </View>
  );
};

// usePagination Hook
export interface UsePaginationOptions {
  totalItems: number;
  pageSize?: number;
  initialPage?: number;
}

export interface UsePaginationResult {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export const usePagination = ({
  totalItems,
  pageSize: initialPageSize = 10,
  initialPage = 1,
}: UsePaginationOptions): UsePaginationResult => {
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [pageSize, setPageSizeState] = React.useState(initialPageSize);

  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    // Reset to first page when page size changes
    setCurrentPage(1);
  };

  return {
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    startIndex,
    endIndex,
    nextPage,
    previousPage,
    goToPage,
    setPageSize,
    canGoNext: currentPage < totalPages,
    canGoPrevious: currentPage > 1,
  };
};