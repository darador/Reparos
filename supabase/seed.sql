-- ========================================================
-- DATOS DE DEMOSTRACIÓN Y CATÁLOGOS INICIALES (seed.sql)
-- ========================================================

-- 1. CATÁLOGO DE RESPONSABLES INICIALES
INSERT INTO public.responsible_parties (id, name, type, is_active) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Obras', 'contractor', true),
  ('a2222222-2222-2222-2222-222222222222', 'Ingeniería', 'engineering', true),
  ('a3333333-3333-3333-3333-333333333333', 'Equipo Despliegue', 'cto_team', true)
ON CONFLICT (name) DO NOTHING;

-- 2. CATÁLOGO DE TIPOS DE REPARO
INSERT INTO public.repair_types (id, name, description, is_active) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'Falta poste', 'Falta colocación o reemplazo de poste en vía pública', true),
  ('b2222222-2222-2222-2222-222222222222', 'Falta cruce americano', 'Falta tendido de cruce aéreo/subterráneo', true),
  ('b3333333-3333-3333-3333-333333333333', 'Falta HUB', 'Instalación pendiente del nodo de distribución HUB', true),
  ('b4444444-4444-4444-4444-444444444444', 'HUB sin potencia', 'HUB instalado pero sin señal óptica requerida', true),
  ('b5555555-5555-5555-5555-555555555555', 'Problemas de potencia', 'Atenuación de fibra fuera de tolerancias de norma', true),
  ('b6666666-6666-6666-6666-666666666666', 'Rediseño', 'Requiere revisión o modificación del plano por imprevisto en campo', true),
  ('b7777777-7777-7777-7777-777777777777', 'Problema CTO', 'CTO dañada, suelta o sin splitters', true),
  ('b8888888-8888-8888-8888-888888888888', 'Otro', 'Otros problemas operativos generales', true)
ON CONFLICT (name) DO NOTHING;

-- 3. CATÁLOGO DE ESTADOS DE REPARO
INSERT INTO public.repair_statuses (id, name, category, order_index, is_active) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Pendiente', 'pending', 1, true),
  ('c2222222-2222-2222-2222-222222222222', 'Asignado', 'in_progress', 2, true),
  ('c3333333-3333-3333-3333-333333333333', 'Reclamado', 'in_progress', 3, true),
  ('c4444444-4444-4444-4444-444444444444', 'En seguimiento', 'in_progress', 4, true),
  ('c5555555-5555-5555-5555-555555555555', 'Esperando respuesta', 'in_progress', 5, true),
  ('c6666666-6666-6666-6666-666666666666', 'En resolución', 'in_progress', 6, true),
  ('c7777777-7777-7777-7777-777777777777', 'Resuelto', 'resolved', 7, true),
  ('c8888888-8888-8888-8888-888888888888', 'Cerrado', 'closed', 8, true)
ON CONFLICT (name) DO NOTHING;

-- 4. PROYECTOS FICTICIOS REALISTAS
INSERT INTO public.projects (id, sigest, poligono, distrito, central, titulo, ejecutor, ctos_count, alimentacion, situacion_operativa, observaciones) VALUES
  ('d1111111-1111-1111-1111-111111111111', '102345', '045', 'Florencio Varela', 'Varela Central', 'Despliegue FTTH ZONA NORTE 045', 'Obras', 48, 'SI', 'En ejecución', 'Avance de obra al 65%. Varios bloqueos de postes.'),
  ('d2222222-2222-2222-2222-222222222222', '102345', '046', 'Florencio Varela', 'Varela Central', 'Despliegue FTTH ZONA NORTE 046', 'Obras', 32, 'SI', 'En ejecución', 'Mismo SIGEST que Polígono 045.'),
  ('d3333333-3333-3333-3333-333333333333', '108920', '112', 'Quilmes', 'Quilmes Oeste', 'Extensión Red Fibra Polígono 112', 'Ingeniería', 64, 'NO', 'Rediseño', 'En espera de aprobación por cruces de avenida.'),
  ('d4444444-4444-4444-4444-444444444444', '110500', '201', 'Berazategui', 'Berazategui Centro', 'Despliegue Industrial Polígono 201', 'Equipo Despliegue', 80, 'SI', 'Demorado', 'Demoras por permisos municipales.')
ON CONFLICT (sigest, poligono) DO NOTHING;

