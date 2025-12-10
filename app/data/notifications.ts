export interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'order';
  fromUserId?: string;
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
}

export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'follow',
    fromUserId: '2',
    title: 'Maria Silva começou a seguir você',
    body: 'há 5 minutos',
    timestamp: new Date(),
    read: false,
  },
  {
    id: '2',
    type: 'like',
    fromUserId: '3',
    title: 'João curtiu sua avaliação',
    body: 'há 1 hora',
    timestamp: new Date(Date.now() - 3600000),
    read: false,
  },
  {
    id: '3',
    type: 'comment',
    fromUserId: '2',
    title: '3 novos comentários',
    body: 'há 2 horas',
    timestamp: new Date(Date.now() - 7200000),
    read: false,
  },
];
