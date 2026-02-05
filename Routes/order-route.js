const express = require('express')
const router = express.Router()
const controller = require('../Controlls/order')

router.post('/create', controller.createOrder)
router.get('/getAll', controller.getAllOrders)
router.get('/:id', controller.getOrderById)
router.put('/:id', controller.updateOrderStatus)
router.delete('/:id', controller.deleteOrder)

module.exports = router