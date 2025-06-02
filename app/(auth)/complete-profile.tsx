import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProfileCompletionFlowEnhanced } from "@/components/ProfileCompletionFlowEnhanced";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { createLogger } from "@/lib/core/debug";
import "@/app/global.css";

const logger = createLogger('CompleteProfileScreen');

export default function CompleteProfileScreen() {
  logger.info('Profile completion screen loaded');
  
  return (
    <ProtectedRoute>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <ProfileCompletionFlowEnhanced showSkip={false} />
      </SafeAreaView>
    </ProtectedRoute>
  );
}