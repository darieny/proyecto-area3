export default function KpiCard({ title, value, accent='peach', children }) {
  return (
    <div className={`kpi kpi--${accent}`}>
      <div className="kpi__title">{title}</div>
      <div className="kpi__value">{value ?? '–'}</div>
      {children && <div className="kpi__extra">{children}</div>}
    </div>
  );
}
