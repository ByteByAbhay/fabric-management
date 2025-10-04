const Cutting = require('../models/Cutting');
const FabricStock = require('../models/FabricStock');

// Create new before-cutting entry
exports.createBeforeCutting = async (req, res) => {
  try {
    console.log('Creating new cutting entry with data:', req.body);
    
    // Extract roles from request body
    const { roles, pattern, fabric } = req.body;
    
    // Log the fabric and pattern for debugging
    console.log(`Fabric: ${fabric}, Pattern: ${pattern}`);
    
    // Determine which field to use for stock lookup
    // In your database, fabric_name seems to be storing the vendor name (Mitchell Peter)
    // while the pattern field has the actual fabric type (Vilas)
    const stockLookupField = fabric ? 'fabric_name' : 'pattern';
    
    // Validate roles data
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Roles data is required and must be a non-empty array'
      });
    }
    
    // Check if we have enough fabric stock for each role
    for (const role of roles) {
      const { role_color, role_weight } = role;
      
      // Find the fabric stock for this pattern and color
      // Use the fabric field (vendor name) instead of pattern for lookup
      const fabricStock = await FabricStock.findOne({ 
        fabric_name: fabric, 
        color: role_color 
      });
      
      console.log(`Looking for stock with fabric_name: ${fabric}, color: ${role_color}`);
      console.log('Found stock:', fabricStock ? 'Yes' : 'No');
      
      if (!fabricStock) {
        return res.status(400).json({
          success: false,
          message: `No fabric stock found for vendor ${fabric} and color ${role_color}`
        });
      }
      
      // Check if we have enough stock
      if (fabricStock.current_quantity < role_weight) {
        return res.status(400).json({
          success: false,
          message: `Insufficient fabric stock for ${pattern} in color ${role_color}. Available: ${fabricStock.current_quantity}, Required: ${role_weight}`
        });
      }
    }
    
    // Create the cutting record
    const cutting = new Cutting(req.body);
    cutting.before_cutting_complete = true;
    await cutting.save();
    
    // Reserve fabric stock by reducing the available quantity
    for (const role of roles) {
      const { role_color, role_weight } = role;
      
      console.log(`Reserving ${role_weight} units of ${pattern} in color ${role_color}`);
      
      // Find the fabric stock - use fabric (vendor name) for lookup AND _id to ensure we're updating the exact record
      const fabricStock = await FabricStock.findOne({ 
        fabric_name: fabric, 
        color: role_color 
      });
      
      if (!fabricStock) {
        console.error(`No fabric stock found for ${fabric}/${role_color}`);
        continue;
      }
      
      // Check if this will consume all the stock
      const remainingStock = fabricStock.current_quantity - role_weight;
      const willBeFullyProcessed = remainingStock <= 0;
      
      console.log(`Updating stock for ${fabric}/${role_color} (ID: ${fabricStock._id}): Current: ${fabricStock.current_quantity}, Using: ${role_weight}, Remaining: ${remainingStock}`);
      
      // Update fabric stock by reducing the available quantity
      // Use the _id to ensure we're only updating this specific record
      const updatedStock = await FabricStock.findOneAndUpdate(
        { _id: fabricStock._id },  // Use _id for precise targeting
        { 
          $inc: { current_quantity: -role_weight },
          last_updated: new Date(),
          // Mark as processed if all stock is used
          ...(willBeFullyProcessed ? { 
            processed: true, 
            processedAt: new Date() 
          } : {})
        },
        { new: true }
      );
      
      console.log(`Updated stock for ${fabric}/${role_color}: ${updatedStock.current_quantity}`);
      if (willBeFullyProcessed) {
        console.log(`Stock for ${fabric}/${role_color} is now fully processed`);
      }
    }
    
    res.status(201).json({
      success: true,
      data: cutting,
      message: 'Cutting process started and fabric stock reserved'
    });
  } catch (error) {
    console.error('Error creating cutting entry:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    
    // Send a more detailed error message to the client
    res.status(400).json({
      success: false,
      message: `Error creating cutting entry: ${error.message}`,
      details: error.stack
    });
  }
};

