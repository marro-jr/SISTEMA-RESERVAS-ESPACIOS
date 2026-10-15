const express = require('express');
const router = express.Router();

const espacioRoutes = require('./espacioRoutes');
const reservaRoutes = require('./reservaRoutes');

// Rutas compatibles en inglés y español
router.use('/spaces', espacioRoutes);
router.use('/espacios', espacioRoutes);

router.use('/reservations', reservaRoutes);
router.use('/reservas', reservaRoutes);

module.exports = router;
