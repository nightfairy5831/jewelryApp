import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const mockNotificações = [
  {
    id: '1',
    type: 'like',
    userName: 'Maria Silva',
    message: 'curtiu sua avaliação',
    timeAgo: '2h ago',
    read: false,
  },
  {
    id: '2',
    type: 'follow',
    userName: 'João Costa',
    message: 'started following you',
    timeAgo: '5h ago',
    read: false,
  },
  {
    id: '3',
    type: 'comment',
    userName: 'Ana Santos',
    message: 'comentou no seu post',
    timeAgo: '1d ago',
    read: true,
  },
];

export default function NotificaçõesScreen() {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return 'person-add';
      case 'like':
        return 'heart';
      case 'comment':
        return 'chatbubble';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'follow':
        return '#3b82f6';
      case 'like':
        return '#ef4444';
      case 'comment':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notificações</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {mockNotificações.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[
              styles.notificationItem,
              !notification.read && styles.notificationItemUnread
            ]}
            activeOpacity={0.7}
          >
            <View style={styles.notificationContent}>
              <View style={[
                styles.iconContainer,
                { backgroundColor: getNotificationColor(notification.type) + '20' }
              ]}>
                <Ionicons
                  name={getNotificationIcon(notification.type) as any}
                  size={24}
                  color={getNotificationColor(notification.type)}
                />
                {!notification.read && <View style={styles.unreadDot} />}
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.notificationText}>
                  <Text style={styles.userName}>{notification.userName}</Text>
                  {' '}{notification.message}
                </Text>
                <Text style={styles.timeAgo}>{notification.timeAgo}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {mockNotificações.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>No Notificações</Text>
            <Text style={styles.emptyStateText}>
              You're all caught up! Check back later for new updates.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  notificationItem: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  notificationItemUnread: {
    backgroundColor: '#eff6ff',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  userName: {
    fontWeight: 'bold',
  },
  timeAgo: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
