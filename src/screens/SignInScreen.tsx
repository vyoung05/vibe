import React, { useState, useEffect } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../state/authStore";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "SignIn">;

export const SignInScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [signInSuccess, setSignInSuccess] = useState(false);
  const [welcomeUsername, setWelcomeUsername] = useState("");
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const signIn = useAuthStore((s) => s.signIn);
  const user = useAuthStore((s) => s.user);
  const authError = useAuthStore((s) => s.error);
  const isLoading = useAuthStore((s) => s.isLoading);

  // Animate success screen
  useEffect(() => {
    if (signInSuccess) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [signInSuccess]);

  const handleSignIn = async () => {
    // Reset errors
    setErrors({ email: "", password: "" });

    // Basic validation
    if (!email) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }));
      return;
    }
    if (!password) {
      setErrors((prev) => ({ ...prev, password: "Password is required" }));
      return;
    }

    const success = await signIn(email, password);
    if (success) {
      // Show success screen briefly
      setWelcomeUsername(useAuthStore.getState().user?.username || "");
      setSignInSuccess(true);
    } else {
      setErrors((prev) => ({ ...prev, password: authError || "Invalid email or password" }));
    }
  };

  // Success screen
  if (signInSuccess) {
    return (
      <View className="flex-1 bg-[#050508]">
        <LinearGradient
          colors={["#0A0A15", "#050508"]}
          className="flex-1 items-center justify-center px-6"
        >
          <Animated.View 
            className="items-center"
            style={{ opacity: fadeAnim }}
          >
            {/* Welcome icon */}
            <View className="w-24 h-24 rounded-full bg-purple-500/20 items-center justify-center mb-8">
              <View className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 items-center justify-center">
                <Text className="text-white text-3xl">👋</Text>
              </View>
            </View>
            
            <Text className="text-white text-3xl font-bold mb-3 text-center">Welcome back!</Text>
            {welcomeUsername && (
              <Text className="text-purple-400 text-lg text-center">@{welcomeUsername}</Text>
            )}
            
            <View className="mt-8 px-6 py-3 rounded-full bg-white/5 border border-white/10">
              <Text className="text-gray-400 text-sm">Loading your content...</Text>
            </View>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#050508]">
      <LinearGradient
        colors={["#0A0A15", "#050508"]}
        className="flex-1"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }}
            className="px-6 py-12"
            keyboardShouldPersistTaps="handled"
          >
            <View
              className="w-full max-w-[450px] p-8 rounded-[32px] glass-vibrant border border-white/10 shadow-2xl"
              style={Platform.OS === 'web' ? {
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              } : {}}
            >
              <View className="items-center mb-10">
                <View className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 mb-6 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Text className="text-white text-3xl font-bold">V</Text>
                </View>
                <Text className="text-white text-3xl font-bold tracking-tight mb-2 text-center">Welcome Back</Text>
                <Text className="text-gray-400 text-base text-center">Enter your details to access your account</Text>
              </View>

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />

              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                error={errors.password}
              />

              <Button onPress={handleSignIn} className="mt-4 shadow-lg shadow-purple-500/20" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>

              <Pressable
                onPress={() => {
                  console.log("[SignIn] Forgot Password link pressed");
                  console.log("[SignIn] Available routes:", navigation.getState()?.routeNames);
                  navigation.navigate("ForgotPassword");
                }}
                className="mt-6"
                hitSlop={20}
              >
                <Text className="text-purple-400 text-center text-sm font-medium">Forgot your password?</Text>
              </Pressable>

              <View className="flex-row justify-center mt-10 pt-8 border-t border-white/5">
                <Text className="text-gray-500 text-sm">{"Don't have an account? "}</Text>
                <Pressable onPress={() => navigation.navigate("SignUp")}>
                  <Text className="text-purple-400 font-bold text-sm">Create Account</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};
