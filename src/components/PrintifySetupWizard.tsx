import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

type Provider = "printify" | "printful";

interface PrintifySetupWizardProps {
  visible: boolean;
  onClose: () => void;
  streamerId: string;
  streamerName: string;
  streamerAvatar?: string;
  isAdmin?: boolean;
  // Store actions
  validateAndConnectPrintify: (streamerId: string, apiToken: string) => Promise<{
    success: boolean;
    shops?: Array<{ id: number; title: string }>;
    error?: string;
  }>;
  selectPrintifyShop: (streamerId: string, shopId: number, shopName: string) => void;
  syncPrintifyProducts: (streamerId: string, streamerName: string, streamerAvatar?: string) => Promise<{
    success: boolean;
    syncedCount?: number;
    error?: string;
  }>;
  validateAndConnectPrintful?: (streamerId: string, apiToken: string, storeId?: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  syncPrintfulProducts?: (streamerId: string, streamerName: string) => Promise<{
    success: boolean;
    syncedCount?: number;
    error?: string;
  }>;
}

type WizardStep = 
  | "welcome"
  | "choose-provider"
  | "open-printify"
  | "create-token"
  | "enter-token"
  | "select-shop"
  | "syncing"
  | "complete";

const PRINTIFY_STEPS = [
  { key: "welcome", title: "Welcome" },
  { key: "choose-provider", title: "Provider" },
  { key: "open-printify", title: "Open Site" },
  { key: "create-token", title: "Get Token" },
  { key: "enter-token", title: "Connect" },
  { key: "select-shop", title: "Shop" },
  { key: "syncing", title: "Sync" },
  { key: "complete", title: "Done" },
];

export const PrintifySetupWizard: React.FC<PrintifySetupWizardProps> = ({
  visible,
  onClose,
  streamerId,
  streamerName,
  streamerAvatar,
  isAdmin = false,
  validateAndConnectPrintify,
  selectPrintifyShop,
  syncPrintifyProducts,
  validateAndConnectPrintful,
  syncPrintfulProducts,
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>("welcome");
  const [selectedProvider, setSelectedProvider] = useState<Provider>("printify");
  const [apiToken, setApiToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [availableShops, setAvailableShops] = useState<Array<{ id: number; title: string }>>([]);
  const [selectedShop, setSelectedShop] = useState<{ id: number; title: string } | null>(null);
  const [syncedCount, setSyncedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const resetWizard = () => {
    setCurrentStep("welcome");
    setSelectedProvider("printify");
    setApiToken("");
    setIsConnecting(false);
    setIsSyncing(false);
    setAvailableShops([]);
    setSelectedShop(null);
    setSyncedCount(0);
    setError(null);
  };

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  const getCurrentStepIndex = () => {
    return PRINTIFY_STEPS.findIndex((s) => s.key === currentStep);
  };

  const handleOpenPrintify = async () => {
    const url = selectedProvider === "printify" 
      ? "https://printify.com/app/account/api" 
      : "https://www.printful.com/dashboard/settings/api";
    
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert("Error", "Could not open browser. Please visit " + url + " manually.");
    }
  };

  const handleConnectToken = async () => {
    if (!apiToken.trim()) {
      setError("Please enter your API token");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      if (selectedProvider === "printify") {
        const result = await validateAndConnectPrintify(streamerId, apiToken.trim());

        if (result.success && result.shops && result.shops.length > 0) {
          setAvailableShops(result.shops);
          if (result.shops.length === 1) {
            // Auto-select single shop
            setSelectedShop(result.shops[0]);
            selectPrintifyShop(streamerId, result.shops[0].id, result.shops[0].title);
            setCurrentStep("syncing");
            handleSyncProducts();
          } else {
            setCurrentStep("select-shop");
          }
        } else {
          setError(result.error || "Failed to connect. Please check your API token.");
        }
      } else if (validateAndConnectPrintful) {
        const result = await validateAndConnectPrintful(streamerId, apiToken.trim());
        if (result.success) {
          setCurrentStep("syncing");
          handleSyncProductsPrintful();
        } else {
          setError(result.error || "Failed to connect. Please check your API token.");
        }
      }
    } catch (e) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSelectShop = (shop: { id: number; title: string }) => {
    setSelectedShop(shop);
    selectPrintifyShop(streamerId, shop.id, shop.title);
    setCurrentStep("syncing");
    handleSyncProducts();
  };

  const handleSyncProducts = async () => {
    setIsSyncing(true);
    setError(null);

    try {
      const result = await syncPrintifyProducts(streamerId, streamerName, streamerAvatar);
      
      if (result.success) {
        setSyncedCount(result.syncedCount || 0);
        setCurrentStep("complete");
      } else {
        setError(result.error || "Failed to sync products.");
      }
    } catch (e) {
      setError("An unexpected error occurred while syncing.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncProductsPrintful = async () => {
    if (!syncPrintfulProducts) return;
    
    setIsSyncing(true);
    setError(null);

    try {
      const result = await syncPrintfulProducts(streamerId, streamerName);
      
      if (result.success) {
        setSyncedCount(result.syncedCount || 0);
        setCurrentStep("complete");
      } else {
        setError(result.error || "Failed to sync products.");
      }
    } catch (e) {
      setError("An unexpected error occurred while syncing.");
    } finally {
      setIsSyncing(false);
    }
  };

  const renderStepIndicator = () => {
    const currentIndex = getCurrentStepIndex();
    
    return (
      <View className="flex-row items-center justify-center px-4 py-3 bg-[#0A0A0F]">
        {PRINTIFY_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <React.Fragment key={step.key}>
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  isCompleted
                    ? "bg-green-600"
                    : isCurrent
                    ? "bg-purple-600"
                    : "bg-gray-700"
                }`}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={16} color="white" />
                ) : (
                  <Text className="text-white text-xs font-bold">{index + 1}</Text>
                )}
              </View>
              {index < PRINTIFY_STEPS.length - 1 && (
                <View
                  className={`h-0.5 w-4 ${
                    isCompleted ? "bg-green-600" : "bg-gray-700"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  const renderContent = () => {
    switch (currentStep) {
      case "welcome":
        return (
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-24 h-24 rounded-full bg-purple-600/20 items-center justify-center mb-6">
              <Ionicons name="shirt" size={48} color="#A855F7" />
            </View>
            <Text className="text-white text-2xl font-bold text-center mb-2">
              {isAdmin ? "Set Up DDNS Store" : "Set Up Your Merch Store"}
            </Text>
            <Text className="text-gray-400 text-center mb-8">
              {isAdmin 
                ? "Connect your print-on-demand provider to start selling DDNS branded merchandise"
                : "Connect your print-on-demand account to start selling merch to your fans"
              }
            </Text>

            <View className="w-full space-y-3 mb-8">
              <View className="flex-row items-center bg-[#151520] p-4 rounded-xl">
                <View className="w-10 h-10 rounded-full bg-green-600/20 items-center justify-center mr-3">
                  <Ionicons name="flash" size={20} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold">Quick Setup</Text>
                  <Text className="text-gray-400 text-sm">Takes about 2 minutes</Text>
                </View>
              </View>

              <View className="flex-row items-center bg-[#151520] p-4 rounded-xl">
                <View className="w-10 h-10 rounded-full bg-blue-600/20 items-center justify-center mr-3">
                  <Ionicons name="sync" size={20} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold">Auto-Sync Products</Text>
                  <Text className="text-gray-400 text-sm">Import all your designs instantly</Text>
                </View>
              </View>

              <View className="flex-row items-center bg-[#151520] p-4 rounded-xl">
                <View className="w-10 h-10 rounded-full bg-purple-600/20 items-center justify-center mr-3">
                  <Ionicons name="cash" size={20} color="#A855F7" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold">Keep Your Profits</Text>
                  <Text className="text-gray-400 text-sm">Low platform fees, you set your prices</Text>
                </View>
              </View>
            </View>

            <Pressable
              onPress={() => setCurrentStep("choose-provider")}
              className="bg-purple-600 w-full py-4 rounded-xl"
            >
              <Text className="text-white text-center font-bold text-lg">Let's Get Started</Text>
            </Pressable>
          </View>
        );

      case "choose-provider":
        return (
          <View className="flex-1 px-6 pt-6">
            <Text className="text-white text-xl font-bold text-center mb-2">
              Choose Your Provider
            </Text>
            <Text className="text-gray-400 text-center mb-6">
              Select your print-on-demand service
            </Text>

            <Pressable
              onPress={() => setSelectedProvider("printify")}
              className={`bg-[#151520] p-5 rounded-xl mb-4 border-2 ${
                selectedProvider === "printify" ? "border-green-500" : "border-transparent"
              }`}
            >
              <View className="flex-row items-center">
                <View className="w-14 h-14 rounded-xl bg-green-600/20 items-center justify-center mr-4">
                  <Ionicons name="pricetag" size={28} color="#10B981" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-white text-lg font-bold">Printify</Text>
                    <View className="bg-green-600/20 px-2 py-0.5 rounded ml-2">
                      <Text className="text-green-400 text-xs font-bold">RECOMMENDED</Text>
                    </View>
                  </View>
                  <Text className="text-gray-400 text-sm mt-1">
                    Lower costs, huge product catalog
                  </Text>
                </View>
                {selectedProvider === "printify" && (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                )}
              </View>

              <View className="mt-4 pt-4 border-t border-gray-700">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="checkmark" size={16} color="#9CA3AF" />
                  <Text className="text-gray-300 text-sm ml-2">100+ print providers</Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <Ionicons name="checkmark" size={16} color="#9CA3AF" />
                  <Text className="text-gray-300 text-sm ml-2">Lowest base prices</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="checkmark" size={16} color="#9CA3AF" />
                  <Text className="text-gray-300 text-sm ml-2">Easy API setup</Text>
                </View>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setSelectedProvider("printful")}
              className={`bg-[#151520] p-5 rounded-xl mb-6 border-2 ${
                selectedProvider === "printful" ? "border-red-500" : "border-transparent"
              }`}
            >
              <View className="flex-row items-center">
                <View className="w-14 h-14 rounded-xl bg-red-600/20 items-center justify-center mr-4">
                  <Ionicons name="shirt" size={28} color="#EF4444" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-lg font-bold">Printful</Text>
                  <Text className="text-gray-400 text-sm mt-1">
                    Premium quality, trusted brand
                  </Text>
                </View>
                {selectedProvider === "printful" && (
                  <Ionicons name="checkmark-circle" size={24} color="#EF4444" />
                )}
              </View>

              <View className="mt-4 pt-4 border-t border-gray-700">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="checkmark" size={16} color="#9CA3AF" />
                  <Text className="text-gray-300 text-sm ml-2">Premium print quality</Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <Ionicons name="checkmark" size={16} color="#9CA3AF" />
                  <Text className="text-gray-300 text-sm ml-2">In-house fulfillment</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="checkmark" size={16} color="#9CA3AF" />
                  <Text className="text-gray-300 text-sm ml-2">Branding options</Text>
                </View>
              </View>
            </Pressable>

            <View className="flex-row mt-auto">
              <Pressable
                onPress={() => setCurrentStep("welcome")}
                className="flex-1 bg-gray-700 py-4 rounded-xl mr-2"
              >
                <Text className="text-white text-center font-bold">Back</Text>
              </Pressable>
              <Pressable
                onPress={() => setCurrentStep("open-printify")}
                className="flex-1 bg-purple-600 py-4 rounded-xl ml-2"
              >
                <Text className="text-white text-center font-bold">Continue</Text>
              </Pressable>
            </View>
          </View>
        );

      case "open-printify":
        return (
          <View className="flex-1 px-6 pt-6">
            <Text className="text-white text-xl font-bold text-center mb-2">
              Open {selectedProvider === "printify" ? "Printify" : "Printful"}
            </Text>
            <Text className="text-gray-400 text-center mb-6">
              First, let's open your {selectedProvider === "printify" ? "Printify" : "Printful"} dashboard
            </Text>

            <View className="bg-[#151520] p-6 rounded-xl mb-6">
              <View className="items-center mb-6">
                <View className="w-20 h-20 rounded-full bg-purple-600/20 items-center justify-center mb-4">
                  <Ionicons name="open-outline" size={40} color="#A855F7" />
                </View>
                <Text className="text-white font-bold text-lg">
                  {selectedProvider === "printify" 
                    ? "Sign in to Printify" 
                    : "Sign in to Printful"}
                </Text>
              </View>

              <View className="space-y-3 mb-6">
                <View className="flex-row items-start">
                  <View className="w-6 h-6 rounded-full bg-purple-600 items-center justify-center mr-3 mt-0.5">
                    <Text className="text-white text-xs font-bold">1</Text>
                  </View>
                  <Text className="text-gray-300 flex-1">
                    Click the button below to open {selectedProvider === "printify" ? "Printify" : "Printful"}
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <View className="w-6 h-6 rounded-full bg-purple-600 items-center justify-center mr-3 mt-0.5">
                    <Text className="text-white text-xs font-bold">2</Text>
                  </View>
                  <Text className="text-gray-300 flex-1">
                    Sign in or create an account if you don't have one
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <View className="w-6 h-6 rounded-full bg-purple-600 items-center justify-center mr-3 mt-0.5">
                    <Text className="text-white text-xs font-bold">3</Text>
                  </View>
                  <Text className="text-gray-300 flex-1">
                    Come back here once you're logged in
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={handleOpenPrintify}
                className="bg-green-600 py-4 rounded-xl flex-row items-center justify-center"
              >
                <Ionicons name="open-outline" size={20} color="white" />
                <Text className="text-white font-bold ml-2">
                  Open {selectedProvider === "printify" ? "Printify" : "Printful"}
                </Text>
              </Pressable>
            </View>

            <View className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/20 mb-6">
              <View className="flex-row items-center mb-2">
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <Text className="text-blue-400 font-bold ml-2">Don't have an account?</Text>
              </View>
              <Text className="text-blue-300/70 text-sm">
                {selectedProvider === "printify" 
                  ? "Sign up at printify.com - it's free! You can create products and designs in their editor."
                  : "Sign up at printful.com - it's free! Create a 'Manual order / API' store to get started."}
              </Text>
            </View>

            <View className="flex-row mt-auto">
              <Pressable
                onPress={() => setCurrentStep("choose-provider")}
                className="flex-1 bg-gray-700 py-4 rounded-xl mr-2"
              >
                <Text className="text-white text-center font-bold">Back</Text>
              </Pressable>
              <Pressable
                onPress={() => setCurrentStep("create-token")}
                className="flex-1 bg-purple-600 py-4 rounded-xl ml-2"
              >
                <Text className="text-white text-center font-bold">I'm Logged In</Text>
              </Pressable>
            </View>
          </View>
        );

      case "create-token":
        return (
          <ScrollView className="flex-1 px-6 pt-6">
            <Text className="text-white text-xl font-bold text-center mb-2">
              Create Your API Token
            </Text>
            <Text className="text-gray-400 text-center mb-6">
              Follow these steps to get your API token
            </Text>

            {selectedProvider === "printify" ? (
              <View className="bg-[#151520] p-5 rounded-xl mb-6">
                <Text className="text-white font-bold mb-4">📋 Printify API Token Steps:</Text>
                
                <View className="space-y-4">
                  <View className="flex-row items-start">
                    <View className="w-8 h-8 rounded-full bg-purple-600 items-center justify-center mr-3">
                      <Text className="text-white font-bold">1</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold">Go to Account Settings</Text>
                      <Text className="text-gray-400 text-sm mt-1">
                        Click your profile icon → "Connections" or go to Account → API
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-start">
                    <View className="w-8 h-8 rounded-full bg-purple-600 items-center justify-center mr-3">
                      <Text className="text-white font-bold">2</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold">Find "Personal Access Tokens"</Text>
                      <Text className="text-gray-400 text-sm mt-1">
                        Scroll down to the API section
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-start">
                    <View className="w-8 h-8 rounded-full bg-purple-600 items-center justify-center mr-3">
                      <Text className="text-white font-bold">3</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold">Generate New Token</Text>
                      <Text className="text-gray-400 text-sm mt-1">
                        Click "Generate new token" and name it (e.g., "DDNS App")
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-start">
                    <View className="w-8 h-8 rounded-full bg-purple-600 items-center justify-center mr-3">
                      <Text className="text-white font-bold">4</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold">Copy the Token</Text>
                      <Text className="text-gray-400 text-sm mt-1">
                        ⚠️ Copy it now! You won't see it again after closing
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View className="bg-[#151520] p-5 rounded-xl mb-6">
                <Text className="text-white font-bold mb-4">📋 Printful API Token Steps:</Text>
                
                <View className="space-y-4">
                  <View className="flex-row items-start">
                    <View className="w-8 h-8 rounded-full bg-red-600 items-center justify-center mr-3">
                      <Text className="text-white font-bold">1</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold">Go to Settings</Text>
                      <Text className="text-gray-400 text-sm mt-1">
                        Click "Settings" in the left sidebar
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-start">
                    <View className="w-8 h-8 rounded-full bg-red-600 items-center justify-center mr-3">
                      <Text className="text-white font-bold">2</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold">Select "Stores"</Text>
                      <Text className="text-gray-400 text-sm mt-1">
                        Create a "Manual order / API" store if you haven't
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-start">
                    <View className="w-8 h-8 rounded-full bg-red-600 items-center justify-center mr-3">
                      <Text className="text-white font-bold">3</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold">Go to API Settings</Text>
                      <Text className="text-gray-400 text-sm mt-1">
                        Navigate to Settings → API
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-start">
                    <View className="w-8 h-8 rounded-full bg-red-600 items-center justify-center mr-3">
                      <Text className="text-white font-bold">4</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold">Generate OAuth Token</Text>
                      <Text className="text-gray-400 text-sm mt-1">
                        Copy the generated token
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            <Pressable
              onPress={handleOpenPrintify}
              className="bg-blue-600/20 py-3 rounded-xl flex-row items-center justify-center mb-6 border border-blue-500/30"
            >
              <Ionicons name="open-outline" size={18} color="#3B82F6" />
              <Text className="text-blue-400 font-bold ml-2">
                Open {selectedProvider === "printify" ? "Printify" : "Printful"} API Page
              </Text>
            </Pressable>

            <View className="flex-row mb-6">
              <Pressable
                onPress={() => setCurrentStep("open-printify")}
                className="flex-1 bg-gray-700 py-4 rounded-xl mr-2"
              >
                <Text className="text-white text-center font-bold">Back</Text>
              </Pressable>
              <Pressable
                onPress={() => setCurrentStep("enter-token")}
                className="flex-1 bg-purple-600 py-4 rounded-xl ml-2"
              >
                <Text className="text-white text-center font-bold">I Have My Token</Text>
              </Pressable>
            </View>
          </ScrollView>
        );

      case "enter-token":
        return (
          <View className="flex-1 px-6 pt-6">
            <Text className="text-white text-xl font-bold text-center mb-2">
              Enter Your API Token
            </Text>
            <Text className="text-gray-400 text-center mb-6">
              Paste the token you just created
            </Text>

            <View className="bg-[#151520] p-5 rounded-xl mb-6">
              <View className="flex-row items-center mb-4">
                <Ionicons name="key" size={24} color="#A855F7" />
                <Text className="text-white font-bold ml-2">API Token</Text>
              </View>

              <TextInput
                placeholder="Paste your API token here..."
                placeholderTextColor="#6B7280"
                value={apiToken}
                onChangeText={(text) => {
                  setApiToken(text);
                  setError(null);
                }}
                secureTextEntry
                multiline
                className="bg-[#0A0A0F] text-white px-4 py-4 rounded-xl mb-4"
                style={{ minHeight: 80, textAlignVertical: "top" }}
              />

              {error && (
                <View className="bg-red-600/20 p-3 rounded-lg mb-4 flex-row items-center">
                  <Ionicons name="alert-circle" size={20} color="#EF4444" />
                  <Text className="text-red-400 ml-2 flex-1">{error}</Text>
                </View>
              )}

              <Pressable
                onPress={handleConnectToken}
                disabled={isConnecting || !apiToken.trim()}
                className={`py-4 rounded-xl flex-row items-center justify-center ${
                  isConnecting || !apiToken.trim() ? "bg-gray-700" : "bg-green-600"
                }`}
              >
                {isConnecting ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text className="text-white font-bold ml-2">Connecting...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="link" size={20} color="white" />
                    <Text className="text-white font-bold ml-2">Connect Account</Text>
                  </>
                )}
              </Pressable>
            </View>

            <View className="bg-yellow-900/20 p-4 rounded-xl border border-yellow-500/20 mb-6">
              <View className="flex-row items-center mb-2">
                <Ionicons name="shield-checkmark" size={20} color="#EAB308" />
                <Text className="text-yellow-400 font-bold ml-2">Your token is secure</Text>
              </View>
              <Text className="text-yellow-300/70 text-sm">
                We encrypt and store your token securely. It's only used to sync your products and process orders.
              </Text>
            </View>

            <View className="flex-row mt-auto">
              <Pressable
                onPress={() => setCurrentStep("create-token")}
                className="flex-1 bg-gray-700 py-4 rounded-xl"
              >
                <Text className="text-white text-center font-bold">Back</Text>
              </Pressable>
            </View>
          </View>
        );

      case "select-shop":
        return (
          <View className="flex-1 px-6 pt-6">
            <Text className="text-white text-xl font-bold text-center mb-2">
              Select Your Shop
            </Text>
            <Text className="text-gray-400 text-center mb-6">
              Choose which shop to connect
            </Text>

            <ScrollView className="flex-1">
              {availableShops.map((shop) => (
                <Pressable
                  key={shop.id}
                  onPress={() => handleSelectShop(shop)}
                  className="bg-[#151520] p-5 rounded-xl mb-3 flex-row items-center border-2 border-transparent active:border-purple-500"
                >
                  <View className="w-12 h-12 rounded-full bg-purple-600/20 items-center justify-center mr-4">
                    <Ionicons name="storefront" size={24} color="#A855F7" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-lg">{shop.title}</Text>
                    <Text className="text-gray-400 text-sm">Shop ID: {shop.id}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#6B7280" />
                </Pressable>
              ))}
            </ScrollView>

            <View className="flex-row mt-4">
              <Pressable
                onPress={() => setCurrentStep("enter-token")}
                className="flex-1 bg-gray-700 py-4 rounded-xl"
              >
                <Text className="text-white text-center font-bold">Back</Text>
              </Pressable>
            </View>
          </View>
        );

      case "syncing":
        return (
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-24 h-24 rounded-full bg-purple-600/20 items-center justify-center mb-6">
              <ActivityIndicator size="large" color="#A855F7" />
            </View>
            <Text className="text-white text-xl font-bold text-center mb-2">
              Syncing Your Products
            </Text>
            <Text className="text-gray-400 text-center">
              Importing your designs from {selectedProvider === "printify" ? "Printify" : "Printful"}...
            </Text>

            {error && (
              <View className="bg-red-600/20 p-4 rounded-xl mt-6 w-full">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="alert-circle" size={20} color="#EF4444" />
                  <Text className="text-red-400 font-bold ml-2">Sync Failed</Text>
                </View>
                <Text className="text-red-300/70">{error}</Text>
                <Pressable
                  onPress={() => {
                    setError(null);
                    if (selectedProvider === "printify") {
                      handleSyncProducts();
                    } else {
                      handleSyncProductsPrintful();
                    }
                  }}
                  className="bg-red-600 py-2 rounded-lg mt-3"
                >
                  <Text className="text-white text-center font-bold">Retry</Text>
                </Pressable>
              </View>
            )}
          </View>
        );

      case "complete":
        return (
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-24 h-24 rounded-full bg-green-600/20 items-center justify-center mb-6">
              <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            </View>
            <Text className="text-white text-2xl font-bold text-center mb-2">
              You're All Set! 🎉
            </Text>
            <Text className="text-gray-400 text-center mb-2">
              Your {selectedProvider === "printify" ? "Printify" : "Printful"} account is now connected
            </Text>
            
            {syncedCount > 0 && (
              <View className="bg-green-600/20 px-6 py-3 rounded-full mb-8">
                <Text className="text-green-400 font-bold">
                  {syncedCount} product{syncedCount !== 1 ? "s" : ""} imported!
                </Text>
              </View>
            )}

            <View className="w-full space-y-3 mb-8">
              <View className="flex-row items-center bg-[#151520] p-4 rounded-xl">
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text className="text-white ml-3 flex-1">Account connected</Text>
              </View>
              <View className="flex-row items-center bg-[#151520] p-4 rounded-xl">
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text className="text-white ml-3 flex-1">Products synced</Text>
              </View>
              <View className="flex-row items-center bg-[#151520] p-4 rounded-xl">
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text className="text-white ml-3 flex-1">Ready to sell!</Text>
              </View>
            </View>

            <Pressable
              onPress={handleClose}
              className="bg-purple-600 w-full py-4 rounded-xl"
            >
              <Text className="text-white text-center font-bold text-lg">
                Go to My Store
              </Text>
            </Pressable>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50">
        <View className="flex-1 bg-[#0A0A0F] mt-12 rounded-t-3xl overflow-hidden">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-800">
            <Text className="text-white font-bold text-lg">
              {isAdmin ? "Store Setup" : "Merch Store Setup"}
            </Text>
            <Pressable onPress={handleClose} className="p-2">
              <Ionicons name="close" size={24} color="white" />
            </Pressable>
          </View>

          {/* Step Indicator */}
          {currentStep !== "welcome" && currentStep !== "complete" && renderStepIndicator()}

          {/* Content */}
          <View className="flex-1 pb-6">
            {renderContent()}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PrintifySetupWizard;
