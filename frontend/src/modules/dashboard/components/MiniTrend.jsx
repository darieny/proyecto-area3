export default function MiniTrend({ note = '+2% Past month' }) {
  return (
    <div className="trend">
      <div className="trend__sparkline" aria-hidden /> 
      <span className="trend__note">{note}</span>
    </div>
  );
}
