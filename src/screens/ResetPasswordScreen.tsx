import React, { useState, useEffect } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../state/authStore";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { PageContainer } from "../components/PageContainer";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "ResetPassword">;

export const ResetPasswordScreen: React.FC<Props> = ({ navigation }) => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    const updatePassword = useAuthStore((s) => s.updatePassword);
    const authError = useAuthStore((s) => s.error);
    const successMessage = useAuthStore((s) => s.successMessage);
    const isLoading = useAuthStore((s) => s.isLoading);
    const clearSuccessMessage = useAuthStore((s) => s.clearSuccessMessage);

    useEffect(() => {
        return () => {
            clearSuccessMessage();
        };
    }, []);

    const handleUpdatePassword = async () => {
        setError("");

        if (!password) {
            setError("Password is required");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        const success = await updatePassword(password);
        if (success) {
            // Logic for automatic redirection can be handled here or via user action
        }
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
                        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <PageContainer>
                            <View
                                className="w-full max-w-[450px] p-8 rounded-[40px] glass-vibrant border border-white/10 shadow-2xl mt-20 align-self-center"
                                style={Platform.OS === 'web' ? {
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                    alignSelf: 'center'
                                } : { alignSelf: 'center' }}
                            >
                                <View className="items-center mb-10">
                                    <View className="w-20 h-20 rounded-[24px] bg-gradient-to-tr from-purple-600 to-pink-500 mb-8 flex items-center justify-center shadow-2xl shadow-purple-500/40">
                                        <Ionicons name="lock-closed-outline" size={36} color="white" />
                                    </View>
                                    <Text className="text-white text-4xl font-black italic tracking-tighter uppercase mb-2 text-center">New</Text>
                                    <Text className="text-purple-500 text-[10px] font-black uppercase tracking-[4px] mb-6 text-center">SET PASSWORD</Text>
                                    <Text className="text-gray-400 text-sm text-center leading-5 px-4 font-medium">Set a strong, secure password for your DDNS account</Text>
                                </View>

                                {successMessage ? (
                                    <View className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 mb-8">
                                        <View className="flex-row items-center mb-3">
                                            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                                            <Text className="text-green-400 text-lg font-semibold ml-2">Success!</Text>
                                        </View>
                                        <Text className="text-green-300/80 text-sm leading-relaxed">
                                            {successMessage}
                                        </Text>
                                        <Text className="text-gray-500 text-xs mt-4">
                                            You can now sign in with your new password.
                                        </Text>
                                    </View>
                                ) : (
                                    <>
                                        <Input
                                            label="New Password"
                                            value={password}
                                            onChangeText={setPassword}
                                            placeholder="••••••••"
                                            secureTextEntry
                                            error={error || authError || ""}
                                        />

                                        <Input
                                            label="Confirm New Password"
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            placeholder="••••••••"
                                            secureTextEntry
                                        />
                                    </>
                                )}

                                {successMessage ? (
                                    <Button onPress={() => navigation.navigate("SignIn")} className="mt-4 shadow-lg shadow-purple-500/20">
                                        Return to Sign In
                                    </Button>
                                ) : (
                                    <Button onPress={handleUpdatePassword} className="mt-4 shadow-lg shadow-purple-500/20" disabled={isLoading}>
                                        {isLoading ? "Updating..." : "Update Password"}
                                    </Button>
                                )}

                                {!successMessage && (
                                    <View className="flex-row justify-center mt-8 pt-8 border-t border-white/5">
                                        <Pressable onPress={() => navigation.navigate("SignIn")}>
                                            <Text className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Back to login</Text>
                                        </Pressable>
                                    </View>
                                )}
                            </View>
                        </PageContainer>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </View>
    );
};
