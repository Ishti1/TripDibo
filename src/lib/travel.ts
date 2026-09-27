import { Trip } from '@/store/useTripStore';

export const covers = [
  { name: 'Coast', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85' },
  { name: 'Mountains', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85' },
  { name: 'City', url: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Desert', url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=85' },
];
export const inspirations = [
  { title: 'A little vitamin sea', destination: 'Bali, Indonesia', tag: 'SLOW DAYS, SALTY AIR', cover: 0, style: 'Relaxed', days: 5 },
  { title: 'Take the scenic route', destination: 'Dolomites, Italy', tag: 'FRESH AIR, NEW PERSPECTIVES', cover: 1, style: 'Adventure', days: 7 },
  { title: 'Get lost. Find something.', destination: 'New York, USA', tag: 'BIG CITY, LITTLE DISCOVERIES', cover: 2, style: 'Culture', days: 4 },
];
export function localDate(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
export function dateLabel(value?: string) { return value ? new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible dates'; }
export function tripStatus(trip: Trip) {
  const today = localDate();
  if (trip.endDate && trip.endDate < today) return 'Past';
  if (trip.startDate && trip.startDate <= today && (!trip.endDate || trip.endDate >= today)) return 'Ongoing';
  return 'Upcoming';
}
export function money(amount: number, currency = 'USD') { try { return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount); } catch { return `${amount.toFixed(2)} ${currency}`; } }
export function downloadFile(name: string, content: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
