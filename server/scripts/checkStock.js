/**
 * Script to check current fabric stock levels
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
  checkAllStock();
})
.catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

// Function to check all fabric stock
async function checkAllStock() {
  try {
    console.log('Checking all fabric stock...');
    
    // Get all fabric stock
    const allStock = await FabricStock.find().sort({ fabric_name: 1, color: 1 });
    
    console.log('Current Fabric Stock Levels:');
    console.log('===========================');
    
    if (allStock.length === 0) {
      console.log('No fabric stock found in the database.');
    } else {
      allStock.forEach(stock => {
        console.log(`${stock.fabric_name} - ${stock.color}: ${stock.current_quantity} units`);
      });
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error checking fabric stock:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}
