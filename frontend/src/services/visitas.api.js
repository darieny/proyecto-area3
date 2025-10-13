import { api } from "./http.js";

// ===== Helpers =====
function oneHourWindow() {
  const start = new Date();
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

function toISODateOrEmpty(v, endOfDay = false) {
  if (!v) return "";
  // si viene solo yyyy-mm-dd, añadimos hora de inicio/fin de día
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return new Date(v + (endOfDay ? "T23:59:59" : "T00:00:00")).toISOString();
  }
  // si ya viene ISO, lo dejamos
  try { return new Date(v).toISOString(); } catch { return ""; }
}

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

// ===== API =====
export const visitasApi = {
  // Lista con filtros del UI -> nombres que espera el backend
  async list(raw = {}) {
    const params = {};

    if (raw.search)      params.search = raw.search;
    if (raw.cliente_id)  params.cliente_id = raw.cliente_id;

    // Estado en UI -> status_id en API (1..5)
    if (raw.estado !== undefined && raw.estado !== "") {
      params.status_id = Number(raw.estado);
    }

    if (raw.tipo)       params.tipo = raw.tipo;
    if (raw.prioridad)  params.prioridad = raw.prioridad;

    // Rango de fechas (ISO)
    const fromIso = toISODateOrEmpty(raw.from, false);
    const toIso   = toISODateOrEmpty(raw.to, true);
    if (fromIso) params.from = fromIso;
    if (toIso)   params.to   = toIso;

    params.page     = raw.page ?? 1;
    params.pageSize = raw.pageSize ?? 10;

    const { data } = await api.get("/visitas", { params });
    return data; // { items, meta }
  },

  async getById(id) {
    const { data } = await api.get(`/visitas/${id}`);
    return data;
  },

  async create(payload) {
    if (!payload.clienteId) throw new Error("clienteId es requerido para crear una visita");
    const body = mapCreate(payload);
    const { data } = await api.post(`/clientes/${payload.clienteId}/visitas`, body);
    return data;
  },

  // Patch genérico por si se necesita actualizar otros campos
  async patch(id, changes) {
    const { data } = await api.patch(`/visitas/${id}`, changes);
    return data;
  },

  // Cambiar solo el estado con endpoint dedicado
  async patchEstado(id, status_id) {
    const { data } = await api.patch(`/visitas/${id}/estado`, { status_id });
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

  // Últimas por cliente (widget en detalle del cliente)
  async listByCliente(clienteId, params = {}) {
    const { data } = await api.get("/visitas", {
      params: { cliente_id: clienteId, limit: params.limit ?? 5 },
    });
    return data; // { items, meta }
  },
};

