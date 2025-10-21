export default function VisitCard({ v, onIniciar, onCheckIn, onFinalizar }) {
  const { id, cliente, direccion, fecha, estado, lat, lng, titulo, prioridad } = v;

  const abrirComoLlegar = () => {
    const dest = (lat && lng) ? `${lat},${lng}` : encodeURIComponent(direccion || cliente);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleFinalizar = () => {
    const nota = (prompt('Nota de cierre (obligatoria):') || '').trim();
    if (!nota) {
      alert('Debes escribir la nota para finalizar la visita.');
      return;
    }
    onFinalizar(id, nota);
  };

  // chip de estado según CSS (programada | en_ruta | en_sitio | completada)
  const estadoKey = String(estado || '').toLowerCase(); // "PROGRAMADA" -> "programada"
  const estadoClass =
    estadoKey.includes('ruta') ? 'en_ruta' :
    estadoKey.includes('sitio') ? 'en_sitio' :
    estadoKey.startsWith('complet') ? 'completada' :
    'programada';

  return (
    <div className="card vcard">
      <div className="vcard__head">
        <div className="vcard__title">{cliente}</div>
        <div className="vcard__badges">
          <span className={`chip chip--${estadoClass}`}>{estado}</span>
          {prioridad && <span className="chip chip--prio">{prioridad}</span>}
          <span className="chip">{new Date(fecha).toLocaleString()}</span>
        </div>
      </div>

      <div className="vcard__body">
        {titulo && <div className="muted">{titulo}</div>}
        <div className="muted">{direccion || 'Sin dirección'}</div>
      </div>

      <div className="vcard__actions">
        <button className="btn btn--map" onClick={abrirComoLlegar}>
          Cómo llegar
        </button>

        {estado === 'PROGRAMADA' && (
          <button className="btn btn--route" onClick={() => onIniciar(id)}>
            Iniciar (EN_RUTA)
          </button>
        )}

        {estado === 'EN_RUTA' && (
          <button
            className="btn btn--checkin"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  pos => onCheckIn(id, { lat: pos.coords.latitude, lng: pos.coords.longitude }),
                  () => onCheckIn(id) // sin geo si falla
                );
              } else {
                onCheckIn(id);
              }
            }}
          >
            Check-in (EN_SITIO)
          </button>
        )}

        {estado === 'EN_SITIO' && (
          <button className="btn btn--done" onClick={handleFinalizar}>
            Finalizar (COMPLETADA)
          </button>
        )}
      </div>
    </div>
  );
}


