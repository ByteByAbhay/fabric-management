const WorkerProcess = require('../models/WorkerProcess');
const Cutting = require('../models/Cutting');
const ProcessOutput = require('../models/ProcessOutput');
const InlineStock = require('../models/InlineStock');

// Create new worker process entry
exports.createProcess = async (req, res) => {
  try {
    const { cutting_reference, piece_count } = req.body;
    
    // Verify that cutting exists and has sufficient pieces
    const cutting = await Cutting.findById(cutting_reference);
    
    if (!cutting) {
      return res.status(404).json({
        success: false,
        message: 'Cutting reference not found'
      });
    }
    
    // Calculate total pieces cut
    const totalPiecesCut = cutting.roles.reduce((total, role) => total + role.pieces_cut, 0);
    
    // Calculate total pieces already processed
    const processedPieces = await WorkerProcess.aggregate([
      { $match: { cutting_reference: cutting._id } },
      { $group: { _id: null, total: { $sum: '$piece_count' } } }
    ]);
    
    const totalProcessed = processedPieces.length > 0 ? processedPieces[0].total : 0;
    
    // Check if there are enough pieces left to process
    if (totalProcessed + piece_count > totalPiecesCut) {
      return res.status(400).json({
        success: false,
        message: `Cannot process ${piece_count} pieces. Only ${totalPiecesCut - totalProcessed} pieces available.`
      });
    }
    
    const process = new WorkerProcess(req.body);
    await process.save();
    
    res.status(201).json({
      success: true,
      data: process
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all process entries
exports.getAllProcesses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const processes = await WorkerProcess.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('cutting_reference', 'lot_no pattern');
    
    const total = await WorkerProcess.countDocuments();
    
    res.status(200).json({
      success: true,
      count: processes.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: processes
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get processes by line
exports.getProcessesByLine = async (req, res) => {
  try {
    const { line } = req.params;
    
    const processes = await WorkerProcess.find({ line_no: line })
      .sort({ createdAt: -1 })
      .populate('cutting_reference', 'lot_no pattern');
    
    res.status(200).json({
      success: true,
      count: processes.length,
      data: processes
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get list of all workers
exports.getWorkersList = async (req, res) => {
  try {
    const workers = await WorkerProcess.distinct('worker_name');
    
    res.status(200).json({
      success: true,
      count: workers.length,
      data: workers
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get list of all operations
exports.getOperationsList = async (req, res) => {
  try {
    const operations = await WorkerProcess.distinct('operation');
    
    res.status(200).json({
      success: true,
      count: operations.length,
      data: operations
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get worker report
exports.getWorkerReport = async (req, res) => {
  try {
    const { startDate, endDate, workerName, operation } = req.query;
    
    // Build query filter
    const filter = {};
    
    if (startDate || endDate) {
      filter.datetime = {};
      if (startDate) filter.datetime.$gte = new Date(startDate);
      if (endDate) filter.datetime.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    
    if (workerName) filter.worker_name = workerName;
    if (operation) filter.operation = operation;
    
    const processes = await WorkerProcess.find(filter)
      .sort({ worker_name: 1, operation: 1 })
      .populate('cutting_reference', 'lot_no pattern');
    
    res.status(200).json({
      success: true,
      count: processes.length,
      data: processes
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Generate lot salary report
exports.generateLotSalaryReport = async (req, res) => {
  try {
    const { startDate, endDate, lotNo } = req.query;
    
    // Build query filter
    const filter = {};
    
    if (startDate || endDate) {
      filter.datetime = {};
      if (startDate) filter.datetime.$gte = new Date(startDate);
      if (endDate) filter.datetime.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    
    // Get cutting data to filter by lot number
    let cuttingFilter = {};
    if (lotNo) {
      cuttingFilter.lot_no = lotNo;
    }
    
    const cuttingData = await Cutting.find(cuttingFilter).select('_id lot_no pattern');
    const cuttingIds = cuttingData.map(cutting => cutting._id);
    
    // Add cutting references to filter
    if (cuttingIds.length > 0) {
      filter.cutting_reference = { $in: cuttingIds };
    }
    
    // Get worker processes filtered by criteria
    const processes = await WorkerProcess.find(filter)
      .populate('cutting_reference', 'lot_no pattern')
      .sort({ datetime: 1 });
    
    // Group data by lot number and worker
    const lotSalaryData = {};
    
    processes.forEach(process => {
      const lotNo = process.cutting_reference ? process.cutting_reference.lot_no : 'Unknown';
      const workerName = process.worker_name;
      
      if (!lotSalaryData[lotNo]) {
        lotSalaryData[lotNo] = {
          lotNo,
          pattern: process.cutting_reference ? process.cutting_reference.pattern : 'Unknown',
          workers: {}
        };
      }
      
      if (!lotSalaryData[lotNo].workers[workerName]) {
        lotSalaryData[lotNo].workers[workerName] = {
          workerName,
          operations: [],
          totalPieces: 0,
          totalSalary: 0
        };
      }
      
      // Fix for off-by-one bug: ensure piece_count is correct before calculating salary
      const adjustedPieceCount = process.piece_count > 0 ? process.piece_count : 0;
      const calculatedSalary = adjustedPieceCount * process.rate;
      
      const operation = {
        operation: process.operation,
        lineNo: process.line_no,
        pieces: adjustedPieceCount,
        rate: process.rate,
        salary: calculatedSalary,
        date: process.datetime
      };
      
      lotSalaryData[lotNo].workers[workerName].operations.push(operation);
      lotSalaryData[lotNo].workers[workerName].totalPieces += adjustedPieceCount;
      lotSalaryData[lotNo].workers[workerName].totalSalary += calculatedSalary;
    });
    
    // Format the data for response
    const formattedData = Object.values(lotSalaryData).map(lot => {
      return {
        lotNo: lot.lotNo,
        pattern: lot.pattern,
        workers: Object.values(lot.workers),
        totalLotSalary: Object.values(lot.workers).reduce((sum, worker) => sum + worker.totalSalary, 0)
      };
    });
    
    res.status(200).json({
      success: true,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      count: formattedData.length,
      data: formattedData
    });
  } catch (error) {
    console.error('Lot salary report generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate lot salary report'
    });
  }
};

// Handle process output submission
exports.saveProcessOutput = async (req, res) => {
  try {
    const { loadId, lotNo, size, processItems, workerName, pattern } = req.body;
    
    console.log('Process output submission received:', { loadId, lotNo, size, workerName, pattern });
    console.log('Process items:', processItems);
    
    // Validate required fields
    if (!loadId || !lotNo || !size || !processItems || processItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields. Load ID, Lot Number, Size, and Process Items are required.'
      });
    }
    
    // Validate worker name
    if (!workerName || workerName.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Worker name is required.'
      });
    }
    
    // Validate that there's an existing inline stock item with this loadId
    const inlineStockItem = await InlineStock.findOne({ loadId, lotNo, size });
    
    if (!inlineStockItem) {
      return res.status(404).json({
        success: false,
        error: 'No matching inline stock item found'
      });
    }
    
    // Create the process output record
    const processOutput = new ProcessOutput({
      loadId,
      lotNo,
      size,
      processItems,
      workerName: workerName.trim(), // Ensure worker name is properly trimmed
      pattern: pattern || inlineStockItem.pattern, // Include pattern information
      completedAt: new Date()
    });
    
    console.log('Saving process output record:', processOutput);
    await processOutput.save();
    
    // Remove the inline stock item completely instead of just marking it as processed
    console.log(`Removing inline stock item with ID: ${inlineStockItem._id}`);
    await InlineStock.findByIdAndDelete(inlineStockItem._id);
    
    res.status(201).json({
      success: true,
      data: processOutput,
      message: 'Process output saved successfully and inline stock item removed'
    });
  } catch (error) {
    console.error('Process output save error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save process output'
    });
  }
};

// Get all process output records
exports.getAllProcessOutput = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build query filter
    let filter = {};
    
    if (startDate || endDate) {
      filter.completedAt = {};
      if (startDate) filter.completedAt.$gte = new Date(startDate);
      if (endDate) filter.completedAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    
    const processOutput = await ProcessOutput.find(filter)
      .sort({ completedAt: -1 });
    
    res.status(200).json({
      success: true,
      count: processOutput.length,
      data: processOutput
    });
  } catch (error) {
    console.error('Error fetching process output data:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch process output data'
    });
  }
};

// Get output difference report data
exports.getOutputDifferenceReport = async (req, res) => {
  try {
    const { startDate, endDate, workerName, fabricType } = req.query;
    
    console.log('Generating output difference report with filters:', { startDate, endDate, workerName, fabricType });
    
    // Build query filter
    let filter = {};
    
    if (startDate || endDate) {
      filter.completedAt = {};
      if (startDate) filter.completedAt.$gte = new Date(startDate);
      if (endDate) filter.completedAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    
    // Add worker name filter if provided
    if (workerName) {
      filter.workerName = { $regex: workerName, $options: 'i' };
    }
    
    // Add pattern/fabric type filter if provided
    if (fabricType) {
      filter.pattern = { $regex: fabricType, $options: 'i' };
    }
    
    console.log('Query filter:', filter);
    
    // Get process output records
    const processOutputRecords = await ProcessOutput.find(filter)
      .sort({ completedAt: -1 });
    
    console.log(`Found ${processOutputRecords.length} process output records`);
    
    // Get cutting data to include additional information
    const lotNumbers = [...new Set(processOutputRecords.map(record => record.lotNo))];
    const cuttingData = await Cutting.find({ lot_no: { $in: lotNumbers } });
    
    // Transform data for the report
    const reportData = [];
    
    processOutputRecords.forEach(record => {
      // Use the worker name directly from the process output record
      const recordWorkerName = record.workerName || 'Unknown';
      
      // Get fabric type from record or cutting data
      const fabricType = record.pattern || 
                         cuttingData.find(c => c.lot_no === record.lotNo)?.pattern || 
                         'Unknown';
      
      record.processItems.forEach(item => {
        reportData.push({
          date: record.completedAt,
          loadId: record.loadId,
          lotNo: record.lotNo,
          size: record.size,
          workerName: recordWorkerName,
          fabricType: fabricType,
          color: item.color,
          expectedPieces: item.expectedQuantity,
          actualPieces: item.actualQuantity,
          difference: item.difference,
          // Include actual details for action button
          actualDetails: {
            quantity: item.actualQuantity,
            completedAt: record.completedAt,
            workerName: recordWorkerName,
            notes: item.notes || ''
          }
        });
      });
    });
    
    console.log(`Generated ${reportData.length} report data items`);
    
    res.status(200).json({
      success: true,
      count: reportData.length,
      data: reportData
    });
  } catch (error) {
    console.error('Error generating output difference report:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate output difference report'
    });
  }
}; 