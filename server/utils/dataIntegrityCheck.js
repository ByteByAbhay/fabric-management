const Cutting = require('../models/Cutting');
const InlineStock = require('../models/InlineStock');

/**
 * Utility function to check and fix missing lot numbers and patterns in inline stock
 * This can be run as a maintenance task or via an API endpoint
 */
/**
 * Fix inline stock relationships by establishing proper references to cutting records
 * This function finds inline stock items without a cutting_id reference and attempts to
 * find the appropriate cutting record to reference
 */
const fixInlineStockRelationships = async () => {
  try {
    console.log('Starting data integrity check for inline stock...');
    
    // Find all inline stock items without a cutting_id reference
    const incompleteItems = await InlineStock.find({
      $or: [
        { cutting_id: { $exists: false } },
        { cutting_id: null }
      ]
    });
    
    console.log(`Found ${incompleteItems.length} inline stock items without cutting references`);
    
    let fixedCount = 0;
    let unfixableCount = 0;
    const unfixableItems = [];
    
    for (const item of incompleteItems) {
      // Try to find a matching cutting record
      let matchingCutting = null;
      
      // First try to find by lot number and pattern if they exist
      if (item.lotNo && item.pattern) {
        matchingCutting = await Cutting.findOne({
          lot_no: item.lotNo,
          pattern: item.pattern
        });
        
        if (matchingCutting) {
          console.log(`Found matching cutting by lot number and pattern: ${matchingCutting._id}`);
        }
      }
      
      // If no match by lot/pattern, try by date and size
      if (!matchingCutting) {
        const startDate = new Date(item.date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(item.date);
        endDate.setHours(23, 59, 59, 999);
        
        const cuttings = await Cutting.find({
          datetime: {
            $gte: startDate,
            $lt: endDate
          },
          sizes: item.size
        });
        
        if (cuttings.length > 0) {
          matchingCutting = cuttings[0];
          console.log(`Found matching cutting by date and size: ${matchingCutting._id}`);
        }
      }
      
      if (matchingCutting) {
        // Establish the reference to the cutting record
        item.cutting_id = matchingCutting._id;
        
        try {
          // Save will trigger the pre-save hook to populate lotNo and pattern
          await item.save();
          fixedCount++;
          console.log(`Fixed item ${item._id}: Added reference to cutting ${matchingCutting._id}`);
        } catch (saveError) {
          console.error(`Error saving fixed item ${item._id}:`, saveError);
          unfixableCount++;
          unfixableItems.push({
            id: item._id,
            loadId: item.loadId,
            error: saveError.message
          });
        }
      } else {
        // No matching cutting found
        unfixableCount++;
        unfixableItems.push({
          id: item._id,
          loadId: item.loadId,
          error: 'No matching cutting record found'
        });
      }
    }
    
    console.log(`Fixed ${fixedCount} inline stock items by establishing proper references`);
    console.log(`Unable to fix ${unfixableCount} items`);
    
    return { 
      checked: incompleteItems.length, 
      fixed: fixedCount,
      unfixable: unfixableCount,
      unfixableItems
    };
  } catch (error) {
    console.error('Error fixing inline stock relationships:', error);
    throw error;
  }
};

module.exports = {
  fixInlineStockRelationships
};
