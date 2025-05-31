import { Button } from "@/components/shadcn/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Alert, SafeAreaView, ScrollView, Text, View } from "react-native";
import "@/app/global.css";

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      console.log("Logged out successfully via context");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Logout Failed", "Failed to logout");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "operator":
        return "bg-blue-500";
      case "doctor":
        return "bg-green-500";
      case "nurse":
        return "bg-purple-500";
      case "head_doctor":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "operator":
        return "Operator";
      case "doctor":
        return "Doctor";
      case "nurse":
        return "Registered Nurse";
      case "head_doctor":
        return "Head of Doctor";
      default:
        return role;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="p-4">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-3xl font-bold">Hospital Alert</Text>
            <Button variant="destructive" onPress={handleLogout}>
              Logout
            </Button>
          </View>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Welcome, {user?.name}!</CardTitle>
              <CardDescription>Your profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <View className="space-y-2">
                <View className="flex-row items-center">
                  <Text className="font-medium mr-2">Email:</Text>
                  <Text>{user?.email}</Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="font-medium mr-2">Role:</Text>
                  <View className={`px-3 py-1 rounded-full ${getRoleBadgeColor(user?.role)}`}>
                    <Text className="text-white text-sm font-medium">
                      {getRoleDisplayName(user?.role)}
                    </Text>
                  </View>
                </View>
                {user?.hospitalId && (
                  <View className="flex-row items-center">
                    <Text className="font-medium mr-2">Hospital ID:</Text>
                    <Text>{user.hospitalId}</Text>
                  </View>
                )}
              </View>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Based on your role permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <View className="space-y-3">
                {user?.role === "operator" && (
                  <Button
                    variant="default"
                    className="w-full"
                    onPress={() => Alert.alert("Coming Soon", "Alert creation will be implemented next")}
                  >
                    Create New Alert
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  className="w-full"
                  onPress={() => Alert.alert("Coming Soon", "Alert history will be implemented next")}
                >
                  View Alert History
                </Button>

                {user?.role !== "operator" && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onPress={() => Alert.alert("Coming Soon", "Active alerts will be implemented next")}
                  >
                    View Active Alerts
                  </Button>
                )}
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
