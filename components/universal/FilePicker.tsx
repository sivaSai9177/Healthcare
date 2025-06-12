import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  Platform,
  ViewStyle,
  TextStyle,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  FadeIn,
  FadeOut,
  Layout,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { Symbol } from './Symbols';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Card } from './Card';
import { Button } from './Button';
import { 
  AnimationVariant,
  getAnimationConfig,
  SpacingScale,
} from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

export interface FileItem {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
  type?: 'image' | 'document' | 'video' | 'audio' | 'other';
}

export type FilePickerAnimationType = 'dragHover' | 'uploadProgress' | 'fadeIn' | 'none';

export interface FilePickerProps {
  value?: FileItem[];
  onChange?: (files: FileItem[]) => void;
  accept?: string | string[];
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in bytes
  showPreview?: boolean;
  variant?: 'default' | 'dropzone' | 'button';
  disabled?: boolean;
  placeholder?: string;
  style?: ViewStyle;
  previewStyle?: ViewStyle;
  testID?: string;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: FilePickerAnimationType;
  animationDuration?: number;
  dragAnimation?: boolean;
  uploadAnimation?: boolean;
  previewAnimation?: 'zoomIn' | 'fadeIn' | 'slideUp';
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return 'Unknown size';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const getFileIcon = (type?: string): string => {
  switch (type) {
    case 'image':
      return 'image';
    case 'document':
      return 'document-text';
    case 'video':
      return 'videocam';
    case 'audio':
      return 'musical-notes';
    default:
      return 'document';
  }
};

const AnimatedView = Animated.View;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Animated file preview item
const AnimatedFilePreview = ({ 
  file, 
  index, 
  onRemove, 
  theme, 
  spacing,
  animated,
  shouldAnimate,
  previewAnimation,
  animationDuration,
}: any) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    if (animated && shouldAnimate()) {
      if (previewAnimation === 'zoomIn') {
        scale.value = withSpring(1, { damping: 10, stiffness: 200 });
        opacity.value = withTiming(1, { duration: animationDuration });
      } else if (previewAnimation === 'fadeIn') {
        scale.value = 1;
        opacity.value = withTiming(1, { duration: animationDuration });
      } else if (previewAnimation === 'slideUp') {
        scale.value = 1;
        opacity.value = withTiming(1, { duration: animationDuration });
      }
    } else {
      scale.value = 1;
      opacity.value = 1;
    }
  }, [animated, shouldAnimate, previewAnimation]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  return (
    <AnimatedView
      style={[{
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[3],
        backgroundColor: theme.muted,
        borderRadius: 8,
        marginBottom: spacing[2],
      }, animatedStyle]}
    >
      {file.type === 'image' && file.uri ? (
        <Image
          source={{ uri: file.uri }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 4,
            marginRight: spacing[2],
          }}
        />
      ) : (
        <Symbol
          name="getFileIcon(file.type) as any"
          size={24}
          color={theme.mutedForeground}
          style={{ marginRight: spacing[2] }}
        />
      )}
      
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.foreground, fontSize: 14 }}>
          {file.name}
        </Text>
        <Text style={{ color: theme.mutedForeground, fontSize: 12 }}>
          {formatFileSize(file.size)}
        </Text>
      </View>
      
      <Pressable 
        onPress={() => onRemove(index)}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <Symbol name="xmark.circle"
          size={20}
          color={theme.mutedForeground}
        />
      </Pressable>
    </AnimatedView>
  );
};

