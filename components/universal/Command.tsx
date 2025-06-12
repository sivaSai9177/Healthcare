import React, { useState, useCallback, useEffect, useMemo, useRef, useDeferredValue, useTransition } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Symbol } from './Symbols';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Card } from './Card';
import { 
  AnimationVariant,
} from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  category?: string;
  keywords?: string[];
  shortcut?: string;
  onSelect: () => void;
  disabled?: boolean;
}

export type CommandAnimationType = 'modalOpen' | 'itemSelection' | 'searchResults' | 'none';

export interface CommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  placeholder?: string;
  emptyMessage?: string;
  showCategories?: boolean;
  maxHeight?: number;
  style?: ViewStyle;
  inputStyle?: ViewStyle;
  itemStyle?: ViewStyle;
  testID?: string;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: CommandAnimationType;
  animationDuration?: number;
  modalAnimation?: 'fade' | 'slide' | 'scale';
  itemAnimation?: boolean;
  searchAnimation?: boolean;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

const fuzzySearch = (query: string, text: string, keywords?: string[]): boolean => {
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();
  
  // Direct match
  if (lowerText.includes(lowerQuery)) return true;
  
  // Keywords match
  if (keywords?.some(keyword => keyword.toLowerCase().includes(lowerQuery))) return true;
  
  // Fuzzy match - check if all query characters appear in order
  let queryIndex = 0;
  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      queryIndex++;
    }
  }
  
  return queryIndex === lowerQuery.length;
};

const AnimatedModal = Animated.createAnimatedComponent(Modal);

