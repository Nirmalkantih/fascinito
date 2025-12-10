import api from './api';
import {
  RazorpayOrderResponse,
  PaymentVerificationRequest,
  PaymentVerificationResponse,
  RazorpayOptions,
  RazorpayPaymentResponse
} from '../types/razorpay';

class RazorpayService {
  /**
   * Load Razorpay script dynamically
   */
  loadScript(): Promise<boolean> {
    return new Promise((resolve) => {
      // Check if script already exists
      if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  /**
   * Create Razorpay order
   */
  async createOrder(orderId: number): Promise<RazorpayOrderResponse> {
    const response = await api.post(`/payment/razorpay/create-order/${orderId}`);
    console.log('createOrder API response:', response);
    // The axios interceptor already returns response.data, so we just need .data
    return response.data;
  }

  /**
   * Verify payment
   */
  async verifyPayment(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
    const response = await api.post('/payment/razorpay/verify', request);
    return response.data;
  }

  /**
   * Handle payment failure
   */
  async handlePaymentFailure(orderId: number, reason?: string): Promise<void> {
    await api.post(`/payment/razorpay/failure/${orderId}`, reason);
  }

  /**
   * Display Razorpay checkout
   */
  async displayRazorpay(
    orderData: RazorpayOrderResponse,
    onSuccess: (response: PaymentVerificationResponse) => void,
    onFailure: (error: any) => void,
    preferredMethod?: string
  ): Promise<void> {
    console.log('displayRazorpay called with orderData:', orderData, 'preferredMethod:', preferredMethod);
    
    const res = await this.loadScript();

    if (!res) {
      console.error('Razorpay SDK failed to load');
      alert('Razorpay SDK failed to load. Are you online?');
      return;
    }

    console.log('Razorpay SDK loaded successfully');

    const options: RazorpayOptions = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'Fascinito',
      description: `Order: ${orderData.receipt}`,
      image: '/logo.png', // Add your logo here
      order_id: orderData.orderId,
      handler: async (response: RazorpayPaymentResponse) => {
        try {
          // Verify payment on backend
          const verificationRequest: PaymentVerificationRequest = {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            orderId: orderData.orderIdDb  // Use the database order ID directly
          };

          const verificationResponse = await this.verifyPayment(verificationRequest);
          
          if (verificationResponse.success) {
            onSuccess(verificationResponse);
          } else {
            onFailure(new Error(verificationResponse.message));
          }
        } catch (error) {
          console.error('Payment verification failed:', error);
          onFailure(error);
        }
      },
      prefill: {
        name: orderData.userName,
        email: orderData.userEmail,
        contact: orderData.userPhone || ''
      },
      notes: {
        receipt: orderData.receipt
      },
      theme: {
        color: '#667eea'
      },
      modal: {
        ondismiss: () => {
          console.log('Payment cancelled by user');
        }
      }
    };

    // Add preferred method to config if specified
    if (preferredMethod) {
      const methodMap: { [key: string]: string } = {
        'CARD': 'card',
        'UPI': 'upi'
      };
      
      const razorpayMethod = methodMap[preferredMethod];
      if (razorpayMethod) {
        options.config = {
          display: {
            preferences: {
              show_default_blocks: true
            }
          }
        };
        // Set preferred method - this tells Razorpay which section to show first
        (options.prefill as any).method = razorpayMethod;
      }
    }

    console.log('Razorpay options:', options);

    try {
      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', (response: any) => {
        console.error('Payment failed:', response.error);
        onFailure(response.error);
      });

      console.log('Opening Razorpay checkout modal...');
      paymentObject.open();
    } catch (error) {
      console.error('Error creating/opening Razorpay checkout:', error);
      throw error;
    }
  }
}

export default new RazorpayService();
