const Order = require('../models/order-model')
const Drink = require('../models/Drink-model')

/**
 * =========================
 * CREATE ORDER (Customer / Frontend)
 * =========================
 */
const createOrder = async (req, res) => {
    try {
        const { items, paymentMethod, notes } = req.body

        if (!items?.length) {
            return res.status(400).json({ message: 'Order must have at least one item' })
        }

        const drinkIds = items.map(i => i.drinkId)

        const drinks = await Drink.find({
            _id: { $in: drinkIds },
            isAvailable: true
        }).lean()

        if (drinks.length !== drinkIds.length) {
            return res.status(400).json({ message: 'One or more drinks are not available' })
        }

        const drinkMap = new Map(drinks.map(d => [d._id.toString(), d]))

        let totalPrice = 0

        const normalizedItems = items.map(item => {
            const drink = drinkMap.get(item.drinkId)

            const sizeObj = drink.sizes.find(s => s.size === item.size)
            if (!sizeObj) {
                throw new Error(`Size not available for ${drink.title}`)
            }

            const quantity = item.quantity || 1
            const price = sizeObj.price

            totalPrice += price * quantity

            return {
                drinkId: item.drinkId,
                title: drink.title,
                size: item.size,
                price,
                quantity,
                customizations: item.customizations
            }
        })

        const lastOrder = await Order.findOne().sort({ orderNumber: -1 }).lean()
        const orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1

        const order = await Order.create({
            orderNumber,
            items: normalizedItems,
            totalPrice,

            paymentMethod,
            notes
        })

        res.status(201).json(order)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * =========================
 * GET ALL ORDERS (Admin / Kitchen Display)
 * =========================
 */
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .lean() // faster for frontend display
        res.status(200).json(orders)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

/**
 * =========================
 * GET SINGLE ORDER (Frontend / Admin)
 * =========================
 */
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).lean()
        if (!order) return res.status(404).json({ message: 'Order not found' })
        res.status(200).json(order)
    } catch (error) {
        res.status(400).json({ message: 'Invalid order ID' })
    }
}

/**
 * =========================
 * UPDATE ORDER STATUS (Admin / Kitchen Display)
 * =========================
 */
const updateOrderStatus = async (req, res) => {
    try {
        const { status, paymentStatus } = req.body

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status, paymentStatus },
            { new: true, runValidators: true }
        )

        if (!order) return res.status(404).json({ message: 'Order not found' })

        res.status(200).json(order)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * =========================
 * DELETE ORDER (Admin only)
 * =========================
 */
const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id)
        if (!order) return res.status(404).json({ message: 'Order not found' })
        res.status(200).json({ message: 'Order deleted successfully' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports = {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder
}
