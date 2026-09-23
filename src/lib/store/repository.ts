import { getStoredAuthUser, getUserDisplayName } from "../auth";
import { INITIAL_PROJECTS, INITIAL_REPAIR_EVENTS, INITIAL_REPAIR_STATUSES, INITIAL_REPAIR_TYPES, INITIAL_REPAIRS, INITIAL_RESPONSIBLE_PARTIES } from "../constants/initial-data";
import { createClient } from "../supabase/client";
import { DashboardMetrics, Project, Repair, RepairEvent, RepairStatus, RepairType, ResponsibleParty } from "../types/database";

// Safe cross-browser UUID generator fallback
function generateUUID(): string {
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Supabase-Direct Data Store with strict Async Await confirmation & FK safety
class DataRepository {
  public isLoaded: boolean = false;
  private syncPromise: Promise<void> | null = null;

  private projects: Project[];
  private repairs: Repair[];
  private events: RepairEvent[];
  private responsibleParties: ResponsibleParty[];

  private getActiveUserDisplayName(fallbackInput?: string): string {
    const stored = getStoredAuthUser();
    if (stored && stored.username) {
      return stored.displayName || getUserDisplayName(stored.username);
    }
    return fallbackInput || 'Usuario Sistema';
  }
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
      this.syncPromise = this.syncWithSupabase();
    }
  }

  async ensureLoaded(): Promise<void> {
    if (this.isLoaded) return;
    if (this.syncPromise) {
      await this.syncPromise;
      return;
    }
    this.syncPromise = this.syncWithSupabase();
    await this.syncPromise;
  }

  async syncWithSupabase(): Promise<void> {
    if (typeof window === 'undefined') {
      this.isLoaded = true;
      return;
    }
    try {
      const supabase = createClient();
      if (!supabase) {
        this.isLoaded = true;
        return;
      }

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
        this.responsibleParties = respRes.data;
      }

      if (typesRes.data && typesRes.data.length > 0) {
        this.repairTypes = typesRes.data;
      }
    } catch (err) {
      console.warn('Supabase sync background notice:', err);
    } finally {
      this.isLoaded = true;
    }
  }

  // --- CATALOGS ---
  getResponsibleParties(): ResponsibleParty[] {
    return this.responsibleParties.filter(r => r.is_active);
  }

  getAllResponsibleParties(): ResponsibleParty[] {
    return this.responsibleParties;
  }

  async addResponsibleParty(name: string, type: ResponsibleParty['type'] = 'contractor'): Promise<ResponsibleParty> {
    await this.ensureLoaded();
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Nombre de responsable no válido");

    // Check if responsible party with this exact name already exists in memory
    const existing = this.responsibleParties.find(r => r.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      return existing;
    }

    const newItem: ResponsibleParty = {
      id: generateUUID(),
      name: trimmed,
      type,
      is_active: true,
      created_at: new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
      const supabase = createClient();
      if (supabase) {
        // Try inserting into Supabase
        const { error } = await supabase.from('responsible_parties').insert([{
          id: newItem.id,
          name: newItem.name,
          type: newItem.type,
          is_active: newItem.is_active,
          created_at: newItem.created_at
        }]);

        if (error) {
          console.warn("Supabase responsible_parties insert notice:", error.message);
          // If insert failed (e.g. duplicate key or RLS restriction), query Supabase for an existing row by name
          const { data: dbMatches } = await supabase.from('responsible_parties').select('*').ilike('name', trimmed).limit(1);
          if (dbMatches && dbMatches.length > 0) {
            const found = dbMatches[0];
            if (!this.responsibleParties.some(p => p.id === found.id)) {
              this.responsibleParties.push(found);
            }
            return found;
          }
          // If still failing, check if any responsible party exists in memory as safe fallback
          if (this.responsibleParties.length > 0) {
            return this.responsibleParties[0];
          }
        }
      }
    }

    this.responsibleParties.push(newItem);
    return newItem;
  }

  getRepairTypes(): RepairType[] {
    return this.repairTypes.filter(t => t.is_active);
  }

  getAllRepairTypes(): RepairType[] {
    return this.repairTypes;
  }

  async addRepairType(name: string, description?: string): Promise<RepairType> {
    const newItem: RepairType = {
      id: generateUUID(),
      name,
      description,
      is_active: true,
      created_at: new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
      const supabase = createClient();
      if (supabase) {
        const { error } = await supabase.from('repair_types').insert([{
          id: newItem.id,
          name: newItem.name,
          description: newItem.description,
          is_active: newItem.is_active,
          created_at: newItem.created_at
        }]);
        if (error) {
          console.error("Supabase repair_types insert error:", error.message);
        }
      }
    }

    this.repairTypes.push(newItem);
    return newItem;
  }

  getRepairStatuses(): RepairStatus[] {
    return [...this.repairStatuses].sort((a, b) => a.order_index - b.order_index);
  }

  getDistritos(): string[] {
    const list = this.projects
      .map(p => p.distrito?.trim())
      .filter((d): d is string => !!d);
    return Array.from(new Set(list)).sort();
  }

  getCentrales(): string[] {
    const list = this.projects
      .map(p => p.central?.trim())
      .filter((c): c is string => !!c);
    return Array.from(new Set(list)).sort();
  }

  // --- PROJECTS ---
  getProjects(query?: {
    search?: string;
    status?: string;
    distrito?: string;
    central?: string;
  }): Project[] {
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
        (p.central && p.central.toLowerCase().includes(q)) ||
        (p.ejecutor && p.ejecutor.toLowerCase().includes(q))
      );
    }

    if (query?.status && query.status !== 'all') {
      result = result.filter(p => p.situacion_operativa === query.status);
    }

    if (query?.distrito && query.distrito !== 'all') {
      const targetDis = query.distrito.toLowerCase();
      result = result.filter(p => (p.distrito || '').toLowerCase() === targetDis);
    }

    if (query?.central && query.central !== 'all') {
      const targetCen = query.central.toLowerCase();
      result = result.filter(p => (p.central || '').toLowerCase() === targetCen);
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

  async createProject(data: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    await this.ensureLoaded();
    const newProject: Project = {
      ...data,
      id: generateUUID(),
      ctos_count: Number(data.ctos_count) || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: this.getActiveUserDisplayName(data.created_by)
    };

    if (typeof window !== 'undefined') {
      const supabase = createClient();
      if (supabase) {
        const { error } = await supabase.from('projects').insert([{
          id: newProject.id,
          sigest: newProject.sigest,
          poligono: newProject.poligono,
          distrito: newProject.distrito || null,
          central: newProject.central || null,
          titulo: newProject.titulo || null,
          ejecutor: newProject.ejecutor || null,
          ctos_count: newProject.ctos_count,
          alimentacion: newProject.alimentacion || 'NO',
          situacion_operativa: newProject.situacion_operativa,
          observaciones: newProject.observaciones || null,
          created_at: newProject.created_at,
          updated_at: newProject.updated_at,
          created_by: newProject.created_by
        }]);

        if (error) {
          console.error("Error creating project in Supabase:", error.message);
          throw new Error("No se pudo guardar el proyecto en Supabase: " + error.message);
        }
      }
    }

    this.projects.push(newProject);
    return newProject;
  }

  async updateProject(id: string, data: Partial<Omit<Project, 'id' | 'created_at'>>): Promise<Project> {
    await this.ensureLoaded();
    const index = this.projects.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Proyecto no encontrado");

    const updated = {
      ...this.projects[index],
      ...data,
      ctos_count: data.ctos_count !== undefined ? Number(data.ctos_count) || 0 : this.projects[index].ctos_count,
      updated_at: new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
      const supabase = createClient();
      if (supabase) {
        const { error } = await supabase.from('projects').update({
          sigest: updated.sigest,
          poligono: updated.poligono,
          distrito: updated.distrito || null,
          central: updated.central || null,
          titulo: updated.titulo || null,
          ejecutor: updated.ejecutor || null,
          ctos_count: updated.ctos_count,
          alimentacion: updated.alimentacion || 'NO',
          situacion_operativa: updated.situacion_operativa,
          observaciones: updated.observaciones || null,
          updated_at: updated.updated_at
        }).eq('id', id);

        if (error) {
          console.error("Error updating project in Supabase:", error.message);
          throw new Error("No se pudo actualizar el proyecto en Supabase: " + error.message);
        }
      }
    }

    this.projects[index] = updated;
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
    distrito?: string;
    central?: string;
    onlyReiterated?: boolean;
    onlyPending?: boolean;
  }): Repair[] {
    let list = (this.repairs || []).filter(Boolean).map(r => this.enrichRepair(r)).filter(Boolean);

    if (filters?.projectId) {
      list = list.filter(r => r.project_id === filters.projectId);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(r => 
        (r.description || '').toLowerCase().includes(q) ||
        (r.project?.sigest || '').toLowerCase().includes(q) ||
        (r.project?.poligono || '').toLowerCase().includes(q) ||
        (r.project?.distrito && r.project.distrito.toLowerCase().includes(q)) ||
        (r.project?.central && r.project.central.toLowerCase().includes(q)) ||
        (r.solicitante && r.solicitante.toLowerCase().includes(q))
      );
    }

    if (filters?.statusId && filters.statusId !== 'all') {
      list = list.filter(r => r.current_status_id === filters.statusId);
    }

    if (filters?.responsibleId && filters.responsibleId !== 'all') {
      if (filters.responsibleId === 'unassigned') {
        list = list.filter(r => !r.current_responsible_id);
      } else if (filters.responsibleId.startsWith('AREA:')) {
        const areaName = filters.responsibleId.replace('AREA:', '').toLowerCase().replace('ía', 'ia');
        list = list.filter(r => {
          const respName = (r.current_responsible?.name || '').toLowerCase().replace('ía', 'ia');
          return respName.startsWith(areaName) || respName.includes(areaName);
        });
      } else {
        const targetParty = this.responsibleParties.find(p => p.id === filters.responsibleId);
        const targetName = (targetParty ? targetParty.name : filters.responsibleId).toLowerCase().replace('ía', 'ia');

        if (targetName === 'obras' || targetName === 'ingenieria') {
          list = list.filter(r => {
            const respName = (r.current_responsible?.name || '').toLowerCase().replace('ía', 'ia');
            return r.current_responsible_id === filters.responsibleId || respName.startsWith(targetName) || respName.includes(targetName);
          });
        } else {
          list = list.filter(r => 
            r.current_responsible_id === filters.responsibleId || 
            (r.current_responsible?.name || '').toLowerCase() === (targetParty?.name || '').toLowerCase()
          );
        }
      }
    }

    if (filters?.priority && filters.priority !== 'all') {
      list = list.filter(r => r.priority === filters.priority);
    }

    if (filters?.typeId && filters.typeId !== 'all') {
      list = list.filter(r => r.repair_type_id === filters.typeId);
    }

    if (filters?.distrito && filters.distrito !== 'all') {
      const targetDis = filters.distrito.toLowerCase();
      list = list.filter(r => (r.project?.distrito || '').toLowerCase() === targetDis);
    }

    if (filters?.central && filters.central !== 'all') {
      const targetCen = filters.central.toLowerCase();
      list = list.filter(r => (r.project?.central || '').toLowerCase() === targetCen);
    }

    if (filters?.onlyReiterated) {
      list = list.filter(r => (r.reiteration_count || 0) > 0);
    }

    if (filters?.onlyPending) {
      list = list.filter(r => r.current_status?.category === 'pending' || r.current_status?.name === 'PENDIENTE');
    }

    return list.sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
  }

  getRepairById(id: string): Repair | undefined {
    const r = this.repairs.find(item => item.id === id);
    if (!r) return undefined;
    return this.enrichRepair(r);
  }

  async createRepair(data: {
    project_id: string;
    repair_type_id?: string;
    description: string;
    priority?: Repair['priority'];
    solicitante?: string;
    current_responsible_id?: string;
    fecha_informado?: string;
    fecha_compromiso?: string;
    observaciones?: string;
    user_name?: string;
  }): Promise<Repair> {
    await this.ensureLoaded();
    const pendingStatus = this.repairStatuses.find(s => s.name === 'PENDIENTE') || this.repairStatuses[0];
    const initialStatusId = pendingStatus.id;

    const fallbackType = this.repairTypes.find(t => t.name === 'Otro');
    const targetTypeId = data.repair_type_id || fallbackType?.id || this.repairTypes[0]?.id;

    // Verify responsible ID actually exists in responsibleParties before inserting
    let validRespId = data.current_responsible_id || null;
    if (validRespId && !this.responsibleParties.some(p => p.id === validRespId)) {
      validRespId = null;
    }

    let finalFechaInformado = new Date().toISOString();
    if (data.fecha_informado) {
      finalFechaInformado = data.fecha_informado.includes('T')
        ? new Date(data.fecha_informado).toISOString()
        : new Date(`${data.fecha_informado}T12:00:00`).toISOString();
    }

    const newRepair: Repair = {
      id: generateUUID(),
      project_id: data.project_id,
      repair_type_id: targetTypeId,
      description: data.description,
      priority: data.priority || 'Normal',
      solicitante: data.solicitante,
      current_responsible_id: validRespId || undefined,
      current_status_id: initialStatusId,
      fecha_informado: finalFechaInformado,
      fecha_compromiso: data.fecha_compromiso,
      observaciones: data.observaciones,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: this.getActiveUserDisplayName(data.user_name)
    };

    const creationEvent: RepairEvent = {
      id: generateUUID(),
      repair_id: newRepair.id,
      event_type: 'creation',
      new_responsible_id: validRespId || undefined,
      new_status_id: initialStatusId,
      notes: validRespId ? 'Reparo registrado y derivado inicialmente.' : 'Reparo registrado en el sistema (PENDIENTE).',
      created_at: new Date().toISOString(),
      created_by: this.getActiveUserDisplayName(data.user_name)
    };

    if (typeof window !== 'undefined') {
      const supabase = createClient();
      if (supabase) {
        const { error: repErr } = await supabase.from('repairs').insert([{
          id: newRepair.id,
          project_id: newRepair.project_id,
          repair_type_id: newRepair.repair_type_id || null,
          description: newRepair.description,
          priority: newRepair.priority,
          solicitante: newRepair.solicitante || null,
          current_responsible_id: validRespId,
          current_status_id: newRepair.current_status_id,
          fecha_informado: newRepair.fecha_informado,
          fecha_compromiso: newRepair.fecha_compromiso || null,
          observaciones: newRepair.observaciones || null,
          created_at: newRepair.created_at,
          updated_at: newRepair.updated_at,
          created_by: newRepair.created_by
        }]);

        if (repErr) {
          console.error("Error creating repair in Supabase:", repErr.message);
          throw new Error("No se pudo registrar el reparo en Supabase: " + repErr.message);
        }

        const { error: evtErr } = await supabase.from('repair_events').insert([{
          id: creationEvent.id,
          repair_id: creationEvent.repair_id,
          event_type: creationEvent.event_type,
          previous_responsible_id: null,
          new_responsible_id: validRespId,
          previous_status_id: null,
          new_status_id: creationEvent.new_status_id || null,
          notes: creationEvent.notes || null,
          created_at: creationEvent.created_at,
          created_by: creationEvent.created_by
        }]);

        if (evtErr) {
          console.warn("Notice: creation event insert error:", evtErr.message);
        }
      }
    }

    this.repairs.push(newRepair);
    this.events.push(creationEvent);
    return this.enrichRepair(newRepair);
  }

  async updateRepair(id: string, data: Partial<Omit<Repair, 'id' | 'created_at'>>, user_name?: string): Promise<Repair> {
    await this.ensureLoaded();
    const index = this.repairs.findIndex(r => r.id === id);
    if (index === -1) throw new Error("Reparo no encontrado");

    const oldRepair = this.repairs[index];
    const prevResponsibleId = oldRepair.current_responsible_id;

    let targetRespId = data.current_responsible_id !== undefined ? data.current_responsible_id : oldRepair.current_responsible_id;
    if (targetRespId && !this.responsibleParties.some(p => p.id === targetRespId)) {
      targetRespId = undefined;
    }

    let targetFechaInformado = oldRepair.fecha_informado;
    if (data.fecha_informado) {
      targetFechaInformado = data.fecha_informado.includes('T')
        ? new Date(data.fecha_informado).toISOString()
        : new Date(`${data.fecha_informado}T12:00:00`).toISOString();
    }

    const updated: Repair = {
      ...oldRepair,
      ...data,
      current_responsible_id: targetRespId,
      fecha_informado: targetFechaInformado,
      updated_at: new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
      const supabase = createClient();
      if (supabase) {
        const { error } = await supabase.from('repairs').update({
          project_id: updated.project_id,
          repair_type_id: updated.repair_type_id || null,
          description: updated.description,
          priority: updated.priority,
          solicitante: updated.solicitante || null,
          current_responsible_id: targetRespId || null,
          current_status_id: updated.current_status_id,
          fecha_informado: updated.fecha_informado,
          fecha_compromiso: updated.fecha_compromiso || null,
          observaciones: updated.observaciones || null,
          updated_at: updated.updated_at
        }).eq('id', id);

        if (error) {
          console.error("Error updating repair in Supabase:", error.message);
          throw new Error("No se pudo actualizar el reparo en Supabase: " + error.message);
        }

        if (targetRespId !== prevResponsibleId) {
          const editEvent: RepairEvent = {
            id: generateUUID(),
            repair_id: id,
            event_type: 'assignment',
            previous_responsible_id: prevResponsibleId || undefined,
            new_responsible_id: targetRespId || undefined,
            previous_status_id: oldRepair.current_status_id,
            new_status_id: updated.current_status_id,
            notes: 'Responsable modificado en edición.',
            created_at: new Date().toISOString(),
            created_by: this.getActiveUserDisplayName(user_name)
          };
          this.events.push(editEvent);

          await supabase.from('repair_events').insert([{
            id: editEvent.id,
            repair_id: editEvent.repair_id,
            event_type: editEvent.event_type,
            previous_responsible_id: editEvent.previous_responsible_id || null,
            new_responsible_id: editEvent.new_responsible_id || null,
            previous_status_id: editEvent.previous_status_id || null,
            new_status_id: editEvent.new_status_id || null,
            notes: editEvent.notes || null,
            created_at: editEvent.created_at,
            created_by: editEvent.created_by
          }]);
        }
      }
    }

    this.repairs[index] = updated;
    return this.enrichRepair(updated);
  }

  async updateRepairResponsible(id: string, responsibleId: string | undefined, user_name?: string): Promise<Repair> {
    return await this.updateRepair(id, { current_responsible_id: responsibleId }, user_name);
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

  async addRepairEvent(data: {
    repair_id: string;
    event_type: RepairEvent['event_type'];
    new_responsible_id?: string;
    new_status_id?: string;
    verification_result?: RepairEvent['verification_result'];
    notes?: string;
    user_name?: string;
  }): Promise<RepairEvent> {
    await this.ensureLoaded();

    const repair = this.repairs.find(r => r.id === data.repair_id);
    if (!repair) throw new Error("Reparo no encontrado");

    let previous_responsible_id = repair.current_responsible_id;
    if (previous_responsible_id && !this.responsibleParties.some(p => p.id === previous_responsible_id)) {
      previous_responsible_id = undefined;
    }

    const previous_status_id = repair.current_status_id;

    const pendingStatus = this.repairStatuses.find(s => s.name === 'PENDIENTE') || this.repairStatuses[0];
    const resolvedStatus = this.repairStatuses.find(s => s.name === 'VERIFICACIÓN RESUELTO') || this.repairStatuses[1];
    const finalizedStatus = this.repairStatuses.find(s => s.name === 'FINALIZADO') || this.repairStatuses[2];

    let targetStatusId = repair.current_status_id;
    let targetResponsibleId = data.new_responsible_id !== undefined ? data.new_responsible_id : repair.current_responsible_id;

    if (targetResponsibleId && !this.responsibleParties.some(p => p.id === targetResponsibleId)) {
      targetResponsibleId = undefined;
    }

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

    const newEvent: RepairEvent = {
      id: generateUUID(),
      repair_id: data.repair_id,
      event_type: data.event_type,
      previous_responsible_id,
      new_responsible_id: targetResponsibleId,
      previous_status_id,
      new_status_id: targetStatusId,
      verification_result: data.verification_result,
      notes: data.notes,
      created_at: new Date().toISOString(),
      created_by: this.getActiveUserDisplayName(data.user_name)
    };

    if (typeof window !== 'undefined') {
      const supabase = createClient();
      if (supabase) {
        const { error: repErr } = await supabase.from('repairs').update({
          current_status_id: targetStatusId,
          current_responsible_id: targetResponsibleId || null,
          updated_at: new Date().toISOString()
        }).eq('id', repair.id);

        if (repErr) {
          console.error("Error updating repair status in Supabase:", repErr.message);
          throw new Error("No se pudo actualizar el estado del reparo en Supabase: " + repErr.message);
        }

        const { error: evtErr } = await supabase.from('repair_events').insert([{
          id: newEvent.id,
          repair_id: newEvent.repair_id,
          event_type: newEvent.event_type,
          previous_responsible_id: previous_responsible_id || null,
          new_responsible_id: targetResponsibleId || null,
          previous_status_id: previous_status_id || null,
          new_status_id: targetStatusId || null,
          verification_result: data.verification_result || null,
          notes: data.notes || null,
          created_at: newEvent.created_at,
          created_by: newEvent.created_by
        }]);

        if (evtErr) {
          console.error("Error inserting repair event in Supabase:", evtErr.message);
          throw new Error("No se pudo registrar el evento del reparo en Supabase: " + evtErr.message);
        }
      }
    }

    repair.current_status_id = targetStatusId;
    repair.current_responsible_id = targetResponsibleId;
    repair.updated_at = newEvent.created_at;
    this.events.push(newEvent);

    return newEvent;
  }

  // Helper to accurately count reiterations from event history
  getRepairReiterationCount(repairId: string, eventsList?: RepairEvent[]): number {
    const rawEvents = eventsList || this.events.filter(e => e.repair_id === repairId);
    const events = [...rawEvents].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

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
    if (!r) return r;
    const project = r.project_id ? (this.projects || []).find(p => p && p.id === r.project_id) : undefined;
    const repair_type = r.repair_type_id ? (this.repairTypes || []).find(t => t && t.id === r.repair_type_id) : undefined;
    const current_responsible = r.current_responsible_id ? (this.responsibleParties || []).find(resp => resp && resp.id === r.current_responsible_id) : undefined;
    const current_status = r.current_status_id ? (this.repairStatuses || []).find(s => s && s.id === r.current_status_id) : undefined;

    const repairEvents = (this.events || []).filter(e => e && e.repair_id === r.id);
    const reiterationCount = this.getRepairReiterationCount(r.id, repairEvents);
    const reclaimCount = repairEvents.filter(e => e && e.event_type === 'reclaim').length;

    const reiterationsList = repairEvents.filter(e => {
      if (!e) return false;
      const prevStatus = (this.repairStatuses || []).find(s => s && s.id === e.previous_status_id);
      const isPrevResolvedOrClosed = prevStatus?.category === 'resolved' || prevStatus?.category === 'closed';
      return e.event_type === 'reiteration' || e.verification_result === 'no_solucionado' || (isPrevResolvedOrClosed && e.event_type !== 'closure');
    });

    const lastEvent = [...repairEvents].sort((a, b) => new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime())[0];

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
      reclaim_count: reclaimCount,
      last_reiteration_at: reiterationsList[0]?.created_at,
      last_event_at: lastEvent?.created_at
    };
  }
}

// Global Singleton Instance for client & server components
export const repository = new DataRepository();
