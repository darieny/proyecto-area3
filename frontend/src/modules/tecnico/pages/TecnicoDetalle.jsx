import { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import Sidebar from '../../dashboard/components/Sidebar';
import Topbar from '../../dashboard/components/Topbar';
import { useTecnicoDetalle } from '../hooks/useTecnicoDetalle';
import '../../dashboard/css/Dashboard.css';
import '../css/Tecnico.css';

export default function TecnicoDetalle() {
  const { id } = useParams();
  const [sp] = useSearchParams();

  const {
    data,
    loading,
    err,
    cambiarEstado,
    subirEvidencia,
    completar,
    reload,
  } = useTecnicoDetalle(id);

  // UI layout
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // campos de cierre
  const [resumen, setResumen] = useState('');
  const [trabajo, setTrabajo] = useState('');

  // Atajos por querystring: ?accion=iniciar | ?accion=checkin&lat=&lng=
  useEffect(() => {
    const accion = sp.get('accion');
    if (!accion || !data) return;

    (async () => {
      try {
        if (accion === 'iniciar' && data.estado === 'PROGRAMADA') {
          await cambiarEstado('EN_RUTA');
        }
        if (accion === 'checkin' && data.estado === 'EN_RUTA') {
          const lat = sp.get('lat');
          const lng = sp.get('lng');
          await cambiarEstado('EN_SITIO', {
            geo: lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined,
          });
        }
      } catch {
      }
    })();
  }, [sp, data, cambiarEstado]);

  const abrirComoLlegar = () => {
    if (!data) return;
    const dest =
      (data.lat && data.lng)
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

  const handleCompletar = async () => {
    const r = resumen.trim();
    if (!r) {
      alert('El resumen es obligatorio para finalizar.');
      return;
    }
    try {
      await completar({
        resumen: r,
        trabajo_realizado: String(trabajo || '').trim(),
      });

      // refrescar desde el backend (trae estado COMPLETADA y timeline con el log)
      await reload();

      setResumen('');
      setTrabajo('');
      alert('Visita completada y correo enviado (si el cliente tiene correo).');
    } catch (e) {
      console.error(e);
      alert('Ocurrió un error al completar la visita.');
    }
  };

  return (
    <div className={`shell ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'menu-open' : ''}`}>
      <Sidebar collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
      <main className="main">
        <Topbar
          onToggleCollapse={() => setCollapsed(v => !v)}
          onToggleMobile={() => setMobileOpen(v => !v)}
        />

        {loading && <p>Cargando...</p>}
        {err && <p className="error">{err}</p>}

        {data && (
          <>
            <h2>{data.cliente}</h2>
            <p className="muted">{data.direccion || '—'}</p>
            <p>
              <b>Estado:</b> {data.estado} ·{' '}
              <b>Fecha:</b> {data.fecha ? new Date(data.fecha).toLocaleString() : '—'}
            </p>

            <p>
              <button className="btn btn--map" onClick={abrirComoLlegar}>
                Cómo llegar
              </button>
            </p>

            <h3>Acciones</h3>
            <div className="actions">
              {data.estado === 'PROGRAMADA' && (
                <button className="btn btn--route" onClick={() => cambiarEstado('EN_RUTA')}>
                  Iniciar (EN_RUTA)
                </button>
              )}

              {data.estado === 'EN_RUTA' && (
                <button
                  className="btn btn--checkin"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) =>
                          cambiarEstado('EN_SITIO', {
                            geo: { lat: pos.coords.latitude, lng: pos.coords.longitude },
                          }),
                        () => cambiarEstado('EN_SITIO')
                      );
                    } else {
                      cambiarEstado('EN_SITIO');
                    }
                  }}
                >
                  Check-in (EN_SITIO)
                </button>
              )}

              {/* completar + correo: SOLO cuando está en EN_SITIO */}
              {data.estado === 'EN_SITIO' && (
                <div className="card" style={{ marginTop: 12, maxWidth: 640 }}>
                  <h4 style={{ marginTop: 0 }}>Finalizar visita y enviar reporte</h4>

                  <label style={{ display: 'block', margin: '8px 0 4px' }}>
                    Resumen (obligatorio)
                  </label>
                  <textarea
                    value={resumen}
                    onChange={(e) => setResumen(e.target.value)}
                    rows={3}
                    placeholder="Ej.: Se revisó el equipo y se normalizó el servicio."
                    style={{ width: '100%' }}
                  />

                  <label style={{ display: 'block', margin: '12px 0 4px' }}>
                    Trabajo realizado (opcional)
                  </label>
                  <textarea
                    value={trabajo}
                    onChange={(e) => setTrabajo(e.target.value)}
                    rows={3}
                    placeholder="Ej.: Ajuste de conectores, cambio de cable."
                    style={{ width: '100%' }}
                  />

                  <div style={{ marginTop: 12 }}>
                    <button className="btn btn--done" onClick={handleCompletar}>
                      Finalizar (COMPLETADA + correo)
                    </button>
                  </div>
                  <p className="muted" style={{ marginTop: 8 }}>
                    * El horario real se toma del sistema (inicio si no existía, y fin al completar).
                  </p>
                </div>
              )}

              <button className="btn btn--ghost" onClick={handleSubirEvidencia}>
                Subir evidencia (URL)
              </button>
            </div>

            <h3>Timeline</h3>
            <ul className="timeline">
              {data.eventos?.map((ev) => (
                <li key={ev.id}>
                  <b>{ev.estado_nuevo}</b> —{' '}
                  {new Date(ev.created_at || ev.fecha).toLocaleString()}
                  {ev.nota && (
                    <>
                      {' '}
                      · <i>{ev.nota}</i>
                    </>
                  )}
                </li>
              ))}
              {(!data.eventos || data.eventos.length === 0) && <li>Sin eventos aún.</li>}
            </ul>

            <h3>Evidencias</h3>
            <div className="evidencias">
              {data.evidencias?.map((e) => (
                <div key={e.id} className="evi">
                  <a href={e.url} target="_blank" rel="noreferrer">
                    Ver evidencia
                  </a>
                  {e.nota && <p style={{ margin: '6px 0 0' }}>{e.nota}</p>}
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




