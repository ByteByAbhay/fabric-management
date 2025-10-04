/**
 * Script to mark Pinkis color stock as processed
 */

const mongoose = require('mongoose');
const FabricStock = require('../models/FabricStock');

// MongoDB connection string
const MONGO_URI = 'mongodb+srv://kmendo19:1uaZTbLPMui0VZjP@machineproject.fm8vhtw.mongodb.net/fabric-management';

// Connect to MongoDB
console.log('Connecting to MongoDB...');
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB Connected');
  markPinkisProcessed();
})
.catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

// Function to mark Pinkis color stock as processed
async function markPinkisProcessed() {
  try {
    console.log('Finding Pinkis color stock...');
    
    // Find all stock with Pinkis color
    const pinkisStocks = await FabricStock.find({ color: 'Pinkis' });
    
    if (pinkisStocks.length === 0) {
      console.log('No Pinkis color stock found');
      await mongoose.connection.close();
      process.exit(0);
    }
    
    console.log(`Found ${pinkisStocks.length} Pinkis color stock items`);
    
    // Mark each stock as processed
    for (const stock of pinkisStocks) {
      console.log(`Marking ${stock.fabric_name}/${stock.color} (ID: ${stock._id}) as processed`);
      
      stock.processed = true;
      stock.processedAt = new Date();
      await stock.save();
      
      console.log(`Successfully marked ${stock.fabric_name}/${stock.color} as processed`);
    }
    
    console.log('All Pinkis color stock items have been marked as processed');
    
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error marking Pinkis stock as processed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}
