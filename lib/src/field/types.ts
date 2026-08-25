/**
 * @alvinahmad/blueprin-sdk - Field Inspection & Daily Log Types
 */

export interface FieldWeather {
  condition: 'cerah' | 'berawan' | 'hujan_ringan' | 'hujan_lebat' | 'badai';
  temperatureC?: number;
  humidityPercent?: number;
  windSpeedKmh?: number;
  impactOnWork: 'none' | 'partial_delay' | 'full_stoppage';
  notes?: string;
}

export interface FieldGPSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  capturedAt: string;
}

export interface FieldPhoto {
  id: string;
  url: string;
  caption?: string;
  category: 'progress' | 'safety' | 'quality' | 'weather' | 'issue' | 'other';
  takenAt: string;
  gpsLocation?: FieldGPSLocation;
  metadata?: Record<string, string | number>;
}

export interface FieldDailyLog {
  id: string;
  projectId: string;
  date: string;
  weatherMorning: FieldWeather;
  weatherAfternoon: FieldWeather;
  workforceCount: number;
  workforceAttendance?: Record<string, number>;
  equipmentOnSite?: string[];
  completedActivities: string[];
  plannedNextActivities?: string[];
  photos?: FieldPhoto[];
  notes?: string;
  supervisorName: string;
  supervisorSignature?: string;
  gpsLocation?: FieldGPSLocation;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionChecklistItem {
  id: string;
  category: 'K3_Safety' | 'Quality_Mutu' | 'Structural' | 'MEP' | 'Architectural';
  itemDescription: string;
  status: 'pass' | 'fail' | 'na' | 'rework_required';
  notes?: string;
  photoUrl?: string;
  correctiveAction?: string;
  dueDate?: string;
}

export interface FieldInspection {
  id: string;
  projectId: string;
  title: string;
  type: 'daily_k3' | 'pre_pour_concrete' | 'rebar_inspection' | 'scaffolding' | 'handover_punchlist' | 'material_receive' | 'safety_walkdown';
  inspectorName: string;
  status: 'draft' | 'approved' | 'rejected' | 'pending_rework';
  scorePercent: number;
  items: InspectionChecklistItem[];
  photos?: FieldPhoto[];
  locationGPS?: FieldGPSLocation;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FieldWorkforceEntry {
  workerName: string;
  role: string;
  status: 'present' | 'absent' | 'half_day' | 'overtime';
  hoursWorked?: number;
  overtimeHours?: number;
}

export interface FieldEquipmentEntry {
  equipmentName: string;
  type: string;
  status: 'operational' | 'maintenance' | 'broken' | 'idle';
  hoursUsed?: number;
  notes?: string;
}

export interface FieldDailyReport {
  id: string;
  projectId: string;
  date: string;
  dailyLog: FieldDailyLog;
  workforce: FieldWorkforceEntry[];
  equipment: FieldEquipmentEntry[];
  issues: FieldIssue[];
  weatherSummary: string;
  productivityIndex?: number;
  safetyScore?: number;
  qualityScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FieldIssue {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'safety' | 'quality' | 'schedule' | 'cost' | 'environment';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  dueDate?: string;
  photos?: FieldPhoto[];
  gpsLocation?: FieldGPSLocation;
  createdAt: string;
  updatedAt: string;
}
