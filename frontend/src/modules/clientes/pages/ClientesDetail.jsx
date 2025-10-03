import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../../services/http';
import Sidebar from '../../dashboard/components/Sidebar';
import Topbar from '../../dashboard/components/Topbar';

export default function ClienteDetail() {
  const { id } = useParams();
  const [cliente, setCliente] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/clientes/${id}`);
        setCliente(data);
      } catch (e) {
        console.error('Error cargando cliente', e);
      }
    })();
  }, [id]);

  if (!cliente) return <div>Cargando cliente…</div>;

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <Topbar />
        <div className="cliente-detalle">
          <h2>{cliente.nombre}</h2>
          <p><b>Correo:</b> {cliente.correo}</p>
          <p><b>Teléfono:</b> {cliente.telefono}</p>
          <p><b>Departamento:</b> {cliente.departamento}</p>
          <p><b>Notas:</b> {cliente.notas}</p>
        </div>
      </main>
    </div>
  );
}
