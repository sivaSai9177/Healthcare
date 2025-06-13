import React from 'react';
import { View, ViewStyle, Platform } from 'react-native';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { useTheme } from '@/lib/theme/provider';

import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { AnimationVariant } from '@/lib/design';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { useAnimationStore } from '@/lib/stores/animation-store';

export type SymbolSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type SymbolAnimationType = 'scale' | 'rotate' | 'fade' | 'bounce' | 'none';

export interface SymbolProps extends Omit<SymbolViewProps, 'size' | 'style'> {
  size?: SymbolSize | number;
  color?: string;
  style?: ViewStyle;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: SymbolAnimationType;
  animationDuration?: number;
  animationDelay?: number;
  animateOnMount?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

// Size mapping
const sizeMap: Record<SymbolSize, number> = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
  xxl: 48,
};

// Common icon name mappings for easy migration from lucide-react
export const symbolNames = {
  // Navigation
  arrowLeft: 'arrow.left',
  arrowRight: 'arrow.right',
  arrowUp: 'arrow.up',
  arrowDown: 'arrow.down',
  chevronLeft: 'chevron.left',
  chevronRight: 'chevron.right',
  chevronUp: 'chevron.up',
  chevronDown: 'chevron.down',
  
  // Actions
  plus: 'plus',
  minus: 'minus',
  x: 'xmark',
  close: 'xmark',
  check: 'checkmark',
  search: 'magnifyingglass',
  filter: 'line.3.horizontal.decrease',
  settings: 'gearshape',
  edit: 'pencil',
  trash: 'trash',
  download: 'arrow.down.circle',
  upload: 'arrow.up.circle',
  share: 'square.and.arrow.up',
  copy: 'doc.on.doc',
  
  // UI Elements
  menu: 'line.3.horizontal',
  moreHorizontal: 'ellipsis',
  moreVertical: 'ellipsis.vertical',
  grid: 'square.grid.2x2',
  list: 'list.bullet',
  home: 'house',
  user: 'person',
  users: 'person.2',
  bell: 'bell',
  calendar: 'calendar',
  clock: 'clock',
  
  // Status
  info: 'info.circle',
  warning: 'exclamationmark.triangle',
  error: 'xmark.circle',
  success: 'checkmark.circle',
  help: 'questionmark.circle',
  
  // Media
  image: 'photo',
  video: 'video',
  camera: 'camera',
  mic: 'mic',
  
  // Files
  file: 'doc',
  folder: 'folder',
  
  // Animals (as planned)
  dog: 'dog',
  cat: 'cat',
  bird: 'bird',
  fish: 'fish.fill',
  rabbit: 'hare',
  
  // Nature
  sun: 'sun.max',
  moon: 'moon',
  star: 'star',
  cloud: 'cloud',
  
  // Business/Healthcare
  briefcase: 'briefcase',
  heart: 'heart',
  heartPulse: 'heart.text.square',
  pill: 'pills',
  stethoscope: 'stethoscope',
  
  // Social
  thumbsUp: 'hand.thumbsup',
  thumbsDown: 'hand.thumbsdown',
  bookmark: 'bookmark',
  
  // Arrows
  arrowUpRight: 'arrow.up.right',
  arrowDownLeft: 'arrow.down.left',
  refresh: 'arrow.clockwise',
  
  // Common UI
  eye: 'eye',
  eyeOff: 'eye.slash',
  lock: 'lock',
  unlock: 'lock.open',
  key: 'key',
  shield: 'shield',
  
  // Communication
  mail: 'envelope',
  phone: 'phone',
  message: 'message',
  
  // E-commerce
  cart: 'cart',
  creditCard: 'creditcard',
  
  // Development
  code: 'chevron.left.slash.chevron.right',
  terminal: 'terminal',
  bug: 'ant',
  
  // Math/Finance
  calculator: 'plusminus.circle',
  chartBar: 'chart.bar',
  chartLine: 'chart.line.uptrend.xyaxis',
  chartPie: 'chart.pie',
} as const;

const AnimatedSymbolView = Animated.createAnimatedComponent(SymbolView);

export const Symbol = React.forwardRef<View, SymbolProps>(({
  name,
  size = 'md',
  color,
  style,
  weight = 'regular',
  animated = true,
  animationVariant = 'subtle',
  animationType = 'scale',
  animationDuration,
  animationDelay = 0,
  animateOnMount = true,
  animationConfig,
  ...props
}, ref) => {
  const theme = useTheme();
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  const duration = animationDuration ?? config.duration.fast;
  
  // Convert size to number
  const iconSize = typeof size === 'number' ? size : sizeMap[size];
  
  // Use theme color if not specified
  const iconColor = color || theme.foreground;
  
  // Animation values
  const scale = useSharedValue(animationType === 'scale' && animateOnMount ? 0.8 : 1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(animationType === 'fade' && animateOnMount ? 0 : 1);
  
  React.useEffect(() => {
    if (animated && isAnimated && shouldAnimate() && animateOnMount) {
      if (animationType === 'scale') {
        scale.value = withSpring(1, config.spring);
      } else if (animationType === 'rotate') {
        rotation.value = withSpring(360, config.spring);
      } else if (animationType === 'fade') {
        opacity.value = withTiming(1, { duration });
      } else if (animationType === 'bounce') {
        scale.value = withSequence(
          withSpring(1.2, { ...config.spring, damping: 5 }),
          withSpring(1, config.spring)
        );
      }
    }
  }, [animated, isAnimated, shouldAnimate, animateOnMount, animationType, duration, config.spring]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));
  
  const getEntranceAnimation = () => {
    if (!animated || !isAnimated || !shouldAnimate() || animationType === 'none' || Platform.OS === 'web') return undefined;
    
    if (animationType === 'scale') {
      return ZoomIn.duration(duration).delay(animationDelay);
    }
    return FadeIn.duration(duration).delay(animationDelay);
  };
  
  const SymbolComponent = animated && isAnimated && shouldAnimate() ? AnimatedSymbolView : SymbolView;
  
  return (
    <SymbolComponent
      ref={ref}
      name={name}
      size={iconSize}
      tintColor={iconColor}
      weight={weight}
      style={[
        animated && isAnimated && shouldAnimate() ? animatedStyle : {},
        style,
      ]}
      entering={getEntranceAnimation()}
      {...props}
    />
  );
});

