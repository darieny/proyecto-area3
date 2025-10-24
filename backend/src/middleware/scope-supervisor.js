import { query } from '../config/db.js';

export async function withEquipoSupervisor(req, res, next) {
  try {
    const supervisorId = req.user.id; // viene del JWT
    const { rows } = await query(
      `SELECT usuario_id
         FROM tecnicos
        WHERE supervisor_id = $1
          AND activo = TRUE`,
      [supervisorId]
    );
    const tecnicosIds = rows.map(r => Number(r.usuario_id));
    req.supervisor = { id: Number(supervisorId), tecnicosIds };
    next();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo cargar el equipo del supervisor' });
  }
}
