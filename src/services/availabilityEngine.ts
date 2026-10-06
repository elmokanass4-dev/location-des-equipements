import { Equipment, Rental, MaintenanceLog, AssetUnit } from '../types';

export interface AvailabilityInterval {
  start: Date;
  end: Date;
}

export interface EquipmentAvailability {
  equipmentId: string;
  totalServiceableQuantity: number;
  availableQuantity: number;
  conflictingRentals: {
    rentalId: string;
    referenceNumber: string;
    customerName?: string;
    quantity: number;
    startDate: string;
    endDate: string;
    isOverdue?: boolean;
  }[];
  maintenanceBlocksCount: number;
  availableUnitIds?: string[];
  isAvailable: boolean;
  explanation?: string;
}

/**
 * Checks whether two time intervals overlap, taking into account a turnaround buffer in hours.
 * Uses start-inclusive, end-exclusive intervals: [start, end)
 */
export function intervalsOverlapWithBuffer(
  intervalA: { start: Date; end: Date },
  intervalB: { start: Date; end: Date },
  bufferHours: number = 0
): boolean {
  const bufferMs = bufferHours * 60 * 60 * 1000;
  // intervalA's occupied time is expanded by the buffer on both ends or trailing end
  const aStart = intervalA.start.getTime();
  const aEnd = intervalA.end.getTime() + bufferMs;

  const bStart = intervalB.start.getTime();
  const bEnd = intervalB.end.getTime();

  return aStart < bEnd && aEnd > bStart;
}

/**
 * Calculates availability for a single equipment item across a requested date range.
 */
