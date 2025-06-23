import React from 'react';
import { Platform, KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useResponsive } from '@/hooks/responsive';

interface ModalContentWrapperProps {
  children: React.ReactNode;
  embedded?: boolean;
  maxWidth?: number;
}

export function ModalContentWrapper({ 
  children, 
  embedded = false,
  maxWidth
}: ModalContentWrapperProps) {
  const { spacing } = useSpacing();
  const { isMobile, isDesktop } = useResponsive();
  
  const content = (
    <View style={{ 
      width: '100%', 
      maxWidth: maxWidth || (isDesktop ? 600 : '100%'),
      alignSelf: 'center' 
    }}>
      {children}
    </View>
  );
  
  if (embedded) {
    return content;
  }
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, width: '100%' }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          padding: isMobile ? spacing[2] : spacing[3],
          paddingBottom: isMobile ? spacing[6] : spacing[8],
          alignItems: 'center',
        }}
        keyboardShouldPersistTaps="handled"
      >
        {content}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}