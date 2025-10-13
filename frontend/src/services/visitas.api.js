// src/services/visitas.api.js
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

// Mapeo flexible para estado (acepta id o texto)
const STATUS_MAP = {
  "1": 1, "2": 2, "3": 3, "4": 4, "5": 5,
  programada: 1,
  "en_progreso": 2, "en-progreso": 2, "en progreso": 2,
  completada: 3,
  cancelada: 4,
  pendiente: 5,
};

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
    status_id: 1,                            
    programada_inicio: data.programadaInicio ?? start,
    programada_fin: data.programadaFin ?? end,
  };
};

/* =======================
   API
======================= */
export const visitasApi = {
  // Lista con filtros del UI
  async list(raw = {}) {
    const params = {};

    // búsqueda
    if (raw.search) params.q = raw.search;

    // cliente
    if (raw.cliente_id) params.cliente_id = raw.cliente_id;

    // estado (acepta id o nombre; nunca mandamos NaN)
    if (raw.estado !== undefined && raw.estado !== "") {
      const key = String(raw.estado).toLowerCase();
      const sid = STATUS_MAP[key];
      if (sid) params.status_id = sid;
    }

    // prioridad / tipo (solo si tienes IDs mapeados)
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

  async getById(id) {
    const { data } = await api.get(`/visitas/${id}`);
    return data;
  },

  async create(payload) {
    if (!payload.clienteId) {
      throw new Error("clienteId es requerido para crear una visita");
    }
    const body = mapCreate(payload);
    const { data } = await api.post(`/clientes/${payload.clienteId}/visitas`, body);
    return data;
  },

  async patch(id, changes) {
    const { data } = await api.patch(`/visitas/${id}`, changes);
    return data;
  },


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

  // Upload de evidencia
  async uploadFile(file) {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post("/files", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data; // { id, url, ... }
  },

  // Últimas por cliente (widget)
  async listByCliente(clienteId, params = {}) {
    const { data } = await api.get("/visitas", {
      params: { cliente_id: clienteId, limit: params.limit ?? 5 },
    });
    return data;
  },
};

