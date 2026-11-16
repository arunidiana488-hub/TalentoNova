const express = require('express');
const router = express.Router();

const {
    obtenerOfertas,
    obtenerOfertaPorId,
    crearOferta,
    actualizarOferta,
    eliminarOferta
} = require('../controllers/jobs.controller');

router.get('/', obtenerOfertas);           // Listar todas
router.get('/:id', obtenerOfertaPorId);    // Ver una
router.post('/', crearOferta);             // Crear
router.put('/:id', actualizarOferta);      // Editar
router.delete('/:id', eliminarOferta);     // Eliminar

module.exports = router;