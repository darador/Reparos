import { getStoredAuthUser, getUserDisplayName } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';
import { MopCategory, MopCto, MopImportHistory, MopMetrics, MopStatus } from '@/lib/types/database';
import * as XLSX from 'xlsx';

export interface ParsedMopRow {
  sigest: string;
  poligono: string;
  cto: string;
  central: string;
  pelo: string;
  instalacion_toa: string;
  certificacion_toa: string;
  responsable_cto: string;
  categoria_origen: MopCategory;
}

export interface MopImportPreview {
  valid: boolean;
  filename: string;
  sheetCounts: Record<string, number>;
  totalFound: number;
  newCount: number;
  updateCount: number;
  absentCount: number;
  duplicatesCount: number;
  duplicateDetails: Array<{ sigest: string; poligono: string; cto: string; sheet: string }>;
  errors: string[];
  warnings: string[];
  parsedRows: ParsedMopRow[];
}

export interface GetMopCtosParams {
  categoria?: string;
  responsable?: string;
  central?: string;
  estado?: string;
  isAusente?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

const REQUIRED_SHEETS = [
  'Certifcar',
  'INstalar y Certificar',
  'Adelantar',
  'Dem Trab Ter',
  'Demorado'
];

function normalizeCategoryName(sheetName: string): MopCategory | null {
  const clean = sheetName.trim().toLowerCase();
  if (clean === 'certifcar' || clean === 'certificar') return 'Certifcar';
  if (clean === 'instalar y certificar' || clean === 'instalar y certifcar') return 'Instalar y Certificar';
  if (clean === 'adelantar') return 'Adelantar';
  if (clean === 'dem trab ter') return 'Dem Trab Ter';
  if (clean === 'demorado') return 'Demorado';
  return null;
}

function findColumnHeader(headers: string[], candidates: string[]): string | undefined {
  return headers.find(h => {
    const norm = h.trim().toLowerCase().replace(/[\s_\-]+/g, ' ');
    return candidates.some(c => norm === c.toLowerCase() || norm.includes(c.toLowerCase()));
  });
}

function cleanString(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function buildCompositeKey(sigest: string, poligono: string, cto: string): string {
  return `${cleanString(sigest).toUpperCase()}|${cleanString(poligono).toUpperCase()}|${cleanString(cto).toUpperCase()}`;
}

const LOCAL_STORAGE_CTOS_KEY = 'mop_ctos_local_backup';
const LOCAL_STORAGE_HISTORY_KEY = 'mop_history_local_backup';

class MopService {
  private inMemoryCtos: MopCto[] = [];
  private inMemoryHistory: MopImportHistory[] = [];
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadLocalBackup();
    }
  }

  private loadLocalBackup() {
    try {
      const rawCtos = localStorage.getItem(LOCAL_STORAGE_CTOS_KEY);
      if (rawCtos) {
        this.inMemoryCtos = JSON.parse(rawCtos);
      }
      const rawHist = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (rawHist) {
        this.inMemoryHistory = JSON.parse(rawHist);
      }
    } catch (e) {
      // Ignore
    }
  }

