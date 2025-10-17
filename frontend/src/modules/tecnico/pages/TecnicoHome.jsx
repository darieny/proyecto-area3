import { useNavigate } from 'react-router-dom';
import { useTecnicoVisitas } from '../hooks/useTecnicoVisitas';
import VisitCard from '../components/VisitCard';
import Sidebar from '../../dashboard/components/Sidebar';
import Topbar from '../../dashboard/components/Topbar';
import './Tecnico.css';

const hoy = () => new Date().toISOString().slice(0,10);

export default function TecnicoHome() {
  const from = hoy(), to = hoy();
  const { items, summary, loading, err } = useTecnicoVisitas({ from, to });
  const nav = useNavigate();

  const onIniciar = (id) => nav(`/tecnico/visitas/${id}?accion=iniciar`);
  const onCheckIn = (id, geo) => nav(`/tecnico/visitas/${id}?accion=checkin${geo ? `&lat=${geo.lat}&lng=${geo.lng}`:''}`);
  const onFinalizar = (id, nota) => nav(`/tecnico/visitas/${id}?accion=finalizar${nota?`&nota=${encodeURIComponent(nota)}`:''}`);

  return (
    <div className="shell">
      <Sidebar />
      <main>
        <Topbar title="Mis visitas de hoy" />
        {loading && <p>Cargando...</p>}
        {err && <p className="err">{err}</p>}
        {summary && (
          <div className="kpis">
            <div className="kpi">Programadas <b>{summary.programadas || 0}</b></div>
            <div className="kpi">En ruta <b>{summary.en_ruta || 0}</b></div>
            <div className="kpi">En sitio <b>{summary.en_sitio || 0}</b></div>
            <div className="kpi">Finalizadas <b>{summary.finalizadas || 0}</b></div>
          </div>
        )}
        <div className="grid">
          {items.map(v => (
            <VisitCard key={v.id} v={v} onIniciar={onIniciar} onCheckIn={onCheckIn} onFinalizar={onFinalizar}/>
          ))}
          {(!loading && items.length === 0) && <p>No tienes visitas para hoy.</p>}
        </div>
      </main>
    </div>
  );
}
