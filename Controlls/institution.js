const Institution = require('../models/Institution-model');

// Create new Institution
const createInstitution = async (req, res) => {
    try {
        const { name, code } = req.body;
        const existing = await Institution.findOne({ $or: [{ name }, { code }] });
        if (existing) {
            return res.status(400).json({ message: 'Institution with this name or code already exists' });
        }
        const newInst = await Institution.create({ name, code });
        res.status(201).json(newInst);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all Institutions
const getAllInstitutions = async (req, res) => {
    try {
        const insts = await Institution.find({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json(insts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete (Soft delete or Hard delete? User said delete. Let's hard delete for simplicity or set active false)
const deleteInstitution = async (req, res) => {
    try {
        await Institution.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Institution deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createInstitution,
    getAllInstitutions,
    deleteInstitution
};
