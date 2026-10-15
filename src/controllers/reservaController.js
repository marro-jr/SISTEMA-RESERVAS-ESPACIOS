const reservaService = require('../services/reservaService');

const reservaController = {
  async crear(req, res, next) {
    try {
      const espacioId = req.body.espacioId ?? req.body.spaceId;
      const nombreCliente = req.body.nombreCliente ?? req.body.customerName;
      const correoCliente = req.body.correoCliente ?? req.body.customerEmail;
      const fechaInicio = req.body.fechaInicio ?? req.body.startTime;
      const fechaFin = req.body.fechaFin ?? req.body.endTime;

      const reserva = await reservaService.crearReserva({
        espacioId,
        nombreCliente,
        correoCliente,
        fechaInicio,
        fechaFin
      });

      res.status(201).json({
        success: true,
        message: 'Reserva registrada con éxito. Guarde su código privado para consultas o cancelaciones.',
        data: reserva
      });
    } catch (error) {
      next(error);
    }
  },

  async consultar(req, res, next) {
    try {
      const id = req.params.id || req.body.idReserva || req.body.reservationId || req.body.id;
      const codigoCancelacion = req.body.codigoCancelacion ?? req.body.cancellationCode;

      const reserva = await reservaService.obtenerReservaPorIdYCodigo(id, codigoCancelacion);

      res.status(200).json({
        success: true,
        data: reserva
      });
    } catch (error) {
      next(error);
    }
  },

  async cancelar(req, res, next) {
    try {
      const { id } = req.params;
      const codigoCancelacion = req.body.codigoCancelacion ?? req.body.cancellationCode;

      const resultado = await reservaService.cancelarReserva(id, codigoCancelacion);

      res.status(200).json({
        success: true,
        message: resultado.message,
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = reservaController;
