import {
  WorkspaceSettings,
  WorkspaceLocation,
  User,
  Equipment,
  Customer,
  Rental,
  RentalPayment,
  DepositLedgerEntry,
  MaintenanceLog,
  AuditEvent,
  PublicBookingRequest,
  NotificationItem,
} from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'kriya_settings',
  LOCATIONS: 'kriya_locations',
  USERS: 'kriya_users',
  ACTIVE_USER: 'kriya_active_user',
  EQUIPMENT: 'kriya_equipment',
  CUSTOMERS: 'kriya_customers',
  RENTALS: 'kriya_rentals',
  PAYMENTS: 'kriya_payments',
  DEPOSITS: 'kriya_deposits',
  MAINTENANCE: 'kriya_maintenance',
  AUDIT: 'kriya_audit',
  PUBLIC_REQUESTS: 'kriya_public_requests',
  NOTIFICATIONS: 'kriya_notifications',
};

// Default Workspace Settings (Morocco initial market)
export const initialSettings: WorkspaceSettings = {
  id: 'ws-atlas-casa',
  businessName: 'Atlas Matériel & Location SARL',
  businessType: 'Location Multimédia, Événement & Outillage BTP',
  tagline: 'Solutions complètes de location pour professionnels et particuliers à Casablanca & Maroc',
  logoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=160&auto=format&fit=crop&q=80',
  phone: '+212 5 22 98 45 60',
  whatsapp: '+212 6 61 45 89 20',
  email: 'contact@atlaslocation.ma',
  address: 'Lotissement Al Qods, Sidi Maârouf',
  city: 'Casablanca',
  country: 'Maroc',
  currency: 'MAD',
  timezone: 'Africa/Casablanca',
  language: 'fr',
  openingHours: 'Lun - Sam: 08:00 - 19:00',
  taxRate: 20,
  taxEnabled: true,
  defaultDepositPercentage: 25,
  turnaroundBufferHours: 2,
  contractTermsFr:
    'Le locataire reconnaît avoir reçu le matériel propre, en parfait état de fonctionnement avec tous ses accessoires. La restitution doit intervenir à la date et heure convenues. Toute journée supplémentaire sera facturée au tarif journalier en vigueur. La caution ne sera restituée qu’après inspection complète du matériel.',
  contractTermsAr:
    'يقر المستأجر باستلامه المعدات بحالة تشغيلية ممتازة ونظيفة مرفقة بجميع ملحقاتها. يجب إرجاع المعدات في التاريخ والساعة المحددين في العقد. أي تأخير غير متفق عليه يحتسب بسعر اليوم الكامل. لا يتم إرجاع مبلغ الضمان المالي إلا بعد الفحص الشامل للمعدات والتأكد من سلامتها.',
  documentPrefixes: {
    quote: 'DEV-2026-',
    contract: 'CTR-2026-',
    pickup: 'BST-2026-',
    returnDoc: 'BRT-2026-',
    receipt: 'REC-2026-',
    invoice: 'FAC-2026-',
  },
  subscriptionPlan: 'pro',
};

export const initialLocations: WorkspaceLocation[] = [
  {
    id: 'loc-casa-principal',
    name: 'Casablanca - Dépôt Principal Sidi Maârouf',
    city: 'Casablanca',
    address: 'Lotissement Al Qods, Sidi Maârouf',
    phone: '+212 5 22 98 45 60',
    isPrimary: true,
  },
  {
    id: 'loc-kech-gueliz',
    name: 'Marrakech - Agence Guéliz',
    city: 'Marrakech',
    address: 'Boulevard Mohamed V, Guéliz',
    phone: '+212 5 24 43 12 80',
    isPrimary: false,
  },
];

export const initialUsers: User[] = [
  {
    id: 'usr-1',
    name: 'Yassine Tazi',
    email: 'yassine@atlaslocation.ma',
    role: 'owner',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-2',
    name: 'Sofia Berrada',
    email: 'sofia.operations@atlaslocation.ma',
    role: 'manager',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=96&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-3',
    name: 'Amine Alaoui',
    email: 'amine.comptoir@atlaslocation.ma',
    role: 'staff',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-4',
    name: 'Meryem Kabbaj',
    email: 'meryem.finance@atlaslocation.ma',
    role: 'accountant',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=96&auto=format&fit=crop&q=80',
  },
];

