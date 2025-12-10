export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  isPremium: boolean;
  productId: string;
  productName: string;
  productImage: string;
  productPrice: number;
  rating: number;
  content: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  likes?: string[];
  likesCount: number;
  commentsCount?: number;
  timeAgo: string;
}

export const mockReviews: Review[] = [
  {
    id: '1',
    userId: '1',
    userName: 'Justin Gnoh',
    userAvatar: 'https://i.pravatar.cc/150?img=1',
    isPremium: true,
    productId: '1',
    productName: 'Vestido Floral Verão',
    productImage: 'https://picsum.photos/seed/dress1/400/400',
    productPrice: 89.90,
    rating: 5,
    content: 'Adorei este vestido! Tecido muito confortável e o tamanho ficou perfeito. Super recomendo! 💕',
    images: ['https://picsum.photos/seed/review1/800/1000'],
    isVerifiedPurchase: true,
    likes: ['2', '3', '4'],
    likesCount: 1234,
    commentsCount: 45,
    timeAgo: '2 hours ago',
  },
  {
    id: '2',
    userId: '2',
    userName: 'Maria Silva',
    userAvatar: 'https://i.pravatar.cc/150?img=2',
    isPremium: false,
    productId: '2',
    productName: 'Tênis Nike Air Max',
    productImage: 'https://picsum.photos/seed/nike1/400/400',
    productPrice: 299.90,
    rating: 4,
    content: 'Tênis muito bom, confortável para corrida. Único ponto negativo é o preço.',
    images: ['https://picsum.photos/seed/review2/800/1000'],
    isVerifiedPurchase: true,
    likes: [],
    likesCount: 567,
    commentsCount: 23,
    timeAgo: '5 hours ago',
  },
  {
    id: '3',
    userId: '3',
    userName: 'Carlos Santos',
    userAvatar: 'https://i.pravatar.cc/150?img=3',
    isPremium: true,
    productId: '3',
    productName: 'Batom Matte Vermelho',
    productImage: 'https://picsum.photos/seed/lipstick1/400/400',
    productPrice: 45.90,
    rating: 5,
    content: 'Melhor batom que já comprei! A cor é linda e dura o dia todo.',
    isVerifiedPurchase: true,
    likes: [],
    likesCount: 890,
    commentsCount: 34,
    timeAgo: '1 day ago',
  },
  {
    id: '4',
    userId: '4',
    userName: 'Ana Costa',
    userAvatar: 'https://i.pravatar.cc/150?img=4',
    isPremium: false,
    productId: '4',
    productName: 'Smart Watch Premium',
    productImage: 'https://picsum.photos/seed/watch1/400/400',
    productPrice: 599.90,
    rating: 4,
    content: 'Relógio excelente! Monitor cardíaco muito preciso. Bateria dura bastante.',
    images: ['https://picsum.photos/seed/review4/800/1000', 'https://picsum.photos/seed/review4b/800/1000'],
    isVerifiedPurchase: false,
    likes: [],
    likesCount: 432,
    commentsCount: 18,
    timeAgo: '2 days ago',
  },
  {
    id: '5',
    userId: '5',
    userName: 'Pedro Oliveira',
    userAvatar: 'https://i.pravatar.cc/150?img=5',
    isPremium: true,
    productId: '6',
    productName: 'Fone Bluetooth Premium',
    productImage: 'https://picsum.photos/seed/headphone1/400/400',
    productPrice: 249.90,
    rating: 5,
    content: 'Cancelamento de ruído impressionante! Som cristalino, super confortável.',
    images: ['https://picsum.photos/seed/review5/800/1000'],
    isVerifiedPurchase: true,
    likes: [],
    likesCount: 2103,
    commentsCount: 87,
    timeAgo: '3 days ago',
  },
];
