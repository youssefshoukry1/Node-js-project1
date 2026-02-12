const express = require('express');
const router = express.Router();
const controller = require('../Controlls/institution');
const verifyToken = require('../middleware/verifyToken')
const allowedTo = require('../middleware/allowedTo')

// Protected create/delete for managers/admins
router.post('/create', verifyToken, allowedTo('ADMIN', 'MANEGER'), controller.createInstitution);
router.delete('/:id', verifyToken, allowedTo('ADMIN', 'MANEGER'), controller.deleteInstitution);

// Public
router.get('/all', controller.getAllInstitutions);

module.exports = router;
