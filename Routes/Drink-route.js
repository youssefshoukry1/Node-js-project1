const express = require('express')
const router = express.Router()
const controller = require('../Controlls/Drink')

router.post('/create', controller.createDrink)
router.get('/all', controller.getAllDrinks)
router.get('/:id', controller.getDrinkById)
router.put('/:id', controller.updateDrink)
router.delete('/:id', controller.deleteDrink)

module.exports = router