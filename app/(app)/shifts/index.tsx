import { Redirect } from 'expo-router';

export default function ShiftsIndex() {
  // Redirect to handover as the default shifts page
  return <Redirect href="/shifts/handover" />;
}