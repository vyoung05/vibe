import type { Post } from "../types/post";

export const mockPosts: Post[] = [
  {
    id: "1",
    user: {
      id: "user1",
      username: "alexgaming",
      avatarUrl: "https://i.pravatar.cc/150?img=11",
    },
    imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=800&fit=crop",
    caption: "Just hit Diamond rank! The grind was worth it 💎🎮",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    likeCount: 342,
    commentCount: 28,
    isLiked: true,
    isSaved: false,
    comments: [
      {
        id: "c1",
        username: "proplayer99",
        text: "Congrats! What's your main?",
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "c2",
        username: "gamergirl",
        text: "Amazing progress! 🔥",
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "2",
    user: {
      id: "user2",
      username: "luna_streams",
      avatarUrl: "https://i.pravatar.cc/150?img=45",
    },
    imageUrl: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=800&fit=crop",
    caption: "New painting finished! What should I draw next? Drop suggestions below ✨🎨",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    likeCount: 891,
    commentCount: 67,
    isLiked: false,
    isSaved: true,
    comments: [
      {
        id: "c3",
        username: "artlover22",
        text: "This is stunning! 😍",
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "c4",
        username: "digitalartist",
        text: "Draw a dragon next!",
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "3",
    user: {
      id: "user3",
      username: "nightshade_ttv",
      avatarUrl: "https://i.pravatar.cc/150?img=33",
    },
    imageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=800&fit=crop",
    caption: "That clutch moment when your team needs you most 🎯",
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    likeCount: 1234,
    commentCount: 89,
    isLiked: true,
    isSaved: true,
    comments: [
      {
        id: "c5",
        username: "fps_master",
        text: "That aim though! 🔥",
        createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "4",
    user: {
      id: "user4",
      username: "cosplay_queen",
      avatarUrl: "https://i.pravatar.cc/150?img=24",
    },
    imageUrl: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&h=800&fit=crop",
    caption: "Finally finished my new cosplay! Took 3 months but totally worth it 🦸‍♀️✨",
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    likeCount: 2156,
    commentCount: 134,
    isLiked: false,
    isSaved: false,
    comments: [
      {
        id: "c6",
        username: "anime_fan",
        text: "This is incredible! What character?",
        createdAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "c7",
        username: "photographer_pro",
        text: "The details are amazing! 📸",
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "5",
    user: {
      id: "user5",
      username: "cybernova",
      avatarUrl: "https://i.pravatar.cc/150?img=52",
    },
    imageUrl: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&h=800&fit=crop",
    caption: "Horror game marathon tonight! Who's ready to get scared? 👻",
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
    likeCount: 567,
    commentCount: 42,
    isLiked: true,
    isSaved: false,
    comments: [
      {
        id: "c8",
        username: "horror_fan",
        text: "Can't wait! 🎃",
        createdAt: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "6",
    user: {
      id: "user6",
      username: "tech_reviewer",
      avatarUrl: "https://i.pravatar.cc/150?img=68",
    },
    imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=800&fit=crop",
    caption: "New setup reveal! Been working on this for weeks. Full specs in my bio 🖥️⚡",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    likeCount: 3421,
    commentCount: 178,
    isLiked: false,
    isSaved: true,
    comments: [
      {
        id: "c9",
        username: "pc_builder",
        text: "That cable management! 🔥",
        createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "c10",
        username: "rgb_lover",
        text: "What monitor is that?",
        createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "7",
    user: {
      id: "user7",
      username: "speedrunner_pro",
      avatarUrl: "https://i.pravatar.cc/150?img=13",
    },
    imageUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=800&fit=crop",
    caption: "New world record! 47 minutes 23 seconds. I'm literally shaking right now! 🏆⏱️",
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), // 1.5 days ago
    likeCount: 4567,
    commentCount: 256,
    isLiked: true,
    isSaved: true,
    comments: [
      {
        id: "c11",
        username: "speedrun_fan",
        text: "YOU'RE INSANE! Congrats! 🎉",
        createdAt: new Date(Date.now() - 35 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "8",
    user: {
      id: "user8",
      username: "food_gamer",
      avatarUrl: "https://i.pravatar.cc/150?img=27",
    },
    imageUrl: "https://images.unsplash.com/photo-1589241062272-c0a000072dfa?w=800&h=800&fit=crop",
    caption: "Cooking stream was a success! Made ramen from scratch 🍜😋",
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
    likeCount: 789,
    commentCount: 54,
    isLiked: false,
    isSaved: false,
    comments: [
      {
        id: "c12",
        username: "foodie123",
        text: "That looks delicious!",
        createdAt: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "9",
    user: {
      id: "user9",
      username: "music_producer",
      avatarUrl: "https://i.pravatar.cc/150?img=59",
    },
    imageUrl: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&h=800&fit=crop",
    caption: "New track dropping Friday! Been working on this one for months 🎵🔊",
    createdAt: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(), // 2.5 days ago
    likeCount: 1876,
    commentCount: 98,
    isLiked: true,
    isSaved: false,
    comments: [
      {
        id: "c13",
        username: "music_fan",
        text: "Can't wait! Your last one was fire! 🔥",
        createdAt: new Date(Date.now() - 59 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "10",
    user: {
      id: "user10",
      username: "fitness_streamer",
      avatarUrl: "https://i.pravatar.cc/150?img=41",
    },
    imageUrl: "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=800&h=800&fit=crop",
    caption: "30-day challenge complete! Feeling stronger than ever 💪✨",
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 3 days ago
    likeCount: 2341,
    commentCount: 145,
    isLiked: false,
    isSaved: true,
    comments: [
      {
        id: "c14",
        username: "gym_bro",
        text: "Beast mode! 💯",
        createdAt: new Date(Date.now() - 71 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "c15",
        username: "workout_lover",
        text: "What was your routine?",
        createdAt: new Date(Date.now() - 70 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "11",
    user: {
      id: "user11",
      username: "travel_vlogger",
      avatarUrl: "https://i.pravatar.cc/150?img=36",
    },
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800&fit=crop",
    caption: "Exploring hidden gems in Japan 🗾✈️ This view was breathtaking!",
    createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(), // 4 days ago
    likeCount: 5678,
    commentCount: 289,
    isLiked: true,
    isSaved: true,
    comments: [
      {
        id: "c16",
        username: "travel_fan",
        text: "Where is this exactly?",
        createdAt: new Date(Date.now() - 95 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "12",
    user: {
      id: "user12",
      username: "retro_gamer",
      avatarUrl: "https://i.pravatar.cc/150?img=15",
    },
    imageUrl: "https://images.unsplash.com/photo-1550699026-4114bbf4fb49?w=800&h=800&fit=crop",
    caption: "Found this gem at a garage sale! Still works perfectly 🎮👾",
    createdAt: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(), // 5 days ago
    likeCount: 1234,
    commentCount: 76,
    isLiked: false,
    isSaved: false,
    comments: [
      {
        id: "c17",
        username: "collector",
        text: "That's a rare find! How much?",
        createdAt: new Date(Date.now() - 119 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "13",
    user: {
      id: "user13",
      username: "dance_creator",
      avatarUrl: "https://i.pravatar.cc/150?img=48",
    },
    imageUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&h=800&fit=crop",
    caption: "New choreography! Who wants to learn this? 💃🎶",
    createdAt: new Date(Date.now() - 144 * 60 * 60 * 1000).toISOString(), // 6 days ago
    likeCount: 3456,
    commentCount: 167,
    isLiked: true,
    isSaved: false,
    comments: [
      {
        id: "c18",
        username: "dancer123",
        text: "Tutorial please! 🙏",
        createdAt: new Date(Date.now() - 143 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "14",
    user: {
      id: "user14",
      username: "pet_streamer",
      avatarUrl: "https://i.pravatar.cc/150?img=21",
    },
    imageUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&h=800&fit=crop",
    caption: "My co-streamer fell asleep on the job again 😴🐶",
    createdAt: new Date(Date.now() - 156 * 60 * 60 * 1000).toISOString(), // 6.5 days ago
    likeCount: 6789,
    commentCount: 234,
    isLiked: false,
    isSaved: true,
    comments: [
      {
        id: "c19",
        username: "dog_lover",
        text: "SO CUTE! 😍",
        createdAt: new Date(Date.now() - 155 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "15",
    user: {
      id: "user15",
      username: "indie_dev",
      avatarUrl: "https://i.pravatar.cc/150?img=62",
    },
    imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=800&fit=crop",
    caption: "6 months of solo game dev! Almost ready for early access 🎮💻",
    createdAt: new Date(Date.now() - 168 * 60 * 60 * 1000).toISOString(), // 7 days ago
    likeCount: 2987,
    commentCount: 189,
    isLiked: true,
    isSaved: true,
    comments: [
      {
        id: "c20",
        username: "gamedev_fan",
        text: "This looks amazing! What engine?",
        createdAt: new Date(Date.now() - 167 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "c21",
        username: "indie_supporter",
        text: "Wishlisted! 🎉",
        createdAt: new Date(Date.now() - 166 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "16",
    user: {
      id: "user16",
      username: "video_creator",
      avatarUrl: "https://i.pravatar.cc/150?img=70",
    },
    mediaType: "video",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    imageUrl: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&h=800&fit=crop",
    caption: "Check out this amazing video! Tap to play 🎥✨",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    likeCount: 1523,
    commentCount: 94,
    isLiked: false,
    isSaved: false,
    comments: [
      {
        id: "c22",
        username: "video_fan",
        text: "This is awesome! 🔥",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "17",
    user: {
      id: "user17",
      username: "content_creator",
      avatarUrl: "https://i.pravatar.cc/150?img=28",
    },
    mediaType: "video",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    imageUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=800&fit=crop",
    caption: "Behind the scenes of my latest project 🎬",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    likeCount: 2341,
    commentCount: 156,
    isLiked: true,
    isSaved: true,
    comments: [
      {
        id: "c23",
        username: "creative_mind",
        text: "Love your work! 💜",
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
];
