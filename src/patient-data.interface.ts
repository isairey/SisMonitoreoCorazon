
export interface PatientData {
  patientId: string;
  lastMovementTimestamp: string;
  currentRoom: string;
  isMoving: boolean;
  activityLevel: 'normal' | 'low' | 'none';
  fallDetected: boolean;
  fallLocation?: string;
  dailyStepCount: number;
  movementHistory: Array<'normal' | 'low' | 'none'>;
  wristbandStatus: 'connected' | 'disconnected' | 'low_battery';
  wristbandBatteryLevel: number;
  medicalConditions: string[];
  dailySchedule: { time: string; activity: string }[];
}
