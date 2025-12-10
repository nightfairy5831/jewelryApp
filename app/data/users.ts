export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  bio?: string;
  stats: {
    reviewCount: number;
    followerCount: number;
    followingCount: number;
  };
  isPremium: boolean;
}

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Justin Gnoh',
    username: 'justingnoh',
    email: 'dev@email.com',
    avatar: 'https://i.pravatar.cc/150?img=1',
    bio: 'Tech enthusiast and fashion lover 👗📱',
    stats: {
      reviewCount: 45,
      followerCount: 1200,
      followingCount: 356,
    },
    isPremium: true,
  },
  {
    id: '2',
    name: 'Maria Silva',
    username: 'mariasilva',
    email: 'maria@example.com',
    avatar: 'https://i.pravatar.cc/150?img=5',
    bio: 'Fashion blogger 👗',
    stats: {
      reviewCount: 67,
      followerCount: 2100,
      followingCount: 412,
    },
    isPremium: true,
  },
  {
    id: '3',
    name: 'João Costa',
    username: 'joaocosta',
    email: 'joao@example.com',
    avatar: 'https://i.pravatar.cc/150?img=12',
    bio: 'Sports lover ⚽',
    stats: {
      reviewCount: 23,
      followerCount: 890,
      followingCount: 234,
    },
    isPremium: false,
  },
];

export const currentUser = mockUsers[0]; // Justin Gnoh
