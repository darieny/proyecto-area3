import { useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import Sidebar from '../../dashboard/components/Sidebar';
import Topbar from '../../dashboard/components/Topbar';
import { useTecnicoDetalle } from '../hooks/useTecnicoDetalle';

export default function TecnicoDetalle() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const { data, loading, err, cambiarEstado, subirEvidencia } = useTecnicoDetalle(id);

  // Soporte para acciones vía querystring (iniciar, checkin, finalizar)
  useEffect(() => {
    const accion = sp.get('accion');
    if (!accion || !data) return;

    (async () => {
      try {
        if (accion === 'iniciar' && data.estado === 'PROGRAMADA') {
          await cambiarEstado('EN_RUTA');
        }
        if (accion === 'checkin' && data.estado === 'EN_RUTA') {
          const lat = sp.get('lat'), lng = sp.get('lng');
          await cambiarEstado('EN_SITIO', {
            geo: (lat && lng) ? { lat: Number(lat), lng: Number(lng) } : undefined
          });
        }
        if (accion === 'finalizar' && data.estado === 'EN_SITIO') {
          // nota obligatoria
          const notaQS = sp.get('nota') || '';
          const nota = String(notaQS).trim();
          if (!nota) {
            alert('La nota de cierre es obligatoria para finalizar.');
            return;
          }
          await cambiarEstado('COMPLETADA', { nota });
        }
      } catch {
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp, data]);

  const abrirComoLlegar = () => {
    if (!data) return;
    const dest = (data.lat && data.lng)
      ? `${data.lat},${data.lng}`
      : encodeURIComponent(data.direccion || data.cliente);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSubirEvidencia = async () => {
    const url = prompt('URL pública de la evidencia (foto/documento):');
    if (!url || !String(url).trim()) return;
    const nota = prompt('Nota para esta evidencia (opcional):') || '';
    await subirEvidencia({ url: String(url).trim(), nota: String(nota).trim() });
  };

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <Topbar title="Detalle de visita" />
        {loading && <p>Cargando...</p>}
        {err && <p className="error">{err}</p>}

        {data && (
          <>
            <h2>{data.cliente}</h2>
            <p className="muted">{data.direccion}</p>
            <p>
              <b>Estado:</b> {data.estado} ·{' '}
              <b>Fecha:</b> {data.fecha ? new Date(data.fecha).toLocaleString() : '—'}
            </p>
            <p>
              <button onClick={abrirComoLlegar}>Cómo llegar</button>
            </p>

            <h3>Acciones</h3>
            <div className="actions" style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {data.estado === 'PROGRAMADA' && (
                <button onClick={() => cambiarEstado('EN_RUTA')}>Iniciar (EN_RUTA)</button>
              )}

              {data.estado === 'EN_RUTA' && (
                <button
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        pos => cambiarEstado('EN_SITIO', {
                          geo: { lat: pos.coords.latitude, lng: pos.coords.longitude }
                        }),
                        () => cambiarEstado('EN_SITIO') // sin geo si falla
                      );
                    } else {
                      cambiarEstado('EN_SITIO');
                    }
                  }}
                >
                  Check-in (EN_SITIO)
                </button>
              )}

              {data.estado === 'EN_SITIO' && (
                <button
                  onClick={async () => {
                    const nota = prompt('Nota de cierre (obligatoria):') || '';
                    if (!nota || !nota.trim()) {
                      alert('Debes escribir la nota para finalizar la visita.');
                      return;
                    }
                    await cambiarEstado('COMPLETADA', { nota: nota.trim() });
                  }}
                >
                  Finalizar (COMPLETADA)
                </button>
              )}

              <button onClick={handleSubirEvidencia}>Subir evidencia (URL)</button>
            </div>

            <h3>Timeline</h3>
            <ul className="timeline">
              {data.eventos?.map(ev => (
                <li key={ev.id}>
                  <b>{ev.estado_nuevo}</b> —{' '}
                  {new Date(ev.created_at || ev.fecha).toLocaleString()}
                  {ev.nota && <> · <i>{ev.nota}</i></>}
                </li>
              ))}
              {(!data.eventos || data.eventos.length === 0) && <li>Sin eventos aún.</li>}
            </ul>

            <h3>Evidencias</h3>
            <div className="evidencias" style={{ display:'grid', gap:12 }}>
              {data.evidencias?.map(e => (
                <div key={e.id} className="evi" style={{ padding:10, border:'1px solid var(--border)', borderRadius:8 }}>
                  <a href={e.url} target="_blank" rel="noreferrer">Ver evidencia</a>
                  {e.nota && <p style={{ margin:'6px 0 0' }}>{e.nota}</p>}
                </div>
              ))}
              {(!data.evidencias || data.evidencias.length === 0) && <p>Sin evidencias.</p>}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

