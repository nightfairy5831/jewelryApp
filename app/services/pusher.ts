import Pusher from 'pusher-js';

// Enable Pusher logging for debugging
Pusher.logToConsole = true;

// Pusher credentials from environment variables
const pusher = new Pusher(process.env.EXPO_PUBLIC_PUSHER_APP_KEY || '', {
  cluster: process.env.EXPO_PUBLIC_PUSHER_CLUSTER || 'sa1',
  forceTLS: true,
  enabledTransports: ['ws', 'wss'],
});

console.log('Pusher initialized with key:', process.env.EXPO_PUBLIC_PUSHER_APP_KEY);
console.log('Pusher cluster:', process.env.EXPO_PUBLIC_PUSHER_CLUSTER);

export const messagesChannel = pusher.subscribe('messages');

export default pusher;
