const InlineStock = require('../models/InlineStock');
const Cutting = require('../models/Cutting');

// Get all inline stock items
exports.getAllInlineStock = async (req, res) => {
  try {
    const { processed } = req.query;
    
    // Build query filter
    let filter = {};
    
    // Filter by processed status if specified
    if (processed !== undefined) {
      filter.processed = processed === 'true';
    }
    
    const inlineStock = await InlineStock.find(filter)
      .sort({ createdAt: -1 })
      .populate('cutting_id', 'lot_no pattern')
      .populate('processOutputId');
    
    res.status(200).json({
      success: true,
      count: inlineStock.length,
      data: inlineStock
    });
  } catch (error) {
    console.error('Error fetching inline stock data:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch inline stock data'
    });
  }
};

// Get inline stock by ID
exports.getInlineStockById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const inlineStock = await InlineStock.findById(id)
      .populate('cutting_id', 'lot_no pattern')
      .populate('processOutputId');
    
    if (!inlineStock) {
      return res.status(404).json({
        success: false,
        error: 'Inline stock item not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: inlineStock
    });
  } catch (error) {
    console.error('Error fetching inline stock item:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch inline stock item'
    });
  }
};

// Create new inline stock item
exports.createInlineStock = async (req, res) => {
  try {
    const { loadId, date, size, colors, total, cutting_id } = req.body;
    
    // Validate required fields
    if (!loadId || !date || !size || !colors || !total || !cutting_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    // Check if cutting exists
    const cutting = await Cutting.findById(cutting_id);
    if (!cutting) {
      return res.status(404).json({
        success: false,
        error: 'Cutting reference not found'
      });
    }
    
    // Check if loadId already exists
    const existingItem = await InlineStock.findOne({ loadId });
    if (existingItem) {
      return res.status(400).json({
        success: false,
        error: 'An inline stock item with this loadId already exists'
      });
    }
    
    // Create the inline stock record
    const inlineStock = new InlineStock({
      loadId,
      date: new Date(date),
      size,
      colors,
      total,
      cutting_id,
      processed: false
    });
    
    await inlineStock.save();
    
    res.status(201).json({
      success: true,
      data: inlineStock
    });
  } catch (error) {
    console.error('Error creating inline stock item:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create inline stock item'
    });
  }
};

// Update inline stock item
exports.updateInlineStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { loadId, date, size, colors, total } = req.body;
    
    // Find the inline stock item
    const inlineStock = await InlineStock.findById(id);
    
    if (!inlineStock) {
      return res.status(404).json({
        success: false,
        error: 'Inline stock item not found'
      });
    }
    
    // Don't allow updating processed items
    if (inlineStock.processed) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update a processed inline stock item'
      });
    }
    
    // Update fields
    if (loadId) inlineStock.loadId = loadId;
    if (date) inlineStock.date = new Date(date);
    if (size) inlineStock.size = size;
    if (colors) inlineStock.colors = colors;
    if (total) inlineStock.total = total;
    
    await inlineStock.save();
    
    res.status(200).json({
      success: true,
      data: inlineStock
    });
  } catch (error) {
    console.error('Error updating inline stock item:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update inline stock item'
    });
  }
};

// Get inline stock report data
exports.getInlineStockReport = async (req, res) => {
  try {
    // Get all inline stock items, both processed and unprocessed
    const inlineStockItems = await InlineStock.find()
      .populate('cutting_id', 'lot_no pattern')
      .populate('processOutputId')
      .sort({ date: -1 });
    
    // Transform data for the report
    const reportData = inlineStockItems.map(item => {
      // Extract color data
      const colorData = [];
      if (item.colors && item.colors.size > 0) {
        for (const [color, data] of item.colors.entries()) {
          colorData.push({
            color,
            quantity: data.quantity || 0,
            bundle: data.bundle || 0
          });
        }
      }
      
      // Get process output data if available
      let processData = null;
      if (item.processed && item.processOutputId) {
        const processOutput = item.processOutputId;
        processData = {
          completedAt: processOutput.completedAt,
          processItems: processOutput.processItems
        };
      }
      
      return {
        id: item._id,
        loadId: item.loadId,
        date: item.date,
        size: item.size,
        lotNo: item.lotNo || (item.cutting_id ? item.cutting_id.lot_no : 'Unknown'),
        pattern: item.pattern || (item.cutting_id ? item.cutting_id.pattern : 'Unknown'),
        colors: colorData,
        total: item.total,
        processed: item.processed,
        processedAt: item.processedAt,
        processData
      };
    });
    
    res.status(200).json({
      success: true,
      count: reportData.length,
      data: reportData
    });
  } catch (error) {
    console.error('Error generating inline stock report:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate inline stock report'
    });
  }
};