export const initialCustomers: Customer[] = [
  {
    id: 'cust-1',
    workspaceId: 'ws-atlas-casa',
    type: 'company',
    name: 'BTP Atlas Travaux SARL',
    companyName: 'BTP Atlas Travaux SARL',
    cinOrIce: 'ICE: 002498712000034',
    contactPerson: 'Karim Bouzidi (Chef de chantier)',
    phone: '+212 6 61 12 34 56',
    whatsapp: '+212 6 61 12 34 56',
    email: 'chantier@btpatlas.ma',
    address: 'Zone Industrielle Ain Sebaa, Casablanca',
    city: 'Casablanca',
    notes: 'Client régulier gros œuvre. Dépôt de garantie par chèque société.',
    createdAt: '2026-08-10T10:00:00Z',
  },
  {
    id: 'cust-2',
    workspaceId: 'ws-atlas-casa',
    type: 'company',
    name: 'Prestige Events & Mariages Maroc',
    companyName: 'Prestige Events & Mariages Maroc',
    cinOrIce: 'ICE: 001984532000088',
    contactPerson: 'Leila Bennani (Directrice)',
    phone: '+212 6 63 98 76 54',
    whatsapp: '+212 6 63 98 76 54',
    email: 'contact@prestigeevents.ma',
    address: 'Hivernage, Marrakech',
    city: 'Marrakech',
    notes: 'Exige un état irréprochable sur le mobilier et chapiteaux.',
    createdAt: '2026-08-20T14:30:00Z',
  },
  {
    id: 'cust-3',
    workspaceId: 'ws-atlas-casa',
    type: 'individual',
    name: 'Hamza El Mansouri',
    cinOrIce: 'CIN: BE451092',
    phone: '+212 6 75 44 22 11',
    whatsapp: '+212 6 75 44 22 11',
    email: 'hamza.filmmaker@gmail.com',
    address: 'Quartier Palmier, Casablanca',
    city: 'Casablanca',
    notes: 'Réalisateur indépendant et photographe publicité.',
    createdAt: '2026-09-05T09:15:00Z',
  },
  {
    id: 'cust-4',
    workspaceId: 'ws-atlas-casa',
    type: 'company',
    name: 'CleanPro Services Maroc',
    companyName: 'CleanPro Services Maroc',
    cinOrIce: 'ICE: 003112445000012',
    contactPerson: 'Rachid Tlemçani',
    phone: '+212 6 60 77 88 99',
    whatsapp: '+212 6 60 77 88 99',
    email: 'logistique@cleanpro.ma',
    address: 'Bd Abdelmoumen, Casablanca',
    city: 'Casablanca',
    notes: 'Société de nettoyage industriel fin de chantier.',
    createdAt: '2026-09-12T11:00:00Z',
  },
];

