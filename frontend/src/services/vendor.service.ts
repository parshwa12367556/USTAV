
import { delay } from "./mock-data";
import { mockVendorUser, mockVendors } from "./mock-data";
import type { Vendor } from "@/types";

export const vendorService = {
  async getProfile(): Promise<any> {
    await delay(500);
    return { user: mockVendorUser, business: mockVendors[0] };
  },
  async list(): Promise<Vendor[]> {
    await delay(600);
    return [...mockVendors];
  },
  async updateProfile(data: any): Promise<any> {
    await delay(700);
    return { ...mockVendorUser, ...data };
  },
  async addService(data: any): Promise<any> {
    await delay(700);
    return { id: "svc_new", ...data, createdAt: new Date().toISOString() };
  },
  async listQuotationRequests(): Promise<any[]> {
    await delay(600);
    return [];
  },
  async submitQuotation(data: any): Promise<any> {
    await delay(800);
    return { id: "qt_new", status: "submitted", ...data, submittedAt: new Date().toISOString() };
  },
  async listBookings(): Promise<any[]> {
    await delay(600);
    return [];
  },
  async listPayments(): Promise<any[]> {
    await delay(600);
    return [];
  },
  async listReviews(): Promise<any[]> {
    await delay(600);
    return [];
  },
};

