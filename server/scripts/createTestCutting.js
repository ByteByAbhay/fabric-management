/**
 * Script to directly create a test cutting entry
 */

const mongoose = require('mongoose');
const Cutting = require('../models/Cutting');
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
  checkFabricStock();
})
.catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

// Function to check fabric stock
async function checkFabricStock() {
  try {
    console.log('Checking fabric stock...');
    
    // Check for Mitchell Peter Purple stock
    const stock = await FabricStock.findOne({
      fabric_name: 'Mitchell Peter',
      color: 'Purple'
    });
    
    console.log('Found stock:', stock ? 'Yes' : 'No');
    if (stock) {
      console.log('Stock details:', {
        id: stock._id,
        fabric_name: stock.fabric_name,
        color: stock.color,
        current_quantity: stock.current_quantity
      });
      
      // If stock exists, create a test cutting entry
      await createTestCutting();
    } else {
      console.log('No stock found. Creating test stock...');
      await createTestStock();
    }
  } catch (error) {
    console.error('Error checking fabric stock:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Function to create test stock if needed
async function createTestStock() {
  try {
    console.log('Creating test stock...');
    
    // Create Mitchell Peter Purple stock
    const stock = new FabricStock({
      fabric_name: 'Mitchell Peter',
      color: 'Purple',
      color_hex: '#800080',
      current_quantity: 100,
      standard_weight: 100,
      last_updated: new Date()
    });
    
    await stock.save();
    console.log('Test stock created successfully!');
    
    // Now create the test cutting
    await createTestCutting();
  } catch (error) {
    console.error('Error creating test stock:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Function to create a test cutting entry
async function createTestCutting() {
  try {
    console.log('Creating test cutting entry...');
    
    // Create test cutting data
    const cuttingData = {
      lot_no: 'TEST-' + Date.now().toString().slice(-6), // Generate a unique lot number
      pattern: 'Vilas',
      fabric: 'Mitchell Peter',
      datetime: new Date(),
      sizes: ['S', 'M', 'L'],
      roles: [
        {
          role_no: '1',
          role_weight: 30,
          role_color: 'Purple'
        }
      ],
      before_cutting_complete: true
    };
    
    console.log('Cutting data:', cuttingData);
    
    // Create the cutting entry directly
    const cutting = new Cutting(cuttingData);
    await cutting.save();
    
    console.log('Test cutting created successfully!');
    console.log('Cutting ID:', cutting._id);
    
    // Update fabric stock
    const stock = await FabricStock.findOne({
      fabric_name: 'Mitchell Peter',
      color: 'Purple'
    });
    
    if (stock) {
      stock.current_quantity -= 30; // Reduce by role_weight
      stock.last_updated = new Date();
      await stock.save();
      console.log('Stock updated. New quantity:', stock.current_quantity);
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test cutting:', error);
    console.error('Error details:', error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}
