import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProfileCompletionFlow } from "@/components/ProfileCompletionFlow";
import "@/app/global.css";

export default function CompleteProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ProfileCompletionFlow showSkip={false} />
    </SafeAreaView>
  );
}