import { auth } from '../config/firebase';

const paymentApiUrl = process.env.EXPO_PUBLIC_PAYMENT_API_URL?.replace(/\/$/, '');

export interface CreateRazorpayOrderInput {
  addressId: string;
  items: Array<{ productId: string; quantity: number }>;
  notes: string;
}

export interface RazorpayOrder {
  keyId: string;
  orderId: string;
  amount: number;
  currency: 'INR';
  totalAmount: number;
}

export interface RazorpayVerificationInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export async function createRazorpayOrder(input: CreateRazorpayOrderInput): Promise<RazorpayOrder> {
  return callPaymentApi<CreateRazorpayOrderInput, RazorpayOrder>('create-razorpay-order', input);
}

export async function verifyRazorpayPayment(input: RazorpayVerificationInput): Promise<{ orderId: string }> {
  return callPaymentApi<RazorpayVerificationInput, { orderId: string }>('verify-razorpay-payment', input);
}

async function callPaymentApi<TInput, TOutput>(path: string, input: TInput): Promise<TOutput> {
  if (!paymentApiUrl) throw new Error('Payment API URL is not configured.');
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Sign in before paying.');
  const idToken = await currentUser.getIdToken();
  const response = await fetch(`${paymentApiUrl}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? 'Payment service request failed.');
  return payload as TOutput;
}
