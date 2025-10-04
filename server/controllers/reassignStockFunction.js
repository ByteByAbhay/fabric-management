const Vendor = require('../models/Vendor');
const FabricStock = require('../models/FabricStock');

// Add the reassignStock function to the vendorController.js file
exports.reassignStock = async (req, res) => {
  try {
    const { fromVendorId, toVendorId } = req.params;
    
    // Validate both vendor IDs
    if (!fromVendorId || !toVendorId) {
      return res.status(400).json({
        success: false,
        message: 'Both source and target vendor IDs are required'
      });
    }
    
    // Check if both vendors exist
    const fromVendor = await Vendor.findById(fromVendorId);
    const toVendor = await Vendor.findById(toVendorId);
    
    if (!fromVendor) {
      return res.status(404).json({
        success: false,
        message: 'Source vendor not found'
      });
    }
    
    if (!toVendor) {
      return res.status(404).json({
        success: false,
        message: 'Target vendor not found'
      });
    }
    
    // Find stock items associated with the fromVendor
    const stockItems = await FabricStock.find({ vendor: fromVendorId });
    
    if (stockItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No stock items found for the source vendor'
      });
    }
    
    // Update vendor reference for all stock items
    const updateResult = await FabricStock.updateMany(
      { vendor: fromVendorId },
      { $set: { vendor: toVendorId } }
    );
    
    res.status(200).json({
      success: true,
      message: `Successfully reassigned ${updateResult.modifiedCount} stock items from vendor ${fromVendor.shop_name} to ${toVendor.shop_name}`,
      modifiedCount: updateResult.modifiedCount
    });
  } catch (error) {
    console.error('Error reassigning stock:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to reassign stock items'
    });
  }
};
