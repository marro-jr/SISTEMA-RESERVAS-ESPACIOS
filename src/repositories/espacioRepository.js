const pool = require('../config/database');

const espacioRepository = {
  async obtenerTodos({ capacidadMinima, soloActivos = true } = {}) {
    let consulta = 'SELECT id, name AS nombre, capacity AS capacidad, location AS ubicacion, active AS activo, created_at AS fechaCreacion FROM spaces WHERE 1=1';
    const parametros = [];

    if (soloActivos) {
      consulta += ' AND active = 1';
    }

    if (capacidadMinima !== undefined && capacidadMinima !== null && !isNaN(Number(capacidadMinima))) {
      consulta += ' AND capacity >= ?';
      parametros.push(Number(capacidadMinima));
    }

    consulta += ' ORDER BY capacity ASC, name ASC';
    const [filas] = await pool.query(consulta, parametros);
    return filas;
  },

  async obtenerPorId(id, conexion = pool) {
    const [filas] = await conexion.query(
      'SELECT id, name AS nombre, capacity AS capacidad, location AS ubicacion, active AS activo, created_at AS fechaCreacion FROM spaces WHERE id = ?',
      [id]
    );
    return filas[0] || null;
  },

  // Bloqueo pesimista para evitar que dos transacciones evalúen el mismo espacio simultáneamente
  async obtenerPorIdParaBloqueo(id, conexion) {
    const [filas] = await conexion.query(
      'SELECT id, name AS nombre, capacity AS capacidad, location AS ubicacion, active AS activo FROM spaces WHERE id = ? FOR UPDATE',
      [id]
    );
    return filas[0] || null;
  },

  // Excluye espacios con reservas confirmadas superpuestas: (inicio < nuevoFin AND fin > nuevoInicio)
  async obtenerEspaciosDisponibles({ fechaInicio, fechaFin, capacidadMinima }) {
    let consulta = `
      SELECT s.id, s.name AS nombre, s.capacity AS capacidad, s.location AS ubicacion, s.active AS activo
      FROM spaces s
      WHERE s.active = 1
    `;
    const parametros = [];

    if (capacidadMinima !== undefined && capacidadMinima !== null && !isNaN(Number(capacidadMinima))) {
      consulta += ' AND s.capacity >= ?';
      parametros.push(Number(capacidadMinima));
    }

    consulta += `
      AND s.id NOT IN (
        SELECT r.space_id
        FROM reservations r
        WHERE r.status = 'confirmed'
          AND r.start_time < ?
          AND r.end_time > ?
      )
      ORDER BY s.capacity ASC, s.name ASC
    `;
    parametros.push(fechaFin, fechaInicio);

    const [filas] = await pool.query(consulta, parametros);
    return filas;
  }
};

module.exports = espacioRepository;
