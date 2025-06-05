import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProfileCompletionFlowEnhanced } from "@/components/ProfileCompletionFlowEnhanced";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { log } from "@/lib/core/logger";
import "@/app/global.css";

export default function CompleteProfileScreen() {
  log.info('Profile completion screen loaded', 'COMPLETE_PROFILE_SCREEN');
  
  return (
    <ProtectedRoute>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <ProfileCompletionFlowEnhanced showSkip={false} />
      </SafeAreaView>
    </ProtectedRoute>
  );
}