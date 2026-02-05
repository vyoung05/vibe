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
  autoComplete?: string;
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
  autoComplete = "off",
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
        placeholderTextColor="#9CA3AF"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete as any}
        className={cn(
          "bg-[#0F0F17] border border-white/10 rounded-2xl px-5 py-4 text-white text-base transition-all duration-200",
          "focus:border-purple-500/50 focus:bg-[#151520]",
          error && "border-red-500/50"
        )}
      />
      {error && (
        <Text className="text-red-400 text-xs mt-2 ml-1">{error}</Text>
      )}
    </View>
  );
};
