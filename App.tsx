import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SignInScreen } from "./src/screens/SignInScreen";
import { SignUpScreen } from "./src/screens/SignUpScreen";
import { StreamerProfileScreen } from "./src/screens/StreamerProfileScreen";
import { EditStreamerProfileScreen } from "./src/screens/EditStreamerProfileScreen";
import { StreamerBookingSettingsScreen } from "./src/screens/StreamerBookingSettingsScreen";
import { StreamerEventsScreen } from "./src/screens/StreamerEventsScreen";
import { AdminDashboardScreen } from "./src/screens/AdminDashboardScreen";
import { AdminManagementScreen } from "./src/screens/AdminManagementScreen";
import { NotificationsScreen } from "./src/screens/NotificationsScreen";
import { HelpSupportScreen } from "./src/screens/HelpSupportScreen";
import { BillingScreen } from "./src/screens/BillingScreen";
import { MessagesScreen } from "./src/screens/MessagesScreen";
import { ChatScreen } from "./src/screens/ChatScreen";
import { StreamerAnalyticsScreen } from "./src/screens/StreamerAnalyticsScreen";
import { AdminAnalyticsScreen } from "./src/screens/AdminAnalyticsScreen";
import { StreamingScreen } from "./src/screens/StreamingScreen";
import { PostDetailScreen } from "./src/screens/PostDetailScreen";
import { CreatePostScreen } from "./src/screens/CreatePostScreen";
import { MerchantDetailScreen } from "./src/screens/MerchantDetailScreen";
import { ItemDetailScreen } from "./src/screens/ItemDetailScreen";
import { CartScreen } from "./src/screens/CartScreen";
import { CheckoutScreen } from "./src/screens/CheckoutScreen";
import { OrderTrackingScreen } from "./src/screens/OrderTrackingScreen";
import { OrderHistoryScreen } from "./src/screens/OrderHistoryScreen";
import { AdminMerchantsScreen } from "./src/screens/AdminMerchantsScreen";
import { AdminItemsScreen } from "./src/screens/AdminItemsScreen";
import { AdminOrdersScreen } from "./src/screens/AdminOrdersScreen";
import { MerchProductDetailScreen } from "./src/screens/MerchProductDetailScreen";
import { MerchCartScreen } from "./src/screens/MerchCartScreen";
import { MerchCheckoutScreen } from "./src/screens/MerchCheckoutScreen";
import { MerchOrderTrackingScreen } from "./src/screens/MerchOrderTrackingScreen";
import { AdminMerchStoreScreen } from "./src/screens/AdminMerchStoreScreen";
import { StreamerMerchScreen } from "./src/screens/StreamerMerchScreen";
import { DiscoverPeopleScreen } from "./src/screens/DiscoverPeopleScreen";
import { InviteFriendsScreen } from "./src/screens/InviteFriendsScreen";
import { MainTabs } from "./src/navigation/MainTabs";
import { useAuthStore } from "./src/state/authStore";
import { useAppStore } from "./src/state/appStore";
import { supabase } from "./src/lib/supabase";
import { sampleStreamers, sampleVideoContent } from "./src/data/sampleData";
import type { RootStackParamList } from "./src/navigation/RootNavigator";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const checkSession = useAuthStore((s) => s.checkSession);
  const signOut = useAuthStore((s) => s.signOut);
  const streamers = useAppStore((s) => s.streamers);
  const setStreamers = useAppStore((s) => s.setStreamers);
  const updateStreamer = useAppStore((s) => s.updateStreamer);
  const videoContent = useAppStore((s) => s.videoContent);
  const addVideoContent = useAppStore((s) => s.addVideoContent);
  const addUserAccount = useAppStore((s) => s.addUserAccount);
  const getUserAccount = useAppStore((s) => s.getUserAccount);

  // Check if user needs onboarding (new users who haven't completed it OR users with no social connections)
  const hasNoSocialConnections = user &&
    (!user.followers || user.followers.length === 0) &&
    (!user.followedStreamers || user.followedStreamers.length === 0) &&
    (!user.followingUsers || user.followingUsers.length === 0);

  const needsOnboarding = isAuthenticated && user && (!user.hasCompletedOnboarding || hasNoSocialConnections);

  // Check session and set up auth state listener on mount
  useEffect(() => {
    // Check existing session
    checkSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[Auth] Auth state changed:", event);
        if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED" && !session) {
          // User signed out or token refresh failed
          signOut();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [checkSession, signOut]);

  // Load sample data on mount - only if no streamers exist (first launch)
  useEffect(() => {
    // Only set sample streamers if no streamers exist in persisted state
    if (streamers.length === 0) {
      setStreamers(sampleStreamers);
    } else {
      // Reset all streamers to offline on app start
      // Streamers should only be live when actively streaming
      streamers.forEach((streamer) => {
        if (streamer.isLive) {
          updateStreamer(streamer.id, {
            isLive: false,
            liveTitle: undefined,
            liveStreamUrl: undefined,
          });
        }
      });
    }

    // Initialize video content if empty
    if (videoContent.length === 0) {
      sampleVideoContent.forEach((video) => {
        addVideoContent(video);
      });
    }

    // Create test streamer account if it doesn't exist
    const testAccount = getUserAccount("test@streamer.com");
    if (!testAccount) {
      addUserAccount({
        user: {
          id: "user-test-streamer",
          email: "test@streamer.com",
          username: "TestStreamer",
          avatar: "https://i.pravatar.cc/300?img=12",
          tier: "superfan",
          role: "user",
          referralCode: "TESTSTREAM",
          followedStreamers: [],
          createdAt: new Date().toISOString(),
        },
        password: "test123",
      });
    }
  }, [streamers.length, setStreamers, updateStreamer, addVideoContent, videoContent.length, addUserAccount, getUserAccount]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
              <>
                <Stack.Screen name="SignIn" component={SignInScreen} />
                <Stack.Screen name="SignUp" component={SignUpScreen} />
              </>
            ) : needsOnboarding ? (
              <>
                <Stack.Screen name="DiscoverPeople" component={DiscoverPeopleScreen} />
                <Stack.Screen name="MainTabs" component={MainTabs} />
                <Stack.Screen name="StreamerProfile" component={StreamerProfileScreen} />
              </>
            ) : (
              <>
                {/* Admin screens - registered before MainTabs for proper navigation from nested tabs */}
                <Stack.Screen name="AdminManagement" component={AdminManagementScreen} />
                <Stack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
                <Stack.Screen name="AdminMerchStore" component={AdminMerchStoreScreen} />
                <Stack.Screen name="AdminMerchants" component={AdminMerchantsScreen} />
                <Stack.Screen name="AdminItems" component={AdminItemsScreen} />
                <Stack.Screen name="AdminOrders" component={AdminOrdersScreen} />
                <Stack.Screen name="MainTabs" component={MainTabs} />
                <Stack.Screen name="DiscoverPeople" component={DiscoverPeopleScreen} />
                <Stack.Screen name="InviteFriends" component={InviteFriendsScreen} />
                <Stack.Screen name="PostDetail" component={PostDetailScreen} />
                <Stack.Screen name="CreatePost" component={CreatePostScreen} />
                <Stack.Screen name="StreamerProfile" component={StreamerProfileScreen} />
                <Stack.Screen name="EditStreamerProfile" component={EditStreamerProfileScreen} />
                <Stack.Screen name="StreamerBookingSettings" component={StreamerBookingSettingsScreen} />
                <Stack.Screen name="StreamerEvents" component={StreamerEventsScreen} />
                <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                <Stack.Screen name="Notifications" component={NotificationsScreen} />
                <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
                <Stack.Screen name="Billing" component={BillingScreen} />
                <Stack.Screen name="Messages" component={MessagesScreen} />
                <Stack.Screen name="Chat" component={ChatScreen} />
                <Stack.Screen name="StreamerAnalytics" component={StreamerAnalyticsScreen} />
                <Stack.Screen name="Streaming" component={StreamingScreen} />
                <Stack.Screen name="MerchantDetail" component={MerchantDetailScreen} />
                <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
                <Stack.Screen name="Cart" component={CartScreen} />
                <Stack.Screen name="Checkout" component={CheckoutScreen} />
                <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
                <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
                <Stack.Screen name="MerchProductDetail" component={MerchProductDetailScreen} />
                <Stack.Screen name="MerchCart" component={MerchCartScreen} />
                <Stack.Screen name="MerchCheckout" component={MerchCheckoutScreen} />
                <Stack.Screen name="MerchOrderTracking" component={MerchOrderTrackingScreen} />
                <Stack.Screen name="StreamerMerch" component={StreamerMerchScreen} />
              </>
            )}
          </Stack.Navigator>
          <StatusBar style="light" />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
