import { Project, Repair, RepairEvent, RepairStatus, RepairType, ResponsibleParty } from "../types/database";

export const INITIAL_RESPONSIBLE_PARTIES: ResponsibleParty[] = [
  { id: 'a1111111-1111-1111-1111-111111111111', name: 'Obras', type: 'contractor', is_active: true, created_at: '2026-09-01T00:00:00Z' },
  { id: 'a2222222-2222-2222-2222-222222222222', name: 'Ingeniería', type: 'engineering', is_active: true, created_at: '2026-09-01T00:00:00Z' },
  { id: 'a3333333-3333-3333-3333-333333333333', name: 'Equipo Despliegue', type: 'cto_team', is_active: true, created_at: '2026-09-01T00:00:00Z' },
];

export const INITIAL_REPAIR_TYPES: RepairType[] = [
  { id: 'b1111111-1111-1111-1111-111111111111', name: 'Falta poste', description: 'Falta colocación o reemplazo de poste en vía pública', is_active: true, created_at: '2026-09-01T00:00:00Z' },
  { id: 'b2222222-2222-2222-2222-222222222222', name: 'Falta cruce americano', description: 'Falta tendido de cruce aéreo/subterráneo', is_active: true, created_at: '2026-09-01T00:00:00Z' },
  { id: 'b3333333-3333-3333-3333-333333333333', name: 'Falta HUB', description: 'Instalación pendiente del nodo de distribución HUB', is_active: true, created_at: '2026-09-01T00:00:00Z' },
  { id: 'b4444444-4444-4444-4444-444444444444', name: 'HUB sin potencia', description: 'HUB instalado pero sin señal óptica requerida', is_active: true, created_at: '2026-09-01T00:00:00Z' },
  { id: 'b5555555-5555-5555-5555-555555555555', name: 'Problemas de potencia', description: 'Atenuación de fibra fuera de tolerancias de norma', is_active: true, created_at: '2026-09-01T00:00:00Z' },
  { id: 'b6666666-6666-6666-6666-666666666666', name: 'Rediseño', description: 'Requiere revisión o modificación del plano por imprevisto en campo', is_active: true, created_at: '2026-09-01T00:00:00Z' },
  { id: 'b7777777-7777-7777-7777-777777777777', name: 'Poste podrido', description: 'Poste deteriorado o en riesgo de caída', is_active: true, created_at: '2026-09-01T00:00:00Z' },
  { id: 'b8888888-8888-8888-8888-888888888888', name: 'Otro', description: 'Otros problemas operativos generales', is_active: true, created_at: '2026-09-01T00:00:00Z' },
];

export const INITIAL_REPAIR_STATUSES: RepairStatus[] = [
  { id: 'c1111111-1111-1111-1111-111111111111', name: 'PENDIENTE', category: 'pending', order_index: 1, is_active: true, created_at: '2026-09-01T00:00:00Z' },
  { id: 'c7777777-7777-7777-7777-777777777777', name: 'VERIFICACIÓN RESUELTO', category: 'resolved', order_index: 2, is_active: true, created_at: '2026-09-01T00:00:00Z' },
  { id: 'c8888888-8888-8888-8888-888888888888', name: 'FINALIZADO', category: 'closed', order_index: 3, is_active: true, created_at: '2026-09-01T00:00:00Z' },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'd1111111-1111-1111-1111-111111111111',
    sigest: '102345',
    poligono: '045',
    distrito: 'Florencio Varela',
    central: 'Varela Central',
    titulo: 'Despliegue FTTH ZONA NORTE 045',
    ejecutor: 'Obras',
    ctos_count: 48,
    alimentacion: 'SI',
    situacion_operativa: 'En ejecución',
    observaciones: 'Avance de obra al 65%. Varios bloqueos de postes.',
    created_at: '2026-09-10T08:00:00Z',
    updated_at: '2026-09-20T14:30:00Z',
    created_by: 'Dario'
  },
  {
    id: 'd2222222-2222-2222-2222-222222222222',
    sigest: '102345',
    poligono: '046',
    distrito: 'Florencio Varela',
    central: 'Varela Central',
    titulo: 'Despliegue FTTH ZONA NORTE 046',
    ejecutor: 'Obras',
    ctos_count: 32,
    alimentacion: 'SI',
    situacion_operativa: 'En ejecución',
    observaciones: 'Mismo SIGEST que Polígono 045.',
    created_at: '2026-09-12T09:15:00Z',
    updated_at: '2026-09-18T10:00:00Z',
    created_by: 'Dario'
  },
  {
    id: 'd3333333-3333-3333-3333-333333333333',
    sigest: '108920',
    poligono: '112',
    distrito: 'Quilmes',
    central: 'Quilmes Oeste',
    titulo: 'Extensión Red Fibra Polígono 112',
    ejecutor: 'Ingeniería',
    ctos_count: 64,
    alimentacion: 'NO',
    situacion_operativa: 'Rediseño',
    observaciones: 'En espera de aprobación por cruces de avenida.',
    created_at: '2026-09-05T11:00:00Z',
    updated_at: '2026-09-19T16:20:00Z',
    created_by: 'María'
  },
  {
    id: 'd4444444-4444-4444-4444-444444444444',
    sigest: '110500',
    poligono: '201',
    distrito: 'Berazategui',
    central: 'Berazategui Centro',
    titulo: 'Despliegue Industrial Polígono 201',
    ejecutor: 'Equipo Despliegue',
    ctos_count: 80,
    alimentacion: 'SI',
    situacion_operativa: 'Demorado',
    observaciones: 'Demoras por permisos municipales.',
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-15T12:00:00Z',
    created_by: 'Carlos'
  }
];

