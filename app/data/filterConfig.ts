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
      icon: require('../assets/man.png'),
      iconType: 'image',
      type: 'category',
      subFilters: []
    },
    {
      id: 'Female',
      name: 'Feminino',
      icon: require('../assets/woman.png'),
      iconType: 'image',
      type: 'category',
      subFilters: []
    },
    {
      id: 'Wedding Rings',
      name: 'Alianças de Casamento',
      icon: require('../assets/marriage.png'),
      iconType: 'image',
      type: 'category',
      subFilters: []
    },
    {
      id: 'Other',
      name: 'Outros',
      icon: require('../assets/fomat.png'),
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
    { id: 'Chains', name: 'Correntes', icon: require('../assets/icon.png'), iconType: 'image', type: 'category' },
    { id: 'Rings', name: 'Anéis', icon: require('../assets/icon.png'), iconType: 'image', type: 'category' },
    { id: 'Earrings and Pendants', name: 'Brincos e Pingentes', icon: require('../assets/icon.png'), iconType: 'image', type: 'category' }
  ],
  Female: [
    { id: 'Chains', name: 'Correntes', icon: require('../assets/icon.png'), iconType: 'image', type: 'category' },
    { id: 'Rings', name: 'Anéis', icon: require('../assets/icon.png'), iconType: 'image', type: 'category' },
    { id: 'Earrings and Pendants', name: 'Brincos e Pingentes', icon: require('../assets/icon.png'), iconType: 'image', type: 'category' }
  ],
  'Wedding Rings': [
    { id: 'Wedding Anniversary', name: 'Aniversário de Casamento', icon: require('../assets/icon.png'), iconType: 'image', type: 'category' },
    { id: 'Engagement', name: 'Noivado', icon: require('../assets/icon.png'), iconType: 'image', type: 'category' },
    { id: 'Marriage', name: 'Casamento', icon: require('../assets/icon.png'), iconType: 'image', type: 'category' }
  ],
  Other: [
    { id: 'Perfumes', name: 'Perfumes', icon: require('../assets/icon.png'), iconType: 'image', type: 'category' },
    { id: 'Watches', name: 'Relógios', icon: require('../assets/icon.png'), iconType: 'image', type: 'category' },
    { id: 'Other', name: 'Outros', icon: require('../assets/icon.png'), iconType: 'image', type: 'category' }
  ]
};

export const getFiltersForCategory = (categoryId: string): FilterConfig[] => {
  return filterTree[categoryId] || filterTree.root;
};
