import React, { useState, useMemo } from 'react';
import {
  Store,
  Calendar,
  Search,
  ShoppingBag,
  Plus,
  Trash2,
  CheckCircle2,
  MessageSquare,
  Shield,
  Clock,
  Send,
  Sparkles,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import {
  Equipment,
  WorkspaceSettings,
  PublicBookingRequest,
  Rental,
  MaintenanceLog,
} from '../../types';
import { calculateEquipmentAvailability } from '../../services/availabilityEngine';

interface PublicCatalogueViewProps {
  settings: WorkspaceSettings;
  equipmentList: Equipment[];
  allRentals: Rental[];
  allMaintenance: MaintenanceLog[];
  onSubmitBookingRequest: (req: PublicBookingRequest) => void;
}

export const PublicCatalogueView: React.FC<PublicCatalogueViewProps> = ({
  settings,
  equipmentList,
  allRentals,
  allMaintenance,
  onSubmitBookingRequest,
}) => {
  const { language, t, formatCurrency, formatDate } = useI18n();

  // Search & Categories
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Dates selection for availability check
  const getDefaultDates = () => {
    const s = new Date();
    s.setDate(s.getDate() + 2);
    s.setHours(9, 0, 0, 0);

    const e = new Date(s);
    e.setDate(e.getDate() + 2);
    e.setHours(18, 0, 0, 0);

    return {
      startStr: s.toISOString().slice(0, 16),
      endStr: e.toISOString().slice(0, 16),
    };
  };

  const [startDate, setStartDate] = useState(getDefaultDates().startStr);
  const [endDate, setEndDate] = useState(getDefaultDates().endStr);

  // Cart / Basket
  const [basket, setBasket] = useState<{ equipment: Equipment; quantity: number }[]>([]);

  // Checkout form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerCity, setCustomerCity] = useState('Casablanca');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [isSuccessSubmitted, setIsSuccessSubmitted] = useState(false);

  // Billable days
  const billableDays = useMemo(() => {
    try {
      const s = new Date(startDate).getTime();
      const e = new Date(endDate).getTime();
      if (e <= s) return 1;
      return Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)));
    } catch {
      return 1;
    }
  }, [startDate, endDate]);

  // Catalog visible equipment
  const visibleEquipment = useMemo(() => {
    return equipmentList.filter((eq) => eq.isCatalogueVisible && !eq.isArchived);
  }, [equipmentList]);

  // Live availability for selected dates
  const availabilityMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculateEquipmentAvailability>>();
    visibleEquipment.forEach((eq) => {
      const avail = calculateEquipmentAvailability(
        eq,
        startDate,
        endDate,
        allRentals,
        allMaintenance,
        settings.turnaroundBufferHours
      );
      map.set(eq.id, avail);
    });
    return map;
  }, [visibleEquipment, startDate, endDate, allRentals, allMaintenance, settings.turnaroundBufferHours]);

  // Filtered equipment
  const filteredEquipment = useMemo(() => {
    return visibleEquipment.filter((eq) => {
      const q = search.toLowerCase();
      const matchesSearch =
        eq.name.toLowerCase().includes(q) ||
        eq.description.toLowerCase().includes(q) ||
        eq.tags.some((t) => t.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (selectedCategory !== 'all' && eq.category !== selectedCategory) return false;
      return true;
    });
  }, [visibleEquipment, search, selectedCategory]);

  const handleAddToBasket = (eq: Equipment) => {
    const existing = basket.find((b) => b.equipment.id === eq.id);
    const avail = availabilityMap.get(eq.id);
    const maxAvail = avail?.availableQuantity || 0;

    if (existing) {
      if (existing.quantity < maxAvail) {
        setBasket(
          basket.map((b) =>
            b.equipment.id === eq.id ? { ...b, quantity: b.quantity + 1 } : b
          )
        );
      }
    } else {
      if (maxAvail > 0) {
        setBasket([...basket, { equipment: eq, quantity: 1 }]);
      }
    }
  };

  const handleRemoveFromBasket = (eqId: string) => {
    setBasket(basket.filter((b) => b.equipment.id !== eqId));
  };

  const basketEstimatedTotal = useMemo(() => {
    return basket.reduce((sum, item) => sum + item.equipment.dailyRate * item.quantity * billableDays, 0);
  }, [basket, billableDays]);

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || basket.length === 0) return;

    const newRequest: PublicBookingRequest = {
      id: `req-pub-${Date.now()}`,
      workspaceId: settings.id,
      customerName,
      phone: customerPhone,
      email: customerEmail,
      city: customerCity,
      deliveryType,
      deliveryAddress: deliveryType === 'delivery' ? deliveryAddress : undefined,
      startDate,
      endDate,
      items: basket.map((b) => ({
        equipmentId: b.equipment.id,
        equipmentName: b.equipment.name,
        quantity: b.quantity,
        dailyRate: b.equipment.dailyRate,
      })),
      notes: requestNotes,
      status: 'pending_review',
      estimatedTotal: basketEstimatedTotal,
      createdAt: new Date().toISOString(),
    };

    onSubmitBookingRequest(newRequest);
    setIsSuccessSubmitted(true);
    setBasket([]);
  };

  return (
    <div className="space-y-6">
      {/* Internal Staff Preview Bar */}
      <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3 text-xs text-stone-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-[#1E4D38]" />
          <span>{t.catalogue.storefrontNotice}</span>
        </div>
        <div className="font-semibold text-emerald-800">Vitrine en ligne active</div>
      </div>

      {/* Branded Storefront Hero Banner */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E4D38]">
              Catalogue & Réservations en ligne
            </span>
            <h1 className="text-2xl font-bold text-stone-900 mt-1 tracking-tight">
              {settings.businessName}
            </h1>
            <p className="text-xs text-stone-600 mt-1 max-w-xl">{settings.tagline}</p>
            <div className="text-[11px] text-stone-500 mt-2">
              📍 {settings.address}, {settings.city} · ⏱ {settings.openingHours}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}?text=Bonjour%20${encodeURIComponent(settings.businessName)},%20je%20souhaite%20des%20renseignements%20sur%20vos%20locations...`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 font-semibold text-xs text-white hover:bg-emerald-700 shadow-2xs transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{t.catalogue.contactOnWhatsApp}</span>
            </a>
          </div>
        </div>

        {/* Date Selector for Customer availability check */}
        <div className="mt-6 pt-6 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Date et heure de début souhaitée
            </label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-stone-200 p-2 text-xs bg-stone-50/50"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Date et heure de fin souhaitée
            </label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-stone-200 p-2 text-xs bg-stone-50/50"
            />
          </div>
          <div className="flex flex-col justify-end">
            <div className="p-2 rounded-lg bg-stone-100 text-stone-700 text-xs font-medium">
              Durée calculée : <strong className="text-stone-900">{billableDays} jour(s)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Storefront Equipment Catalog + Basket Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Equipment Catalog */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Category Pills */}
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-stone-200 bg-white">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.catalogue.searchEquip}
                className="w-full rounded-md border border-stone-200 pl-8 pr-3 py-1.5 text-xs bg-stone-50/50 outline-none focus:bg-white focus:border-[#1E4D38]"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-700 outline-none"
            >
              <option value="all">Toutes catégories</option>
              <option value="construction">BTP & Outillage</option>
              <option value="events">Événementiel & Mobilier</option>
              <option value="audiovisual">Audiovisuel & Caméras</option>
              <option value="cleaning">Nettoyage professionnel</option>
              <option value="gardening">Espaces verts</option>
            </select>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredEquipment.map((eq) => {
              const avail = availabilityMap.get(eq.id);
              const availableQty = avail?.availableQuantity || 0;
              const isAvailable = availableQty > 0;

              return (
                <div
                  key={eq.id}
                  className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    {eq.imageUrl && (
                      <img
                        src={eq.imageUrl}
                        alt={eq.name}
                        className="w-full h-36 object-cover border-b border-stone-100"
                      />
                    )}
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-stone-900 text-xs leading-snug">{eq.name}</h3>
                        <span className="font-bold text-[#1E4D38] text-xs whitespace-nowrap">
                          {formatCurrency(eq.dailyRate)} / j
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 line-clamp-2">{eq.description}</p>
                      <div className="text-[10px] text-stone-400">
                        Caution requise : {formatCurrency(eq.suggestedDeposit)}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-stone-100 mt-2 flex items-center justify-between">
                    <div>
                      {isAvailable ? (
                        <span className="text-[11px] font-semibold text-emerald-700">
                          ✓ {availableQty} disponible(s)
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-red-700">
                          Indisponible pour ces dates
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => handleAddToBasket(eq)}
                      className="rounded-lg bg-[#1E4D38] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#163B2B] disabled:opacity-40 shadow-2xs"
                    >
                      Ajouter au panier
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Basket & Booking Request Form */}
        <div>
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-2xs space-y-4 text-xs sticky top-20">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <span className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                <ShoppingBag className="h-4 w-4 text-[#1E4D38]" />
                {t.catalogue.requestBasket} ({basket.length})
              </span>
              {basket.length > 0 && (
                <button
                  type="button"
                  onClick={() => setBasket([])}
                  className="text-[11px] text-stone-400 hover:text-stone-700"
                >
                  Vider
                </button>
              )}
            </div>

            {/* Success alert */}
            {isSuccessSubmitted && (
              <div className="p-3.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  Demande envoyée avec succès !
                </div>
                <p className="text-[11px] text-emerald-800">
                  Notre équipe va examiner votre demande et vous contacter au numéro indiqué pour confirmer la réservation.
                </p>
              </div>
            )}

            {basket.length === 0 ? (
              <p className="text-stone-400 italic py-4 text-center">{t.catalogue.emptyBasket}</p>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {basket.map((item) => (
                    <div
                      key={item.equipment.id}
                      className="p-2.5 rounded-lg border border-stone-100 bg-stone-50/60 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-stone-900">{item.equipment.name}</div>
                        <div className="text-[10px] text-stone-400">
                          {item.quantity} x {formatCurrency(item.equipment.dailyRate)} / jour
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-800">
                          {formatCurrency(item.equipment.dailyRate * item.quantity * billableDays)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromBasket(item.equipment.id)}
                          className="p-1 text-stone-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-stone-900">
                  <span>Total estimé ({billableDays} jours) :</span>
                  <span className="text-[#1E4D38] text-sm">{formatCurrency(basketEstimatedTotal)}</span>
                </div>

                {/* Request form */}
                <form onSubmit={handleSubmitRequest} className="space-y-2.5 pt-2">
                  <div>
                    <label className="block font-medium text-stone-700 mb-0.5">Votre nom complet *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nom et prénom"
                      className="w-full rounded border border-stone-200 p-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-0.5">Téléphone / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+212 6 XX XX XX XX"
                      className="w-full rounded border border-stone-200 p-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-0.5">Email</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="votre.email@domaine.ma"
                      className="w-full rounded border border-stone-200 p-1.5 text-xs"
                    />
                  </div>

                  {/* Disclaimer notice */}
                  <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-[10px] text-amber-900 leading-tight">
                    {t.catalogue.requestDisclaimer}
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[#1E4D38] py-2 text-xs font-semibold text-white hover:bg-[#163B2B] shadow-xs"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{t.catalogue.submitRequest}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
