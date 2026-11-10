const express = require('express');
const router = express.Router();

const {
    obtenerOfertas
} = require('../controllers/jobs.controller');

router.get('/', obtenerOfertas);

module.exports = router;