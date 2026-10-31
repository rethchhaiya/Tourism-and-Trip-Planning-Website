// Values the booking document supports. The live reference list also contains
// "cash", but bookings must not offer it.
export const BOOKING_PAYMENT_METHODS = Object.freeze(["aba_pay", "bank_transfer"]);

// TODO(reference-data): the live /reference-data endpoint does not return age
// groups yet, so these values come from the booking document.
export const AGE_GROUPS = Object.freeze(["Child", "Adult", "Elder"]);
