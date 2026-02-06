const Settings = require('../models/settings-model')

/**
 * Initialize Default Settings if not exists
 */
const initSettings = async () => {
    try {
        const exists = await Settings.findById('ALIGNMENT_SETTINGS')
        if (!exists) {
            await Settings.create({ _id: 'ALIGNMENT_SETTINGS', adminPassword: '1234', ownerPassword: '0000' })
            console.log('Initialized Default Settings')
        }
    } catch (error) {
        console.error('Settings Init Error:', error)
    }
}

/**
 * Verify Password
 * req.body: { password, type } -> type: 'admin' | 'owner'
 */
const verifyPassword = async (req, res) => {
    try {
        const { password, type } = req.body

        const settings = await Settings.findById('ALIGNMENT_SETTINGS')
        if (!settings) return res.status(500).json({ message: 'System error: Settings not found' })

        let isValid = false
        if (type === 'admin') {
            // Admin can accept Admin Password OR Owner Password (Owner has higher privilege)
            isValid = (password === settings.adminPassword || password === settings.ownerPassword)
        } else if (type === 'owner') {
            isValid = (password === settings.ownerPassword)
        }

        if (isValid) {
            return res.status(200).json({ success: true, message: 'Access Granted' })
        } else {
            return res.status(401).json({ success: false, message: 'Invalid Password' })
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

/**
 * Update Passwords (Owner Only)
 */
const updatePasswords = async (req, res) => {
    try {
        const { currentOwnerPassword, newAdminPassword, newOwnerPassword } = req.body

        const settings = await Settings.findById('ALIGNMENT_SETTINGS')

        if (currentOwnerPassword !== settings.ownerPassword) {
            return res.status(401).json({ message: 'Invalid Owner Password' })
        }

        if (newAdminPassword) settings.adminPassword = newAdminPassword
        if (newOwnerPassword) settings.ownerPassword = newOwnerPassword

        await settings.save()
        res.status(200).json({ message: 'Passwords Updated' })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports = {
    initSettings,
    verifyPassword,
    updatePasswords
}