export const FilePicker = React.forwardRef<View, FilePickerProps>(
  (
    {
      value = [],
      onChange,
      accept,
      multiple = false,
      maxFiles = 10,
      maxSize,
      showPreview = true,
      variant = 'default',
      disabled = false,
      placeholder = 'Select files',
      style,
      previewStyle,
      testID,
      // Animation props
      animated = true,
      animationVariant = 'moderate',
      animationType = 'fadeIn',
      animationDuration,
      dragAnimation = true,
      uploadAnimation = true,
      previewAnimation = 'zoomIn',
      useHaptics = true,
      animationConfig,
    },
    ref
  ) => {
    const theme = useTheme();
    const { spacing } = useSpacing();
    const { shouldAnimate } = useAnimationStore();
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    
    // Get animation config
    const { config, isAnimated } = useAnimationVariant({
      variant: animationVariant,
      overrides: animationConfig,
    });
    
    const duration = animationDuration ?? config.duration.normal;
    
    // Animation values
    const dragScale = useSharedValue(1);
    const dragOpacity = useSharedValue(1);
    const uploadProgress = useSharedValue(0);
    
    // Drag hover animation
    useEffect(() => {
      if (animated && isAnimated && shouldAnimate() && dragAnimation) {
        if (isDragging) {
          dragScale.value = withSpring(1.02, config.spring);
          dragOpacity.value = withTiming(0.9, { duration: config.duration.fast });
        } else {
          dragScale.value = withSpring(1, config.spring);
          dragOpacity.value = withTiming(1, { duration: config.duration.fast });
        }
      }
    }, [isDragging, animated, isAnimated, shouldAnimate, dragAnimation]);
    
    // Animated styles
    const dropzoneAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: dragScale.value }],
      opacity: dragOpacity.value,
    }));
    
    const uploadProgressStyle = useAnimatedStyle(() => ({
      width: `${uploadProgress.value}%`,
    }));

    const pickImage = async () => {
      // Simplified implementation - in a real app, you would install and use expo-image-picker
      Alert.alert(
        'File Picker',
        'To enable file picking, install expo-image-picker:\n\nbun add expo-image-picker',
        [{ text: 'OK' }]
      );
      
      // Demo file for testing
      const demoFile: FileItem = {
        uri: 'https://via.placeholder.com/150',
        name: 'demo-image.jpg',
        type: 'image',
        size: 1024 * 50, // 50KB
      };
      
      handleFilesSelected([demoFile]);
    };

    const pickDocument = async () => {
      // Simplified implementation - in a real app, you would install and use expo-document-picker
      Alert.alert(
        'Document Picker',
        'To enable document picking, install expo-document-picker:\n\nbun add expo-document-picker',
        [{ text: 'OK' }]
      );
      
      // Demo file for testing
      const demoFile: FileItem = {
        uri: 'demo://document.pdf',
        name: 'demo-document.pdf',
        type: 'document',
        size: 1024 * 100, // 100KB
      };
      
      handleFilesSelected([demoFile]);
    };

    const handleFilesSelected = (newFiles: FileItem[]) => {
      if (disabled) return;

      // Check file size
      if (maxSize) {
        const oversizedFiles = newFiles.filter(file => file.size && file.size > maxSize);
        if (oversizedFiles.length > 0) {
          Alert.alert('File too large', `Maximum file size is ${formatFileSize(maxSize)}`);
          if (useHaptics) {
            haptic('error');
          }
          return;
        }
      }

      let updatedFiles: FileItem[];
      if (multiple) {
        updatedFiles = [...value, ...newFiles].slice(0, maxFiles);
      } else {
        updatedFiles = newFiles.slice(0, 1);
      }

      if (useHaptics) {
        haptic('success');
      }
      
      // Simulate upload progress animation
      if (animated && isAnimated && shouldAnimate() && uploadAnimation) {
        uploadProgress.value = 0;
        uploadProgress.value = withTiming(100, { duration: 1000 });
      }

      onChange?.(updatedFiles);
    };

    const removeFile = (index: number) => {
      if (useHaptics) {
        haptic('impact');
      }
      const updatedFiles = value.filter((_, i) => i !== index);
      onChange?.(updatedFiles);
    };

    const renderDropzone = () => {
      const DropzoneComponent = animated && isAnimated && shouldAnimate() ? AnimatedPressable : Pressable;
      
      return (
        <DropzoneComponent
          onPress={pickDocument}
          disabled={disabled || loading}
          style={[
            {
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: disabled ? theme.mutedForeground : theme.border,
              borderRadius: 8,
              padding: spacing[8],
              alignItems: 'center',
              backgroundColor: disabled ? theme.muted : theme.card,
              opacity: loading ? 0.7 : 1,
            },
            animated && isAnimated && shouldAnimate() && dragAnimation ? dropzoneAnimatedStyle : {},
            style,
          ]}
          onPressIn={() => setIsDragging(true)}
          onPressOut={() => setIsDragging(false)}
        >
        {loading ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          <>
            <Symbol name="arrow.up.circle"
              size={48}
              color={disabled ? theme.mutedForeground : theme.primary}
            />
            <Text
              style={{
                marginTop: spacing[3],
                fontSize: 16,
                fontWeight: '500',
                color: disabled ? theme.mutedForeground : theme.foreground,
              }}
            >
              {placeholder}
            </Text>
            <Text
              style={{
                marginTop: spacing[1],
                fontSize: 14,
                color: theme.mutedForeground,
                textAlign: 'center',
              }}
            >
              {multiple ? `Select up to ${maxFiles} files` : 'Select a file'}
              {maxSize && ` • Max ${formatFileSize(maxSize)}`}
            </Text>
          </>
        )}
        </DropzoneComponent>
      );
    };

    const renderButton = () => (
      <View style={style}>
        <Button
          onPress={pickDocument}
          disabled={disabled || loading}
          variant="outline"
          leftIcon={<Symbol name="attach" size={20} />}
          isLoading={loading}
        >
          {placeholder}
        </Button>
      </View>
    );

    const renderDefault = () => (
      <View style={style}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing[2],
          }}
        >
          <Button
            onPress={pickImage}
            disabled={disabled || loading}
            variant="outline"
            size="sm"
            leftIcon={<Symbol name="photo" size={16} />}
          >
            Image
          </Button>
          <Button
            onPress={pickDocument}
            disabled={disabled || loading}
            variant="outline"
            size="sm"
            leftIcon={<Symbol name="doc" size={16} />}
          >
            Document
          </Button>
        </View>
      </View>
    );

    const renderPreview = () => {
      if (!showPreview || value.length === 0) return null;

      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: spacing[3] }}
        >
          <View style={{ flexDirection: 'row', gap: spacing[2] }}>
            {value.map((file, index) => (
              <Card
                key={`${file.uri}-${index}`}
                p={2 as SpacingScale}
                style={[
                  {
                    width: 120,
                    position: 'relative',
                  },
                  previewStyle,
                ]}
              >
                {file.type === 'image' ? (
                  <Image
                    source={{ uri: file.uri }}
                    style={{
                      width: '100%',
                      height: 80,
                      borderRadius: 4,
                      marginBottom: spacing[2],
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: '100%',
                      height: 80,
                      borderRadius: 4,
                      backgroundColor: theme.muted,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: spacing[2],
                    }}
                  >
                    <Symbol
                      name="getFileIcon(file.type) as any"
                      size={32}
                      color={theme.mutedForeground}
                    />
                  </View>
                )}
                
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 12,
                    color: theme.foreground,
                    marginBottom: spacing[0.5],
                  }}
                >
                  {file.name}
                </Text>
                
                {file.size && (
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.mutedForeground,
                    }}
                  >
                    {formatFileSize(file.size)}
                  </Text>
                )}
                
                {!disabled && (
                  <Pressable
                    onPress={() => removeFile(index)}
                    style={({ pressed }) => ({
                      position: 'absolute',
                      top: spacing[1],
                      right: spacing[1],
                      backgroundColor: theme.background,
                      borderRadius: 12,
                      padding: spacing[0.5],
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Symbol name="xmark.circle"
                      size={20}
                      color={theme.destructive}
                    />
                  </Pressable>
                )}
              </Card>
            ))}
          </View>
        </ScrollView>
      );
    };

    // Render list view with animations
    const renderListView = () => {
      if (value.length === 0) return null;
      
      return (
        <View style={{ marginTop: spacing[3] }}>
          {value.map((file, index) => (
            <AnimatedFilePreview
              key={`${file.uri}-${index}`}
              file={file}
              index={index}
              onRemove={removeFile}
              theme={theme}
              spacing={spacing}
              animated={animated}
              shouldAnimate={shouldAnimate}
              previewAnimation={previewAnimation}
              animationDuration={duration}
            />
          ))}
        </View>
      );
    };

    return (
      <View ref={ref} testID={testID}>
        {variant === 'dropzone' && renderDropzone()}
        {variant === 'button' && renderButton()}
        {variant === 'default' && renderDefault()}
        
        {/* Show upload progress bar if animated */}
        {animated && isAnimated && shouldAnimate() && uploadAnimation && loading && (
          <AnimatedView
            style={[{
              height: 4,
              backgroundColor: theme.primary,
              marginTop: spacing[2],
              borderRadius: 2,
            }, uploadProgressStyle]}
          />
        )}
        
        {/* Render preview based on type */}
        {showPreview && variant !== 'button' && renderListView()}
        {showPreview && variant === 'button' && renderPreview()}
      </View>
    );
  }
);

