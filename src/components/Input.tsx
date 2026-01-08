import React from "react";
import { View, TextInput, Text } from "react-native";
import { cn } from "../utils/cn";

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  className?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = "default",
  autoCapitalize = "none",
  className,
  error,
}) => {
  return (
    <View className={cn("mb-4", className)}>
      {label && (
        <Text className="text-gray-300 text-sm font-medium mb-2">{label}</Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6B7280"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        className={cn(
          "bg-[#1F1F2E] border border-gray-700 rounded-xl px-4 py-3 text-white text-base",
          error && "border-red-500"
        )}
      />
      {error && (
        <Text className="text-red-400 text-xs mt-1">{error}</Text>
      )}
    </View>
  );
};
