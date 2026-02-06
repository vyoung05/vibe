import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAuthStore } from "../state/authStore";
import { useAppStore } from "../state/appStore";
import { supabase } from "../lib/supabase";
import type { Streamer, User, Announcement, VerificationRequest, Report, Artist, Track } from "../types";
import { hasPermission, isSuperAdmin } from "../utils/permissions";
import { cleanupAllFakeData } from "../utils/cleanupDatabase";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const AdminDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((s) => s.user);

  // Database state for streamers
  const [dbStreamers, setDbStreamers] = useState<Streamer[]>([]);
  const [isLoadingStreamers, setIsLoadingStreamers] = useState(true);
  const [streamersError, setStreamersError] = useState<string | null>(null);

  // Database state for users
  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Keep using appStore for artists and other features (will migrate later)
  const artists = useAppStore((s) => s.artists);
  const addStreamer = useAppStore((s) => s.addStreamer);
  const updateStreamer = useAppStore((s) => s.updateStreamer);
  const deleteStreamer = useAppStore((s) => s.deleteStreamer);
  const addStreamerAccount = useAppStore((s) => s.addStreamerAccount);
  const addArtist = useAppStore((s) => s.addArtist);
  const updateArtist = useAppStore((s) => s.updateArtist);
  const deleteArtist = useAppStore((s) => s.deleteArtist);
  const addArtistAccount = useAppStore((s) => s.addArtistAccount);
  const updateArtistAccount = useAppStore((s) => s.updateArtistAccount);
  const getArtistAccount = useAppStore((s) => s.getArtistAccount);
  const artistAccounts = useAppStore((s) => s.artistAccounts);
  const getAllUsers = useAppStore((s) => s.getAllUsers);
  const updateUserAccount = useAppStore((s) => s.updateUserAccount);
  const deleteUserAccount = useAppStore((s) => s.deleteUserAccount);
  const announcements = useAppStore((s) => s.announcements);
  const addAnnouncement = useAppStore((s) => s.addAnnouncement);
  const deleteAnnouncement = useAppStore((s) => s.deleteAnnouncement);
  const notifyFollowersGoLive = useAppStore((s) => s.notifyFollowersGoLive);
  const streamerAccounts = useAppStore((s) => s.streamerAccounts);
  const getStreamerAccount = useAppStore((s) => s.getStreamerAccount);
  const updateStreamerAccount = useAppStore((s) => s.updateStreamerAccount);
  const verificationRequests = useAppStore((s) => s.verificationRequests);
  const approveVerification = useAppStore((s) => s.approveVerification);
  const rejectVerification = useAppStore((s) => s.rejectVerification);
  const reports = useAppStore((s) => s.reports);
  const reviewReport = useAppStore((s) => s.reviewReport);
  const dismissReport = useAppStore((s) => s.dismissReport);
  const suspendUser = useAppStore((s) => s.suspendUser);
  const unsuspendUser = useAppStore((s) => s.unsuspendUser);
  const deleteUserAccountPermanently = useAppStore((s) => s.deleteUserAccountPermanently);
  const deletePost = useAppStore((s) => s.deletePost);
  const addTrack = useAppStore((s) => s.addTrack);
  const updateTrack = useAppStore((s) => s.updateTrack);
  const deleteTrack = useAppStore((s) => s.deleteTrack);

  const [activeTab, setActiveTab] = useState<"streamers" | "users" | "verify" | "reports" | "artists" | "announcements">("streamers");
  const [showCreateStreamer, setShowCreateStreamer] = useState(false);
  const [showEditStreamer, setShowEditStreamer] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showSetStreamerPassword, setShowSetStreamerPassword] = useState(false);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [useExistingUser, setUseExistingUser] = useState(false);
  const [selectedExistingUser, setSelectedExistingUser] = useState<User | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [showCreateArtist, setShowCreateArtist] = useState(false);
  const [showEditArtist, setShowEditArtist] = useState(false);
  const [showSetArtistPassword, setShowSetArtistPassword] = useState(false);
  const [showManageMusic, setShowManageMusic] = useState(false);
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [showEditTrack, setShowEditTrack] = useState(false);
  const [showAdminMusic, setShowAdminMusic] = useState(false);
  const [showAddAdminTrack, setShowAddAdminTrack] = useState(false);
  const [showEditAdminTrack, setShowEditAdminTrack] = useState(false);
  const [showEditAdminArtist, setShowEditAdminArtist] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [selectedStreamer, setSelectedStreamer] = useState<Streamer | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  // Streamer form state
  const [streamerForm, setStreamerForm] = useState({
    name: "",
    gamertag: "",
    email: "",
    password: "",
    avatar: "",
    bio: "",
    referralCode: "",
    twitchUrl: "",
    youtubeUrl: "",
    tiktokUrl: "",
    instagramUrl: "",
  });

  // User form state
  const [userForm, setUserForm] = useState({
    email: "",
    username: "",
    password: "",
    avatar: "",
    bio: "",
    tier: "free" as "free" | "superfan",
    role: "user" as "user" | "admin" | "moderator" | "support",
    referralCode: "",
    isVerified: false,
    isInfluencer: false,
    isStreamer: false,
  });

  // Artist form state
  const [artistForm, setArtistForm] = useState({
    name: "",
    stageName: "",
    email: "",
    password: "",
    avatar: "",
    bio: "",
    genre: "",
    referralCode: "",
    spotifyUrl: "",
    appleMusicUrl: "",
    soundcloudUrl: "",
    instagramUrl: "",
  });

  // Artist login setup form
  const [artistEmail, setArtistEmail] = useState("");
  const [artistPassword, setArtistPassword] = useState("");

  // Track form state
  const [trackForm, setTrackForm] = useState({
    title: "",
    coverArt: "",
    audioUrl: "",
    duration: "",
    price: "",
    isSnippetOnly: false,
    snippetDuration: "30",
  });

  // Admin Track form state
  const [adminTrackForm, setAdminTrackForm] = useState({
    title: "",
    coverArt: "",
    audioUrl: "",
    duration: "",
    price: "",
    isSnippetOnly: false,
    snippetDuration: "30",
  });

  // Admin Artist profile form state
  const [adminArtistForm, setAdminArtistForm] = useState({
    stageName: "",
    bio: "",
    genre: "",
    spotifyUrl: "",
    appleMusicUrl: "",
    soundCloudUrl: "",
    instagramUrl: "",
  });

  // Streamer login setup form
  const [streamerEmail, setStreamerEmail] = useState("");
  const [streamerPassword, setStreamerPassword] = useState("");

  // Announcement form state
  const [announcementForm, setAnnouncementForm] = useState({
    message: "",
    duration: "24", // Duration in hours
  });

  // Verification rejection state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <View className="flex-1 bg-[#0A0A0F] items-center justify-center px-6">
        <Ionicons name="lock-closed" size={64} color="#EF4444" />
        <Text className="text-white text-xl font-bold mt-4">Access Denied</Text>
        <Text className="text-gray-400 text-center mt-2">
          You do not have permission to access this area.
        </Text>
      </View>
    );
  }

  // Admin Artist ID constant
  const ADMIN_ARTIST_ID = "admin-artist-001";

  // Get admin artist from artists array - will update when artists change
  const adminArtist = artists.find(a => a.id === ADMIN_ARTIST_ID);

  // Create admin artist if it does not exist - returns the artist from store or newly created
  const ensureAdminArtist = (): Artist => {
    const existingAdminArtist = artists.find(a => a.id === ADMIN_ARTIST_ID);
    if (existingAdminArtist) {
      // Sync admin artist profile with current user profile
      if (user && (existingAdminArtist.name !== user.username || existingAdminArtist.avatar !== user.avatar || existingAdminArtist.email !== user.email)) {
        updateArtist(ADMIN_ARTIST_ID, {
          name: user.username || existingAdminArtist.name,
          stageName: user.username || "DDNS Admin",
          avatar: user.avatar || existingAdminArtist.avatar,
          email: user.email || existingAdminArtist.email,
        });
      }
      return existingAdminArtist;
    }

    const newAdminArtist: Artist = {
      id: ADMIN_ARTIST_ID,
      name: user?.username || "Admin",
      stageName: user?.username || "DDNS Admin",
      email: user?.email || "admin@ddns.com",
      avatar: user?.avatar || "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&h=400&fit=crop",
      headerImages: [
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop",
      ],
      bio: "Official DDNS Admin Artist Profile",
      genre: "Various",
      socialLinks: user?.socialLinks || {},
      followerCount: 0,
      referralCode: "ADMIN" + Math.random().toString(36).substring(2, 6).toUpperCase(),
      tracks: [],
      albums: [],
      totalPlays: 0,
      totalSales: 0,
      isVerified: true,
      hotStatus: false,
    };
    addArtist(newAdminArtist);
    return newAdminArtist;
  };

  // Fetch streamers from Supabase
  const fetchStreamers = async () => {
    try {
      setIsLoadingStreamers(true);
      setStreamersError(null);

      console.log('[AdminDashboard] Fetching streamers from Supabase...');

      const { data, error } = await supabase
        .from('streamers')
        .select(`
          *,
          streamer_social_links (*),
          streamer_header_images (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[AdminDashboard] Error fetching streamers:', error);
        setStreamersError(error.message);
        return;
      }

      // Transform database streamers to app Streamer type
      const transformedStreamers: Streamer[] = (data || []).map((dbStreamer) => ({
        id: dbStreamer.id,
        userId: dbStreamer.user_id,
        name: dbStreamer.name,
        gamertag: dbStreamer.gamertag,
        email: dbStreamer.email,
        avatar: dbStreamer.avatar,
        headerImages: dbStreamer.streamer_header_images?.map((img: any) => img.image_url) || [],
        bio: dbStreamer.bio,
        isLive: dbStreamer.is_live,
        liveStreamUrl: dbStreamer.live_stream_url,
        liveTitle: dbStreamer.live_title,
        lastLiveDate: dbStreamer.last_live_date,
        socialLinks: dbStreamer.streamer_social_links?.[0] ? {
          instagram: dbStreamer.streamer_social_links[0].instagram,
          twitter: dbStreamer.streamer_social_links[0].twitter,
          tiktok: dbStreamer.streamer_social_links[0].tiktok,
          twitch: dbStreamer.streamer_social_links[0].twitch,
          youtube: dbStreamer.streamer_social_links[0].youtube,
          kick: dbStreamer.streamer_social_links[0].kick,
        } : {},
        streamPlatforms: dbStreamer.streamer_social_links?.[0] ? {
          twitch: dbStreamer.streamer_social_links[0].twitch,
          youtube: dbStreamer.streamer_social_links[0].youtube,
          tiktok: dbStreamer.streamer_social_links[0].tiktok,
          instagram: dbStreamer.streamer_social_links[0].instagram,
        } : {},
        schedule: [],
        followerCount: dbStreamer.follower_count || 0,
        referralCode: dbStreamer.referral_code,
        isVerified: dbStreamer.is_verified,
      }));

      console.log('[AdminDashboard] Loaded', transformedStreamers.length, 'streamers');
      setDbStreamers(transformedStreamers);
    } catch (err) {
      console.error('[AdminDashboard] Exception fetching streamers:', err);
      setStreamersError(String(err));
    } finally {
      setIsLoadingStreamers(false);
    }
  };

  // Load streamers on mount
  useEffect(() => {
    fetchStreamers();
  }, []);

  // Fetch users from Supabase
  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      setUsersError(null);

      console.log('[AdminDashboard] Fetching users from Supabase...');

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[AdminDashboard] Error fetching users:', error);
        setUsersError(error.message);
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
        permissions: dbUser.permissions ? (typeof dbUser.permissions === 'string' ? JSON.parse(dbUser.permissions) : dbUser.permissions) : undefined,
        accountStatus: dbUser.account_status || 'active',
        referralCode: dbUser.referral_code || '',
        followedStreamers: dbUser.followed_streamers || [],
        followedArtists: dbUser.followed_artists || [],
        followingUsers: dbUser.following_users || [],
        followers: dbUser.followers || [],
        hasCompletedOnboarding: dbUser.has_completed_onboarding,
        isVerified: dbUser.is_verified,
        verificationStatus: dbUser.verification_status || 'none',
        isInfluencer: dbUser.is_influencer,
        createdAt: dbUser.created_at,
      }));

      console.log('[AdminDashboard] Loaded', transformedUsers.length, 'users');
      setDbUsers(transformedUsers);
    } catch (err) {
      console.error('[AdminDashboard] Exception fetching users:', err);
      setUsersError(String(err));
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Load users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Create user in Supabase Auth + users table
  const handleCreateUser = async () => {
    if (!userForm.email || !userForm.username || !userForm.password) {
      Alert.alert('Error', 'Please fill in email, username, and password');
      return;
    }

    try {
      setIsLoadingUsers(true);
      console.log('[AdminDashboard] Creating user:', userForm.email);

      // First, create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userForm.email,
        password: userForm.password,
        options: {
          data: {
            username: userForm.username,
          }
        }
      });

      if (authError) {
        console.error('[AdminDashboard] Auth error creating user:', authError);
        Alert.alert('Error', authError.message);
        return;
      }

      if (!authData.user) {
        Alert.alert('Error', 'Failed to create user account');
        return;
      }

      const referralCode = userForm.referralCode || "USER" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const avatar = userForm.avatar || `https://i.pravatar.cc/150?u=${authData.user.id}`;

      // Create user profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userForm.email,
          username: userForm.username,
          avatar: avatar,
          bio: userForm.bio || null,
          tier: userForm.tier,
          role: userForm.role,
          referral_code: referralCode,
          is_verified: userForm.isVerified,
          is_influencer: userForm.isInfluencer,
          has_completed_onboarding: false,
          account_status: 'active',
          followed_streamers: [],
          followed_artists: [],
          following_users: [],
          followers: [],
        });

      if (profileError) {
        console.error('[AdminDashboard] Error creating user profile:', profileError);
        Alert.alert('Error', profileError.message);
        return;
      }

      Alert.alert('Success', `User ${userForm.username} created successfully!`);
      setShowCreateUser(false);
      setUserForm({
        email: "",
        username: "",
        password: "",
        avatar: "",
        bio: "",
        tier: "free",
        role: "user",
        referralCode: "",
        isVerified: false,
        isInfluencer: false,
        isStreamer: false,
      });

      // Refresh users list
      fetchUsers();
    } catch (err) {
      console.error('[AdminDashboard] Exception creating user:', err);
      Alert.alert('Error', String(err));
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Edit user in Supabase
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      setIsLoadingUsers(true);
      console.log('[AdminDashboard] Updating user:', selectedUser.id);

      const { error: updateError } = await supabase
        .from('users')
        .update({
          username: userForm.username,
          avatar: userForm.avatar || selectedUser.avatar,
          bio: userForm.bio,
          tier: userForm.tier,
          role: userForm.role,
          is_verified: userForm.isVerified,
          is_influencer: userForm.isInfluencer,
        })
        .eq('id', selectedUser.id);

      if (updateError) {
        console.error('[AdminDashboard] Error updating user:', updateError);
        Alert.alert('Error', updateError.message);
        return;
      }

      // Handle streamer access toggle
      const { data: existingStreamer } = await supabase
        .from('streamers')
        .select('id')
        .eq('user_id', selectedUser.id)
        .single();

      if (userForm.isStreamer && !existingStreamer) {
        // Create streamer profile for this user
        const referralCode = "STREAM" + Math.random().toString(36).substring(2, 8).toUpperCase();
        const { error: streamerError } = await supabase
          .from('streamers')
          .insert({
            user_id: selectedUser.id,
            name: userForm.username,
            gamertag: userForm.username,
            email: selectedUser.email,
            avatar: userForm.avatar || selectedUser.avatar,
            bio: userForm.bio || 'New streamer on DDNS!',
            is_live: false,
            follower_count: 0,
            referral_code: referralCode,
            is_verified: userForm.isVerified,
          });
        
        if (streamerError) {
          console.error('[AdminDashboard] Error creating streamer profile:', streamerError);
        } else {
          console.log('[AdminDashboard] Created streamer profile for user:', selectedUser.id);
        }
      } else if (!userForm.isStreamer && existingStreamer) {
        // Remove streamer profile
        const { error: deleteError } = await supabase
          .from('streamers')
          .delete()
          .eq('user_id', selectedUser.id);
        
        if (deleteError) {
          console.error('[AdminDashboard] Error removing streamer profile:', deleteError);
        } else {
          console.log('[AdminDashboard] Removed streamer profile for user:', selectedUser.id);
        }
      }

      Alert.alert('Success', `User ${userForm.username} updated successfully!`);
      setShowEditUser(false);
      setSelectedUser(null);
      setUserForm({
        email: "",
        username: "",
        password: "",
        avatar: "",
        bio: "",
        tier: "free",
        role: "user",
        referralCode: "",
        isVerified: false,
        isInfluencer: false,
        isStreamer: false,
      });

      // Refresh users list and streamers list
      fetchUsers();
      fetchStreamers();
    } catch (err) {
      console.error('[AdminDashboard] Exception updating user:', err);
      Alert.alert('Error', String(err));
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Delete user from Supabase
  const handleDeleteUserFromDb = async (userId: string, username: string) => {
    // Prevent deleting self
    if (userId === user?.id) {
      Alert.alert('Error', 'Cannot delete your own account');
      return;
    }

    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete user "${username}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoadingUsers(true);
              console.log('[AdminDashboard] Deleting user:', userId);

              const { error: deleteError } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

              if (deleteError) {
                console.error('[AdminDashboard] Error deleting user:', deleteError);
                Alert.alert('Error', deleteError.message);
                return;
              }

              Alert.alert('Success', `User ${username} deleted successfully`);
              fetchUsers();
            } catch (err) {
              console.error('[AdminDashboard] Exception deleting user:', err);
              Alert.alert('Error', String(err));
            } finally {
              setIsLoadingUsers(false);
            }
          },
        },
      ]
    );
  };

  // Suspend/Unsuspend user in Supabase
  const handleToggleSuspendUser = async (targetUser: User) => {
    const newStatus = targetUser.accountStatus === 'suspended' ? 'active' : 'suspended';
    const action = newStatus === 'suspended' ? 'suspend' : 'unsuspend';

    try {
      setIsLoadingUsers(true);

      const { error: updateError } = await supabase
        .from('users')
        .update({
          account_status: newStatus,
          suspended_at: newStatus === 'suspended' ? new Date().toISOString() : null,
          suspended_by: newStatus === 'suspended' ? user?.id : null,
        })
        .eq('id', targetUser.id);

      if (updateError) {
        console.error('[AdminDashboard] Error updating user status:', updateError);
        Alert.alert('Error', updateError.message);
        return;
      }

      Alert.alert('Success', `User ${targetUser.username} has been ${action}ed`);
      fetchUsers();
    } catch (err) {
      console.error('[AdminDashboard] Exception updating user status:', err);
      Alert.alert('Error', String(err));
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Verify user directly in Supabase
  const handleVerifyUserInDb = async (targetUser: User) => {
    try {
      setIsLoadingUsers(true);

      const { error: updateError } = await supabase
        .from('users')
        .update({
          is_verified: true,
          verification_status: 'verified',
        })
        .eq('id', targetUser.id);

      if (updateError) {
        console.error('[AdminDashboard] Error verifying user:', updateError);
        Alert.alert('Error', updateError.message);
        return;
      }

      Alert.alert('Success', `${targetUser.username} has been verified!`);
      fetchUsers();
    } catch (err) {
      console.error('[AdminDashboard] Exception verifying user:', err);
      Alert.alert('Error', String(err));
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Open edit user modal
  const openEditUserModal = async (targetUser: User) => {
    setSelectedUser(targetUser);
    
    // Check if user has a linked streamer profile
    const { data: streamerData } = await supabase
      .from('streamers')
      .select('id')
      .eq('user_id', targetUser.id)
      .single();
    
    const hasStreamerProfile = !!streamerData;
    
    setUserForm({
      email: targetUser.email,
      username: targetUser.username,
      password: "",
      avatar: targetUser.avatar || "",
      bio: targetUser.bio || "",
      tier: targetUser.tier || "free",
      role: targetUser.role || "user",
      referralCode: targetUser.referralCode || "",
      isVerified: targetUser.isVerified || false,
      isInfluencer: targetUser.isInfluencer || false,
      isStreamer: hasStreamerProfile,
    });
    setShowEditUser(true);
  };

  // Reset admin track form
  const resetAdminTrackForm = () => {
    setAdminTrackForm({
      title: "",
      coverArt: "",
      audioUrl: "",
      duration: "",
      price: "",
      isSnippetOnly: false,
      snippetDuration: "30",
    });
  };

  // Admin track cover art picker
  const handlePickAdminCoverArt = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library to upload cover art.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAdminTrackForm({ ...adminTrackForm, coverArt: result.assets[0].uri });
    }
  };

  // Admin audio file picker
  const handlePickAdminAudioFile = async () => {
    try {
      console.log("[AdminDashboard] Opening audio file picker...");
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      console.log("[AdminDashboard] Audio picker result:", JSON.stringify(result, null, 2));

      if (!result.canceled && result.assets[0]) {
        setAdminTrackForm({ ...adminTrackForm, audioUrl: result.assets[0].uri });
        if (!adminTrackForm.title && result.assets[0].name) {
          const nameWithoutExt = result.assets[0].name.replace(/\.[^/.]+$/, "");
          setAdminTrackForm((prev) => ({ ...prev, audioUrl: result.assets[0].uri, title: nameWithoutExt }));
        }
      }
    } catch (error) {
      console.log("[AdminDashboard] Audio picker error:", error);
      Alert.alert("Error", "Failed to pick audio file. Please try again.");
    }
  };

  // Add admin track
  const handleAddAdminTrack = () => {
    // Ensure artist exists first
    ensureAdminArtist();

    if (!adminTrackForm.title || !adminTrackForm.audioUrl) {
      Alert.alert("Error", "Please provide at least a title and audio file/URL");
      return;
    }

    const newTrack: Track = {
      id: "admin-track-" + Date.now(),
      artistId: ADMIN_ARTIST_ID,
      title: adminTrackForm.title,
      coverArt: adminTrackForm.coverArt || user?.avatar || "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&h=400&fit=crop",
      audioUrl: adminTrackForm.audioUrl,
      duration: parseInt(adminTrackForm.duration) || 180,
      price: adminTrackForm.price ? parseFloat(adminTrackForm.price) : undefined,
      isSnippetOnly: adminTrackForm.isSnippetOnly,
      snippetDuration: parseInt(adminTrackForm.snippetDuration) || 30,
      playCount: 0,
      hotVotes: 0,
      notVotes: 0,
      purchaseCount: 0,
      createdAt: new Date().toISOString(),
    };

    console.log("[AdminDashboard] Adding track:", newTrack.title);
    addTrack(ADMIN_ARTIST_ID, newTrack);
    resetAdminTrackForm();
    setShowAddAdminTrack(false);
    Alert.alert("Success", "Track uploaded successfully!");
  };

  // Edit admin track
  const openEditAdminTrack = (track: Track) => {
    setSelectedTrack(track);
    setAdminTrackForm({
      title: track.title,
      coverArt: track.coverArt,
      audioUrl: track.audioUrl,
      duration: track.duration.toString(),
      price: track.price?.toString() || "",
      isSnippetOnly: track.isSnippetOnly,
      snippetDuration: track.snippetDuration?.toString() || "30",
    });
    setShowEditAdminTrack(true);
  };

  const handleEditAdminTrack = () => {
    if (!selectedTrack || !adminTrackForm.title) {
      Alert.alert("Error", "Please provide at least a title");
      return;
    }

    updateTrack(ADMIN_ARTIST_ID, selectedTrack.id, {
      title: adminTrackForm.title,
      coverArt: adminTrackForm.coverArt || selectedTrack.coverArt,
      audioUrl: adminTrackForm.audioUrl || selectedTrack.audioUrl,
      duration: parseInt(adminTrackForm.duration) || selectedTrack.duration,
      price: adminTrackForm.price ? parseFloat(adminTrackForm.price) : undefined,
      isSnippetOnly: adminTrackForm.isSnippetOnly,
      snippetDuration: parseInt(adminTrackForm.snippetDuration) || 30,
    });

    resetAdminTrackForm();
    setSelectedTrack(null);
    setShowEditAdminTrack(false);
  };

  // Delete admin track
  const handleDeleteAdminTrack = (trackId: string) => {
    Alert.alert(
      "Delete Track",
      "Are you sure you want to delete this track?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteTrack(ADMIN_ARTIST_ID, trackId);
          },
        },
      ]
    );
  };

  // Open edit admin artist profile
  const openEditAdminArtist = () => {
    const artist = ensureAdminArtist();
    setAdminArtistForm({
      stageName: artist.stageName || user?.username || "",
      bio: artist.bio || "",
      genre: artist.genre || "",
      spotifyUrl: artist.socialLinks?.spotify || "",
      appleMusicUrl: artist.socialLinks?.appleMusic || "",
      soundCloudUrl: artist.socialLinks?.soundcloud || "",
      instagramUrl: artist.socialLinks?.instagram || "",
    });
    setShowEditAdminArtist(true);
  };

  // Database cleanup handler
  const handleCleanupDatabase = async () => {
    Alert.alert(
      "Clean Up Database",
      "This will remove all fake/test users, streamers, and artists from Supabase database. Only real authenticated accounts with valid UUIDs will remain. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clean Up",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await cleanupAllFakeData();
              if (result.success) {
                Alert.alert(
                  "Cleanup Complete",
                  result.message,
                  [{ text: "OK" }]
                );
              } else {
                Alert.alert(
                  "Cleanup Failed",
                  result.message,
                  [{ text: "OK" }]
                );
              }
            } catch (error) {
              Alert.alert(
                "Error",
                `Failed to clean up database: ${String(error)}`,
                [{ text: "OK" }]
              );
            }
          },
        },
      ]
    );
  };

  // Save admin artist profile
  const handleSaveAdminArtist = () => {
    if (!adminArtistForm.stageName.trim()) {
      Alert.alert("Error", "Please enter a stage name");
      return;
    }

    updateArtist(ADMIN_ARTIST_ID, {
      stageName: adminArtistForm.stageName.trim(),
      bio: adminArtistForm.bio.trim(),
      genre: adminArtistForm.genre.trim(),
      socialLinks: {
        ...(adminArtist?.socialLinks || {}),
        spotify: adminArtistForm.spotifyUrl.trim() || undefined,
        appleMusic: adminArtistForm.appleMusicUrl.trim() || undefined,
        soundcloud: adminArtistForm.soundCloudUrl.trim() || undefined,
        instagram: adminArtistForm.instagramUrl.trim() || undefined,
      },
    });

    setShowEditAdminArtist(false);
  };

  const handleCreateStreamer = async () => {
    // If linking to existing user
    if (useExistingUser) {
      if (!selectedExistingUser) {
        Alert.alert('Error', 'Please select an existing user');
        return;
      }

      // Check if user already has a streamer profile
      const { data: existingStreamer } = await supabase
        .from('streamers')
        .select('id')
        .eq('user_id', selectedExistingUser.id)
        .single();

      if (existingStreamer) {
        Alert.alert('Error', 'This user already has a streamer profile');
        return;
      }

      try {
        setIsLoadingStreamers(true);
        console.log('[AdminDashboard] Creating streamer from existing user:', selectedExistingUser.username);

        const referralCode = streamerForm.referralCode || "STREAM" + Math.random().toString(36).substring(2, 8).toUpperCase();

        // Create streamer profile linked to existing user
        const { data: newStreamer, error: streamerError } = await supabase
          .from('streamers')
          .insert({
            user_id: selectedExistingUser.id,
            name: streamerForm.name || selectedExistingUser.username,
            gamertag: streamerForm.gamertag || selectedExistingUser.username,
            email: selectedExistingUser.email,
            avatar: streamerForm.avatar || selectedExistingUser.avatar,
            bio: streamerForm.bio || selectedExistingUser.bio || 'New streamer on DDNS!',
            is_live: false,
            follower_count: 0,
            referral_code: referralCode,
            is_verified: selectedExistingUser.isVerified || false,
          })
          .select()
          .single();

        if (streamerError) {
          console.error('[AdminDashboard] Error creating streamer from user:', streamerError);
          Alert.alert('Error', streamerError.message);
          return;
        }

        // Insert social links if provided
        if (newStreamer && (streamerForm.twitchUrl || streamerForm.youtubeUrl || streamerForm.tiktokUrl || streamerForm.instagramUrl)) {
          const { error: linksError } = await supabase
            .from('streamer_social_links')
            .insert({
              streamer_id: newStreamer.id,
              twitch: streamerForm.twitchUrl || null,
              youtube: streamerForm.youtubeUrl || null,
              tiktok: streamerForm.tiktokUrl || null,
              instagram: streamerForm.instagramUrl || null,
            });

          if (linksError) {
            console.error('[AdminDashboard] Error creating social links:', linksError);
          }
        }

        Alert.alert('Success', `Streamer profile created for ${selectedExistingUser.username}!`);
        setShowCreateStreamer(false);
        setUseExistingUser(false);
        setSelectedExistingUser(null);
        setUserSearchQuery("");
        setStreamerForm({
          name: "",
          gamertag: "",
          email: "",
          password: "",
          avatar: "",
          bio: "",
          referralCode: "",
          twitchUrl: "",
          youtubeUrl: "",
          tiktokUrl: "",
          instagramUrl: "",
        });

        // Refresh streamers list
        fetchStreamers();
      } catch (err) {
        console.error('[AdminDashboard] Exception creating streamer from user:', err);
        Alert.alert('Error', String(err));
      } finally {
        setIsLoadingStreamers(false);
      }
      return;
    }

    // Original flow: Create new standalone streamer
    if (!streamerForm.name || !streamerForm.gamertag) {
      Alert.alert('Error', 'Please provide name and gamertag');
      return;
    }

    try {
      setIsLoadingStreamers(true);
      console.log('[AdminDashboard] Creating streamer:', streamerForm.name);

      const referralCode = streamerForm.referralCode || "STREAM" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const avatar = streamerForm.avatar || "https://i.pravatar.cc/300?img=" + Math.floor(Math.random() * 70);

      // Insert streamer into database
      const { data: newStreamer, error: streamerError } = await supabase
        .from('streamers')
        .insert({
          name: streamerForm.name,
          gamertag: streamerForm.gamertag,
          email: streamerForm.email || null,
          avatar: avatar,
          bio: streamerForm.bio || 'New streamer on DDNS!',
          is_live: false,
          follower_count: 0,
          referral_code: referralCode,
          is_verified: false,
        })
        .select()
        .single();

      if (streamerError) {
        console.error('[AdminDashboard] Error creating streamer:', streamerError);
        Alert.alert('Error', streamerError.message);
        return;
      }

      // Insert social links if provided
      if (newStreamer && (streamerForm.twitchUrl || streamerForm.youtubeUrl || streamerForm.tiktokUrl || streamerForm.instagramUrl)) {
        const { error: linksError } = await supabase
          .from('streamer_social_links')
          .insert({
            streamer_id: newStreamer.id,
            twitch: streamerForm.twitchUrl || null,
            youtube: streamerForm.youtubeUrl || null,
            tiktok: streamerForm.tiktokUrl || null,
            instagram: streamerForm.instagramUrl || null,
          });

        if (linksError) {
          console.error('[AdminDashboard] Error creating social links:', linksError);
        }
      }

      Alert.alert('Success', `Streamer ${streamerForm.name} created successfully!`);
      setShowCreateStreamer(false);
      setStreamerForm({
        name: "",
        gamertag: "",
        email: "",
        password: "",
        avatar: "",
        bio: "",
        referralCode: "",
        twitchUrl: "",
        youtubeUrl: "",
        tiktokUrl: "",
        instagramUrl: "",
      });

      // Refresh streamers list
      fetchStreamers();
    } catch (err) {
      console.error('[AdminDashboard] Exception creating streamer:', err);
      Alert.alert('Error', String(err));
    } finally {
      setIsLoadingStreamers(false);
    }
  };

  const handleEditStreamer = async () => {
    if (!selectedStreamer) return;

    try {
      setIsLoadingStreamers(true);
      console.log('[AdminDashboard] Updating streamer:', selectedStreamer.id);

      // Update streamer in database
      const { error: updateError } = await supabase
        .from('streamers')
        .update({
          name: streamerForm.name,
          gamertag: streamerForm.gamertag,
          avatar: streamerForm.avatar || selectedStreamer.avatar,
          bio: streamerForm.bio,
          referral_code: streamerForm.referralCode,
        })
        .eq('id', selectedStreamer.id);

      if (updateError) {
        console.error('[AdminDashboard] Error updating streamer:', updateError);
        Alert.alert('Error', updateError.message);
        return;
      }

      // Update social links
      const { error: linksError } = await supabase
        .from('streamer_social_links')
        .upsert({
          streamer_id: selectedStreamer.id,
          twitch: streamerForm.twitchUrl || null,
          youtube: streamerForm.youtubeUrl || null,
          tiktok: streamerForm.tiktokUrl || null,
          instagram: streamerForm.instagramUrl || null,
        });

      if (linksError) {
        console.error('[AdminDashboard] Error updating social links:', linksError);
      }

      Alert.alert('Success', `Streamer ${streamerForm.name} updated successfully!`);
      setShowEditStreamer(false);
      setSelectedStreamer(null);
      setStreamerForm({
        name: "",
        gamertag: "",
        email: "",
        password: "",
        avatar: "",
        bio: "",
        referralCode: "",
        twitchUrl: "",
        youtubeUrl: "",
        tiktokUrl: "",
        instagramUrl: "",
      });

      // Refresh streamers list
      fetchStreamers();
    } catch (err) {
      console.error('[AdminDashboard] Exception updating streamer:', err);
      Alert.alert('Error', String(err));
    } finally {
      setIsLoadingStreamers(false);
    }
  };

  const handleDeleteStreamer = async (id: string, name: string) => {
    Alert.alert(
      'Delete Streamer',
      `Are you sure you want to delete ${name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoadingStreamers(true);
              console.log('[AdminDashboard] Deleting streamer:', id);

              const { error: deleteError } = await supabase
                .from('streamers')
                .delete()
                .eq('id', id);

              if (deleteError) {
                console.error('[AdminDashboard] Error deleting streamer:', deleteError);
                Alert.alert('Error', deleteError.message);
                return;
              }

              Alert.alert('Success', `Streamer ${name} deleted successfully`);
              fetchStreamers();
            } catch (err) {
              console.error('[AdminDashboard] Exception deleting streamer:', err);
              Alert.alert('Error', String(err));
            } finally {
              setIsLoadingStreamers(false);
            }
          },
        },
      ]
    );
  };

  // Toggle streamer live status
  const handleToggleLive = async (streamer: Streamer) => {
    try {
      const newLiveStatus = !streamer.isLive;
      console.log('[AdminDashboard] Toggling live status for', streamer.name, 'to', newLiveStatus);

      const { error: updateError } = await supabase
        .from('streamers')
        .update({
          is_live: newLiveStatus,
          last_live_date: newLiveStatus ? new Date().toISOString() : streamer.lastLiveDate,
        })
        .eq('id', streamer.id);

      if (updateError) {
        console.error('[AdminDashboard] Error toggling live status:', updateError);
        Alert.alert('Error', updateError.message);
        return;
      }

      Alert.alert(
        'Success',
        newLiveStatus ? `${streamer.name} is now LIVE!` : `${streamer.name} stream ended`
      );

      // Refresh streamers list to show updated status
      fetchStreamers();
    } catch (err) {
      console.error('[AdminDashboard] Exception toggling live:', err);
      Alert.alert('Error', String(err));
    }
  };

  const openSetStreamerPassword = (streamer: Streamer) => {
    setSelectedStreamer(streamer);
    setStreamerEmail(streamer.email || "");
    setStreamerPassword("");
    setShowSetStreamerPassword(true);
  };

  const handleSetStreamerPassword = () => {
    if (!selectedStreamer || !streamerEmail || !streamerPassword) {
      Alert.alert("Error", "Please provide both email and password");
      return;
    }

    // Update streamer with email
    updateStreamer(selectedStreamer.id, { email: streamerEmail });

    // Check if streamer account exists
    const existingAccount = getStreamerAccount(selectedStreamer.id);

    if (existingAccount) {
      // Update existing account
      updateStreamerAccount(selectedStreamer.id, {
        streamer: { ...selectedStreamer, email: streamerEmail },
        password: streamerPassword,
      });
    } else {
      // Create new streamer account
      addStreamerAccount({
        streamer: { ...selectedStreamer, email: streamerEmail },
        password: streamerPassword,
      });
    }

    Alert.alert("Success", "Login credentials have been set!");
    setShowSetStreamerPassword(false);
    setSelectedStreamer(null);
    setStreamerEmail("");
    setStreamerPassword("");
  };

  const openEditStreamer = (streamer: Streamer) => {
    setSelectedStreamer(streamer);
    setStreamerForm({
      name: streamer.name,
      gamertag: streamer.gamertag,
      email: streamer.email || "",
      password: "",
      avatar: streamer.avatar,
      bio: streamer.bio,
      referralCode: streamer.referralCode,
      twitchUrl: streamer.streamPlatforms?.twitch || "",
      youtubeUrl: streamer.streamPlatforms?.youtube || "",
      tiktokUrl: streamer.streamPlatforms?.tiktok || "",
      instagramUrl: streamer.streamPlatforms?.instagram || "",
    });
    setShowEditStreamer(true);
  };

  // Artist handlers
  const handleCreateArtist = () => {
    if (!artistForm.name || !artistForm.stageName) {
      return;
    }

    const newArtist: Artist = {
      id: "artist-" + Date.now(),
      name: artistForm.name,
      stageName: artistForm.stageName,
      email: artistForm.email || undefined,
      avatar: artistForm.avatar || "https://i.pravatar.cc/300?img=" + Math.floor(Math.random() * 70),
      headerImages: [
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop",
      ],
      bio: artistForm.bio || "New artist on DDNS!",
      genre: artistForm.genre || undefined,
      socialLinks: {
        spotify: artistForm.spotifyUrl || undefined,
        appleMusic: artistForm.appleMusicUrl || undefined,
        soundcloud: artistForm.soundcloudUrl || undefined,
        instagram: artistForm.instagramUrl || undefined,
      },
      followerCount: 0,
      referralCode: artistForm.referralCode || "ARTIST" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      tracks: [],
      albums: [],
      totalPlays: 0,
      totalSales: 0,
    };

    addArtist(newArtist);

    // Create artist account if email and password provided
    if (artistForm.email && artistForm.password) {
      addArtistAccount({
        artist: newArtist,
        password: artistForm.password,
      });
    }

    setShowCreateArtist(false);
    setArtistForm({
      name: "",
      stageName: "",
      email: "",
      password: "",
      avatar: "",
      bio: "",
      genre: "",
      referralCode: "",
      spotifyUrl: "",
      appleMusicUrl: "",
      soundcloudUrl: "",
      instagramUrl: "",
    });
  };

  const handleEditArtist = () => {
    if (!selectedArtist) return;

    updateArtist(selectedArtist.id, {
      name: artistForm.name,
      stageName: artistForm.stageName,
      avatar: artistForm.avatar || selectedArtist.avatar,
      bio: artistForm.bio,
      genre: artistForm.genre,
      referralCode: artistForm.referralCode,
      socialLinks: {
        ...selectedArtist.socialLinks,
        spotify: artistForm.spotifyUrl || undefined,
        appleMusic: artistForm.appleMusicUrl || undefined,
        soundcloud: artistForm.soundcloudUrl || undefined,
        instagram: artistForm.instagramUrl || undefined,
      },
    });

    setShowEditArtist(false);
    setSelectedArtist(null);
    setArtistForm({
      name: "",
      stageName: "",
      email: "",
      password: "",
      avatar: "",
      bio: "",
      genre: "",
      referralCode: "",
      spotifyUrl: "",
      appleMusicUrl: "",
      soundcloudUrl: "",
      instagramUrl: "",
    });
  };

  const handleDeleteArtist = (id: string) => {
    deleteArtist(id);
  };

  const openEditArtist = (artist: Artist) => {
    setSelectedArtist(artist);
    setArtistForm({
      name: artist.name,
      stageName: artist.stageName,
      email: artist.email || "",
      password: "",
      avatar: artist.avatar,
      bio: artist.bio,
      genre: artist.genre || "",
      referralCode: artist.referralCode,
      spotifyUrl: artist.socialLinks?.spotify || "",
      appleMusicUrl: artist.socialLinks?.appleMusic || "",
      soundcloudUrl: artist.socialLinks?.soundcloud || "",
      instagramUrl: artist.socialLinks?.instagram || "",
    });
    setShowEditArtist(true);
  };

  const openSetArtistPassword = (artist: Artist) => {
    setSelectedArtist(artist);
    setArtistEmail(artist.email || "");
    setArtistPassword("");
    setShowSetArtistPassword(true);
  };

  const handleSetArtistPassword = () => {
    if (!selectedArtist || !artistEmail || !artistPassword) {
      Alert.alert("Error", "Please provide both email and password");
      return;
    }

    // Update artist with email
    updateArtist(selectedArtist.id, { email: artistEmail });

    // Check if artist account exists
    const existingAccount = getArtistAccount(selectedArtist.id);

    if (existingAccount) {
      // Update existing account
      updateArtistAccount(selectedArtist.id, {
        artist: { ...selectedArtist, email: artistEmail },
        password: artistPassword,
      });
    } else {
      // Create new artist account
      addArtistAccount({
        artist: { ...selectedArtist, email: artistEmail },
        password: artistPassword,
      });
    }

    Alert.alert("Success", "Login credentials have been set!");
    setShowSetArtistPassword(false);
    setSelectedArtist(null);
    setArtistEmail("");
    setArtistPassword("");
  };

  // Track management functions
  const openManageMusic = (artist: Artist) => {
    setSelectedArtist(artist);
    setShowManageMusic(true);
  };

  const resetTrackForm = () => {
    setTrackForm({
      title: "",
      coverArt: "",
      audioUrl: "",
      duration: "",
      price: "",
      isSnippetOnly: false,
      snippetDuration: "30",
    });
  };

  // Cover art upload handler
  const handlePickCoverArt = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library to upload cover art.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setTrackForm({ ...trackForm, coverArt: result.assets[0].uri });
    }
  };

  // Audio file upload handler
  const handlePickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setTrackForm({ ...trackForm, audioUrl: result.assets[0].uri });
        // Try to extract filename as a suggested title if title is empty
        if (!trackForm.title && result.assets[0].name) {
          const nameWithoutExt = result.assets[0].name.replace(/\.[^/.]+$/, "");
          setTrackForm((prev) => ({ ...prev, audioUrl: result.assets[0].uri, title: nameWithoutExt }));
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick audio file. Please try again.");
    }
  };

  const handleAddTrack = () => {
    if (!selectedArtist || !trackForm.title || !trackForm.audioUrl) {
      Alert.alert("Error", "Please provide at least a title and audio URL");
      return;
    }

    const newTrack: Track = {
      id: "track-" + Date.now(),
      artistId: selectedArtist.id,
      title: trackForm.title,
      coverArt: trackForm.coverArt || selectedArtist.avatar,
      audioUrl: trackForm.audioUrl,
      duration: parseInt(trackForm.duration) || 180,
      price: trackForm.price ? parseFloat(trackForm.price) : undefined,
      isSnippetOnly: trackForm.isSnippetOnly,
      snippetDuration: parseInt(trackForm.snippetDuration) || 30,
      playCount: 0,
      hotVotes: 0,
      notVotes: 0,
      purchaseCount: 0,
      createdAt: new Date().toISOString(),
    };

    addTrack(selectedArtist.id, newTrack);
    resetTrackForm();
    setShowAddTrack(false);
    Alert.alert("Success", "Track added successfully!");
  };

  const openEditTrack = (track: Track) => {
    setSelectedTrack(track);
    setTrackForm({
      title: track.title,
      coverArt: track.coverArt,
      audioUrl: track.audioUrl,
      duration: track.duration.toString(),
      price: track.price?.toString() || "",
      isSnippetOnly: track.isSnippetOnly,
      snippetDuration: track.snippetDuration?.toString() || "30",
    });
    setShowEditTrack(true);
  };

  const handleEditTrack = () => {
    if (!selectedArtist || !selectedTrack || !trackForm.title) {
      Alert.alert("Error", "Please provide at least a title");
      return;
    }

    updateTrack(selectedArtist.id, selectedTrack.id, {
      title: trackForm.title,
      coverArt: trackForm.coverArt || selectedTrack.coverArt,
      audioUrl: trackForm.audioUrl || selectedTrack.audioUrl,
      duration: parseInt(trackForm.duration) || selectedTrack.duration,
      price: trackForm.price ? parseFloat(trackForm.price) : undefined,
      isSnippetOnly: trackForm.isSnippetOnly,
      snippetDuration: parseInt(trackForm.snippetDuration) || 30,
    });

    resetTrackForm();
    setSelectedTrack(null);
    setShowEditTrack(false);
    Alert.alert("Success", "Track updated successfully!");
  };

  const handleDeleteTrack = (trackId: string) => {
    if (!selectedArtist) return;

    Alert.alert(
      "Delete Track",
      "Are you sure you want to delete this track?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteTrack(selectedArtist.id, trackId);
          },
        },
      ]
    );
  };

  const handleCreateAnnouncement = () => {
    if (!announcementForm.message || !user) return;

    const durationHours = parseInt(announcementForm.duration);
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();

    const newAnnouncement: Announcement = {
      id: "announce-" + Date.now(),
      message: announcementForm.message,
      createdBy: user.id,
      createdByName: user.username,
      duration: durationHours,
      expiresAt,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    addAnnouncement(newAnnouncement);
    setShowCreateAnnouncement(false);
    setAnnouncementForm({ message: "", duration: "24" });
  };

  const handleDeleteAnnouncement = (id: string) => {
    deleteAnnouncement(id);
  };

  // Get pending verification requests
  const pendingRequests = verificationRequests.filter((r) => r.status === "pending");

  // Handlers for verification
  const handleApproveVerification = (requestId: string) => {
    if (!user) return;
    approveVerification(requestId, user.id);
    Alert.alert("Success", "User has been verified!");
  };

  const handleOpenRejectModal = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleRejectVerification = () => {
    if (!user || !selectedRequest || !rejectionReason.trim()) {
      Alert.alert("Error", "Please provide a reason for rejection");
      return;
    }
    rejectVerification(selectedRequest.id, user.id, rejectionReason.trim());
    setShowRejectModal(false);
    setSelectedRequest(null);
    setRejectionReason("");
    Alert.alert("Done", "Verification request rejected");
  };

  // Direct verify a user from users tab
  const handleDirectVerify = (targetUser: User) => {
    if (!user) return;
    updateUserAccount(targetUser.id, {
      user: { ...targetUser, isVerified: true, verificationStatus: "verified" }
    });
    Alert.alert("Success", `${targetUser.username} has been verified!`);
  };

return (
  <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={["top"]}>
    {/* Sticky Header with Title and Tabs */}
    <View className="bg-[#0A0A0F]">
      {/* Compact Header */}
      <View className="px-4 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Text className="text-white text-lg font-bold">Admin</Text>
          <View className="bg-purple-600 px-2 py-0.5 rounded-full ml-2">
            <Text className="text-white text-[10px] font-bold">SUPER</Text>
          </View>
        </View>
        {/* Quick Stats */}
        <View className="flex-row items-center">
          {reports.filter((r) => r.status === "pending").length > 0 && (
            <View className="flex-row items-center mr-3">
              <Ionicons name="flag" size={14} color="#EF4444" />
              <Text className="text-red-400 text-xs ml-1">{reports.filter((r) => r.status === "pending").length}</Text>
            </View>
          )}
          {pendingRequests.length > 0 && (
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={14} color="#A855F7" />
              <Text className="text-purple-400 text-xs ml-1">{pendingRequests.length}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Sticky Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="border-b border-gray-800 bg-[#0A0A0F]"
        contentContainerStyle={{ paddingHorizontal: 4 }}
      >
        <Pressable
          onPress={() => setActiveTab("streamers")}
          className={`px-4 py-2.5 ${activeTab === "streamers" ? "border-b-2 border-purple-500" : ""}`}
        >
          <Text className={`text-center text-xs font-semibold ${activeTab === "streamers" ? "text-purple-500" : "text-gray-400"}`}>
            Streamers
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("artists")}
          className={`px-4 py-2.5 ${activeTab === "artists" ? "border-b-2 border-pink-500" : ""}`}
        >
          <Text className={`text-center text-xs font-semibold ${activeTab === "artists" ? "text-pink-500" : "text-gray-400"}`}>
            Artists
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("users")}
          className={`px-4 py-2.5 ${activeTab === "users" ? "border-b-2 border-purple-500" : ""}`}
        >
          <Text className={`text-center text-xs font-semibold ${activeTab === "users" ? "text-purple-500" : "text-gray-400"}`}>
            Users
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("reports")}
          className={`px-4 py-2.5 ${activeTab === "reports" ? "border-b-2 border-red-500" : ""}`}
        >
          <View className="flex-row items-center justify-center">
            <Text className={`text-center text-xs font-semibold ${activeTab === "reports" ? "text-red-500" : "text-gray-400"}`}>
              Reports
            </Text>
            {reports.filter((r) => r.status === "pending").length > 0 && (
              <View className="ml-1 bg-red-500 rounded-full w-2 h-2" />
            )}
          </View>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("verify")}
          className={`px-4 py-2.5 ${activeTab === "verify" ? "border-b-2 border-purple-500" : ""}`}
        >
          <View className="flex-row items-center justify-center">
            <Text className={`text-center text-xs font-semibold ${activeTab === "verify" ? "text-purple-500" : "text-gray-400"}`}>
              Verify
            </Text>
            {pendingRequests.length > 0 && (
              <View className="ml-1 bg-purple-500 rounded-full w-2 h-2" />
            )}
          </View>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("announcements")}
          className={`px-4 py-2.5 ${activeTab === "announcements" ? "border-b-2 border-purple-500" : ""}`}
        >
          <Text className={`text-center text-xs font-semibold ${activeTab === "announcements" ? "text-purple-500" : "text-gray-400"}`}>
            Announce
          </Text>
        </Pressable>
      </ScrollView>
    </View>

    {/* Scrollable Content */}
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Quick Access Cards - Now Inside ScrollView */}
      <View className="px-4 py-3">
        <Text className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-2">Quick Access</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {isSuperAdmin(user) && (
            <Pressable
              onPress={() => navigation.navigate("AdminManagement")}
              className="bg-red-600/20 border border-red-500/30 rounded-lg p-3 mr-2"
              style={{ width: 100 }}
            >
              <Ionicons name="shield-checkmark" size={20} color="#EF4444" />
              <Text className="text-white font-bold text-xs mt-1.5">Admins</Text>
            </Pressable>
          )}
          {isSuperAdmin(user) && (
            <Pressable
              onPress={handleCleanupDatabase}
              className="bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-3 mr-2"
              style={{ width: 100 }}
            >
              <Ionicons name="trash" size={20} color="#EAB308" />
              <Text className="text-white font-bold text-xs mt-1.5">Clean DB</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => navigation.navigate("AdminMerchStore")}
            className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-3 mr-2"
            style={{ width: 100 }}
          >
            <Ionicons name="shirt" size={20} color="#A855F7" />
            <Text className="text-white font-bold text-xs mt-1.5">Merch</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("AdminMerchants")}
            className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-3 mr-2"
            style={{ width: 100 }}
          >
            <Ionicons name="storefront" size={20} color="#3B82F6" />
            <Text className="text-white font-bold text-xs mt-1.5">Merchants</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("AdminItems")}
            className="bg-green-600/20 border border-green-500/30 rounded-lg p-3 mr-2"
            style={{ width: 100 }}
          >
            <Ionicons name="cube" size={20} color="#22C55E" />
            <Text className="text-white font-bold text-xs mt-1.5">Items</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("AdminOrders")}
            className="bg-orange-600/20 border border-orange-500/30 rounded-lg p-3 mr-2"
            style={{ width: 100 }}
          >
            <Ionicons name="receipt" size={20} color="#F97316" />
            <Text className="text-white font-bold text-xs mt-1.5">Orders</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("AdminAnalytics")}
            className="bg-cyan-600/20 border border-cyan-500/30 rounded-lg p-3 mr-2"
            style={{ width: 100 }}
          >
            <Ionicons name="stats-chart" size={20} color="#06B6D4" />
            <Text className="text-white font-bold text-xs mt-1.5">Analytics</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("AdminNews")}
            className="bg-pink-600/20 border border-pink-500/30 rounded-lg p-3 mr-2"
            style={{ width: 100 }}
          >
            <Ionicons name="newspaper" size={20} color="#EC4899" />
            <Text className="text-white font-bold text-xs mt-1.5">News</Text>
          </Pressable>
        </ScrollView>
      </View>

      {activeTab === "streamers" && (
        <View className="px-4 pb-4">
          {/* Create Streamer Button with gradient and shadow */}
          <Pressable
            onPress={() => setShowCreateStreamer(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 py-3.5 rounded-2xl mb-4 flex-row items-center justify-center border border-purple-400/30"
            style={{
              shadowColor: "#8B5CF6",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <View className="bg-white/20 rounded-full p-1 mr-2">
              <Ionicons name="add-circle" size={22} color="white" />
            </View>
            <Text className="text-white font-extrabold text-base tracking-wide">Create Streamer</Text>
          </Pressable>

          {/* Streamers List */}
          {isLoadingStreamers ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text className="text-gray-400 mt-4">Loading streamers...</Text>
            </View>
          ) : streamersError ? (
            <View className="items-center py-12">
              <Ionicons name="alert-circle" size={64} color="#EF4444" />
              <Text className="text-red-400 mt-4">{streamersError}</Text>
              <Pressable onPress={fetchStreamers} className="mt-4 bg-purple-600 px-6 py-3 rounded-xl">
                <Text className="text-white font-semibold">Retry</Text>
              </Pressable>
            </View>
          ) : dbStreamers.length === 0 ? (
            <View className="items-center py-12">
              <Ionicons name="people-outline" size={64} color="#4B5563" />
              <Text className="text-gray-400 mt-4">No streamers yet</Text>
              <Text className="text-gray-500 text-sm mt-2">Create your first streamer!</Text>
            </View>
          ) : (
            dbStreamers.map((streamer: Streamer) => (
              <View
                key={streamer.id}
                className="bg-gradient-to-br from-[#1a1a2e] to-[#16162a] p-4 rounded-2xl mb-4 border border-purple-500/20 shadow-2xl"
                style={{
                  shadowColor: streamer.isLive ? "#EC4899" : "#8B5CF6",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                {/* Header with Avatar and Info */}
                <View className="flex-row items-start justify-between mb-4">
                  <View className="flex-row items-center flex-1">
                    {/* Avatar with gradient border */}
                    <View
                      className="rounded-full p-0.5"
                      style={{
                        backgroundColor: streamer.isLive ? '#EC4899' : '#8B5CF6',
                      }}
                    >
                      {streamer.avatar ? (
                        <Image
                          source={{ uri: streamer.avatar }}
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 28,
                            borderWidth: 3,
                            borderColor: '#0A0A0F',
                          }}
                          contentFit="cover"
                        />
                      ) : (
                        <View className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 items-center justify-center">
                          <Text className="text-white font-bold text-xl">{streamer.name[0]}</Text>
                        </View>
                      )}
                    </View>

                    {/* Name and Gamertag */}
                    <View className="ml-4 flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-white font-bold text-lg">{streamer.name}</Text>
                        {streamer.isVerified && (
                          <View className="ml-2 bg-blue-500 rounded-full w-5 h-5 items-center justify-center">
                            <Ionicons name="checkmark" size={14} color="white" />
                          </View>
                        )}
                      </View>
                      <Text className="text-gray-400 text-sm mt-0.5">@{streamer.gamertag}</Text>
                      {/* Follower count with icon */}
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="people" size={12} color="#9CA3AF" />
                        <Text className="text-gray-500 text-xs ml-1">
                          {streamer.followerCount.toLocaleString()} followers
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* LIVE Badge with animation-ready styling */}
                  {streamer.isLive && (
                    <View
                      className="bg-gradient-to-r from-red-600 to-pink-600 px-3 py-1.5 rounded-full flex-row items-center"
                      style={{
                        shadowColor: "#EF4444",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.5,
                        shadowRadius: 8,
                        elevation: 4,
                      }}
                    >
                      <View className="w-2 h-2 rounded-full bg-white mr-1.5" />
                      <Text className="text-white text-xs font-extrabold tracking-wider">LIVE</Text>
                    </View>
                  )}
                </View>

                {/* Bio */}
                <Text className="text-gray-300 text-sm mb-3 leading-5" numberOfLines={2}>
                  {streamer.bio}
                </Text>

                {/* Hero Images Preview with better styling */}
                {streamer.headerImages && streamer.headerImages.length > 0 && (
                  <View className="mb-4">
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="images" size={14} color="#8B5CF6" />
                      <Text className="text-purple-400 text-xs font-semibold ml-1">
                        {streamer.headerImages.length} Header {streamer.headerImages.length > 1 ? "Images" : "Image"}
                      </Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {streamer.headerImages.map((img: string, idx: number) => (
                        <View
                          key={`hero-${idx}`}
                          className="mr-2 rounded-lg overflow-hidden border border-purple-500/30"
                          style={{
                            shadowColor: "#8B5CF6",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 4,
                            elevation: 3,
                          }}
                        >
                          <Image
                            source={{ uri: img }}
                            style={{ width: 100, height: 56, borderRadius: 8 }}
                            contentFit="cover"
                          />
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Divider */}
                <View className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent mb-3" />

                {/* Action Buttons - Row 1 with better design */}
                <View className="flex-row mb-2 gap-2">
                  <Pressable
                    onPress={() => navigation.navigate("StreamerProfile", { streamerId: streamer.id })}
                    className="flex-1 bg-purple-600/20 py-3 rounded-xl flex-row items-center justify-center border border-purple-500/30"
                    style={{
                      shadowColor: "#8B5CF6",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <Ionicons name="eye-outline" size={18} color="#A78BFA" />
                    <Text className="text-purple-300 text-sm font-bold ml-2">View</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => navigation.navigate("EditStreamerProfile", { streamerId: streamer.id })}
                    className="flex-1 bg-blue-600/20 py-3 rounded-xl flex-row items-center justify-center border border-blue-500/30"
                    style={{
                      shadowColor: "#3B82F6",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <Ionicons name="create-outline" size={18} color="#60A5FA" />
                    <Text className="text-blue-300 text-sm font-bold ml-2">Edit</Text>
                  </Pressable>
                </View>

                {/* Action Buttons - Row 2 */}
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => handleToggleLive(streamer)}
                    className={`flex-1 py-3 rounded-xl flex-row items-center justify-center border ${streamer.isLive
                      ? "bg-red-600 border-red-500"
                      : "bg-green-600 border-green-500"
                      }`}
                    style={{
                      shadowColor: streamer.isLive ? "#EF4444" : "#22C55E",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 6,
                      elevation: 3,
                    }}
                  >
                    <Ionicons name={streamer.isLive ? "stop-circle" : "radio"} size={18} color="white" />
                    <Text className="text-white text-sm font-bold ml-2">
                      {streamer.isLive ? "End Stream" : "Go Live"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => openSetStreamerPassword(streamer)}
                    className="flex-1 bg-cyan-600/20 py-3 rounded-xl flex-row items-center justify-center border border-cyan-500/30"
                    style={{
                      shadowColor: "#06B6D4",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <Ionicons name="key-outline" size={18} color="#22D3EE" />
                    <Text className="text-cyan-300 text-sm font-bold ml-2">Login</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleDeleteStreamer(streamer.id, streamer.name)}
                    className="bg-red-600/20 py-3 px-4 rounded-xl items-center justify-center border border-red-500/30"
                    style={{
                      shadowColor: "#EF4444",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#F87171" />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {activeTab === "users" && (
        <View className="px-4 pb-4">
          {/* Create User Button */}
          <Pressable
            onPress={() => setShowCreateUser(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 py-3.5 rounded-2xl mb-4 flex-row items-center justify-center border border-blue-400/30"
            style={{
              shadowColor: "#3B82F6",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <View className="bg-white/20 rounded-full p-1 mr-2">
              <Ionicons name="person-add" size={22} color="white" />
            </View>
            <Text className="text-white font-extrabold text-base tracking-wide">Create User</Text>
          </Pressable>

          {/* Users List */}
          {isLoadingUsers ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-gray-400 mt-4">Loading users...</Text>
            </View>
          ) : usersError ? (
            <View className="items-center py-12">
              <Ionicons name="alert-circle" size={64} color="#EF4444" />
              <Text className="text-red-400 mt-4">{usersError}</Text>
              <Pressable onPress={fetchUsers} className="mt-4 bg-blue-600 px-6 py-3 rounded-xl">
                <Text className="text-white font-semibold">Retry</Text>
              </Pressable>
            </View>
          ) : dbUsers.length === 0 ? (
            <View className="items-center py-12">
              <Ionicons name="people-outline" size={64} color="#4B5563" />
              <Text className="text-gray-400 mt-4">No users yet</Text>
              <Text className="text-gray-500 text-sm mt-2">Create your first user!</Text>
            </View>
          ) : (
            dbUsers.map((dbUser) => {
              const isCurrentUser = dbUser.id === user?.id;
              const isSuspended = dbUser.accountStatus === 'suspended';

              return (
                <View
                  key={dbUser.id}
                  className={`bg-gradient-to-br from-[#1a1a2e] to-[#16162a] p-4 rounded-2xl mb-4 border ${
                    isSuspended ? 'border-red-500/30' : 'border-blue-500/20'
                  }`}
                  style={{
                    shadowColor: isSuspended ? "#EF4444" : "#3B82F6",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  {/* Header with Avatar and Info */}
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                      {/* Avatar */}
                      <View className="rounded-full p-0.5" style={{ backgroundColor: dbUser.isVerified ? '#8B5CF6' : '#3B82F6' }}>
                        {dbUser.avatar ? (
                          <Image
                            source={{ uri: dbUser.avatar }}
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: 28,
                              borderWidth: 3,
                              borderColor: '#0A0A0F',
                            }}
                            contentFit="cover"
                          />
                        ) : (
                          <View className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 items-center justify-center">
                            <Text className="text-white font-bold text-xl">{dbUser.username[0]?.toUpperCase()}</Text>
                          </View>
                        )}
                      </View>

                      {/* Name and Email */}
                      <View className="ml-4 flex-1">
                        <View className="flex-row items-center flex-wrap">
                          <Text className="text-white font-bold text-lg">{dbUser.username}</Text>
                          {dbUser.isVerified && (
                            <View className="ml-2 bg-purple-500 rounded-full w-5 h-5 items-center justify-center">
                              <Ionicons name="checkmark" size={14} color="white" />
                            </View>
                          )}
                          {dbUser.isInfluencer && (
                            <View className="ml-1 bg-pink-500 rounded-full w-5 h-5 items-center justify-center">
                              <Ionicons name="star" size={12} color="white" />
                            </View>
                          )}
                        </View>
                        <Text className="text-gray-400 text-sm mt-0.5">{dbUser.email}</Text>
                        <View className="flex-row items-center mt-1">
                          <Text className="text-gray-500 text-xs">Code: {dbUser.referralCode}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Badges */}
                    <View className="items-end">
                      <View className={`px-2 py-1 rounded-full mb-1 ${
                        dbUser.role === 'admin' ? 'bg-red-500/20' :
                        dbUser.role === 'moderator' ? 'bg-blue-500/20' :
                        dbUser.role === 'support' ? 'bg-green-500/20' :
                        'bg-gray-700/50'
                      }`}>
                        <Text className={`text-[10px] font-bold uppercase ${
                          dbUser.role === 'admin' ? 'text-red-400' :
                          dbUser.role === 'moderator' ? 'text-blue-400' :
                          dbUser.role === 'support' ? 'text-green-400' :
                          'text-gray-400'
                        }`}>{dbUser.role}</Text>
                      </View>
                      <View className={`px-2 py-1 rounded-full ${
                        dbUser.tier === 'superfan' ? 'bg-pink-500/20' : 'bg-gray-700/50'
                      }`}>
                        <Text className={`text-[10px] font-bold uppercase ${
                          dbUser.tier === 'superfan' ? 'text-pink-400' : 'text-gray-400'
                        }`}>{dbUser.tier}</Text>
                      </View>
                      {isSuspended && (
                        <View className="px-2 py-1 rounded-full bg-red-500/20 mt-1">
                          <Text className="text-red-400 text-[10px] font-bold">SUSPENDED</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Bio if exists */}
                  {dbUser.bio && (
                    <Text className="text-gray-300 text-sm mb-3" numberOfLines={2}>
                      {dbUser.bio}
                    </Text>
                  )}

                  {/* Stats Row */}
                  <View className="flex-row mb-3">
                    <View className="flex-1 items-center">
                      <Text className="text-white font-bold">{dbUser.followedStreamers?.length || 0}</Text>
                      <Text className="text-gray-500 text-xs">Following</Text>
                    </View>
                    <View className="flex-1 items-center">
                      <Text className="text-white font-bold">{dbUser.followers?.length || 0}</Text>
                      <Text className="text-gray-500 text-xs">Followers</Text>
                    </View>
                    <View className="flex-1 items-center">
                      <Text className="text-white font-bold">{new Date(dbUser.createdAt).toLocaleDateString()}</Text>
                      <Text className="text-gray-500 text-xs">Joined</Text>
                    </View>
                  </View>

                  {/* Divider */}
                  <View className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent mb-3" />

                  {/* Action Buttons */}
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => openEditUserModal(dbUser)}
                      className="flex-1 bg-blue-600/20 py-2.5 rounded-xl flex-row items-center justify-center border border-blue-500/30"
                    >
                      <Ionicons name="create-outline" size={16} color="#60A5FA" />
                      <Text className="text-blue-300 text-xs font-bold ml-1">Edit</Text>
                    </Pressable>

                    {!dbUser.isVerified && (
                      <Pressable
                        onPress={() => handleVerifyUserInDb(dbUser)}
                        className="flex-1 bg-purple-600/20 py-2.5 rounded-xl flex-row items-center justify-center border border-purple-500/30"
                      >
                        <Ionicons name="checkmark-circle-outline" size={16} color="#A78BFA" />
                        <Text className="text-purple-300 text-xs font-bold ml-1">Verify</Text>
                      </Pressable>
                    )}

                    {!isCurrentUser && (
                      <Pressable
                        onPress={() => handleToggleSuspendUser(dbUser)}
                        className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center border ${
                          isSuspended 
                            ? 'bg-green-600/20 border-green-500/30' 
                            : 'bg-amber-600/20 border-amber-500/30'
                        }`}
                      >
                        <Ionicons 
                          name={isSuspended ? "play-circle-outline" : "pause-circle-outline"} 
                          size={16} 
                          color={isSuspended ? "#4ADE80" : "#FBBF24"} 
                        />
                        <Text className={`text-xs font-bold ml-1 ${isSuspended ? 'text-green-300' : 'text-amber-300'}`}>
                          {isSuspended ? 'Unsuspend' : 'Suspend'}
                        </Text>
                      </Pressable>
                    )}

                    {!isCurrentUser && (
                      <Pressable
                        onPress={() => handleDeleteUserFromDb(dbUser.id, dbUser.username)}
                        className="bg-red-600/20 py-2.5 px-3 rounded-xl items-center justify-center border border-red-500/30"
                      >
                        <Ionicons name="trash-outline" size={16} color="#F87171" />
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {activeTab === "verify" && (
        <View className="px-4 pb-4">
          {/* Pending Requests */}
          <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Pending Requests ({pendingRequests.length})
          </Text>

          {pendingRequests.length > 0 ? (
            pendingRequests.map((request) => (
              <View
                key={request.id}
                className="bg-[#151520] p-3 rounded-xl mb-3 border border-purple-500/30"
              >
                <View className="flex-row items-center mb-3">
                  {request.userAvatar ? (
                    <Image
                      source={{ uri: request.userAvatar }}
                      style={{ width: 48, height: 48, borderRadius: 24 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="w-12 h-12 rounded-full bg-purple-600/20 items-center justify-center">
                      <Text className="text-purple-400 text-lg font-bold">
                        {request.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View className="flex-1 ml-3">
                    <Text className="text-white font-bold">{request.username}</Text>
                    <Text className="text-gray-400 text-xs">
                      Requested {new Date(request.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View className="bg-amber-500/20 px-2 py-1 rounded">
                    <Text className="text-amber-400 text-xs font-bold">PENDING</Text>
                  </View>
                </View>

                <View className="bg-[#0A0A0F] rounded-lg p-3 mb-3">
                  <Text className="text-gray-400 text-xs mb-1">Reason for verification:</Text>
                  <Text className="text-white text-sm">{request.reason}</Text>
                  {request.socialProof && (
                    <>
                      <Text className="text-gray-400 text-xs mt-2 mb-1">Social proof:</Text>
                      <Text className="text-purple-400 text-sm">{request.socialProof}</Text>
                    </>
                  )}
                </View>

                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => handleOpenRejectModal(request)}
                    className="flex-1 bg-red-600/20 py-3 rounded-lg border border-red-600/50"
                  >
                    <Text className="text-red-400 text-center font-bold">Reject</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleApproveVerification(request.id)}
                    className="flex-1 bg-purple-600 py-3 rounded-lg"
                  >
                    <View className="flex-row items-center justify-center">
                      <Ionicons name="checkmark-circle" size={18} color="white" />
                      <Text className="text-white font-bold ml-1">Verify</Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <View className="items-center py-8 mb-6">
              <View className="w-16 h-16 rounded-full bg-green-500/20 items-center justify-center mb-3">
                <Ionicons name="checkmark-done" size={32} color="#10B981" />
              </View>
              <Text className="text-white font-semibold">All caught up!</Text>
              <Text className="text-gray-400 text-sm text-center mt-1">
                No pending verification requests
              </Text>
            </View>
          )}

          {/* All Requests History */}
          <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 mt-4">
            Request History
          </Text>

          {verificationRequests.filter((r) => r.status !== "pending").length > 0 ? (
            verificationRequests
              .filter((r) => r.status !== "pending")
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((request) => (
                <View
                  key={request.id}
                  className="bg-[#151520] p-4 rounded-xl mb-3 border border-gray-800"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      {request.userAvatar ? (
                        <Image
                          source={{ uri: request.userAvatar }}
                          style={{ width: 40, height: 40, borderRadius: 20 }}
                          contentFit="cover"
                        />
                      ) : (
                        <View className="w-10 h-10 rounded-full bg-gray-700 items-center justify-center">
                          <Text className="text-gray-400 font-bold">
                            {request.username.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View className="flex-1 ml-3">
                        <Text className="text-white font-semibold">{request.username}</Text>
                        <Text className="text-gray-500 text-xs">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <View
                      className={`px-2 py-1 rounded ${request.status === "approved" ? "bg-green-600/20" : "bg-red-600/20"
                        }`}
                    >
                      <Text
                        className={`text-xs font-bold ${request.status === "approved" ? "text-green-400" : "text-red-400"
                          }`}
                      >
                        {request.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  {request.rejectionReason && (
                    <Text className="text-gray-400 text-xs mt-2">
                      Reason: {request.rejectionReason}
                    </Text>
                  )}
                </View>
              ))
          ) : (
            <View className="items-center py-8">
              <Ionicons name="document-text-outline" size={48} color="#4B5563" />
              <Text className="text-gray-400 mt-2 text-sm">No history yet</Text>
            </View>
          )}
        </View>
      )}

      {activeTab === "announcements" && (
        <View className="px-4 pb-4">
          {/* Create Announcement Button */}
          <Pressable
            onPress={() => setShowCreateAnnouncement(true)}
            className="bg-purple-600 py-3 rounded-xl mb-4 flex-row items-center justify-center"
          >
            <Ionicons name="megaphone" size={24} color="white" />
            <Text className="text-white font-bold ml-2">Create Announcement</Text>
          </Pressable>

          {/* Announcements List */}
          {announcements.map((announcement) => {
            const isExpired = new Date(announcement.expiresAt) < new Date();
            return (
              <View
                key={announcement.id}
                className="bg-[#151520] p-3 rounded-xl mb-3 border border-gray-800"
              >
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1 mr-3">
                    <Text className="text-white font-bold mb-1">{announcement.message}</Text>
                    <Text className="text-gray-400 text-xs">
                      By {announcement.createdByName}
                    </Text>
                  </View>
                  <View className={`px-2 py-1 rounded ${isExpired ? "bg-gray-700" : announcement.isActive ? "bg-purple-600" : "bg-gray-700"}`}>
                    <Text className="text-white text-xs font-bold">
                      {isExpired ? "EXPIRED" : announcement.isActive ? "ACTIVE" : "DISMISSED"}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-500 text-xs">
                    Expires: {new Date(announcement.expiresAt).toLocaleString()}
                  </Text>
                  <Pressable
                    onPress={() => handleDeleteAnnouncement(announcement.id)}
                    className="bg-red-600 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-white text-xs font-bold">Delete</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}

          {announcements.length === 0 && (
            <View className="items-center py-12">
              <Ionicons name="megaphone-outline" size={64} color="#4B5563" />
              <Text className="text-gray-400 mt-4">No announcements yet</Text>
              <Text className="text-gray-600 text-sm">Create one to notify all users</Text>
            </View>
          )}
        </View>
      )}

      {/* Reports Tab */}
      {activeTab === "reports" && (
        <View className="px-4 pb-4">
          <Text className="text-white text-base font-bold mb-2">Content Reports</Text>
          <Text className="text-gray-400 text-xs mb-4">
            Review reported content and take action against violations.
          </Text>

          {reports.filter((r) => r.status === "pending").length > 0 && (
            <View className="mb-4">
              <Text className="text-orange-400 text-xs font-semibold mb-2">PENDING REPORTS</Text>
              {reports
                .filter((r) => r.status === "pending")
                .map((report) => (
                  <View
                    key={report.id}
                    className="bg-[#151520] p-3 rounded-xl mb-3 border border-red-500/30"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center">
                        <Ionicons name="flag" size={16} color="#EF4444" />
                        <Text className="text-white font-bold ml-2 text-sm">{report.reason.replace("_", " ").toUpperCase()}</Text>
                      </View>
                      <View className="bg-orange-500 px-2 py-0.5 rounded">
                        <Text className="text-white text-xs font-bold">PENDING</Text>
                      </View>
                    </View>

                    <Text className="text-gray-400 text-xs mb-1">
                      Reported by: <Text className="text-white">{report.reporterUsername}</Text>
                    </Text>
                    <Text className="text-gray-400 text-xs mb-1">
                      Target: <Text className="text-white">{report.targetType} by {report.targetUsername || "Unknown"}</Text>
                    </Text>
                    {report.details && (
                      <Text className="text-gray-400 text-xs mb-2">
                        Details: <Text className="text-gray-300">{report.details}</Text>
                      </Text>
                    )}
                    <Text className="text-gray-500 text-[10px] mb-2">
                      {new Date(report.createdAt).toLocaleString()}
                    </Text>

                    <View className="flex-row">
                      <Pressable
                        onPress={() => {
                          if (report.targetType === "post") {
                            deletePost(report.targetId, "admin");
                          }
                          if (report.targetUserId) {
                            suspendUser(report.targetUserId, user?.id || "", "Content violation: " + report.reason);
                          }
                          reviewReport(report.id, user?.id || "", "Post removed and user suspended");
                          Alert.alert("Action Taken", "The content has been removed and the user has been suspended.");
                        }}
                        className="flex-1 bg-red-600 py-3 rounded-lg mr-2"
                      >
                        <Text className="text-white text-center font-bold text-sm">Remove & Suspend</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          if (report.targetType === "post") {
                            deletePost(report.targetId, "admin");
                          }
                          reviewReport(report.id, user?.id || "", "Post removed");
                          Alert.alert("Post Removed", "The reported content has been removed.");
                        }}
                        className="flex-1 bg-orange-600 py-2 rounded-lg mr-2"
                      >
                        <Text className="text-white text-center font-bold text-xs">Remove Post</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          dismissReport(report.id, user?.id || "");
                          Alert.alert("Dismissed", "The report has been dismissed.");
                        }}
                        className="flex-1 bg-gray-700 py-2 rounded-lg"
                      >
                        <Text className="text-white text-center font-bold text-xs">Dismiss</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
            </View>
          )}

          {/* Suspended Users Section */}
          <Text className="text-red-400 text-xs font-semibold mb-2 mt-2">SUSPENDED USERS</Text>
          {getAllUsers()
            .filter((u) => u.accountStatus === "suspended")
            .map((suspendedUser) => (
              <View
                key={suspendedUser.id}
                className="bg-[#151520] p-3 rounded-xl mb-3 border border-red-500/30"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-full bg-red-600 items-center justify-center">
                      <Text className="text-white font-bold text-sm">{suspendedUser.username[0]?.toUpperCase()}</Text>
                    </View>
                    <View className="ml-2">
                      <Text className="text-white font-bold text-sm">{suspendedUser.username}</Text>
                      <Text className="text-red-400 text-xs">Suspended</Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => {
                      unsuspendUser(suspendedUser.id, user?.id || "");
                      Alert.alert("Reinstated", "User account has been reinstated.");
                    }}
                    className="bg-green-600 px-3 py-1.5 rounded-lg"
                  >
                    <Text className="text-white font-bold text-xs">Unsuspend</Text>
                  </Pressable>
                </View>
                {suspendedUser.suspensionReason && (
                  <Text className="text-gray-400 text-xs">
                    Reason: {suspendedUser.suspensionReason}
                  </Text>
                )}
              </View>
            ))}

          {getAllUsers().filter((u) => u.accountStatus === "suspended").length === 0 && (
            <View className="items-center py-4">
              <Text className="text-gray-500 text-sm">No suspended users</Text>
            </View>
          )}

          {/* Reviewed Reports */}
          {reports.filter((r) => r.status !== "pending").length > 0 && (
            <View className="mt-4">
              <Text className="text-gray-400 text-xs font-semibold mb-2">REVIEWED REPORTS</Text>
              {reports
                .filter((r) => r.status !== "pending")
                .slice(0, 10)
                .map((report) => (
                  <View
                    key={report.id}
                    className="bg-[#0A0A0F] p-2 rounded-lg mb-2 flex-row items-center justify-between"
                  >
                    <View className="flex-1">
                      <Text className="text-gray-300 text-xs">{report.reason.replace("_", " ")}</Text>
                      <Text className="text-gray-500 text-[10px]">{report.targetUsername}</Text>
                    </View>
                    <View className={`px-2 py-0.5 rounded ${report.status === "action_taken" ? "bg-red-600" : "bg-gray-600"}`}>
                      <Text className="text-white text-[10px] font-bold">
                        {report.status === "action_taken" ? "ACTION" : "DISMISSED"}
                      </Text>
                    </View>
                  </View>
                ))}
            </View>
          )}

          {reports.length === 0 && (
            <View className="items-center py-12">
              <Ionicons name="checkmark-circle-outline" size={64} color="#4B5563" />
              <Text className="text-gray-400 mt-4">No reports</Text>
              <Text className="text-gray-600 text-sm">All content is compliant</Text>
            </View>
          )}
        </View>
      )}

      {/* Artists Tab */}
      {activeTab === "artists" && (
        <View className="px-4 pb-4">
          {/* Admin Music Section */}
          <View className="mb-4">
            <Text className="text-purple-400 text-xs font-semibold mb-2">ADMIN MUSIC</Text>
            <Pressable
              onPress={() => {
                console.log("[AdminDashboard] Admin Music Manage button pressed");
                ensureAdminArtist();
                setShowAdminMusic(true);
              }}
              style={({ pressed }) => ({
                backgroundColor: pressed ? "rgba(107, 33, 168, 0.6)" : "rgba(88, 28, 135, 0.5)",
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "rgba(168, 85, 247, 0.4)",
              })}
            >
              <View className="flex-row items-center">
                {(adminArtist?.avatar || user?.avatar) ? (
                  <Image
                    source={{ uri: adminArtist?.avatar || user?.avatar }}
                    style={{ width: 56, height: 56, borderRadius: 12 }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="w-14 h-14 rounded-xl bg-purple-600/30 items-center justify-center">
                    <Ionicons name="musical-notes" size={28} color="#A855F7" />
                  </View>
                )}
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center">
                    <Text className="text-white font-bold text-base">{adminArtist?.stageName || user?.username || "Admin Music Studio"}</Text>
                    <View className="ml-2 bg-purple-500 rounded-full p-0.5">
                      <Ionicons name="checkmark" size={10} color="white" />
                    </View>
                  </View>
                  <Text className="text-gray-400 text-sm mt-0.5">
                    {adminArtist?.tracks?.length || 0} track{(adminArtist?.tracks?.length || 0) !== 1 ? "s" : ""} uploaded
                  </Text>
                </View>
                <View className="bg-purple-600 px-3 py-2 rounded-lg">
                  <Text className="text-white font-bold text-xs">Manage</Text>
                </View>
              </View>
              {adminArtist && adminArtist.tracks.length > 0 && (
                <View className="flex-row mt-3 pt-3 border-t border-purple-500/20">
                  <View className="flex-1">
                    <Text className="text-gray-400 text-[10px]">Total Plays</Text>
                    <Text className="text-white font-bold text-sm">{adminArtist.totalPlays.toLocaleString()}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-400 text-[10px]">Followers</Text>
                    <Text className="text-white font-bold text-sm">{adminArtist.followerCount.toLocaleString()}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-400 text-[10px]">Latest Track</Text>
                    <Text className="text-purple-400 font-bold text-sm" numberOfLines={1}>
                      {adminArtist.tracks[adminArtist.tracks.length - 1]?.title || "None"}
                    </Text>
                  </View>
                </View>
              )}
            </Pressable>
          </View>

          {/* Create Artist Button */}
          <Pressable
            onPress={() => {
              console.log("[AdminDashboard] Create Artist button pressed");
              setShowCreateArtist(true);
            }}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#be185d" : "#db2777",
              paddingVertical: 10,
              borderRadius: 12,
              marginBottom: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text className="text-white font-bold text-sm ml-2">Create Artist</Text>
          </Pressable>

          {/* Hot Artists Section */}
          {artists.filter((a) => a.hotStatus && a.id !== ADMIN_ARTIST_ID).length > 0 && (
            <View className="mb-4">
              <Text className="text-orange-400 text-xs font-semibold mb-2">HOT ARTISTS</Text>
              {artists
                .filter((a) => a.hotStatus && a.id !== ADMIN_ARTIST_ID)
                .map((artist) => (
                  <View
                    key={`hot-${artist.id}`}
                    className="bg-orange-900/40 p-3 rounded-xl mb-3 border border-orange-500/30"
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="flame" size={20} color="#F97316" />
                      <Text className="text-white font-bold ml-2 text-sm">{artist.stageName}</Text>
                      <View className="ml-auto bg-orange-500 px-2 py-0.5 rounded">
                        <Text className="text-white text-xs font-bold">HOT</Text>
                      </View>
                    </View>
                    <View className="flex-row mt-2">
                      <View className="flex-1">
                        <Text className="text-gray-400 text-[10px]">Total Plays</Text>
                        <Text className="text-white font-bold text-sm">{artist.totalPlays.toLocaleString()}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-400 text-[10px]">Followers</Text>
                        <Text className="text-white font-bold text-sm">{artist.followerCount.toLocaleString()}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-400 text-[10px]">Tracks</Text>
                        <Text className="text-white font-bold text-sm">{artist.tracks.length}</Text>
                      </View>
                    </View>
                  </View>
                ))}
            </View>
          )}

          {/* All Artists */}
          <Text className="text-gray-400 text-xs font-semibold mb-2">ALL ARTISTS ({artists.filter(a => a.id !== ADMIN_ARTIST_ID).length})</Text>
          {artists.filter(a => a.id !== ADMIN_ARTIST_ID).map((artist) => {
            const hasLoginAccess = !!getArtistAccount(artist.id);
            return (
              <View
                key={artist.id}
                className="bg-[#151520] p-3 rounded-xl mb-3 border border-gray-800"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center flex-1">
                    {artist.avatar ? (
                      <Image
                        source={{ uri: artist.avatar }}
                        style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: artist.hotStatus ? "#F97316" : "#EC4899" }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="w-12 h-12 rounded-full bg-pink-600 items-center justify-center">
                        <Text className="text-white font-bold">{artist.stageName[0]}</Text>
                      </View>
                    )}
                    <View className="ml-3 flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-white font-bold">{artist.stageName}</Text>
                        {artist.isVerified && (
                          <View className="ml-1.5 bg-purple-500 rounded-full p-0.5">
                            <Ionicons name="checkmark" size={10} color="white" />
                          </View>
                        )}
                        {artist.hotStatus && (
                          <View className="ml-1.5 bg-orange-500 rounded-full p-0.5">
                            <Ionicons name="flame" size={10} color="white" />
                          </View>
                        )}
                      </View>
                      <Text className="text-gray-400 text-sm">@{artist.name}</Text>
                    </View>
                  </View>
                </View>

                <Text className="text-gray-300 text-sm mb-2" numberOfLines={2}>
                  {artist.bio}
                </Text>

                <View className="flex-row mb-2">
                  <View className="flex-1 bg-[#0A0A0F] p-1.5 rounded mr-1.5">
                    <Text className="text-gray-400 text-[10px] text-center">Plays</Text>
                    <Text className="text-white font-bold text-xs text-center">{artist.totalPlays}</Text>
                  </View>
                  <View className="flex-1 bg-[#0A0A0F] p-1.5 rounded mr-1.5">
                    <Text className="text-gray-400 text-[10px] text-center">Followers</Text>
                    <Text className="text-white font-bold text-xs text-center">{artist.followerCount}</Text>
                  </View>
                  <View className="flex-1 bg-[#0A0A0F] p-1.5 rounded">
                    <Text className="text-gray-400 text-[10px] text-center">Tracks</Text>
                    <Text className="text-white font-bold text-xs text-center">{artist.tracks.length}</Text>
                  </View>
                </View>

                {/* Login Status */}
                <View className="flex-row items-center mb-2">
                  <Ionicons
                    name={hasLoginAccess ? "checkmark-circle" : "alert-circle"}
                    size={14}
                    color={hasLoginAccess ? "#10B981" : "#EF4444"}
                  />
                  <Text className={`text-xs ml-1 ${hasLoginAccess ? "text-green-500" : "text-red-500"}`}>
                    {hasLoginAccess ? "Login enabled" : "No login access"}
                  </Text>
                </View>

                {/* Top Performing Track */}
                {artist.tracks.length > 0 && (
                  <View className="bg-[#0A0A0F] p-2 rounded-lg mb-2">
                    <Text className="text-gray-400 text-[10px] mb-0.5">Top Track</Text>
                    {(() => {
                      const topTrack = [...artist.tracks].sort((a, b) => b.playCount - a.playCount)[0];
                      return (
                        <View className="flex-row items-center justify-between">
                          <Text className="text-white font-semibold text-xs">{topTrack.title}</Text>
                          <View className="flex-row items-center">
                            <Ionicons name="play" size={12} color="#A855F7" />
                            <Text className="text-purple-400 text-xs ml-1">{topTrack.playCount}</Text>
                            {topTrack.isHot && (
                              <Ionicons name="flame" size={12} color="#F97316" style={{ marginLeft: 4 }} />
                            )}
                          </View>
                        </View>
                      );
                    })()}
                  </View>
                )}

                {/* Action Buttons - Row 1 */}
                <View className="flex-row mt-2 mb-2">
                  <Pressable
                    onPress={() => openEditArtist(artist)}
                    className="flex-1 bg-blue-600/20 py-2.5 rounded-lg mr-2 flex-row items-center justify-center"
                  >
                    <Ionicons name="create-outline" size={16} color="#3B82F6" />
                    <Text className="text-blue-400 text-xs font-bold ml-1">Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openSetArtistPassword(artist)}
                    className="flex-1 bg-cyan-600/20 py-2.5 rounded-lg mr-2 flex-row items-center justify-center"
                  >
                    <Ionicons name="key-outline" size={16} color="#06B6D4" />
                    <Text className="text-cyan-400 text-xs font-bold ml-1">Login</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeleteArtist(artist.id)}
                    className="bg-red-600/20 py-2.5 px-4 rounded-lg flex-row items-center justify-center"
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </Pressable>
                </View>

                {/* Action Buttons - Row 2 */}
                <View className="flex-row mb-2">
                  <Pressable
                    onPress={() => navigation.navigate("ArtistProfile", { artistId: artist.id })}
                    className="flex-1 bg-purple-600/20 py-2.5 rounded-lg mr-2 flex-row items-center justify-center"
                  >
                    <Ionicons name="eye-outline" size={16} color="#8B5CF6" />
                    <Text className="text-purple-400 text-xs font-bold ml-1">View Profile</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openManageMusic(artist)}
                    className="flex-1 bg-pink-600/20 py-2.5 rounded-lg flex-row items-center justify-center"
                  >
                    <Ionicons name="musical-notes" size={16} color="#EC4899" />
                    <Text className="text-pink-400 text-xs font-bold ml-1">Music ({artist.tracks.length})</Text>
                  </Pressable>
                </View>

                {/* Action Buttons - Row 3 */}
                <View className="flex-row">
                  {!artist.hotStatus && (
                    <Pressable
                      onPress={() => {
                        const pushTrackToHot = useAppStore.getState().pushTrackToHot;
                        if (artist.tracks.length > 0) {
                          const topTrack = [...artist.tracks].sort((a, b) => b.playCount - a.playCount)[0];
                          pushTrackToHot(artist.id, topTrack.id);
                          Alert.alert("Hot Status", `${artist.stageName} has been pushed to HOT status!`);
                        } else {
                          Alert.alert("No Tracks", "Artist needs at least one track to push to hot status.");
                        }
                      }}
                      className="flex-1 bg-orange-600 py-2 rounded-lg mr-2"
                    >
                      <Text className="text-white text-center font-bold text-xs">Push to HOT</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => {
                      updateArtist(artist.id, { isVerified: !artist.isVerified });
                    }}
                    className={`flex-1 ${artist.isVerified ? "bg-gray-600" : "bg-purple-600"} py-2 rounded-lg`}
                  >
                    <Text className="text-white text-center font-bold text-xs">
                      {artist.isVerified ? "Remove Verify" : "Verify"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}

          {artists.length === 0 && (
            <View className="items-center py-8">
              <Ionicons name="musical-notes-outline" size={48} color="#4B5563" />
              <Text className="text-gray-400 mt-3 text-sm">No artists yet</Text>
              <Text className="text-gray-600 text-xs">Create your first artist to get started</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>

    {/* Create Streamer Modal */}
    <Modal visible={showCreateStreamer} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={10}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-[#151520] rounded-t-3xl p-6 max-h-[85%]">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">Create Streamer</Text>
                <Pressable onPress={() => {
                  setShowCreateStreamer(false);
                  setUseExistingUser(false);
                  setSelectedExistingUser(null);
                  setUserSearchQuery("");
                }}>
                  <Ionicons name="close" size={28} color="white" />
                </Pressable>
              </View>

              {/* Toggle: Create New vs Link Existing */}
              <View className="flex-row mb-4 bg-[#0A0A0F] rounded-xl p-1">
                <Pressable
                  onPress={() => {
                    setUseExistingUser(false);
                    setSelectedExistingUser(null);
                    setUserSearchQuery("");
                  }}
                  className={`flex-1 py-3 rounded-lg ${!useExistingUser ? 'bg-purple-600' : ''}`}
                >
                  <Text className={`text-center font-semibold ${!useExistingUser ? 'text-white' : 'text-gray-400'}`}>
                    Create New
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setUseExistingUser(true)}
                  className={`flex-1 py-3 rounded-lg ${useExistingUser ? 'bg-purple-600' : ''}`}
                >
                  <Text className={`text-center font-semibold ${useExistingUser ? 'text-white' : 'text-gray-400'}`}>
                    Link Existing User
                  </Text>
                </Pressable>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                {/* Existing User Selection */}
                {useExistingUser && (
                  <View className="mb-4">
                    <Text className="text-white font-bold mb-2">Select User</Text>
                    <TextInput
                      placeholder="Search users by name or email..."
                      placeholderTextColor="#6B7280"
                      value={userSearchQuery}
                      onChangeText={setUserSearchQuery}
                      className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-3"
                    />
                    
                    {/* Selected User Display */}
                    {selectedExistingUser && (
                      <View className="bg-purple-600/20 border border-purple-500 rounded-xl p-3 mb-3 flex-row items-center">
                        <Image
                          source={{ uri: selectedExistingUser.avatar || "https://i.pravatar.cc/150?img=50" }}
                          style={{ width: 40, height: 40, borderRadius: 20 }}
                          contentFit="cover"
                        />
                        <View className="flex-1 ml-3">
                          <Text className="text-white font-bold">{selectedExistingUser.username}</Text>
                          <Text className="text-gray-400 text-xs">{selectedExistingUser.email}</Text>
                        </View>
                        <Pressable onPress={() => setSelectedExistingUser(null)}>
                          <Ionicons name="close-circle" size={24} color="#A855F7" />
                        </Pressable>
                      </View>
                    )}

                    {/* User List (filtered, excluding users who already have streamer profiles) */}
                    {!selectedExistingUser && (
                      <View className="bg-[#0A0A0F] rounded-xl max-h-48">
                        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                          {dbUsers
                            .filter(u => {
                              // Filter by search query
                              const matchesSearch = !userSearchQuery || 
                                u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
                              // Exclude users who already have streamer profiles
                              const hasStreamerProfile = dbStreamers.some(s => s.userId === u.id);
                              return matchesSearch && !hasStreamerProfile;
                            })
                            .slice(0, 10)
                            .map((u) => (
                              <Pressable
                                key={u.id}
                                onPress={() => {
                                  setSelectedExistingUser(u);
                                  setStreamerForm(prev => ({
                                    ...prev,
                                    name: u.username,
                                    gamertag: u.username,
                                    avatar: u.avatar || "",
                                    bio: u.bio || "",
                                  }));
                                }}
                                className="flex-row items-center p-3 border-b border-gray-800"
                              >
                                <Image
                                  source={{ uri: u.avatar || "https://i.pravatar.cc/150?img=50" }}
                                  style={{ width: 36, height: 36, borderRadius: 18 }}
                                  contentFit="cover"
                                />
                                <View className="flex-1 ml-3">
                                  <Text className="text-white font-semibold">{u.username}</Text>
                                  <Text className="text-gray-500 text-xs">{u.email}</Text>
                                </View>
                                <Ionicons name="add-circle-outline" size={20} color="#A855F7" />
                              </Pressable>
                            ))}
                          {dbUsers.filter(u => {
                            const matchesSearch = !userSearchQuery || 
                              u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                              u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
                            const hasStreamerProfile = dbStreamers.some(s => s.userId === u.id);
                            return matchesSearch && !hasStreamerProfile;
                          }).length === 0 && (
                            <View className="p-4 items-center">
                              <Text className="text-gray-500 text-sm">No eligible users found</Text>
                            </View>
                          )}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                )}

                {/* Name & Gamertag - always shown but pre-filled when linking */}
                <TextInput
                  placeholder={useExistingUser ? "Display Name (optional override)" : "Name *"}
                  placeholderTextColor="#6B7280"
                  value={streamerForm.name}
                  onChangeText={(text) => setStreamerForm({ ...streamerForm, name: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder={useExistingUser ? "Gamertag (optional override)" : "Gamertag *"}
                  placeholderTextColor="#6B7280"
                  value={streamerForm.gamertag}
                  onChangeText={(text) => setStreamerForm({ ...streamerForm, gamertag: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />

                {/* Only show email/password fields for new streamers (not linking existing) */}
                {!useExistingUser && (
                  <>
                    <TextInput
                      placeholder="Email (for login access)"
                      placeholderTextColor="#6B7280"
                      value={streamerForm.email}
                      onChangeText={(text) => setStreamerForm({ ...streamerForm, email: text })}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                    />
                    <TextInput
                      placeholder="Password (for login access)"
                      placeholderTextColor="#6B7280"
                      value={streamerForm.password}
                      onChangeText={(text) => setStreamerForm({ ...streamerForm, password: text })}
                      secureTextEntry
                      className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                    />
                  </>
                )}

                <TextInput
                  placeholder="Avatar URL (optional)"
                  placeholderTextColor="#6B7280"
                  value={streamerForm.avatar}
                  onChangeText={(text) => setStreamerForm({ ...streamerForm, avatar: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="Bio"
                  placeholderTextColor="#6B7280"
                  value={streamerForm.bio}
                  onChangeText={(text) => setStreamerForm({ ...streamerForm, bio: text })}
                  multiline
                  numberOfLines={3}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  style={{ minHeight: 80, textAlignVertical: "top" }}
                />
                <TextInput
                  placeholder="Referral Code (optional)"
                  placeholderTextColor="#6B7280"
                  value={streamerForm.referralCode}
                  onChangeText={(text) => setStreamerForm({ ...streamerForm, referralCode: text.toUpperCase() })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />

                {/* Streaming Platform URLs */}
                <Text className="text-white font-bold mb-2 mt-2">Streaming Platforms</Text>
                <TextInput
                  placeholder="Twitch Channel URL"
                  placeholderTextColor="#6B7280"
                  value={streamerForm.twitchUrl}
                  onChangeText={(text) => setStreamerForm({ ...streamerForm, twitchUrl: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="YouTube Live URL"
                  placeholderTextColor="#6B7280"
                  value={streamerForm.youtubeUrl}
                  onChangeText={(text) => setStreamerForm({ ...streamerForm, youtubeUrl: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="TikTok Live URL"
                  placeholderTextColor="#6B7280"
                  value={streamerForm.tiktokUrl}
                  onChangeText={(text) => setStreamerForm({ ...streamerForm, tiktokUrl: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="Instagram Live URL"
                  placeholderTextColor="#6B7280"
                  value={streamerForm.instagramUrl}
                  onChangeText={(text) => setStreamerForm({ ...streamerForm, instagramUrl: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />

                <Pressable
                  onPress={handleCreateStreamer}
                  disabled={useExistingUser && !selectedExistingUser}
                  className={`py-4 rounded-xl mt-4 mb-4 ${useExistingUser && !selectedExistingUser ? 'bg-gray-600' : 'bg-purple-600'}`}
                >
                  <Text className="text-white text-center font-bold">
                    {useExistingUser ? 'Add Streamer Profile' : 'Create Streamer'}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>

    {/* Edit Streamer Modal */}
    <Modal visible={showEditStreamer} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={10}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-[#151520] rounded-t-3xl p-6 max-h-[85%]">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">Edit Streamer</Text>
                <Pressable onPress={() => setShowEditStreamer(false)}>
                  <Ionicons name="close" size={28} color="white" />
                </Pressable>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <TextInput
                  placeholder="Name"
                  placeholderTextColor="#6B7280"
                  value={streamerForm.name}
                  onChangeText={(text) => setStreamerForm({ ...streamerForm, name: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="Gamertag"
                  placeholderTextColor="#6B7280"
                  value={streamerForm.gamertag}
                  onChangeText={(text) => setStreamerForm({ ...streamerForm, gamertag: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="Avatar URL"
                  placeholderTextColor="#6B7280"
                  value={streamerForm.avatar}
                  onChangeText={(text) => setStreamerForm({ ...streamerForm, avatar: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="Bio"
                  placeholderTextColor="#6B7280"
                  value={streamerForm.bio}
                  onChangeText={(text) => setStreamerForm({ ...streamerForm, bio: text })}
                  multiline
                  numberOfLines={3}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  style={{ minHeight: 80, textAlignVertical: "top" }}
                />
                <TextInput
                  placeholder="Referral Code"
                  placeholderTextColor="#6B7280"
                  value={streamerForm.referralCode}
                  onChangeText={(text) => setStreamerForm({ ...streamerForm, referralCode: text.toUpperCase() })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />

                <Pressable
                  onPress={handleEditStreamer}
                  className="bg-blue-600 py-4 rounded-xl mt-4 mb-4"
                >
                  <Text className="text-white text-center font-bold">Save Changes</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>

    {/* Set Streamer Password Modal */}
    <Modal visible={showSetStreamerPassword} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={10}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-[#151520] rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">Set Login Credentials</Text>
                <Pressable onPress={() => setShowSetStreamerPassword(false)}>
                  <Ionicons name="close" size={28} color="white" />
                </Pressable>
              </View>

              {selectedStreamer && (
                <View className="mb-6">
                  <Text className="text-gray-400 text-sm">Streamer</Text>
                  <Text className="text-white font-bold">{selectedStreamer.name}</Text>
                  <Text className="text-gray-400">@{selectedStreamer.gamertag}</Text>
                </View>
              )}

              <TextInput
                placeholder="Email for login"
                placeholderTextColor="#6B7280"
                value={streamerEmail}
                onChangeText={setStreamerEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
              />

              <TextInput
                placeholder="Password"
                placeholderTextColor="#6B7280"
                value={streamerPassword}
                onChangeText={setStreamerPassword}
                secureTextEntry
                className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
              />

              <Pressable
                onPress={handleSetStreamerPassword}
                className="bg-green-600 py-4 rounded-xl"
              >
                <Text className="text-white text-center font-bold">Set Login Credentials</Text>
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>

    {/* Create Announcement Modal */}
    <Modal visible={showCreateAnnouncement} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={10}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-[#151520] rounded-t-3xl p-6 max-h-[85%]">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">Create Announcement</Text>
                <Pressable onPress={() => setShowCreateAnnouncement(false)}>
                  <Ionicons name="close" size={28} color="white" />
                </Pressable>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <TextInput
                  placeholder="Announcement Message *"
                  placeholderTextColor="#6B7280"
                  value={announcementForm.message}
                  onChangeText={(text) => setAnnouncementForm({ ...announcementForm, message: text })}
                  multiline
                  numberOfLines={3}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  style={{ minHeight: 80, textAlignVertical: "top" }}
                />

                <Text className="text-white font-bold mb-2">Duration (hours)</Text>
                <View className="flex-row gap-2 mb-6">
                  <Pressable
                    onPress={() => setAnnouncementForm({ ...announcementForm, duration: "6" })}
                    className={`flex-1 py-3 rounded-xl border ${announcementForm.duration === "6"
                      ? "bg-purple-600 border-purple-600"
                      : "bg-[#0A0A0F] border-gray-700"
                      }`}
                  >
                    <Text className="text-white text-center font-bold">6h</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setAnnouncementForm({ ...announcementForm, duration: "24" })}
                    className={`flex-1 py-3 rounded-xl border ${announcementForm.duration === "24"
                      ? "bg-purple-600 border-purple-600"
                      : "bg-[#0A0A0F] border-gray-700"
                      }`}
                  >
                    <Text className="text-white text-center font-bold">24h</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setAnnouncementForm({ ...announcementForm, duration: "72" })}
                    className={`flex-1 py-3 rounded-xl border ${announcementForm.duration === "72"
                      ? "bg-purple-600 border-purple-600"
                      : "bg-[#0A0A0F] border-gray-700"
                      }`}
                  >
                    <Text className="text-white text-center font-bold">72h</Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={handleCreateAnnouncement}
                  className="bg-purple-600 py-4 rounded-xl mb-4"
                >
                  <Text className="text-white text-center font-bold">Create Announcement</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>

    {/* Reject Verification Modal */}
    <Modal visible={showRejectModal} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={10}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-[#151520] rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">Reject Verification</Text>
                <Pressable onPress={() => setShowRejectModal(false)}>
                  <Ionicons name="close" size={28} color="white" />
                </Pressable>
              </View>

              {selectedRequest && (
                <View className="mb-4">
                  <Text className="text-gray-400 text-sm">Rejecting request from:</Text>
                  <Text className="text-white font-bold text-lg">{selectedRequest.username}</Text>
                </View>
              )}

              <Text className="text-gray-400 text-sm mb-2">Reason for rejection *</Text>
              <TextInput
                placeholder="Explain why this request was rejected..."
                placeholderTextColor="#6B7280"
                value={rejectionReason}
                onChangeText={setRejectionReason}
                multiline
                numberOfLines={3}
                className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                style={{ minHeight: 80, textAlignVertical: "top" }}
              />

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setShowRejectModal(false)}
                  className="flex-1 bg-gray-700 py-4 rounded-xl"
                >
                  <Text className="text-white text-center font-bold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleRejectVerification}
                  className="flex-1 bg-red-600 py-4 rounded-xl"
                >
                  <Text className="text-white text-center font-bold">Reject</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>

    {/* Create Artist Modal */}
    <Modal visible={showCreateArtist} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={10}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-[#151520] rounded-t-3xl p-6 max-h-[85%]">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">Create Artist</Text>
                <Pressable onPress={() => setShowCreateArtist(false)}>
                  <Ionicons name="close" size={28} color="white" />
                </Pressable>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <TextInput
                  placeholder="Real Name *"
                  placeholderTextColor="#6B7280"
                  value={artistForm.name}
                  onChangeText={(text) => setArtistForm({ ...artistForm, name: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="Stage Name *"
                  placeholderTextColor="#6B7280"
                  value={artistForm.stageName}
                  onChangeText={(text) => setArtistForm({ ...artistForm, stageName: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="Email (for login access)"
                  placeholderTextColor="#6B7280"
                  value={artistForm.email}
                  onChangeText={(text) => setArtistForm({ ...artistForm, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="Password (for login access)"
                  placeholderTextColor="#6B7280"
                  value={artistForm.password}
                  onChangeText={(text) => setArtistForm({ ...artistForm, password: text })}
                  secureTextEntry
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="Genre (e.g., Hip-Hop, R&B, Pop)"
                  placeholderTextColor="#6B7280"
                  value={artistForm.genre}
                  onChangeText={(text) => setArtistForm({ ...artistForm, genre: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="Avatar URL (optional)"
                  placeholderTextColor="#6B7280"
                  value={artistForm.avatar}
                  onChangeText={(text) => setArtistForm({ ...artistForm, avatar: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="Bio"
                  placeholderTextColor="#6B7280"
                  value={artistForm.bio}
                  onChangeText={(text) => setArtistForm({ ...artistForm, bio: text })}
                  multiline
                  numberOfLines={3}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  style={{ minHeight: 80, textAlignVertical: "top" }}
                />
                <TextInput
                  placeholder="Referral Code (optional)"
                  placeholderTextColor="#6B7280"
                  value={artistForm.referralCode}
                  onChangeText={(text) => setArtistForm({ ...artistForm, referralCode: text.toUpperCase() })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />

                {/* Music Platform URLs */}
                <Text className="text-white font-bold mb-2 mt-2">Music Platforms</Text>
                <TextInput
                  placeholder="Spotify URL"
                  placeholderTextColor="#6B7280"
                  value={artistForm.spotifyUrl}
                  onChangeText={(text) => setArtistForm({ ...artistForm, spotifyUrl: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="Apple Music URL"
                  placeholderTextColor="#6B7280"
                  value={artistForm.appleMusicUrl}
                  onChangeText={(text) => setArtistForm({ ...artistForm, appleMusicUrl: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="SoundCloud URL"
                  placeholderTextColor="#6B7280"
                  value={artistForm.soundcloudUrl}
                  onChangeText={(text) => setArtistForm({ ...artistForm, soundcloudUrl: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="Instagram URL"
                  placeholderTextColor="#6B7280"
                  value={artistForm.instagramUrl}
                  onChangeText={(text) => setArtistForm({ ...artistForm, instagramUrl: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />

                <Pressable
                  onPress={handleCreateArtist}
                  className="bg-pink-600 py-4 rounded-xl mt-4 mb-4"
                >
                  <Text className="text-white text-center font-bold">Create Artist</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>

    {/* Edit Artist Modal */}
    <Modal visible={showEditArtist} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={10}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-[#151520] rounded-t-3xl p-6 max-h-[85%]">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">Edit Artist</Text>
                <Pressable onPress={() => setShowEditArtist(false)}>
                  <Ionicons name="close" size={28} color="white" />
                </Pressable>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <TextInput
                  placeholder="Real Name"
                  placeholderTextColor="#6B7280"
                  value={artistForm.name}
                  onChangeText={(text) => setArtistForm({ ...artistForm, name: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="Stage Name"
                  placeholderTextColor="#6B7280"
                  value={artistForm.stageName}
                  onChangeText={(text) => setArtistForm({ ...artistForm, stageName: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="Genre"
                  placeholderTextColor="#6B7280"
                  value={artistForm.genre}
                  onChangeText={(text) => setArtistForm({ ...artistForm, genre: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="Avatar URL"
                  placeholderTextColor="#6B7280"
                  value={artistForm.avatar}
                  onChangeText={(text) => setArtistForm({ ...artistForm, avatar: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="Bio"
                  placeholderTextColor="#6B7280"
                  value={artistForm.bio}
                  onChangeText={(text) => setArtistForm({ ...artistForm, bio: text })}
                  multiline
                  numberOfLines={3}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  style={{ minHeight: 80, textAlignVertical: "top" }}
                />
                <TextInput
                  placeholder="Referral Code"
                  placeholderTextColor="#6B7280"
                  value={artistForm.referralCode}
                  onChangeText={(text) => setArtistForm({ ...artistForm, referralCode: text.toUpperCase() })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />

                {/* Music Platform URLs */}
                <Text className="text-white font-bold mb-2 mt-2">Music Platforms</Text>
                <TextInput
                  placeholder="Spotify URL"
                  placeholderTextColor="#6B7280"
                  value={artistForm.spotifyUrl}
                  onChangeText={(text) => setArtistForm({ ...artistForm, spotifyUrl: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="Apple Music URL"
                  placeholderTextColor="#6B7280"
                  value={artistForm.appleMusicUrl}
                  onChangeText={(text) => setArtistForm({ ...artistForm, appleMusicUrl: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="SoundCloud URL"
                  placeholderTextColor="#6B7280"
                  value={artistForm.soundcloudUrl}
                  onChangeText={(text) => setArtistForm({ ...artistForm, soundcloudUrl: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="Instagram URL"
                  placeholderTextColor="#6B7280"
                  value={artistForm.instagramUrl}
                  onChangeText={(text) => setArtistForm({ ...artistForm, instagramUrl: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />

                <Pressable
                  onPress={handleEditArtist}
                  className="bg-blue-600 py-4 rounded-xl mt-4 mb-4"
                >
                  <Text className="text-white text-center font-bold">Save Changes</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>

    {/* Set Artist Password Modal */}
    <Modal visible={showSetArtistPassword} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={10}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-[#151520] rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">Set Login Credentials</Text>
                <Pressable onPress={() => setShowSetArtistPassword(false)}>
                  <Ionicons name="close" size={28} color="white" />
                </Pressable>
              </View>

              {selectedArtist && (
                <View className="mb-6">
                  <Text className="text-gray-400 text-sm">Artist</Text>
                  <Text className="text-white font-bold">{selectedArtist.stageName}</Text>
                  <Text className="text-gray-400">@{selectedArtist.name}</Text>
                </View>
              )}

              <TextInput
                placeholder="Email for login"
                placeholderTextColor="#6B7280"
                value={artistEmail}
                onChangeText={setArtistEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
              />

              <TextInput
                placeholder="Password"
                placeholderTextColor="#6B7280"
                value={artistPassword}
                onChangeText={setArtistPassword}
                secureTextEntry
                className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
              />

              <Pressable
                onPress={handleSetArtistPassword}
                className="bg-pink-600 py-4 rounded-xl"
              >
                <Text className="text-white text-center font-bold">Set Login Credentials</Text>
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>

    {/* Manage Music Modal */}
    <Modal visible={showManageMusic} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-[#151520] rounded-t-3xl p-6 max-h-[85%]">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-xl font-bold">Manage Music</Text>
            <Pressable onPress={() => {
              setShowManageMusic(false);
              setSelectedArtist(null);
            }}>
              <Ionicons name="close" size={28} color="white" />
            </Pressable>
          </View>

          {selectedArtist && (
            <>
              <View className="flex-row items-center mb-4 bg-[#0A0A0F] p-3 rounded-xl">
                {selectedArtist.avatar ? (
                  <Image
                    source={{ uri: selectedArtist.avatar }}
                    style={{ width: 48, height: 48, borderRadius: 24 }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="w-12 h-12 rounded-full bg-pink-600 items-center justify-center">
                    <Text className="text-white font-bold">{selectedArtist.stageName[0]}</Text>
                  </View>
                )}
                <View className="ml-3">
                  <Text className="text-white font-bold">{selectedArtist.stageName}</Text>
                  <Text className="text-gray-400 text-sm">{selectedArtist.tracks.length} tracks</Text>
                </View>
              </View>

              <Pressable
                onPress={() => {
                  resetTrackForm();
                  setShowAddTrack(true);
                }}
                className="bg-pink-600 py-3 rounded-xl mb-4 flex-row items-center justify-center"
              >
                <Ionicons name="add-circle" size={20} color="white" />
                <Text className="text-white font-bold ml-2">Add New Track</Text>
              </Pressable>

              <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
                {selectedArtist.tracks.length === 0 ? (
                  <View className="items-center py-8">
                    <Ionicons name="musical-notes-outline" size={48} color="#4B5563" />
                    <Text className="text-gray-400 mt-3">No tracks yet</Text>
                    <Text className="text-gray-600 text-xs">Add your first track to get started</Text>
                  </View>
                ) : (
                  selectedArtist.tracks.map((track, index) => (
                    <View
                      key={`manage-track-${track.id}-${index}`}
                      className="bg-[#0A0A0F] p-3 rounded-xl mb-3 border border-gray-800"
                    >
                      <View className="flex-row items-center">
                        {track.coverArt ? (
                          <Image
                            source={{ uri: track.coverArt }}
                            style={{ width: 48, height: 48, borderRadius: 8 }}
                            contentFit="cover"
                          />
                        ) : (
                          <View className="w-12 h-12 rounded-lg bg-purple-600 items-center justify-center">
                            <Ionicons name="musical-note" size={24} color="white" />
                          </View>
                        )}
                        <View className="ml-3 flex-1">
                          <View className="flex-row items-center">
                            <Text className="text-white font-bold" numberOfLines={1}>{track.title}</Text>
                            {track.isHot && (
                              <Ionicons name="flame" size={14} color="#F97316" style={{ marginLeft: 4 }} />
                            )}
                          </View>
                          <View className="flex-row items-center mt-1">
                            <Ionicons name="play" size={12} color="#A855F7" />
                            <Text className="text-gray-400 text-xs ml-1">{track.playCount}</Text>
                            <Text className="text-gray-600 mx-2">|</Text>
                            <Text className="text-gray-400 text-xs">{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, "0")}</Text>
                            {track.price && (
                              <>
                                <Text className="text-gray-600 mx-2">|</Text>
                                <Text className="text-green-400 text-xs">${track.price}</Text>
                              </>
                            )}
                          </View>
                        </View>
                      </View>
                      <View className="flex-row mt-3">
                        <Pressable
                          onPress={() => openEditTrack(track)}
                          className="flex-1 bg-blue-600/20 py-2 rounded-lg mr-2 flex-row items-center justify-center"
                        >
                          <Ionicons name="create-outline" size={14} color="#3B82F6" />
                          <Text className="text-blue-400 text-xs font-bold ml-1">Edit</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleDeleteTrack(track.id)}
                          className="bg-red-600/20 py-2 px-4 rounded-lg flex-row items-center justify-center"
                        >
                          <Ionicons name="trash-outline" size={14} color="#EF4444" />
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>

    {/* Add Track Modal */}
    <Modal visible={showAddTrack} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={10}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-[#151520] rounded-t-3xl p-6 max-h-[85%]">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">Add New Track</Text>
                <Pressable onPress={() => {
                  setShowAddTrack(false);
                  resetTrackForm();
                }}>
                  <Ionicons name="close" size={28} color="white" />
                </Pressable>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <TextInput
                  placeholder="Track Title *"
                  placeholderTextColor="#6B7280"
                  value={trackForm.title}
                  onChangeText={(text) => setTrackForm({ ...trackForm, title: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />

                {/* Audio Upload Section */}
                <Text className="text-gray-400 text-xs mb-2 font-semibold">AUDIO FILE *</Text>
                <View className="flex-row mb-4">
                  <Pressable
                    onPress={handlePickAudioFile}
                    className="flex-1 bg-pink-600 py-3 rounded-xl mr-2 flex-row items-center justify-center"
                  >
                    <Ionicons name="cloud-upload" size={20} color="white" />
                    <Text className="text-white font-bold ml-2">Upload Song</Text>
                  </Pressable>
                </View>
                {trackForm.audioUrl ? (
                  <View className="bg-[#0A0A0F] px-4 py-3 rounded-xl mb-4 flex-row items-center">
                    <Ionicons name="musical-note" size={20} color="#EC4899" />
                    <Text className="text-green-400 text-sm ml-2 flex-1" numberOfLines={1}>
                      {trackForm.audioUrl.includes("/") ? trackForm.audioUrl.split("/").pop() : "Audio selected"}
                    </Text>
                    <Pressable onPress={() => setTrackForm({ ...trackForm, audioUrl: "" })}>
                      <Ionicons name="close-circle" size={20} color="#6B7280" />
                    </Pressable>
                  </View>
                ) : (
                  <TextInput
                    placeholder="Or paste Audio URL"
                    placeholderTextColor="#6B7280"
                    value={trackForm.audioUrl}
                    onChangeText={(text) => setTrackForm({ ...trackForm, audioUrl: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />
                )}

                {/* Cover Art Upload Section */}
                <Text className="text-gray-400 text-xs mb-2 font-semibold">COVER ART</Text>
                <View className="flex-row mb-4">
                  <Pressable
                    onPress={handlePickCoverArt}
                    className="flex-1 bg-purple-600 py-3 rounded-xl mr-2 flex-row items-center justify-center"
                  >
                    <Ionicons name="image" size={20} color="white" />
                    <Text className="text-white font-bold ml-2">Upload Cover</Text>
                  </Pressable>
                </View>
                {trackForm.coverArt ? (
                  <View className="bg-[#0A0A0F] px-4 py-3 rounded-xl mb-4 flex-row items-center">
                    <Image
                      source={{ uri: trackForm.coverArt }}
                      style={{ width: 40, height: 40, borderRadius: 8 }}
                      contentFit="cover"
                    />
                    <Text className="text-green-400 text-sm ml-3 flex-1" numberOfLines={1}>Cover selected</Text>
                    <Pressable onPress={() => setTrackForm({ ...trackForm, coverArt: "" })}>
                      <Ionicons name="close-circle" size={20} color="#6B7280" />
                    </Pressable>
                  </View>
                ) : (
                  <TextInput
                    placeholder="Or paste Cover Art URL (optional)"
                    placeholderTextColor="#6B7280"
                    value={trackForm.coverArt}
                    onChangeText={(text) => setTrackForm({ ...trackForm, coverArt: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />
                )}

                <TextInput
                  placeholder="Duration in seconds (e.g., 180)"
                  placeholderTextColor="#6B7280"
                  value={trackForm.duration}
                  onChangeText={(text) => setTrackForm({ ...trackForm, duration: text })}
                  keyboardType="numeric"
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="Price (leave empty for free)"
                  placeholderTextColor="#6B7280"
                  value={trackForm.price}
                  onChangeText={(text) => setTrackForm({ ...trackForm, price: text })}
                  keyboardType="decimal-pad"
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />

                <View className="flex-row items-center justify-between bg-[#0A0A0F] px-4 py-3 rounded-xl mb-4">
                  <Text className="text-white">Snippet Only</Text>
                  <Pressable
                    onPress={() => setTrackForm({ ...trackForm, isSnippetOnly: !trackForm.isSnippetOnly })}
                    className={`w-12 h-6 rounded-full ${trackForm.isSnippetOnly ? "bg-pink-600" : "bg-gray-600"} justify-center`}
                  >
                    <View className={`w-5 h-5 rounded-full bg-white ${trackForm.isSnippetOnly ? "ml-6" : "ml-0.5"}`} />
                  </Pressable>
                </View>

                {trackForm.isSnippetOnly && (
                  <TextInput
                    placeholder="Snippet Duration (seconds)"
                    placeholderTextColor="#6B7280"
                    value={trackForm.snippetDuration}
                    onChangeText={(text) => setTrackForm({ ...trackForm, snippetDuration: text })}
                    keyboardType="numeric"
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />
                )}

                <Pressable
                  onPress={handleAddTrack}
                  className="bg-pink-600 py-4 rounded-xl mt-2 mb-4"
                >
                  <Text className="text-white text-center font-bold">Add Track</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>

    {/* Edit Track Modal */}
    <Modal visible={showEditTrack} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={10}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-[#151520] rounded-t-3xl p-6 max-h-[85%]">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">Edit Track</Text>
                <Pressable onPress={() => {
                  setShowEditTrack(false);
                  setSelectedTrack(null);
                  resetTrackForm();
                }}>
                  <Ionicons name="close" size={28} color="white" />
                </Pressable>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <TextInput
                  placeholder="Track Title *"
                  placeholderTextColor="#6B7280"
                  value={trackForm.title}
                  onChangeText={(text) => setTrackForm({ ...trackForm, title: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />

                {/* Audio Upload Section */}
                <Text className="text-gray-400 text-xs mb-2 font-semibold">AUDIO FILE</Text>
                <View className="flex-row mb-4">
                  <Pressable
                    onPress={handlePickAudioFile}
                    className="flex-1 bg-pink-600 py-3 rounded-xl mr-2 flex-row items-center justify-center"
                  >
                    <Ionicons name="cloud-upload" size={20} color="white" />
                    <Text className="text-white font-bold ml-2">Upload Song</Text>
                  </Pressable>
                </View>
                {trackForm.audioUrl ? (
                  <View className="bg-[#0A0A0F] px-4 py-3 rounded-xl mb-4 flex-row items-center">
                    <Ionicons name="musical-note" size={20} color="#EC4899" />
                    <Text className="text-green-400 text-sm ml-2 flex-1" numberOfLines={1}>
                      {trackForm.audioUrl.includes("/") ? trackForm.audioUrl.split("/").pop() : "Audio selected"}
                    </Text>
                    <Pressable onPress={() => setTrackForm({ ...trackForm, audioUrl: "" })}>
                      <Ionicons name="close-circle" size={20} color="#6B7280" />
                    </Pressable>
                  </View>
                ) : (
                  <TextInput
                    placeholder="Or paste Audio URL"
                    placeholderTextColor="#6B7280"
                    value={trackForm.audioUrl}
                    onChangeText={(text) => setTrackForm({ ...trackForm, audioUrl: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />
                )}

                {/* Cover Art Upload Section */}
                <Text className="text-gray-400 text-xs mb-2 font-semibold">COVER ART</Text>
                <View className="flex-row mb-4">
                  <Pressable
                    onPress={handlePickCoverArt}
                    className="flex-1 bg-purple-600 py-3 rounded-xl mr-2 flex-row items-center justify-center"
                  >
                    <Ionicons name="image" size={20} color="white" />
                    <Text className="text-white font-bold ml-2">Upload Cover</Text>
                  </Pressable>
                </View>
                {trackForm.coverArt ? (
                  <View className="bg-[#0A0A0F] px-4 py-3 rounded-xl mb-4 flex-row items-center">
                    <Image
                      source={{ uri: trackForm.coverArt }}
                      style={{ width: 40, height: 40, borderRadius: 8 }}
                      contentFit="cover"
                    />
                    <Text className="text-green-400 text-sm ml-3 flex-1" numberOfLines={1}>Cover selected</Text>
                    <Pressable onPress={() => setTrackForm({ ...trackForm, coverArt: "" })}>
                      <Ionicons name="close-circle" size={20} color="#6B7280" />
                    </Pressable>
                  </View>
                ) : (
                  <TextInput
                    placeholder="Or paste Cover Art URL"
                    placeholderTextColor="#6B7280"
                    value={trackForm.coverArt}
                    onChangeText={(text) => setTrackForm({ ...trackForm, coverArt: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />
                )}

                <TextInput
                  placeholder="Duration in seconds"
                  placeholderTextColor="#6B7280"
                  value={trackForm.duration}
                  onChangeText={(text) => setTrackForm({ ...trackForm, duration: text })}
                  keyboardType="numeric"
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="Price (leave empty for free)"
                  placeholderTextColor="#6B7280"
                  value={trackForm.price}
                  onChangeText={(text) => setTrackForm({ ...trackForm, price: text })}
                  keyboardType="decimal-pad"
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />

                <View className="flex-row items-center justify-between bg-[#0A0A0F] px-4 py-3 rounded-xl mb-4">
                  <Text className="text-white">Snippet Only</Text>
                  <Pressable
                    onPress={() => setTrackForm({ ...trackForm, isSnippetOnly: !trackForm.isSnippetOnly })}
                    className={`w-12 h-6 rounded-full ${trackForm.isSnippetOnly ? "bg-pink-600" : "bg-gray-600"} justify-center`}
                  >
                    <View className={`w-5 h-5 rounded-full bg-white ${trackForm.isSnippetOnly ? "ml-6" : "ml-0.5"}`} />
                  </Pressable>
                </View>

                {trackForm.isSnippetOnly && (
                  <TextInput
                    placeholder="Snippet Duration (seconds)"
                    placeholderTextColor="#6B7280"
                    value={trackForm.snippetDuration}
                    onChangeText={(text) => setTrackForm({ ...trackForm, snippetDuration: text })}
                    keyboardType="numeric"
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />
                )}

                <Pressable
                  onPress={handleEditTrack}
                  className="bg-blue-600 py-4 rounded-xl mt-2 mb-4"
                >
                  <Text className="text-white text-center font-bold">Save Changes</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>

    {/* Admin Music Modal */}
    <Modal visible={showAdminMusic} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-[#151520] rounded-t-3xl p-6 max-h-[85%]">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-xl font-bold">Admin Music Studio</Text>
            <Pressable onPress={() => setShowAdminMusic(false)}>
              <Ionicons name="close" size={28} color="white" />
            </Pressable>
          </View>

          {/* Admin Artist Info - Synced with admin profile */}
          <View className="flex-row items-center mb-4 bg-[#0A0A0F] p-3 rounded-xl">
            {(adminArtist?.avatar || user?.avatar) ? (
              <Image
                source={{ uri: adminArtist?.avatar || user?.avatar }}
                style={{ width: 48, height: 48, borderRadius: 24 }}
                contentFit="cover"
              />
            ) : (
              <View className="w-12 h-12 rounded-full bg-purple-600 items-center justify-center">
                <Ionicons name="shield-checkmark" size={24} color="white" />
              </View>
            )}
            <View className="ml-3 flex-1">
              <View className="flex-row items-center">
                <Text className="text-white font-bold">{adminArtist?.stageName || user?.username || "Admin"}</Text>
                <View className="ml-1.5 bg-purple-500 rounded-full p-0.5">
                  <Ionicons name="checkmark" size={10} color="white" />
                </View>
              </View>
              <Text className="text-gray-400 text-sm">{adminArtist?.tracks?.length || 0} tracks uploaded</Text>
            </View>
            <Pressable
              onPress={() => {
                ensureAdminArtist();
                setShowAdminMusic(false);
                setTimeout(() => navigation.navigate("ArtistProfile", { artistId: ADMIN_ARTIST_ID }), 300);
              }}
              className="bg-purple-600/20 px-3 py-2 rounded-lg mr-2"
            >
              <Ionicons name="eye-outline" size={18} color="#8B5CF6" />
            </Pressable>
            <Pressable
              onPress={openEditAdminArtist}
              className="bg-gray-700 px-3 py-2 rounded-lg"
            >
              <Ionicons name="settings-outline" size={18} color="white" />
            </Pressable>
          </View>

          {/* Add Track Button */}
          <Pressable
            onPress={() => {
              ensureAdminArtist();
              resetAdminTrackForm();
              setShowAdminMusic(false);
              setTimeout(() => setShowAddAdminTrack(true), 300);
            }}
            className="bg-purple-600 py-3 rounded-xl mb-4 flex-row items-center justify-center"
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text className="text-white font-bold ml-2">Upload New Track</Text>
          </Pressable>

          {/* Tracks List */}
          <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
            {(!adminArtist || adminArtist.tracks.length === 0) ? (
              <View className="items-center py-8">
                <Ionicons name="musical-notes-outline" size={48} color="#4B5563" />
                <Text className="text-gray-400 mt-3">No tracks yet</Text>
                <Text className="text-gray-600 text-xs">Upload your first track to get started</Text>
              </View>
            ) : (
              adminArtist.tracks.map((track, index) => (
                <View
                  key={`admin-track-${track.id}-${index}`}
                  className="bg-[#0A0A0F] p-3 rounded-xl mb-3 border border-gray-800"
                >
                  <View className="flex-row items-center">
                    {track.coverArt ? (
                      <Image
                        source={{ uri: track.coverArt }}
                        style={{ width: 48, height: 48, borderRadius: 8 }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="w-12 h-12 rounded-lg bg-purple-600 items-center justify-center">
                        <Ionicons name="musical-note" size={24} color="white" />
                      </View>
                    )}
                    <View className="ml-3 flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-white font-bold" numberOfLines={1}>{track.title}</Text>
                        {track.isHot && (
                          <Ionicons name="flame" size={14} color="#F97316" style={{ marginLeft: 4 }} />
                        )}
                      </View>
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="play" size={12} color="#A855F7" />
                        <Text className="text-gray-400 text-xs ml-1">{track.playCount}</Text>
                        <Text className="text-gray-600 mx-2">|</Text>
                        <Text className="text-gray-400 text-xs">{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, "0")}</Text>
                        {track.price && (
                          <>
                            <Text className="text-gray-600 mx-2">|</Text>
                            <Text className="text-green-400 text-xs">${track.price}</Text>
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                  <View className="flex-row mt-3">
                    <Pressable
                      onPress={() => openEditAdminTrack(track)}
                      className="flex-1 bg-blue-600/20 py-2 rounded-lg mr-2 flex-row items-center justify-center"
                    >
                      <Ionicons name="create-outline" size={14} color="#3B82F6" />
                      <Text className="text-blue-400 text-xs font-bold ml-1">Edit</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeleteAdminTrack(track.id)}
                      className="bg-red-600/20 py-2 px-4 rounded-lg flex-row items-center justify-center"
                    >
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>

    {/* Add Admin Track Modal */}
    <Modal visible={showAddAdminTrack} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={10}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-[#151520] rounded-t-3xl p-6 max-h-[85%]">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">Upload Admin Track</Text>
                <Pressable onPress={() => {
                  setShowAddAdminTrack(false);
                  resetAdminTrackForm();
                }}>
                  <Ionicons name="close" size={28} color="white" />
                </Pressable>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <TextInput
                  placeholder="Track Title *"
                  placeholderTextColor="#6B7280"
                  value={adminTrackForm.title}
                  onChangeText={(text) => setAdminTrackForm({ ...adminTrackForm, title: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />

                {/* Audio Upload Section */}
                <Text className="text-gray-400 text-xs mb-2 font-semibold">AUDIO FILE *</Text>
                <View className="flex-row mb-4">
                  <Pressable
                    onPress={handlePickAdminAudioFile}
                    className="flex-1 bg-purple-600 py-3 rounded-xl mr-2 flex-row items-center justify-center"
                  >
                    <Ionicons name="cloud-upload" size={20} color="white" />
                    <Text className="text-white font-bold ml-2">Upload Song</Text>
                  </Pressable>
                </View>
                {adminTrackForm.audioUrl ? (
                  <View className="bg-[#0A0A0F] px-4 py-3 rounded-xl mb-4 flex-row items-center">
                    <Ionicons name="musical-note" size={20} color="#A855F7" />
                    <Text className="text-green-400 text-sm ml-2 flex-1" numberOfLines={1}>
                      {adminTrackForm.audioUrl.includes("/") ? adminTrackForm.audioUrl.split("/").pop() : "Audio selected"}
                    </Text>
                    <Pressable onPress={() => setAdminTrackForm({ ...adminTrackForm, audioUrl: "" })}>
                      <Ionicons name="close-circle" size={20} color="#6B7280" />
                    </Pressable>
                  </View>
                ) : (
                  <TextInput
                    placeholder="Or paste Audio URL"
                    placeholderTextColor="#6B7280"
                    value={adminTrackForm.audioUrl}
                    onChangeText={(text) => setAdminTrackForm({ ...adminTrackForm, audioUrl: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />
                )}

                {/* Cover Art Upload Section */}
                <Text className="text-gray-400 text-xs mb-2 font-semibold">COVER ART</Text>
                <View className="flex-row mb-4">
                  <Pressable
                    onPress={handlePickAdminCoverArt}
                    className="flex-1 bg-pink-600 py-3 rounded-xl mr-2 flex-row items-center justify-center"
                  >
                    <Ionicons name="image" size={20} color="white" />
                    <Text className="text-white font-bold ml-2">Upload Cover</Text>
                  </Pressable>
                </View>
                {adminTrackForm.coverArt ? (
                  <View className="bg-[#0A0A0F] px-4 py-3 rounded-xl mb-4 flex-row items-center">
                    <Image
                      source={{ uri: adminTrackForm.coverArt }}
                      style={{ width: 40, height: 40, borderRadius: 8 }}
                      contentFit="cover"
                    />
                    <Text className="text-green-400 text-sm ml-3 flex-1" numberOfLines={1}>Cover selected</Text>
                    <Pressable onPress={() => setAdminTrackForm({ ...adminTrackForm, coverArt: "" })}>
                      <Ionicons name="close-circle" size={20} color="#6B7280" />
                    </Pressable>
                  </View>
                ) : (
                  <TextInput
                    placeholder="Or paste Cover Art URL (optional)"
                    placeholderTextColor="#6B7280"
                    value={adminTrackForm.coverArt}
                    onChangeText={(text) => setAdminTrackForm({ ...adminTrackForm, coverArt: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />
                )}

                <TextInput
                  placeholder="Duration in seconds (e.g., 180)"
                  placeholderTextColor="#6B7280"
                  value={adminTrackForm.duration}
                  onChangeText={(text) => setAdminTrackForm({ ...adminTrackForm, duration: text })}
                  keyboardType="numeric"
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="Price (leave empty for free)"
                  placeholderTextColor="#6B7280"
                  value={adminTrackForm.price}
                  onChangeText={(text) => setAdminTrackForm({ ...adminTrackForm, price: text })}
                  keyboardType="decimal-pad"
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />

                <View className="flex-row items-center justify-between bg-[#0A0A0F] px-4 py-3 rounded-xl mb-4">
                  <Text className="text-white">Snippet Only</Text>
                  <Pressable
                    onPress={() => setAdminTrackForm({ ...adminTrackForm, isSnippetOnly: !adminTrackForm.isSnippetOnly })}
                    className={`w-12 h-6 rounded-full ${adminTrackForm.isSnippetOnly ? "bg-purple-600" : "bg-gray-600"} justify-center`}
                  >
                    <View className={`w-5 h-5 rounded-full bg-white ${adminTrackForm.isSnippetOnly ? "ml-6" : "ml-0.5"}`} />
                  </Pressable>
                </View>

                {adminTrackForm.isSnippetOnly && (
                  <TextInput
                    placeholder="Snippet Duration (seconds)"
                    placeholderTextColor="#6B7280"
                    value={adminTrackForm.snippetDuration}
                    onChangeText={(text) => setAdminTrackForm({ ...adminTrackForm, snippetDuration: text })}
                    keyboardType="numeric"
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />
                )}

                <Pressable
                  onPress={handleAddAdminTrack}
                  className="bg-purple-600 py-4 rounded-xl mt-2 mb-4"
                >
                  <Text className="text-white text-center font-bold">Upload Track</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>

    {/* Edit Admin Track Modal */}
    <Modal visible={showEditAdminTrack} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={10}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-[#151520] rounded-t-3xl p-6 max-h-[85%]">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">Edit Admin Track</Text>
                <Pressable onPress={() => {
                  setShowEditAdminTrack(false);
                  setSelectedTrack(null);
                  resetAdminTrackForm();
                }}>
                  <Ionicons name="close" size={28} color="white" />
                </Pressable>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <TextInput
                  placeholder="Track Title *"
                  placeholderTextColor="#6B7280"
                  value={adminTrackForm.title}
                  onChangeText={(text) => setAdminTrackForm({ ...adminTrackForm, title: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />

                {/* Audio Upload Section */}
                <Text className="text-gray-400 text-xs mb-2 font-semibold">AUDIO FILE</Text>
                <View className="flex-row mb-4">
                  <Pressable
                    onPress={handlePickAdminAudioFile}
                    className="flex-1 bg-purple-600 py-3 rounded-xl mr-2 flex-row items-center justify-center"
                  >
                    <Ionicons name="cloud-upload" size={20} color="white" />
                    <Text className="text-white font-bold ml-2">Upload Song</Text>
                  </Pressable>
                </View>
                {adminTrackForm.audioUrl ? (
                  <View className="bg-[#0A0A0F] px-4 py-3 rounded-xl mb-4 flex-row items-center">
                    <Ionicons name="musical-note" size={20} color="#A855F7" />
                    <Text className="text-green-400 text-sm ml-2 flex-1" numberOfLines={1}>
                      {adminTrackForm.audioUrl.includes("/") ? adminTrackForm.audioUrl.split("/").pop() : "Audio selected"}
                    </Text>
                    <Pressable onPress={() => setAdminTrackForm({ ...adminTrackForm, audioUrl: "" })}>
                      <Ionicons name="close-circle" size={20} color="#6B7280" />
                    </Pressable>
                  </View>
                ) : (
                  <TextInput
                    placeholder="Or paste Audio URL"
                    placeholderTextColor="#6B7280"
                    value={adminTrackForm.audioUrl}
                    onChangeText={(text) => setAdminTrackForm({ ...adminTrackForm, audioUrl: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />
                )}

                {/* Cover Art Upload Section */}
                <Text className="text-gray-400 text-xs mb-2 font-semibold">COVER ART</Text>
                <View className="flex-row mb-4">
                  <Pressable
                    onPress={handlePickAdminCoverArt}
                    className="flex-1 bg-pink-600 py-3 rounded-xl mr-2 flex-row items-center justify-center"
                  >
                    <Ionicons name="image" size={20} color="white" />
                    <Text className="text-white font-bold ml-2">Upload Cover</Text>
                  </Pressable>
                </View>
                {adminTrackForm.coverArt ? (
                  <View className="bg-[#0A0A0F] px-4 py-3 rounded-xl mb-4 flex-row items-center">
                    <Image
                      source={{ uri: adminTrackForm.coverArt }}
                      style={{ width: 40, height: 40, borderRadius: 8 }}
                      contentFit="cover"
                    />
                    <Text className="text-green-400 text-sm ml-3 flex-1" numberOfLines={1}>Cover selected</Text>
                    <Pressable onPress={() => setAdminTrackForm({ ...adminTrackForm, coverArt: "" })}>
                      <Ionicons name="close-circle" size={20} color="#6B7280" />
                    </Pressable>
                  </View>
                ) : (
                  <TextInput
                    placeholder="Or paste Cover Art URL"
                    placeholderTextColor="#6B7280"
                    value={adminTrackForm.coverArt}
                    onChangeText={(text) => setAdminTrackForm({ ...adminTrackForm, coverArt: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />
                )}

                <TextInput
                  placeholder="Duration in seconds"
                  placeholderTextColor="#6B7280"
                  value={adminTrackForm.duration}
                  onChangeText={(text) => setAdminTrackForm({ ...adminTrackForm, duration: text })}
                  keyboardType="numeric"
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />
                <TextInput
                  placeholder="Price (leave empty for free)"
                  placeholderTextColor="#6B7280"
                  value={adminTrackForm.price}
                  onChangeText={(text) => setAdminTrackForm({ ...adminTrackForm, price: text })}
                  keyboardType="decimal-pad"
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />

                <View className="flex-row items-center justify-between bg-[#0A0A0F] px-4 py-3 rounded-xl mb-4">
                  <Text className="text-white">Snippet Only</Text>
                  <Pressable
                    onPress={() => setAdminTrackForm({ ...adminTrackForm, isSnippetOnly: !adminTrackForm.isSnippetOnly })}
                    className={`w-12 h-6 rounded-full ${adminTrackForm.isSnippetOnly ? "bg-purple-600" : "bg-gray-600"} justify-center`}
                  >
                    <View className={`w-5 h-5 rounded-full bg-white ${adminTrackForm.isSnippetOnly ? "ml-6" : "ml-0.5"}`} />
                  </Pressable>
                </View>

                {adminTrackForm.isSnippetOnly && (
                  <TextInput
                    placeholder="Snippet Duration (seconds)"
                    placeholderTextColor="#6B7280"
                    value={adminTrackForm.snippetDuration}
                    onChangeText={(text) => setAdminTrackForm({ ...adminTrackForm, snippetDuration: text })}
                    keyboardType="numeric"
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />
                )}

                <Pressable
                  onPress={handleEditAdminTrack}
                  className="bg-blue-600 py-4 rounded-xl mt-2 mb-4"
                >
                  <Text className="text-white text-center font-bold">Save Changes</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>

    {/* Edit Admin Artist Profile Modal */}
    <Modal visible={showEditAdminArtist} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={10}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-[#151520] rounded-t-3xl p-6 max-h-[85%]">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">Edit Artist Profile</Text>
                <Pressable onPress={() => setShowEditAdminArtist(false)}>
                  <Ionicons name="close" size={28} color="white" />
                </Pressable>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <TextInput
                  placeholder="Stage Name *"
                  placeholderTextColor="#6B7280"
                  value={adminArtistForm.stageName}
                  onChangeText={(text) => setAdminArtistForm({ ...adminArtistForm, stageName: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />

                <TextInput
                  placeholder="Bio"
                  placeholderTextColor="#6B7280"
                  value={adminArtistForm.bio}
                  onChangeText={(text) => setAdminArtistForm({ ...adminArtistForm, bio: text })}
                  multiline
                  numberOfLines={3}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  style={{ textAlignVertical: "top", minHeight: 80 }}
                />

                <TextInput
                  placeholder="Genre (e.g., Hip-Hop, R&B, Pop)"
                  placeholderTextColor="#6B7280"
                  value={adminArtistForm.genre}
                  onChangeText={(text) => setAdminArtistForm({ ...adminArtistForm, genre: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />

                <Text className="text-gray-400 text-xs mb-2 font-semibold">MUSIC PLATFORM LINKS</Text>

                <View className="flex-row items-center bg-[#0A0A0F] px-4 py-3 rounded-xl mb-3">
                  <View className="w-5 h-5 rounded-full bg-[#1DB954] items-center justify-center">
                    <Text className="text-white text-xs font-bold">S</Text>
                  </View>
                  <TextInput
                    placeholder="Spotify Profile URL"
                    placeholderTextColor="#6B7280"
                    value={adminArtistForm.spotifyUrl}
                    onChangeText={(text) => setAdminArtistForm({ ...adminArtistForm, spotifyUrl: text })}
                    className="flex-1 text-white ml-3"
                  />
                </View>

                <View className="flex-row items-center bg-[#0A0A0F] px-4 py-3 rounded-xl mb-3">
                  <View className="w-5 h-5 rounded-full bg-[#FC3C44] items-center justify-center">
                    <Ionicons name="musical-note" size={12} color="white" />
                  </View>
                  <TextInput
                    placeholder="Apple Music URL"
                    placeholderTextColor="#6B7280"
                    value={adminArtistForm.appleMusicUrl}
                    onChangeText={(text) => setAdminArtistForm({ ...adminArtistForm, appleMusicUrl: text })}
                    className="flex-1 text-white ml-3"
                  />
                </View>

                <View className="flex-row items-center bg-[#0A0A0F] px-4 py-3 rounded-xl mb-3">
                  <View className="w-5 h-5 rounded-full bg-[#FF5500] items-center justify-center">
                    <Ionicons name="cloud" size={12} color="white" />
                  </View>
                  <TextInput
                    placeholder="SoundCloud URL"
                    placeholderTextColor="#6B7280"
                    value={adminArtistForm.soundCloudUrl}
                    onChangeText={(text) => setAdminArtistForm({ ...adminArtistForm, soundCloudUrl: text })}
                    className="flex-1 text-white ml-3"
                  />
                </View>

                <View className="flex-row items-center bg-[#0A0A0F] px-4 py-3 rounded-xl mb-4">
                  <Ionicons name="logo-instagram" size={20} color="#E4405F" />
                  <TextInput
                    placeholder="Instagram URL"
                    placeholderTextColor="#6B7280"
                    value={adminArtistForm.instagramUrl}
                    onChangeText={(text) => setAdminArtistForm({ ...adminArtistForm, instagramUrl: text })}
                    className="flex-1 text-white ml-3"
                  />
                </View>

                <Pressable
                  onPress={handleSaveAdminArtist}
                  className="bg-purple-600 py-4 rounded-xl mt-2 mb-4"
                >
                  <Text className="text-white text-center font-bold">Save Profile</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>

    {/* Create User Modal */}
    <Modal visible={showCreateUser} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={10}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-[#151520] rounded-t-3xl p-6 max-h-[90%]">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">Create New User</Text>
                <Pressable onPress={() => setShowCreateUser(false)}>
                  <Ionicons name="close" size={28} color="white" />
                </Pressable>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Required Fields */}
                <Text className="text-gray-400 text-xs mb-2 font-semibold">REQUIRED FIELDS</Text>
                
                <TextInput
                  placeholder="Email *"
                  placeholderTextColor="#6B7280"
                  value={userForm.email}
                  onChangeText={(text) => setUserForm({ ...userForm, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-3"
                />

                <TextInput
                  placeholder="Username *"
                  placeholderTextColor="#6B7280"
                  value={userForm.username}
                  onChangeText={(text) => setUserForm({ ...userForm, username: text })}
                  autoCapitalize="none"
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-3"
                />

                <TextInput
                  placeholder="Password *"
                  placeholderTextColor="#6B7280"
                  value={userForm.password}
                  onChangeText={(text) => setUserForm({ ...userForm, password: text })}
                  secureTextEntry
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />

                {/* Optional Fields */}
                <Text className="text-gray-400 text-xs mb-2 font-semibold mt-2">PROFILE INFO</Text>

                <TextInput
                  placeholder="Avatar URL (optional)"
                  placeholderTextColor="#6B7280"
                  value={userForm.avatar}
                  onChangeText={(text) => setUserForm({ ...userForm, avatar: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-3"
                />

                <TextInput
                  placeholder="Bio (optional)"
                  placeholderTextColor="#6B7280"
                  value={userForm.bio}
                  onChangeText={(text) => setUserForm({ ...userForm, bio: text })}
                  multiline
                  numberOfLines={3}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-3"
                  style={{ textAlignVertical: "top", minHeight: 80 }}
                />

                <TextInput
                  placeholder="Referral Code (auto-generated if empty)"
                  placeholderTextColor="#6B7280"
                  value={userForm.referralCode}
                  onChangeText={(text) => setUserForm({ ...userForm, referralCode: text })}
                  autoCapitalize="characters"
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />

                {/* Account Settings */}
                <Text className="text-gray-400 text-xs mb-2 font-semibold">ACCOUNT SETTINGS</Text>

                {/* Tier Selection */}
                <View className="mb-3">
                  <Text className="text-gray-500 text-xs mb-2">Subscription Tier</Text>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => setUserForm({ ...userForm, tier: "free" })}
                      className={`flex-1 py-3 rounded-xl ${userForm.tier === "free" ? "bg-gray-600" : "bg-[#0A0A0F] border border-gray-700"}`}
                    >
                      <Text className={`text-center font-semibold ${userForm.tier === "free" ? "text-white" : "text-gray-400"}`}>Free</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setUserForm({ ...userForm, tier: "superfan" })}
                      className={`flex-1 py-3 rounded-xl ${userForm.tier === "superfan" ? "bg-pink-600" : "bg-[#0A0A0F] border border-gray-700"}`}
                    >
                      <Text className={`text-center font-semibold ${userForm.tier === "superfan" ? "text-white" : "text-gray-400"}`}>Superfan</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Role Selection */}
                <View className="mb-4">
                  <Text className="text-gray-500 text-xs mb-2">Account Role</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {(["user", "support", "moderator", "admin"] as const).map((role) => (
                      <Pressable
                        key={role}
                        onPress={() => setUserForm({ ...userForm, role })}
                        className={`px-4 py-2 rounded-xl ${
                          userForm.role === role 
                            ? role === "admin" ? "bg-red-600" :
                              role === "moderator" ? "bg-blue-600" :
                              role === "support" ? "bg-green-600" : "bg-gray-600"
                            : "bg-[#0A0A0F] border border-gray-700"
                        }`}
                      >
                        <Text className={`font-semibold capitalize ${userForm.role === role ? "text-white" : "text-gray-400"}`}>{role}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Badges */}
                <View className="flex-row items-center justify-between bg-[#0A0A0F] px-4 py-3 rounded-xl mb-3">
                  <View className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
                    <Text className="text-white ml-2">Verified Badge</Text>
                  </View>
                  <Pressable
                    onPress={() => setUserForm({ ...userForm, isVerified: !userForm.isVerified })}
                    className={`w-12 h-6 rounded-full ${userForm.isVerified ? "bg-purple-600" : "bg-gray-600"} justify-center`}
                  >
                    <View className={`w-5 h-5 rounded-full bg-white ${userForm.isVerified ? "ml-6" : "ml-0.5"}`} />
                  </Pressable>
                </View>

                <View className="flex-row items-center justify-between bg-[#0A0A0F] px-4 py-3 rounded-xl mb-4">
                  <View className="flex-row items-center">
                    <Ionicons name="star" size={20} color="#EC4899" />
                    <Text className="text-white ml-2">Influencer Badge</Text>
                  </View>
                  <Pressable
                    onPress={() => setUserForm({ ...userForm, isInfluencer: !userForm.isInfluencer })}
                    className={`w-12 h-6 rounded-full ${userForm.isInfluencer ? "bg-pink-600" : "bg-gray-600"} justify-center`}
                  >
                    <View className={`w-5 h-5 rounded-full bg-white ${userForm.isInfluencer ? "ml-6" : "ml-0.5"}`} />
                  </Pressable>
                </View>

                {/* Create Button */}
                <Pressable
                  onPress={handleCreateUser}
                  disabled={isLoadingUsers}
                  className={`py-4 rounded-xl mt-2 mb-4 ${isLoadingUsers ? "bg-blue-600/50" : "bg-blue-600"}`}
                >
                  {isLoadingUsers ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white text-center font-bold">Create User</Text>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>

    {/* Edit User Modal */}
    <Modal visible={showEditUser} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={10}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-[#151520] rounded-t-3xl p-6 max-h-[90%]">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">Edit User</Text>
                <Pressable onPress={() => { setShowEditUser(false); setSelectedUser(null); }}>
                  <Ionicons name="close" size={28} color="white" />
                </Pressable>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* User Info Header */}
                {selectedUser && (
                  <View className="flex-row items-center mb-4 bg-[#0A0A0F] p-3 rounded-xl">
                    {selectedUser.avatar ? (
                      <Image
                        source={{ uri: selectedUser.avatar }}
                        style={{ width: 48, height: 48, borderRadius: 24 }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="w-12 h-12 rounded-full bg-blue-600 items-center justify-center">
                        <Text className="text-white font-bold text-lg">{selectedUser.username[0]?.toUpperCase()}</Text>
                      </View>
                    )}
                    <View className="ml-3 flex-1">
                      <Text className="text-white font-bold">{selectedUser.email}</Text>
                      <Text className="text-gray-400 text-sm">ID: {selectedUser.id.slice(0, 8)}...</Text>
                    </View>
                  </View>
                )}

                {/* Editable Fields */}
                <Text className="text-gray-400 text-xs mb-2 font-semibold">PROFILE INFO</Text>

                <TextInput
                  placeholder="Username"
                  placeholderTextColor="#6B7280"
                  value={userForm.username}
                  onChangeText={(text) => setUserForm({ ...userForm, username: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-3"
                />

                <TextInput
                  placeholder="Avatar URL"
                  placeholderTextColor="#6B7280"
                  value={userForm.avatar}
                  onChangeText={(text) => setUserForm({ ...userForm, avatar: text })}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-3"
                />

                <TextInput
                  placeholder="Bio"
                  placeholderTextColor="#6B7280"
                  value={userForm.bio}
                  onChangeText={(text) => setUserForm({ ...userForm, bio: text })}
                  multiline
                  numberOfLines={3}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  style={{ textAlignVertical: "top", minHeight: 80 }}
                />

                {/* Account Settings */}
                <Text className="text-gray-400 text-xs mb-2 font-semibold">ACCOUNT SETTINGS</Text>

                {/* Tier Selection */}
                <View className="mb-3">
                  <Text className="text-gray-500 text-xs mb-2">Subscription Tier</Text>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => setUserForm({ ...userForm, tier: "free" })}
                      className={`flex-1 py-3 rounded-xl ${userForm.tier === "free" ? "bg-gray-600" : "bg-[#0A0A0F] border border-gray-700"}`}
                    >
                      <Text className={`text-center font-semibold ${userForm.tier === "free" ? "text-white" : "text-gray-400"}`}>Free</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setUserForm({ ...userForm, tier: "superfan" })}
                      className={`flex-1 py-3 rounded-xl ${userForm.tier === "superfan" ? "bg-pink-600" : "bg-[#0A0A0F] border border-gray-700"}`}
                    >
                      <Text className={`text-center font-semibold ${userForm.tier === "superfan" ? "text-white" : "text-gray-400"}`}>Superfan</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Role Selection */}
                <View className="mb-4">
                  <Text className="text-gray-500 text-xs mb-2">Account Role</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {(["user", "support", "moderator", "admin"] as const).map((role) => (
                      <Pressable
                        key={role}
                        onPress={() => setUserForm({ ...userForm, role })}
                        className={`px-4 py-2 rounded-xl ${
                          userForm.role === role 
                            ? role === "admin" ? "bg-red-600" :
                              role === "moderator" ? "bg-blue-600" :
                              role === "support" ? "bg-green-600" : "bg-gray-600"
                            : "bg-[#0A0A0F] border border-gray-700"
                        }`}
                      >
                        <Text className={`font-semibold capitalize ${userForm.role === role ? "text-white" : "text-gray-400"}`}>{role}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Badges */}
                <View className="flex-row items-center justify-between bg-[#0A0A0F] px-4 py-3 rounded-xl mb-3">
                  <View className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
                    <Text className="text-white ml-2">Verified Badge</Text>
                  </View>
                  <Pressable
                    onPress={() => setUserForm({ ...userForm, isVerified: !userForm.isVerified })}
                    className={`w-12 h-6 rounded-full ${userForm.isVerified ? "bg-purple-600" : "bg-gray-600"} justify-center`}
                  >
                    <View className={`w-5 h-5 rounded-full bg-white ${userForm.isVerified ? "ml-6" : "ml-0.5"}`} />
                  </Pressable>
                </View>

                <View className="flex-row items-center justify-between bg-[#0A0A0F] px-4 py-3 rounded-xl mb-3">
                  <View className="flex-row items-center">
                    <Ionicons name="star" size={20} color="#EC4899" />
                    <Text className="text-white ml-2">Influencer Badge</Text>
                  </View>
                  <Pressable
                    onPress={() => setUserForm({ ...userForm, isInfluencer: !userForm.isInfluencer })}
                    className={`w-12 h-6 rounded-full ${userForm.isInfluencer ? "bg-pink-600" : "bg-gray-600"} justify-center`}
                  >
                    <View className={`w-5 h-5 rounded-full bg-white ${userForm.isInfluencer ? "ml-6" : "ml-0.5"}`} />
                  </Pressable>
                </View>

                <View className="flex-row items-center justify-between bg-[#0A0A0F] px-4 py-3 rounded-xl mb-4">
                  <View className="flex-row items-center">
                    <Ionicons name="videocam" size={20} color="#EF4444" />
                    <View className="ml-2">
                      <Text className="text-white">Streamer Access</Text>
                      <Text className="text-gray-500 text-xs">Can go live & manage streams</Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => setUserForm({ ...userForm, isStreamer: !userForm.isStreamer })}
                    className={`w-12 h-6 rounded-full ${userForm.isStreamer ? "bg-red-600" : "bg-gray-600"} justify-center`}
                  >
                    <View className={`w-5 h-5 rounded-full bg-white ${userForm.isStreamer ? "ml-6" : "ml-0.5"}`} />
                  </Pressable>
                </View>

                {/* Save Button */}
                <Pressable
                  onPress={handleUpdateUser}
                  disabled={isLoadingUsers}
                  className={`py-4 rounded-xl mt-2 mb-4 ${isLoadingUsers ? "bg-blue-600/50" : "bg-blue-600"}`}
                >
                  {isLoadingUsers ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white text-center font-bold">Save Changes</Text>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  </SafeAreaView >
);
};
