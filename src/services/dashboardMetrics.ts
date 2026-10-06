import { Rental, RentalPayment } from '../types';

export const outstandingUnits = (rental: Rental): number =>
  rental.lines.reduce((sum, line) => sum + Math.max(0, line.pickedUpQuantity - line.returnedQuantity), 0);

export const isActiveBooking = (rental: Rental): boolean =>
  rental.bookingStatus !== 'cancelled' && rental.bookingStatus !== 'declined';

export function outstandingBalance(rentals: Rental[], payments: RentalPayment[]): number {
  const collected = new Map<string, number>();
  for (const payment of payments) {
    const amount = payment.type === 'rental_refund' ? -payment.amount : payment.amount;
    collected.set(payment.rentalId, (collected.get(payment.rentalId) || 0) + amount);
  }
  return rentals.filter(rental => rental.bookingStatus === 'confirmed').reduce((sum, rental) =>
    sum + Math.max(0, rental.rentalTotal - (collected.get(rental.id) || 0)), 0);
}

export function validRentalDates(start: string, end: string): boolean {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  return Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs;
}

export function localDateTimeValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
