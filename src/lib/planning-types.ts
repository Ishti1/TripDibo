export type BookingKind = 'hotel' | 'flight' | 'bus' | 'train' | 'car' | 'other';
export type TicketFile = { id: string; name: string; size: number; type: string };
export type Booking = {
  id: string; tripId: string; kind: BookingKind; title: string; provider: string;
  reference: string; serviceNumber: string; traveler: string; seat: string;
  from: string; to: string; start: string; end: string; startTimezone: string; endTimezone: string;
  address: string; status: 'confirmed' | 'pending' | 'cancelled';
  cost: number; currency: string; paidBy: string; recordExpense: boolean;
  notes: string; url: string; attachments: TicketFile[];
  ownerId?: string;
};
export type BudgetCategory = { name: string; amount: number; reason: string };
export type BudgetPlan = { currency: string; categories: BudgetCategory[]; total: number; assumptions: string[] };
export type PlanSuggestion = {
  title: string; date: string; time: string; category: 'activity' | 'food' | 'transport' | 'hotel';
  location: string; estimatedCost: number; notes: string;
};
export type AssistantProposal = {
  answer: string; itinerary: PlanSuggestion[]; budget: BudgetPlan | null; packing: string[]; warnings: string[];
};
export type AssistantMessage = {
  id: string; tripId: string; role: 'user' | 'assistant'; content: string; createdAt: string;
  proposal?: AssistantProposal; currency?: string; appliedItinerary?: boolean; appliedBudget?: boolean; appliedPacking?: boolean;
};
