import {
  ShiftManagement,
  SuccessAnimation,
} from "@/components/blocks/healthcare";
import { Button, Symbol, Text, VStack } from "@/components/universal";
import { useAuth } from "@/hooks/useAuth";
import { useResponsive } from "@/hooks/responsive";
import { useHospitalPermissions } from "@/hooks/useHospitalPermissions";
import { useHealthcareAccess } from "@/hooks/usePermissions";
import { logger } from "@/lib/core/debug/unified-logger";
import { useHospitalStore } from "@/lib/stores/hospital-store";
import { useSpacing } from "@/lib/stores/spacing-store";
import { useTheme } from "@/lib/theme/provider";
import { haptic } from "@/lib/ui/haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function ShiftManagementModal() {
  const { spacing } = useSpacing();
  const { user } = useAuth();
  const theme = useTheme();
  const { currentHospital } = useHospitalStore();
  const hospitalPermissions = useHospitalPermissions();
  const useHealthcareAccessResult = useHealthcareAccess();
  const permissionsLoading =
    "isLoading" in useHealthcareAccessResult
      ? useHealthcareAccessResult.isLoading
      : false;
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [successData, setSuccessData] = React.useState<{
    isOnDuty: boolean;
    duration?: number;
  }>({ isOnDuty: false });

  // Debug logging
  React.useEffect(() => {
    logger.healthcare.info("ShiftManagementModal mounted", {
      user: user,
      organizationId: user?.organizationId,
      defaultHospitalId: user?.defaultHospitalId,
      currentHospitalId: currentHospital?.id,
      currentHospital: currentHospital,
      hospitalStoreState: {
        hasCurrentHospital: !!currentHospital,
        currentHospitalName: currentHospital?.name,
      },
      permissions: {
        hasHospitalAssigned: hospitalPermissions.hasHospitalAssigned,
        userRole: hospitalPermissions.userRole,
        userHospitalId: hospitalPermissions.userHospitalId,
        currentHospitalId: hospitalPermissions.currentHospitalId,
      },
      permissionsLoading,
    });
  }, [user, currentHospital, hospitalPermissions, permissionsLoading]);

  const handleClose = () => {
    haptic("light");
    router.back();
  };

  const handleShiftChange = (isOnDuty: boolean, duration?: number) => {
    haptic("success");
    setSuccessData({ isOnDuty, duration });
    setShowSuccess(true);
  };

  const handleSuccessComplete = () => {
    router.back();
  };

  // Get the hospital ID from either current hospital or user's default
  const hospitalId = currentHospital?.id || user?.defaultHospitalId;

  // Check if user has hospital assignment
  if (!hospitalId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.muted }}>
        <VStack
          gap={6}
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <View
            style={{
              backgroundColor: theme.destructive + "20",
              borderRadius: 16,
              padding: spacing[3],
            }}
          >
            <Symbol
              name="building.2.fill"
              size="xl"
              color={theme.destructive}
            />
          </View>
          <VStack gap={2} alignItems="center">
            <Text size="lg" weight="semibold">
              Hospital Assignment Required
            </Text>
            <Text
              colorTheme="mutedForeground"
              style={{ textAlign: "center", paddingHorizontal: spacing[4] }}
            >
              You need to be assigned to a hospital to manage shifts.
            </Text>
          </VStack>
          <VStack gap={3}>
            <Button
              onPress={() => {
                router.back();
                router.push("/(tabs)/settings" as any);
              }}
              size="lg"
            >
              Complete Your Profile
            </Button>
            <Button onPress={handleClose} variant="outline" size="lg">
              Cancel
            </Button>
          </VStack>
        </VStack>
      </SafeAreaView>
    );
  }

  // Check if user has healthcare role
  const healthcareRoles = ["doctor", "nurse", "operator", "head_doctor"];
  if (!healthcareRoles.includes(user?.role || "")) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.muted }}>
        <VStack
          gap={6}
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <View
            style={{
              backgroundColor: theme.destructive + "20",
              borderRadius: 16,
              padding: spacing[3],
            }}
          >
            <Symbol
              name="xmark.circle.fill"
              size="xl"
              color={theme.destructive}
            />
          </View>
          <VStack gap={2} alignItems="center">
            <Text size="lg" weight="semibold">
              Healthcare Access Required
            </Text>
            <Text
              colorTheme="mutedForeground"
              style={{ textAlign: "center", paddingHorizontal: spacing[4] }}
            >
              Only healthcare staff can manage shifts.
            </Text>
          </VStack>
          <Button onPress={handleClose} variant="outline" size="lg">
            Go Back
          </Button>
        </VStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header Background */}
      <LinearGradient
        colors={[theme.primary + "10", theme.background]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 200,
        }}
      />

      <View style={{ flex: 1 }}>
        <ShiftManagement onShiftChange={handleShiftChange} embedded={false} />
      </View>

      {/* Success Animation Overlay */}
      <SuccessAnimation
        visible={showSuccess}
        title={successData.isOnDuty ? "Shift Started!" : "Shift Ended!"}
        subtitle={
          successData.isOnDuty
            ? "You are now on duty. Stay safe!"
            : successData.duration
            ? `Total duration: ${Math.floor(successData.duration / 60)}h ${
                successData.duration % 60
              }m`
            : "Thank you for your service"
        }
        onComplete={handleSuccessComplete}
        autoHide={true}
        autoHideDelay={2000}
      />
    </SafeAreaView>
  );
}
