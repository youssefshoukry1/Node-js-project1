const Drink = require('../models/Drink-model')

/**
 * =========================
 * ADMIN CONTROLLERS
 * =========================
 */

/**
 * Create new drink (Admin only)
 * - Validate required fields
 * - Ensure at least one size exists
 */
const createDrink = async (req, res) => {
  try {
    const { title, description, coffeeType, sizes, options, image } = req.body

    // Basic validation (important for data integrity)
    if (!title || !description || !coffeeType || !sizes || !image) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    if (!Array.isArray(sizes) || sizes.length === 0) {
      return res.status(400).json({ message: 'Drink must have at least one size' })
    }

    const drink = await Drink.create({
      title,
      description,
      coffeeType,
      sizes,
      options,
      image
    })

    res.status(201).json(drink)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * Update drink (Admin only)
 * - runValidators ensures enums & schema rules are respected
 */
const updateDrink = async (req, res) => {
  try {
    const drink = await Drink.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true // IMPORTANT: prevents invalid updates
      }
    )

    if (!drink) {
      return res.status(404).json({ message: 'Drink not found' })
    }

    res.status(200).json(drink)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

/**
 * Delete drink (Admin only)
 * - In real production you may prefer soft delete
 */
const deleteDrink = async (req, res) => {
  try {
    const drink = await Drink.findByIdAndDelete(req.params.id)

    if (!drink) {
      return res.status(404).json({ message: 'Drink not found' })
    }

    res.status(200).json({ message: 'Drink deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * =========================
 * PUBLIC / ORDER PAGE CONTROLLERS
 * =========================
 */

/**
 * Get all available drinks (Order Page)
 * PERFORMANCE OPTIMIZED:
 * - Filter unavailable drinks
 * - Select only required fields
 * - Sorted for better UX
 */
const getAllDrinks = async (req, res) => {
  try {
    const drinks = await Drink.find({ isAvailable: true })
      .select('title description coffeeType sizes options image') // reduce payload
      .sort({ coffeeType: 1, title: 1 }) // predictable ordering
      .lean() // PERFORMANCE: returns plain JS objects (faster)

    res.status(200).json(drinks)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * Get single drink by ID (Order Page)
 * - Prevents showing unavailable drinks
 * - Handles invalid IDs safely
 */
const getDrinkById = async (req, res) => {
  try {
    const drink = await Drink.findOne({
      _id: req.params.id,
      isAvailable: true
    })
      .select('title description coffeeType sizes options image')
      .lean()

    if (!drink) {
      return res.status(404).json({ message: 'Drink not found' })
    }

    res.status(200).json(drink)
  } catch (error) {
    res.status(400).json({ message: 'Invalid drink ID' })
  }
}

module.exports = {
  // Admin
  createDrink,
  updateDrink,
  deleteDrink,

  // Public / Order Page
  getAllDrinks,
  getDrinkById
}
