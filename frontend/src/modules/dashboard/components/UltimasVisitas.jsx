export default function UltimasVisitas({ items = [] }) {
  return (
    <div className="panel">
      <div className="panel__head"><h3>Últimas visitas registradas</h3></div>
      <ul className="list">
        {items.map(v => (
          <li key={v.id} className="list__item">
            <div className="list__title">{v.titulo || `Cliente: ${v.cliente}`}</div>
            <div className="list__meta">{v.cliente} • {v.estado} • {v.fecha} {v.hora}</div>
          </li>
        ))}
      </ul>
      <div className="panel__foot"><button className="link">Ver todo</button></div>
    </div>
  );
}
