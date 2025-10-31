// frontend/src/services/visitas.api.js
import { api } from "./http.js";

/* =======================
   Helpers
======================= */
function oneHourWindow() {
  const start = new Date();
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

function toISODateOrEmpty(v, endOfDay = false) {
  if (!v) return "";
  // Si viene solo yyyy-mm-dd, completar con inicio/fin de día
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return new Date(v + (endOfDay ? "T23:59:59" : "T00:00:00")).toISOString();
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

// (Opcional) mapeos legacy — si te llega texto, mandamos 'estado' textual;
// si te llega número, mandamos 'status_id'. Evitamos suponer IDs fijos.
const PRIORITY_MAP = {
  baja: 4,
  media: 5,
  alta: 6,
  critica: 7,
};

const TYPE_MAP = {
  instalacion: 8,
  mantenimiento: 9,
  soporte: 10,
  inspeccion: 11,
};

// Mapea payload del form al formato del backend
const mapCreate = (data) => {
  const { start, end } = oneHourWindow();
  return {
    titulo: data.titulo || "Visita programada",
    descripcion: data.observaciones ?? "",
    creado_por_id: data.creadoPorId,
    ubicacion_id: data.ubicacionId ?? null,
    tecnico_asignado_id: data.tecnicoId ?? null,
    status_id: 1, // si tu catálogo tiene otro ID por defecto, el backend también acepta por_defecto
    programada_inicio: data.programadaInicio ?? start,
    programada_fin: data.programadaFin ?? end,
  };
};

/* =======================
   API PRINCIPAL
======================= */
export const visitasApi = {
  // Lista con filtros del UI
  async list(raw = {}) {
    const params = {};

    // búsqueda
    if (raw.search) params.q = raw.search;

    // cliente
    if (raw.cliente_id) params.cliente_id = raw.cliente_id;

    // estado: si es número -> status_id; si es texto -> estado (backend filtra por codigo)
    if (raw.estado !== undefined && raw.estado !== "") {
      const val = String(raw.estado).trim();
      if (/^\d+$/.test(val)) {
        params.status_id = Number(val);
      } else {
        params.estado = val; // ej. "COMPLETADA", "EN_RUTA", "EN_SITIO"
      }
    }

    // prioridad / tipo (si te llegan como texto)
    if (raw.prioridad) {
      const pid = PRIORITY_MAP[String(raw.prioridad).toLowerCase()];
      if (pid) params.priority_id = pid;
    }
    if (raw.tipo) {
      const tid = TYPE_MAP[String(raw.tipo).toLowerCase()];
      if (tid) params.type_id = tid;
    }

    // rango de fechas
    const desdeIso = toISODateOrEmpty(raw.from, false);
    const hastaIso = toISODateOrEmpty(raw.to, true);
    if (desdeIso) params.desde = desdeIso;
    if (hastaIso) params.hasta = hastaIso;

    // paginación
    params.page = raw.page ?? 1;
    params.pageSize = raw.pageSize ?? 10;

    const { data } = await api.get("/visitas", { params });
    return data; // { items, meta }
  },

  // Obtener detalle por ID
  async getById(id) {
    const { data } = await api.get(`/visitas/${id}`);
    return data;
  },

  // Crear visita (desde cliente)
  async create(payload) {
    if (!payload.clienteId) {
      throw new Error("clienteId es requerido para crear una visita");
    }
    const body = mapCreate(payload);
    const { data } = await api.post(`/clientes/${payload.clienteId}/visitas`, body);
    return data;
  },

  // Actualizar campos genéricos (BACKEND: PUT /visitas/:id)
  async patch(id, changes) {
    const { data } = await api.put(`/visitas/${id}`, changes);
    return data;
  },

  // Cambiar estado de la visita (usa el endpoint admin /visitas/:id/estado)
  async patchEstado(id, estadoId, opts = {}) {
    const { autorId, nota } = opts || {};
    let body;
    if (autorId) {
      body = { estado_nuevo_id: Number(estadoId), autor_id: autorId };
      if (nota) body.nota = nota;
    } else {
      // fallback legacy
      body = { status_id: Number(estadoId) };
    }
    const { data } = await api.patch(`/visitas/${id}/estado`, body);
    return data;
  },

  // Asignar o desasignar técnico
  async assignTecnico(id, tecnicoIdOrNull) {
    const body = { tecnico_id: tecnicoIdOrNull ?? null };
    const { data } = await api.patch(`/visitas/${id}/tecnico`, body);
    return data;
  },

  // Subir archivo (si lo usas)
  async uploadFile(file) {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post("/files", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data; // { id, url, ... }
  },

  // Últimas visitas de un cliente
  async listByCliente(clienteId, params = {}) {
    const { data } = await api.get("/visitas", {
      params: { cliente_id: clienteId, limit: params.limit ?? 5 },
    });
    return data;
  },

  // ==== Completar visita + enviar correo ====
  async completar(id, { resumen = '', trabajo_realizado = '' } = {}) {
    const { data } = await api.post(`/visitas/${id}/completar`, {
      resumen,
      trabajo_realizado,
      // hora_inicio/hora_fin las determina el backend (real_inicio/real_fin)
    });
    return data; // { ok, visitaId, email: { ok: true } }
  },

};