  private saveLocalBackup() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_CTOS_KEY, JSON.stringify(this.inMemoryCtos));
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(this.inMemoryHistory));
      }
    } catch (e) {
      // Ignore
    }
  }

  private getActiveUsername(): string {
    const user = getStoredAuthUser();
    if (user && user.username) {
      return user.displayName || getUserDisplayName(user.username);
    }
    return 'Usuario Sistema';
  }

  /**
   * Obtiene el listado de CTOs con paginación, filtros combinados y ordenamiento.
   */
  async getMopCtos(params: GetMopCtosParams = {}): Promise<{ data: MopCto[]; total: number; metrics: MopMetrics; filterOptions: { responsables: string[]; centrales: string[] } }> {
    const {
      categoria = 'all',
      responsable = 'all',
      central = 'all',
      estado = 'all',
      isAusente,
      search = '',
      page = 1,
      pageSize = 50,
      sortColumn = 'sigest',
      sortDirection = 'asc'
    } = params;

    const supabase = createClient();

    // Si Supabase está disponible, consultar directamente
    if (supabase) {
      try {
        let query = supabase.from('mop_ctos').select('*', { count: 'exact' });

        if (categoria && categoria !== 'all') {
          query = query.eq('categoria_origen', categoria);
        }
        if (responsable && responsable !== 'all') {
          query = query.eq('responsable_cto', responsable);
        }
        if (central && central !== 'all') {
          query = query.eq('central', central);
        }
        if (estado && estado !== 'all') {
          query = query.eq('estado', estado);
        }
        if (typeof isAusente === 'boolean') {
          query = query.eq('is_ausente', isAusente);
        }

        const trimmedSearch = search.trim();
        if (trimmedSearch) {
          query = query.or(`sigest.ilike.%${trimmedSearch}%,poligono.ilike.%${trimmedSearch}%,cto.ilike.%${trimmedSearch}%`);
        }

        // Ordenamiento
        const ascending = sortDirection === 'asc';
        if (sortColumn === 'sigest') {
          query = query.order('sigest', { ascending }).order('poligono', { ascending }).order('cto', { ascending });
        } else if (sortColumn === 'central') {
          query = query.order('central', { ascending, nullsFirst: false });
        } else if (sortColumn === 'cto') {
          query = query.order('cto', { ascending });
        } else if (sortColumn === 'responsable') {
          query = query.order('responsable_cto', { ascending, nullsFirst: false });
        } else if (sortColumn === 'estado') {
          query = query.order('estado', { ascending });
        } else {
          query = query.order('created_at', { ascending: false });
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        const { data, count, error } = await query.range(from, to);

        if (!error && data) {
          // Obtener métricas y opciones de filtro para el contexto
          const metrics = await this.getMopMetrics(params);
          const filterOptions = await this.getFilterOptions();
          return {
            data: data as MopCto[],
            total: count || 0,
            metrics,
            filterOptions
          };
        } else if (error) {
          console.warn("Supabase mop_ctos query notice, falling back to local store:", error.message);
        }
      } catch (e) {
        console.warn("Supabase query exception:", e);
      }
    }

    // Fallback local en memoria
    let filtered = [...this.inMemoryCtos];

    if (categoria && categoria !== 'all') {
      filtered = filtered.filter(c => c.categoria_origen === categoria);
    }
    if (responsable && responsable !== 'all') {
      filtered = filtered.filter(c => c.responsable_cto === responsable);
    }
    if (central && central !== 'all') {
      filtered = filtered.filter(c => c.central === central);
    }
    if (estado && estado !== 'all') {
      filtered = filtered.filter(c => c.estado === estado);
    }
    if (typeof isAusente === 'boolean') {
      filtered = filtered.filter(c => c.is_ausente === isAusente);
    }

    const trimmedSearch = search.trim().toLowerCase();
    if (trimmedSearch) {
      filtered = filtered.filter(c =>
        c.sigest.toLowerCase().includes(trimmedSearch) ||
        c.poligono.toLowerCase().includes(trimmedSearch) ||
        c.cto.toLowerCase().includes(trimmedSearch)
      );
    }

    filtered.sort((a, b) => {
      let valA: string = '';
      let valB: string = '';
      if (sortColumn === 'sigest') {
        valA = `${a.sigest}_${a.poligono}_${a.cto}`;
        valB = `${b.sigest}_${b.poligono}_${b.cto}`;
      } else if (sortColumn === 'central') {
        valA = a.central || '';
        valB = b.central || '';
      } else if (sortColumn === 'cto') {
        valA = a.cto || '';
        valB = b.cto || '';
      } else if (sortColumn === 'responsable') {
        valA = a.responsable_cto || '';
        valB = b.responsable_cto || '';
      } else if (sortColumn === 'estado') {
        valA = a.estado || '';
        valB = b.estado || '';
      }
      return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    const metrics = this.computeMetricsFromList(filtered);
    const filterOptions = this.computeFilterOptionsFromList(this.inMemoryCtos);

    return {
      data: paginated,
      total,
      metrics,
      filterOptions
    };
  }

  /**
   * Resumen de métricas superiores respetando filtros cuando corresponda
   */
  async getMopMetrics(params: GetMopCtosParams = {}): Promise<MopMetrics> {
    const supabase = createClient();
    if (supabase) {
      try {
        let baseQuery = supabase.from('mop_ctos').select('estado, is_ausente');

        if (params.categoria && params.categoria !== 'all') {
          baseQuery = baseQuery.eq('categoria_origen', params.categoria);
        }
        if (params.responsable && params.responsable !== 'all') {
          baseQuery = baseQuery.eq('responsable_cto', params.responsable);
        }
        if (params.central && params.central !== 'all') {
          baseQuery = baseQuery.eq('central', params.central);
        }
        if (params.search && params.search.trim()) {
          const t = params.search.trim();
          baseQuery = baseQuery.or(`sigest.ilike.%${t}%,poligono.ilike.%${t}%,cto.ilike.%${t}%`);
        }

        const { data, error } = await baseQuery;
        if (!error && data) {
          const total = data.length;
          let pendientes = 0;
          let completadas = 0;
          let conReparo = 0;
          let ausentes = 0;

          data.forEach(r => {
            if (r.estado === 'PENDIENTE') pendientes++;
            if (r.estado === 'COMPLETADO') completadas++;
            if (r.estado === 'CON REPARO') conReparo++;
            if (r.is_ausente) ausentes++;
          });

          return { total, pendientes, completadas, conReparo, ausentes };
        }
      } catch (e) {
        // Fallback
      }
    }

    return this.computeMetricsFromList(this.inMemoryCtos);
  }

  private computeMetricsFromList(list: MopCto[]): MopMetrics {
    const total = list.length;
    let pendientes = 0;
    let completadas = 0;
    let conReparo = 0;
    let ausentes = 0;

    list.forEach(r => {
      if (r.estado === 'PENDIENTE') pendientes++;
      if (r.estado === 'COMPLETADO') completadas++;
      if (r.estado === 'CON REPARO') conReparo++;
      if (r.is_ausente) ausentes++;
    });

    return { total, pendientes, completadas, conReparo, ausentes };
  }

  private async getFilterOptions(): Promise<{ responsables: string[]; centrales: string[] }> {
    const supabase = createClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('mop_ctos').select('responsable_cto, central');
        if (!error && data) {
          const respSet = new Set<string>();
          const centSet = new Set<string>();
          data.forEach(d => {
            if (d.responsable_cto) respSet.add(d.responsable_cto.trim());
            if (d.central) centSet.add(d.central.trim());
          });
          return {
            responsables: Array.from(respSet).sort((a, b) => a.localeCompare(b, 'es')),
            centrales: Array.from(centSet).sort((a, b) => a.localeCompare(b, 'es'))
          };
        }
      } catch (e) {
        // Fallback
      }
    }
    return this.computeFilterOptionsFromList(this.inMemoryCtos);
  }

  private computeFilterOptionsFromList(list: MopCto[]): { responsables: string[]; centrales: string[] } {
    const respSet = new Set<string>();
    const centSet = new Set<string>();
    list.forEach(d => {
      if (d.responsable_cto) respSet.add(d.responsable_cto.trim());
      if (d.central) centSet.add(d.central.trim());
    });
    return {
      responsables: Array.from(respSet).sort((a, b) => a.localeCompare(b, 'es')),
      centrales: Array.from(centSet).sort((a, b) => a.localeCompare(b, 'es'))
    };
  }

  /**
   * Actualiza el estado de una CTO
   */
  async updateMopStatus(id: string, newStatus: MopStatus): Promise<{ success: boolean; error?: string }> {
    const user = this.getActiveUsername();
    const now = new Date().toISOString();

    const supabase = createClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('mop_ctos')
          .update({
            estado: newStatus,
            fecha_ultimo_cambio_estado: now,
            updated_by: user,
            updated_at: now
          })
          .eq('id', id);

        if (error) {
          console.error("Supabase updateMopStatus error:", error.message);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }

    // Sincronizar en memoria / localStorage
    const found = this.inMemoryCtos.find(c => c.id === id);
    if (found) {
      found.estado = newStatus;
      found.fecha_ultimo_cambio_estado = now;
      found.updated_by = user;
      found.updated_at = now;
      this.saveLocalBackup();
    }

    return { success: true };
  }

  /**
   * Actualiza la observación de una CTO
   */
  async updateMopObservacion(id: string, observacion: string): Promise<{ success: boolean; error?: string }> {
    const user = this.getActiveUsername();
    const now = new Date().toISOString();

    const supabase = createClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('mop_ctos')
          .update({
            observacion: observacion.trim() || null,
            updated_by: user,
            updated_at: now
          })
          .eq('id', id);

        if (error) {
          console.error("Supabase updateMopObservacion error:", error.message);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }

    // Sincronizar en memoria / localStorage
    const found = this.inMemoryCtos.find(c => c.id === id);
    if (found) {
      found.observacion = observacion.trim() || undefined;
      found.updated_by = user;
      found.updated_at = now;
      this.saveLocalBackup();
    }

    return { success: true };
  }

  /**
   * ETAPA 1: Validación y Vista Previa de la importación Excel
   */
  async previewExcelImport(file: File): Promise<MopImportPreview> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    const errors: string[] = [];
    const warnings: string[] = [];
    const sheetCounts: Record<string, number> = {};
    const parsedRows: ParsedMopRow[] = [];

    // 1. Validar que existan las 5 pestañas
    const sheetMap = new Map<MopCategory, string>();
    for (const reqSheet of REQUIRED_SHEETS) {
      const targetCat = normalizeCategoryName(reqSheet)!;
      const foundSheetName = workbook.SheetNames.find(s => normalizeCategoryName(s) === targetCat);
      if (!foundSheetName) {
        errors.push(`Falta la pestaña requerida "${reqSheet}" en el archivo Excel.`);
      } else {
        sheetMap.set(targetCat, foundSheetName);
      }
    }

    if (errors.length > 0) {
      return {
        valid: false,
        filename: file.name,
        sheetCounts,
        totalFound: 0,
        newCount: 0,
        updateCount: 0,
        absentCount: 0,
        duplicatesCount: 0,
        duplicateDetails: [],
        errors,
        warnings,
        parsedRows: []
      };
    }

    // 2. Extraer filas de cada una de las 5 pestañas
    const seenCompositeKeys = new Map<string, { sheet: string; rowNumber: number }>();
    const duplicateDetails: Array<{ sigest: string; poligono: string; cto: string; sheet: string }> = [];

    for (const [category, sheetName] of Array.from(sheetMap.entries())) {
      const sheet = workbook.Sheets[sheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      sheetCounts[category] = rawRows.length;

      if (rawRows.length === 0) {
        warnings.push(`La pestaña "${sheetName}" está vacía.`);
        continue;
      }

      const firstRow = rawRows[0];
      const headers = Object.keys(firstRow);

      // Detectar columnas necesarias con tolerancia a mayúsculas, tildes y espacios
      const colSigest = findColumnHeader(headers, ['sigest cto', 'sigest', 'sisvadi', 'proyecto']);
      const colPoligono = findColumnHeader(headers, ['poligono cto', 'polígono cto', 'poligono', 'polígono']);
      const colCto = findColumnHeader(headers, ['cto']);
      const colCentral = findColumnHeader(headers, ['central']);
      const colPelo = findColumnHeader(headers, ['pelo']);
      const colInstToa = findColumnHeader(headers, ['instalación cto (toa)', 'instalacion cto (toa)', 'instalacion toa', 'instalacion cto']);
      const colCertToa = findColumnHeader(headers, ['certificación cto (toa)', 'certificacion cto (toa)', 'certificacion toa', 'certificacion cto']);
      const colRespCto = findColumnHeader(headers, ['responsable cto', 'responsable', 'ejecutor']);

      const missingCols: string[] = [];
      if (!colSigest) missingCols.push('Sigest CTO');
      if (!colPoligono) missingCols.push('Poligono CTO');
      if (!colCto) missingCols.push('CTO');
      if (!colCentral) missingCols.push('Central');
      if (!colPelo) missingCols.push('Pelo');
      if (!colInstToa) missingCols.push('Instalación CTO (TOA)');
      if (!colCertToa) missingCols.push('Certificación CTO (TOA)');
      if (!colRespCto) missingCols.push('Responsable CTO');

      if (missingCols.length > 0) {
        errors.push(`En la pestaña "${sheetName}" no se encontraron las siguientes columnas requeridas: [${missingCols.join(', ')}].`);
        continue;
      }

      // Procesar filas de la pestaña
      rawRows.forEach((row, idx) => {
        const sigest = cleanString(row[colSigest!]);
        const poligono = cleanString(row[colPoligono!]);
        const cto = cleanString(row[colCto!]);

        // Ignorar filas totalmente vacías
        if (!sigest && !poligono && !cto) return;

        if (!sigest || !poligono || !cto) {
          warnings.push(`Fila ${idx + 2} en pestaña "${sheetName}" tiene datos incompletos (Sigest: "${sigest}", Polígono: "${poligono}", CTO: "${cto}").`);
          return;
        }

        const compKey = buildCompositeKey(sigest, poligono, cto);

        // Chequeo de duplicados dentro del archivo
        if (seenCompositeKeys.has(compKey)) {
          const prev = seenCompositeKeys.get(compKey)!;
          duplicateDetails.push({
            sigest,
            poligono,
            cto,
            sheet: `${sheetName} (duplicado de ${prev.sheet})`
          });
        } else {
          seenCompositeKeys.set(compKey, { sheet: sheetName, rowNumber: idx + 2 });
        }

        parsedRows.push({
          sigest,
          poligono,
          cto,
          central: cleanString(row[colCentral!]),
          pelo: cleanString(row[colPelo!]),
          instalacion_toa: cleanString(row[colInstToa!]),
          certificacion_toa: cleanString(row[colCertToa!]),
          responsable_cto: cleanString(row[colRespCto!]),
          categoria_origen: category
        });
      });
    }

    if (errors.length > 0) {
      return {
        valid: false,
        filename: file.name,
        sheetCounts,
        totalFound: parsedRows.length,
        newCount: 0,
        updateCount: 0,
        absentCount: 0,
        duplicatesCount: duplicateDetails.length,
        duplicateDetails,
        errors,
        warnings,
        parsedRows: []
      };
    }

    // 3. Comparar con registros existentes en la base de datos para clasificar: Nuevos, Actualizados, Ausentes
    const existingMap = await this.getAllExistingKeysMap();

    const fileKeys = new Set<string>();
    let newCount = 0;
    let updateCount = 0;

    parsedRows.forEach(row => {
      const key = buildCompositeKey(row.sigest, row.poligono, row.cto);
      fileKeys.add(key);
      if (existingMap.has(key)) {
        updateCount++;
      } else {
        newCount++;
      }
    });

    // Ausentes: registros en BD que NO están en ninguna de las 5 pestañas del nuevo Excel
    let absentCount = 0;
    for (const existingKey of Array.from(existingMap.keys())) {
      if (!fileKeys.has(existingKey)) {
        absentCount++;
      }
    }

    return {
      valid: true,
      filename: file.name,
      sheetCounts,
      totalFound: parsedRows.length,
      newCount,
      updateCount,
      absentCount,
      duplicatesCount: duplicateDetails.length,
      duplicateDetails,
      errors,
      warnings,
      parsedRows
    };
  }

  private async getAllExistingKeysMap(): Promise<Map<string, { id: string; estado: MopStatus; observacion?: string; fecha_primera_aparicion: string }>> {
    const map = new Map<string, { id: string; estado: MopStatus; observacion?: string; fecha_primera_aparicion: string }>();
    const supabase = createClient();

    if (supabase) {
      try {
        const { data, error } = await supabase.from('mop_ctos').select('id, sigest, poligono, cto, estado, observacion, fecha_primera_aparicion');
        if (!error && data) {
          data.forEach(d => {
            const key = buildCompositeKey(d.sigest, d.poligono, d.cto);
            map.set(key, {
              id: d.id,
              estado: d.estado,
              observacion: d.observacion,
              fecha_primera_aparicion: d.fecha_primera_aparicion
            });
          });
          return map;
        }
      } catch (e) {
        // Fallback
      }
    }

    this.inMemoryCtos.forEach(d => {
      const key = buildCompositeKey(d.sigest, d.poligono, d.cto);
      map.set(key, {
        id: d.id,
        estado: d.estado,
        observacion: d.observacion,
        fecha_primera_aparicion: d.fecha_primera_aparicion
      });
    });

    return map;
  }

  /**
   * ETAPA 2: Confirmación y sincronización incremental
   */
  async confirmExcelImport(preview: MopImportPreview): Promise<{ success: boolean; error?: string; historyId?: string }> {
    if (!preview.valid || preview.parsedRows.length === 0) {
      return { success: false, error: 'No hay datos válidos para importar.' };
    }

    const now = new Date().toISOString();
    const user = this.getActiveUsername();
    const supabase = createClient();

    try {
      const existingMap = await this.getAllExistingKeysMap();
      const fileKeys = new Set<string>();

      // Filtrar duplicados dentro del archivo (quedarse con la última o primera aparición válida)
      const uniqueRowsMap = new Map<string, ParsedMopRow>();
      preview.parsedRows.forEach(r => {
        const key = buildCompositeKey(r.sigest, r.poligono, r.cto);
        fileKeys.add(key);
        // Preservar registro único
        if (!uniqueRowsMap.has(key)) {
          uniqueRowsMap.set(key, r);
        }
      });

      const uniqueRows = Array.from(uniqueRowsMap.values());

      // Preparar lotes de inserción y actualización
      const toInsert: any[] = [];
      const toUpdate: any[] = [];

      uniqueRows.forEach(row => {
        const key = buildCompositeKey(row.sigest, row.poligono, row.cto);
        const existing = existingMap.get(key);

        if (!existing) {
          // Caso A: CTO Nueva
          toInsert.push({
            sigest: row.sigest,
            poligono: row.poligono,
            cto: row.cto,
            central: row.central || null,
            pelo: row.pelo || null,
            instalacion_toa: row.instalacion_toa || null,
            certificacion_toa: row.certificacion_toa || null,
            responsable_cto: row.responsable_cto || null,
            categoria_origen: row.categoria_origen,
            estado: 'PENDIENTE',
            observacion: null,
            is_ausente: false,
            fecha_primera_aparicion: now,
            fecha_ultima_aparicion: now,
            fecha_ultima_importacion: now,
            created_at: now,
            updated_at: now
          });
        } else {
          // Caso B: CTO Existente (conservar estado y observación)
          toUpdate.push({
            id: existing.id,
            sigest: row.sigest,
            poligono: row.poligono,
            cto: row.cto,
            central: row.central || null,
            pelo: row.pelo || null,
            instalacion_toa: row.instalacion_toa || null,
            certificacion_toa: row.certificacion_toa || null,
            responsable_cto: row.responsable_cto || null,
            categoria_origen: row.categoria_origen,
            is_ausente: false, // Si reaparece, reactivar condición de ausente
            fecha_ultima_aparicion: now,
            fecha_ultima_importacion: now,
            updated_at: now
            // ¡NO incluir estado ni observacion ni fecha_primera_aparicion!
          });
        }
      });

      // Caso C: CTOs Ausentes
      const absentIds: string[] = [];
      for (const [key, existing] of Array.from(existingMap.entries())) {
        if (!fileKeys.has(key)) {
          absentIds.push(existing.id);
        }
      }

      // Ejecutar en Supabase por lotes
      if (supabase) {
        // 1. Insertar nuevos en lotes de 200
        const BATCH_SIZE = 200;
        for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
          const batch = toInsert.slice(i, i + BATCH_SIZE);
          const { error: insertErr } = await supabase.from('mop_ctos').insert(batch);
          if (insertErr) {
            console.error("Error inserting mop_ctos batch:", insertErr.message);
            throw new Error(`Error al insertar nuevos registros: ${insertErr.message}`);
          }
        }

        // 2. Actualizar existentes en lotes mediante upsert
        for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
          const batch = toUpdate.slice(i, i + BATCH_SIZE);
          const { error: updateErr } = await supabase.from('mop_ctos').upsert(batch, { onConflict: 'id' });
          if (updateErr) {
            console.error("Error updating mop_ctos batch:", updateErr.message);
            throw new Error(`Error al actualizar registros existentes: ${updateErr.message}`);
          }
        }

        // 3. Marcar ausentes en lotes
        for (let i = 0; i < absentIds.length; i += BATCH_SIZE) {
          const batchIds = absentIds.slice(i, i + BATCH_SIZE);
          const { error: absentErr } = await supabase
            .from('mop_ctos')
            .update({ is_ausente: true, updated_at: now })
            .in('id', batchIds);
          if (absentErr) {
            console.error("Error marking absent mop_ctos:", absentErr.message);
            throw new Error(`Error al marcar registros ausentes: ${absentErr.message}`);
          }
        }

        // 4. Registrar en historial
        const historyRecord: any = {
          filename: preview.filename,
          total_records: preview.totalFound,
          new_records: toInsert.length,
          updated_records: toUpdate.length,
          absent_records: absentIds.length,
          created_by: user,
          result_status: 'success',
          details: {
            byCategory: preview.sheetCounts,
            duplicatesFound: preview.duplicatesCount
          },
          created_at: now
        };

        const { data: histData, error: histErr } = await supabase
          .from('mop_import_history')
          .insert([historyRecord])
          .select('id')
          .single();

        if (histErr) {
          console.warn("Could not insert mop_import_history:", histErr.message);
        }

        return {
          success: true,
          historyId: histData?.id
        };
      }

      // Sincronización en memoria de respaldo
      const newItems: MopCto[] = toInsert.map((item, i) => ({
        ...item,
        id: `local-mop-${Date.now()}-${i}`
      }));

      // Actualizar existentes en memoria
      toUpdate.forEach(u => {
        const item = this.inMemoryCtos.find(c => c.id === u.id);
        if (item) {
          Object.assign(item, u);
        }
      });

      // Ausentes en memoria
      absentIds.forEach(id => {
        const item = this.inMemoryCtos.find(c => c.id === id);
        if (item) {
          item.is_ausente = true;
          item.updated_at = now;
        }
      });

      this.inMemoryCtos.push(...newItems);

      const histItem: MopImportHistory = {
        id: `local-hist-${Date.now()}`,
        filename: preview.filename,
        total_records: preview.totalFound,
        new_records: toInsert.length,
        updated_records: toUpdate.length,
        absent_records: absentIds.length,
        created_by: user,
        result_status: 'success',
        details: {
          byCategory: preview.sheetCounts,
          duplicatesFound: preview.duplicatesCount
        },
        created_at: now
      };
      this.inMemoryHistory.unshift(histItem);
      this.saveLocalBackup();

      return { success: true, historyId: histItem.id };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error desconocido durante la importación.' };
    }
  }

  /**
   * Obtiene el historial de importaciones
   */
  async getImportHistory(): Promise<MopImportHistory[]> {
    const supabase = createClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('mop_import_history')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data) {
          return data as MopImportHistory[];
        }
      } catch (e) {
        // Fallback
      }
    }
    return this.inMemoryHistory;
  }
}

export const mopService = new MopService();
