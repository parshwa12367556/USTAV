
import { delay } from "./mock-data";
import { mockPayments } from "./mock-data";
import type { Payment } from "@/types";

export const paymentService = {
  async list(bookingId?: string): Promise<Payment[]> {
    await delay(600);
    return bookingId ? mockPayments.filter((p) => p.bookingId === bookingId) : [...mockPayments];
  },
  async createOrder(amount: number): Promise<any> {
    await delay(700);
    return { orderId: "order_demo_" + Date.now(), amount, currency: "INR", status: "created", note: "Demo order  Razorpay integration point" };
  },
  async verifyPayment(data: any): Promise<{ success: boolean }> {
    await delay(800);
    return { success: true, note: "Demo verification only" };
  },
};