export function calculateEquipmentAvailability(
  equipment: Equipment,
  startDateStr: string,
  endDateStr: string,
  allRentals: Rental[],
  allMaintenance: MaintenanceLog[],
  bufferHours: number = 2,
  excludeRentalId?: string
): EquipmentAvailability {
  const reqStart = new Date(startDateStr);
  const reqEnd = new Date(endDateStr);
  const now = new Date();

  // 1. Maintenance deductions
  const activeMaintenance = allMaintenance.filter((m) => {
    if (m.equipmentId !== equipment.id) return false;
    if (m.status === 'resolved') return false;

    // Check if maintenance period overlaps with requested period
    const mStart = new Date(m.startDate);
    const mEnd = new Date(m.expectedCompletionDate);
    // If not resolved and starts before requested end, it blocks availability
    return mStart < reqEnd && mEnd > reqStart;
  });

  const maintenanceBlockedQty = activeMaintenance.reduce(
    (sum, m) => sum + (m.affectedQuantity || 1),
    0
  );
  const maintenanceBlockedUnitIds = new Set(
    activeMaintenance.filter((m) => m.unitId).map((m) => m.unitId!)
  );

  // 2. Individual tracked assets
  if (equipment.trackingMode === 'individual') {
    const units = equipment.units || [];
    const conflictingRentalsList: EquipmentAvailability['conflictingRentals'] = [];

    // Find assigned units in overlapping or overdue rentals
    const occupiedUnitIds = new Set<string>();

    for (const rental of allRentals) {
      if (rental.id === excludeRentalId) continue;
      // Drafts, quotes, cancelled, declined do not lock equipment unless already partially checked out
      const isCommitted =
        rental.bookingStatus === 'confirmed' ||
        rental.fulfillmentStatus === 'checked_out' ||
        rental.fulfillmentStatus === 'partially_picked_up';

      if (!isCommitted || rental.bookingStatus === 'cancelled' || rental.bookingStatus === 'declined') {
        continue;
      }

      // Check if rental is currently overdue
      const plannedEnd = new Date(rental.endDate);
      const isRentalOverdue =
        (rental.fulfillmentStatus === 'checked_out' || rental.fulfillmentStatus === 'partially_picked_up') &&
        plannedEnd < now;

      // Check date interval overlap
      const rStart = new Date(rental.startDate);
      const effectiveREnd = isRentalOverdue ? new Date(Math.max(now.getTime(), plannedEnd.getTime())) : plannedEnd;

      const overlaps = intervalsOverlapWithBuffer(
        { start: rStart, end: effectiveREnd },
        { start: reqStart, end: reqEnd },
        bufferHours
      );

      // If it overlaps OR it is currently overdue and hasn't returned yet
      if (overlaps || isRentalOverdue) {
        // Find line items for this equipment
        for (const line of rental.lines) {
          if (line.equipmentId === equipment.id) {
            // Check which units are occupied and not yet returned
            const returnedCount = line.returnedQuantity || 0;
            const assignedUnits = line.assignedUnitIds || [];

            // If units are assigned, mark them
            assignedUnits.slice(0, Math.max(0, line.quantity - returnedCount)).forEach((uid) => {
              occupiedUnitIds.add(uid);
            });

            conflictingRentalsList.push({
              rentalId: rental.id,
              referenceNumber: rental.referenceNumber,
              quantity: Math.max(0, line.quantity - returnedCount),
              startDate: rental.startDate,
              endDate: rental.endDate,
              isOverdue: isRentalOverdue,
            });
          }
        }
      }
    }

    // Usable units are active, not in maintenance, not occupied
    const availableUnits = units.filter((u) => {
      if (u.status === 'retired' || u.condition === 'damaged') return false;
      if (maintenanceBlockedUnitIds.has(u.id)) return false;
      if (occupiedUnitIds.has(u.id)) return false;
      return true;
    });

    const totalServiceable = units.filter((u) => u.status !== 'retired').length;

    return {
      equipmentId: equipment.id,
      totalServiceableQuantity: totalServiceable,
      availableQuantity: availableUnits.length,
      conflictingRentals: conflictingRentalsList,
      maintenanceBlocksCount: activeMaintenance.length,
      availableUnitIds: availableUnits.map((u) => u.id),
      isAvailable: availableUnits.length > 0,
      explanation:
        availableUnits.length > 0
          ? `${availableUnits.length} unité(s) disponible(s)`
          : `Toutes les unités physiques sont louées ou en maintenance sur cette plage.`,
    };
  }

  // 3. Bulk Quantity stock tracking
  const totalOwned = equipment.totalQuantity || 0;
  const serviceableStock = Math.max(0, totalOwned - maintenanceBlockedQty);

  // We must calculate the peak quantity reserved during any point in [reqStart, reqEnd)
  const overlappingRentals = allRentals.filter((rental) => {
    if (rental.id === excludeRentalId) return false;
    const isCommitted =
      rental.bookingStatus === 'confirmed' ||
      rental.fulfillmentStatus === 'checked_out' ||
      rental.fulfillmentStatus === 'partially_picked_up';

    if (!isCommitted || rental.bookingStatus === 'cancelled' || rental.bookingStatus === 'declined') {
      return false;
    }

    const plannedEnd = new Date(rental.endDate);
    const isRentalOverdue =
      (rental.fulfillmentStatus === 'checked_out' || rental.fulfillmentStatus === 'partially_picked_up') &&
      plannedEnd < now;

    const rStart = new Date(rental.startDate);
    const effectiveEnd = isRentalOverdue ? new Date(Math.max(now.getTime(), plannedEnd.getTime())) : plannedEnd;

    const overlaps = intervalsOverlapWithBuffer(
      { start: rStart, end: effectiveEnd },
      { start: reqStart, end: reqEnd },
      bufferHours
    );

    return overlaps || isRentalOverdue;
  });

  let maxReservedSimultaneously = 0;
  const conflictingList: EquipmentAvailability['conflictingRentals'] = [];

  for (const rental of overlappingRentals) {
    const line = rental.lines.find((l) => l.equipmentId === equipment.id);
    if (line) {
      const activeLineQty = Math.max(0, line.quantity - (line.returnedQuantity || 0));
      if (activeLineQty > 0) {
        maxReservedSimultaneously += activeLineQty;
        const plannedEnd = new Date(rental.endDate);
        const isRentalOverdue =
          (rental.fulfillmentStatus === 'checked_out' || rental.fulfillmentStatus === 'partially_picked_up') &&
          plannedEnd < now;

        conflictingList.push({
          rentalId: rental.id,
          referenceNumber: rental.referenceNumber,
          quantity: activeLineQty,
          startDate: rental.startDate,
          endDate: rental.endDate,
          isOverdue: isRentalOverdue,
        });
      }
    }
  }

  const remainingAvailable = Math.max(0, serviceableStock - maxReservedSimultaneously);

  return {
    equipmentId: equipment.id,
    totalServiceableQuantity: serviceableStock,
    availableQuantity: remainingAvailable,
    conflictingRentals: conflictingList,
    maintenanceBlocksCount: activeMaintenance.length,
    isAvailable: remainingAvailable > 0,
    explanation:
      remainingAvailable > 0
        ? `${remainingAvailable} sur ${serviceableStock} disponible(s) sur ce créneau`
        : `Stock épuisé pour cette période (${maxReservedSimultaneously} réservés ou sortis)`,
  };
}

/**
 * Validates whether an entire rental basket can be fulfilled for the specified period.
 */
export function validateRentalBasketAvailability(
  items: { equipment: Equipment; quantity: number }[],
  startDate: string,
  endDate: string,
  allRentals: Rental[],
  allMaintenance: MaintenanceLog[],
  bufferHours: number = 2,
  excludeRentalId?: string
): { isValid: boolean; errors: { equipmentName: string; requested: number; available: number }[] } {
  const errors: { equipmentName: string; requested: number; available: number }[] = [];

  for (const item of items) {
    const avail = calculateEquipmentAvailability(
      item.equipment,
      startDate,
      endDate,
      allRentals,
      allMaintenance,
      bufferHours,
      excludeRentalId
    );

    if (item.quantity > avail.availableQuantity) {
      errors.push({
        equipmentName: item.equipment.name,
        requested: item.quantity,
        available: avail.availableQuantity,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
