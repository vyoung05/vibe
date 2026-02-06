import React, { useState, useEffect } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../state/authStore";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "SignUp">;
type AccountType = "user" | "streamer" | "artist";

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string; description: string }[] = [
  { value: "user", label: "Fan", icon: "person", description: "Watch streams, buy music & merch" },
  { value: "streamer", label: "Streamer", icon: "videocam", description: "Go live & build your audience" },
  { value: "artist", label: "Artist", icon: "musical-notes", description: "Upload music & sell tracks" },
];

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Account Type, Step 2: Details
  const [accountType, setAccountType] = useState<AccountType>("user");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [stageName, setStageName] = useState(""); // For artists/streamers
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

    const success = await signUp(email, password, username, selectedTier, accountType, stageName || username);
    if (success) {
      // Show success screen - navigation happens automatically via auth state
      setSignUpSuccess(true);
    } else {
      setErrors((prev) => ({ ...prev, email: authError || "Sign up failed. Please try again." }));
    }
  };

  // Step 1: Account Type Selection
  const renderAccountTypeStep = () => (
    <View className="flex-1 bg-[#050508]">
      <LinearGradient
        colors={["#0A0A15", "#050508"]}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }}
          className="px-6 py-12"
        >
          <View
            className="w-full max-w-[500px] p-8 rounded-[32px] glass-vibrant border border-white/10 shadow-2xl"
            style={Platform.OS === 'web' ? { boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' } : {}}
          >
            <View className="items-center mb-8">
              <View className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 mb-6 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Text className="text-white text-3xl font-bold">V</Text>
              </View>
              <Text className="text-white text-3xl font-bold tracking-tight mb-2 text-center">Join DDNS</Text>
              <Text className="text-gray-400 text-base text-center">What brings you here?</Text>
            </View>

            <View className="gap-3 mb-8">
              {ACCOUNT_TYPES.map((type) => (
                <Pressable
                  key={type.value}
                  onPress={() => setAccountType(type.value)}
                  className={`p-5 rounded-2xl border flex-row items-center ${
                    accountType === type.value
                      ? "bg-purple-500/20 border-purple-500/50"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <View className={`w-12 h-12 rounded-xl items-center justify-center ${
                    accountType === type.value ? "bg-purple-600" : "bg-white/10"
                  }`}>
                    <Ionicons
                      name={type.icon as any}
                      size={24}
                      color={accountType === type.value ? "white" : "#9CA3AF"}
                    />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className={`font-bold text-lg ${
                      accountType === type.value ? "text-white" : "text-gray-300"
                    }`}>
                      {type.label}
                    </Text>
                    <Text className="text-gray-500 text-sm">{type.description}</Text>
                  </View>
                  {accountType === type.value && (
                    <Ionicons name="checkmark-circle" size={24} color="#8B5CF6" />
                  )}
                </Pressable>
              ))}
            </View>

            <Button onPress={() => setStep(2)} className="shadow-lg shadow-purple-500/20">
              Continue
            </Button>

            <View className="flex-row justify-center mt-8 pt-6 border-t border-white/5">
              <Text className="text-gray-500 text-sm">Already have an account? </Text>
              <Pressable onPress={() => navigation.navigate("SignIn")}>
                <Text className="text-purple-400 font-bold text-sm">Sign In</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );

  // Success screen
  if (signUpSuccess) {
    const accountLabel = ACCOUNT_TYPES.find((t) => t.value === accountType)?.label || "User";
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
            <Text className="text-gray-400 text-lg text-center mb-2">{accountLabel} account created</Text>
            <Text className="text-purple-400 text-base text-center">@{username}</Text>
            
            <View className="mt-8 px-6 py-3 rounded-full bg-white/5 border border-white/10">
              <Text className="text-gray-400 text-sm">Taking you to the app...</Text>
            </View>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  // Step 1: Account type selection
  if (step === 1) {
    return renderAccountTypeStep();
  }

  // Step 2: Account details
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
              {/* Back Button */}
              <Pressable
                onPress={() => setStep(1)}
                className="flex-row items-center mb-6"
              >
                <Ionicons name="arrow-back" size={20} color="#9CA3AF" />
                <Text className="text-gray-400 ml-2">Back</Text>
              </Pressable>

              <View className="items-center mb-8">
                <View className={`w-14 h-14 rounded-xl items-center justify-center mb-4 ${
                  accountType === "artist" ? "bg-pink-600" :
                  accountType === "streamer" ? "bg-purple-600" : "bg-blue-600"
                }`}>
                  <Ionicons
                    name={ACCOUNT_TYPES.find((t) => t.value === accountType)?.icon as any || "person"}
                    size={28}
                    color="white"
                  />
                </View>
                <Text className="text-white text-2xl font-bold tracking-tight mb-1 text-center">
                  Create {ACCOUNT_TYPES.find((t) => t.value === accountType)?.label} Account
                </Text>
                <Text className="text-gray-400 text-sm text-center">Fill in your details below</Text>
              </View>

              <Input
                label="Username"
                value={username}
                onChangeText={setUsername}
                placeholder="vibeuser"
                autoCapitalize="none"
                error={errors.username}
              />

              {/* Stage Name for Artists/Streamers */}
              {(accountType === "artist" || accountType === "streamer") && (
                <Input
                  label={accountType === "artist" ? "Stage Name" : "Display Name"}
                  value={stageName}
                  onChangeText={setStageName}
                  placeholder={accountType === "artist" ? "Your artist name" : "Your streamer name"}
                  autoCapitalize="words"
                />
              )}

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
