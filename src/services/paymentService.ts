import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface PSPPayment {
  userAddress: string;
  transactionHash: string;
  tokenAmount: number; // Amount of PSP tokens (500 PSP = 1 search)
}

export interface PaymentResult {
  success: boolean;
  creditsAdded?: number;
  totalCredits?: number;
  error?: string;
}

export class PaymentService {
  private static instance: PaymentService;

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  async verifyPSPPayment(payment: PSPPayment): Promise<PaymentResult> {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/payments/verify-psp-payment`, {
        userAddress: payment.userAddress,
        transactionHash: payment.transactionHash,
        tokenAmount: payment.tokenAmount
      });

      return {
        success: response.data.success,
        creditsAdded: response.data.creditsAdded,
        totalCredits: response.data.totalCredits
      };
    } catch (error) {
      console.error('PSP payment verification failed:', error);
      return {
        success: false,
        error: 'Failed to verify PSP payment'
      };
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
