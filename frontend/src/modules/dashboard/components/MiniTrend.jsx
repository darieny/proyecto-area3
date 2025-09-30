export default function MiniTrend({ note }) {
  return (
    <div className="trend">
      <div className="trend__sparkline" aria-hidden />
      {note && <span className="trend__note">{note}</span>}
    </div>
  );
}
