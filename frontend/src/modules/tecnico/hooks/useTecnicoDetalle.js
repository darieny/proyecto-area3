import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../services/http';

export function useTecnicoDetalle(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // === Recargar detalle ===
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tecnico/visitas/${id}`);
      setData(res.data);
      setErr('');
    } catch (e) {
      console.error('Error cargando visita:', e);
      setErr(e?.response?.data?.error || 'Error cargando visita');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // === Cambiar estado (EN_RUTA, EN_SITIO, COMPLETADA, etc.) ===
  const cambiarEstado = useCallback(
    async (nuevo_estado_codigo, { nota, geo } = {}) => {
      try {
        // Validación: si va a completar, asegurarse de que haya nota
        if (nuevo_estado_codigo === 'COMPLETADA') {
          if (!nota || nota.trim() === '') {
            alert('La nota de cierre es obligatoria para finalizar.');
            return;
          }
        }

        const res = await api.post(`/tecnico/visitas/${id}/eventos`, {
          nuevo_estado_codigo,
          nota,
          geo,
        });

        // Actualizar estado local
        setData((prev) =>
          prev
            ? {
              ...prev,
              estado: res.data.estado,
              eventos: res.data.eventos,
            }
            : prev
        );

        return res.data;
      } catch (e) {
        const msg = e?.response?.data?.error || 'Error actualizando estado';
        alert(msg); // muestra el mensaje real del backend (por ejemplo: falta evidencia)
        console.error('Error en cambiarEstado:', e);
        throw e;
      }
    },
    [id, data]
  );

  // === Subir evidencia ===
  const subirEvidencia = useCallback(
    async ({ url, nota }) => {
      try {
        if (!url || url.trim() === '') {
          alert('Debes ingresar una URL válida de la evidencia.');
          return;
        }

        const res = await api.post(`/tecnico/visitas/${id}/evidencias`, {
          url,
          nota,
        });

        setData((prev) =>
          prev
            ? {
              ...prev,
              evidencias: res.data.evidencias,
            }
            : prev
        );

        alert('Evidencia subida correctamente.');
        return res.data;
      } catch (e) {
        const msg = e?.response?.data?.error || 'Error subiendo evidencia';
        alert(msg);
        console.error('Error en subirEvidencia:', e);
        throw e;
      }
    },
    [id]
  );

  // === Cargar datos al montar ===
  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, err, refresh, cambiarEstado, subirEvidencia };
}