-- 5. REPAROS FICTICIOS
INSERT INTO public.repairs (
  id, project_id, repair_type_id, description, priority, solicitante, current_responsible_id, current_status_id, fecha_informado, fecha_compromiso, observaciones
) VALUES
  (
    'e1111111-1111-1111-1111-111111111111',
    'd1111111-1111-1111-1111-111111111111',
    'b1111111-1111-1111-1111-111111111111', -- Falta poste
    'Faltan 3 postes de hormigón en la esquina de Av. San Martín y Belgrano. Impide tendido de 250m de multifibra.',
    'Alta',
    'Jefe de Obra',
    'a1111111-1111-1111-1111-111111111111', -- Contratista ABC
    'c3333333-3333-3333-3333-333333333333', -- Reclamado
    NOW() - INTERVAL '5 days',
    NOW() + INTERVAL '2 days',
    'Se realizó reclamo telefónico y formal por email.'
  ),
  (
    'e2222222-2222-2222-2222-222222222222',
    'd1111111-1111-1111-1111-111111111111',
    'b4444444-4444-4444-4444-444444444444', -- HUB sin potencia
    'HUB-02 no recibe potencia desde el splitter de primer nivel. Posible empalme atenuado en cámara 14.',
    'Crítica',
    'Auditor de Campo',
    'a4444444-4444-4444-4444-444444444444', -- Equipo CTO
    'c5555555-5555-5555-5555-555555555555', -- Esperando respuesta
    NOW() - INTERVAL '3 days',
    NOW() + INTERVAL '1 days',
    'Derivado a Equipo CTO para medición con OTDR.'
  ),
  (
    'e3333333-3333-3333-3333-333333333333',
    'd3333333-3333-3333-3333-333333333333',
    'b6666666-6666-6666-6666-666666666666', -- Rediseño
    'Traza original bloqueada por marquesina comercial. Se requiere plano alternativo por vereda enfrente.',
    'Normal',
    'Supervisión',
    'a5555555-5555-5555-5555-555555555555', -- Equipo Rediseño
    'c2222222-2222-2222-2222-222222222222', -- Asignado
    NOW() - INTERVAL '8 days',
    NOW() + INTERVAL '5 days',
    'Ingeniería revisando factibilidad técnica.'
  ),
  (
    'e4444444-4444-4444-4444-444444444444',
    'd4444444-4444-4444-4444-444444444444',
    'b2222222-2222-2222-2222-222222222222', -- Falta cruce americano
    'Falta cruce aéreo sobre vía férrea en Calle 14.',
    'Alta',
    'Gerencia',
    'a6666666-6666-6666-6666-666666666666', -- Contratista Instalaciones Norte
    'c7777777-7777-7777-7777-777777777777', -- Resuelto
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '1 days',
    'Contratista notificó instalación completa el 18/09. Listo para verificar.'
  )
ON CONFLICT (id) DO NOTHING;

-- 6. EVENTOS HISTÓRICOS DE DEMOSTRACIÓN (Timeline audit trail)
INSERT INTO public.repair_events (
  id, repair_id, event_type, previous_responsible_id, new_responsible_id, previous_status_id, new_status_id, verification_result, notes, created_at
) VALUES
  (
    gen_random_uuid(),
    'e1111111-1111-1111-1111-111111111111',
    'creation',
    NULL,
    NULL,
    NULL,
    'c1111111-1111-1111-1111-111111111111', -- Pendiente
    NULL,
    'Reparo registrado inicialmente en el sistema por inspección de obra.',
    NOW() - INTERVAL '5 days'
  ),
  (
    gen_random_uuid(),
    'e1111111-1111-1111-1111-111111111111',
    'assignment',
    NULL,
    'a1111111-1111-1111-1111-111111111111', -- Contratista ABC
    'c1111111-1111-1111-1111-111111111111',
    'c2222222-2222-2222-2222-222222222222', -- Asignado
    NULL,
    'Asignado a Contratista ABC para provisión y plantado de postes.',
    NOW() - INTERVAL '4 days'
  ),
  (
    gen_random_uuid(),
    'e1111111-1111-1111-1111-111111111111',
    'reclaim',
    'a1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'c2222222-2222-2222-2222-222222222222',
    'c3333333-3333-3333-3333-333333333333', -- Reclamado
    NULL,
    'Primer reclamo formal registrado. Correo de solicitud enviado.',
    NOW() - INTERVAL '2 days'
  )
ON CONFLICT (id) DO NOTHING;
