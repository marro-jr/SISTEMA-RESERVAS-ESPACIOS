const espacioService = require('../services/espacioService');

const espacioController = {
  async listar(req, res, next) {
    try {
      const capacidadMinima = req.query.capacidadMinima ?? req.query.minCapacity;
      const espacios = await espacioService.listarEspacios({ capacidadMinima, soloActivos: true });
      res.status(200).json({
        success: true,
        count: espacios.length,
        total: espacios.length,
        data: espacios
      });
    } catch (error) {
      next(error);
    }
  },

  async consultarDisponibilidad(req, res, next) {
    try {
      const fechaInicio = req.query.fechaInicio ?? req.query.startTime;
      const fechaFin = req.query.fechaFin ?? req.query.endTime;
      const capacidadMinima = req.query.capacidadMinima ?? req.query.minCapacity;

      const espaciosDisponibles = await espacioService.consultarDisponibilidad({
        fechaInicio,
        fechaFin,
        capacidadMinima
      });

      res.status(200).json({
        success: true,
        count: espaciosDisponibles.length,
        total: espaciosDisponibles.length,
        data: espaciosDisponibles
      });
    } catch (error) {
      next(error);
    }
  },

  async obtenerPorId(req, res, next) {
    try {
      const { id } = req.params;
      const espacio = await espacioService.obtenerPorId(id);
      res.status(200).json({
        success: true,
        data: espacio
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = espacioController;
