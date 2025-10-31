export function buildVisitaEmail({ visita, cliente, ubicacion, cierre, materiales = [], evidencias = [] }) {
  const start = visita.real_inicio ? new Date(visita.real_inicio) : null;
  const end   = visita.real_fin    ? new Date(visita.real_fin)    : null;
  const duracion = (start && end) ? Math.round((end - start) / 60000) + ' min' : '-';

  const listaEvidencias = evidencias.length
    ? `<ul>${evidencias.map(e => `<li><a href="${e.archivo_url}" target="_blank" rel="noreferrer">Ver evidencia</a>${e.descripcion ? ` — ${e.descripcion}` : ''}</li>`).join('')}</ul>`
    : '<p><em>Sin evidencias adjuntas</em></p>';

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:auto;line-height:1.5">
    <h2 style="margin:0 0 8px">Reporte de visita #${visita.id}</h2>
    <p style="color:#555;margin:0 0 6px">Cliente: <strong>${cliente.nombre}</strong></p>
    <p style="color:#555;margin:0 0 18px">Técnico: <strong>${cierre?.tecnico_nombre ?? '-'}</strong></p>

    <table style="width:100%;border-collapse:collapse;margin:12px 0">
      <tr><td style="padding:6px;border:1px solid #eee">Título</td><td style="padding:6px;border:1px solid #eee"><strong>${visita.titulo}</strong></td></tr>
      <tr><td style="padding:6px;border:1px solid #eee">Ubicación</td><td style="padding:6px;border:1px solid #eee">${ubicacion?.etiqueta ?? '-'}${ubicacion?.direccion_linea1 ? ` — ${ubicacion.direccion_linea1}` : ''}</td></tr>
      <tr><td style="padding:6px;border:1px solid #eee">Inicio real</td><td style="padding:6px;border:1px solid #eee">${visita.real_inicio ?? '-'}</td></tr>
      <tr><td style="padding:6px;border:1px solid #eee">Fin real</td><td style="padding:6px;border:1px solid #eee">${visita.real_fin ?? '-'}</td></tr>
      <tr><td style="padding:6px;border:1px solid #eee">Duración</td><td style="padding:6px;border:1px solid #eee">${duracion}</td></tr>
    </table>

    <h3 style="margin:18px 0 6px">Resumen</h3>
    <p>${(cierre?.resumen ?? '').replace(/\n/g,'<br>') || '<em>—</em>'}</p>

    <h3 style="margin:18px 0 6px">Trabajo realizado</h3>
    <p>${(cierre?.trabajo_realizado ?? '').replace(/\n/g,'<br>') || '<em>—</em>'}</p>

    <h3 style="margin:18px 0 6px">Evidencias</h3>
    ${listaEvidencias}

    <p style="color:#666;margin-top:24px">Este correo fue generado automáticamente por el sistema Área 3.</p>
  </div>
  `;
}

