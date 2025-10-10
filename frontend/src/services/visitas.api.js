import { api } from "./http.js";

// Helpers opcionales para mapear request/response
const mapCreate = (data) => ({
  cliente_id: data.clienteId,
  ubicacion_id: data.ubicacionId ?? null,
  telefono: data.telefono ?? null,
  tipo: data.tipo,
  prioridad: data.prioridad,
  observaciones: data.observaciones ?? "",
  evidencias: data.evidencias ?? [], // ids de archivos
});

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
    const body = mapCreate(payload);
    const { data } = await api.post("/visitas", body);
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
};
