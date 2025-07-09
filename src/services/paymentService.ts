import axios from 'axios';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
}

export interface SearchPayment {
  amount: number; // $15.00 = 1500 cents
  currency: string;
  description: string;
  searchQuery: string;
  userAddress: string;
}

export class PaymentService {
  private static instance: PaymentService;
  
  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  async createSearchPaymentIntent(searchPayment: SearchPayment): Promise<PaymentIntent> {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/payments/create-search-intent`, {
        amount: searchPayment.amount,
        currency: searchPayment.currency,
        description: searchPayment.description,
        metadata: {
          searchQuery: searchPayment.searchQuery,
          userAddress: searchPayment.userAddress,
          searchType: 'ai_patent_search'
        }
      });

      return {
        clientSecret: response.data.clientSecret,
        paymentIntentId: response.data.paymentIntentId
      };
    } catch (error) {
      console.error('Payment intent creation failed:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<boolean> {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/payments/confirm-search-payment`, {
        paymentIntentId
      });

      return response.data.success;
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      return false;
    }
  }

  async getUserSearchCredits(userAddress: string): Promise<number> {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/users/${userAddress}/search-credits`);
      return response.data.credits || 0;
    } catch (error) {
      console.error('Failed to fetch search credits:', error);
      return 0;
    }
  }

  async deductSearchCredit(userAddress: string): Promise<boolean> {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/users/${userAddress}/deduct-credit`);
      return response.data.success;
    } catch (error) {
      console.error('Failed to deduct search credit:', error);
      return false;
    }
  }
}

export const paymentService = PaymentService.getInstance();