export const initialEquipment: Equipment[] = [
  // 1. Individually Tracked Asset: BOSCH Marteau Piqueur (Construction)
  {
    id: 'eq-bosch-gsh11',
    workspaceId: 'ws-atlas-casa',
    name: 'Marteau Piqueur Démolisseur BOSCH GSH 11 VC (1700W)',
    description: 'Marteau de démolition SDS-Max avec force de frappe de 23 J. Livré en coffret avec 2 pointes et 1 burin large.',
    category: 'construction',
    tags: ['BTP', 'Démolition', 'Béton', 'SDS-Max'],
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
    trackingMode: 'individual',
    locationId: 'loc-casa-principal',
    sku: 'BOSCH-GSH11-01',
    dailyRate: 350,
    hourlyRate: 60,
    weeklyRate: 1800,
    replacementValue: 9500,
    suggestedDeposit: 3000,
    minimumRentalDays: 1,
    turnaroundBufferHours: 2,
    totalQuantity: 3,
    units: [
      {
        id: 'u-gsh11-01',
        assetNumber: 'BTP-MP-001',
        serialNumber: 'SN-BSH-884129',
        condition: 'excellent',
        status: 'available',
        notes: 'Dernière révision charbons effectuée le 15 Septembre.',
      },
      {
        id: 'u-gsh11-02',
        assetNumber: 'BTP-MP-002',
        serialNumber: 'SN-BSH-884130',
        condition: 'good',
        status: 'rented',
        notes: 'Actuellement sur chantier BTP Atlas Travaux.',
      },
      {
        id: 'u-gsh11-03',
        assetNumber: 'BTP-MP-003',
        serialNumber: 'SN-BSH-884131',
        condition: 'good',
        status: 'available',
        notes: 'Contrôle câblage OK.',
      },
    ],
    isCatalogueVisible: true,
    createdAt: '2026-08-01T08:00:00Z',
  },

  // 2. Quantity Stock: Chaises Napoléon Blanches (Events)
  {
    id: 'eq-chaises-napoleon',
    workspaceId: 'ws-atlas-casa',
    name: 'Chaises Napoléon III Blanches en Polycarbonate',
    description: 'Chaises de réception haut de gamme avec galette d’assise blanche amovible en velours ou simili cuir.',
    category: 'events',
    tags: ['Mobilier', 'Mariage', 'Réception', 'Événementiel'],
    imageUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&auto=format&fit=crop&q=80',
    trackingMode: 'quantity',
    locationId: 'loc-casa-principal',
    sku: 'EVT-CHS-NAP',
    dailyRate: 18,
    weeklyRate: 80,
    replacementValue: 350,
    suggestedDeposit: 50,
    minimumRentalDays: 1,
    turnaroundBufferHours: 3,
    totalQuantity: 150,
    isCatalogueVisible: true,
    createdAt: '2026-08-01T08:00:00Z',
  },

  // 3. Individually Tracked Asset: Sony FX3 Cinema Line (Audiovisual)
  {
    id: 'eq-sony-fx3',
    workspaceId: 'ws-atlas-casa',
    name: 'Caméra Sony FX3 Cinema Line 4K 120p Full-Frame',
    description: 'Caméra cinéma avec capteur 4K plein format, double base ISO, poignée audio XLR, 3 batteries et 2 cartes CFexpress Type A 160Go.',
    category: 'audiovisual',
    tags: ['Cinéma', 'Vidéo 4K', 'Plein Format', 'Sony'],
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80',
    trackingMode: 'individual',
    locationId: 'loc-casa-principal',
    sku: 'AV-SNY-FX3',
    dailyRate: 1200,
    weeklyRate: 6000,
    replacementValue: 42000,
    suggestedDeposit: 15000,
    minimumRentalDays: 1,
    turnaroundBufferHours: 2,
    totalQuantity: 2,
    units: [
      {
        id: 'u-fx3-01',
        assetNumber: 'CAM-FX3-001',
        serialNumber: 'SN-SNY-4029188',
        condition: 'excellent',
        status: 'rented',
        notes: 'Capteur nettoyé. Livré en valise étanche Peli Case 1510.',
      },
      {
        id: 'u-fx3-02',
        assetNumber: 'CAM-FX3-002',
        serialNumber: 'SN-SNY-4029189',
        condition: 'excellent',
        status: 'available',
        notes: 'Firmware 4.0 à jour.',
      },
    ],
    isCatalogueVisible: true,
    createdAt: '2026-08-05T09:00:00Z',
  },

  // 4. Individually Tracked Asset: Nettoyeur Haute Pression Kärcher HD 9/20 (Cleaning)
  {
    id: 'eq-karcher-hd9',
    workspaceId: 'ws-atlas-casa',
    name: 'Nettoyeur Haute Pression Kärcher Professionnel HD 9/20-4 M (200 bars)',
    description: 'Nettoyeur eau froide triphasé haute pression 200 bars avec flexible renforcé 15m, lance rotative et buse triple.',
    category: 'cleaning',
    tags: ['Nettoyage', 'Haute Pression', 'Chantier', 'Industrie'],
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80',
    trackingMode: 'individual',
    locationId: 'loc-casa-principal',
    sku: 'CLN-KRC-HD9',
    dailyRate: 450,
    weeklyRate: 2200,
    replacementValue: 18500,
    suggestedDeposit: 5000,
    minimumRentalDays: 1,
    turnaroundBufferHours: 2,
    totalQuantity: 2,
    units: [
      {
        id: 'u-krc-01',
        assetNumber: 'CLN-HP-001',
        serialNumber: 'SN-KRC-712891',
        condition: 'good',
        status: 'available',
        notes: 'Pression testée conforme.',
      },
      {
        id: 'u-krc-02',
        assetNumber: 'CLN-HP-002',
        serialNumber: 'SN-KRC-712892',
        condition: 'damaged',
        status: 'maintenance',
        notes: 'Flexible fissuré suite à retour chantier. En attente de remplacement.',
      },
    ],
    isCatalogueVisible: true,
    createdAt: '2026-08-10T10:00:00Z',
  },

  // 5. Quantity Stock: Échafaudage Roulant Aluminium 6m (Construction)
  {
    id: 'eq-echafaudage-6m',
    workspaceId: 'ws-atlas-casa',
    name: 'Échafaudage Roulant Aluminium Hauteur de Travail 6m',
    description: 'Structure modulaire en aluminium avec plateaux à trappe, 4 stabilisateurs et roues à double frein conforme norme EN 1004.',
    category: 'construction',
    tags: ['Échafaudage', 'BTP', 'Hauteur', 'Sécurité'],
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=600&auto=format&fit=crop&q=80',
    trackingMode: 'quantity',
    locationId: 'loc-casa-principal',
    sku: 'BTP-ECH-6M',
    dailyRate: 280,
    weeklyRate: 1400,
    replacementValue: 16000,
    suggestedDeposit: 4000,
    minimumRentalDays: 2,
    turnaroundBufferHours: 3,
    totalQuantity: 5,
    isCatalogueVisible: true,
    createdAt: '2026-08-15T11:00:00Z',
  },

  // 6. Quantity Stock: Enceintes JBL Amplifiées (Events & Audiovisual)
  {
    id: 'eq-jbl-eon715',
    workspaceId: 'ws-atlas-casa',
    name: 'Système Sonore : Enceinte Amplifiée JBL EON 715 (1300W)',
    description: 'Enceinte large bande 15 pouces avec DSP intégré, Bluetooth et entrées combo XLR/Jack. Livrée avec pied d’enceinte télescopique.',
    category: 'events',
    tags: ['Sonorisation', 'Audio', 'JBL', 'Soirée'],
    imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80',
    trackingMode: 'quantity',
    locationId: 'loc-casa-principal',
    sku: 'EVT-SON-JBL715',
    dailyRate: 220,
    weeklyRate: 1100,
    replacementValue: 7200,
    suggestedDeposit: 2500,
    minimumRentalDays: 1,
    turnaroundBufferHours: 2,
    totalQuantity: 8,
    isCatalogueVisible: true,
    createdAt: '2026-08-18T14:00:00Z',
  },

  // 7. Individually Tracked Asset: Tronçonneuse Thermique Stihl (Gardening)
  {
    id: 'eq-stihl-ms261',
    workspaceId: 'ws-atlas-casa',
    name: 'Tronçonneuse Professionnelle Stihl MS 261 C-M (Guide 45cm)',
    description: 'Tronçonneuse thermique pour abattage et ébranchage intensif. Système M-Tronic et carter magnésium. Fournie avec équipement de protection.',
    category: 'gardening',
    tags: ['Jardinage', 'Élagage', 'Stihl', 'Espaces Verts'],
    imageUrl: 'https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?w=600&auto=format&fit=crop&q=80',
    trackingMode: 'individual',
    locationId: 'loc-casa-principal',
    sku: 'GAR-STL-MS261',
    dailyRate: 300,
    weeklyRate: 1500,
    replacementValue: 8900,
    suggestedDeposit: 3000,
    minimumRentalDays: 1,
    turnaroundBufferHours: 2,
    totalQuantity: 2,
    units: [
      {
        id: 'u-stl-01',
        assetNumber: 'EV-TRON-001',
        serialNumber: 'SN-STL-298311',
        condition: 'good',
        status: 'available',
        notes: 'Chaîne affûtée.',
      },
      {
        id: 'u-stl-02',
        assetNumber: 'EV-TRON-002',
        serialNumber: 'SN-STL-298312',
        condition: 'good',
        status: 'available',
        notes: 'Filtre à air neuf.',
      },
    ],
    isCatalogueVisible: true,
    createdAt: '2026-08-20T10:00:00Z',
  },
];

