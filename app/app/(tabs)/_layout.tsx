import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Hide tab bar completely
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="seller-dashboard" />
      <Tabs.Screen name="forum" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="notifications" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="upload" />
      <Tabs.Screen name="cart" />
      <Tabs.Screen name="wishlist" />
    </Tabs>
  );
}
