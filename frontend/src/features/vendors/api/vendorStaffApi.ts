import { apiClient } from '../../../services/api/apiClient';

export type VendorStaffMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'staff';
  status: string;
};

export const vendorStaffApi = {
  async list(): Promise<VendorStaffMember[]> {
    const response = await apiClient.get<VendorStaffMember[]>('/vendors/profile/me/staff');
    return response.data;
  },
  async invite(email: string): Promise<{ id: string; email: string; expiresAt: string; acceptanceToken: string }> {
    const response = await apiClient.post<{ id: string; email: string; expiresAt: string; acceptanceToken: string }>(
      '/vendors/profile/me/staff/invitations',
      { email },
    );
    return response.data;
  },
  async accept(token: string): Promise<{ membership: VendorStaffMember }> {
    const response = await apiClient.post<{ membership: VendorStaffMember }>(
      '/vendors/staff/invitations/accept',
      { token },
    );
    return response.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/vendors/profile/me/staff/${encodeURIComponent(id)}`);
  },
  async assign(bookingId: string, membershipId: string): Promise<void> {
    await apiClient.post(
      `/vendors/profile/me/bookings/${encodeURIComponent(bookingId)}/assignments`,
      { membershipId },
    );
  },
  async unassign(bookingId: string, membershipId: string): Promise<void> {
    await apiClient.delete(
      `/vendors/profile/me/bookings/${encodeURIComponent(bookingId)}/assignments/${encodeURIComponent(membershipId)}`,
    );
  },
};
