import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAuthStore } from "../state/authStore";
import { supabase } from "../lib/supabase";
import type { User, UserRole, AdminPermissions } from "../types";
import {
  hasPermission,
  isSuperAdmin,
  getEffectivePermissions,
  getPermissionLabel,
  getPermissionCategory,
  DEFAULT_PERMISSIONS,
} from "../utils/permissions";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const AdminManagementScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const currentUser = useAuthStore((s) => s.user);

  // State for users list
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showEditAdmin, setShowEditAdmin] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");

  // Admin form state
  const [adminForm, setAdminForm] = useState({
    email: "",
    username: "",
    password: "",
    role: "moderator" as UserRole,
    useCustomPermissions: false,
    permissions: {} as AdminPermissions,
  });

  // Check if current user is super admin
  if (!isSuperAdmin(currentUser)) {
    return (
      <SafeAreaView className="flex-1 bg-[#0A0A0F]">
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="lock-closed" size={64} color="#EF4444" />
          <Text className="text-white text-xl font-bold mt-4">Access Denied</Text>
          <Text className="text-gray-400 text-center mt-2">
            Only Super Admins can manage admin accounts.
          </Text>
          <Pressable
            onPress={() => navigation.goBack()}
            className="mt-6 bg-purple-600 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Fetch users from Supabase
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('[AdminManagement] Error fetching users:', fetchError);
        setError(fetchError.message);
        return;
      }

      // Transform database users to app User type
      const transformedUsers: User[] = (data || []).map((dbUser) => ({
        id: dbUser.id,
        email: dbUser.email,
        username: dbUser.username,
        avatar: dbUser.avatar,
        bio: dbUser.bio,
        tier: dbUser.tier || 'free',
        role: dbUser.role || 'user',
        permissions: dbUser.permissions,
        referralCode: dbUser.referral_code,
        followedStreamers: [],
        followedArtists: [],
        followingUsers: [],
        followers: [],
        hasCompletedOnboarding: dbUser.has_completed_onboarding,
        isVerified: dbUser.is_verified,
        verificationStatus: dbUser.verification_status,
        isInfluencer: dbUser.is_influencer,
        createdAt: dbUser.created_at,
      }));

      setUsers(transformedUsers);
    } catch (err) {
      console.error('[AdminManagement] Exception fetching users:', err);
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Load users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const adminUsers = users.filter((u) => u.role && u.role !== "user");
  const filteredAdmins =
    roleFilter === "all" ? adminUsers : adminUsers.filter((u) => u.role === roleFilter);

  const openCreateAdmin = () => {
    setAdminForm({
      email: "",
      username: "",
      password: "",
      role: "moderator",
      useCustomPermissions: false,
      permissions: {},
    });
    setShowCreateAdmin(true);
  };

  const openEditAdmin = (admin: User) => {
    setSelectedAdmin(admin);
    setAdminForm({
      email: admin.email,
      username: admin.username,
      password: "",
      role: admin.role || "moderator",
      useCustomPermissions: !!admin.permissions,
      permissions: admin.permissions || {},
    });
    setShowEditAdmin(true);
  };

  const handleCreateAdmin = async () => {
    if (!adminForm.email || !adminForm.username || !adminForm.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);

      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminForm.email,
        password: adminForm.password,
      });

      if (authError) {
        Alert.alert('Error', authError.message);
        return;
      }

      if (!authData.user) {
        Alert.alert('Error', 'Failed to create user');
        return;
      }

      const referralCode = "ADMIN" + Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: adminForm.email,
          username: adminForm.username,
          tier: 'superfan',
          role: adminForm.role,
          permissions: adminForm.useCustomPermissions ? JSON.stringify(adminForm.permissions) : null,
          referral_code: referralCode,
        });

      if (profileError) {
        console.error('[AdminManagement] Error creating profile:', profileError);
        Alert.alert('Error', profileError.message);
        return;
      }

      Alert.alert('Success', `Admin ${adminForm.username} created successfully`);
      setShowCreateAdmin(false);
      fetchUsers();
    } catch (err) {
      console.error('[AdminManagement] Exception creating admin:', err);
      Alert.alert('Error', String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAdmin = async () => {
    if (!selectedAdmin) return;

    try {
      setIsLoading(true);

      const { error: updateError } = await supabase
        .from('users')
        .update({
          username: adminForm.username,
          role: adminForm.role,
          permissions: adminForm.useCustomPermissions ? JSON.stringify(adminForm.permissions) : null,
        })
        .eq('id', selectedAdmin.id);

      if (updateError) {
        console.error('[AdminManagement] Error updating admin:', updateError);
        Alert.alert('Error', updateError.message);
        return;
      }

      Alert.alert('Success', `Admin ${adminForm.username} updated successfully`);
      setShowEditAdmin(false);
      setSelectedAdmin(null);
      fetchUsers();
    } catch (err) {
      console.error('[AdminManagement] Exception updating admin:', err);
      Alert.alert('Error', String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, username: string) => {
    // Prevent deleting self
    if (adminId === currentUser?.id) {
      Alert.alert('Error', 'Cannot delete your own admin account');
      return;
    }

    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete admin "${username}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);

              const { error: deleteError } = await supabase
                .from('users')
                .delete()
                .eq('id', adminId);

              if (deleteError) {
                console.error('[AdminManagement] Error deleting admin:', deleteError);
                Alert.alert('Error', deleteError.message);
                return;
              }

              Alert.alert('Success', `Admin ${username} deleted successfully`);
              fetchUsers();
            } catch (err) {
              console.error('[AdminManagement] Exception deleting admin:', err);
              Alert.alert('Error', String(err));
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const togglePermission = (permission: keyof AdminPermissions) => {
    setAdminForm({
      ...adminForm,
      permissions: {
        ...adminForm.permissions,
        [permission]: !adminForm.permissions[permission],
      },
    });
  };

  const applyRoleDefaults = (role: UserRole) => {
    setAdminForm({
      ...adminForm,
      role,
      permissions: DEFAULT_PERMISSIONS[role] || {},
    });
  };

  const renderPermissionToggle = (permission: keyof AdminPermissions) => (
    <View key={permission} className="flex-row items-center justify-between py-3 border-b border-gray-800">
      <View className="flex-1">
        <Text className="text-white">{getPermissionLabel(permission)}</Text>
        <Text className="text-gray-500 text-xs mt-0.5">{getPermissionCategory(permission)}</Text>
      </View>
      <Switch
        value={adminForm.permissions[permission] === true}
        onValueChange={() => togglePermission(permission)}
        trackColor={{ false: "#374151", true: "#8B5CF6" }}
        thumbColor={adminForm.permissions[permission] ? "#fff" : "#9CA3AF"}
      />
    </View>
  );

  const renderAdminForm = (isEdit: boolean) => {
    const allPermissions: (keyof AdminPermissions)[] = [
      "viewUsers",
      "editUsers",
      "suspendUsers",
      "deleteUsers",
      "verifyUsers",
      "viewStreamers",
      "createStreamers",
      "editStreamers",
      "deleteStreamers",
      "viewArtists",
      "createArtists",
      "editArtists",
      "deleteArtists",
      "manageTracks",
      "viewContent",
      "deleteContent",
      "moderateContent",
      "viewReports",
      "reviewReports",
      "takeAction",
      "createAnnouncements",
      "manageAdmins",
      "viewAnalytics",
      "systemSettings",
      "viewMerchants",
      "manageMerchants",
      "viewOrders",
      "manageOrders",
    ];

    const groupedPermissions = allPermissions.reduce(
      (acc, perm) => {
        const category = getPermissionCategory(perm);
        if (!acc[category]) acc[category] = [];
        acc[category].push(perm);
        return acc;
      },
      {} as Record<string, (keyof AdminPermissions)[]>
    );

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-6">
            <Text className="text-white text-lg font-bold mb-4">
              {isEdit ? "Edit Admin" : "Create New Admin"}
            </Text>

            {/* Basic Info */}
            <View className="mb-6">
              <Text className="text-gray-400 mb-2">Email</Text>
              <TextInput
                value={adminForm.email}
                onChangeText={(text) => setAdminForm({ ...adminForm, email: text })}
                placeholder="admin@example.com"
                placeholderTextColor="#6B7280"
                className="bg-[#151520] text-white px-4 py-3 rounded-xl"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isEdit}
              />
            </View>

            <View className="mb-6">
              <Text className="text-gray-400 mb-2">Username</Text>
              <TextInput
                value={adminForm.username}
                onChangeText={(text) => setAdminForm({ ...adminForm, username: text })}
                placeholder="Username"
                placeholderTextColor="#6B7280"
                className="bg-[#151520] text-white px-4 py-3 rounded-xl"
                autoCapitalize="none"
              />
            </View>

            {!isEdit && (
              <View className="mb-6">
                <Text className="text-gray-400 mb-2">Password</Text>
                <TextInput
                  value={adminForm.password}
                  onChangeText={(text) => setAdminForm({ ...adminForm, password: text })}
                  placeholder="Password"
                  placeholderTextColor="#6B7280"
                  className="bg-[#151520] text-white px-4 py-3 rounded-xl"
                  secureTextEntry
                />
              </View>
            )}

            {/* Role Selection */}
            <View className="mb-6">
              <Text className="text-gray-400 mb-2">Role</Text>
              <View className="flex-row gap-2">
                {(["admin", "moderator", "support"] as UserRole[]).map((role) => (
                  <Pressable
                    key={role}
                    onPress={() => {
                      setAdminForm({ ...adminForm, role });
                      if (!adminForm.useCustomPermissions) {
                        applyRoleDefaults(role);
                      }
                    }}
                    className={`flex-1 py-3 rounded-xl ${adminForm.role === role ? "bg-purple-600" : "bg-[#151520] border border-gray-700"
                      }`}
                  >
                    <Text
                      className={`text-center font-semibold capitalize ${adminForm.role === role ? "text-white" : "text-gray-400"
                        }`}
                    >
                      {role}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Custom Permissions Toggle */}
            <View className="flex-row items-center justify-between mb-4 p-4 bg-[#151520] rounded-xl">
              <View className="flex-1">
                <Text className="text-white font-semibold">Custom Permissions</Text>
                <Text className="text-gray-400 text-xs mt-1">
                  Override default role permissions
                </Text>
              </View>
              <Switch
                value={adminForm.useCustomPermissions}
                onValueChange={(value) => {
                  setAdminForm({
                    ...adminForm,
                    useCustomPermissions: value,
                    permissions: value ? adminForm.permissions : {},
                  });
                  if (!value) {
                    applyRoleDefaults(adminForm.role);
                  }
                }}
                trackColor={{ false: "#374151", true: "#8B5CF6" }}
                thumbColor={adminForm.useCustomPermissions ? "#fff" : "#9CA3AF"}
              />
            </View>

            {/* Permissions */}
            {adminForm.useCustomPermissions && (
              <View className="bg-[#151520] rounded-xl p-4">
                <Text className="text-white font-bold mb-4">Permissions</Text>
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <View key={category} className="mb-4">
                    <Text className="text-purple-400 font-semibold mb-2">{category}</Text>
                    {perms.map((perm) => renderPermissionToggle(perm))}
                  </View>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            <View className="flex-row gap-3 mt-6">
              <Pressable
                onPress={() => (isEdit ? setShowEditAdmin(false) : setShowCreateAdmin(false))}
                className="flex-1 bg-gray-700 py-4 rounded-xl"
              >
                <Text className="text-white text-center font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={isEdit ? handleEditAdmin : handleCreateAdmin}
                className="flex-1 bg-purple-600 py-4 rounded-xl"
              >
                <Text className="text-white text-center font-semibold">
                  {isEdit ? "Save Changes" : "Create Admin"}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-800">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={() => navigation.goBack()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <Text className="text-white text-2xl font-bold flex-1">Admin Management</Text>
          <Pressable onPress={openCreateAdmin} className="bg-purple-600 px-4 py-2 rounded-xl">
            <View className="flex-row items-center">
              <Ionicons name="add" size={20} color="white" />
              <Text className="text-white font-semibold ml-1">New</Text>
            </View>
          </Pressable>
        </View>

        {/* Role Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {["all", "admin", "moderator", "support"].map((role) => (
              <Pressable
                key={role}
                onPress={() => setRoleFilter(role as typeof roleFilter)}
                className={`px-4 py-2 rounded-full ${roleFilter === role ? "bg-purple-600" : "bg-[#151520] border border-gray-700"
                  }`}
              >
                <Text
                  className={`font-semibold capitalize ${roleFilter === role ? "text-white" : "text-gray-400"
                    }`}
                >
                  {role}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Admin List */}
      <ScrollView className="flex-1 px-6 py-4">
        {isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text className="text-gray-400 mt-4">Loading admins...</Text>
          </View>
        ) : error ? (
          <View className="items-center py-12">
            <Ionicons name="alert-circle" size={64} color="#EF4444" />
            <Text className="text-red-400 mt-4">{error}</Text>
            <Pressable onPress={fetchUsers} className="mt-4 bg-purple-600 px-6 py-3 rounded-xl">
              <Text className="text-white font-semibold">Retry</Text>
            </Pressable>
          </View>
        ) : filteredAdmins.length === 0 ? (
          <View className="items-center py-12">
            <Ionicons name="people-outline" size={64} color="#4B5563" />
            <Text className="text-gray-400 mt-4">No admins found</Text>
          </View>
        ) : (
          filteredAdmins.map((admin) => {
            const permissions = getEffectivePermissions(admin);
            const permissionCount = Object.values(permissions).filter(Boolean).length;

            return (
              <View key={admin.id} className="bg-[#151520] rounded-xl p-4 mb-3 border border-gray-800">
                <View className="flex-row items-start">
                  <Image
                    source={{ uri: admin.avatar || "https://i.pravatar.cc/150?img=50" }}
                    style={{ width: 56, height: 56, borderRadius: 28 }}
                    contentFit="cover"
                  />
                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center">
                      <Text className="text-white font-bold text-lg">{admin.username}</Text>
                      <View
                        className={`ml-2 px-2 py-0.5 rounded ${admin.role === "admin"
                          ? "bg-red-500/20"
                          : admin.role === "moderator"
                            ? "bg-blue-500/20"
                            : "bg-green-500/20"
                          }`}
                      >
                        <Text
                          className={`text-xs font-bold capitalize ${admin.role === "admin"
                            ? "text-red-400"
                            : admin.role === "moderator"
                              ? "text-blue-400"
                              : "text-green-400"
                            }`}
                        >
                          {admin.role}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-gray-400 text-sm mt-1">{admin.email}</Text>
                    <Text className="text-gray-500 text-xs mt-2">
                      {permissionCount} permissions • Created{" "}
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row gap-2 mt-3">
                  <Pressable
                    onPress={() => openEditAdmin(admin)}
                    className="flex-1 bg-gray-700 py-3 rounded-xl flex-row items-center justify-center"
                  >
                    <Ionicons name="create-outline" size={18} color="white" />
                    <Text className="text-white font-semibold ml-2">Edit</Text>
                  </Pressable>
                  {admin.id !== currentUser?.id && (
                    <Pressable
                      onPress={() => handleDeleteAdmin(admin.id, admin.username)}
                      className="flex-1 bg-red-500/20 py-3 rounded-xl flex-row items-center justify-center"
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      <Text className="text-red-400 font-semibold ml-2">Remove</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Create Admin Modal */}
      <Modal
        visible={showCreateAdmin}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateAdmin(false)}
      >
        <View className="flex-1 bg-[#0A0A0F]">{renderAdminForm(false)}</View>
      </Modal>

      {/* Edit Admin Modal */}
      <Modal
        visible={showEditAdmin}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditAdmin(false)}
      >
        <View className="flex-1 bg-[#0A0A0F]">{renderAdminForm(true)}</View>
      </Modal>
    </SafeAreaView>
  );
};
