import React, { useState } from "react";
import { Text, Pressable, View, Platform } from "react-native";
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
  const [isHovered, setIsHovered] = useState(false);

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

  // Web hover handlers
  const hoverProps = Platform.OS === "web" ? {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  } : {};

  // Hover styles for web
  const getHoverStyle = () => {
    if (Platform.OS !== "web" || disabled) return {};
    return {
      transform: isHovered ? [{ scale: 1.02 }] : [{ scale: 1 }],
      transition: "all 0.2s ease",
    };
  };

  if (variant === "primary") {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className={cn("rounded-xl overflow-hidden", className)}
        style={[
          getHoverStyle(),
          isHovered && Platform.OS === "web" ? {
            shadowColor: "#9333EA",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
          } : {},
        ]}
        {...hoverProps}
      >
        <LinearGradient
          colors={disabled ? ["#374151", "#1F2937"] : isHovered ? ["#A855F7", "#EC4899"] : ["#9333EA", "#DB2777"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: size === "sm" ? 16 : size === "md" ? 24 : 32, paddingVertical: size === "sm" ? 8 : size === "md" ? 12 : 16 }}
        >
          <Text className={cn("text-white font-bold tracking-wide text-center", textSizeClasses[size])}>
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
          "rounded-2xl border bg-white/5",
          sizeClasses[size],
          disabled && "opacity-50",
          className
        )}
        style={[
          getHoverStyle(),
          {
            borderColor: isHovered && Platform.OS === "web" ? "rgba(168, 85, 247, 0.5)" : "rgba(255, 255, 255, 0.1)",
            backgroundColor: isHovered && Platform.OS === "web" ? "rgba(168, 85, 247, 0.1)" : "rgba(255, 255, 255, 0.05)",
          },
        ]}
        {...hoverProps}
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
      style={[
        getHoverStyle(),
        isHovered && Platform.OS === "web" ? { backgroundColor: "rgba(255, 255, 255, 0.05)" } : {},
      ]}
      {...hoverProps}
    >
      <Text className={cn(isHovered ? "text-white" : "text-gray-300", "font-medium text-center", textSizeClasses[size])}>
        {children}
      </Text>
    </Pressable>
  );
};
