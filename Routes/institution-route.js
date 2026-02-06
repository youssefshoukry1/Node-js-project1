const express = require('express');
const router = express.Router();
const controller = require('../Controlls/institution');

router.post('/create', controller.createInstitution);
router.get('/all', controller.getAllInstitutions);
router.delete('/:id', controller.deleteInstitution);

module.exports = router;
