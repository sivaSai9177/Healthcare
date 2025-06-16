import React from 'react';
import { View, ViewStyle, Platform } from 'react-native';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { MaterialIcons } from '@expo/vector-icons';
import { cn } from '@/lib/core/utils';
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
  
  // Animals
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

// Mapping SF Symbols to Material Icons
const sfToMaterialIconMap: Record<string, string> = {
  // Navigation
  'arrow.left': 'arrow-back',
  'arrow.right': 'arrow-forward',
  'arrow.up': 'arrow-upward',
  'arrow.down': 'arrow-downward',
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  'chevron.up': 'expand-less',
  'chevron.down': 'expand-more',
  
  // Actions
  'plus': 'add',
  'minus': 'remove',
  'xmark': 'close',
  'checkmark': 'check',
  'magnifyingglass': 'search',
  'line.3.horizontal.decrease': 'filter-list',
  'gearshape': 'settings',
  'pencil': 'edit',
  'trash': 'delete',
  'arrow.down.circle': 'download',
  'arrow.up.circle': 'upload',
  'square.and.arrow.up': 'share',
  'doc.on.doc': 'content-copy',
  
  // UI Elements
  'line.3.horizontal': 'menu',
  'ellipsis': 'more-horiz',
  'ellipsis.vertical': 'more-vert',
  'square.grid.2x2': 'grid-view',
  'list.bullet': 'list',
  'house': 'home',
  'person': 'person',
  'person.2': 'people',
  'bell': 'notifications',
  'calendar': 'calendar-today',
  'clock': 'schedule',
  
  // Status
  'info.circle': 'info',
  'exclamationmark.triangle': 'warning',
  'xmark.circle': 'error',
  'checkmark.circle': 'check-circle',
  'questionmark.circle': 'help',
  
  // Media
  'photo': 'image',
  'video': 'videocam',
  'camera': 'camera-alt',
  'mic': 'mic',
  
  // Files
  'doc': 'description',
  'folder': 'folder',
  
  // Nature
  'sun.max': 'light-mode',
  'moon': 'dark-mode',
  'star': 'star',
  'cloud': 'cloud',
  
  // Business/Healthcare
  'briefcase': 'work',
  'heart': 'favorite',
  'heart.text.square': 'monitor-heart',
  'pills': 'medication',
  'stethoscope': 'medical-services',
  
  // Social
  'hand.thumbsup': 'thumb-up',
  'hand.thumbsdown': 'thumb-down',
  'bookmark': 'bookmark',
  
  // Common UI
  'eye': 'visibility',
  'eye.slash': 'visibility-off',
  'lock': 'lock',
  'lock.open': 'lock-open',
  'key': 'key',
  'shield': 'shield',
  
  // Communication
  'envelope': 'mail',
  'phone': 'phone',
  'message': 'message',
  
  // E-commerce
  'cart': 'shopping-cart',
  'creditcard': 'credit-card',
  
  // Development
  'chevron.left.slash.chevron.right': 'code',
  'terminal': 'terminal',
  'ant': 'bug-report',
  
  // Math/Finance
  'plusminus.circle': 'calculate',
  'chart.bar': 'bar-chart',
  'chart.line.uptrend.xyaxis': 'show-chart',
  'chart.pie': 'pie-chart',
  
  // Additional mappings
  'arrow.clockwise': 'refresh',
  'externaldrive': 'storage',
  'person.badge.plus': 'person-add',
  'clock.arrow.circlepath': 'history',
  'target': 'my-location',
  'star.circle': 'stars',
  'building.2': 'business',
  'globe': 'public',
  'doc.text': 'article',
  'exclamationmark.circle': 'error-outline',
  'arrow.up.right': 'trending-up',
  'arrow.down.right': 'trending-down',
  'sidebar.left': 'view-sidebar',
  'waveform.path.ecg': 'monitor-heart',
  'thermometer': 'device-thermostat',
  'checkmark.seal': 'verified',
  'chevron.up.chevron.down': 'unfold-more',
  'arrow.right.square': 'logout',
  'sparkles': 'auto-awesome',
  'circle': 'radio-button-unchecked',
  
  // Default fallback
  'default': 'help-outline',
};

const AnimatedSymbolView = Animated.createAnimatedComponent(SymbolView);
const AnimatedMaterialIcons = Animated.createAnimatedComponent(MaterialIcons);

export const Symbol = React.forwardRef<View, SymbolProps>(({
  name,
  size = 'md',
  color,
  style,
  weight = 'regular',
  animated = true,
  animationType = 'scale',
  animationDuration,
  animationDelay = 0,
  animateOnMount = true,
  animationConfig,
  ...props
}, ref) => {
  const { shouldAnimate } = useAnimationStore();
  
  const config = animationConfig || {
    duration: { fast: 150, normal: 300 },
    spring: { damping: 20, stiffness: 300 }
  };
  
  const duration = animationDuration ?? config.duration.fast;
  
  // Convert size to number
  const iconSize = typeof size === 'number' ? size : sizeMap[size];
  
  // Animation values
  const scale = useSharedValue(animationType === 'scale' && animateOnMount ? 0.8 : 1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(animationType === 'fade' && animateOnMount ? 0 : 1);
  
  React.useEffect(() => {
    if (animated && shouldAnimate() && animateOnMount) {
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
  }, [animated, shouldAnimate, animateOnMount, animationType, duration, config.spring]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));
  
  const getEntranceAnimation = () => {
    if (!animated || !shouldAnimate() || animationType === 'none') return undefined;
    
    if (animationType === 'scale') {
      return ZoomIn.duration(duration).delay(animationDelay);
    }
    return FadeIn.duration(duration).delay(animationDelay);
  };
  
  // Use Material Icons on non-iOS platforms
  if (Platform.OS !== 'ios') {
    const materialIconName = sfToMaterialIconMap[name] || sfToMaterialIconMap['default'];
    
    // Don't animate Material Icons on web to avoid setNativeProps error
    const shouldAnimateIcon = animated && shouldAnimate() && Platform.OS !== 'web';
    const MaterialIconComponent = shouldAnimateIcon ? AnimatedMaterialIcons : MaterialIcons;
    
    // Material Icons doesn't support entering prop, so we don't pass it
    return (
      <MaterialIconComponent
        ref={ref}
        name={materialIconName as any}
        size={iconSize}
        color={color}
        style={[
          shouldAnimateIcon ? animatedStyle : {},
          style,
        ]}
        {...props}
      />
    );
  }
  
  // Use SF Symbols on iOS
  const SymbolComponent = animated && shouldAnimate() ? AnimatedSymbolView : SymbolView;
  
  return (
    <SymbolComponent
      ref={ref}
      name={name}
      size={iconSize}
      tintColor={color}
      weight={weight}
      style={[
        animated && shouldAnimate() ? animatedStyle : {},
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

export const SearchSymbol = (props: Omit<SymbolProps, 'name'>) => (
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

// Authentication icons
export const Eye = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="eye" {...props} />
);

export const EyeOff = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="eye.slash" {...props} />
);

// Additional icons for organization features
export const Check = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="checkmark" {...props} />
);

export const X = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="xmark" {...props} />
);

export const Send = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="paperplane" {...props} />
);

// Removed Search export to avoid conflict with interaction/Search component
// Use SearchIcon or SearchSymbol instead

export const BellOff = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="bell.slash" {...props} />
);

export const Smartphone = (props: Omit<SymbolProps, 'name'>) => (
  <Symbol name="iphone" {...props} />
);