import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { authService } from "../services/authService";
import { useAuthStore } from "../state/authStore";

type Props = NativeStackScreenProps<any, "Login">;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const signIn = useAuthStore((s) => s.signIn);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);

    // Try signing in with Supabase
    const { user, error } = await authService.signIn(email.trim(), password);

    if (error) {
      // If Supabase login fails, try the old auth system
      const success = await signIn(email.trim(), password);
      setLoading(false);

      if (!success) {
        Alert.alert("Login Failed", "Invalid email or password");
      }
      return;
    }

    setLoading(false);

    if (user) {
      // Successfully logged in with Supabase, now update app state
      await signIn(email.trim(), password);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#050509]" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 justify-center">
            {/* Logo/Title */}
            <View className="items-center mb-12">
              <Ionicons name="camera" size={64} color="#8B5CF6" />
              <Text className="text-white text-3xl font-bold mt-4">
                Welcome Back
              </Text>
              <Text className="text-gray-400 text-base mt-2">
                Sign in to continue
              </Text>
            </View>

            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2">Email</Text>
              <View className="bg-[#1A1A1F] rounded-xl flex-row items-center px-4">
                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#6B7280"
                  className="flex-1 text-white py-4 px-3"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View className="mb-6">
              <Text className="text-gray-400 text-sm mb-2">Password</Text>
              <View className="bg-[#1A1A1F] rounded-xl flex-row items-center px-4">
                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#6B7280"
                  className="flex-1 text-white py-4 px-3"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#6B7280"
                  />
                </Pressable>
              </View>
            </View>

            {/* Login Button */}
            <Pressable
              onPress={handleLogin}
              disabled={loading}
              className="bg-[#8B5CF6] rounded-xl py-4 items-center mb-4"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Sign In
                </Text>
              )}
            </Pressable>

            {/* Sign Up Link */}
            <View className="flex-row items-center justify-center mt-4">
              <Text className="text-gray-400">Do not have an account? </Text>
              <Pressable onPress={() => navigation.navigate("Signup")}>
                <Text className="text-[#8B5CF6] font-semibold">Sign Up</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
