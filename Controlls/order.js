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
        // Initial status based on payment method
        let initialStatus = 'pending'
        if (paymentMethod === 'cash') initialStatus = 'waiting_for_cash'
        if (paymentMethod === 'paymob') initialStatus = 'pending'

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

        // 🔹 PAYMOB PAYMENT FLOW (for E-Wallet, Card, etc.)
        if (paymentMethod === 'paymob') {
            console.log(`💳 Starting Paymob payment flow for order #${orderNumber}`)
            console.log(`📋 Order Details - Total: ${totalPrice} EGP, Items: ${items.length}`)

            try {
                // Step 1: Get authentication token from Paymob
                console.log('🔑 Attempting Paymob authentication...')
                const authToken = await paymobService.getAuthToken()
                console.log('✅ Step 1: Authentication successful')

                // Step 2: Register this order with Paymob
                console.log('📝 Registering order with Paymob...')
                const paymobOrderId = await paymobService.registerOrder(authToken, order)
                console.log(`✅ Step 2: Order registered. Paymob ID: ${paymobOrderId}`)

                // Step 3: Save Paymob ID to our database for tracking
                order.paymobOrderId = paymobOrderId
                await order.save()

                // Step 4: Generate payment token for the payment page
                console.log('🎫 Generating payment token...')
                const paymentToken = await paymobService.getPaymentKey(authToken, paymobOrderId, order)
                console.log('✅ Step 3: Payment token generated')

                return res.status(201).json({
                    order,
                    paymentToken,
                    iframeId: process.env.iframe,
                    paymentUrl: `https://accept.paymob.com/api/acceptance/iframes/${process.env.iframe}?payment_token=${paymentToken}`
                })
            } catch (paymobError) {
                // Delete the order if payment setup failed
                await Order.findByIdAndDelete(order._id)

                console.error("❌ Paymob Flow Error:", paymobError.message)
                console.error("❌ Error Stack:", paymobError.stack)
                console.error("❌ Full Error:", JSON.stringify(paymobError, null, 2))

                return res.status(500).json({
                    message: "Payment gateway error",
                    details: paymobError.message,
                    error: process.env.NODE_ENV === 'development' ? paymobError.stack : undefined
                })
            }
        }

        res.status(201).json(order)
    } catch (error) {
        console.error('❌ Order Creation Error:', error.message)
        console.error('❌ Error Stack:', error.stack)

        // Mongoose validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Validation error',
                details: error.message,
                errors: error.errors
            })
        }

        // MongoDB duplicate key errors
        if (error.code === 11000) {
            return res.status(409).json({
                message: 'Duplicate order detected',
                details: error.message
            })
        }

        // Generic error
        res.status(500).json({
            message: error.message,
            type: error.name,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        })
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
            .lean()
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
        // 1. Extract Data based on Request Method (GET = Redirect, POST = Webhook)
        const method = req.method
        let data = {}
        let hmac = ""

        console.log(`🔔 Paymob Callback Received [${method}]`)

        if (method === 'POST') {
            // Webhook: Data is in body.obj
            data = req.body.obj
            hmac = req.query.hmac // HMAC is always in query for Webhook
        } else if (method === 'GET') {
            // Redirect: Data is in query params
            hmac = req.query.hmac
            data = req.query
        }

        if (!data) {
            console.error('❌ No data received in callback')
            return res.status(400).send('No data')
        }

        // 2. Verify HMAC
        const hmacSecret = process.env.PAYMOB_HMAC_SECRET
        if (!hmacSecret) {
            console.error('❌ PAYMOB_HMAC_SECRET is missing!')
            return res.status(500).send('Configuration Error')
        }

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
            let val = undefined

            // Smart extraction to handle both nested (POST) and flat (GET) structures
            if (method === 'POST') {
                if (key === 'order.id') val = data.order?.id
                else if (key === 'source_data.pan') val = data.source_data?.pan
                else if (key === 'source_data.sub_type') val = data.source_data?.sub_type
                else if (key === 'source_data.type') val = data.source_data?.type
                else val = data[key]
            } else {
                // GET Query params usually have keys like 'order' (for order.id) or 'source_data.pan'
                if (key === 'order.id') val = data.order || data['order.id']
                else if (key === 'source_data.pan') val = data['source_data.pan']
                else if (key === 'source_data.sub_type') val = data['source_data.sub_type']
                else if (key === 'source_data.type') val = data['source_data.type']
                else val = data[key]
            }

            // Convert booleans to string, null/undefined to empty string
            if (val === null || val === undefined) {
                val = ""
            } else {
                val = String(val) // true -> "true", false -> "false"
            }

            concatenatedString += val
        })

        const calculatedHmac = crypto
            .createHmac('sha512', hmacSecret)
            .update(concatenatedString)
            .digest('hex')

        console.log(`🔐 HMAC Check: Received=${hmac}, Calculated=${calculatedHmac}`)

        if (calculatedHmac !== hmac) {
            console.error("❌ HMAC Verification Failed")
            // Strict check: return res.status(401).send('Invalid HMAC')
            // For debugging, we might log and continue, but for production, fail.
            // Assuming user wants strict security:
            return res.status(401).send('Invalid HMAC')
        }

        // 3. Update Order Status
        const isSuccess = data.success === true || String(data.success).toLowerCase() === "true"
        const isPending = data.pending === true || String(data.pending).toLowerCase() === "true"

        // In GET/Query, order ID is usually in 'order' or 'merchant_order_id'
        // Paymob 'order' key in the callback refers to the Paymob Order ID.
        // We stored this as 'paymobOrderId' in our DB.
        const paymobOrderId = method === 'POST' ? data.order?.id : (data.order || data['order.id'])

        console.log(`📝 Transaction Status: Success=${isSuccess}, Pending=${isPending}, PaymobID=${paymobOrderId}`)

        if (isSuccess && !isPending) {
            const order = await Order.findOne({ paymobOrderId: paymobOrderId })

            if (order) {
                // Only update if not already paid to avoid redundant writes
                if (order.paymentStatus !== 'paid') {
                    console.log(`✅ Payment confirmed for Order #${order.orderNumber}. Updating status to 'paid'.`)
                    order.paymentStatus = 'paid'
                    order.status = 'paid' // Move to kitchen queue
                    await order.save()
                } else {
                    console.log(`ℹ️ Order #${order.orderNumber} is already marked as paid.`)
                }
            } else {
                console.error(`❌ Order not found for Paymob ID: ${paymobOrderId}`)
            }
        } else {
            console.log(`ℹ️ Transaction not successful or still pending.`)
        }

        return res.status(200).send('OK')
    } catch (error) {
        console.error('❌ Callback Error:', error)
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
