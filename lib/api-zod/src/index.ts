export * from "./generated/api";

// Resolve ambiguity by explicitly re-exporting conflicting interfaces as types
export type { CreateAppointmentBody } from "./generated/types/createAppointmentBody";
export type { CreateMedicalRecordBody } from "./generated/types/createMedicalRecordBody";
export type { CreatePatientBody } from "./generated/types/createPatientBody";
export type { UpdateAppointmentBody } from "./generated/types/updateAppointmentBody";

// Re-export non-conflicting types
export type {
  Appointment,
  DashboardStats,
  HealthStatus,
  ListAppointmentsParams,
  ListMedicalRecordsParams,
  ListPatientsParams,
  MedicalRecord,
  Patient,
} from "./generated/types";