export const INITIAL_REPAIRS: Repair[] = [
  {
    id: 'e1111111-1111-1111-1111-111111111111',
    project_id: 'd1111111-1111-1111-1111-111111111111',
    repair_type_id: 'b1111111-1111-1111-1111-111111111111', // Falta poste
    description: 'Faltan 3 postes de hormigón en la esquina de Av. San Martín y Belgrano. Impide tendido de 250m de multifibra.',
    priority: 'Alta',
    solicitante: 'Jefe de Obra',
    current_responsible_id: 'a1111111-1111-1111-1111-111111111111', // Obras
    current_status_id: 'c1111111-1111-1111-1111-111111111111', // PENDIENTE
    fecha_informado: '2026-09-15T09:30:00Z',
    fecha_compromiso: '2026-09-25T00:00:00Z',
    observaciones: 'Se realizó reclamo formal telefónico y por email.',
    created_at: '2026-09-15T09:30:00Z',
    updated_at: '2026-09-18T08:40:00Z',
    created_by: 'Dario'
  },
  {
    id: 'e2222222-2222-2222-2222-222222222222',
    project_id: 'd1111111-1111-1111-1111-111111111111',
    repair_type_id: 'b4444444-4444-4444-4444-444444444444', // HUB sin potencia
    description: 'HUB-02 no recibe potencia desde el splitter de primer nivel. Posible empalme atenuado en cámara 14.',
    priority: 'Crítica',
    solicitante: 'Auditor de Campo',
    current_responsible_id: 'a3333333-3333-3333-3333-333333333333', // Equipo Despliegue
    current_status_id: 'c1111111-1111-1111-1111-111111111111', // PENDIENTE
    fecha_informado: '2026-09-17T11:20:00Z',
    fecha_compromiso: '2026-09-22T00:00:00Z',
    observaciones: 'Derivado a Equipo Despliegue para medición con OTDR.',
    created_at: '2026-09-17T11:20:00Z',
    updated_at: '2026-09-19T14:15:00Z',
    created_by: 'María'
  },
  {
    id: 'e3333333-3333-3333-3333-333333333333',
    project_id: 'd3333333-3333-3333-3333-333333333333',
    repair_type_id: 'b6666666-6666-6666-6666-666666666666', // Rediseño
    description: 'Traza original bloqueada por marquesina comercial. Se requiere plano alternativo por vereda enfrente.',
    priority: 'Normal',
    solicitante: 'Supervisión',
    current_responsible_id: 'a2222222-2222-2222-2222-222222222222', // Ingeniería
    current_status_id: 'c1111111-1111-1111-1111-111111111111', // PENDIENTE
    fecha_informado: '2026-09-12T14:00:00Z',
    fecha_compromiso: '2026-09-28T00:00:00Z',
    observaciones: 'Ingeniería revisando factibilidad técnica.',
    created_at: '2026-09-12T14:00:00Z',
    updated_at: '2026-09-14T10:00:00Z',
    created_by: 'Carlos'
  },
  {
    id: 'e4444444-4444-4444-4444-444444444444',
    project_id: 'd4444444-4444-4444-4444-444444444444',
    repair_type_id: 'b2222222-2222-2222-2222-222222222222', // Falta cruce americano
    description: 'Falta cruce aéreo sobre vía férrea en Calle 14.',
    priority: 'Alta',
    solicitante: 'Gerencia',
    current_responsible_id: 'a1111111-1111-1111-1111-111111111111', // Obras
    current_status_id: 'c7777777-7777-7777-7777-777777777777', // VERIFICACIÓN RESUELTO
    fecha_informado: '2026-09-08T09:00:00Z',
    fecha_compromiso: '2026-09-18T00:00:00Z',
    observaciones: 'Obras notificó instalación completa el 18/09. Listo para verificar.',
    created_at: '2026-09-08T09:00:00Z',
    updated_at: '2026-09-18T16:30:00Z',
    created_by: 'Dario'
  }
];