// Update with after-cutting data
exports.updateAfterCutting = async (req, res) => {
  try {
    console.log('Updating cutting with after-cutting data:', req.body);
    const { roles } = req.body;
    
    // Find the cutting record
    const cutting = await Cutting.findById(req.params.id);
    
    if (!cutting) {
      return res.status(404).json({
        success: false,
        message: 'Cutting record not found'
      });
    }
    
    // Log cutting details for debugging
    console.log('Found cutting record:', {
      id: cutting._id,
      pattern: cutting.pattern,
      fabric: cutting.fabric,
      roles: cutting.roles.map(r => ({ color: r.role_color, weight: r.role_weight }))
    });
    
    // Check if cutting is already completed
    if (cutting.after_cutting_complete) {
      return res.status(400).json({
        success: false,
        message: 'This cutting process has already been completed'
      });
    }
    
    // Update roles with layers_cut and pieces_cut data
    if (roles && roles.length > 0) {
      for (const updatedRole of roles) {
        const roleIndex = cutting.roles.findIndex(r => 
          r._id.toString() === updatedRole._id.toString()
        );
        
        if (roleIndex !== -1) {
          // Calculate the difference between planned and actual usage
          const plannedWeight = cutting.roles[roleIndex].role_weight;
          const actualLayersCut = updatedRole.layers_cut || 0;
          
          // Update the role data
          cutting.roles[roleIndex].layers_cut = actualLayersCut;
          cutting.roles[roleIndex].pieces_cut = updatedRole.pieces_cut || 0;
          
          console.log(`Role ${cutting.roles[roleIndex].role_no}: Planned weight ${plannedWeight}, Actual layers cut ${actualLayersCut}`);
          
          // If there's a difference between planned and actual usage, adjust the fabric stock
          // Note: We already reduced the stock by role_weight in createBeforeCutting
          // We don't need to reduce it again based on layers_cut
          
          // If we need to return some fabric to stock (if actual usage was less than planned)
          if (actualLayersCut < plannedWeight) {
            const returnAmount = plannedWeight - actualLayersCut;
            
            console.log(`Returning ${returnAmount} units of ${cutting.fabric}/${cutting.roles[roleIndex].role_color} to stock`);
            
            // Find the exact fabric stock record by fabric name and color
            const fabricStockToReturn = await FabricStock.findOne({
              fabric_name: cutting.fabric,
              color: cutting.roles[roleIndex].role_color
            });
            
            if (!fabricStockToReturn) {
              console.log(`No fabric stock found for ${cutting.fabric}/${cutting.roles[roleIndex].role_color} to return unused fabric`);
              // Create a new stock record if it doesn't exist
              const newStock = new FabricStock({
                fabric_name: cutting.fabric,
                color: cutting.roles[roleIndex].role_color,
                current_quantity: returnAmount,
                last_updated: new Date()
              });
              await newStock.save();
              console.log(`Created new stock for ${cutting.fabric}/${cutting.roles[roleIndex].role_color} with ${returnAmount} units`);
            } else {
              // Return the unused fabric to stock - use _id for precise targeting
              console.log(`Returning ${returnAmount} units to stock ID: ${fabricStockToReturn._id}`);
              await FabricStock.findOneAndUpdate(
                { _id: fabricStockToReturn._id },  // Use _id for precise targeting
                { 
                  $inc: { current_quantity: returnAmount }, 
                  last_updated: new Date(),
                  // If it was previously marked as processed, unmark it
                  processed: false,
                  processedAt: null
                },
                { new: true }
              );
            }
          }
          // If actual usage was more than planned, reduce additional stock
          else if (actualLayersCut > plannedWeight) {
            const additionalUsage = actualLayersCut - plannedWeight;
            
            console.log(`Using additional ${additionalUsage} units of ${cutting.fabric}/${cutting.roles[roleIndex].role_color}`);
            
            try {
              // Check if we have enough additional stock - use fabric (vendor name) for lookup
              console.log(`Looking for fabric stock with name: ${cutting.fabric}, color: ${cutting.roles[roleIndex].role_color}`);
              
              const fabricStock = await FabricStock.findOne({
                fabric_name: cutting.fabric,
                color: cutting.roles[roleIndex].role_color
              });
              
              // If no stock is found or insufficient stock, we'll still allow the cutting to complete
              // This handles the case where stock was already fully reserved during the initial cutting process
              if (!fabricStock || fabricStock.current_quantity < additionalUsage) {
                console.log(`Warning: Insufficient stock for additional usage of ${cutting.fabric} in color ${cutting.roles[roleIndex].role_color}`);
                console.log(`Available: ${fabricStock ? fabricStock.current_quantity : 0}, Needed: ${additionalUsage}`);
                console.log(`Allowing cutting completion anyway since stock was already reserved in the initial cutting process`);
                
                // If we have some stock, use what we have
                if (fabricStock && fabricStock.current_quantity > 0) {
                  console.log(`Using remaining ${fabricStock.current_quantity} units from stock ID: ${fabricStock._id}`);
                  
                  // Use whatever stock is left
                  await FabricStock.findOneAndUpdate(
                    { _id: fabricStock._id },
                    { 
                      current_quantity: 0,
                      last_updated: new Date(),
                      processed: true,
                      processedAt: new Date()
                    },
                    { new: true }
                  );
                  
                  console.log(`Stock for ${cutting.fabric}/${cutting.roles[roleIndex].role_color} is now fully processed`);
                }
              } else {
                // We have enough stock, proceed normally
                console.log(`Found fabric stock: ${fabricStock.fabric_name}/${fabricStock.color}, quantity: ${fabricStock.current_quantity}`);
                
                // Check if this will consume all the remaining stock
                const remainingStock = fabricStock.current_quantity - additionalUsage;
                const willBeFullyProcessed = remainingStock <= 0;
                
                // Reduce the additional fabric from stock - use _id for precise targeting
                console.log(`Reducing ${additionalUsage} units from stock ID: ${fabricStock._id}`);
                await FabricStock.findOneAndUpdate(
                  { _id: fabricStock._id },  // Use _id for precise targeting
                  { 
                    $inc: { current_quantity: -additionalUsage }, 
                    last_updated: new Date(),
                    // Mark as processed if all stock is used
                    ...(willBeFullyProcessed ? { 
                      processed: true, 
                      processedAt: new Date() 
                    } : {})
                  },
                  { new: true }
                );
                
                if (willBeFullyProcessed) {
                  console.log(`Stock for ${cutting.fabric}/${cutting.roles[roleIndex].role_color} is now fully processed`);
                }
              }
            } catch (stockError) {
              console.error('Error checking fabric stock:', stockError);
              // Log the error but don't prevent the cutting from being completed
              console.log(`Allowing cutting completion despite stock error: ${stockError.message}`);
            }
          }
        }
      }
    }
    
    cutting.after_cutting_complete = true;
    await cutting.save();
    
    res.status(200).json({
      success: true,
      data: cutting,
      message: 'Cutting process completed and fabric stock updated'
    });
  } catch (error) {
    console.error('Error updating cutting data:', error);
    
    // Provide more detailed error message
    let errorMessage = 'Failed to update cutting data. ';
    
    if (error.name === 'CastError') {
      errorMessage += 'Invalid ID format.';
    } else if (error.name === 'ValidationError') {
      errorMessage += 'Validation failed: ' + Object.values(error.errors).map(e => e.message).join(', ');
    } else if (error.code === 11000) {
      errorMessage += 'Duplicate key error.';
    } else {
      errorMessage += error.message || 'Please try again.';
    }
    
    res.status(400).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get all cutting records
exports.getAllCutting = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const cuttings = await Cutting.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Cutting.countDocuments();
    
    res.status(200).json({
      success: true,
      count: cuttings.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: cuttings
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get single cutting record
exports.getCutting = async (req, res) => {
  try {
    const cutting = await Cutting.findById(req.params.id);
    
    if (!cutting) {
      return res.status(404).json({
        success: false,
        message: 'Cutting record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: cutting
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Generate a cutting report based on date range
exports.generateCuttingReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1)); // First day of current month
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get all cuttings within date range
    const cuttings = await Cutting.find({
      cutting_date: { $gte: start, $lte: end }
    }).populate('fabric_stock');
    
    // Transform data for the report
    const formattedCuttings = cuttings.map(cutting => ({
      id: cutting._id,
      lotNumber: cutting.lot_no,
      cuttingDate: cutting.cutting_date,
      fabricType: cutting.fabric_stock?.fabric_name || 'Unknown',
      fabricColor: cutting.fabric_stock?.color || 'Unknown',
      fabricQuantity: cutting.fabric_quantity || 0,
      pieceCount: cutting.piece_count || 0,
      yield: cutting.fabric_quantity ? cutting.piece_count / cutting.fabric_quantity : 0
    }));
    
    // Generate fabric type summary
    const fabricTypeSummary = [];
    const typeMap = new Map();
    
    formattedCuttings.forEach(cutting => {
      if (!typeMap.has(cutting.fabricType)) {
        typeMap.set(cutting.fabricType, {
          fabricType: cutting.fabricType,
          cuttingCount: 0,
          fabricQuantity: 0,
          pieceCount: 0
        });
      }
      
      const typeData = typeMap.get(cutting.fabricType);
      typeData.cuttingCount++;
      typeData.fabricQuantity += cutting.fabricQuantity;
      typeData.pieceCount += cutting.pieceCount;
    });
    
    typeMap.forEach(type => {
      fabricTypeSummary.push({
        ...type,
        fabricQuantity: parseFloat(type.fabricQuantity.toFixed(2))
      });
    });
    
    // Generate daily summary
    const dailyMap = new Map();
    
    formattedCuttings.forEach(cutting => {
      const dateStr = cutting.cuttingDate.toISOString().split('T')[0];
      
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, {
          date: dateStr,
          cuttingCount: 0,
          fabricQuantity: 0,
          pieceCount: 0,
          lotCount: new Set()
        });
      }
      
      const dailyData = dailyMap.get(dateStr);
      dailyData.cuttingCount++;
      dailyData.fabricQuantity += cutting.fabricQuantity;
      dailyData.pieceCount += cutting.pieceCount;
      dailyData.lotCount.add(cutting.lotNumber);
    });
    
    const dailySummary = [];
    dailyMap.forEach((data, dateStr) => {
      dailySummary.push({
        date: dateStr,
        cuttingCount: data.cuttingCount,
        fabricQuantity: parseFloat(data.fabricQuantity.toFixed(2)),
        pieceCount: data.pieceCount,
        lotCount: data.lotCount.size
      });
    });
    
    // Sort daily summary by date
    dailySummary.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Return the complete report
    res.status(200).json({
      startDate: start,
      endDate: end,
      cuttings: formattedCuttings,
      fabricTypeSummary,
      dailySummary
    });
    
  } catch (error) {
    console.error('Cutting report generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate cutting report'
    });
  }
};

// Generate production summary report
exports.generateProductionSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1)); // First day of current month
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get all cuttings within date range
    const cuttings = await Cutting.find({
      datetime: { $gte: start, $lte: end },
      after_cutting_complete: true
    }).sort({ datetime: 1 });
    
    // Transform data for the report
    const entries = cuttings.map(cutting => {
      const sizes = cutting.sizes.reduce((acc, size) => {
        acc[size] = cutting.roles.reduce((sum, role) => sum + (role.layers_cut || 0), 0);
        return acc;
      }, {});
      
      return {
        date: cutting.datetime,
        color: cutting.roles[0]?.role_color || 'Unknown',
        sizes
      };
    });
    
    res.status(200).json({
      success: true,
      data: {
        entries,
        startDate: start,
        endDate: end
      }
    });
  } catch (error) {
    console.error('Production summary report generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate production summary report'
    });
  }
}; 