// Helper to construct dynamic dates around the current runtime
const now = new Date();
const toIso = (daysOffset: number, hours: number = 9): string => {
  const d = new Date(now);
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hours, 0, 0, 0);
  return d.toISOString();
};

export const initialRentals: Rental[] = [
  // 1. OVERDUE RENTAL: Sony FX3 camera rented to Hamza El Mansouri, was due yesterday at 18:00
  {
    id: 'rent-overdue-01',
    referenceNumber: 'LOK-2026-0041',
    workspaceId: 'ws-atlas-casa',
    customerId: 'cust-3',
    locationId: 'loc-casa-principal',
    startDate: toIso(-3, 9),
    endDate: toIso(-1, 18), // Expired yesterday!
    actualPickupDate: toIso(-3, 9),
    deliveryType: 'pickup',
    deliveryFee: 0,
    otherCharges: 0,
    discountAmount: 0,
    taxRate: 20,
    taxAmount: 480,
    rentalTotal: 2880, // (2 days * 1200) + 20% TVA = 2880 MAD
    depositRequired: 15000,
    bookingStatus: 'confirmed',
    fulfillmentStatus: 'checked_out', // Still checked out -> Overdue!
    paymentStatus: 'paid', // Rental fee paid, deposit held
    lines: [
      {
        id: 'line-ovd-1',
        equipmentId: 'eq-sony-fx3',
        equipmentName: 'Caméra Sony FX3 Cinema Line 4K 120p Full-Frame',
        trackingMode: 'individual',
        quantity: 1,
        assignedUnitIds: ['u-fx3-01'],
        pricingBasis: 'daily',
        rateApplied: 1200,
        billableUnitsCount: 2,
        lineTotal: 2400,
        depositPerUnit: 15000,
        lineDepositTotal: 15000,
        pickedUpQuantity: 1,
        returnedQuantity: 0,
        damagedQuantity: 0,
      },
    ],
    pickups: [
      {
        id: 'pk-ovd-1',
        timestamp: toIso(-3, 9),
        performedBy: 'Amine Alaoui',
        items: [{ lineItemId: 'line-ovd-1', quantity: 1, unitIds: ['u-fx3-01'] }],
        conditionNotes: 'Matériel en état neuf remis avec housse et chargeur double.',
        customerSignatureName: 'Hamza El Mansouri',
      },
    ],
    returns: [],
    internalNotes: 'Tournage spot publicitaire Sidi Bouzid. Client relancé ce matin par téléphone pour restitution.',
    createdAt: toIso(-5, 11),
    updatedAt: toIso(-1, 19),
  },

  // 2. ACTIVE RENTAL WITH PARTIAL PICKUP & PARTIAL RETURN: Chaises Napoléon to Prestige Events
  {
    id: 'rent-active-chairs',
    referenceNumber: 'LOK-2026-0042',
    workspaceId: 'ws-atlas-casa',
    customerId: 'cust-2',
    locationId: 'loc-casa-principal',
    startDate: toIso(-1, 10),
    endDate: toIso(2, 17),
    actualPickupDate: toIso(-1, 11),
    deliveryType: 'delivery',
    deliveryAddress: 'Palais Namaskar, Palmeraie Marrakech',
    deliveryFee: 500,
    otherCharges: 0,
    discountAmount: 100,
    taxRate: 20,
    taxAmount: 1100,
    rentalTotal: 6600,
    depositRequired: 5000,
    bookingStatus: 'confirmed',
    fulfillmentStatus: 'partially_returned', // Some returned, some still with client!
    paymentStatus: 'partially_paid',
    lines: [
      {
        id: 'line-act-1',
        equipmentId: 'eq-chaises-napoleon',
        equipmentName: 'Chaises Napoléon III Blanches en Polycarbonate',
        trackingMode: 'quantity',
        quantity: 100,
        pricingBasis: 'daily',
        rateApplied: 18,
        billableUnitsCount: 3,
        lineTotal: 5400,
        depositPerUnit: 50,
        lineDepositTotal: 5000,
        pickedUpQuantity: 100,
        returnedQuantity: 40, // 40 returned early, 60 still at venue
        damagedQuantity: 0,
      },
    ],
    pickups: [
      {
        id: 'pk-act-1',
        timestamp: toIso(-1, 11),
        performedBy: 'Amine Alaoui',
        items: [{ lineItemId: 'line-act-1', quantity: 100 }],
        conditionNotes: '100 chaises chargées en camion avec housses de protection.',
        customerSignatureName: 'Leila Bennani',
      },
    ],
    returns: [
      {
        id: 'rt-act-1',
        timestamp: toIso(0, 8),
        performedBy: 'Amine Alaoui',
        items: [{ lineItemId: 'line-act-1', quantityReturnedGood: 40, quantityReturnedDamaged: 0, quantityMissing: 0 }],
        conditionNotes: 'Premier lot de 40 chaises rapatrié en parfait état.',
        routedToMaintenance: false,
      },
    ],
    internalNotes: 'Grand mariage à Marrakech. Le reste (60 chaises) sera restitué le surlendemain.',
    createdAt: toIso(-4, 15),
    updatedAt: toIso(0, 9),
  },

  // 3. UPCOMING RESERVATION: BOSCH Marteau Piqueur for BTP Atlas Travaux starting tomorrow
  {
    id: 'rent-upcoming-btp',
    referenceNumber: 'LOK-2026-0043',
    workspaceId: 'ws-atlas-casa',
    customerId: 'cust-1',
    locationId: 'loc-casa-principal',
    startDate: toIso(1, 8),
    endDate: toIso(4, 18),
    deliveryType: 'pickup',
    deliveryFee: 0,
    otherCharges: 0,
    discountAmount: 150,
    taxRate: 20,
    taxAmount: 432,
    rentalTotal: 2592,
    depositRequired: 3000,
    bookingStatus: 'confirmed',
    fulfillmentStatus: 'not_picked_up',
    paymentStatus: 'unpaid',
    lines: [
      {
        id: 'line-upc-1',
        equipmentId: 'eq-bosch-gsh11',
        equipmentName: 'Marteau Piqueur Démolisseur BOSCH GSH 11 VC (1700W)',
        trackingMode: 'individual',
        quantity: 1,
        assignedUnitIds: ['u-gsh11-01'], // Unit #1 assigned
        pricingBasis: 'daily',
        rateApplied: 350,
        billableUnitsCount: 3,
        lineTotal: 1050,
        depositPerUnit: 3000,
        lineDepositTotal: 3000,
        pickedUpQuantity: 0,
        returnedQuantity: 0,
        damagedQuantity: 0,
      },
      {
        id: 'line-upc-2',
        equipmentId: 'eq-echafaudage-6m',
        equipmentName: 'Échafaudage Roulant Aluminium Hauteur de Travail 6m',
        trackingMode: 'quantity',
        quantity: 1,
        pricingBasis: 'daily',
        rateApplied: 280,
        billableUnitsCount: 3,
        lineTotal: 840,
        depositPerUnit: 4000,
        lineDepositTotal: 4000,
        pickedUpQuantity: 0,
        returnedQuantity: 0,
        damagedQuantity: 0,
      },
    ],
    pickups: [],
    returns: [],
    internalNotes: 'Réservation validée avec bon de commande société. Dépôt prévu par chèque à l’enlèvement.',
    createdAt: toIso(-2, 16),
    updatedAt: toIso(-2, 16),
  },

  // 4. CLOSED RENTAL WITH DAMAGED ITEM & DEDUCTION: Kärcher HD 9 returned damaged by CleanPro
  {
    id: 'rent-closed-damaged',
    referenceNumber: 'LOK-2026-0038',
    workspaceId: 'ws-atlas-casa',
    customerId: 'cust-4',
    locationId: 'loc-casa-principal',
    startDate: toIso(-7, 8),
    endDate: toIso(-4, 18),
    actualPickupDate: toIso(-7, 8),
    actualReturnDate: toIso(-4, 17),
    deliveryType: 'pickup',
    deliveryFee: 0,
    otherCharges: 0,
    discountAmount: 0,
    taxRate: 20,
    taxAmount: 270,
    rentalTotal: 1620,
    depositRequired: 5000,
    bookingStatus: 'confirmed',
    fulfillmentStatus: 'closed',
    paymentStatus: 'paid',
    lines: [
      {
        id: 'line-dmg-1',
        equipmentId: 'eq-karcher-hd9',
        equipmentName: 'Nettoyeur Haute Pression Kärcher Professionnel HD 9/20-4 M (200 bars)',
        trackingMode: 'individual',
        quantity: 1,
        assignedUnitIds: ['u-krc-02'],
        pricingBasis: 'daily',
        rateApplied: 450,
        billableUnitsCount: 3,
        lineTotal: 1350,
        depositPerUnit: 5000,
        lineDepositTotal: 5000,
        pickedUpQuantity: 1,
        returnedQuantity: 0,
        damagedQuantity: 1,
      },
    ],
    pickups: [
      {
        id: 'pk-dmg-1',
        timestamp: toIso(-7, 8),
        performedBy: 'Sofia Berrada',
        items: [{ lineItemId: 'line-dmg-1', quantity: 1, unitIds: ['u-krc-02'] }],
        conditionNotes: 'Matériel en bon état de marche au départ.',
        customerSignatureName: 'Rachid Tlemçani',
      },
    ],
    returns: [
      {
        id: 'rt-dmg-1',
        timestamp: toIso(-4, 17),
        performedBy: 'Amine Alaoui',
        items: [{ lineItemId: 'line-dmg-1', quantityReturnedGood: 0, quantityReturnedDamaged: 1, quantityMissing: 0, unitIds: ['u-krc-02'] }],
        conditionNotes: 'Flexible haute pression 15m écrasé et raccord buse tordu.',
        damageNotes: 'Devis de réparation estimé à 1 200 MAD pour flexible neuf Kärcher.',
        damageAssessedFee: 1200,
        routedToMaintenance: true,
      },
    ],
    internalNotes: 'Client a accepté la retenue de 1 200 MAD sur sa caution de 5 000 MAD. Le reste (3 800 MAD) a été restitué par virement.',
    createdAt: toIso(-8, 10),
    updatedAt: toIso(-4, 18),
  },
];

