import "@/app/global.css";
import { Button } from "@/components/shadcn/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/ui/card";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout('user_initiated');
      console.log("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Logout Failed", "Failed to logout");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500";
      case "manager":
        return "bg-blue-500";
      case "user":
        return "bg-green-500";
      case "guest":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "manager":
        return "Manager";
      case "user":
        return "User";
      case "guest":
        return "Guest";
      default:
        return role;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="p-4">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-3xl font-bold" style={{ color: '#000000' }}>Full-Stack Starter</Text>
            <View className="flex-row items-center" style={{ gap: 12 }}>
              {user && (
                <Avatar 
                  image={user.image}
                  name={user.name}
                  size={36}
                />
              )}
              <Button variant="destructive" onPress={handleLogout}>
                Logout
              </Button>
            </View>
          </View>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Welcome, {user?.name}!</CardTitle>
              <CardDescription>Your profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <View style={{ gap: 8 }}>
                <View className="flex-row items-center">
                  <Text className="font-medium mr-2" style={{ color: '#000000' }}>Email:</Text>
                  <Text style={{ color: '#000000' }}>{user?.email}</Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="font-medium mr-2" style={{ color: '#000000' }}>Role:</Text>
                  <View className={`px-3 py-1 rounded-full ${getRoleBadgeColor(user?.role || '')}`}>
                    <Text className="text-white text-sm font-medium">
                      {getRoleDisplayName(user?.role || '')}
                    </Text>
                  </View>
                </View>
                {user?.organizationId && (
                  <View className="flex-row items-center">
                    <Text className="font-medium mr-2" style={{ color: '#000000' }}>Organization ID:</Text>
                    <Text style={{ color: '#000000' }}>{user.organizationId}</Text>
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
              <View style={{ gap: 12 }}>
                {user?.role === "admin" && (
                  <Button
                    variant="default"
                    className="w-full"
                    onPress={() => {
                      if (typeof window !== 'undefined') {
                        // Web platform
                        window.alert("Admin features coming soon!");
                      } else {
                        // Mobile platform
                        Alert.alert("Coming Soon", "Admin features will be implemented next");
                      }
                    }}
                  >
                    Admin Dashboard
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  className="w-full"
                  onPress={() => {
                    if (typeof window !== 'undefined') {
                      // Web platform
                      window.alert("Profile settings coming soon!");
                    } else {
                      // Mobile platform
                      Alert.alert("Coming Soon", "Profile settings will be implemented next");
                    }
                  }}
                >
                  Profile Settings
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onPress={() => {
                    if (typeof window !== 'undefined') {
                      // Web platform
                      window.alert("Feature showcase coming soon!");
                    } else {
                      // Mobile platform
                      Alert.alert("Coming Soon", "Feature showcase will be implemented next");
                    }
                  }}
                >
                  View Features
                </Button>
              </View>
            </CardContent>
          </Card>

          {/* Auth Debugger removed - using pure Zustand now */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
