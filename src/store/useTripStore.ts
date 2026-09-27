import type { Booking, BudgetPlan, AssistantMessage } from '@/lib/planning-types';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createTripOnServer, deleteTripOnServer, updateTripOnServer } from '@/app/actions/trip';

export type ItineraryItem = {
  bookingId?: string;
  id: string;
  tripId: string;
  date: string;
  time: string;
  title: string;
  category: 'activity' | 'food' | 'transport' | 'hotel';
  location: string;
  estimatedCost: string;
  notes?: string;
};

export type Expense = {
  bookingId?: string;
  id: string;
  tripId: string;
  title: string;
  amount: number;
  paidBy: string;
  category?: string;
  date: string;
};

export type PackingItem = {
  id: string;
  tripId: string;
  title: string;
  assignedTo: string;
  category?: string;
  isCompleted: boolean;
};

export type IdeaItem = {
  id: string;
  tripId: string;
  title: string;
  description: string;
  votes: number;
  author: string;
};

export type ActivityLog = {
  id: string;
  tripId?: string;
  user: string;
  action: string;
  target: string;
  time: string;
};

export type Trip = {
  id: string;
  title: string;
  destination: string;
  dates: string;
  startDate?: string;
  endDate?: string;
  members: number;
  image: string;
  description?: string;
  currency?: string;
  budget?: number;
  budgetPlan?: BudgetPlan;
  favorite?: boolean;
};

type TripStore = {
  bookings: Booking[];
  assistantMessages: AssistantMessage[];
  saveBooking: (booking: Omit<Booking, 'id'> & { id?: string }) => string;
  deleteBooking: (id: string) => void;
  addAssistantMessage: (message: Omit<AssistantMessage,'id'|'createdAt'>) => string;
  updateAssistantMessage: (id: string, updates: Partial<AssistantMessage>) => void;
  clearAssistantMessages: (tripId: string) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  importData: (data: Partial<Pick<TripStore, 'trips' | 'itinerary' | 'expenses' | 'packingList' | 'ideas' | 'activities' | 'currency' | 'bookings' | 'assistantMessages'>>) => void;
  trips: Trip[];
  setCloudTrips: (trips: Trip[]) => void;
  itinerary: ItineraryItem[];
  expenses: Expense[];
  packingList: PackingItem[];
  ideas: IdeaItem[];
  activities: ActivityLog[];
  
  // Trip management
  addTrip: (trip: Omit<Trip, 'id'>) => string;
  deleteTrip: (id: string) => void;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  clearAllData: () => void;
  
  // Itinerary management
  addItineraryItem: (item: Omit<ItineraryItem, 'id'>) => void;
  updateItineraryItem: (id: string, updates: Partial<Omit<ItineraryItem, 'id' | 'tripId'>>) => void;
  deleteItineraryItem: (id: string) => void;
  
  // Expense management
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  
  // Packing management
  addPackingItem: (item: Omit<PackingItem, 'id' | 'isCompleted'>) => void;
  togglePackingItem: (id: string) => void;
  deletePackingItem: (id: string) => void;
  
  // Ideas management
  addIdea: (idea: Omit<IdeaItem, 'id' | 'votes'>) => void;
  voteIdea: (id: string) => void;
  deleteIdea: (id: string) => void;
  
  // Activity logger
  logActivity: (activity: Omit<ActivityLog, 'id' | 'time'>) => void;
};

