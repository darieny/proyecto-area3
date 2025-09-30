import { useMemo } from 'react';

export default function CalendarWidget({ date = new Date() }) {
  const data = useMemo(() => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-11
    const first = new Date(year, month, 1);
    const last  = new Date(year, month + 1, 0);
    const startDay = (first.getDay() + 6) % 7; // L=0 … D=6
    const days = Array.from({ length: startDay }).map(() => null)
      .concat(Array.from({ length: last.getDate() }, (_, i) => i + 1));
    return { year, month, days };
  }, [date]);

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const dias = ['L','M','M','J','V','S','D'];

  return (
    <div className="panel cal">
      <div className="cal__head">{meses[data.month]}</div>
      <div className="cal__grid cal__labels">
        {dias.map(d => <div key={d} className="cal__lbl">{d}</div>)}
      </div>
      <div className="cal__grid">
        {data.days.map((n, idx) =>
          <div key={idx} className={`cal__cell ${n ? '' : 'is-empty'}`}>{n ?? ''}</div>
        )}
      </div>
      <div className="cal__foot">
        <h4>Eventos futuros</h4>
        <div className="cal__empty">🎉 No tienes eventos futuros</div>
      </div>
    </div>
  );
}
