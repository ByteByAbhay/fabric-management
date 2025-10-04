const FabricStock = require('../models/FabricStock');

// Get all stock
exports.getAllStock = async (req, res) => {
  try {
    // Log the request for debugging
    console.log('GET /api/stock request received');
    
    // Get query parameters
    const { includeProcessed } = req.query;
    
    // By default, only include active (non-processed) stock
    let filter = {};
    if (includeProcessed !== 'true') {
      filter.processed = { $ne: true };
      console.log('Filtering out processed fabrics');
    } else {
      console.log('Including processed fabrics');
    }
    
    const stock = await FabricStock.find(filter)
      .sort({ fabric_name: 1, color: 1 })
      .populate('vendor', 'shop_name party_name contact_person');
    
    // Format the response to include color weights and vendor details
    const formattedStock = stock.map(item => ({
      _id: item._id,
      fabric_name: item.fabric_name,
      color: item.color,
      current_quantity: item.current_quantity,
      standard_weight: item.standard_weight || 0,
      last_updated: item.last_updated,
      vendor: item.vendor,
      vendor_name: item.vendor ? item.vendor.shop_name : 'Unknown',
      party_name: item.vendor ? item.vendor.party_name : 'N/A',
      contact_person: item.vendor ? item.vendor.contact_person : 'Unknown',
      processed: item.processed || false,
      processedAt: item.processedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));
    
    console.log(`Successfully retrieved ${formattedStock.length} stock items`);
    
    res.status(200).json({
      success: true,
      count: formattedStock.length,
      data: formattedStock
    });
  } catch (error) {
    console.error('Error fetching stock data:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch stock data'
    });
  }
};

