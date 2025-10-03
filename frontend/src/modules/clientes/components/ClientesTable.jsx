import { Link } from "react-router-dom";
export default function ClientesTable({ items }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Empresa</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th>Departamento</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id}>
              <td>
                <Link to={`/clientes/${c.id}`} className="link-cliente">
                  {c.nombre}
                </Link>
              </td>
              <td>{c.nit || c.empresa || ""}</td>
              <td>{c.telefono}</td>
              <td>{c.correo}</td>
              <td>{c.departamento}</td>
              <td>
                <span className={`pill ${c.estado_bool ? "ok" : "bad"}`}>
                  {c.estado_bool ? "Active" : "Inactive"}
                </span>
              </td>
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td colSpan={6} className="empty">
                No hay clientes.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
