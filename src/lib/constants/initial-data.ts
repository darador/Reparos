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

export const INITIAL_PROJECTS: Project[] = [];

export const INITIAL_REPAIRS: Repair[] = [];

export const INITIAL_REPAIR_EVENTS: RepairEvent[] = [];

export const SOLICITANTES_LIST = [
  'AMIGO SEBASTIAN',
  'ALBANESE JESUS',
  'ARMIGNACCO ADRIAN',
  'JARA ESTEBAN',
  'MARCHAT ALEJANDRO',
  'MARCHAT JONATAN',
  'KOZDRON MATIAS',
  'ROMERO GUSTAVO',
  'SALDIAS PABLO'
];

export const RESPONSABLES_INICIALES_LIST = [
  'Obras / ALI EDUARDO',
  'Obras / DE LIO MARIANO',
  'Obras / DI PASQUO EMILIO',
  'Obras / LUTZ MARIA',
  'Ingeniería / BENITEZ DANIEL',
  'Ingeniería / PANDIANI'
];

export const DISTRITOS_LIST = [
  'FLORENCIO VARELA',
  'LANUS',
  'LOMAS',
  'MONTEGRANDE'
];