export const initialPayments: RentalPayment[] = [
  // Payment for Overdue rental (LOK-2026-0041)
  {
    id: 'pay-1',
    rentalId: 'rent-overdue-01',
    type: 'rental_charge_payment',
    amount: 2880,
    method: 'bank_transfer',
    reference: 'VIR-ATTIJARI-88391',
    recordedBy: 'Meryem Kabbaj',
    notes: 'Règlement intégral de la prestation avant retrait.',
    createdAt: toIso(-3, 8),
  },
  // Partial payment for Prestige Events (LOK-2026-0042)
  {
    id: 'pay-2',
    rentalId: 'rent-active-chairs',
    type: 'rental_charge_payment',
    amount: 3000,
    method: 'cheque',
    reference: 'CHQ-BP-552091',
    recordedBy: 'Meryem Kabbaj',
    notes: 'Acompte versé à la commande. Solde de 3 600 MAD dû à la fin de l’événement.',
    createdAt: toIso(-2, 10),
  },
  // Payment for closed CleanPro rental (LOK-2026-0038)
  {
    id: 'pay-3',
    rentalId: 'rent-closed-damaged',
    type: 'rental_charge_payment',
    amount: 1620,
    method: 'card_external',
    reference: 'TPE-CMI-00918',
    recordedBy: 'Sofia Berrada',
    notes: 'Règlement par carte bancaire sur TPE agence.',
    createdAt: toIso(-7, 8),
  },
];

