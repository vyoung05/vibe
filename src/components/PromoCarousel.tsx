import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Promotion } from "../types/printify";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface PromoCarouselProps {
  promotions: Promotion[];
  countdown: Record<string, string>;
  getTimeRemaining: (endDate: string) => string;
}

export const PromoCarousel: React.FC<PromoCarouselProps> = ({
  promotions,
  countdown,
  getTimeRemaining,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  // Calculate card width based on platform
  const CARD_WIDTH = Platform.OS === 'web' 
    ? Math.min(400, SCREEN_WIDTH - 100) 
    : SCREEN_WIDTH - 48;
  const CARD_GAP = 12;

  // Auto-slide every 5 seconds (pauses on hover for desktop)
  useEffect(() => {
    if (promotions.length <= 1) return;
    
    const interval = setInterval(() => {
      if (!isHovered) {
        const nextIndex = (currentIndex + 1) % promotions.length;
        scrollToIndex(nextIndex);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, promotions.length, isHovered]);

  const scrollToIndex = (index: number) => {
    const offset = index * (CARD_WIDTH + CARD_GAP);
    scrollViewRef.current?.scrollTo({ x: offset, animated: true });
    setCurrentIndex(index);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + CARD_GAP));
    if (index !== currentIndex && index >= 0 && index < promotions.length) {
      setCurrentIndex(index);
    }
  };

  const goToPrevious = () => {
    const prevIndex = currentIndex === 0 ? promotions.length - 1 : currentIndex - 1;
    scrollToIndex(prevIndex);
  };

  const goToNext = () => {
    const nextIndex = (currentIndex + 1) % promotions.length;
    scrollToIndex(nextIndex);
  };

  if (promotions.length === 0) return null;

  return (
    <View 
      className="relative"
      // @ts-ignore - web-specific props
      onMouseEnter={() => Platform.OS === 'web' && setIsHovered(true)}
      onMouseLeave={() => Platform.OS === 'web' && setIsHovered(false)}
    >
      {/* Left Arrow (Desktop only) */}
      {Platform.OS === 'web' && promotions.length > 1 && (
        <Pressable
          onPress={goToPrevious}
          className="absolute left-0 top-1/2 z-10 bg-black/60 hover:bg-black/80 w-10 h-10 rounded-full items-center justify-center border border-white/20 -translate-y-5"
          style={{ 
            transform: [{ translateY: -20 }],
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.2s',
          } as any}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </Pressable>
      )}

      {/* Carousel ScrollView */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={Platform.OS !== 'web'}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={Platform.OS === 'web' ? CARD_WIDTH + CARD_GAP : undefined}
        snapToAlignment="start"
        contentContainerStyle={{ 
          paddingHorizontal: 24,
          paddingRight: 24 + (Platform.OS === 'web' ? 50 : 0),
        }}
      >
        {promotions.map((promo, index) => (
          <View
            key={promo.id}
            style={{ 
              width: CARD_WIDTH, 
              marginRight: index < promotions.length - 1 ? CARD_GAP : 0,
            }}
          >
            <LinearGradient
              colors={["#4C1D95", "#831843"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-5 rounded-2xl border border-white/10"
              style={{ minHeight: 140 }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-4">
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="flash" size={14} color="#F59E0B" />
                    <Text className="text-yellow-400 text-[10px] font-black ml-1 tracking-widest uppercase">
                      LIMITED TIME
                    </Text>
                  </View>
                  <Text className="text-white font-black text-xl mb-1" numberOfLines={2}>
                    {promo.name}
                  </Text>
                  <Text className="text-purple-200 font-bold text-lg">
                    {promo.type === "percentage_off"
                      ? `${promo.value}% OFF`
                      : promo.type === "fixed_amount_off"
                        ? `$${promo.value} OFF`
                        : "FREE SHIPPING"}
                  </Text>
                  {promo.code && (
                    <View className="flex-row items-center mt-3">
                      <View className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
                        <Text className="text-white font-mono font-black text-sm">{promo.code}</Text>
                      </View>
                    </View>
                  )}
                </View>
                <View className="items-end bg-black/20 p-3 rounded-xl min-w-[90px]">
                  <Text className="text-purple-300 text-[10px] font-bold mb-1 uppercase">Ends in</Text>
                  <Text className="text-white font-black text-lg">
                    {countdown[promo.id] || getTimeRemaining(promo.endDate)}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        ))}
      </ScrollView>

      {/* Right Arrow (Desktop only) */}
      {Platform.OS === 'web' && promotions.length > 1 && (
        <Pressable
          onPress={goToNext}
          className="absolute right-0 top-1/2 z-10 bg-black/60 hover:bg-black/80 w-10 h-10 rounded-full items-center justify-center border border-white/20 -translate-y-5"
          style={{ 
            transform: [{ translateY: -20 }],
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.2s',
          } as any}
        >
          <Ionicons name="chevron-forward" size={24} color="white" />
        </Pressable>
      )}

      {/* Pagination Dots */}
      {promotions.length > 1 && (
        <View className="flex-row items-center justify-center mt-4 gap-2">
          {promotions.map((_, index) => (
            <Pressable
              key={index}
              onPress={() => scrollToIndex(index)}
              className={`rounded-full transition-all ${
                index === currentIndex 
                  ? "w-6 h-2 bg-purple-500" 
                  : "w-2 h-2 bg-white/30"
              }`}
              style={{
                width: index === currentIndex ? 24 : 8,
                height: 8,
                backgroundColor: index === currentIndex ? "#A855F7" : "rgba(255,255,255,0.3)",
                borderRadius: 4,
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
};
