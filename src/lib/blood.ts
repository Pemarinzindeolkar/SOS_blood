export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];

// Minimum days between whole-blood donations.
export const DONATION_GAP_DAYS = 90;

// Which donor blood types a patient can safely receive red cells from.
const CAN_RECEIVE_FROM: Record<BloodType, BloodType[]> = {
  "O-": ["O-"],
  "O+": ["O+", "O-"],
  "A-": ["A-", "O-"],
  "A+": ["A+", "A-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "AB-": ["AB-", "A-", "B-", "O-"],
  "AB+": [...BLOOD_TYPES],
};

export function compatibleDonorTypes(patientType: BloodType): BloodType[] {
  return CAN_RECEIVE_FROM[patientType];
}

export function isBloodType(value: unknown): value is BloodType {
  return BLOOD_TYPES.includes(value as BloodType);
}
