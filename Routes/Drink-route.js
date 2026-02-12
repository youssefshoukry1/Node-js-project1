const express = require('express')
const router = express.Router()
const controller = require('../Controlls/Drink')
const verifyToken = require('../middleware/verifyToken')
const allowedTo = require('../middleware/allowedTo')

// Protected admin operations
router.post('/create', verifyToken, allowedTo('ADMIN', 'MANEGER'), controller.createDrink)
router.put('/:id', verifyToken, allowedTo('ADMIN', 'MANEGER'), controller.updateDrink)
router.delete('/:id', verifyToken, allowedTo('ADMIN', 'MANEGER'), controller.deleteDrink)

// Public endpoints
router.get('/all', controller.getAllDrinks)
router.get('/:id', controller.getDrinkById)

module.exports = router