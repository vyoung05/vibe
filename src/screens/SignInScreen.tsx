import React, { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
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
  const signIn = useAuthStore((s) => s.signIn);
  const authError = useAuthStore((s) => s.error);
  const isLoading = useAuthStore((s) => s.isLoading);

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
    if (!success) {
      setErrors((prev) => ({ ...prev, password: authError || "Invalid email or password" }));
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
            contentContainerClassName="flex-1 justify-center px-6"
            keyboardShouldPersistTaps="handled"
          >
            <View className="mb-12">
              <Text className="text-white text-4xl font-bold mb-2">Welcome Back</Text>
              <Text className="text-gray-400 text-lg">Sign in to continue to DDNS</Text>
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
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              error={errors.password}
            />

            <Button onPress={handleSignIn} className="mt-4" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>

            <Pressable onPress={() => navigation.navigate("ForgotPassword")} className="mt-4">
              <Text className="text-purple-400 text-center">Forgot Password?</Text>
            </Pressable>

            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-400">{"Don't have an account? "}</Text>
              <Pressable onPress={() => navigation.navigate("SignUp")}>
                <Text className="text-purple-400 font-semibold">Sign Up</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};