export const useTripStore = create<TripStore>()(
  persist(
    (set, get) => ({
      trips: [],
      bookings: [],
      assistantMessages: [],
      itinerary: [],
      expenses: [],
      packingList: [],
      ideas: [],
      activities: [],
      currency: 'USD', // default currency

      setCloudTrips: (cloudTrips) => set({ trips: cloudTrips }),

      addTrip: (tripData) => {
        const newId = 'trip_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
        const newTrip: Trip = {
          ...tripData,
          id: newId,
          currency: tripData.currency ?? get().currency, // inherit current global currency
        };

        const nowStr = 'Just now';
        const newActivity: ActivityLog = {
          id: 'act_' + crypto.randomUUID(),
          tripId: newId,
          user: 'You',
          action: 'created trip',
          target: tripData.title,
          time: nowStr,
        };

        set((state) => ({
          trips: [newTrip, ...state.trips],
          activities: [newActivity, ...state.activities.slice(0, 19)],
        }));

        // Fire & Forget: Sync to Cloud
        createTripOnServer(newTrip).catch(err => console.error("Failed to sync trip to server:", err));

        return newId;
      },

      deleteTrip: (id) => {
        set((state) => {
          const trip = state.trips.find((t) => t.id === id);
          return {
            trips: state.trips.filter((t) => t.id !== id),
            bookings: state.bookings.filter(b => b.tripId !== id),
            assistantMessages: state.assistantMessages.filter(m => m.tripId !== id),
            itinerary: state.itinerary.filter((i) => i.tripId !== id),
            expenses: state.expenses.filter((e) => e.tripId !== id),
            packingList: state.packingList.filter((p) => p.tripId !== id),
            ideas: state.ideas.filter((idea) => idea.tripId !== id),
            activities: trip
              ? [
                  {
                    id: 'act_' + crypto.randomUUID(),
                    user: 'You',
                    action: 'deleted trip',
                    target: trip.title,
                    time: 'Just now',
                  },
                  ...state.activities.slice(0, 19),
                ]
              : state.activities,
          };
        });

        // Fire & Forget: Sync to Cloud
        deleteTripOnServer(id).catch(err => console.error("Failed to delete trip from server:", err));
      },

      updateTrip: (id, updates) => {
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== id) return t;
            const budgetChanged = (updates.budget !== undefined && updates.budget !== t.budget) || (updates.currency !== undefined && updates.currency !== t.currency);
            return { ...t, ...(budgetChanged && !updates.budgetPlan ? { budgetPlan: undefined } : {}), ...updates };
          }),
        }));

        // Fire & Forget: Sync to Cloud
        updateTripOnServer(id, updates).catch(err => console.error("Failed to update trip on server:", err));
      },

      clearAllData: () =>
        set({
          trips: [],
          bookings: [],
          assistantMessages: [],
          itinerary: [],
          expenses: [],
          packingList: [],
          ideas: [],
          activities: [],
          currency: 'USD',
        }),

      setCurrency: (c) => set(() => ({ currency: c })),

      importData: (data) => {
        // Merge incoming data with existing store, preferring incoming values
        set((state) => ({
          ...state,
          // Ensure arrays are concatenated safely
          trips: data.trips ? [...data.trips] : state.trips,
          bookings: data.bookings ? [...data.bookings] : state.bookings,
          assistantMessages: data.assistantMessages ? [...data.assistantMessages] : state.assistantMessages,
          itinerary: data.itinerary ? [...data.itinerary] : state.itinerary,
          expenses: data.expenses ? [...data.expenses] : state.expenses,
          packingList: data.packingList ? [...data.packingList] : state.packingList,
          ideas: data.ideas ? [...data.ideas] : state.ideas,
          activities: data.activities ? [...data.activities] : state.activities,
          currency: data.currency ?? state.currency,
        }));
      },

      saveBooking: (data) => {
        const id = data.id || 'booking_' + crypto.randomUUID();
        const booking: Booking = { ...data, id };
        set(state => {
          const existingExpense = state.expenses.find(e => e.bookingId === id);
          const otherExpenses = state.expenses.filter(e => e.bookingId !== id);
          const linkedExpense: Expense = { id: existingExpense?.id || 'exp_' + crypto.randomUUID(), bookingId: id, tripId: data.tripId, title: data.title, amount: data.cost, paidBy: data.paidBy || 'You', category: data.kind, date: data.start.slice(0,10) };
          return {
            bookings: state.bookings.some(b => b.id === id) ? state.bookings.map(b => b.id === id ? booking : b) : [...state.bookings, booking],
            expenses: data.recordExpense && data.cost > 0 ? [linkedExpense,...otherExpenses] : otherExpenses,
          };
        });
        return id;
      },
      deleteBooking: (id) => set(state => ({
        bookings: state.bookings.filter(b => b.id !== id),
        itinerary: state.itinerary.map(i => i.bookingId === id ? { ...i, bookingId: undefined } : i),
        // Keep recorded payments when a reservation is removed.
        expenses: state.expenses.map(e => e.bookingId === id ? { ...e, bookingId: undefined } : e),
      })),
      addAssistantMessage: (message) => {
        const id = crypto.randomUUID();
        set(state => ({ assistantMessages: [...state.assistantMessages, { ...message, id, createdAt: new Date().toISOString() }].slice(-100) }));
        return id;
      },
      updateAssistantMessage: (id, updates) => set(state => ({ assistantMessages: state.assistantMessages.map(m => m.id === id ? { ...m, ...updates, id: m.id, tripId: m.tripId } : m) })),
      clearAssistantMessages: (tripId) => set(state => ({ assistantMessages: state.assistantMessages.filter(m => m.tripId !== tripId) })),

      // Itinerary management
      addItineraryItem: (itemData) => {
        const newItem: ItineraryItem = {
          ...itemData,
          id: 'itin_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        };

        const newActivity: ActivityLog = {
          id: 'act_' + crypto.randomUUID(),
          tripId: itemData.tripId,
          user: 'You',
          action: 'added plan',
          target: itemData.title,
          time: 'Just now',
        };

        set((state) => ({
          itinerary: [...state.itinerary, newItem],
          activities: [newActivity, ...state.activities.slice(0, 19)],
        }));
      },

      updateItineraryItem: (id, updates) => set(state => ({ itinerary: state.itinerary.map(item => item.id === id ? { ...item, ...updates } : item) })),

      deleteItineraryItem: (id) =>
        set((state) => ({
          itinerary: state.itinerary.filter((i) => i.id !== id),
        })),

      // Expense management
      addExpense: (expenseData) => {
        const newExpense: Expense = {
          ...expenseData,
          id: 'exp_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        };

        const newActivity: ActivityLog = {
          id: 'act_' + crypto.randomUUID(),
          tripId: expenseData.tripId,
          user: expenseData.paidBy || 'You',
          action: 'added expense for',
          target: `${expenseData.title} (${get().trips.find(t => t.id === expenseData.tripId)?.currency || get().currency} ${expenseData.amount})`,
          time: 'Just now',
        };

        set((state) => ({
          expenses: [newExpense, ...state.expenses],
          activities: [newActivity, ...state.activities.slice(0, 19)],
        }));
      },

      deleteExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
          bookings: state.bookings.map(b => state.expenses.some(e => e.id === id && e.bookingId === b.id) ? { ...b, recordExpense: false } : b),
        })),

      // Packing management
      addPackingItem: (itemData) => {
        const newItem: PackingItem = {
          ...itemData,
          id: 'pack_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
          isCompleted: false,
        };

        set((state) => ({
          packingList: [...state.packingList, newItem],
        }));
      },

      togglePackingItem: (id) =>
        set((state) => ({
          packingList: state.packingList.map((item) =>
            item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
          ),
        })),

      deletePackingItem: (id) =>
        set((state) => ({
          packingList: state.packingList.filter((p) => p.id !== id),
        })),

      // Ideas management
      addIdea: (ideaData) => {
        const newIdea: IdeaItem = {
          ...ideaData,
          id: 'idea_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
          votes: 1,
        };

        const newActivity: ActivityLog = {
          id: 'act_' + crypto.randomUUID(),
          tripId: ideaData.tripId,
          user: ideaData.author || 'You',
          action: 'suggested idea',
          target: ideaData.title,
          time: 'Just now',
        };

        set((state) => ({
          ideas: [newIdea, ...state.ideas],
          activities: [newActivity, ...state.activities.slice(0, 19)],
        }));
      },

      voteIdea: (id) =>
        set((state) => ({
          ideas: state.ideas.map((item) =>
            item.id === id ? { ...item, votes: item.votes + 1 } : item
          ),
        })),

      deleteIdea: (id) =>
        set((state) => ({
          ideas: state.ideas.filter((i) => i.id !== id),
        })),

      // Activity logger
      logActivity: (activity) =>
        set((state) => ({
          activities: [
            {
              ...activity,
              id: 'act_' + crypto.randomUUID(),
              time: 'Just now',
            },
            ...state.activities.slice(0, 19),
          ],
        })),
    }),
    {
      name: 'tourdibo-trip-storage-v2',
      storage: createJSONStorage(() => ({
        getItem: (name) => { try { return localStorage.getItem(name); } catch { return null; } },
        setItem: (name, value) => { try { localStorage.setItem(name, value); } catch {} },
        removeItem: (name) => { try { localStorage.removeItem(name); } catch {} },
      })),
      skipHydration: true,
    }
  )
);
