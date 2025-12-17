export interface FilterConfig {
  id: string;
  name: string;
  icon: string;
  iconType?: 'ionicon' | 'image';
  type?: 'category' | 'action';
  subFilters?: FilterConfig[];
}

export const filterTree: Record<string, FilterConfig[]> = {
  root: [
    {
      id: 'Male',
      name: 'Masculino',
      icon: require('../assets/filter/male.png'),
      iconType: 'image',
      type: 'category',
      subFilters: []
    },
    {
      id: 'Female',
      name: 'Feminino',
      icon: require('../assets/filter/female.png'),
      iconType: 'image',
      type: 'category',
      subFilters: []
    },
    {
      id: 'Wedding Rings',
      name: 'Alianças de Casamento',
      icon: require('../assets/filter/marriage.png'),
      iconType: 'image',
      type: 'category',
      subFilters: []
    },
    {
      id: 'Other',
      name: 'Outros',
      icon: require('../assets/filter/other.png'),
      iconType: 'image',
      type: 'category',
      subFilters: []
    },
    {
      id: 'wallet',
      name: 'Carteira',
      icon: 'wallet',
      type: 'action'
    },
    {
      id: 'profile',
      name: 'Perfil',
      icon: 'person',
      type: 'action'
    }
  ],
  Male: [
    { id: 'Chains', name: 'Correntes', icon: require('../assets/filter/mchain.png'), iconType: 'image', type: 'category' },
    { id: 'Rings', name: 'Anéis', icon: require('../assets/filter/mring.png'), iconType: 'image', type: 'category' },
    { id: 'Earrings and Pendants', name: 'Brincos e Pingentes', icon: require('../assets/filter/mearring.png'), iconType: 'image', type: 'category' }
  ],
  Female: [
    { id: 'Chains', name: 'Correntes', icon: require('../assets/filter/fchain.png'), iconType: 'image', type: 'category' },
    { id: 'Rings', name: 'Anéis', icon: require('../assets/filter/fring.png'), iconType: 'image', type: 'category' },
    { id: 'Earrings and Pendants', name: 'Brincos e Pingentes', icon: require('../assets/filter/fearring.png'), iconType: 'image', type: 'category' }
  ],
  'Wedding Rings': [
    { id: 'Wedding Anniversary', name: 'Aniversário de Casamento', icon: require('../assets/filter/anniversary.png'), iconType: 'image', type: 'category' },
    { id: 'Engagement', name: 'Noivado', icon: require('../assets/filter/engagment.png'), iconType: 'image', type: 'category' },
    { id: 'Marriage', name: 'Casamento', icon: require('../assets/filter/marriages.png'), iconType: 'image', type: 'category' }
  ],
  Other: [
    { id: 'Perfumes', name: 'Perfumes', icon: require('../assets/filter/perfume.png'), iconType: 'image', type: 'category' },
    { id: 'Watches', name: 'Relógios', icon: require('../assets/filter/watch.png'), iconType: 'image', type: 'category' },
    { id: 'Other', name: 'Outros', icon: require('../assets/filter/other.png'), iconType: 'image', type: 'category' }
  ]
};

export const getFiltersForCategory = (categoryId: string): FilterConfig[] => {
  return filterTree[categoryId] || filterTree.root;
};
