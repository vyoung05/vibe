import React, { useState, useEffect } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable, Animated } from "react-native";
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
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const signUp = useAuthStore((s) => s.signUp);
  const authError = useAuthStore((s) => s.error);
  const isLoading = useAuthStore((s) => s.isLoading);

  // Animate success screen
  useEffect(() => {
    if (signUpSuccess) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [signUpSuccess]);

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
    if (success) {
      // Show success screen - navigation happens automatically via auth state
      setSignUpSuccess(true);
    } else {
      setErrors((prev) => ({ ...prev, email: authError || "Sign up failed. Please try again." }));
    }
  };

  // Success screen
  if (signUpSuccess) {
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
            {/* Success checkmark */}
            <View className="w-24 h-24 rounded-full bg-green-500/20 items-center justify-center mb-8">
              <View className="w-16 h-16 rounded-full bg-green-500 items-center justify-center">
                <Text className="text-white text-4xl">✓</Text>
              </View>
            </View>
            
            <Text className="text-white text-3xl font-bold mb-3 text-center">Welcome to DDNS! 🎉</Text>
            <Text className="text-gray-400 text-lg text-center mb-2">Account created successfully</Text>
            <Text className="text-purple-400 text-base text-center">@{username}</Text>
            
            <View className="mt-8 px-6 py-3 rounded-full bg-white/5 border border-white/10">
              <Text className="text-gray-400 text-sm">Taking you to the app...</Text>
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
              className="w-full max-w-[500px] p-8 rounded-[32px] glass-vibrant border border-white/10 shadow-2xl"
              style={Platform.OS === 'web' ? {
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              } : {}}
            >
              <View className="items-center mb-10">
                <View className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 mb-6 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Text className="text-white text-3xl font-bold">V</Text>
                </View>
                <Text className="text-white text-3xl font-bold tracking-tight mb-2 text-center">Create Account</Text>
                <Text className="text-gray-400 text-base text-center">Join the DDNS community today</Text>
              </View>

              <View className="flex-row gap-4 mb-2">
                <View className="flex-1">
                  <Input
                    label="Username"
                    value={username}
                    onChangeText={setUsername}
                    placeholder="vibeuser"
                    autoCapitalize="none"
                    error={errors.username}
                  />
                </View>
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

              <Input
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                secureTextEntry
                error={errors.confirmPassword}
              />

              <View className="mb-8 mt-2">
                <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 ml-1">Membership Plan</Text>

                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => setSelectedTier("free")}
                    className={`flex-1 p-4 rounded-2xl border transition-all duration-200 ${selectedTier === "free" ? "bg-purple-500/20 border-purple-500/50" : "bg-white/5 border-white/5"
                      }`}
                  >
                    <Text className={`font-bold mb-1 ${selectedTier === "free" ? "text-white" : "text-gray-400"}`}>Free</Text>
                    <Text className="text-gray-500 text-[10px] leading-tight">Basic access & features</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSelectedTier("superfan")}
                    className={`flex-1 p-4 rounded-2xl border transition-all duration-200 ${selectedTier === "superfan" ? "bg-purple-500/20 border-purple-500/50" : "bg-white/5 border-white/5"
                      }`}
                  >
                    <Text className={`font-bold mb-1 ${selectedTier === "superfan" ? "text-white" : "text-gray-400"}`}>Super Fan</Text>
                    <Text className="text-gray-500 text-[10px] leading-tight">Exclusive perks & status</Text>
                  </Pressable>
                </View>
              </View>

              <Button onPress={handleSignUp} className="shadow-lg shadow-purple-500/20" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>

              <View className="flex-row justify-center mt-10 pt-8 border-t border-white/5">
                <Text className="text-gray-500 text-sm">Already have an account? </Text>
                <Pressable onPress={() => navigation.navigate("SignIn")}>
                  <Text className="text-purple-400 font-bold text-sm">Sign In</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};
