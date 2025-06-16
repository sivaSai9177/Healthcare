import React from 'react';
import { View, Platform, Dimensions, ScrollView, KeyboardAvoidingView } from 'react-native';
import { Card, VStack, Text } from '@/components/universal';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/lib/theme/provider';
import { useResponsive } from '@/hooks/responsive';
import { useSpacing } from '@/lib/stores/spacing-store';

interface AuthScreenWrapperProps {
  children: React.ReactNode;
  showTermsFooter?: boolean;
  title?: string;
  subtitle?: string;
  wideLayout?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function AuthScreenWrapper({ 
  children, 
  showTermsFooter = true,
  title,
  subtitle,
  wideLayout = false
}: AuthScreenWrapperProps) {
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [screenWidth, setScreenWidth] = React.useState(SCREEN_WIDTH);
  
  // Update screen width on resize (web)
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      const handleResize = () => {
        setScreenWidth(Dimensions.get('window').width);
      };
      
      const subscription = Dimensions.addEventListener('change', handleResize);
      return () => subscription?.remove();
    }
  }, []);

  const isTabletOrDesktop = screenWidth >= 768;
  const isLargeScreen = screenWidth >= 1024;
  
  // Form content wrapper with scroll for desktop
  const formContent = (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        padding: isTabletOrDesktop ? spacing[6] : spacing[4],
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <VStack gap={spacing[4]} style={{ flex: 1, justifyContent: 'center' }}>
        {/* Header if provided */}
        {(title || subtitle) && (
          <VStack gap={spacing[2]} align="center">
            {title && (
              <Text size={isLargeScreen ? "3xl" : "2xl"} weight="bold">
                {title}
              </Text>
            )}
            {subtitle && (
              <Text size="sm" colorTheme="mutedForeground" style={{ textAlign: 'center' }}>
                {subtitle}
              </Text>
            )}
          </VStack>
        )}
        
        {/* Form content */}
        {children}
      </VStack>
    </ScrollView>
  );
  
  // Image column for split view
  const imageColumn = (
    <LinearGradient
      colors={['#e8e9eb', '#f2f3f5', '#fafbfc']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        flex: 1,
        position: 'relative',
        height: '100%',
        width: '100%',
      }}
    >
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing[8]
      }}>
        <VStack gap={spacing[6]} align="center">
          {/* Rocket Emoji */}
          <Text style={{ fontSize: 80 }}>
            🚀
          </Text>
          
          {/* Minimal Text */}
          <VStack gap={spacing[2]} align="center">
            <Text 
              size="3xl" 
              weight="bold" 
              style={{ color: theme.foreground }}
            >
              Welcome
            </Text>
            <Text 
              size="lg" 
              style={{ 
                color: theme.mutedForeground,
                textAlign: 'center',
                maxWidth: 300,
              }}
            >
              Build amazing cross-platform apps with React Native
            </Text>
          </VStack>
        </VStack>
      </View>
    </LinearGradient>
  );
  
  // Card content for tablet/desktop
  const cardContent = (
    <Card 
      style={{
        width: isTabletOrDesktop ? (isLargeScreen ? (wideLayout ? '80%' : '70%') : (wideLayout ? '90%' : '85%')) : '100%',
        maxWidth: isLargeScreen ? (wideLayout ? 1200 : 1000) : (isTabletOrDesktop ? (wideLayout ? 700 : 600) : 400),
        overflow: 'hidden',
        ...Platform.select({
          web: {
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          },
          default: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 10,
          },
        }),
      }}
    >
      {isLargeScreen ? (
        <View style={{ 
          flexDirection: 'row',
          minHeight: 700,
          maxHeight: '90vh' as any,
          width: '100%',
        }}>
          <View style={{ flex: 6, overflow: 'hidden' }}>
            {formContent}
          </View>
          <View style={{ flex: 4 }}>
            {imageColumn}
          </View>
        </View>
      ) : (
        // For non-large screens, just show the form content directly
        <View style={{ padding: isTabletOrDesktop ? spacing[6] : spacing[4], flex: 1 }}>
          <VStack gap={spacing[4]}>
            {/* Header if provided */}
            {(title || subtitle) && (
              <VStack gap={spacing[2]} align="center">
                {title && (
                  <Text size={isLargeScreen ? "3xl" : "2xl"} weight="bold">
                    {title}
                  </Text>
                )}
                {subtitle && (
                  <Text size="sm" colorTheme="mutedForeground" style={{ textAlign: 'center' }}>
                    {subtitle}
                  </Text>
                )}
              </VStack>
            )}
            
            {/* Form content */}
            {children}
          </VStack>
        </View>
      )}
    </Card>
  );
  
  // Terms footer
  const termsFooter = showTermsFooter && (
    <View style={{ padding: spacing[4], maxWidth: isTabletOrDesktop ? 900 : 400, width: '100%' }}>
      <Text size="xs" colorTheme="mutedForeground" style={{ textAlign: 'center' }}>
        By clicking continue, you agree to our{' '}
        <Text size="xs" colorTheme="foreground" style={{ textDecorationLine: 'underline' }}>
          Terms of Service
        </Text>{' '}
        and{' '}
        <Text size="xs" colorTheme="foreground" style={{ textDecorationLine: 'underline' }}>
          Privacy Policy
        </Text>
        .
      </Text>
    </View>
  );
  
  // Mobile layout - full screen without card
  if (isMobile) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              padding: spacing[5],
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }
  
  // Web layout
  if (Platform.OS === 'web') {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing[4],
        width: '100%',
      }}>
        {cardContent}
        {isTabletOrDesktop && termsFooter}
      </View>
    );
  }
  
  // Native tablet/desktop layout
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ 
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing[6],
          width: '100%',
        }}>
          <VStack gap={0} align="center">
            {cardContent}
            {termsFooter}
          </VStack>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}