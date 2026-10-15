const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');
const crearLimitadorTasa = require('../middlewares/limitadorTasa');

// Proteccion contra fuerza bruta para endpoints sensibles de consulta y cancelacion
const limitadorConsultaCancelacion = crearLimitadorTasa({
  ventanaMs: 15 * 60 * 1000,
  maximoIntentos: process.env.NODE_ENV === 'test' ? 30 : 10,
  mensaje: 'Demasiados intentos de consulta o cancelacion. Por favor, intente mas tarde.'
});

router.post('/', reservaController.crear);

router.post('/lookup', limitadorConsultaCancelacion, reservaController.consultar);
router.post('/consultar', limitadorConsultaCancelacion, reservaController.consultar);
router.post('/:id/lookup', limitadorConsultaCancelacion, reservaController.consultar);
router.post('/:id/consultar', limitadorConsultaCancelacion, reservaController.consultar);

router.post('/:id/cancel', limitadorConsultaCancelacion, reservaController.cancelar);
router.post('/:id/cancelar', limitadorConsultaCancelacion, reservaController.cancelar);

module.exports = router;