Symbol.displayName = 'Symbol';

// Helper hook for easy icon name conversion
export function useSymbolName(lucideName: string): string {
  // Convert lucide-react style names to SF Symbols
  const mappedName = symbolNames[lucideName as keyof typeof symbolNames];
  return mappedName || lucideName;
}

// Preset icon components for common use cases
export const CheckIcon = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="checkmark" {...props} />
);

export const CloseIcon = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="xmark" {...props} />
);

export const ChevronDownIcon = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="chevron.down" {...props} />
);

export const ChevronUpIcon = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="chevron.up" {...props} />
);

export const ChevronLeftIcon = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="chevron.left" {...props} />
);

export const ChevronRightIcon = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="chevron.right" {...props} />
);

export const SearchIcon = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="magnifyingglass" {...props} />
);

export const MenuIcon = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="line.3.horizontal" {...props} />
);

export const SettingsIcon = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="gearshape" {...props} />
);

export const UserIcon = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="person" {...props} />
);

export const HomeIcon = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="house" {...props} />
);

export const BellIcon = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="bell" {...props} />
);

export const HeartIcon = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="heart" {...props} />
);

export const StarIcon = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="star" {...props} />
);

export const PlusIcon = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="plus" {...props} />
);

export const MinusIcon = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="minus" {...props} />
);

export const TrashIcon = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="trash" {...props} />
);

export const EditIcon = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="pencil" {...props} />
);

export const InfoIcon = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="info.circle" {...props} />
);

export const WarningIcon = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="exclamationmark.triangle" {...props} />
);

export const ErrorIcon = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="xmark.circle" {...props} />
);

export const SuccessIcon = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="checkmark.circle" {...props} />
);

// Additional icons for shadcn components
export const Folder = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="folder" {...props} />
);

export const Forward = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="arrow.right.square" {...props} />
);

export const MoreHorizontal = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="ellipsis" {...props} />
);

export const Trash2 = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="trash" {...props} />
);

export const BadgeCheck = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="checkmark.seal" {...props} />
);

export const Bell = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="bell" {...props} />
);

export const ChevronsUpDown = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="chevron.up.chevron.down" {...props} />
);

export const CreditCard = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="creditcard" {...props} />
);

export const LogOut = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="arrow.right.square" {...props} />
);

export const Sparkles = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="sparkles" {...props} />
);

export const Circle = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="circle" {...props} />
);

export const PanelLeft = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="sidebar.left" {...props} />
);

// Healthcare specific icons
export const Users = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="person.2" {...props} />
);

export const Heart = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="heart" {...props} />
);

export const Activity = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="waveform.path.ecg" {...props} />
);

export const Thermometer = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="thermometer" {...props} />
);

export const Clock = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="clock" {...props} />
);

export const AlertCircle = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="exclamationmark.circle" {...props} />
);

export const TrendingUp = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="arrow.up.right" {...props} />
);

export const TrendingDown = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="arrow.down.right" {...props} />
);

// Organization specific icons
export const Building2 = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="building.2" {...props} />
);

export const Globe = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="globe" {...props} />
);

export const Briefcase = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="briefcase" {...props} />
);

export const FileText = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="doc.text" {...props} />
);

// Additional missing icons
export const Mail = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="envelope" {...props} />
);

export const ArrowLeft = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="arrow.left" {...props} />
);

export const RefreshCw = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="arrow.clockwise" {...props} />
);

export const Settings = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="gearshape" {...props} />
);

export const Search = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="magnifyingglass" {...props} />
);

export const Download = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="arrow.down.circle" {...props} />
);

export const CheckCircle = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="checkmark.circle" {...props} />
);

export const Info = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="info.circle" {...props} />
);

export const Database = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="externaldrive" {...props} />
);

export const Shield = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="shield" {...props} />
);

// Add missing icons
export const XCircle = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="xmark.circle" {...props} />
);

export const User = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="person" {...props} />
);

export const HardDrive = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="externaldrive" {...props} />
);

export const Lock = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="lock" {...props} />
);

export const ChevronRight = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="chevron.right" {...props} />
);

export const UserPlus = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="person.badge.plus" {...props} />
);

export const MoreVertical = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="ellipsis.vertical" {...props} />
);

export const Calendar = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="calendar" {...props} />
);

export const Filter = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="line.3.horizontal.decrease" {...props} />
);

export const History = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="clock.arrow.circlepath" {...props} />
);

export const Target = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="target" {...props} />
);

export const Award = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="star.circle" {...props} />
);