export const initialDeposits: DepositLedgerEntry[] = [
  // Deposit held for Hamza El Mansouri (Sony FX3)
  {
    id: 'dep-1',
    rentalId: 'rent-overdue-01',
    type: 'deposit_received',
    amount: 15000,
    method: 'cheque_hold',
    reference: 'CHQ-CAUTION-BMCE-771',
    notes: 'Chèque de caution déposé au coffre, non débité.',
    recordedBy: 'Amine Alaoui',
    createdAt: toIso(-3, 9),
  },
  // Deposit held for Prestige Events (100 chairs)
  {
    id: 'dep-2',
    rentalId: 'rent-active-chairs',
    type: 'deposit_received',
    amount: 5000,
    method: 'cheque_hold',
    reference: 'CHQ-CAUTION-SGMB-992',
    notes: 'Chèque de caution Prestige Events.',
    recordedBy: 'Amine Alaoui',
    createdAt: toIso(-1, 10),
  },
  // Deposit received, then deduction and refund for CleanPro
  {
    id: 'dep-3',
    rentalId: 'rent-closed-damaged',
    type: 'deposit_received',
    amount: 5000,
    method: 'cash',
    reference: 'REC-DEP-0081',
    notes: 'Dépôt d’espèces conservé en caisse sécurisée.',
    recordedBy: 'Sofia Berrada',
    createdAt: toIso(-7, 8),
  },
  {
    id: 'dep-4',
    rentalId: 'rent-closed-damaged',
    type: 'deposit_deducted_for_damage',
    amount: 1200,
    method: 'cash',
    reference: 'RETENUE-DMG-0081',
    notes: 'Retenue pour remplacement du flexible haute pression endommagé.',
    recordedBy: 'Meryem Kabbaj',
    createdAt: toIso(-4, 18),
  },
  {
    id: 'dep-5',
    rentalId: 'rent-closed-damaged',
    type: 'deposit_refunded',
    amount: 3800,
    method: 'cash',
    reference: 'RESTIT-DEP-0081',
    notes: 'Restitution du solde de caution après accord amiable.',
    recordedBy: 'Meryem Kabbaj',
    createdAt: toIso(-4, 18),
  },
];

