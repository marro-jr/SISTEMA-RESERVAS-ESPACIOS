const express = require('express');
const router = express.Router();
const espacioController = require('../controllers/espacioController');

router.get('/availability', espacioController.consultarDisponibilidad);
router.get('/disponibilidad', espacioController.consultarDisponibilidad);
router.get('/', espacioController.listar);
router.get('/:id', espacioController.obtenerPorId);

module.exports = router;