export const INITIAL_REPAIR_EVENTS: RepairEvent[] = [
  {
    id: 'f1111111-1111-1111-1111-111111111111',
    repair_id: 'e1111111-1111-1111-1111-111111111111',
    event_type: 'creation',
    previous_status_id: undefined,
    new_status_id: 'c1111111-1111-1111-1111-111111111111',
    notes: 'Reparo registrado por inspección de obra.',
    created_at: '2026-09-15T09:32:00Z',
    created_by: 'Dario'
  },
  {
    id: 'f2222222-2222-2222-2222-222222222222',
    repair_id: 'e1111111-1111-1111-1111-111111111111',
    event_type: 'assignment',
    previous_responsible_id: undefined,
    new_responsible_id: 'a1111111-1111-1111-1111-111111111111',
    previous_status_id: 'c1111111-1111-1111-1111-111111111111',
    new_status_id: 'c1111111-1111-1111-1111-111111111111',
    notes: 'Asignado a Obras para provisión y plantado.',
    created_at: '2026-09-15T10:15:00Z',
    created_by: 'Dario'
  },
  {
    id: 'f3333333-3333-3333-3333-333333333333',
    repair_id: 'e1111111-1111-1111-1111-111111111111',
    event_type: 'reclaim',
    previous_responsible_id: 'a1111111-1111-1111-1111-111111111111',
    new_responsible_id: 'a1111111-1111-1111-1111-111111111111',
    previous_status_id: 'c1111111-1111-1111-1111-111111111111',
    new_status_id: 'c1111111-1111-1111-1111-111111111111',
    notes: 'Primer reclamo registrado exigiendo fecha.',
    created_at: '2026-09-18T08:40:00Z',
    created_by: 'Dario'
  },
  {
    id: 'f4444444-4444-4444-4444-444444444444',
    repair_id: 'e4444444-4444-4444-4444-444444444444',
    event_type: 'creation',
    previous_status_id: undefined,
    new_status_id: 'c1111111-1111-1111-1111-111111111111',
    notes: 'Reparo de cruce americano informado por Gerencia.',
    created_at: '2026-09-08T09:00:00Z',
    created_by: 'Dario'
  },
  {
    id: 'f5555555-5555-5555-5555-555555555555',
    repair_id: 'e4444444-4444-4444-4444-444444444444',
    event_type: 'assignment',
    new_responsible_id: 'a1111111-1111-1111-1111-111111111111',
    previous_status_id: 'c1111111-1111-1111-1111-111111111111',
    new_status_id: 'c1111111-1111-1111-1111-111111111111',
    notes: 'Asignado a Obras.',
    created_at: '2026-09-08T10:30:00Z',
    created_by: 'Dario'
  },
  {
    id: 'f6666666-6666-6666-6666-666666666666',
    repair_id: 'e4444444-4444-4444-4444-444444444444',
    event_type: 'resolution',
    previous_status_id: 'c1111111-1111-1111-1111-111111111111',
    new_status_id: 'c7777777-7777-7777-7777-777777777777',
    notes: 'Obras reportó finalización de tendido del cruce.',
    created_at: '2026-09-18T16:30:00Z',
    created_by: 'Carlos'
  }
];