export const initialMaintenance: MaintenanceLog[] = [
  // Active maintenance ticket blocking Unit #2 of Kärcher HD 9
  {
    id: 'maint-1',
    workspaceId: 'ws-atlas-casa',
    equipmentId: 'eq-karcher-hd9',
    equipmentName: 'Nettoyeur Haute Pression Kärcher Professionnel HD 9/20-4 M (200 bars)',
    unitId: 'u-krc-02',
    affectedQuantity: 1,
    issueDescription: 'Flexible 15m éclaté et buse rotative endommagée lors du retour de chantier CleanPro.',
    photoUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=80',
    startDate: toIso(-4, 18),
    expectedCompletionDate: toIso(3, 18),
    responsibleParty: 'Atelier SAV Kärcher Maroc (Ain Sebaa)',
    estimatedCost: 1200,
    status: 'in_repair',
    resolutionNotes: 'Pièces commandées, réception prévue sous 48h.',
    createdAt: toIso(-4, 18),
  },
];

export const initialAuditLogs: AuditEvent[] = [
  {
    id: 'aud-1',
    workspaceId: 'ws-atlas-casa',
    entityType: 'rental',
    entityId: 'rent-overdue-01',
    action: 'DISPATCH_CONFIRMED',
    details: 'Mise à disposition Caméra Sony FX3 (CAM-FX3-001) remise au client Hamza El Mansouri.',
    userId: 'usr-3',
    userName: 'Amine Alaoui',
    timestamp: toIso(-3, 9),
  },
  {
    id: 'aud-2',
    workspaceId: 'ws-atlas-casa',
    entityType: 'rental',
    entityId: 'rent-active-chairs',
    action: 'PARTIAL_RETURN',
    details: 'Retour partiel de 40 chaises Napoléon enregistré par le comptoir.',
    userId: 'usr-3',
    userName: 'Amine Alaoui',
    timestamp: toIso(0, 8),
  },
  {
    id: 'aud-3',
    workspaceId: 'ws-atlas-casa',
    entityType: 'deposit',
    entityId: 'rent-closed-damaged',
    action: 'DEPOSIT_DEDUCTION',
    details: 'Retenue de caution de 1 200 MAD pour dégâts matériels sur nettoyeur Kärcher.',
    userId: 'usr-4',
    userName: 'Meryem Kabbaj',
    timestamp: toIso(-4, 18),
  },
];

export const initialPublicRequests: PublicBookingRequest[] = [
  {
    id: 'req-pub-1',
    workspaceId: 'ws-atlas-casa',
    customerName: 'Studio Ciné 7 Casablanca',
    phone: '+212 6 62 10 20 30',
    email: 'production@cine7.ma',
    city: 'Casablanca',
    deliveryType: 'pickup',
    startDate: toIso(5, 9),
    endDate: toIso(7, 18),
    items: [
      {
        equipmentId: 'eq-sony-fx3',
        equipmentName: 'Caméra Sony FX3 Cinema Line 4K 120p Full-Frame',
        quantity: 1,
        dailyRate: 1200,
      },
      {
        equipmentId: 'eq-jbl-eon715',
        equipmentName: 'Système Sonore : Enceinte Amplifiée JBL EON 715 (1300W)',
        quantity: 2,
        dailyRate: 220,
      },
    ],
    notes: 'Tournage clip musical en intérieur. Besoin de vérifier la disponibilité des batteries supplémentaires.',
    status: 'pending_review',
    estimatedTotal: 3280,
    createdAt: toIso(0, -2),
  },
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'overdue',
    title: 'Retard critique de restitution',
    message: 'Le contrat LOK-2026-0041 (Hamza El Mansouri - Caméra Sony FX3) devait être rendu hier à 18h.',
    rentalId: 'rent-overdue-01',
    severity: 'urgent',
    createdAt: toIso(-1, 19),
    isRead: false,
  },
  {
    id: 'notif-2',
    type: 'public_request',
    title: 'Nouvelle demande du catalogue public',
    message: 'Studio Ciné 7 a envoyé une demande de réservation de 3 280 MAD en attente d’examen.',
    severity: 'info',
    createdAt: toIso(0, -2),
    isRead: false,
  },
  {
    id: 'notif-3',
    type: 'maintenance_conflict',
    title: 'Équipement en atelier',
    message: 'Kärcher HD 9/20-4 M (CLN-HP-002) est immobilisé en réparation suite à dégradation.',
    equipmentId: 'eq-karcher-hd9',
    severity: 'warning',
    createdAt: toIso(-4, 18),
    isRead: true,
  },
];

/**
 * Storage service providing get/save with typed local persistence
 */
