import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import app from './firebase';

class FCMService {
  private messaging: Messaging | null = null;

  initialize(): void {
    try {
      this.messaging = getMessaging(app);
    } catch (error) {
      console.error('FCM initialization failed:', error);
    }
  }

  async requestNotificationPermission(): Promise<string | null> {
    try {
      if (!this.messaging) {
        this.initialize();
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      const vapidKey = import.meta.env.VITE_FCM_VAPID_KEY;
      if (!vapidKey) {
        console.error('FCM VAPID key not configured');
        return null;
      }

      const token = await getToken(this.messaging!, {
        vapidKey,
      });

      console.log('✓ FCM token obtained:', token);
      return token;
    } catch (error) {
      console.error('Failed to get notification permission or token:', error);
      return null;
    }
  }

  onMessage(callback: (payload: any) => void): (() => void) | null {
    try {
      if (!this.messaging) {
        this.initialize();
      }

      return onMessage(this.messaging!, (payload) => {
        console.log('Message received:', payload);

        // Handle notification
        if (payload.notification) {
          const notificationOptions: NotificationOptions = {
            body: payload.notification.body,
            icon: payload.notification.icon || '/icons/icon-192x192.png',
            badge: '/icons/icon-96x96.png',
            tag: 'matchmeter-notification',
            requireInteraction: false,
          };

          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'SHOW_NOTIFICATION',
              title: payload.notification.title,
              options: notificationOptions,
              data: payload.data,
            });
          } else {
            new Notification(payload.notification.title || 'MATCHMETER', notificationOptions);
          }
        }

        callback(payload);
      });
    } catch (error) {
      console.error('Failed to set up message listener:', error);
      return null;
    }
  }

  async subscribeToTopic(token: string, topic: string): Promise<void> {
    try {
      // This would be a backend API call
      await fetch('/api/fcm/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, topic }),
      });
      console.log(`✓ Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error('Failed to subscribe to topic:', error);
    }
  }

  async unsubscribeFromTopic(token: string, topic: string): Promise<void> {
    try {
      // This would be a backend API call
      await fetch('/api/fcm/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, topic }),
      });
      console.log(`✓ Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error('Failed to unsubscribe from topic:', error);
    }
  }

  async sendNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<void> {
    try {
      // This would be a backend API call
      await fetch('/api/fcm/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, title, body, data }),
      });
      console.log('✓ Notification sent:', title);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // Subscribe to tournament updates
  async subscribeTournamentUpdates(tournamentId: string): Promise<void> {
    await this.subscribeToTopic('', `tournament_${tournamentId}`);
  }

  // Subscribe to match updates
  async subscribeMatchUpdates(matchId: string): Promise<void> {
    await this.subscribeToTopic('', `match_${matchId}`);
  }

  // Subscribe to team registration updates
  async subscribeTeamRegistrationUpdates(teamId: string): Promise<void> {
    await this.subscribeToTopic('', `team_${teamId}`);
  }
}

export default new FCMService();
