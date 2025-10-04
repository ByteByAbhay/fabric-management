const Cutting = require('../models/Cutting');
const WorkerProcess = require('../models/WorkerProcess');

// Get production data for dashboard
exports.getProductionData = async (req, res) => {
  try {
    // For demo/example purpose, we're returning dummy data
    // In a real app, this would fetch actual production metrics
    res.status(200).json({
      totalProduction: 2500,
      efficiency: 87,
      onTimeDelivery: 92,
      topProducts: [
        { name: "T-Shirt", quantity: 1200 },
        { name: "Pants", quantity: 800 },
        { name: "Dresses", quantity: 500 }
      ]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Generate Production Efficiency Report
exports.generateEfficiencyReport = async (req, res) => {
  try {
    // Parse date range from query parameters
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1)); // Default to first day of current month
    const end = endDate ? new Date(endDate) : new Date(); // Default to today
    
    // Set end of day for end date
    end.setHours(23, 59, 59, 999);
    
    // Get all cutting and process data within date range
    const cuttings = await Cutting.find({
      'date': { $gte: start, $lte: end }
    }).sort({ date: 1 });
    
    const processes = await WorkerProcess.find({
      'datetime': { $gte: start, $lte: end }
    }).sort({ datetime: 1 });
    
    if ((!cuttings || cuttings.length === 0) && (!processes || processes.length === 0)) {
      return res.status(200).json({
        noDataAvailable: true,
        message: 'No production data available for the selected period'
      });
    }
    
    // Sample data for demonstration - in a real app, this would be calculated from the actual data
    const overallEfficiency = 85;
    const efficiencyChange = 3.2;
    const totalProduction = cuttings.reduce((sum, cutting) => sum + (cutting.pieceCount || 0), 0);
    const avgProductionTime = 240; // 4 hours in minutes
    
    // Generate efficiency trend data (one entry per day in the date range)
    const efficiencyTrend = [];
    const dateMap = new Map();
    
    // Loop through each day in the date range
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      
      // Generate random efficiency data for this day
      const dayEfficiency = Math.floor(Math.random() * 15) + 75; // Random between 75-90
      
      efficiencyTrend.push({
        date: dateStr,
        efficiency: dayEfficiency,
        target: 85 // Target efficiency percentage
      });
      
      // Move to next day
      current.setDate(current.getDate() + 1);
    }
    
    // Generate worker type data
    const productionByWorkerType = [
      { workerType: 'Cutter', production: 850, efficiency: 88 },
      { workerType: 'Stitcher', production: 1200, efficiency: 82 },
      { workerType: 'Finisher', production: 450, efficiency: 90 }
    ];
    
    // Generate time utilization data
    const timeUtilization = [
      { category: 'Production', time: 480, percentage: 60 },
      { category: 'Setup', time: 120, percentage: 15 },
      { category: 'Maintenance', time: 80, percentage: 10 },
      { category: 'Breaks', time: 60, percentage: 7.5 },
      { category: 'Meetings', time: 60, percentage: 7.5 }
    ];
    
    // Generate product type efficiency data
    const efficiencyByProductType = [
      { 
        productType: 'T-Shirt', 
        production: 850, 
        target: 900, 
        timePerUnit: 12, // minutes
        laborCost: 12750 
      },
      { 
        productType: 'Pants', 
        production: 650, 
        target: 700, 
        timePerUnit: 22, 
        laborCost: 14300 
      },
      { 
        productType: 'Dresses', 
        production: 420, 
        target: 450, 
        timePerUnit: 30, 
        laborCost: 12600 
      },
      { 
        productType: 'Shirts', 
        production: 580, 
        target: 600, 
        timePerUnit: 18, 
        laborCost: 10440 
      }
    ];
    
    // Generate bottlenecks and recommendations
    const bottlenecks = [
      {
        title: 'Stitching Line Delays',
        description: 'Delays in the stitching line are causing production bottlenecks, particularly for pants and dresses.',
        affectedAreas: ['Stitching', 'Assembly']
      },
      {
        title: 'Material Supply Delays',
        description: 'Inconsistent fabric supply is causing production stoppages and rescheduling.',
        affectedAreas: ['Procurement', 'Planning']
      }
    ];
    
    const recommendations = [
      {
        title: 'Optimize Stitching Workstations',
        description: 'Reorganize stitching stations to improve workflow and reduce movement.',
        estimatedImprovement: '8-10% efficiency increase'
      },
      {
        title: 'Implement Advanced Planning System',
        description: 'Adopt a more sophisticated material planning system to prevent supply delays.',
        estimatedImprovement: '15% reduction in downtime'
      },
      {
        title: 'Cross-training Program',
        description: 'Implement a cross-training program for workers to increase flexibility.',
        estimatedImprovement: '12% increase in overall productivity'
      }
    ];
    
    res.status(200).json({
      reportPeriod: {
        startDate: start,
        endDate: end
      },
      overallEfficiency,
      efficiencyChange,
      totalProduction,
      avgProductionTime,
      efficiencyTrend,
      productionByWorkerType,
      timeUtilization,
      efficiencyByProductType,
      bottlenecks,
      recommendations
    });
    
  } catch (error) {
    console.error('Error generating production efficiency report:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating production efficiency report'
    });
  }
}; 