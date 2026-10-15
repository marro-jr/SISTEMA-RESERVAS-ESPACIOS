const pool = require('../config/database');

const reservaRepository = {
  // Busca traslapes con reservas confirmadas. 'paraBloqueo' bloquea las filas concurrentes en InnoDB
  async obtenerTraslapes({ espacioId, fechaInicio, fechaFin }, conexion = pool, paraBloqueo = false) {
    let consulta = `
      SELECT id, space_id AS espacioId, customer_name AS nombreCliente, start_time AS fechaInicio, end_time AS fechaFin, status AS estado
      FROM reservations
      WHERE space_id = ?
        AND status = 'confirmed'
        AND start_time < ?
        AND end_time > ?
    `;

    if (paraBloqueo) {
      consulta += ' FOR UPDATE';
    }

    const [filas] = await conexion.query(consulta, [espacioId, fechaFin, fechaInicio]);
    return filas;
  },

  async crear({ espacioId, nombreCliente, correoCliente, fechaInicio, fechaFin, hashCodigoCancelacion }, conexion) {
    const consulta = `
      INSERT INTO reservations (
        space_id, customer_name, customer_email, start_time, end_time, status, cancellation_code_hash
      ) VALUES (?, ?, ?, ?, ?, 'confirmed', ?)
    `;

    const [resultado] = await conexion.query(consulta, [
      espacioId,
      nombreCliente,
      correoCliente,
      fechaInicio,
      fechaFin,
      hashCodigoCancelacion
    ]);

    return resultado.insertId;
  },

  async obtenerPorId(id, conexion = pool) {
    const consulta = `
      SELECT 
        r.id, 
        r.space_id AS espacioId, 
        r.customer_name AS nombreCliente, 
        r.customer_email AS correoCliente, 
        r.start_time AS fechaInicio, 
        r.end_time AS fechaFin, 
        r.status AS estado, 
        r.cancellation_code_hash AS hashCodigoCancelacion, 
        r.created_at AS fechaCreacion,
        s.name AS nombreEspacio, 
        s.location AS ubicacionEspacio, 
        s.capacity AS capacidadEspacio
      FROM reservations r
      INNER JOIN spaces s ON r.space_id = s.id
      WHERE r.id = ?
    `;

    const [filas] = await conexion.query(consulta, [id]);
    return filas[0] || null;
  },

  async actualizarEstado(id, nuevoEstado, conexion = pool) {
    const consulta = 'UPDATE reservations SET status = ? WHERE id = ?';
    const [resultado] = await conexion.query(consulta, [nuevoEstado, id]);
    return resultado.affectedRows > 0;
  }
};

module.exports = reservaRepository;
