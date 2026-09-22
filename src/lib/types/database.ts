export type OperationalStatus = 
  | 'En preparación'
  | 'Asignado'
  | 'En ejecución'
  | 'Demorado'
  | 'Rediseño'
  | 'Finalizado';

export type RepairPriority = 'Normal' | 'Alta' | 'Crítica';

export type StatusCategory = 'pending' | 'in_progress' | 'resolved' | 'closed';

export type EventType = 
  | 'creation'
  | 'assignment'
  | 'reclaim'
  | 'response'
  | 'follow_up'
  | 'derivation'
  | 'verification'
  | 'reiteration'
  | 'resolution'
  | 'closure';

export type VerificationResult = 'solucionado' | 'no_solucionado' | 'parcial';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface ResponsibleParty {
  id: string;
  name: string;
  type: 'contractor' | 'engineering' | 'cto_team' | 'redesign' | 'other';
  is_active: boolean;
  created_at: string;
}

export interface RepairType {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface RepairStatus {
  id: string;
  name: string;
  category: StatusCategory;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  sigest: string;
  poligono: string;
  distrito?: string;
  central?: string;
  titulo?: string;
  ejecutor?: string;
  ctos_count: number;
  alimentacion?: string;
  situacion_operativa: OperationalStatus;
  fecha_asignacion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // Computed / Joined properties for UI tables
  repairs_count?: number;
  pending_repairs_count?: number;
  reiterated_repairs_count?: number;
  last_activity_at?: string;
}

export interface Repair {
  id: string;
  project_id: string;
  repair_type_id?: string;
  description: string;
  priority: RepairPriority;
  solicitante?: string;
  current_responsible_id?: string;
  current_status_id: string;
  fecha_informado: string;
  fecha_compromiso?: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;

  // Joins
  project?: Project;
  repair_type?: RepairType;
  current_responsible?: ResponsibleParty;
  current_status?: RepairStatus;
  created_by_profile?: Profile;

  // Computed metrics from events
  reiteration_count?: number;
  reclaim_count?: number;
  last_reiteration_at?: string;
  last_event_at?: string;
}

export interface RepairEvent {
  id: string;
  repair_id: string;
  event_type: EventType;
  previous_responsible_id?: string;
  new_responsible_id?: string;
  previous_status_id?: string;
  new_status_id?: string;
  verification_result?: VerificationResult;
  notes?: string;
  created_at: string;
  created_by: string;

  // Joins
  previous_responsible?: ResponsibleParty;
  new_responsible?: ResponsibleParty;
  previous_status?: RepairStatus;
  new_status?: RepairStatus;
  created_by_profile?: Profile;
}

export interface DashboardMetrics {
  totalProjects: number;
  activeProjects: number;
  totalRepairs: number;
  pendingRepairs: number;
  reiteratedRepairs: number;
  resolvedAwaitingVerification: number;
  finalizedRepairs: number;
}
