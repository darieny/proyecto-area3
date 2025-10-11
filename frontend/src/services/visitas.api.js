import { api } from "./http.js";

function oneHourWindow() {
  const start = new Date();
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

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

export const visitasApi = {
  async list(params = {}) {
    // params: { search, cliente_id, tipo, prioridad, estado, from, to, page, pageSize }
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

  async patch(id, changes) {
    // changes: { estado?, observaciones?, add_evidencias? }
    const { data } = await api.patch(`/visitas/${id}`, changes);
    return data;
  },

  // Si se maneja upload de evidencias por separado:
  async uploadFile(file) {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post("/files", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data; // { id, url, ... }
  },


  //para listar las visitas
  async listByCliente(clienteId, params = {}) {
    const { data } = await api.get("/visitas", {
      params: { cliente_id: clienteId, limit: params.limit ?? 5 }
    });
    return data; // { items, meta }
  },
};
