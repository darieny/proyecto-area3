// src/modules/tecnico/components/VisitCard.jsx
export default function VisitCard({ v, onIniciar, onCheckIn, onFinalizar }) {
  const { id, cliente, direccion, fecha, estado, lat, lng, titulo, prioridad } = v;

  const abrirComoLlegar = () => {
    const dest = (lat && lng) ? `${lat},${lng}` : encodeURIComponent(direccion || cliente);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleFinalizar = () => {
    const nota = prompt('Nota de cierre (obligatoria):') || '';
    if (!nota || !nota.trim()) {
      alert('Debes escribir la nota para finalizar la visita.');
      return;
    }
    onFinalizar(id, nota.trim());
  };

  return (
    <div className="card vcard">
      <div className="vcard__head">
        <strong>{cliente}</strong> <span>· {new Date(fecha).toLocaleString()}</span>
        {prioridad && <span className="tag">{prioridad}</span>}
      </div>

      <div className="vcard__body">
        <div className="muted">{titulo}</div>
        <div className="muted">{direccion || 'Sin dirección'}</div>
        <div><b>Estado:</b> {estado}</div>
      </div>

      <div className="vcard__actions">
        <button className="btn btn--map" onClick={abrirComoLlegar}>Cómo llegar</button>

        {estado === 'PROGRAMADA' && (
          <button onClick={() => onIniciar(id)}>Iniciar (EN_RUTA)</button>
        )}

        {estado === 'EN_RUTA' && (
          <button
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
          <button onClick={handleFinalizar}>
            Finalizar (COMPLETADA)
          </button>
        )}
      </div>
    </div>
  );
}

