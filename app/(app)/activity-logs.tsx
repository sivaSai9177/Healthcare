import { Redirect } from 'expo-router';

// Redirect from old route to new route for backward compatibility
export default function ActivityLogsRedirect() {
  return <Redirect href="/(app)/logs/activity-logs" />;
}