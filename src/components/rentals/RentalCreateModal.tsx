import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  User,
  Plus,
  Trash2,
  AlertCircle,
  Truck,
  CheckCircle2,
  DollarSign,
  Shield,
  Search,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import {
  Customer,
  Equipment,
  Rental,
  RentalLineItem,
  WorkspaceLocation,
  MaintenanceLog,
  BookingStatus,
} from '../../types';
import { localDateTimeValue, validRentalDates } from '../../services/dashboardMetrics';
import { Modal } from '../common/Modal';
import { calculateEquipmentAvailability } from '../../services/availabilityEngine';

interface RentalCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRental: (rental: Rental) => void;
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  equipmentList: Equipment[];
  locations: WorkspaceLocation[];
  allRentals: Rental[];
  allMaintenance: MaintenanceLog[];
  taxRateDefault: number;
  bufferHoursDefault: number;
}

export const RentalCreateModal: React.FC<RentalCreateModalProps> = ({
  isOpen,
  onClose,
  onSaveRental,
  customers,
  onAddCustomer,
  equipmentList,
  locations,
  allRentals,
  allMaintenance,
  taxRateDefault,
  bufferHoursDefault,
}) => {
  const { t, formatCurrency, language } = useI18n();

  // Helper dates: default starts tomorrow 09:00, ends 3 days later 18:00
  const getDefaultDates = () => {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(9, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 2);
    end.setHours(18, 0, 0, 0);

    return {
      startStr: localDateTimeValue(start),
      endStr: localDateTimeValue(end),
    };
  };

  const defaultDates = useMemo(getDefaultDates, []);

  // Form State
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerCinIce, setNewCustomerCinIce] = useState('');
  const [newCustomerType, setNewCustomerType] = useState<'individual' | 'company'>('individual');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');

  const [selectedLocationId, setSelectedLocationId] = useState<string>(locations[0]?.id || '');
  const [startDate, setStartDate] = useState(defaultDates.startStr);
  const [endDate, setEndDate] = useState(defaultDates.endStr);
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [applyTax, setApplyTax] = useState(true);
  const [internalNotes, setInternalNotes] = useState('');

  // Selected Basket Items
  const [selectedLines, setSelectedLines] = useState<
    {
      equipment: Equipment;
      quantity: number;
      pricingBasis: 'daily' | 'hourly' | 'weekly' | 'agreed_fixed';
      rateApplied: number;
    }[]
  >([]);

  // Search in equipment step
  const [equipmentSearch, setEquipmentSearch] = useState('');

  // Calculate billable days
  const billableDays = useMemo(() => {
    try {
      const s = new Date(startDate).getTime();
      const e = new Date(endDate).getTime();
      if (e <= s) return 1;
      const diffHours = (e - s) / (1000 * 60 * 60);
      return Math.max(1, Math.ceil(diffHours / 24));
    } catch {
      return 1;
    }
  }, [startDate, endDate]);

  // Handle Adding inline customer
  const handleCreateCustomer = () => {
    if (!newCustomerName || !newCustomerPhone) return;
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      workspaceId: 'ws-atlas-casa',
      name: newCustomerName,
      companyName: newCustomerType === 'company' ? newCustomerName : undefined,
      type: newCustomerType,
      phone: newCustomerPhone,
      cinOrIce: newCustomerCinIce,
      email: '',
      address: newCustomerAddress || 'Casablanca',
      city: 'Casablanca',
      createdAt: new Date().toISOString(),
    };
    onAddCustomer(newCust);
    setSelectedCustomerId(newCust.id);
    setShowNewCustomerForm(false);
  };

  // Add Item to basket
  const handleAddItem = (eq: Equipment) => {
    if (selectedLines.some((l) => l.equipment.id === eq.id)) return;
    setSelectedLines([
      ...selectedLines,
      {
        equipment: eq,
        quantity: 1,
        pricingBasis: 'daily',
        rateApplied: eq.dailyRate,
      },
    ]);
  };

  const handleUpdateItemQuantity = (index: number, newQty: number) => {
    const updated = [...selectedLines];
    updated[index].quantity = Math.max(1, newQty);
    setSelectedLines(updated);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedLines(selectedLines.filter((_, i) => i !== index));
  };

  // Availability calculations for current dates
  const availabilityMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculateEquipmentAvailability>>();
    equipmentList.forEach((eq) => {
      const avail = calculateEquipmentAvailability(
        eq,
        startDate,
        endDate,
        allRentals,
        allMaintenance,
        bufferHoursDefault
      );
      map.set(eq.id, avail);
    });
    return map;
  }, [equipmentList, startDate, endDate, allRentals, allMaintenance, bufferHoursDefault]);

  // Check if any item in basket exceeds available stock
  const hasAvailabilityConflict = useMemo(() => {
    return selectedLines.some((line) => {
      const avail = availabilityMap.get(line.equipment.id);
      return !avail || line.quantity > avail.availableQuantity;
    });
  }, [selectedLines, availabilityMap]);

  const datesValid = validRentalDates(startDate, endDate);
  const canChooseEquipment = Boolean(selectedCustomerId && selectedLocationId && datesValid && (deliveryType !== 'delivery' || deliveryAddress.trim()));
  const canReview = canChooseEquipment && selectedLines.length > 0 && !hasAvailabilityConflict;
  const dateError = language === 'en' ? 'Choose an end date after the start date.' : language === 'ar' ? 'اختر تاريخ نهاية بعد تاريخ البداية.' : 'Choisissez une date de fin après la date de début.';

  // Totals calculations
  const itemsSubtotal = useMemo(() => {
    return selectedLines.reduce((sum, line) => {
      let multiplier = billableDays;
      if (line.pricingBasis === 'agreed_fixed') multiplier = 1;
      else if (line.pricingBasis === 'weekly') multiplier = Math.max(1, Math.ceil(billableDays / 7));
      return sum + line.rateApplied * line.quantity * multiplier;
    }, 0);
  }, [selectedLines, billableDays]);

  const taxAmount = applyTax ? Math.round((itemsSubtotal + deliveryFee - discountAmount) * (taxRateDefault / 100)) : 0;
  const rentalGrandTotal = Math.max(0, itemsSubtotal + deliveryFee - discountAmount + taxAmount);

  const securityDepositRequired = useMemo(() => {
    return selectedLines.reduce((sum, line) => {
      const depPerUnit = line.equipment.suggestedDeposit || Math.round(line.equipment.replacementValue * 0.25);
      return sum + depPerUnit * line.quantity;
    }, 0);
  }, [selectedLines]);

  // Final submission
  const handleSubmit = (bookingStatus: BookingStatus) => {
    if (!canReview) return;

    const refNumber = `LOK-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const lines: RentalLineItem[] = selectedLines.map((item, idx) => {
      let billableUnits = billableDays;
      if (item.pricingBasis === 'agreed_fixed') billableUnits = 1;
      else if (item.pricingBasis === 'weekly') billableUnits = Math.max(1, Math.ceil(billableDays / 7));

      const depUnit = item.equipment.suggestedDeposit || Math.round(item.equipment.replacementValue * 0.25);

      // Pre-assign first available units if individual
      let assignedUnits: string[] | undefined = undefined;
      if (item.equipment.trackingMode === 'individual') {
        const avail = availabilityMap.get(item.equipment.id);
        if (avail?.availableUnitIds) {
          assignedUnits = avail.availableUnitIds.slice(0, item.quantity);
        }
      }

      return {
        id: `line-${Date.now()}-${idx}`,
        equipmentId: item.equipment.id,
        equipmentName: item.equipment.name,
        imageUrl: item.equipment.imageUrl,
        trackingMode: item.equipment.trackingMode,
        quantity: item.quantity,
        assignedUnitIds: assignedUnits,
        pricingBasis: item.pricingBasis,
        rateApplied: item.rateApplied,
        billableUnitsCount: billableUnits,
        lineTotal: item.rateApplied * item.quantity * billableUnits,
        depositPerUnit: depUnit,
        lineDepositTotal: depUnit * item.quantity,
        pickedUpQuantity: 0,
        returnedQuantity: 0,
        damagedQuantity: 0,
      };
    });

    const newRental: Rental = {
      id: `rent-${Date.now()}`,
      referenceNumber: refNumber,
      workspaceId: 'ws-atlas-casa',
      customerId: selectedCustomerId,
      locationId: selectedLocationId,
      startDate,
      endDate,
      deliveryType,
      deliveryAddress: deliveryType === 'delivery' ? deliveryAddress : undefined,
      deliveryFee,
      otherCharges: 0,
      discountAmount,
      taxRate: applyTax ? taxRateDefault : 0,
      taxAmount,
      rentalTotal: rentalGrandTotal,
      depositRequired: securityDepositRequired,
      bookingStatus,
      fulfillmentStatus: 'not_picked_up',
      paymentStatus: 'unpaid',
      lines,
      pickups: [],
      returns: [],
      internalNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveRental(newRental);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.rentalCreate.title}
      subtitle="Contrat numéroté · Calcul en temps réel de disponibilité et caution"
      maxWidth="4xl"
    >
      {/* Steps Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-5 text-xs font-semibold">
        <button
          onClick={() => setStep(1)}
          className={`flex items-center gap-1.5 pb-1 border-b-2 transition-all ${
            step === 1 ? 'border-[#1E4D38] text-[#1E4D38]' : 'border-transparent text-stone-400'
          }`}
        >
          <span>{t.rentalCreate.step1}</span>
        </button>
        <button
          onClick={() => setStep(2)} disabled={!selectedCustomerId}
          className={`flex items-center gap-1.5 pb-1 border-b-2 transition-all ${
            step === 2 ? 'border-[#1E4D38] text-[#1E4D38]' : 'border-transparent text-stone-400'
          }`}
        >
          <span>{t.rentalCreate.step2}</span>
        </button>
        <button
          onClick={() => setStep(3)} disabled={!canChooseEquipment}
          className={`flex items-center gap-1.5 pb-1 border-b-2 transition-all ${
            step === 3 ? 'border-[#1E4D38] text-[#1E4D38]' : 'border-transparent text-stone-400'
          }`}
        >
          <span>{t.rentalCreate.step3} ({selectedLines.length})</span>
        </button>
        <button
          onClick={() => setStep(4)} disabled={!canReview}
          className={`flex items-center gap-1.5 pb-1 border-b-2 transition-all ${
            step === 4 ? 'border-[#1E4D38] text-[#1E4D38]' : 'border-transparent text-stone-400'
          }`}
        >
          <span>{t.rentalCreate.step4} & {t.rentalCreate.step5}</span>
        </button>
      </div>

      {/* STEP 1: Client */}
      {step === 1 && (
        <div className="space-y-4">
          {!showNewCustomerForm ? (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-stone-700">
                {t.rentalCreate.selectCustomer}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-1">
                {customers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    className={`cursor-pointer p-3 rounded-lg border text-xs transition-all ${
                      selectedCustomerId === c.id
                        ? 'border-[#1E4D38] bg-emerald-50/50 shadow-2xs font-medium'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="font-semibold text-stone-900">{c.name}</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {c.phone} {c.cinOrIce && `· ${c.cinOrIce}`}
                    </div>
                    <div className="text-[10px] text-stone-400 mt-1">{c.address}</div>
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerForm(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E4D38] hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t.rentalCreate.orCreateCustomer}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900">{t.rentalCreate.orCreateCustomer}</span>
                <button
                  type="button"
                  onClick={() => setShowNewCustomerForm(false)}
                  className="text-xs text-stone-500 hover:underline"
                >
                  Choisir un client existant
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Type de client</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewCustomerType('individual')}
                      className={`flex-1 py-1.5 rounded-md border text-xs font-medium ${
                        newCustomerType === 'individual' ? 'bg-white border-[#1E4D38] text-[#1E4D38]' : 'border-stone-200 text-stone-600'
                      }`}
                    >
                      Particulier
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCustomerType('company')}
                      className={`flex-1 py-1.5 rounded-md border text-xs font-medium ${
                        newCustomerType === 'company' ? 'bg-white border-[#1E4D38] text-[#1E4D38]' : 'border-stone-200 text-stone-600'
                      }`}
                    >
                      Entreprise
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Nom / Raison Sociale *</label>
                  <input
                    type="text"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="ex. Atlas BTP ou Karim El Fassi"
                    className="w-full rounded-md border border-stone-200 px-3 py-1.5 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Téléphone portable *</label>
                  <input
                    type="text"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="+212 6 XX XX XX XX"
                    className="w-full rounded-md border border-stone-200 px-3 py-1.5 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">CIN ou ICE</label>
                  <input
                    type="text"
                    value={newCustomerCinIce}
                    onChange={(e) => setNewCustomerCinIce(e.target.value)}
                    placeholder="CIN: BE123456 ou ICE: 00..."
                    className="w-full rounded-md border border-stone-200 px-3 py-1.5 text-xs bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-medium text-stone-700 mb-1">Adresse</label>
                  <input
                    type="text"
                    value={newCustomerAddress}
                    onChange={(e) => setNewCustomerAddress(e.target.value)}
                    placeholder="Adresse complète au Maroc"
                    className="w-full rounded-md border border-stone-200 px-3 py-1.5 text-xs bg-white"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleCreateCustomer}
                  className="rounded-lg bg-[#1E4D38] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#163B2B]"
                >
                  Créer et sélectionner ce client
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!selectedCustomerId}
              className="rounded-lg bg-[#1E4D38] px-4 py-2 text-xs font-semibold text-white hover:bg-[#163B2B] disabled:opacity-40"
            >
              Étape suivante : Période & Lieu →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Période & Lieu */}
      {step === 2 && !datesValid && <p role="alert" className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{dateError}</p>}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                {t.rentalCreate.pickupDate}
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-stone-200 p-2 text-xs bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                {t.rentalCreate.returnDate}
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border border-stone-200 p-2 text-xs bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                {t.rentalCreate.location}
              </label>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="w-full rounded-md border border-stone-200 p-2 text-xs bg-white"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Durée calculée
              </label>
              <div className="p-2 rounded-md bg-stone-100 text-stone-800 font-semibold">
                {billableDays} jour(s) facturable(s) (avec tampon de {bufferHoursDefault}h inclus)
              </div>
            </div>
          </div>

          {/* Delivery or Pickup */}
          <div className="rounded-xl border border-stone-200 p-3 bg-stone-50/50 space-y-3 text-xs">
            <label className="block font-semibold text-stone-700">Mode de remise</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deliveryType"
                  checked={deliveryType === 'pickup'}
                  onChange={() => setDeliveryType('pickup')}
                />
                <span>{t.rentalCreate.pickupAtShop}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deliveryType"
                  checked={deliveryType === 'delivery'}
                  onChange={() => setDeliveryType('delivery')}
                />
                <span>{t.rentalCreate.deliveryToSite}</span>
              </label>
            </div>

            {deliveryType === 'delivery' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-medium text-stone-600 mb-1">
                    {t.rentalCreate.deliveryAddress}
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="ex. Chantier Marina Casablanca"
                    className="w-full rounded-md border border-stone-200 p-1.5 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-600 mb-1">
                    {t.rentalCreate.deliveryFee}
                  </label>
                  <input
                    type="number"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-md border border-stone-200 p-1.5 bg-white text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-stone-600 hover:underline"
            >
              ← Retour au client
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!canChooseEquipment}
              className="rounded-lg bg-[#1E4D38] px-4 py-2 text-xs font-semibold text-white hover:bg-[#163B2B]"
            >
              Étape suivante : Choix du matériel →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Sélection du matériel avec disponibilité en direct */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={equipmentSearch}
              onChange={(e) => setEquipmentSearch(e.target.value)}
              placeholder="Filtrer parmi les matériels..."
              className="w-full rounded-lg border border-stone-200 pl-9 pr-3 py-1.5 text-xs bg-white outline-none focus:border-[#1E4D38]"
            />
          </div>

          {/* Equipment Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-1">
            {equipmentList
              .filter((eq) => eq.name.toLowerCase().includes(equipmentSearch.toLowerCase()))
              .map((eq) => {
                const avail = availabilityMap.get(eq.id);
                const isSelected = selectedLines.some((l) => l.equipment.id === eq.id);
                const availableQty = avail?.availableQuantity || 0;
                const canAdd = availableQty > 0 && !isSelected;

                return (
                  <div
                    key={eq.id}
                    className={`p-3 rounded-lg border text-xs flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-emerald-300 bg-emerald-50/40'
                        : availableQty === 0
                        ? 'border-stone-200 bg-stone-50/80 opacity-70'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-stone-900 leading-snug">{eq.name}</span>
                        <span className="text-[11px] font-bold text-[#1E4D38] whitespace-nowrap">
                          {formatCurrency(eq.dailyRate)} / j
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-500 mt-1">
                        {eq.sku || eq.category} · Caution : {formatCurrency(eq.suggestedDeposit)}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                      <div className="text-[11px]">
                        {availableQty > 0 ? (
                          <span className="text-emerald-700 font-medium">
                            {availableQty} disponible(s) sur ce créneau
                          </span>
                        ) : (
                          <span className="text-red-700 font-medium">
                            Stock épuisé / en maintenance
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={!canAdd}
                        onClick={() => handleAddItem(eq)}
                        className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'bg-stone-200 text-stone-600'
                            : canAdd
                            ? 'bg-[#1E4D38] text-white hover:bg-[#163B2B]'
                            : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                        }`}
                      >
                        {isSelected ? 'Ajouté' : 'Ajouter'}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Selected Items summary table */}
          {selectedLines.length > 0 && (
            <div className="rounded-xl border border-stone-200 p-3 bg-stone-50/50 space-y-2">
              <div className="text-xs font-bold text-stone-800">
                Matériels sélectionnés ({selectedLines.length})
              </div>
              <div className="space-y-2">
                {selectedLines.map((line, idx) => {
                  const avail = availabilityMap.get(line.equipment.id);
                  const isExceeded = avail && line.quantity > avail.availableQuantity;

                  return (
                    <div
                      key={line.equipment.id}
                      className={`p-2 rounded-lg bg-white border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        isExceeded ? 'border-red-400 bg-red-50/30' : 'border-stone-200'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-stone-900">{line.equipment.name}</div>
                        <div className="text-[11px] text-stone-500">
                          {line.equipment.trackingMode === 'individual'
                            ? 'Unité(s) sérialisée(s)'
                            : 'Stock quantitatif'}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <label className="text-[11px] text-stone-500">Qté :</label>
                          <input
                            type="number"
                            min="1"
                            max={avail?.availableQuantity || 999}
                            value={line.quantity}
                            onChange={(e) => handleUpdateItemQuantity(idx, parseInt(e.target.value) || 1)}
                            className="w-16 rounded border border-stone-200 p-1 text-center font-semibold text-xs"
                          />
                        </div>

                        <div className="text-right">
                          <div className="font-semibold text-stone-800">
                            {formatCurrency(line.rateApplied * line.quantity * billableDays)}
                          </div>
                          <div className="text-[10px] text-stone-400">
                            ({formatCurrency(line.rateApplied)} x {billableDays}j)
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-stone-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasAvailabilityConflict && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{t.rentalCreate.availabilityConflict}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-xs text-stone-600 hover:underline"
            >
              ← Retour aux dates
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              disabled={!canReview}
              className="rounded-lg bg-[#1E4D38] px-4 py-2 text-xs font-semibold text-white hover:bg-[#163B2B] disabled:opacity-40"
            >
              Étape suivante : Récapitulatif & Tarifs →
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Récapitulatif financier & Enregistrement */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Financial Ledger Breakdown */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 space-y-2.5 text-xs">
              <div className="font-bold text-stone-900 border-b border-stone-200 pb-2">
                Décomposition financière
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Sous-total équipements ({billableDays} jours) :</span>
                <span className="font-medium text-stone-900">{formatCurrency(itemsSubtotal)}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>Frais de livraison :</span>
                  <span className="font-medium text-stone-900">{formatCurrency(deliveryFee)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Remise commerciale accordée :</span>
                  <span className="font-medium">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>TVA ({applyTax ? `${taxRateDefault}%` : '0%'}) :</span>
                <span className="font-medium text-stone-900">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-bold text-stone-900">
                <span>{t.rentalCreate.summaryRentalTotal} :</span>
                <span className="text-[#1E4D38]">{formatCurrency(rentalGrandTotal)}</span>
              </div>

              {/* Security Deposit Separated Callout */}
              <div className="mt-3 p-3 rounded-lg border border-amber-200 bg-amber-50/60 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Shield className="h-4 w-4 text-amber-700" />
                  <span>{t.rentalCreate.summaryDepositRequired}</span>
                </div>
                <div className="mt-1 text-sm font-bold text-amber-950">
                  {formatCurrency(securityDepositRequired)}
                </div>
                <p className="text-[11px] text-amber-800 mt-1">
                  Exigible à la mise à disposition (chèque, espèces ou pré-autorisation). Séparée des revenus locatifs.
                </p>
              </div>
            </div>

            {/* Adjustments: Discount, Tax toggle, Notes */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  {t.rentalCreate.discount}
                </label>
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-md border border-stone-200 p-2 bg-white text-xs"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-700">
                  <input
                    type="checkbox"
                    checked={applyTax}
                    onChange={(e) => setApplyTax(e.target.checked)}
                    className="rounded"
                  />
                  <span>Appliquer la TVA marocaine ({taxRateDefault}%)</span>
                </label>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  {t.rentalCreate.internalNotes}
                </label>
                <textarea
                  rows={3}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Notes sur la commande, bon de commande client, etc."
                  className="w-full rounded-md border border-stone-200 p-2 bg-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Action buttons: Draft, Quote, Confirm */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="text-xs text-stone-600 hover:underline"
            >
              ← Modifier la sélection
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSubmit('draft')} disabled={!canReview}
                className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                {t.rentalCreate.saveDraft}
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('quote')} disabled={!canReview}
                className="rounded-lg border border-blue-200 bg-blue-50/60 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100"
              >
                {t.rentalCreate.saveQuote}
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('confirmed')} disabled={!canReview}
                className="rounded-lg bg-[#1E4D38] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#163B2B]"
              >
                {t.rentalCreate.confirmBooking}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
