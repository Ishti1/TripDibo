import { useTripStore } from '@/store/useTripStore';

export function formatCurrency(value: number): string {
  const currency = useTripStore.getState().currency;
  // Use Intl API; fallback to USD if unsupported
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
  } catch (e) {
    console.warn('Unsupported currency', currency, e);
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);
  }
}
