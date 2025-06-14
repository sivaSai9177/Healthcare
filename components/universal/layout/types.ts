import { ViewStyle } from 'react-native';
import { SpacingScale } from '@/lib/design/spacing';

// Common layout style props that can be applied to Box, Stack, and other layout components
export interface LayoutStyleProps {
  // Spacing props
  p?: SpacingScale | number;
  px?: SpacingScale | number;
  py?: SpacingScale | number;
  pt?: SpacingScale | number;
  pr?: SpacingScale | number;
  pb?: SpacingScale | number;
  pl?: SpacingScale | number;
  padding?: SpacingScale | number;
  
  m?: SpacingScale | number;
  mx?: SpacingScale | number;
  my?: SpacingScale | number;
  mt?: SpacingScale | number;
  mr?: SpacingScale | number;
  mb?: SpacingScale | number;
  ml?: SpacingScale | number;
  margin?: SpacingScale | number;
  
  // Flex props
  flex?: number;
  flexDirection?: ViewStyle['flexDirection'];
  flexWrap?: ViewStyle['flexWrap'];
  flexGrow?: ViewStyle['flexGrow'];
  flexShrink?: ViewStyle['flexShrink'];
  flexBasis?: ViewStyle['flexBasis'];
  alignItems?: ViewStyle['alignItems'];
  alignSelf?: ViewStyle['alignSelf'];
  justifyContent?: ViewStyle['justifyContent'];
  
  // Size props
  width?: ViewStyle['width'];
  height?: ViewStyle['height'];
  minWidth?: ViewStyle['minWidth'];
  minHeight?: ViewStyle['minHeight'];
  maxWidth?: ViewStyle['maxWidth'];
  maxHeight?: ViewStyle['maxHeight'];
  
  // Position props
  position?: ViewStyle['position'];
  top?: ViewStyle['top'];
  right?: ViewStyle['right'];
  bottom?: ViewStyle['bottom'];
  left?: ViewStyle['left'];
  zIndex?: ViewStyle['zIndex'];
  
  // Border props
  borderWidth?: number;
  borderTopWidth?: number;
  borderRightWidth?: number;
  borderBottomWidth?: number;
  borderLeftWidth?: number;
  borderRadius?: number;
  borderTheme?: string;
  rounded?: string;
  
  // Background props
  bg?: string;
  bgTheme?: string;
  backgroundColor?: ViewStyle['backgroundColor'];
  
  // Other common props
  opacity?: ViewStyle['opacity'];
  overflow?: ViewStyle['overflow'];
  gap?: SpacingScale | number;
}

// Helper to convert layout props to styles
export function layoutPropsToStyle(props: LayoutStyleProps): ViewStyle {
  const style: ViewStyle = {};
  
  // Padding
  if (props.p !== undefined) style.padding = props.p;
  if (props.padding !== undefined) style.padding = props.padding;
  if (props.px !== undefined) {
    style.paddingHorizontal = props.px;
  }
  if (props.py !== undefined) {
    style.paddingVertical = props.py;
  }
  if (props.pt !== undefined) style.paddingTop = props.pt;
  if (props.pr !== undefined) style.paddingRight = props.pr;
  if (props.pb !== undefined) style.paddingBottom = props.pb;
  if (props.pl !== undefined) style.paddingLeft = props.pl;
  
  // Margin
  if (props.m !== undefined) style.margin = props.m;
  if (props.margin !== undefined) style.margin = props.margin;
  if (props.mx !== undefined) {
    style.marginHorizontal = props.mx;
  }
  if (props.my !== undefined) {
    style.marginVertical = props.my;
  }
  if (props.mt !== undefined) style.marginTop = props.mt;
  if (props.mr !== undefined) style.marginRight = props.mr;
  if (props.mb !== undefined) style.marginBottom = props.mb;
  if (props.ml !== undefined) style.marginLeft = props.ml;
  
  // Flex
  if (props.flex !== undefined) style.flex = props.flex;
  if (props.flexDirection !== undefined) style.flexDirection = props.flexDirection;
  if (props.flexWrap !== undefined) style.flexWrap = props.flexWrap;
  if (props.flexGrow !== undefined) style.flexGrow = props.flexGrow;
  if (props.flexShrink !== undefined) style.flexShrink = props.flexShrink;
  if (props.flexBasis !== undefined) style.flexBasis = props.flexBasis;
  if (props.alignItems !== undefined) style.alignItems = props.alignItems;
  if (props.alignSelf !== undefined) style.alignSelf = props.alignSelf;
  if (props.justifyContent !== undefined) style.justifyContent = props.justifyContent;
  
  // Size
  if (props.width !== undefined) style.width = props.width;
  if (props.height !== undefined) style.height = props.height;
  if (props.minWidth !== undefined) style.minWidth = props.minWidth;
  if (props.minHeight !== undefined) style.minHeight = props.minHeight;
  if (props.maxWidth !== undefined) style.maxWidth = props.maxWidth;
  if (props.maxHeight !== undefined) style.maxHeight = props.maxHeight;
  
  // Position
  if (props.position !== undefined) style.position = props.position;
  if (props.top !== undefined) style.top = props.top;
  if (props.right !== undefined) style.right = props.right;
  if (props.bottom !== undefined) style.bottom = props.bottom;
  if (props.left !== undefined) style.left = props.left;
  if (props.zIndex !== undefined) style.zIndex = props.zIndex;
  
  // Border
  if (props.borderWidth !== undefined) style.borderWidth = props.borderWidth;
  if (props.borderTopWidth !== undefined) style.borderTopWidth = props.borderTopWidth;
  if (props.borderRightWidth !== undefined) style.borderRightWidth = props.borderRightWidth;
  if (props.borderBottomWidth !== undefined) style.borderBottomWidth = props.borderBottomWidth;
  if (props.borderLeftWidth !== undefined) style.borderLeftWidth = props.borderLeftWidth;
  if (props.borderRadius !== undefined) style.borderRadius = props.borderRadius;
  
  // Background
  if (props.backgroundColor !== undefined) style.backgroundColor = props.backgroundColor;
  
  // Other
  if (props.opacity !== undefined) style.opacity = props.opacity;
  if (props.overflow !== undefined) style.overflow = props.overflow;
  if (props.gap !== undefined) style.gap = props.gap;
  
  return style;
}