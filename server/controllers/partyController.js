const Party = require('../models/Party');
const FabricStock = require('../models/FabricStock');

// Create new party entry
exports.createParty = async (req, res) => {
  try {
    // Validate that we have at least one fabric detail
    if (!req.body.fabricDetails || req.body.fabricDetails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one fabric detail is required'
      });
    }

    // Validate that each fabric has at least one color
    for (const fabric of req.body.fabricDetails) {
      if (!fabric.fabricColors || fabric.fabricColors.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Fabric '${fabric.name}' must have at least one color`
        });
      }
    }

    // Create the party
    const party = new Party(req.body);
    await party.save();

    // Update stock for each fabric and color
    if (party.fabricDetails && party.fabricDetails.length > 0) {
      for (const fabric of party.fabricDetails) {
        if (fabric.fabricColors && fabric.fabricColors.length > 0) {
          for (const colorInfo of fabric.fabricColors) {
            // Check if stock exists for this fabric and color
            let stock = await FabricStock.findOne({
              fabric_name: fabric.name,
              color: colorInfo.color_name
            });

            if (stock) {
              // Update existing stock
              stock.current_quantity += colorInfo.color_weight;
              stock.last_updated = new Date();
              
              // Only update standard_weight if it's not already set
              if (!stock.standard_weight || stock.standard_weight === 0) {
                stock.standard_weight = colorInfo.color_weight;
              }
              
              // Update color_hex if available
              if (colorInfo.color_hex && !stock.color_hex) {
                stock.color_hex = colorInfo.color_hex;
              }
              
              await stock.save();
            } else {
              // Create new stock entry
              stock = new FabricStock({
                fabric_name: fabric.name,
                color: colorInfo.color_name,
                color_hex: colorInfo.color_hex || '#3498db', // Use provided hex or default to blue
                current_quantity: colorInfo.color_weight,
                standard_weight: colorInfo.color_weight, // Store the standard weight for this color
                vendor: party._id
              });
              await stock.save();
            }
          }
        }
      }
    }

    res.status(201).json({ 
      success: true, 
      data: party,
      message: 'Party created successfully'
    });
  } catch (error) {
    console.error('Error creating party:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to create party'
    });
  }
};

// Get all parties
exports.getParties = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    
    // Create search query if search parameter exists
    const searchQuery = search ? {
      $or: [
        { shop_name: { $regex: search, $options: 'i' } },
        { party_name: { $regex: search, $options: 'i' } },
        { bill_no: { $regex: search, $options: 'i' } }
      ]
    } : {};
    
    const parties = await Party.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Party.countDocuments(searchQuery);
    
    // Calculate total fabric weight for each party
    const partiesWithTotals = parties.map(party => {
      const partyObj = party.toObject();
      partyObj.totalFabricWeight = party.totalWeight; // Using the virtual field
      return partyObj;
    });
    
    res.status(200).json({
      success: true,
      count: parties.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: partiesWithTotals
    });
  } catch (error) {
    console.error('Error fetching parties:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to fetch parties'
    });
  }
};

// Get single party
exports.getParty = async (req, res) => {
  try {
    const party = await Party.findById(req.params.id);
    
    if (!party) {
      return res.status(404).json({ 
        success: false, 
        message: 'Party not found' 
      });
    }
    
    // Get related fabric stock information
    const fabricStock = await FabricStock.find({ vendor: party._id });
    
    res.status(200).json({ 
      success: true, 
      data: party,
      fabricStock: fabricStock
    });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to fetch vendor details'
    });
  }
};

// Update party (legacy method)
exports.updateParty = async (req, res) => {
  try {
    // Validate that we have at least one fabric detail
    if (req.body.fabricDetails && req.body.fabricDetails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one fabric detail is required'
      });
    }

    // Get the current party to compare changes
    const currentParty = await Party.findById(req.params.id);
    if (!currentParty) {
      return res.status(404).json({ 
        success: false, 
        message: 'Party not found' 
      });
    }
    
    // Update the vendor
    const party = await Party.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { 
        new: true, 
        runValidators: true 
      }
    );
    
    // Update fabric stock if fabric details have changed
    if (req.body.fabricDetails) {
      // First, handle any new fabrics or colors
      for (const fabric of party.fabricDetails) {
        if (fabric.fabricColors && fabric.fabricColors.length > 0) {
          for (const colorInfo of fabric.fabricColors) {
            // Check if stock exists for this fabric and color
            let stock = await FabricStock.findOne({
              fabric_name: fabric.name,
              color: colorInfo.color_name
            });

            if (stock) {
              // Update existing stock if needed
              let stockUpdated = false;
              
              // Always update standard_weight if provided
              if (colorInfo.color_weight && colorInfo.color_weight > 0) {
                stock.standard_weight = colorInfo.color_weight;
                stockUpdated = true;
              }
              
              // Always update color_hex if provided
              if (colorInfo.color_hex) {
                stock.color_hex = colorInfo.color_hex;
                stockUpdated = true;
              }
              
              // Set last_updated timestamp
              stock.last_updated = new Date();
              
              if (stockUpdated) {
                console.log(`Updating stock for ${fabric.name} - ${colorInfo.color_name} with color_hex: ${colorInfo.color_hex}`);
                await stock.save();
              }
            } else {
              // Create new stock entry for new colors
              stock = new FabricStock({
                fabric_name: fabric.name,
                color: colorInfo.color_name,
                color_hex: colorInfo.color_hex || '#3498db', // Include color_hex with default
                current_quantity: colorInfo.color_weight,
                standard_weight: colorInfo.color_weight,
                vendor: party._id
              });
              await stock.save();
            }
          }
        }
      }
    }
    
    res.status(200).json({ 
      success: true, 
      data: party,
      message: 'Party updated successfully'
    });
  } catch (error) {
    console.error('Error updating party:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to update party'
    });
  }
};

// Enhanced edit vendor function with improved error handling and validation
exports.editParty = async (req, res) => {
  try {
    console.log('Edit party request received:', req.params.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Validate party ID
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Party ID is required'
      });
    }
    
    // Validate that we have at least one fabric detail
    if (!req.body.fabricDetails || req.body.fabricDetails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one fabric detail is required'
      });
    }

    // Get the current party
    const currentParty = await Party.findById(req.params.id);
    if (!currentParty) {
      return res.status(404).json({ 
        success: false, 
        message: 'Party not found' 
      });
    }
    
    // Prepare update data with proper validation
    const updateData = {
      shop_name: req.body.shop_name,
      party_name: req.body.party_name,
      bill_no: req.body.bill_no,
      contact_number: req.body.contact_number || '',
      address: req.body.address || '',
      gstin: req.body.gstin || '',
      date_time: req.body.date_time || new Date(),
      payment_status: req.body.payment_status || 'Pending',
      payment_amount: req.body.payment_amount || '',
      fabricDetails: []
    };
    
    // Process fabric details with validation
    if (req.body.fabricDetails && Array.isArray(req.body.fabricDetails)) {
      updateData.fabricDetails = req.body.fabricDetails.map(fabric => {
        // Validate each fabric
        if (!fabric.name || !fabric.type) {
          throw new Error(`Fabric details missing required fields: name and type`);
        }
        
        // Process colors with validation
        const fabricColors = [];
        let totalColorWeight = 0;
        
        if (fabric.fabricColors && Array.isArray(fabric.fabricColors)) {
          for (const color of fabric.fabricColors) {
            if (!color.color_name || !color.color_weight) {
              throw new Error(`Color details missing required fields: color_name and color_weight`);
            }
            
            const colorWeight = parseFloat(color.color_weight) || 0;
            totalColorWeight += colorWeight;
            
            fabricColors.push({
              color_name: color.color_name,
              color_hex: color.color_hex || '#3498db', // Ensure color_hex is never empty
              color_weight: colorWeight
            });
          }
        }
        
        // Calculate the total weight from all colors
        console.log(`Calculated total weight for ${fabric.name}: ${totalColorWeight}`);
        
        return {
          name: fabric.name,
          type: fabric.type,
          weight_type: fabric.weight_type || 'kg',
          total_weight: totalColorWeight, // Set the calculated total weight
          remarks: fabric.remarks || '',
          fabricColors: fabricColors
        };
      });
    }
    
    console.log('Processed update data:', JSON.stringify(updateData, null, 2));
    
    // Update the party with validated data
    const updatedParty = await Party.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true,        // Return the updated document
        runValidators: true // Run schema validators
      }
    );
    
    if (!updatedParty) {
      return res.status(404).json({
        success: false,
        message: 'Party not found after update attempt'
      });
    }
    
    // Update fabric stock for each fabric and color
    for (const fabric of updatedVendor.fabricDetails) {
      if (fabric.fabricColors && fabric.fabricColors.length > 0) {
        for (const colorInfo of fabric.fabricColors) {
          try {
            // Check if stock exists for this fabric and color
            let stock = await FabricStock.findOne({
              fabric_name: fabric.name,
              color: colorInfo.color_name
            });

            if (stock) {
              // Update existing stock
              stock.color_hex = colorInfo.color_hex || stock.color_hex;
              stock.standard_weight = colorInfo.color_weight || stock.standard_weight;
              stock.last_updated = new Date();
              
              console.log(`Updating existing stock for ${fabric.name} - ${colorInfo.color_name}:`, {
                color_hex: stock.color_hex,
                standard_weight: stock.standard_weight
              });
              
              await stock.save();
            } else {
              // Create new stock entry
              stock = new FabricStock({
                fabric_name: fabric.name,
                color: colorInfo.color_name,
                color_hex: colorInfo.color_hex || '#3498db',
                current_quantity: colorInfo.color_weight || 0,
                standard_weight: colorInfo.color_weight || 0,
                vendor: updatedVendor._id,
                last_updated: new Date()
              });
              
              console.log(`Creating new stock for ${fabric.name} - ${colorInfo.color_name}:`, {
                color_hex: stock.color_hex,
                standard_weight: stock.standard_weight
              });
              
              await stock.save();
            }
          } catch (stockError) {
            console.error(`Error updating stock for ${fabric.name} - ${colorInfo.color_name}:`, stockError);
            // Continue with other colors even if one fails
          }
        }
      }
    }
    
    // Return success response
    res.status(200).json({ 
      success: true, 
      data: updatedParty,
      message: 'Party updated successfully'
    });
  } catch (error) {
    console.error('Error in editParty:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to update party',
      error: error.stack
    });
  }
};

// Delete party
exports.deleteParty = async (req, res) => {
  try {
    const party = await Party.findById(req.params.id);
    
    if (!party) {
      return res.status(404).json({ 
        success: false, 
        message: 'Party not found' 
      });
    }
    
    // Check if this party has associated fabric stock
    const stockCount = await FabricStock.countDocuments({ vendor: party._id });
    
    if (stockCount > 0) {
      // If force delete is specified, remove the vendor reference from stock items
      if (req.query.forceDelete === 'true') {
        console.log(`Removing party reference from ${stockCount} stock items for party ${party._id}`);
        await FabricStock.updateMany(
          { vendor: party._id }, 
          { $unset: { vendor: "" } }
        );
        
        // Now delete the party
        await Party.findByIdAndDelete(req.params.id);
        
        return res.status(200).json({ 
          success: true, 
          message: `Party deleted and ${stockCount} stock items updated to remove party reference`
        });
      } else {
        // If not force delete, prevent deletion
        return res.status(400).json({
          success: false,
          message: 'Cannot delete party with associated fabric stock. Please remove or reassign the stock first.',
          hasAssociatedStock: true,
          stockCount: stockCount
        });
      }
    }
    
    // If no associated stock, delete the party
    await Party.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ 
      success: true, 
      message: 'Party deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting party:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to delete party'
    });
  }
};

// Get fabric colors
exports.getPartyFabricColors = async (req, res) => {
  try {
    // Get all unique fabric colors from the FabricStock collection
    const fabricColors = await FabricStock.aggregate([
      { $group: {
        _id: { fabric: "$fabric_name", color: "$color" },
        standard_weight: { $first: "$standard_weight" },
        color_hex: { $first: "$color_hex" }
      }},
      { $sort: { "_id.fabric": 1, "_id.color": 1 }}
    ]);
    
    // Transform the result into a more usable format
    const result = fabricColors.map(item => ({
      fabric_name: item._id.fabric,
      color_name: item._id.color,
      standard_weight: item.standard_weight || 0,
      color_hex: item.color_hex || '#000000'
    }));
    
    // Group by fabric name for easier frontend use
    const fabricMap = {};
    result.forEach(item => {
      if (!fabricMap[item.fabric_name]) {
        fabricMap[item.fabric_name] = [];
      }
      fabricMap[item.fabric_name].push({
        color_name: item.color_name,
        standard_weight: item.standard_weight,
        color_hex: item.color_hex
      });
    });
    
    res.status(200).json({
      success: true,
      data: fabricMap
    });
  } catch (error) {
    console.error('Error fetching fabric colors:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch fabric colors'
    });
  }
};

// Get fabric types
exports.getPartyFabricTypes = async (req, res) => {
  try {
    // Get all unique fabric types from the Party collection
    const fabricTypes = await Party.aggregate([
      { $unwind: "$fabricDetails" },
      { $group: {
        _id: { name: "$fabricDetails.name", type: "$fabricDetails.type" }
      }},
      { $sort: { "_id.name": 1, "_id.type": 1 }}
    ]);
    
    // Transform the result into a more usable format
    const result = fabricTypes.map(item => ({
      name: item._id.name,
      type: item._id.type
    }));
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching fabric types:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch fabric types'
    });
  }
};

// The following function is no longer needed as we've removed the reports functionality
/*
exports.generateVendorPerformanceReport = async (req, res) => {
  try {
    // Parse date range from query parameters
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1)); // Default to first day of current month
    const end = endDate ? new Date(endDate) : new Date(); // Default to today
    
    // Set end of day for end date
    end.setHours(23, 59, 59, 999);
    
    // Get all parties with procurements within the date range
    const parties = await Party.find({
      'date_time': { $gte: start, $lte: end }
    }).sort({ date_time: -1 });
    
    if (!vendors || vendors.length === 0) {
      return res.status(200).json({
        noDataAvailable: true,
        message: 'No vendor data available for the selected period'
      });
    }
    
    // Calculate vendor metrics
    const vendorDetails = [];
    const ratingDistribution = [
      { rating: '5 Stars', value: 0 },
      { rating: '4 Stars', value: 0 },
      { rating: '3 Stars', value: 0 },
      { rating: '2 Stars', value: 0 },
      { rating: '1 Star', value: 0 }
    ];
    
    const vendorProcurements = [];
    const topFabricsByVendor = [];
    let totalRating = 0;
    let ratedVendorsCount = 0;
    
    // Create a map to aggregate fabric types across vendors
    const fabricTypeMap = new Map();
    
    vendors.forEach(vendor => {
      // Calculate total fabric quantity for this vendor
      let totalQuantity = 0;
      const fabricTypes = new Map();
      
      if (party.fabricDetails && party.fabricDetails.length > 0) {
        party.fabricDetails.forEach(fabric => {
          totalQuantity += fabric.total_weight || 0;
          
          // Track fabric types for this party
          if (!fabricTypes.has(fabric.type)) {
            fabricTypes.set(fabric.type, 0);
          }
          fabricTypes.set(fabric.type, fabricTypes.get(fabric.type) + fabric.total_weight);
          
          // Aggregate across all vendors for top fabrics
          if (!fabricTypeMap.has(fabric.type)) {
            fabricTypeMap.set(fabric.type, 0);
          }
          fabricTypeMap.set(fabric.type, fabricTypeMap.get(fabric.type) + fabric.total_weight);
        });
      }
      
      // Add to rating distribution if rating exists
      const rating = vendor.rating || 0;
      if (rating > 0) {
        ratingDistribution[5 - Math.floor(rating)].value++;
        totalRating += rating;
        ratedVendorsCount++;
      }
      
      // Add to vendor details
      vendorDetails.push({
        vendorName: vendor.contact_person || 'Unknown',
        shopName: vendor.shop_name || 'Unknown',
        rating: rating,
        procurementCount: 1, // Each vendor document represents one procurement
        totalQuantity: totalQuantity,
        onTimeDelivery: Math.round(Math.random() * 30) + 70, // Sample data - would be calculated from actual delivery data
        qualityScore: Math.round((rating / 5) * 10 * 10) / 10 // Convert rating to 0-10 scale
      });
      
      // Add to vendor procurements chart data
      vendorProcurements.push({
        vendorName: vendor.shop_name,
        quantity: totalQuantity
      });
      
      // Add top fabric type for this vendor to the list
      let topFabricType = '';
      let topFabricQuantity = 0;
      
      fabricTypes.forEach((quantity, fabricType) => {
        if (quantity > topFabricQuantity) {
          topFabricType = fabricType;
          topFabricQuantity = quantity;
        }
      });
      
      if (topFabricType) {
        topFabricsByVendor.push({
          fabricType: topFabricType,
          quantity: topFabricQuantity,
          vendorName: vendor.shop_name
        });
      }
    });
    
    // Sort and limit vendor procurements and top fabrics for cleaner charts
    vendorProcurements.sort((a, b) => b.quantity - a.quantity);
    if (vendorProcurements.length > 10) {
      vendorProcurements.length = 10; // Limit to top 10
    }
    
    topFabricsByVendor.sort((a, b) => b.quantity - a.quantity);
    if (topFabricsByVendor.length > 8) {
      topFabricsByVendor.length = 8; // Limit to top 8
    }
    
    // Convert fabric type map to array for top fabrics overall
    const topFabrics = [];
    fabricTypeMap.forEach((quantity, fabricType) => {
      topFabrics.push({ fabricType, quantity });
    });
    topFabrics.sort((a, b) => b.quantity - a.quantity);
    if (topFabrics.length > 8) {
      topFabrics.length = 8; // Limit to top 8
    }
    
    // Aggregate vendor details to merge duplicate vendors
    const vendorMap = new Map();
    vendorDetails.forEach(detail => {
      const key = `${detail.vendorName}-${detail.shopName}`;
      if (!vendorMap.has(key)) {
        vendorMap.set(key, { ...detail });
      } else {
        const existing = vendorMap.get(key);
        existing.procurementCount += detail.procurementCount;
        existing.totalQuantity += detail.totalQuantity;
        // Keep the existing rating, delivery and quality scores
      }
    });
    
    const aggregatedVendorDetails = Array.from(vendorMap.values());
    aggregatedVendorDetails.sort((a, b) => b.totalQuantity - a.totalQuantity);
    
    // Calculate average rating
    const averageRating = ratedVendorsCount > 0 ? (totalRating / ratedVendorsCount) : 0;
    
    res.status(200).json({
      reportPeriod: {
        startDate: start,
        endDate: end
      },
      activeVendors: aggregatedVendorDetails.length,
      totalProcurements: vendors.length,
      averageRating: averageRating,
      vendorDetails: aggregatedVendorDetails,
      vendorProcurements,
      ratingDistribution,
      topFabricsByVendor,
      topFabrics
    });
    
  } catch (error) {
    console.error('Error generating vendor performance report:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating vendor performance report'
    });
  }
}; 
*/