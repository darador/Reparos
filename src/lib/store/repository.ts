import { INITIAL_PROJECTS, INITIAL_REPAIR_EVENTS, INITIAL_REPAIR_STATUSES, INITIAL_REPAIR_TYPES, INITIAL_REPAIRS, INITIAL_RESPONSIBLE_PARTIES } from "../constants/initial-data";
import { createClient } from "../supabase/client";
import { DashboardMetrics, Project, Repair, RepairEvent, RepairStatus, RepairType, ResponsibleParty } from "../types/database";

// Supabase-Direct Data Store (No LocalStorage caching)
class DataRepository {
  private projects: Project[];
  private repairs: Repair[];
  private events: RepairEvent[];
  private responsibleParties: ResponsibleParty[];
  private repairTypes: RepairType[];
  private repairStatuses: RepairStatus[];

  constructor() {
    this.projects = [];
    this.repairs = [];
    this.events = [];
    this.responsibleParties = [...INITIAL_RESPONSIBLE_PARTIES];
    this.repairTypes = [...INITIAL_REPAIR_TYPES];
    this.repairStatuses = [...INITIAL_REPAIR_STATUSES];

    // Clear legacy localStorage cache if present & sync with Supabase DB
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('ftth_projects');
        localStorage.removeItem('ftth_repairs');
        localStorage.removeItem('ftth_events');
        localStorage.removeItem('ftth_responsible');
        localStorage.removeItem('ftth_types');
        localStorage.removeItem('ftth_statuses');
      } catch (e) {
        // Ignore localStorage cleanup errors
      }
      this.syncWithSupabase();
    }
  }

  async syncWithSupabase() {
    if (typeof window === 'undefined') return;
    try {
      const supabase = createClient();
      if (!supabase) return;

      const [projRes, repRes, evtRes, respRes, typesRes] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('repairs').select('*'),
        supabase.from('repair_events').select('*'),
        supabase.from('responsible_parties').select('*'),
        supabase.from('repair_types').select('*')
      ]);

      if (projRes.data) {
        this.projects = projRes.data;
      }
      if (repRes.data) {
        this.repairs = repRes.data;
      }
      if (evtRes.data) {
        this.events = evtRes.data;
      }

      if (respRes.data && respRes.data.length > 0) {
        const coreNames = ['Obras', 'Ingeniería', 'Equipo Despliegue'];
        const customParties = respRes.data.filter(item => !coreNames.includes(item.name));
        this.responsibleParties = [...INITIAL_RESPONSIBLE_PARTIES, ...customParties];
      }

      if (typesRes.data && typesRes.data.length > 0) {
        this.repairTypes = typesRes.data;
      }
    } catch (err) {
      console.warn('Supabase sync background notice:', err);
    }
  }

  // --- CATALOGS ---
  getResponsibleParties(): ResponsibleParty[] {
    return this.responsibleParties.filter(r => r.is_active);
  }

  getAllResponsibleParties(): ResponsibleParty[] {
    return this.responsibleParties;
  }

  addResponsibleParty(name: string, type: ResponsibleParty['type']): ResponsibleParty {
    const newItem: ResponsibleParty = {
      id: crypto.randomUUID(),
      name,
      type,
      is_active: true,
      created_at: new Date().toISOString()
    };
    this.responsibleParties.push(newItem);

    if (typeof window !== 'undefined') {
      const supabase = createClient();
      if (supabase) {
        supabase.from('responsible_parties').insert([{
          id: newItem.id,
          name: newItem.name,
          type: newItem.type,
          is_active: newItem.is_active,
          created_at: newItem.created_at
        }]).then(({ error }) => {
          if (error) console.warn("Supabase responsible_parties insert notice:", error.message);
        });
      }
    }

    return newItem;
  }

  getRepairTypes(): RepairType[] {
    return this.repairTypes.filter(t => t.is_active);
  }

  getAllRepairTypes(): RepairType[] {
    return this.repairTypes;
  }

  addRepairType(name: string, description?: string): RepairType {
    const newItem: RepairType = {
      id: crypto.randomUUID(),
      name,
      description,
      is_active: true,
      created_at: new Date().toISOString()
    };
    this.repairTypes.push(newItem);

    if (typeof window !== 'undefined') {
      const supabase = createClient();
      if (supabase) {
        supabase.from('repair_types').insert([{
          id: newItem.id,
          name: newItem.name,
          description: newItem.description,
          is_active: newItem.is_active,
          created_at: newItem.created_at
        }]).then(({ error }) => {
          if (error) console.warn("Supabase repair_types insert notice:", error.message);
        });
      }
    }

    return newItem;
  }

  getRepairStatuses(): RepairStatus[] {
    return [...this.repairStatuses].sort((a, b) => a.order_index - b.order_index);
  }

  // --- PROJECTS ---
  getProjects(query?: { search?: string; status?: string }): Project[] {
    let result = this.projects.map(project => {
      const projectRepairs = this.repairs.filter(r => r.project_id === project.id);
      const pendingCount = projectRepairs.filter(r => {
        const st = this.repairStatuses.find(s => s.id === r.current_status_id);
        return st?.category !== 'closed';
      }).length;

      const reiteratedCount = projectRepairs.filter(r => {
        return this.getRepairReiterationCount(r.id) > 0;
      }).length;

      return {
        ...project,
        repairs_count: projectRepairs.length,
        pending_repairs_count: pendingCount,
        reiterated_repairs_count: reiteratedCount
      };
    });

    if (query?.search) {
      const q = query.search.toLowerCase();
      result = result.filter(p => 
        p.sigest.toLowerCase().includes(q) || 
        p.poligono.toLowerCase().includes(q) ||
        (p.distrito && p.distrito.toLowerCase().includes(q)) ||
        (p.ejecutor && p.ejecutor.toLowerCase().includes(q))
      );
    }

    if (query?.status && query.status !== 'all') {
      result = result.filter(p => p.situacion_operativa === query.status);
    }

    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  getProjectById(id: string): Project | undefined {
    const project = this.projects.find(p => p.id === id);
    if (!project) return undefined;
    
    const projectRepairs = this.repairs.filter(r => r.project_id === project.id);
    const pendingCount = projectRepairs.filter(r => {
      const st = this.repairStatuses.find(s => s.id === r.current_status_id);
      return st?.category !== 'closed';
    }).length;

    return {
      ...project,
      repairs_count: projectRepairs.length,
      pending_repairs_count: pendingCount
    };
  }

  createProject(data: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Project {
    const newProject: Project = {
      ...data,
      id: crypto.randomUUID(),
      ctos_count: Number(data.ctos_count) || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: data.created_by || 'Usuario Sistema'
    };
    this.projects.push(newProject);

    if (typeof window !== 'undefined') {
      const supabase = createClient();
      if (supabase) {
        supabase.from('projects').insert([{
          id: newProject.id,
          sigest: newProject.sigest,
          poligono: newProject.poligono,
          distrito: newProject.distrito,
          central: newProject.central,
          titulo: newProject.titulo,
          ejecutor: newProject.ejecutor,
          ctos_count: newProject.ctos_count,
          alimentacion: newProject.alimentacion,
          situacion_operativa: newProject.situacion_operativa,
          observaciones: newProject.observaciones,
          created_at: newProject.created_at,
          updated_at: newProject.updated_at,
          created_by: newProject.created_by
        }]).then(({ error }) => {
          if (error) console.warn("Supabase project insert notice:", error.message);
        });
      }
    }

    return newProject;
  }

  updateProject(id: string, data: Partial<Omit<Project, 'id' | 'created_at'>>): Project {
    const index = this.projects.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Proyecto no encontrado");

    const updated = {
      ...this.projects[index],
      ...data,
      ctos_count: data.ctos_count !== undefined ? Number(data.ctos_count) || 0 : this.projects[index].ctos_count,
      updated_at: new Date().toISOString()
    };

    this.projects[index] = updated;

    if (typeof window !== 'undefined') {
      const supabase = createClient();
      if (supabase) {
        supabase.from('projects').update({
          sigest: updated.sigest,
          poligono: updated.poligono,
          distrito: updated.distrito,
          central: updated.central,
          titulo: updated.titulo,
          ejecutor: updated.ejecutor,
          ctos_count: updated.ctos_count,
          alimentacion: updated.alimentacion,
          situacion_operativa: updated.situacion_operativa,
          observaciones: updated.observaciones,
          updated_at: updated.updated_at
        }).eq('id', id).then(({ error }) => {
          if (error) console.warn("Supabase project update notice:", error.message);
        });
      }
    }

    return this.getProjectById(id) || updated;
  }

  // --- REPAIRS ---
  getRepairs(filters?: {
    search?: string;
    projectId?: string;
    statusId?: string;
    responsibleId?: string;
    priority?: string;
    typeId?: string;
    onlyReiterated?: boolean;
    onlyPending?: boolean;
  }): Repair[] {
    let list = this.repairs.map(r => this.enrichRepair(r));

    if (filters?.projectId) {
      list = list.filter(r => r.project_id === filters.projectId);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(r => 
        r.description.toLowerCase().includes(q) ||
        r.project?.sigest.toLowerCase().includes(q) ||
        r.project?.poligono.toLowerCase().includes(q) ||
        (r.solicitante && r.solicitante.toLowerCase().includes(q))
      );
    }

    if (filters?.statusId && filters.statusId !== 'all') {
      list = list.filter(r => r.current_status_id === filters.statusId);
    }

    if (filters?.responsibleId && filters.responsibleId !== 'all') {
      if (filters.responsibleId === 'unassigned') {
        list = list.filter(r => !r.current_responsible_id);
      } else {
        list = list.filter(r => r.current_responsible_id === filters.responsibleId);
      }
    }

    if (filters?.priority && filters.priority !== 'all') {
      list = list.filter(r => r.priority === filters.priority);
    }

    if (filters?.typeId && filters.typeId !== 'all') {
      list = list.filter(r => r.repair_type_id === filters.typeId);
    }

    if (filters?.onlyReiterated) {
      list = list.filter(r => (r.reiteration_count || 0) > 0);
    }

    if (filters?.onlyPending) {
      list = list.filter(r => r.current_status?.category === 'pending');
    }

    return list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  getRepairById(id: string): Repair | undefined {
    const r = this.repairs.find(item => item.id === id);
    if (!r) return undefined;
    return this.enrichRepair(r);
  }

  createRepair(data: {
    project_id: string;
    repair_type_id?: string;
    description: string;
    priority?: Repair['priority'];
    solicitante?: string;
    current_responsible_id?: string;
    fecha_compromiso?: string;
    observaciones?: string;
    user_name?: string;
  }): Repair {
    // New repair ALWAYS starts in PENDIENTE state
    const pendingStatus = this.repairStatuses.find(s => s.name === 'PENDIENTE') || this.repairStatuses[0];
    const initialStatusId = pendingStatus.id;

    // Default to 'Otro' if no type selected
    const fallbackType = this.repairTypes.find(t => t.name === 'Otro');
    const targetTypeId = data.repair_type_id || fallbackType?.id || this.repairTypes[0]?.id;

    const newRepair: Repair = {
      id: crypto.randomUUID(),
      project_id: data.project_id,
      repair_type_id: targetTypeId,
      description: data.description,
      priority: data.priority || 'Normal',
      solicitante: data.solicitante,
      current_responsible_id: data.current_responsible_id,
      current_status_id: initialStatusId,
      fecha_informado: new Date().toISOString(),
      fecha_compromiso: data.fecha_compromiso,
      observaciones: data.observaciones,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: data.user_name || 'Usuario Sistema'
    };

    this.repairs.push(newRepair);

    // Initial event record
    const creationEvent: RepairEvent = {
      id: crypto.randomUUID(),
      repair_id: newRepair.id,
      event_type: 'creation',
      new_responsible_id: data.current_responsible_id,
      new_status_id: initialStatusId,
      notes: data.current_responsible_id ? 'Reparo registrado y derivado inicialmente.' : 'Reparo registrado en el sistema (PENDIENTE).',
      created_at: new Date().toISOString(),
      created_by: data.user_name || 'Usuario Sistema'
    };
    this.events.push(creationEvent);

    if (typeof window !== 'undefined') {
      const supabase = createClient();
      if (supabase) {
        supabase.from('repairs').insert([{
          id: newRepair.id,
          project_id: newRepair.project_id,
          repair_type_id: newRepair.repair_type_id,
          description: newRepair.description,
          priority: newRepair.priority,
          solicitante: newRepair.solicitante,
          current_responsible_id: newRepair.current_responsible_id,
          current_status_id: newRepair.current_status_id,
          fecha_informado: newRepair.fecha_informado,
          fecha_compromiso: newRepair.fecha_compromiso,
          observaciones: newRepair.observaciones,
          created_at: newRepair.created_at,
          updated_at: newRepair.updated_at,
          created_by: newRepair.created_by
        }]).then(({ error }) => {
          if (error) console.warn("Supabase repair insert notice:", error.message);
        });

        supabase.from('repair_events').insert([{
          id: creationEvent.id,
          repair_id: creationEvent.repair_id,
          event_type: creationEvent.event_type,
          new_responsible_id: creationEvent.new_responsible_id,
          new_status_id: creationEvent.new_status_id,
          notes: creationEvent.notes,
          created_at: creationEvent.created_at,
          created_by: creationEvent.created_by
        }]).then(({ error }) => {
          if (error) console.warn("Supabase event insert notice:", error.message);
        });
      }
    }

    return this.enrichRepair(newRepair);
  }

  // --- EVENTS & TIMELINE ---
  getRepairEvents(repairId: string): RepairEvent[] {
    return this.events
      .filter(e => e.repair_id === repairId)
      .map(e => ({
        ...e,
        previous_responsible: e.previous_responsible_id ? this.responsibleParties.find(r => r.id === e.previous_responsible_id) : undefined,
        new_responsible: e.new_responsible_id ? this.responsibleParties.find(r => r.id === e.new_responsible_id) : undefined,
        previous_status: e.previous_status_id ? this.repairStatuses.find(s => s.id === e.previous_status_id) : undefined,
        new_status: e.new_status_id ? this.repairStatuses.find(s => s.id === e.new_status_id) : undefined,
        created_by_profile: {
          id: 'user-id',
          full_name: e.created_by || 'Usuario Sistema',
          email: 'usuario@empresa.com',
          role: 'admin',
          created_at: e.created_at
        }
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  addRepairEvent(data: {
    repair_id: string;
    event_type: RepairEvent['event_type'];
    new_responsible_id?: string;
    new_status_id?: string;
    verification_result?: RepairEvent['verification_result'];
    notes?: string;
    user_name?: string;
  }): RepairEvent {
    const repair = this.repairs.find(r => r.id === data.repair_id);
    if (!repair) throw new Error("Reparo no encontrado");

    const previous_responsible_id = repair.current_responsible_id;
    const previous_status_id = repair.current_status_id;

    const pendingStatus = this.repairStatuses.find(s => s.name === 'PENDIENTE') || this.repairStatuses[0];
    const resolvedStatus = this.repairStatuses.find(s => s.name === 'VERIFICACIÓN RESUELTO') || this.repairStatuses[1];
    const finalizedStatus = this.repairStatuses.find(s => s.name === 'FINALIZADO') || this.repairStatuses[2];

    let targetStatusId = repair.current_status_id;
    let targetResponsibleId = data.new_responsible_id !== undefined ? data.new_responsible_id : repair.current_responsible_id;

    // V1 Simplified Status Transitions:
    if (data.event_type === 'resolution') {
      targetStatusId = resolvedStatus.id;
    } else if (data.event_type === 'verification') {
      if (data.verification_result === 'solucionado') {
        targetStatusId = finalizedStatus.id;
      } else if (data.verification_result === 'no_solucionado') {
        targetStatusId = pendingStatus.id;
      }
    } else if (data.event_type === 'closure') {
      targetStatusId = finalizedStatus.id;
    } else if (data.new_status_id) {
      targetStatusId = data.new_status_id;
    }

    // Mutate repair record
    repair.current_status_id = targetStatusId;
    repair.current_responsible_id = targetResponsibleId;
    repair.updated_at = new Date().toISOString();

    const newEvent: RepairEvent = {
      id: crypto.randomUUID(),
      repair_id: data.repair_id,
      event_type: data.event_type,
      previous_responsible_id,
      new_responsible_id: targetResponsibleId,
      previous_status_id,
      new_status_id: targetStatusId,
      verification_result: data.verification_result,
      notes: data.notes,
      created_at: new Date().toISOString(),
      created_by: data.user_name || 'Usuario Sistema'
    };

    this.events.push(newEvent);

    if (typeof window !== 'undefined') {
      const supabase = createClient();
      if (supabase) {
        supabase.from('repairs').update({
          current_status_id: targetStatusId,
          current_responsible_id: targetResponsibleId,
          updated_at: repair.updated_at
        }).eq('id', repair.id).then(({ error }) => {
          if (error) console.warn("Supabase repair status update notice:", error.message);
        });

        supabase.from('repair_events').insert([{
          id: newEvent.id,
          repair_id: newEvent.repair_id,
          event_type: newEvent.event_type,
          previous_responsible_id,
          new_responsible_id: targetResponsibleId,
          previous_status_id,
          new_status_id: targetStatusId,
          verification_result: data.verification_result,
          notes: data.notes,
          created_at: newEvent.created_at,
          created_by: newEvent.created_by
        }]).then(({ error }) => {
          if (error) console.warn("Supabase event insert notice:", error.message);
        });
      }
    }

    return newEvent;
  }

  // Helper to accurately count reiterations from event history
  getRepairReiterationCount(repairId: string, eventsList?: RepairEvent[]): number {
    const events = (eventsList || this.events.filter(e => e.repair_id === repairId))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    let count = 0;
    let hasHadClaim = false;

    events.forEach((e) => {
      const prevStatus = this.repairStatuses.find(s => s.id === e.previous_status_id);
      const isPrevResolvedOrClosed = prevStatus?.category === 'resolved' || prevStatus?.category === 'closed' || prevStatus?.name === 'VERIFICACIÓN RESUELTO' || prevStatus?.name === 'FINALIZADO';

      const isExplicitReiteration = e.event_type === 'reiteration' || e.verification_result === 'no_solucionado';
      const isReopeningFromResolved = isPrevResolvedOrClosed && (e.event_type === 'reclaim' || e.event_type === 'follow_up' || e.event_type === 'assignment' || e.event_type === 'verification' || e.event_type === 'derivation');
      const isSubsequentClaim = e.event_type === 'reclaim' && hasHadClaim;

      if (isExplicitReiteration || isReopeningFromResolved || isSubsequentClaim) {
        count++;
      }

      if (e.event_type === 'reclaim') {
        hasHadClaim = true;
      }
    });

    return count;
  }

  // --- DASHBOARD METRICS ---
  getDashboardMetrics(): DashboardMetrics {
    const totalProjects = this.projects.length;
    const activeProjects = this.projects.filter(p => p.situacion_operativa === 'En ejecución').length;
    const totalRepairs = this.repairs.length;

    const pendingRepairs = this.repairs.filter(r => {
      const st = this.repairStatuses.find(s => s.id === r.current_status_id);
      return st?.category === 'pending' || st?.name === 'PENDIENTE';
    }).length;

    const resolvedAwaitingVerification = this.repairs.filter(r => {
      const st = this.repairStatuses.find(s => s.id === r.current_status_id);
      return st?.category === 'resolved' || st?.name === 'VERIFICACIÓN RESUELTO';
    }).length;

    const finalizedRepairs = this.repairs.filter(r => {
      const st = this.repairStatuses.find(s => s.id === r.current_status_id);
      return st?.category === 'closed' || st?.name === 'FINALIZADO';
    }).length;

    const reiteratedRepairs = this.repairs.filter(r => {
      return this.getRepairReiterationCount(r.id) > 0;
    }).length;

    return {
      totalProjects,
      activeProjects,
      totalRepairs,
      pendingRepairs,
      reiteratedRepairs,
      resolvedAwaitingVerification,
      finalizedRepairs
    };
  }

  // Helper method to join relations
  private enrichRepair(r: Repair): Repair {
    const project = this.projects.find(p => p.id === r.project_id);
    const repair_type = this.repairTypes.find(t => t.id === r.repair_type_id);
    const current_responsible = r.current_responsible_id ? this.responsibleParties.find(resp => resp.id === r.current_responsible_id) : undefined;
    const current_status = this.repairStatuses.find(s => s.id === r.current_status_id);

    const repairEvents = this.events.filter(e => e.repair_id === r.id);
    const reiterationCount = this.getRepairReiterationCount(r.id, repairEvents);
    const reiterationsList = repairEvents.filter(e => {
      const prevStatus = this.repairStatuses.find(s => s.id === e.previous_status_id);
      const isPrevResolvedOrClosed = prevStatus?.category === 'resolved' || prevStatus?.category === 'closed';
      return e.event_type === 'reiteration' || e.verification_result === 'no_solucionado' || (isPrevResolvedOrClosed && e.event_type !== 'closure');
    });

    const lastEvent = repairEvents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    return {
      ...r,
      project,
      repair_type,
      current_responsible,
      current_status,
      created_by_profile: {
        id: 'user-id',
        full_name: r.created_by || 'Usuario Sistema',
        email: 'usuario@empresa.com',
        role: 'admin',
        created_at: r.created_at
      },
      reiteration_count: reiterationCount,
      last_reiteration_at: reiterationsList[0]?.created_at,
      last_event_at: lastEvent?.created_at
    };
  }
}

// Global Singleton Instance for client & server components
export const repository = new DataRepository();
