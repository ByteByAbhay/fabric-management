const Delivery = require('../models/Delivery');
const ProcessOutput = require('../models/ProcessOutput');

// Create a new delivery
exports.createDelivery = async (req, res) => {
  try {
    const { deliveryNumber, customerName, deliveryDate, items, remarks, createdBy } = req.body;

    // Validate required fields
    if (!deliveryNumber || !customerName || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields. Delivery number, customer name, and items are required.'
      });
    }

    // Check if delivery number already exists
    const existingDelivery = await Delivery.findOne({ deliveryNumber });
    if (existingDelivery) {
      return res.status(400).json({
        success: false,
        message: 'Delivery number already exists.'
      });
    }

    // Validate items and check if process outputs exist
    for (const item of items) {
      if (!item.lotNo || !item.pattern || !item.size || !item.color || !item.quantity) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have lot number, pattern, size, color, and quantity.'
        });
      }

      // If processOutputId is provided, verify it exists
      if (item.processOutputId) {
        const processOutput = await ProcessOutput.findById(item.processOutputId);
        if (!processOutput) {
          return res.status(404).json({
            success: false,
            message: `Process output with ID ${item.processOutputId} not found.`
          });
        }
      }
    }

    // Create the delivery
    const delivery = new Delivery({
      deliveryNumber,
      customerName,
      deliveryDate: deliveryDate || new Date(),
      items,
      remarks,
      createdBy
    });

    await delivery.save();

    res.status(201).json({
      success: true,
      data: delivery,
      message: 'Delivery created successfully.'
    });
  } catch (error) {
    console.error('Error creating delivery:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create delivery.'
    });
  }
};

// Get all deliveries with pagination and filtering
exports.getAllDeliveries = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, customerName, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    // Build query filter
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (customerName) {
      filter.customerName = { $regex: customerName, $options: 'i' };
    }
    
    if (startDate || endDate) {
      filter.deliveryDate = {};
      if (startDate) filter.deliveryDate.$gte = new Date(startDate);
      if (endDate) filter.deliveryDate.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    // Get deliveries with pagination
    const deliveries = await Delivery.find(filter)
      .sort({ deliveryDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Delivery.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: deliveries.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: deliveries
    });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch deliveries.'
    });
  }
};

// Get a single delivery by ID
exports.getDeliveryById = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: delivery
    });
  } catch (error) {
    console.error('Error fetching delivery:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch delivery.'
    });
  }
};

// Update delivery status
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['pending', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Status must be pending, delivered, or cancelled.'
      });
    }

    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: delivery,
      message: 'Delivery status updated successfully.'
    });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update delivery status.'
    });
  }
};

// Update delivery details
exports.updateDelivery = async (req, res) => {
  try {
    const { customerName, deliveryDate, items, remarks } = req.body;
    
    // Validate items if provided
    if (items && items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array cannot be empty.'
      });
    }

    // Build update object
    const updateData = {};
    if (customerName) updateData.customerName = customerName;
    if (deliveryDate) updateData.deliveryDate = deliveryDate;
    if (items) updateData.items = items;
    if (remarks !== undefined) updateData.remarks = remarks;

    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: delivery,
      message: 'Delivery updated successfully.'
    });
  } catch (error) {
    console.error('Error updating delivery:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update delivery.'
    });
  }
};

// Delete a delivery
exports.deleteDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findByIdAndDelete(req.params.id);
    
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Delivery deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting delivery:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete delivery.'
    });
  }
};

// Generate delivery report
exports.generateDeliveryReport = async (req, res) => {
  try {
    const { startDate, endDate, customerName, status } = req.query;
    
    // Build query filter
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (customerName) {
      filter.customerName = { $regex: customerName, $options: 'i' };
    }
    
    if (startDate || endDate) {
      filter.deliveryDate = {};
      if (startDate) filter.deliveryDate.$gte = new Date(startDate);
      if (endDate) filter.deliveryDate.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    // Get deliveries for report
    const deliveries = await Delivery.find(filter).sort({ deliveryDate: -1 });

    // Generate report data
    const reportData = {
      summary: {
        totalDeliveries: deliveries.length,
        totalQuantity: deliveries.reduce((sum, delivery) => sum + delivery.totalQuantity, 0),
        statusCounts: {
          pending: deliveries.filter(d => d.status === 'pending').length,
          delivered: deliveries.filter(d => d.status === 'delivered').length,
          cancelled: deliveries.filter(d => d.status === 'cancelled').length
        }
      },
      deliveries: deliveries.map(delivery => ({
        id: delivery._id,
        deliveryNumber: delivery.deliveryNumber,
        customerName: delivery.customerName,
        deliveryDate: delivery.deliveryDate,
        status: delivery.status,
        totalQuantity: delivery.totalQuantity,
        itemCount: delivery.items.length,
        createdAt: delivery.createdAt
      }))
    };

    res.status(200).json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Error generating delivery report:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate delivery report.'
    });
  }
};
