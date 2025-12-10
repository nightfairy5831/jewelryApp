export interface Plano {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  billingCycle: string;
  benefits: string[];
  featured: boolean;
  gradient?: [string, string];
}

export const mockPlano: Plano = {
  id: '1',
  name: 'Premium',
  description: 'Aproveite vantagens exclusivas!',
  price: 29.90,
  originalPrice: 49.90,
  discount: 40,
  billingCycle: 'month',
  benefits: [
    'Frete grátis ilimitado',
    'Descontos exclusivos de até 50%',
    'Acesso antecipado a novos produtos',
    'Sem anúncios na plataforma',
  ],
  featured: true,
  gradient: ['#667eea', '#764ba2'],
};
