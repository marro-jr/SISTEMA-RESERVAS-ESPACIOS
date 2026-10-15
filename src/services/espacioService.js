const espacioRepository = require('../repositories/espacioRepository');

const espacioService = {
  async listarEspacios({ capacidadMinima, soloActivos = true } = {}) {
    return espacioRepository.obtenerTodos({ capacidadMinima, soloActivos });
  },

  async obtenerPorId(id) {
    const idNumero = Number(id);
    if (!idNumero || isNaN(idNumero)) {
      const error = new Error('El ID del espacio proporcionado no es válido.');
      error.statusCode = 400;
      throw error;
    }

    const espacio = await espacioRepository.obtenerPorId(idNumero);
    if (!espacio) {
      const error = new Error('Espacio no encontrado.');
      error.statusCode = 404;
      throw error;
    }

    return espacio;
  },

  async consultarDisponibilidad({ fechaInicio, fechaFin, capacidadMinima }) {
    if (!fechaInicio || !fechaFin) {
      const error = new Error('Debe proporcionar fecha y hora de inicio y fin.');
      error.statusCode = 400;
      throw error;
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      const error = new Error('El formato de fecha y hora no es válido.');
      error.statusCode = 400;
      throw error;
    }

    if (fin <= inicio) {
      const error = new Error('La fecha y hora de fin debe ser posterior a la de inicio.');
      error.statusCode = 400;
      throw error;
    }

    // Tolerancia de 2 minutos para compensar leves desfases de reloj
    const ahoraConMargen = new Date(Date.now() - 2 * 60 * 1000);
    if (inicio < ahoraConMargen) {
      const error = new Error('No se pueden consultar horarios en fechas u horas pasadas.');
      error.statusCode = 400;
      throw error;
    }

    const fechaInicioFormateada = formatearFechaParaMySQL(inicio);
    const fechaFinFormateada = formatearFechaParaMySQL(fin);

    return espacioRepository.obtenerEspaciosDisponibles({
      fechaInicio: fechaInicioFormateada,
      fechaFin: fechaFinFormateada,
      capacidadMinima
    });
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

module.exports = espacioService;
