const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');

router.post('/', reservaController.crear);
router.post('/lookup', reservaController.consultar);
router.post('/consultar', reservaController.consultar);
router.post('/:id/lookup', reservaController.consultar);
router.post('/:id/consultar', reservaController.consultar);
router.post('/:id/cancel', reservaController.cancelar);
router.post('/:id/cancelar', reservaController.cancelar);

module.exports = router;
