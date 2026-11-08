import { apiClient } from '../../../services/api/apiClient';
import type { AuthUser } from '../../../types/auth.types';
import type { Vendor } from '../../../types/vendor.types';
import type { Venue } from '../../../types/venue.types';
import type { InvitationTemplate } from '../../invitations/api/invitationsApi';

export type AdminUser = AuthUser & { status: 'active' | 'suspended'; verified: boolean };
export type AdminVendor = Vendor & {
  verificationStatus: 'pending' | 'verified' | 'rejected';
};
export type AdminAuditLog = {
  id: string;
  actor: string;
  action: string;
  target: string;
  details: Record<string, unknown>;
  createdAt: string;
};
export type AdminSecurityEvent = {
  id: string;
  userId: string | null;
  eventType: string;
  result: string;
  resourceType: string | null;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};
export type AdminDashboard = {
  metrics: {
    users: { total: number; active: number };
    events: number;
    vendors: { total: number; pending: number; verified: number };
    bookings: {
      total: number;
      requested: number;
      confirmed: number;
      completed: number;
      cancelled: number;
    };
    payments: {
      total: number;
      paid: number;
      pending: number;
      failed: number;
      paidAmount: number;
    };
  };
  recentBookings: Array<{
    id: string;
    eventName: string;
    vendorName: string;
    serviceName: string;
    eventDate: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
  recentPayments: Array<{
    id: string;
    invoiceNumber: string;
    eventName: string | null;
    serviceName: string | null;
    amount: number;
    currency: string;
    status: string;
    paidAt: string | null;
    createdAt: string;
  }>;
};
export type PlatformCategory = { id: string; name: string; isActive: boolean };
export type CommissionRule = {
  id: string;
  category: string;
  ratePercent: number;
  effectiveFrom: string;
};

export const adminApi = {
  async getDashboard(): Promise<AdminDashboard> {
    const response = await apiClient.get<AdminDashboard>('/admin/dashboard');
    return response.data;
  },
  async listUsers(): Promise<AdminUser[]> {
    const response = await apiClient.get<AdminUser[]>('/admin/users');
    return response.data;
  },
  async updateUserStatus(id: string, status: AdminUser['status']): Promise<AdminUser> {
    const response = await apiClient.patch<AdminUser>(
      `/admin/users/${encodeURIComponent(id)}/status`,
      { status },
    );
    return response.data;
  },
  async listAuditLogs(): Promise<AdminAuditLog[]> {
    const response = await apiClient.get<AdminAuditLog[]>('/admin/audit-logs');
    return response.data;
  },
  async listSecurityEvents(): Promise<AdminSecurityEvent[]> {
    const response = await apiClient.get<AdminSecurityEvent[]>('/admin/security-events');
    return response.data;
  },
  async listCategories(): Promise<PlatformCategory[]> {
    const response = await apiClient.get<PlatformCategory[]>('/admin/categories');
    return response.data;
  },
  async createCategory(name: string): Promise<PlatformCategory> {
    const response = await apiClient.post<PlatformCategory>('/admin/categories', { name });
    return response.data;
  },
  async setCategoryActive(id: string, isActive: boolean): Promise<PlatformCategory> {
    const response = await apiClient.patch<PlatformCategory>(
      `/admin/categories/${encodeURIComponent(id)}`,
      { isActive },
    );
    return response.data;
  },
  async listCommissionRules(): Promise<CommissionRule[]> {
    const response = await apiClient.get<CommissionRule[]>('/admin/commissions');
    return response.data;
  },
  async createCommissionRule(input: {
    category: string;
    ratePercent: number;
    effectiveFrom: string;
  }): Promise<CommissionRule> {
    const response = await apiClient.post<CommissionRule>('/admin/commissions', input);
    return response.data;
  },
  async downloadReport(type: 'bookings' | 'payments' | 'commissions', from?: string, to?: string): Promise<Blob> {
    const response = await apiClient.get<Blob>('/admin/reports', {
      params: { type, ...(from ? { from } : {}), ...(to ? { to } : {}) },
      responseType: 'blob',
    });
    return response.data;
  },
  async listVendors(): Promise<AdminVendor[]> {
    const response = await apiClient.get<AdminVendor[]>('/admin/vendors');
    return response.data;
  },
  async updateVendorVerification(
    id: string,
    status: AdminVendor['verificationStatus'],
  ): Promise<AdminVendor> {
    const response = await apiClient.patch<AdminVendor>(
      `/admin/vendors/${encodeURIComponent(id)}/verification`,
      { status },
    );
    return response.data;
  },
  async createVenue(input: Omit<Venue, 'id' | 'availableDates'>): Promise<Venue> {
    const response = await apiClient.post<Venue>('/admin/venues', input);
    return response.data;
  },
  async createInvitationTemplate(input: Omit<InvitationTemplate, 'id'>): Promise<InvitationTemplate> {
    const response = await apiClient.post<InvitationTemplate>('/admin/invitation-templates', input);
    return response.data;
  },
};
