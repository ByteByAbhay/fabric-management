const express = require('express');
const router = express.Router();
const { 
  getAllInlineStock, 
  getInlineStockById, 
  createInlineStock, 
  updateInlineStock, 
  getInlineStockReport 
} = require('../controllers/inlineStockController');
const InlineStock = require('../models/InlineStock');
const Cutting = require('../models/Cutting');

// Debug middleware for this route
router.use((req, res, next) => {
  console.log('InlineStock Route:', {
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query
  });
  next();
});

// Get all inline stock items
router.get('/', getAllInlineStock);

// Get inline stock report data
router.get('/report', getInlineStockReport);

// Get inline stock by ID
router.get('/:id', getInlineStockById);

// Add new inline stock
router.post('/', async (req, res) => {
  try {
    const { loadId, date, size, colors, total, cutting_id } = req.body;

    // Validate required fields
    if (!loadId || !date || !size || !colors || !total || !cutting_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields. cutting_id is required to establish proper relationship.'
      });
    }

    // Check if this loadId already exists
    const existingLoad = await InlineStock.findOne({ loadId });
    if (existingLoad) {
      return res.status(400).json({
        success: false,
        error: 'Load ID already exists'
      });
    }

    // Verify that the referenced cutting exists
    const cutting = await Cutting.findById(cutting_id);
    if (!cutting) {
      return res.status(404).json({
        success: false,
        error: 'Referenced cutting record not found'
      });
    }

    // Convert colors object to Map for MongoDB
    const colorEntries = Object.entries(colors).reduce((acc, [color, data]) => {
      acc.set(color, {
        quantity: data.quantity,
        bundle: data.bundle
      });
      return acc;
    }, new Map());

    // Create new inline stock with reference to cutting
    // lotNo and pattern will be automatically populated from the cutting record
    const inlineStock = new InlineStock({
      loadId,
      date: new Date(date),
      size,
      cutting_id,
      colors: colorEntries,
      total
    });

    await inlineStock.save();
    
    // Fetch the saved record with populated fields
    const savedStock = await InlineStock.findById(inlineStock._id);
    
    res.json({ 
      success: true, 
      data: savedStock,
      message: `Created inline stock with lot number ${savedStock.lotNo} and pattern ${savedStock.pattern} from cutting reference`
    });
  } catch (error) {
    console.error('Error creating inline stock:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create inline stock item' 
    });
  }
});

// Remove loaded size from cutting and transfer to inline stock
router.post('/remove-loaded', async (req, res) => {
  try {
    console.log('Remove loaded data:', req.body);
    const { date, size, loadId } = req.body;

    if (!date || !size || !loadId) {
      return res.status(400).json({
        success: false,
        error: 'Date, size, and loadId are required',
        receivedData: req.body
      });
    }
    
    // Find cuttings for the date
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const cuttings = await Cutting.find({
      datetime: {
        $gte: startDate,
        $lt: endDate
      },
      sizes: size, // Only find cuttings that include this size
      after_cutting_complete: true // Only consider completed cuttings
    });

    console.log(`Found ${cuttings.length} cuttings for date ${date} with size ${size}`);

    if (cuttings.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No completed cuttings found for date ${date} with size ${size}`
      });
    }

    // Track the total pieces moved to inline stock by color
    const colorQuantities = {};
    let totalPieces = 0;
    
    // Get the first cutting record to use as a reference
    const sourceCutting = cuttings[0];
    const cuttingId = sourceCutting._id;
    
    // Verify the cutting has the required data
    if (!sourceCutting.lot_no || !sourceCutting.pattern) {
      return res.status(400).json({
        success: false,
        error: 'Source cutting record is missing lot number or pattern'
      });
    }
    
    console.log(`Using cutting ID ${cuttingId} as reference for inline stock`);

    // Update each cutting to mark the size as transferred to inline stock
    for (const cutting of cuttings) {
      // Remove the size from the sizes array to mark it as transferred
      cutting.sizes = cutting.sizes.filter(s => s !== size);
      
      // Track the pieces by color
      cutting.roles.forEach(role => {
        const color = role.role_color;
        const piecesPerRole = role.layers_cut || 0; // Each layer produces one piece of each size
        
        if (!colorQuantities[color]) {
          colorQuantities[color] = {
            quantity: 0,
            bundle: 0
          };
        }
        
        colorQuantities[color].quantity += piecesPerRole;
        colorQuantities[color].bundle += 1; // Each role is considered one bundle
        totalPieces += piecesPerRole;
      });
      
      await cutting.save();
    }

    // Check if this loadId already exists
    const existingLoad = await InlineStock.findOne({ loadId });
    if (existingLoad) {
      return res.status(400).json({
        success: false,
        error: 'Load ID already exists'
      });
    }

    // Convert colors object to Map for MongoDB
    const colorEntries = Object.entries(colorQuantities).reduce((acc, [color, data]) => {
      acc.set(color, {
        quantity: data.quantity,
        bundle: data.bundle
      });
      return acc;
    }, new Map());

    // Create new inline stock with proper relationship to cutting batch
    // Only store the cutting_id reference, lotNo and pattern will be populated automatically
    const inlineStock = new InlineStock({
      loadId,
      date: new Date(date),
      size,
      cutting_id: cuttingId, // Store reference to the original cutting
      colors: colorEntries,
      total: totalPieces
    });

    await inlineStock.save();
    
    // The lotNo and pattern are now populated from the referenced cutting
    console.log(`Created new inline stock with reference to cutting ID ${cuttingId}`);


    res.json({ 
      success: true,
      message: `Removed size ${size} from ${cuttings.length} cuttings and transferred ${totalPieces} pieces to inline stock`,
      colorQuantities,
      totalPieces
    });
  } catch (error) {
    console.error('Error removing loaded size:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Delete all inline stock items
router.delete('/clear', async (req, res) => {
  try {
    console.log('Clearing all inline stock items...');
    const result = await InlineStock.deleteMany({});
    console.log('Clear result:', result);
    res.json({ 
      success: true, 
      message: `Cleared ${result.deletedCount} items` 
    });
  } catch (error) {
    console.error('Error clearing inline stock:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete a specific inline stock item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await InlineStock.findByIdAndDelete(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting inline stock item:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete inline stock item' 
    });
  }
});

module.exports = router; 