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
                  <Ionicons name="key-outline" size={32} color="white" />
                </View>
                <Text className="text-white text-3xl font-bold tracking-tight mb-2 text-center">Reset Password</Text>
                <Text className="text-gray-400 text-base text-center">Enter your email and we'll send a recovery link</Text>
              </View>

              {successMessage ? (
                <View className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 mb-8">
                  <View className="flex-row items-center mb-3">
                    <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                    <Text className="text-green-400 text-lg font-semibold ml-2">Email Sent!</Text>
                  </View>
                  <Text className="text-green-300/80 text-sm leading-relaxed">
                    {successMessage}
                  </Text>
                  <Text className="text-gray-500 text-xs mt-4">
                    Check your spam folder if you can't find it.
                  </Text>
                </View>
              ) : (
                <Input
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={error || authError || ""}
                />
              )}

              {!successMessage && (
                <Button onPress={handleResetPassword} className="mt-4 shadow-lg shadow-purple-500/20" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              )}

              <View className="flex-row justify-center mt-8 pt-8 border-t border-white/5">
                <Text className="text-gray-500 text-sm">Remembered it? </Text>
                <Pressable onPress={() => navigation.navigate("SignIn")}>
                  <Text className="text-purple-400 font-bold text-sm">Sign In</Text>
                </Pressable>
              </View>

              {successMessage && (
                <Button
                  onPress={() => navigation.navigate("SignIn")}
                  className="mt-6"
                  variant="secondary"
                >
                  Back to Login
                </Button>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};
