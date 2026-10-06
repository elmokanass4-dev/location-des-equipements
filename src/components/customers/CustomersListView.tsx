import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  MessageSquare,
  Building,
  User,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { Customer, Rental, RentalPayment, DepositLedgerEntry } from '../../types';
import { CustomerDetailModal } from './CustomerDetailModal';
import { Modal } from '../common/Modal';

interface CustomersListViewProps {
  customers: Customer[];
  rentals: Rental[];
  payments: RentalPayment[];
  deposits: DepositLedgerEntry[];
  onAddCustomer: (customer: Customer) => void;
  onSelectRental: (rental: Rental) => void;
  onNewRentalForCustomer: (customer: Customer) => void;
}

export const CustomersListView: React.FC<CustomersListViewProps> = ({
  customers,
  rentals,
  payments,
  deposits,
  onAddCustomer,
  onSelectRental,
  onNewRentalForCustomer,
}) => {
  const { t, formatCurrency } = useI18n();

  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Customer Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<'individual' | 'company'>('company');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [cinOrIce, setCinOrIce] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Casablanca');
  const [notes, setNotes] = useState('');

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.cinOrIce && c.cinOrIce.toLowerCase().includes(q)) ||
        c.phone.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q)
      );
    });
  }, [customers, search]);

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      workspaceId: 'ws-atlas-casa',
      name,
      companyName: type === 'company' ? name : undefined,
      type,
      contactPerson: contactPerson || undefined,
      phone,
      whatsapp: whatsapp || phone,
      email,
      cinOrIce: cinOrIce || undefined,
      address: address || 'Casablanca',
      city: city || 'Casablanca',
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
    };

    onAddCustomer(newCust);
    setIsAddModalOpen(false);
    // Reset form
    setName('');
    setPhone('');
    setCinOrIce('');
    setAddress('');
    setNotes('');
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-stone-900 tracking-tight">{t.customers.title}</h1>
          <p className="text-xs text-stone-500">{t.customers.subtitle}</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E4D38] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#163B2B] self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{t.customers.addCustomer}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-white">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.customers.searchPlaceholder}
            className="w-full rounded-md border border-stone-200 pl-8 pr-3 py-1.5 text-xs bg-stone-50/50 outline-none focus:bg-white focus:border-[#1E4D38]"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold text-[11px]">
              <tr>
                <th className="p-3.5">Client / Entreprise</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Identifiant fiscal / CIN</th>
                <th className="p-3.5">Téléphone</th>
                <th className="p-3.5 text-center">Dossiers</th>
                <th className="p-3.5 text-right">Solde dû</th>
                <th className="p-3.5 text-right">Cautions actives</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400 italic">
                    {t.common.noData}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const custRentals = rentals.filter((r) => r.customerId === cust.id);
                  const custRentalIds = new Set(custRentals.map((r) => r.id));

                  const totalBilled = custRentals
                    .filter((r) => r.bookingStatus !== 'cancelled' && r.bookingStatus !== 'declined')
                    .reduce((s, r) => s + r.rentalTotal, 0);

                  const totalPaid = payments
                    .filter((p) => custRentalIds.has(p.rentalId) && p.type === 'rental_charge_payment')
                    .reduce((s, p) => s + p.amount, 0);

                  const balanceOwed = Math.max(0, totalBilled - totalPaid);

                  const depositsHeld = deposits
                    .filter((d) => custRentalIds.has(d.rentalId))
                    .reduce((bal, d) => {
                      if (d.type === 'deposit_received') return bal + d.amount;
                      if (d.type === 'deposit_refunded' || d.type === 'deposit_deducted_for_damage') return bal - d.amount;
                      return bal;
                    }, 0);

                  return (
                    <tr
                      key={cust.id}
                      onClick={() => setSelectedCustomer(cust)}
                      className="cursor-pointer hover:bg-stone-50/80 transition-colors"
                    >
                      <td className="p-3.5 font-semibold text-stone-900">
                        <div>{cust.name}</div>
                        <div className="text-[10px] text-stone-400 font-normal">
                          {cust.city} · {cust.address}
                        </div>
                      </td>
                      <td className="p-3.5 text-stone-600">
                        {cust.type === 'company' ? (
                          <span className="text-stone-800 font-medium">Entreprise</span>
                        ) : (
                          <span>Particulier</span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-stone-600">
                        {cust.cinOrIce || '—'}
                      </td>
                      <td className="p-3.5 text-stone-700 whitespace-nowrap">
                        {cust.phone}
                      </td>
                      <td className="p-3.5 text-center font-bold text-stone-800">
                        {custRentals.length}
                      </td>
                      <td className="p-3.5 text-right font-semibold whitespace-nowrap">
                        {balanceOwed > 0 ? (
                          <span className="text-red-700">{formatCurrency(balanceOwed)}</span>
                        ) : (
                          <span className="text-emerald-700">0,00 MAD</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right text-stone-700 whitespace-nowrap">
                        {depositsHeld > 0 ? (
                          <span className="text-amber-900 font-semibold">{formatCurrency(depositsHeld)}</span>
                        ) : (
                          <span className="text-stone-400">0,00 MAD</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E4D38] hover:underline">
                          <span>Détails</span>
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

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          isOpen={Boolean(selectedCustomer)}
          onClose={() => setSelectedCustomer(null)}
          customer={selectedCustomer}
          rentals={rentals}
          payments={payments}
          deposits={deposits}
          onSelectRental={onSelectRental}
          onNewRentalForCustomer={onNewRentalForCustomer}
        />
      )}

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Nouveau compte client"
          subtitle="Particulier ou professionnel marocain (CIN / ICE)"
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Type de client</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setType('company')}
                    className={`flex-1 py-1.5 rounded border text-xs font-semibold ${
                      type === 'company' ? 'bg-[#1E4D38] text-white border-[#1E4D38]' : 'bg-white border-stone-200 text-stone-700'
                    }`}
                  >
                    Entreprise (SARL / SA)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('individual')}
                    className={`flex-1 py-1.5 rounded border text-xs font-semibold ${
                      type === 'individual' ? 'bg-[#1E4D38] text-white border-[#1E4D38]' : 'bg-white border-stone-200 text-stone-700'
                    }`}
                  >
                    Particulier
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  {type === 'company' ? 'Raison Sociale *' : 'Nom et Prénom *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex. Atlas BTP ou Karim El Mansouri"
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  {type === 'company' ? 'Identifiant Commun de l’Entreprise (ICE)' : 'Numéro de Carte Nationale (CIN)'}
                </label>
                <input
                  type="text"
                  value={cinOrIce}
                  onChange={(e) => setCinOrIce(e.target.value)}
                  placeholder={type === 'company' ? 'ICE: 002987123000045' : 'CIN: BE123456'}
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Téléphone mobile *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+212 6 XX XX XX XX"
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Numéro WhatsApp</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+212 6 XX XX XX XX"
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@entreprise.ma"
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-stone-700 mb-1">Adresse</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Adresse du siège ou chantier"
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg border border-stone-200 px-3 py-1.5 text-stone-700 hover:bg-stone-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#1E4D38] px-4 py-1.5 font-semibold text-white hover:bg-[#163B2B]"
              >
                Enregistrer le client
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
