import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowRight,
  AlertTriangle,
  Calendar,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import {
  Rental,
  Customer,
  BookingStatus,
  FulfillmentStatus,
  PaymentStatus,
} from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface RentalsListViewProps {
  rentals: Rental[];
  customers: Customer[];
  onSelectRental: (rental: Rental) => void;
  onOpenCreateRental: () => void;
}

export const RentalsListView: React.FC<RentalsListViewProps> = ({
  rentals,
  customers,
  onSelectRental,
  onOpenCreateRental,
}) => {
  const { t, formatCurrency, formatDate, formatDateTime } = useI18n();

  const [search, setSearch] = useState('');
  const [filterBooking, setFilterBooking] = useState<string>('all');
  const [filterFulfillment, setFilterFulfillment] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');

  const now = new Date();

  const filteredRentals = useMemo(() => {
    return rentals.filter((rental) => {
      const cust = customers.find((c) => c.id === rental.customerId);
      const matchesSearch =
        rental.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
        (cust?.name && cust.name.toLowerCase().includes(search.toLowerCase())) ||
        rental.lines.some((l) => l.equipmentName.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterBooking !== 'all' && rental.bookingStatus !== filterBooking) return false;
      if (filterFulfillment !== 'all' && rental.fulfillmentStatus !== filterFulfillment) return false;
      if (filterPayment !== 'all' && rental.paymentStatus !== filterPayment) return false;

      return true;
    });
  }, [rentals, customers, search, filterBooking, filterFulfillment, filterPayment]);

  return (
    <div className="space-y-4">
      {/* Page Title & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-stone-900 tracking-tight">{t.rentals.title}</h1>
          <p className="text-xs text-stone-500">{t.rentals.subtitle}</p>
        </div>

        <button
          onClick={onOpenCreateRental}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E4D38] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#163B2B] transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{t.rentals.createRental}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-white">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par référence LOK-..., client, matériel..."
            className="w-full rounded-md border border-stone-200 pl-8 pr-3 py-1.5 text-xs bg-stone-50/50 outline-none focus:bg-white focus:border-[#1E4D38]"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Booking Status Filter */}
          <select
            value={filterBooking}
            onChange={(e) => setFilterBooking(e.target.value)}
            className="rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-700 outline-none"
          >
            <option value="all">Réservation : {t.rentals.all}</option>
            <option value="confirmed">{t.rentals.statusConfirmed}</option>
            <option value="quote">{t.rentals.statusQuote}</option>
            <option value="draft">{t.rentals.statusDraft}</option>
            <option value="cancelled">{t.rentals.statusCancelled}</option>
          </select>

          {/* Fulfillment Status Filter */}
          <select
            value={filterFulfillment}
            onChange={(e) => setFilterFulfillment(e.target.value)}
            className="rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-700 outline-none"
          >
            <option value="all">Matériel : {t.rentals.all}</option>
            <option value="not_picked_up">{t.rentals.fulfNotPicked}</option>
            <option value="partially_picked_up">{t.rentals.fulfPartPicked}</option>
            <option value="checked_out">{t.rentals.fulfCheckedOut}</option>
            <option value="partially_returned">{t.rentals.fulfPartReturned}</option>
            <option value="returned">{t.rentals.fulfReturned}</option>
          </select>

          {/* Payment Filter */}
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-700 outline-none"
          >
            <option value="all">Paiement : {t.rentals.all}</option>
            <option value="unpaid">{t.rentals.payUnpaid}</option>
            <option value="partially_paid">{t.rentals.payPartPaid}</option>
            <option value="paid">{t.rentals.payPaid}</option>
          </select>
        </div>
      </div>

      {/* Rentals Table */}
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold text-[11px]">
              <tr>
                <th className="p-3.5">{t.rentals.reference}</th>
                <th className="p-3.5">{t.rentals.customer}</th>
                <th className="p-3.5">{t.rentals.period}</th>
                <th className="p-3.5">{t.rentals.itemsCount}</th>
                <th className="p-3.5 text-right">{t.rentals.totalRental}</th>
                <th className="p-3.5 text-center">{t.rentals.bookingStatus}</th>
                <th className="p-3.5 text-center">{t.rentals.fulfillmentStatus}</th>
                <th className="p-3.5 text-center">{t.rentals.paymentStatus}</th>
                <th className="p-3.5 text-right">{t.rentals.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredRentals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-stone-400 italic">
                    {t.common.noData}
                  </td>
                </tr>
              ) : (
                filteredRentals.map((rental) => {
                  const cust = customers.find((c) => c.id === rental.customerId);
                  const plannedEnd = new Date(rental.endDate);
                  const isOverdue =
                    (rental.fulfillmentStatus === 'checked_out' ||
                      rental.fulfillmentStatus === 'partially_picked_up') &&
                    plannedEnd < now;

                  return (
                    <tr
                      key={rental.id}
                      onClick={() => onSelectRental(rental)}
                      className={`cursor-pointer transition-colors ${
                        isOverdue
                          ? 'bg-amber-50/30 hover:bg-amber-50/60'
                          : 'hover:bg-stone-50/80'
                      }`}
                    >
                      <td className="p-3.5 font-bold text-stone-900 whitespace-nowrap">
                        {rental.referenceNumber}
                      </td>
                      <td className="p-3.5 font-medium text-stone-800">
                        <div>{cust?.name || 'Client'}</div>
                        {cust?.cinOrIce && (
                          <div className="text-[10px] text-stone-400">{cust.cinOrIce}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-stone-600 whitespace-nowrap">
                        <div>{formatDate(rental.startDate)}</div>
                        <div className={`text-[10px] ${isOverdue ? 'text-amber-700 font-bold' : 'text-stone-400'}`}>
                          au {formatDate(rental.endDate)} {isOverdue && '⚠️ Retard'}
                        </div>
                      </td>
                      <td className="p-3.5 text-stone-700">
                        <span className="font-semibold">
                          {rental.lines.reduce((s, l) => s + l.quantity, 0)}
                        </span>{' '}
                        art. ({rental.lines.map((l) => l.equipmentName.slice(0, 18)).join(', ')}...)
                      </td>
                      <td className="p-3.5 text-right font-bold text-stone-900 whitespace-nowrap">
                        {formatCurrency(rental.rentalTotal)}
                        <div className="text-[10px] font-normal text-stone-400">
                          Caut: {formatCurrency(rental.depositRequired)}
                        </div>
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <StatusBadge type="booking" status={rental.bookingStatus} />
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <StatusBadge
                          type="fulfillment"
                          status={rental.fulfillmentStatus}
                          isOverdue={isOverdue}
                        />
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <StatusBadge type="payment" status={rental.paymentStatus} />
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E4D38] hover:underline">
                          <span>{t.rentals.viewDetails}</span>
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
