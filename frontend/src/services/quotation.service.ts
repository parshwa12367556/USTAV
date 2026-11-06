
import { delay } from "./mock-data";
import { mockQuotations, mockQuotationRequests } from "./mock-data";
import type { Quotation, QuotationRequest } from "@/types";

export const quotationService = {
  async listRequests(familyId: string): Promise<QuotationRequest[]> {
    await delay(600);
    return mockQuotationRequests.filter((q) => q.familyId === familyId);
  },
  async listQuotations(familyId: string): Promise<Quotation[]> {
    await delay(600);
    return mockQuotations.filter((q) => q.familyId === familyId);
  },
  async get(id: string): Promise<Quotation | null> {
    await delay(400);
    return mockQuotations.find((q) => q.id === id) || null;
  },
  async accept(id: string): Promise<Quotation> {
    await delay(700);
    return { ...mockQuotations[0], id, status: "accepted" } as Quotation;
  },
  async reject(id: string): Promise<Quotation> {
    await delay(700);
    return { ...mockQuotations[0], id, status: "rejected" } as Quotation;
  },
  async requestRevision(id: string, message: string): Promise<Quotation> {
    await delay(700);
    return { ...mockQuotations[0], id, status: "revision_requested" } as Quotation;
  },
  // vendor side
  async incomingRequests(vendorId: string): Promise<QuotationRequest[]> {
    await delay(600);
    return mockQuotationRequests.filter((q) => q.vendorId === vendorId);
  },
};

