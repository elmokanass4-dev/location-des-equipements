import React from 'react';
import { BookingStatus, FulfillmentStatus, PaymentStatus } from '../../types';
import { useI18n } from '../../i18n/context';

interface StatusBadgeProps {
  type: 'booking' | 'fulfillment' | 'payment';
  status: BookingStatus | FulfillmentStatus | PaymentStatus;
  isOverdue?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, status, isOverdue }) => {
  const { t } = useI18n();

  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        {t.rentals.overdueBadge}
      </span>
    );
  }

  // Booking statuses
  if (type === 'booking') {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            {t.rentals.statusConfirmed}
          </span>
        );
      case 'quote':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            {t.rentals.statusQuote}
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600">
            <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
            {t.rentals.statusDraft}
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            {t.rentals.statusCancelled}
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500">
            <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
            {t.rentals.statusDeclined}
          </span>
        );
    }
  }

  // Fulfillment statuses
  if (type === 'fulfillment') {
    switch (status) {
      case 'not_picked_up':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600">
            <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
            {t.rentals.fulfNotPicked}
          </span>
        );
      case 'partially_picked_up':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {t.rentals.fulfPartPicked}
          </span>
        );
      case 'checked_out':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            {t.rentals.fulfCheckedOut}
          </span>
        );
      case 'partially_returned':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {t.rentals.fulfPartReturned}
          </span>
        );
      case 'returned':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-800">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
            {t.rentals.fulfReturned}
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500">
            <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
            {t.rentals.fulfClosed}
          </span>
        );
    }
  }

  // Payment statuses
  if (type === 'payment') {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            {t.rentals.payPaid}
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {t.rentals.payPartPaid}
          </span>
        );
      case 'unpaid':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            {t.rentals.payUnpaid}
          </span>
        );
      case 'refund_due':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-700">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            {t.rentals.payRefundDue}
          </span>
        );
    }
  }

  return <span className="text-xs text-stone-600">{status}</span>;
};
