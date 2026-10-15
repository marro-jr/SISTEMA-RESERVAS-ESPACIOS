const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const espacioRepository = require('../repositories/espacioRepository');
const reservaRepository = require('../repositories/reservaRepository');

const reservaService = {
  async crearReserva({ espacioId, nombreCliente, correoCliente, fechaInicio, fechaFin }) {
    const idEspacio = Number(espacioId);
    if (!idEspacio || isNaN(idEspacio)) {
      const error = new Error('El ID del espacio proporcionado no es válido.');
      error.statusCode = 400;
      throw error;
    }

    const nombreLimpio = typeof nombreCliente === 'string' ? nombreCliente.trim() : '';
    if (!nombreLimpio || nombreLimpio.length < 2) {
      const error = new Error('Debe proporcionar un nombre de cliente válido (mínimo 2 caracteres).');
      error.statusCode = 400;
      throw error;
    }

    const patronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const correoLimpio = typeof correoCliente === 'string' ? correoCliente.trim() : '';
    if (!correoLimpio || !patronCorreo.test(correoLimpio)) {
      const error = new Error('Debe proporcionar un correo electrónico válido.');
      error.statusCode = 400;
      throw error;
    }

    if (!fechaInicio || !fechaFin) {
      const error = new Error('Debe especificar la fecha y hora de inicio y de fin.');
      error.statusCode = 400;
      throw error;
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      const error = new Error('El formato de fecha y hora es inválido.');
      error.statusCode = 400;
      throw error;
    }

    if (fin <= inicio) {
      const error = new Error('La fecha y hora de fin debe ser posterior a la de inicio.');
      error.statusCode = 400;
      throw error;
    }

    // Tolerancia de 2 minutos para evitar falsos rechazos por desfase de reloj
    const ahoraConMargen = new Date(Date.now() - 2 * 60 * 1000);
    if (inicio < ahoraConMargen) {
      const error = new Error('No se pueden crear reservas en fechas u horarios pasados.');
      error.statusCode = 400;
      throw error;
    }

    const fechaInicioFormateada = formatearFechaParaMySQL(inicio);
    const fechaFinFormateada = formatearFechaParaMySQL(fin);

    // Transacción con bloqueo pesimista en InnoDB para evitar condiciones de carrera
    const conexion = await pool.getConnection();

    try {
      await conexion.beginTransaction();

      const espacio = await espacioRepository.obtenerPorIdParaBloqueo(idEspacio, conexion);
      if (!espacio) {
        const error = new Error('El espacio seleccionado no existe.');
        error.statusCode = 404;
        throw error;
      }

      if (!espacio.activo) {
        const error = new Error('El espacio seleccionado está inactivo y no admite reservas.');
        error.statusCode = 400;
        throw error;
      }

      // Consulta de traslapes con FOR UPDATE para serializar solicitudes concurrentes sobre el mismo horario
      const traslapes = await reservaRepository.obtenerTraslapes(
        { espacioId: idEspacio, fechaInicio: fechaInicioFormateada, fechaFin: fechaFinFormateada },
        conexion,
        true
      );

      if (traslapes.length > 0) {
        const error = new Error('El espacio ya se encuentra reservado en el horario seleccionado.');
        error.statusCode = 409;
        throw error;
      }

      // Generación de código con 128 bits de entropía (16 bytes en hexadecimal = 32 caracteres)
      const codigoCancelacion = crypto.randomBytes(16).toString('hex');
      const hashCodigoCancelacion = await bcrypt.hash(codigoCancelacion, 10);

      const idReserva = await reservaRepository.crear(
        {
          espacioId: idEspacio,
          nombreCliente: nombreLimpio,
          correoCliente: correoLimpio,
          fechaInicio: fechaInicioFormateada,
          fechaFin: fechaFinFormateada,
          hashCodigoCancelacion
        },
        conexion
      );

      await conexion.commit();

      return {
        id: idReserva,
        espacioId: idEspacio,
        nombreEspacio: espacio.nombre,
        nombreCliente: nombreLimpio,
        correoCliente: correoLimpio,
        fechaInicio: fechaInicioFormateada,
        fechaFin: fechaFinFormateada,
        estado: 'confirmed',
        codigoCancelacion,
        // Compatibilidad con frontend y pruebas
        spaceId: idEspacio,
        spaceName: espacio.nombre,
        customerName: nombreLimpio,
        customerEmail: correoLimpio,
        startTime: fechaInicioFormateada,
        endTime: fechaFinFormateada,
        status: 'confirmed',
        cancellationCode: codigoCancelacion
      };
    } catch (error) {
      await conexion.rollback();
      throw error;
    } finally {
      conexion.release();
    }
  },

  async obtenerReservaPorIdYCodigo(id, codigoCancelacion) {
    const idReserva = Number(id);
    if (!idReserva || isNaN(idReserva)) {
      const error = new Error('El identificador de reserva no es válido.');
      error.statusCode = 400;
      throw error;
    }

    if (!codigoCancelacion || typeof codigoCancelacion !== 'string' || !codigoCancelacion.trim()) {
      const error = new Error('Debe proporcionar el código privado de la reserva.');
      error.statusCode = 400;
      throw error;
    }

    const reserva = await reservaRepository.obtenerPorId(idReserva);
    if (!reserva) {
      const error = new Error('Reserva no encontrada.');
      error.statusCode = 404;
      throw error;
    }

    const coincide = await bcrypt.compare(codigoCancelacion.trim().toLowerCase(), reserva.hashCodigoCancelacion);
    if (!coincide) {
      const error = new Error('El código privado de cancelación es incorrecto.');
      error.statusCode = 401;
      throw error;
    }

    // Excluye el hash de cancelación por privacidad y seguridad
    const { hashCodigoCancelacion: _, ...reservaSegura } = reserva;

    return {
      ...reservaSegura,
      // Alias de compatibilidad
      spaceId: reservaSegura.espacioId,
      customerName: reservaSegura.nombreCliente,
      customerEmail: reservaSegura.correoCliente,
      startTime: reservaSegura.fechaInicio,
      endTime: reservaSegura.fechaFin,
      status: reservaSegura.estado,
      spaceName: reservaSegura.nombreEspacio,
      spaceLocation: reservaSegura.ubicacionEspacio,
      spaceCapacity: reservaSegura.capacidadEspacio,
      createdAt: reservaSegura.fechaCreacion
    };
  },

  async cancelarReserva(id, codigoCancelacion) {
    const idReserva = Number(id);
    if (!idReserva || isNaN(idReserva)) {
      const error = new Error('El identificador de reserva no es válido.');
      error.statusCode = 400;
      throw error;
    }

    if (!codigoCancelacion || typeof codigoCancelacion !== 'string' || !codigoCancelacion.trim()) {
      const error = new Error('Debe proporcionar el código privado de cancelación.');
      error.statusCode = 400;
      throw error;
    }

    const reserva = await reservaRepository.obtenerPorId(idReserva);
    if (!reserva) {
      const error = new Error('Reserva no encontrada.');
      error.statusCode = 404;
      throw error;
    }

    if (reserva.estado === 'cancelled') {
      const error = new Error('La reserva ya ha sido cancelada con anterioridad.');
      error.statusCode = 409;
      throw error;
    }

    const coincide = await bcrypt.compare(codigoCancelacion.trim().toLowerCase(), reserva.hashCodigoCancelacion);
    if (!coincide) {
      const error = new Error('El código privado de cancelación es incorrecto.');
      error.statusCode = 401;
      throw error;
    }

    // Actualización condicional atómica: solo una solicitud concurrente afectará 1 fila
    const filasAfectadas = await reservaRepository.cancelarSiConfirmada(idReserva);
    if (filasAfectadas === 0) {
      const error = new Error('La reserva ya ha sido cancelada con anterioridad.');
      error.statusCode = 409;
      throw error;
    }

    return {
      id: idReserva,
      estado: 'cancelled',
      status: 'cancelled',
      espacioId: reserva.espacioId,
      spaceId: reserva.espacioId,
      nombreEspacio: reserva.nombreEspacio,
      spaceName: reserva.nombreEspacio,
      message: 'La reserva ha sido cancelada exitosamente y el espacio ha quedado libre.'
    };
  }
};

function formatearFechaParaMySQL(objetoFecha) {
  const rellenar = (numero) => String(numero).padStart(2, '0');
  const anio = objetoFecha.getFullYear();
  const mes = rellenar(objetoFecha.getMonth() + 1);
  const dia = rellenar(objetoFecha.getDate());
  const horas = rellenar(objetoFecha.getHours());
  const minutos = rellenar(objetoFecha.getMinutes());
  const segundos = rellenar(objetoFecha.getSeconds());
  return `${anio}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
}

module.exports = reservaService;
