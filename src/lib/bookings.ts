import type { Booking } from './planning-types';
export const bookingLabels = { hotel:'Hotel', flight:'Flight', bus:'Bus', train:'Train', car:'Car', other:'Other' };
export function bookingDate(value: string) {
  if (!value) return 'To be confirmed';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-US', { month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit' });
}
export function validBooking(booking: Omit<Booking,'id'|'tripId'>) {
  if (!booking.title.trim()) return 'Add a booking name.';
  if (!booking.start) return 'Add a check-in or departure date and time.';
  if (booking.end && booking.end < booking.start && booking.startTimezone === booking.endTimezone) return 'The end time must follow the start time in the same timezone.';
  if (!Number.isFinite(booking.cost) || booking.cost < 0) return 'The cost must be a valid positive amount or zero.';
  if (booking.url) { try { if (!['https:','http:'].includes(new URL(booking.url).protocol)) return 'Use an http or https booking link.'; } catch { return 'Enter a complete booking URL.'; } }
  return '';
}