export class StorageService {
  static getSettings(): WorkspaceSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : initialSettings;
  }

  static notifySync(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('kriya_storage_sync', {
          detail: { timestamp: new Date().toISOString() },
        })
      );
    }
  }

  static saveSettings(settings: WorkspaceSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this.notifySync();
  }

  static getLocations(): WorkspaceLocation[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
    return raw ? JSON.parse(raw) : initialLocations;
  }

  static saveLocations(locs: WorkspaceLocation[]): void {
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locs));
    this.notifySync();
  }

  static getUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : initialUsers;
  }

  static getActiveUser(): User {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
    if (raw) return JSON.parse(raw);
    return initialUsers[0]; // Owner default
  }

  static setActiveUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(user));
    this.notifySync();
  }

  static getEquipment(): Equipment[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EQUIPMENT);
    return raw ? JSON.parse(raw) : initialEquipment;
  }

  static saveEquipment(items: Equipment[]): void {
    localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(items));
    this.notifySync();
  }

  static getCustomers(): Customer[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return raw ? JSON.parse(raw) : initialCustomers;
  }

  static saveCustomers(customers: Customer[]): void {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    this.notifySync();
  }

  static getRentals(): Rental[] {
    const raw = localStorage.getItem(STORAGE_KEYS.RENTALS);
    return raw ? JSON.parse(raw) : initialRentals;
  }

  static saveRentals(rentals: Rental[]): void {
    localStorage.setItem(STORAGE_KEYS.RENTALS, JSON.stringify(rentals));
    this.notifySync();
  }

  static getPayments(): RentalPayment[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    return raw ? JSON.parse(raw) : initialPayments;
  }

  static savePayments(payments: RentalPayment[]): void {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    this.notifySync();
  }

  static getDeposits(): DepositLedgerEntry[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DEPOSITS);
    return raw ? JSON.parse(raw) : initialDeposits;
  }

  static saveDeposits(deposits: DepositLedgerEntry[]): void {
    localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(deposits));
    this.notifySync();
  }

  static getMaintenance(): MaintenanceLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MAINTENANCE);
    return raw ? JSON.parse(raw) : initialMaintenance;
  }

  static saveMaintenance(maint: MaintenanceLog[]): void {
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(maint));
    this.notifySync();
  }

  static getAuditLogs(): AuditEvent[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return raw ? JSON.parse(raw) : initialAuditLogs;
  }

  static addAuditLog(log: Omit<AuditEvent, 'id' | 'timestamp'>): void {
    const current = this.getAuditLogs();
    const newEntry: AuditEvent = {
      ...log,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newEntry, ...current].slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(updated));
    this.notifySync();
  }

  static getPublicRequests(): PublicBookingRequest[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PUBLIC_REQUESTS);
    return raw ? JSON.parse(raw) : initialPublicRequests;
  }

  static savePublicRequests(reqs: PublicBookingRequest[]): void {
    localStorage.setItem(STORAGE_KEYS.PUBLIC_REQUESTS, JSON.stringify(reqs));
    this.notifySync();
  }

  static getNotifications(): NotificationItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return raw ? JSON.parse(raw) : initialNotifications;
  }

  static saveNotifications(notifs: NotificationItem[]): void {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    this.notifySync();
  }

  static getStorageStats(): {
    totalRecords: number;
    estimatedKB: number;
    isStorageAvailable: boolean;
  } {
    let totalChars = 0;
    try {
      Object.values(STORAGE_KEYS).forEach((k) => {
        const val = localStorage.getItem(k);
        if (val) totalChars += val.length;
      });

      const rentals = this.getRentals();
      const equipment = this.getEquipment();
      const customers = this.getCustomers();
      const payments = this.getPayments();
      const deposits = this.getDeposits();
      const maintenance = this.getMaintenance();

      const totalRecords =
        rentals.length +
        equipment.length +
        customers.length +
        payments.length +
        deposits.length +
        maintenance.length;

      return {
        totalRecords,
        estimatedKB: Math.round((totalChars * 2) / 1024), // Approx 2 bytes per char
        isStorageAvailable: true,
      };
    } catch {
      return {
        totalRecords: 0,
        estimatedKB: 0,
        isStorageAvailable: false,
      };
    }
  }

  static verifyPersistence(): boolean {
    try {
      const probeKey = 'kriya_storage_probe';
      localStorage.setItem(probeKey, 'ok');
      const readBack = localStorage.getItem(probeKey);
      localStorage.removeItem(probeKey);
      this.notifySync();
      return readBack === 'ok';
    } catch {
      return false;
    }
  }

  static resetToDemoData(): void {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    // Re-initialize
    this.saveSettings(initialSettings);
    this.saveLocations(initialLocations);
    this.saveEquipment(initialEquipment);
    this.saveCustomers(initialCustomers);
    this.saveRentals(initialRentals);
    this.savePayments(initialPayments);
    this.saveDeposits(initialDeposits);
    this.saveMaintenance(initialMaintenance);
    this.savePublicRequests(initialPublicRequests);
    this.saveNotifications(initialNotifications);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(initialUsers[0]));
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(initialAuditLogs));
  }

  static exportAllDataJson(): string {
    const bundle = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      settings: this.getSettings(),
      locations: this.getLocations(),
      users: this.getUsers(),
      equipment: this.getEquipment(),
      customers: this.getCustomers(),
      rentals: this.getRentals(),
      payments: this.getPayments(),
      deposits: this.getDeposits(),
      maintenance: this.getMaintenance(),
      audit: this.getAuditLogs(),
      publicRequests: this.getPublicRequests(),
    };
    return JSON.stringify(bundle, null, 2);
  }
}
