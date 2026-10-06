export type Language = 'fr' | 'ar' | 'en';

export type UserRole = 'owner' | 'manager' | 'staff' | 'accountant';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface WorkspaceLocation {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  isPrimary: boolean;
}

export interface WorkspaceSettings {
  id: string;
  businessName: string;
  businessType: string;
  tagline: string;
  logoUrl?: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  country: string;
  currency: string; // e.g. "MAD"
  timezone: string; // e.g. "Africa/Casablanca"
  language: Language;
  openingHours: string;
  taxRate: number; // e.g. 20 for 20% TVA or 0
  taxEnabled: boolean;
  defaultDepositPercentage: number; // e.g. 30% of value
  turnaroundBufferHours: number; // e.g. 2 hours buffer
  contractTermsFr: string;
  contractTermsAr: string;
  documentPrefixes: {
    quote: string;
    contract: string;
    pickup: string;
    returnDoc: string;
    receipt: string;
    invoice: string;
  };
  subscriptionPlan: 'starter' | 'pro' | 'business';
}

export type EquipmentCategory =
  | 'construction'
  | 'events'
  | 'audiovisual'
  | 'cleaning'
  | 'gardening'
  | 'sports'
  | 'custom';

export type TrackingMode = 'individual' | 'quantity';

export interface AssetUnit {
  id: string;
  assetNumber: string; // e.g. "CAM-001"
  serialNumber?: string;
  condition: 'excellent' | 'good' | 'fair' | 'damaged' | 'in_maintenance';
  status: 'available' | 'rented' | 'maintenance' | 'retired';
  notes?: string;
}

export interface Equipment {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  category: EquipmentCategory;
  categoryCustomName?: string;
  tags: string[];
  imageUrl: string;
  trackingMode: TrackingMode;
  locationId: string;
  sku?: string;
  // Rates
  hourlyRate?: number;
  dailyRate: number;
  weeklyRate?: number;
  // Quantities & Value
  replacementValue: number;
  suggestedDeposit: number;
  minimumRentalDays: number;
  turnaroundBufferHours: number;
  // Tracking
  totalQuantity: number; // For quantity mode, total owned
  units?: AssetUnit[]; // For individual mode, specific serialized units
  isCatalogueVisible: boolean;
  isArchived?: boolean;
  internalNotes?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  workspaceId: string;
  type: 'individual' | 'company';
  name: string;
  companyName?: string;
  cinOrIce?: string; // Moroccan CIN (National ID) or ICE (Business identifier)
  contactPerson?: string;
  phone: string;
  whatsapp?: string;
  email: string;
  address: string;
  city: string;
  notes?: string;
  createdAt: string;
}

export type BookingStatus = 'draft' | 'quote' | 'confirmed' | 'cancelled' | 'declined';
export type FulfillmentStatus = 'not_picked_up' | 'partially_picked_up' | 'checked_out' | 'partially_returned' | 'returned' | 'closed';
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'refund_due';

export interface RentalLineItem {
  id: string;
  equipmentId: string;
  equipmentName: string;
  imageUrl?: string;
  trackingMode: TrackingMode;
  quantity: number;
  assignedUnitIds?: string[]; // IDs of assigned units if individual tracking
  pricingBasis: 'daily' | 'hourly' | 'weekly' | 'agreed_fixed';
  rateApplied: number;
  billableUnitsCount: number;
  lineTotal: number;
  depositPerUnit: number;
  lineDepositTotal: number;
  // Fulfillment tracking per item
  pickedUpQuantity: number;
  returnedQuantity: number;
  damagedQuantity: number;
}

export interface PickupRecord {
  id: string;
  timestamp: string;
  performedBy: string;
  items: {
    lineItemId: string;
    quantity: number;
    unitIds?: string[];
  }[];
  conditionNotes?: string;
  conditionPhotoUrls?: string[];
  customerSignatureName?: string;
}

export interface ReturnRecord {
  id: string;
  timestamp: string;
  performedBy: string;
  items: {
    lineItemId: string;
    quantityReturnedGood: number;
    quantityReturnedDamaged: number;
    quantityMissing: number;
    unitIds?: string[];
  }[];
  conditionNotes?: string;
  damageNotes?: string;
  damageAssessedFee?: number;
  conditionPhotoUrls?: string[];
  routedToMaintenance: boolean;
}

export interface RentalPayment {
  id: string;
  rentalId: string;
  type: 'rental_charge_payment' | 'rental_refund';
  amount: number;
  method: 'cash' | 'bank_transfer' | 'card_external' | 'cheque' | 'deposit_application';
  reference?: string;
  recordedBy: string;
  notes?: string;
  createdAt: string;
}

export interface DepositLedgerEntry {
  id: string;
  rentalId: string;
  type: 'deposit_received' | 'deposit_refunded' | 'deposit_deducted_for_damage';
  amount: number;
  method: 'cash' | 'bank_transfer' | 'cheque_hold' | 'card_preauth';
  reference?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export interface Rental {
  id: string;
  referenceNumber: string; // e.g. "LOK-2026-0042"
  workspaceId: string;
  customerId: string;
  locationId: string;
  startDate: string; // ISO string e.g. "2026-10-08T09:00:00"
  endDate: string; // ISO string e.g. "2026-10-10T18:00:00"
  actualPickupDate?: string;
  actualReturnDate?: string;
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  deliveryFee: number;
  otherCharges: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  rentalTotal: number; // Charges total: items + delivery + other - discount + tax
  depositRequired: number; // Security deposit amount (separate from rental revenue)
  bookingStatus: BookingStatus;
  fulfillmentStatus: FulfillmentStatus;
  paymentStatus: PaymentStatus;
  lines: RentalLineItem[];
  pickups: PickupRecord[];
  returns: ReturnRecord[];
  internalNotes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceLog {
  id: string;
  workspaceId: string;
  equipmentId: string;
  equipmentName: string;
  unitId?: string; // If individual unit
  affectedQuantity: number;
  issueDescription: string;
  photoUrl?: string;
  startDate: string;
  expectedCompletionDate: string;
  actualCompletionDate?: string;
  responsibleParty: string;
  estimatedCost: number;
  actualCost?: number;
  status: 'diagnosing' | 'in_repair' | 'waiting_parts' | 'resolved';
  resolutionNotes?: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  workspaceId: string;
  entityType: 'rental' | 'equipment' | 'customer' | 'payment' | 'deposit' | 'maintenance';
  entityId: string;
  action: string;
  details: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface PublicBookingRequest {
  id: string;
  workspaceId: string;
  customerName: string;
  phone: string;
  email: string;
  city: string;
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  startDate: string;
  endDate: string;
  items: {
    equipmentId: string;
    equipmentName: string;
    quantity: number;
    dailyRate: number;
  }[];
  notes?: string;
  status: 'pending_review' | 'converted' | 'declined';
  estimatedTotal: number;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  type: 'pickup_due' | 'return_due' | 'overdue' | 'maintenance_conflict' | 'unpaid_balance' | 'public_request';
  title: string;
  message: string;
  rentalId?: string;
  equipmentId?: string;
  severity: 'info' | 'warning' | 'urgent';
  createdAt: string;
  isRead: boolean;
}