FilePicker.displayName = 'FilePicker';

// File Upload Progress Component
export interface FileUploadProgressProps {
  fileName: string;
  progress: number;
  status?: 'uploading' | 'completed' | 'error';
  error?: string;
  onCancel?: () => void;
  onRetry?: () => void;
  style?: ViewStyle;
}

export const FileUploadProgress: React.FC<FileUploadProgressProps> = ({
  fileName,
  progress,
  status = 'uploading',
  error,
  onCancel,
  onRetry,
  style,
}) => {
  const theme = useTheme();
  const { spacing } = useSpacing();

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return theme.success;
      case 'error':
        return theme.destructive;
      default:
        return theme.primary;
    }
  };

  return (
    <Card p={3 as SpacingScale} style={style}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Symbol
          name={status === 'completed' ? 'checkmark.circle' : status === 'error' ? 'xmark.circle' : 'arrow.up.circle'}
          size={24}
          color={getStatusColor()}
        />
        
        <View style={{ flex: 1, marginLeft: spacing[3] }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: theme.foreground,
              marginBottom: spacing[1],
            }}
          >
            {fileName}
          </Text>
          
          {status === 'uploading' && (
            <View
              style={{
                height: 4,
                backgroundColor: theme.muted,
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  backgroundColor: theme.primary,
                }}
              />
            </View>
          )}
          
          {error && (
            <Text
              style={{
                fontSize: 12,
                color: theme.destructive,
              }}
            >
              {error}
            </Text>
          )}
        </View>
        
        {status === 'uploading' && onCancel && (
          <Pressable 
            onPress={onCancel} 
            style={({ pressed }) => ({ 
              marginLeft: spacing[2],
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Symbol name="xmark" size={20} color={theme.mutedForeground} />
          </Pressable>
        )}
        
        {status === 'error' && onRetry && (
          <Pressable 
            onPress={onRetry} 
            style={({ pressed }) => ({ 
              marginLeft: spacing[2],
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Symbol name="refresh" size={20} color={theme.primary} />
          </Pressable>
        )}
      </View>
    </Card>
  );
};