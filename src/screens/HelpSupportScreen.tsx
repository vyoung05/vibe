import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";

const MAX_MESSAGE_LENGTH = 500;

export const HelpSupportScreen: React.FC = () => {
  const navigation = useNavigation();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAttachment(result.assets[0].uri);
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Required Fields", "Please fill in both subject and message.");
      return;
    }

    setSending(true);

    // Simulating email send - in production, this would call an API
    // The API would send an email to vyoung86@gmail.com
    setTimeout(() => {
      setSending(false);
      Alert.alert(
        "Message Sent!",
        "Your message has been sent to our support team. We will get back to you soon.",
        [
          {
            text: "OK",
            onPress: () => {
              setSubject("");
              setMessage("");
              setAttachment(null);
              navigation.goBack();
            },
          },
        ]
      );
    }, 1500);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-800 flex-row items-center">
        <Pressable onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text className="text-white text-2xl font-bold">Help & Support</Text>
      </View>

      <ScrollView className="flex-1 p-6">
        <View className="mb-6">
          <Text className="text-white text-lg font-bold mb-2">Contact Support</Text>
          <Text className="text-gray-400 text-sm">
            Have a question or issue? Send us a message and our support team will get back to you as
            soon as possible.
          </Text>
        </View>

        {/* Subject */}
        <View className="mb-4">
          <Text className="text-white text-sm font-semibold mb-2">Subject *</Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Brief description of your issue"
            placeholderTextColor="#6B7280"
            className="bg-[#151520] text-white px-4 py-3 rounded-xl border border-gray-800"
          />
        </View>

        {/* Message */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-white text-sm font-semibold">Message *</Text>
            <Text
              className={`text-sm ${
                message.length > MAX_MESSAGE_LENGTH ? "text-red-400" : "text-gray-500"
              }`}
            >
              {message.length}/{MAX_MESSAGE_LENGTH}
            </Text>
          </View>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Describe your issue in detail..."
            placeholderTextColor="#6B7280"
            multiline
            numberOfLines={8}
            maxLength={MAX_MESSAGE_LENGTH}
            className="bg-[#151520] text-white px-4 py-3 rounded-xl border border-gray-800"
            style={{ textAlignVertical: "top" }}
          />
        </View>

        {/* Attachment */}
        <View className="mb-6">
          <Text className="text-white text-sm font-semibold mb-2">Attachment (Optional)</Text>
          {attachment ? (
            <View className="relative">
              <Image
                source={{ uri: attachment }}
                style={{ width: "100%", height: 200, borderRadius: 12 }}
                contentFit="cover"
              />
              <Pressable
                onPress={() => setAttachment(null)}
                className="absolute top-2 right-2 bg-red-600 rounded-full p-2"
              >
                <Ionicons name="close" size={20} color="white" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={pickImage}
              className="bg-[#151520] border-2 border-dashed border-gray-700 rounded-xl py-8 items-center"
            >
              <Ionicons name="cloud-upload" size={40} color="#6B7280" />
              <Text className="text-gray-400 mt-2">Tap to upload a screenshot</Text>
            </Pressable>
          )}
        </View>

        {/* Send Button */}
        <Pressable
          onPress={handleSend}
          disabled={sending || !subject.trim() || !message.trim()}
          className={`rounded-xl py-4 items-center ${
            sending || !subject.trim() || !message.trim()
              ? "bg-gray-700"
              : "bg-purple-600"
          }`}
        >
          {sending ? (
            <Text className="text-white font-bold">Sending...</Text>
          ) : (
            <View className="flex-row items-center">
              <Ionicons name="send" size={20} color="white" />
              <Text className="text-white font-bold ml-2">Send Message</Text>
            </View>
          )}
        </Pressable>

        {/* FAQ Section */}
        <View className="mt-8">
          <Text className="text-white text-lg font-bold mb-4">Frequently Asked Questions</Text>

          <View className="bg-[#151520] rounded-xl p-4 mb-3 border border-gray-800">
            <Text className="text-white font-semibold mb-2">How do I upgrade to Super Fan?</Text>
            <Text className="text-gray-400 text-sm">
              Go to your Profile, tap on Billing, and select the Super Fan membership option.
            </Text>
          </View>

          <View className="bg-[#151520] rounded-xl p-4 mb-3 border border-gray-800">
            <Text className="text-white font-semibold mb-2">How does the referral system work?</Text>
            <Text className="text-gray-400 text-sm">
              Share your referral code from your Profile. When someone signs up using your code,
              you both earn achievements and rewards!
            </Text>
          </View>

          <View className="bg-[#151520] rounded-xl p-4 border border-gray-800">
            <Text className="text-white font-semibold mb-2">How do I book a streamer?</Text>
            <Text className="text-gray-400 text-sm">
              Visit a streamer profile and tap the &quot;Book&quot; button to request a collaboration or
              event.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
