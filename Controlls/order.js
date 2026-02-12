const Order = require('../models/order-model')
const Drink = require('../models/Drink-model')
const paymobService = require('../Utility/paymob')

/**
 * =========================
 * CREATE ORDER (Customer / Frontend)
 * =========================
 */
const createOrder = async (req, res) => {
    try {
        const { items, paymentMethod, notes, institutionId } = req.body

        if (!items?.length) {
            return res.status(400).json({ message: 'Order must have at least one item' })
        }

        if (!institutionId) {
            return res.status(400).json({ message: 'Institution ID is required' })
        }

        // Deduplicate IDs to handle multiple items of the same drink
        const uniqueDrinkIds = [...new Set(items.map(i => i.drinkId))]

        const drinks = await Drink.find({
            _id: { $in: uniqueDrinkIds },
            isAvailable: true
        }).lean()

        if (drinks.length !== uniqueDrinkIds.length) {
            const foundIds = drinks.map(d => d._id.toString())
            const missing = uniqueDrinkIds.filter(id => !foundIds.includes(String(id)))
            return res.status(400).json({ message: 'One or more drinks are not available', missingIds: missing })
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

        const lastOrder = await Order.findOne({ institutionId }).sort({ orderNumber: -1 }).lean()
        const orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1

        // Initial status based on payment method
        // 'cash' -> 'waiting_for_cash' (requires cashier confirmation)
        // Others -> 'pending' (waiting for Paymob success callback)
        const initialStatus = paymentMethod === 'cash' ? 'waiting_for_cash' : 'pending'

        const order = await Order.create({
            orderNumber,
            items: normalizedItems,
            totalPrice,
            paymentMethod,
            notes,
            institutionId,
            status: initialStatus,
            paymentStatus: 'unpaid'
        })

        // Handle Paymob Payment Flow
        if (paymentMethod !== 'cash') {
            try {
                const authToken = await paymobService.getAuthToken()
                const paymobOrderId = await paymobService.registerOrder(authToken, order)

                // Save Paymob ID to our DB for callback verification
                order.paymobOrderId = paymobOrderId
                await order.save()

                const paymentToken = await paymobService.getPaymentKey(authToken, paymobOrderId, order)

                return res.status(201).json({
                    order,
                    paymentToken,
                    iframeId: process.env.iframe,
                    paymentUrl: `https://egypt.paymob.com/api/acceptance/iframes/${process.env.iframe}?payment_token=${paymentToken}`
                })
            } catch (paymobError) {
                // If Paymob fails, we still created the order but mark it as failed or return error
                console.error("Paymob Flow Error:", paymobError)
                return res.status(500).json({
                    message: "Order created but payment gateway failed",
                    orderId: order._id,
                    error: paymobError.message
                })
            }
        }

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
        const { institutionId } = req.query
        const filter = institutionId ? { institutionId } : {}

        const orders = await Order.find(filter)
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

const crypto = require('crypto')

/**
 * =========================
 * PAYMOB CALLBACK (Webhook)
 * =========================
 */
const paymobCallback = async (req, res) => {
    try {
        const { hmac } = req.query
        const { obj } = req.body

        // 1. Verify HMAC
        const hmacSecret = process.env.PAYMOB_HMAC_SECRET

        // Keys used for HMAC calculation in lexicographical order (Standard Transaction Processed Callback)
        const keys = [
            'amount_cents',
            'created_at',
            'currency',
            'error_occured',
            'has_parent_transaction',
            'id',
            'integration_id',
            'is_3d_secure',
            'is_auth',
            'is_capture',
            'is_refunded',
            'is_standalone_payment',
            'is_voided',
            'order.id',
            'owner',
            'pending',
            'source_data.pan',
            'source_data.sub_type',
            'source_data.type',
            'success'
        ]

        let concatenatedString = ""
        keys.forEach(key => {
            if (key === 'order.id') {
                concatenatedString += obj.order.id
            } else if (key === 'source_data.pan') {
                concatenatedString += obj.source_data.pan
            } else if (key === 'source_data.sub_type') {
                concatenatedString += obj.source_data.sub_type
            } else if (key === 'source_data.type') {
                concatenatedString += obj.source_data.type
            } else {
                concatenatedString += obj[key]
            }
        })

        const calculatedHmac = crypto
            .createHmac('sha512', hmacSecret)
            .update(concatenatedString)
            .digest('hex')

        if (calculatedHmac !== hmac) {
            console.error("HMAC Verification Failed")
            return res.status(401).send('Invalid HMAC')
        }

        // 2. Check Success
        const isSuccess = obj.success === true || obj.success === "true"
        const paymobOrderId = obj.order.id

        if (isSuccess) {
            // Find order by its Paymob Order ID (Very precise)
            const order = await Order.findOne({ paymobOrderId: paymobOrderId })

            if (order) {
                order.paymentStatus = 'paid'
                order.status = 'paid' // Move to kitchen queue
                await order.save()
            } else {
                console.error(`Order not found for Paymob ID: ${paymobOrderId}`)
            }
        }

        res.status(200).send('OK')
    } catch (error) {
        console.error('Callback Error:', error)
        res.status(500).send('Internal Server Error')
    }
}

module.exports = {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder,
    paymobCallback
}
