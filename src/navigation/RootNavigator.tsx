import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SignInScreen } from "../screens/SignInScreen";
import { SignUpScreen } from "../screens/SignUpScreen";
import { StreamerProfileScreen } from "../screens/StreamerProfileScreen";
import { EditStreamerProfileScreen } from "../screens/EditStreamerProfileScreen";
import { StreamerBookingSettingsScreen } from "../screens/StreamerBookingSettingsScreen";
import { StreamerEventsScreen } from "../screens/StreamerEventsScreen";
import { AdminDashboardScreen } from "../screens/AdminDashboardScreen";
import { AdminManagementScreen } from "../screens/AdminManagementScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { HelpSupportScreen } from "../screens/HelpSupportScreen";
import { BillingScreen } from "../screens/BillingScreen";
import { MessagesScreen } from "../screens/MessagesScreen";
import { ChatScreen } from "../screens/ChatScreen";
import { StreamerAnalyticsScreen } from "../screens/StreamerAnalyticsScreen";
import { AdminAnalyticsScreen } from "../screens/AdminAnalyticsScreen";
import { StreamingScreen } from "../screens/StreamingScreen";
import { PostDetailScreen } from "../screens/PostDetailScreen";
import { CreatePostScreen } from "../screens/CreatePostScreen";
import { MerchantListScreen } from "../screens/MerchantListScreen";
import { MerchantDetailScreen } from "../screens/MerchantDetailScreen";
import { ItemDetailScreen } from "../screens/ItemDetailScreen";
import { CartScreen } from "../screens/CartScreen";
import { CheckoutScreen } from "../screens/CheckoutScreen";
import { OrderTrackingScreen } from "../screens/OrderTrackingScreen";
import { OrderHistoryScreen } from "../screens/OrderHistoryScreen";
import { AdminMerchantsScreen } from "../screens/AdminMerchantsScreen";
import { AdminItemsScreen } from "../screens/AdminItemsScreen";
import { AdminOrdersScreen } from "../screens/AdminOrdersScreen";
import { AdminMerchStoreScreen } from "../screens/AdminMerchStoreScreen";
import { AdminNewsScreen } from "../screens/AdminNewsScreen";
import { StreamerMerchScreen } from "../screens/StreamerMerchScreen";
import { MerchStoreScreen } from "../screens/MerchStoreScreen";
import { MerchProductDetailScreen } from "../screens/MerchProductDetailScreen";
import { MerchCartScreen } from "../screens/MerchCartScreen";
import { MerchCheckoutScreen } from "../screens/MerchCheckoutScreen";
import { MerchOrderTrackingScreen } from "../screens/MerchOrderTrackingScreen";
import { CheckoutSuccessScreen } from "../screens/CheckoutSuccessScreen";
import { CheckoutCancelScreen } from "../screens/CheckoutCancelScreen";
import { DiscoverPeopleScreen } from "../screens/DiscoverPeopleScreen";
import { InviteFriendsScreen } from "../screens/InviteFriendsScreen";
import { ArtistProfileScreen } from "../screens/ArtistProfileScreen";
import { CreateMusicSheetScreen } from "../screens/CreateMusicSheetScreen";
import { ForgotPasswordScreen } from "../screens/ForgotPasswordScreen";
import { ResetPasswordScreen } from "../screens/ResetPasswordScreen";
import { MainTabs } from "./MainTabs";

export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  MainTabs: undefined;
  DiscoverPeople: undefined;
  InviteFriends: undefined;
  StreamerProfile: { streamerId: string };
  EditStreamerProfile: { streamerId: string };
  StreamerBookingSettings: { streamerId: string };
  StreamerEvents: { streamerId: string };
  ArtistProfile: { artistId: string };
  CreateMusicSheet: { artistId: string };
  AdminDashboard: undefined;
  AdminManagement: undefined;
  Notifications: undefined;
  HelpSupport: undefined;
  Billing: undefined;
  Messages: undefined;
  Chat: { userId: string; username: string };
  StreamerAnalytics: { streamerId: string };
  AdminAnalytics: undefined;
  Streaming: undefined;
  PostDetail: { postId: string };
  CreatePost: undefined;
  // Merchant screens
  MerchantList: undefined;
  MerchantDetail: { merchantId: string };
  ItemDetail: { itemId: string; merchantId: string };
  Cart: undefined;
  Checkout: undefined;
  OrderTracking: { orderId: string };
  OrderHistory: undefined;
  // Admin merchant screens
  AdminMerchants: undefined;
  AdminItems: undefined;
  AdminOrders: undefined;
  // Merch Store screens (Printify integration)
  MerchStore: undefined;
  MerchProductDetail: { productId: string };
  MerchCart: undefined;
  MerchCheckout: undefined;
  MerchOrderTracking: { orderId: string };
  CheckoutSuccess: undefined;
  CheckoutCancel: undefined;
  AdminMerchStore: undefined;
  AdminNews: undefined;
  StreamerMerch: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="DiscoverPeople" component={DiscoverPeopleScreen} />
      <Stack.Screen name="InviteFriends" component={InviteFriendsScreen} />
      {/* Admin screens - registered before MainTabs for proper navigation from nested tabs */}
      <Stack.Screen name="AdminManagement" component={AdminManagementScreen} />
      <Stack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
      <Stack.Screen name="AdminMerchStore" component={AdminMerchStoreScreen} />
      <Stack.Screen name="AdminNews" component={AdminNewsScreen} />
      <Stack.Screen name="AdminMerchants" component={AdminMerchantsScreen} />
      <Stack.Screen name="AdminItems" component={AdminItemsScreen} />
      <Stack.Screen name="AdminOrders" component={AdminOrdersScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
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
      <Stack.Screen name="MerchantList" component={MerchantListScreen} />
      <Stack.Screen name="MerchantDetail" component={MerchantDetailScreen} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
      {/* Merch Store screens (Printify integration) */}
      <Stack.Screen name="MerchStore" component={MerchStoreScreen} />
      <Stack.Screen name="MerchProductDetail" component={MerchProductDetailScreen} />
      <Stack.Screen name="MerchCart" component={MerchCartScreen} />
      <Stack.Screen name="MerchCheckout" component={MerchCheckoutScreen} />
      <Stack.Screen name="MerchOrderTracking" component={MerchOrderTrackingScreen} />
      <Stack.Screen name="CheckoutSuccess" component={CheckoutSuccessScreen} />
      <Stack.Screen name="CheckoutCancel" component={CheckoutCancelScreen} />
      <Stack.Screen name="StreamerMerch" component={StreamerMerchScreen} />
      {/* Artist screens */}
      <Stack.Screen name="ArtistProfile" component={ArtistProfileScreen} />
      <Stack.Screen name="CreateMusicSheet" component={CreateMusicSheetScreen} />
    </Stack.Navigator>
  );
};
