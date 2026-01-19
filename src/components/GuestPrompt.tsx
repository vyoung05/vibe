import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";

interface GuestPromptProps {
    title: string;
    description: string;
    icon?: string;
}

export const GuestPrompt: React.FC<GuestPromptProps> = ({
    title,
    description,
    icon = "lock-closed-outline"
}) => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    return (
        <View className="flex-1 items-center justify-center px-6 py-12">
            <View className="w-20 h-20 rounded-full bg-purple-500/10 items-center justify-center mb-6">
                <Ionicons name={icon as any} size={40} color="#8B5CF6" />
            </View>

            <Text className="text-white text-2xl font-bold text-center mb-3">
                {title}
            </Text>

            <Text className="text-gray-400 text-base text-center mb-10 px-4">
                {description}
            </Text>

            <View className="w-full max-w-[300px] gap-4">
                <Pressable
                    onPress={() => navigation.navigate("SignUp")}
                    className="bg-purple-600 py-4 rounded-2xl shadow-lg shadow-purple-500/20"
                >
                    <Text className="text-white text-center font-bold text-lg">Join the Vibe</Text>
                </Pressable>

                <Pressable
                    onPress={() => navigation.navigate("SignIn")}
                    className="bg-white/5 border border-white/10 py-4 rounded-2xl"
                >
                    <Text className="text-white text-center font-bold">Sign In</Text>
                </Pressable>
            </View>
        </View>
    );
};
