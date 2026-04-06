import axios from 'axios';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    email: string;
    contact: string;
  };
  handler: (response: any) => void;
  modal?: {
    ondismiss: () => void;
  };
  theme?: {
    color: string;
  };
}

class PaymentService {
  private razorpayLoaded = false;

  async loadRazorpayScript(): Promise<boolean> {
    if (window.Razorpay) {
      this.razorpayLoaded = true;
      return true;
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        this.razorpayLoaded = true;
        resolve(true);
      };
      script.onerror = () => {
        console.error('Failed to load Razorpay script');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  async initiatePayment(
    tournamentId: string,
    teamRegistrationId: string,
    amount: number,
    email: string,
    phone: string,
    onSuccess: (paymentId: string, orderId: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      // Load Razorpay if not loaded
      if (!this.razorpayLoaded) {
        const loaded = await this.loadRazorpayScript();
        if (!loaded) {
          throw new Error('Failed to load payment service');
        }
      }

      // Create order on backend (would be a real API call)
      // For now, generating a mock order ID
      const orderId = `order_${Date.now()}`;

      const options: RazorpayOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'test_key',
        amount: Math.round(amount * 100), // in paise
        currency: 'INR',
        name: 'MATCHMETER',
        description: `Team Registration ${teamRegistrationId} - Tournament ${tournamentId}`,
        order_id: orderId,
        prefill: { email, contact: phone },
        handler: (response: any) => {
          console.log('✓ Payment successful:', response);
          onSuccess(response.razorpay_payment_id, orderId);
        },
        modal: {
          ondismiss: () => {
            onError('Payment cancelled by user');
          },
        },
        theme: {
          color: '#2196F3',
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        throw new Error('Razorpay not available');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment initiation failed';
      console.error('Payment error:', error);
      onError(errorMessage);
    }
  }

  /**
   * Generic payment flow to charge an admin for creating a tournament.
   * Currently used for a fixed ₹199 tournament creation fee.
   */
  async initiateTournamentCreationPayment(
    amount: number,
    email: string,
    phone: string,
    onSuccess: (paymentId: string, orderId: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      if (!this.razorpayLoaded) {
        const loaded = await this.loadRazorpayScript();
        if (!loaded) {
          throw new Error('Failed to load payment service');
        }
      }

      const orderId = `order_tournament_${Date.now()}`;

      const options: RazorpayOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'test_key',
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'MATCHMETER',
        description: 'Tournament Creation Fee',
        order_id: orderId,
        prefill: { email, contact: phone },
        handler: (response: any) => {
          console.log('✓ Tournament creation payment successful:', response);
          onSuccess(response.razorpay_payment_id, orderId);
        },
        modal: {
          ondismiss: () => {
            onError('Payment cancelled by user');
          },
        },
        theme: {
          color: '#2196F3',
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        throw new Error('Razorpay not available');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Payment initiation failed';
      console.error('Tournament creation payment error:', error);
      onError(errorMessage);
    }
  }

  async verifyPayment(
    paymentId: string,
    orderId: string,
    signature: string
  ): Promise<boolean> {
    try {
      const response = await axios.post('/api/payments/verify', {
        paymentId,
        orderId,
        signature,
      });
      return response.data.success;
    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
  }
}

export default new PaymentService();
