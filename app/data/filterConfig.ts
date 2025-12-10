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
      id: 'male',
      name: 'Masculino',
      icon: require('../assets/man.png'),
      iconType: 'image',
      type: 'category',
      subFilters: []
    },
    {
      id: 'female',
      name: 'Feminino',
      icon: require('../assets/woman.png'),
      iconType: 'image',
      type: 'category',
      subFilters: []
    },
    {
      id: 'graduation',
      name: 'Formatura',
      icon: require('../assets/fomat.png'),
      iconType: 'image',
      type: 'category',
      subFilters: []
    },
    {
      id: 'wedding',
      name: 'Casamento',
      icon: require('../assets/marriage.png'),
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
  male: [
    { id: 'rings', name: 'Anéis', icon: require('../assets/icon.png'), iconType: 'image', type: 'category' },
    { id: 'necklaces', name: 'Colares', icon: require('../assets/icon.png'), iconType: 'image', type: 'category' },
    { id: 'bracelets', name: 'Pulseiras', icon: require('../assets/icon.png'), iconType: 'image', type: 'category' }
  ],
  female: [
    { id: 'rings', name: 'Anéis', icon: require('../assets/icon.png'), iconType: 'image', type: 'category' },
    { id: 'necklaces', name: 'Colares', icon: require('../assets/icon.png'), iconType: 'image', type: 'category' },
    { id: 'bracelets', name: 'Pulseiras', icon: require('../assets/icon.png'), iconType: 'image', type: 'category' }
  ],
  graduation: [
    { id: 'rings', name: 'Anéis', icon: require('../assets/icon.png'), iconType: 'image', type: 'category' },
    { id: 'medals', name: 'Medalhas', icon: require('../assets/icon.png'), iconType: 'image', type: 'category' },
    { id: 'pins', name: 'Broches', icon: require('../assets/icon.png'), iconType: 'image', type: 'category' }
  ],
  wedding: [
    { id: 'rings', name: 'Alianças', icon: require('../assets/icon.png'), iconType: 'image', type: 'category' },
    { id: 'sets', name: 'Conjuntos', icon: require('../assets/icon.png'), iconType: 'image', type: 'category' },
    { id: 'tiaras', name: 'Tiaras', icon: require('../assets/icon.png'), iconType: 'image', type: 'category' }
  ]
};

export const getFiltersForCategory = (categoryId: string): FilterConfig[] => {
  return filterTree[categoryId] || filterTree.root;
};
