import React from "react";
import { Text, Pressable, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { cn } from "../utils/cn";

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  className,
}) => {
  const sizeClasses = {
    sm: "px-4 py-2",
    md: "px-6 py-3",
    lg: "px-8 py-4",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  if (variant === "primary") {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className={cn("rounded-xl overflow-hidden", className)}
      >
        <LinearGradient
          colors={disabled ? ["#4B5563", "#374151"] : ["#8B5CF6", "#EC4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: size === "sm" ? 16 : size === "md" ? 24 : 32, paddingVertical: size === "sm" ? 8 : size === "md" ? 12 : 16 }}
        >
          <Text className={cn("text-white font-semibold text-center", textSizeClasses[size])}>
            {children}
          </Text>
        </LinearGradient>
      </Pressable>
    );
  }

  if (variant === "secondary") {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className={cn(
          "rounded-xl border-2 border-purple-500/50 bg-purple-500/10",
          sizeClasses[size],
          disabled && "opacity-50",
          className
        )}
      >
        <Text className={cn("text-purple-400 font-semibold text-center", textSizeClasses[size])}>
          {children}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={cn(
        "rounded-xl",
        sizeClasses[size],
        disabled && "opacity-50",
        className
      )}
    >
      <Text className={cn("text-gray-300 font-medium text-center", textSizeClasses[size])}>
        {children}
      </Text>
    </Pressable>
  );
};
