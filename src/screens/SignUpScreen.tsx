import React, { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../state/authStore";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "SignUp">;

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [selectedTier, setSelectedTier] = useState<"free" | "superfan">("free");
  const [errors, setErrors] = useState({ email: "", username: "", password: "", confirmPassword: "", referralCode: "" });
  const signUp = useAuthStore((s) => s.signUp);
  const authError = useAuthStore((s) => s.error);
  const isLoading = useAuthStore((s) => s.isLoading);

  const handleSignUp = async () => {
    // Reset errors
    setErrors({ email: "", username: "", password: "", confirmPassword: "", referralCode: "" });

    // Validation
    if (!email) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }));
      return;
    }
    if (!username) {
      setErrors((prev) => ({ ...prev, username: "Username is required" }));
      return;
    }
    if (!password) {
      setErrors((prev) => ({ ...prev, password: "Password is required" }));
      return;
    }
    if (password.length < 6) {
      setErrors((prev) => ({ ...prev, password: "Password must be at least 6 characters" }));
      return;
    }
    if (password !== confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
      return;
    }

    const success = await signUp(email, password, username, selectedTier);
    if (!success) {
      setErrors((prev) => ({ ...prev, email: authError || "Sign up failed. Please try again." }));
    }
    // Navigation will happen automatically via auth state change
  };

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      <LinearGradient
        colors={["#0A0A0F", "#151520", "#0A0A0F"]}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            contentContainerClassName="px-6 py-12"
            keyboardShouldPersistTaps="handled"
          >
            <View className="mb-8">
              <Text className="text-white text-4xl font-bold mb-2">Join DDNS</Text>
              <Text className="text-gray-400 text-lg">Create your account</Text>
            </View>

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label="Username"
              value={username}
              onChangeText={setUsername}
              placeholder="Choose a username"
              autoCapitalize="none"
              error={errors.username}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              secureTextEntry
              error={errors.password}
            />

            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
              error={errors.confirmPassword}
            />

            {/* Tier Selection */}
            <View className="mb-6">
              <Text className="text-gray-300 text-sm font-medium mb-3">Select Membership Tier</Text>

              <Pressable
                onPress={() => setSelectedTier("free")}
                className={`bg-[#1F1F2E] border-2 rounded-2xl p-4 mb-3 ${
                  selectedTier === "free" ? "border-purple-500" : "border-gray-700"
                }`}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white text-lg font-bold">Free Tier</Text>
                  <Badge variant="free">Free</Badge>
                </View>
                <Text className="text-gray-400 text-sm">
                  Follow streamers, browse content, and get basic notifications
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedTier("superfan")}
                className={`bg-[#1F1F2E] border-2 rounded-2xl p-4 ${
                  selectedTier === "superfan" ? "border-purple-500" : "border-gray-700"
                }`}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white text-lg font-bold">Super Fan</Text>
                  <Badge variant="superfan">Super Fan</Badge>
                </View>
                <Text className="text-gray-400 text-sm mb-2">
                  Full access to exclusive content, merch discounts, and priority support
                </Text>
                <Text className="text-purple-400 text-sm font-semibold">Coming Soon</Text>
              </Pressable>
            </View>

            <Button onPress={handleSignUp} className="mt-4" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>

            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-400">Already have an account? </Text>
              <Pressable onPress={() => navigation.navigate("SignIn")}>
                <Text className="text-purple-400 font-semibold">Sign In</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};