// Get stock by fabric name
exports.getStockByFabric = async (req, res) => {
  try {
    const { fabricName } = req.params;
    
    // By default, only include active (non-processed) stock
    let filter = { fabric_name: fabricName, processed: { $ne: true } };
    
    const stock = await FabricStock.find(filter)
      .sort({ color: 1 })
      .populate('vendor', 'shop_name party_name contact_person');
    
    // Format the response to include color weights and vendor details
    const formattedStock = stock.map(item => ({
      _id: item._id,
      fabric_name: item.fabric_name,
      color: item.color,
      current_quantity: item.current_quantity,
      standard_weight: item.standard_weight || 0,
      last_updated: item.last_updated,
      vendor: item.vendor,
      vendor_name: item.vendor ? item.vendor.shop_name : 'Unknown',
      party_name: item.vendor ? item.vendor.party_name : 'N/A',
      contact_person: item.vendor ? item.vendor.contact_person : 'Unknown',
      processed: item.processed || false,
      processedAt: item.processedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      count: formattedStock.length,
      data: formattedStock
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get stock by color
exports.getStockByColor = async (req, res) => {
  try {
    const { color } = req.params;
    
    // By default, only include active (non-processed) stock
    let filter = { color, processed: { $ne: true } };
    
    const stock = await FabricStock.find(filter)
      .sort({ fabric_name: 1 })
      .populate('vendor', 'shop_name party_name contact_person');
    
    // Format the response to include color weights and vendor details
    const formattedStock = stock.map(item => ({
      _id: item._id,
      fabric_name: item.fabric_name,
      color: item.color,
      current_quantity: item.current_quantity,
      standard_weight: item.standard_weight || 0,
      last_updated: item.last_updated,
      vendor: item.vendor,
      vendor_name: item.vendor ? item.vendor.shop_name : 'Unknown',
      party_name: item.vendor ? item.vendor.party_name : 'N/A',
      contact_person: item.vendor ? item.vendor.contact_person : 'Unknown',
      processed: item.processed || false,
      processedAt: item.processedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      count: formattedStock.length,
      data: formattedStock
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Generate Stock Report
exports.generateStockReport = async (req, res) => {
  try {
    const { asOfDate, includeProcessed } = req.query;
    const reportDate = asOfDate ? new Date(asOfDate) : new Date();
    
    console.log('Generating stock report with params:', { asOfDate, includeProcessed });
    
    // Build query filter
    let filter = {};
    
    // By default, only include active (non-processed) stock
    // Only include processed stock if explicitly requested
    if (includeProcessed !== 'true') {
      filter.processed = { $ne: true };
    }
    
    console.log('Using filter:', filter);
    
    // Get all stock items with vendor information
    const stockItems = await FabricStock.find(filter)
      .sort({ fabric_name: 1, color: 1 })
      .populate('vendor', 'shop_name contact_person phone_number party_name');
    
    console.log(`Found ${stockItems.length} stock items`);
    
    // Transform stock items for the report - using only actual database fields
    const formattedStockItems = stockItems.map(item => ({
      fabricId: item._id,
      fabricType: item.fabric_name,
      colorName: item.color,
      currentStock: item.current_quantity || 0,
      lastUpdated: item.last_updated,
      processed: item.processed || false,
      vendorName: item.vendor ? item.vendor.shop_name : 'Unknown',
      vendorContact: item.vendor ? item.vendor.contact_person : 'Unknown',
      vendorPhone: item.vendor ? item.vendor.phone_number : 'Unknown',
      partyName: item.vendor ? item.vendor.party_name : 'N/A'
    }));
    
    // Generate type summary - using only actual data
    const typeSummary = [];
    const typeMap = new Map();
    
    formattedStockItems.forEach(item => {
      if (!typeMap.has(item.fabricType)) {
        typeMap.set(item.fabricType, {
          fabricType: item.fabricType,
          itemCount: 0,
          totalQuantity: 0,
          activeQuantity: 0 // Only non-processed stock
        });
      }
      
      const typeData = typeMap.get(item.fabricType);
      typeData.itemCount++;
      typeData.totalQuantity += item.currentStock;
      
      // Only count active (non-processed) stock in the active quantity
      if (!item.processed) {
        typeData.activeQuantity += item.currentStock;
      }
    });
    
    typeMap.forEach(type => {
      typeSummary.push({
        ...type,
        totalQuantity: parseFloat(type.totalQuantity.toFixed(2)),
        activeQuantity: parseFloat(type.activeQuantity.toFixed(2))
      });
    });
    
    // Generate vendor summary
    const vendorSummary = [];
    const vendorMap = new Map();
    
    formattedStockItems.forEach(item => {
      if (!vendorMap.has(item.vendorName)) {
        vendorMap.set(item.vendorName, {
          vendorName: item.vendorName,
          vendorContact: item.vendorContact,
          vendorPhone: item.vendorPhone,
          partyName: item.partyName,
          fabricCount: 0,
          totalStock: 0,
          activeStock: 0 // Only non-processed stock
        });
      }
      
      const vendorData = vendorMap.get(item.vendorName);
      vendorData.fabricCount++;
      vendorData.totalStock += item.currentStock;
      
      // Only count active (non-processed) stock in the active stock
      if (!item.processed) {
        vendorData.activeStock += item.currentStock;
      }
    });
    
    vendorMap.forEach(vendor => {
      vendorSummary.push({
        ...vendor,
        totalStock: parseFloat(vendor.totalStock.toFixed(2)),
        activeStock: parseFloat(vendor.activeStock.toFixed(2))
      });
    });
    
    // Calculate total active stock (excluding processed items)
    const totalActiveStock = parseFloat(
      formattedStockItems
        .filter(item => !item.processed)
        .reduce((sum, item) => sum + item.currentStock, 0)
        .toFixed(2)
    );
    
    // Calculate total stock (including processed items)
    const totalStock = parseFloat(
      formattedStockItems
        .reduce((sum, item) => sum + item.currentStock, 0)
        .toFixed(2)
    );
    
    console.log(`Total stock: ${totalStock}, Active stock: ${totalActiveStock}`);
    
    // Return the complete report with only the requested information
    res.status(200).json({
      reportDate: reportDate,
      stockItems: formattedStockItems,
      typeSummary,
      vendorSummary,
      totalStockItems: formattedStockItems.length,
      totalStock: totalStock,
      totalActiveStock: totalActiveStock
    });
    
  } catch (error) {
    console.error('Stock report generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate stock report'
    });
  }
};

// Mark stock as processed
exports.markStockAsProcessed = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Marking stock with ID ${id} as processed`);
    
    // Find and update the stock item
    const stockItem = await FabricStock.findByIdAndUpdate(
      id,
      { 
        processed: true, 
        processedAt: new Date() 
      },
      { new: true }
    );
    
    if (!stockItem) {
      return res.status(404).json({
        success: false,
        message: 'Stock item not found'
      });
    }
    
    console.log(`Successfully marked stock ${stockItem.fabric_name}/${stockItem.color} as processed`);
    
    res.status(200).json({
      success: true,
      data: stockItem,
      message: 'Stock marked as processed'
    });
  } catch (error) {
    console.error('Error marking stock as processed:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark stock as processed'
    });
  }
};