// Command Item Component
const CommandItemComponent = ({
  item,
  index,
  isSelected,
  onPress,
  theme,
  spacing,
  itemStyle,
  animated,
  isAnimated,
  shouldAnimate,
  itemAnimation,
  config,
}: any) => {
  const itemScale = useSharedValue(1);
  const itemOpacity = useSharedValue(0);
  
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate() && itemAnimation) {
      itemOpacity.value = withTiming(1, { 
        duration: config.duration.fast,
        delay: index * 30,
      });
    } else {
      itemOpacity.value = 1;
    }
  }, [animated, isAnimated, shouldAnimate, itemAnimation, itemOpacity, config.duration.fast, index]);
  
  const itemAnimatedStyle = useAnimatedStyle(() => ({
    opacity: itemOpacity.value,
    transform: [{ scale: itemScale.value }],
  }));
  
  const handlePress = () => {
    if (animated && isAnimated && shouldAnimate() && itemAnimation) {
      itemScale.value = withSequence(
        withTiming(0.95, { duration: config.duration.fast / 2 }),
        withSpring(1, config.spring)
      );
    }
    onPress();
  };
  
  const ItemContainer = animated && isAnimated && shouldAnimate() && itemAnimation
    ? Animated.createAnimatedComponent(TouchableOpacity)
    : TouchableOpacity;
  
  return (
    <ItemContainer
      onPress={handlePress}
      disabled={item.disabled}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[3],
          backgroundColor: isSelected ? theme.accent : 'transparent',
          opacity: item.disabled ? 0.5 : 1,
        },
        itemStyle,
        animated && isAnimated && shouldAnimate() && itemAnimation
          ? itemAnimatedStyle
          : {},
      ]}
    >
      {item.icon && (
        <Symbol
          name="item.icon as any"
          size={20}
          color={item.disabled ? theme.mutedForeground : theme.foreground}
          style={{ marginRight: spacing[3] }}
        />
      )}
      
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '500',
            color: item.disabled ? theme.mutedForeground : theme.foreground,
          }}
        >
          {item.label}
        </Text>
        {item.description && (
          <Text
            style={{
              fontSize: 12,
              color: theme.mutedForeground,
              marginTop: spacing[0.5],
            }}
          >
            {item.description}
          </Text>
        )}
      </View>
      
      {item.shortcut && Platform.OS === 'web' && (
        <View
          style={{
            flexDirection: 'row',
            marginLeft: spacing[3],
          }}
        >
          {item.shortcut.split('+').map((key: string, idx: number) => (
            <View
              key={idx}
              style={{
                backgroundColor: theme.muted,
                paddingHorizontal: spacing[1.5],
                paddingVertical: spacing[0.5],
                borderRadius: 4,
                marginLeft: idx > 0 ? spacing[1] : 0,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: theme.mutedForeground,
                  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                }}
              >
                {key}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ItemContainer>
  );
};

export const Command = React.memo(React.forwardRef<View, CommandProps>(
  (
    {
      open,
      onOpenChange,
      items,
      placeholder = 'Type a command or search...',
      emptyMessage = 'No results found',
      showCategories = true,
      maxHeight = 400,
      style,
      inputStyle,
      itemStyle,
      testID,
      // Animation props
      animated = true,
      animationVariant = 'moderate',
      animationType = 'modalOpen',
      animationDuration,
      modalAnimation = 'slide',
      itemAnimation = true,
      searchAnimation = true,
      useHaptics = true,
      animationConfig,
    },
    ref
  ) => {
    const theme = useTheme();
    const { spacing } = useSpacing();
    const { shouldAnimate } = useAnimationStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isPending, startTransition] = useTransition();
    const flatListRef = useRef<FlatList>(null);
    const inputRef = useRef<TextInput>(null);
    
    // Get animation config
    const { config, isAnimated } = useAnimationVariant({
      variant: animationVariant,
      overrides: animationConfig,
    });
    
    const duration = animationDuration ?? config.duration.normal;
    
    // Animation values
    const modalOpacity = useSharedValue(0);
    const modalScale = useSharedValue(0.9);
    const modalTranslateY = useSharedValue(50);
    const searchIconRotation = useSharedValue(0);
    const listOpacity = useSharedValue(1);
    
    // Use deferred value for better search performance
    const deferredSearchQuery = useDeferredValue(searchQuery);
    
    // Search animation
    useEffect(() => {
      if (animated && isAnimated && shouldAnimate() && searchAnimation) {
        if (searchQuery) {
          // Rotate search icon when searching
          searchIconRotation.value = withSequence(
            withTiming(360, { duration: config.duration.normal }),
            withTiming(0, { duration: 0 })
          );
          
          // Fade list during search
          listOpacity.value = withSequence(
            withTiming(0.7, { duration: config.duration.fast }),
            withTiming(1, { duration: config.duration.fast })
          );
        }
      }
    }, [searchQuery, animated, isAnimated, shouldAnimate, searchAnimation, searchIconRotation, listOpacity, config]);

    // Filter and group items with deferred value
    const filteredItems = useMemo(() => {
      if (!deferredSearchQuery) return items;
      
      return items.filter(item =>
        fuzzySearch(deferredSearchQuery, item.label, item.keywords)
      );
    }, [items, deferredSearchQuery]);

    const groupedItems = useMemo(() => {
      if (!showCategories) return { '': filteredItems };
      
      return filteredItems.reduce((acc, item) => {
        const category = item.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
      }, {} as Record<string, CommandItem[]>);
    }, [filteredItems, showCategories]);

    const flattenedItems = useMemo(() => {
      const flattened: (CommandItem | { isCategory: true; title: string })[] = [];
      
      Object.entries(groupedItems).forEach(([category, categoryItems]) => {
        if (showCategories && category) {
          flattened.push({ isCategory: true, title: category });
        }
        flattened.push(...categoryItems);
      });
      
      return flattened;
    }, [groupedItems, showCategories]);

    // Reset when opened
    useEffect(() => {
      if (open) {
        setSearchQuery('');
        setSelectedIndex(0);
        setTimeout(() => inputRef.current?.focus(), 100);
        
        // Modal open animations
        if (animated && isAnimated && shouldAnimate()) {
          if (modalAnimation === 'fade') {
            modalOpacity.value = withTiming(1, { duration });
            modalScale.value = 1;
            modalTranslateY.value = 0;
          } else if (modalAnimation === 'scale') {
            modalOpacity.value = withTiming(1, { duration: config.duration.fast });
            modalScale.value = withSpring(1, config.spring);
            modalTranslateY.value = 0;
          } else if (modalAnimation === 'slide') {
            modalOpacity.value = withTiming(1, { duration: config.duration.fast });
            modalScale.value = 1;
            modalTranslateY.value = withSpring(0, config.spring);
          }
        }
      } else {
        // Modal close animations
        if (animated && isAnimated && shouldAnimate()) {
          modalOpacity.value = withTiming(0, { duration: config.duration.fast });
          modalScale.value = withTiming(0.9, { duration: config.duration.fast });
          modalTranslateY.value = withTiming(50, { duration: config.duration.fast });
        }
      }
    }, [open, animated, isAnimated, shouldAnimate, modalAnimation, duration, config, modalOpacity, modalScale, modalTranslateY]);

    const handleItemSelect = useCallback((item: CommandItem) => {
      if (item.disabled) return;
      
      if (useHaptics) {
        haptic('impact');
      }
      
      startTransition(() => {
        item.onSelect();
        onOpenChange(false);
      });
    }, [onOpenChange, useHaptics]);

    // Keyboard navigation
    useEffect(() => {
      if (!open || Platform.OS !== 'web') return;
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => {
            const selectableItems = flattenedItems.filter(item => !('isCategory' in item));
            const currentSelectableIndex = selectableItems.findIndex(
              (_, idx) => idx === prev
            );
            return Math.min(currentSelectableIndex + 1, selectableItems.length - 1);
          });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const selectableItems = flattenedItems.filter(item => !('isCategory' in item)) as CommandItem[];
          const selectedItem = selectableItems[selectedIndex];
          if (selectedItem && !selectedItem.disabled) {
            handleItemSelect(selectedItem);
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onOpenChange(false);
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, flattenedItems, selectedIndex, onOpenChange, handleItemSelect]);

    // Animated styles
    const modalAnimatedStyle = useAnimatedStyle(() => ({
      opacity: modalOpacity.value,
      transform: [
        { scale: modalScale.value },
        { translateY: modalTranslateY.value },
      ],
    }));
    
    const searchIconAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${searchIconRotation.value}deg` }],
    }));
    
    const listAnimatedStyle = useAnimatedStyle(() => ({
      opacity: listOpacity.value,
    }));
    
    // Memoize renderItem for better performance
    const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
      if ('isCategory' in item) {
        return (
          <View
            style={{
              paddingHorizontal: spacing[4],
              paddingVertical: spacing[2],
              backgroundColor: theme.muted,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: theme.mutedForeground,
                textTransform: 'uppercase',
              }}
            >
              {item.title}
            </Text>
          </View>
        );
      }

      const isSelected = index === selectedIndex;
      
      return (
        <CommandItemComponent
          item={item}
          index={index}
          isSelected={isSelected}
          onPress={() => handleItemSelect(item)}
          theme={theme}
          spacing={spacing}
          itemStyle={itemStyle}
          animated={animated}
          isAnimated={isAnimated}
          shouldAnimate={shouldAnimate}
          itemAnimation={itemAnimation}
          config={config}
        />
      );
    }, [selectedIndex, handleItemSelect, theme, spacing, itemStyle, animated, isAnimated, shouldAnimate, itemAnimation, config]);

    if (!open) return null;
    
    const ModalComponent = animated && isAnimated && shouldAnimate() ? AnimatedModal : Modal;

    return (
      <ModalComponent
        visible={open}
        transparent
        animationType={animated && isAnimated && shouldAnimate() ? "none" : "fade"}
        onRequestClose={() => onOpenChange(false)}
        testID={testID}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: Platform.OS === 'web' 
              ? `${theme.background}80` 
              : theme.background + '80',
            justifyContent: 'flex-start',
            paddingTop: Platform.OS === 'ios' ? 100 : 50,
          }}
          onPress={() => onOpenChange(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <Pressable>
              <Animated.View
                style={[
                  animated && isAnimated && shouldAnimate() ? modalAnimatedStyle : {},
                ]}
              >
                <Card
                  ref={ref}
                  style={[
                    {
                      marginHorizontal: spacing[4],
                      maxHeight,
                      overflow: 'hidden',
                    },
                    style,
                  ]}
                >
                  <View
                    style={[
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: spacing[4],
                        paddingVertical: spacing[3],
                        borderBottomWidth: 1,
                        borderBottomColor: theme.border,
                      },
                      inputStyle,
                    ]}
                  >
                    <Animated.View
                      style={[
                        { marginRight: spacing[3] },
                        animated && isAnimated && shouldAnimate() && searchAnimation
                          ? searchIconAnimatedStyle
                          : {},
                      ]}
                    >
                      <Symbol name="magnifyingglass"
                        size={20}
                        color={theme.mutedForeground}
                      />
                    </Animated.View>
                    <TextInput
                      ref={inputRef}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder={placeholder}
                      placeholderTextColor={theme.mutedForeground}
                      style={{
                        flex: 1,
                        fontSize: 16,
                        color: theme.foreground,
                        opacity: isPending ? 0.7 : 1,
                      }}
                      autoFocus
                      autoCorrect={false}
                      autoCapitalize="none"
                    />
                    {searchQuery.length > 0 && (
                      <Pressable
                        onPress={() => {
                          setSearchQuery('');
                          if (useHaptics) {
                            haptic('impact');
                          }
                        }}
                        style={{ marginLeft: spacing[2] }}
                      >
                        <Symbol name="xmark.circle"
                          size={20}
                          color={theme.mutedForeground}
                        />
                      </Pressable>
                    )}
                  </View>
                  
                  <Animated.View
                    style={[
                      { flex: 1 },
                      animated && isAnimated && shouldAnimate() && searchAnimation
                        ? listAnimatedStyle
                        : {},
                    ]}
                  >
                    <FlatList
                      ref={flatListRef}
                      data={flattenedItems}
                      renderItem={renderItem}
                      keyExtractor={(item, index) => 
                        'isCategory' in item ? `category-${item.title}` : item.id
                      }
                      showsVerticalScrollIndicator={false}
                      ListEmptyComponent={
                        <View
                          style={{
                            padding: spacing[8],
                            alignItems: 'center',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              color: theme.mutedForeground,
                            }}
                          >
                            {emptyMessage}
                          </Text>
                        </View>
                      }
                    />
                  </Animated.View>
                </Card>
              </Animated.View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </ModalComponent>
    );
  }
));

Command.displayName = 'Command';

// Command trigger button helper
export interface CommandTriggerProps {
  onPress: () => void;
  shortcut?: string;
  label?: string;
  style?: ViewStyle;
  testID?: string;
}

export const CommandTrigger: React.FC<CommandTriggerProps> = ({
  onPress,
  shortcut = '⌘K',
  label = 'Search commands...',
  style,
  testID,
}) => {
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({ variant: 'moderate' });
  
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  const handlePress = () => {
    if (shouldAnimate() && isAnimated) {
      scale.value = withSequence(
        withTiming(0.95, { duration: config.duration.fast / 2 }),
        withSpring(1, config.spring)
      );
      
      haptic('impact');
    }
    onPress();
  };
  
  const AnimatedTrigger = shouldAnimate() && isAnimated
    ? Animated.createAnimatedComponent(TouchableOpacity)
    : TouchableOpacity;

  return (
    <AnimatedTrigger
      onPress={handlePress}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[2],
          backgroundColor: theme.muted,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: theme.border,
        },
        style,
        shouldAnimate() && isAnimated ? animatedStyle : {},
      ]}
      testID={testID}
    >
      <Symbol name="magnifyingglass"
        size={16}
        color={theme.mutedForeground}
        style={{ marginRight: spacing[2] }}
      />
      <Text
        style={{
          flex: 1,
          fontSize: 14,
          color: theme.mutedForeground,
        }}
      >
        {label}
      </Text>
      {Platform.OS === 'web' && (
        <View
          style={{
            backgroundColor: theme.background,
            paddingHorizontal: spacing[2],
            paddingVertical: spacing[1],
            borderRadius: 4,
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: theme.mutedForeground,
              fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
            }}
          >
            {shortcut}
          </Text>
        </View>
      )}
    </AnimatedTrigger>
  );
};