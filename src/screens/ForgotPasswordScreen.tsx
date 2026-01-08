import React, { useState, useEffect } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../state/authStore";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "ForgotPassword">;

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const authError = useAuthStore((s) => s.error);
  const successMessage = useAuthStore((s) => s.successMessage);
  const isLoading = useAuthStore((s) => s.isLoading);
  const clearSuccessMessage = useAuthStore((s) => s.clearSuccessMessage);

  useEffect(() => {
    return () => {
      clearSuccessMessage();
    };
  }, []);

  const handleResetPassword = async () => {
    setError("");

    if (!email) {
      setError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    await resetPassword(email);
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
            contentContainerClassName="flex-1 justify-center px-6"
            keyboardShouldPersistTaps="handled"
          >
            <View className="mb-12">
              <Text className="text-white text-4xl font-bold mb-2">Reset Password</Text>
              <Text className="text-gray-400 text-lg">
                Enter your email and we will send you a link to reset your password
              </Text>
            </View>

            {successMessage ? (
              <View className="bg-green-900/30 border border-green-500 rounded-2xl p-6 mb-6">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                  <Text className="text-green-400 text-lg font-semibold ml-2">Email Sent!</Text>
                </View>
                <Text className="text-green-300 text-base">
                  {successMessage}
                </Text>
                <Text className="text-gray-400 text-sm mt-3">
                  Did not receive the email? Check your spam folder or try again.
                </Text>
              </View>
            ) : (
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                error={error || authError || ""}
              />
            )}

            {!successMessage && (
              <Button onPress={handleResetPassword} className="mt-4" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            )}

            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-400">Remember your password? </Text>
              <Pressable onPress={() => navigation.navigate("SignIn")}>
                <Text className="text-purple-400 font-semibold">Sign In</Text>
              </Pressable>
            </View>

            {successMessage && (
              <Button
                onPress={() => navigation.navigate("SignIn")}
                className="mt-6"
              >
                Back to Sign In
              </Button>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};
