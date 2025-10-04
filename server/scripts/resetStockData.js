/**
 * Script to reset fabric stock data
 * This will clear all fabric stock, cutting, and inline stock data
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const FabricStock = require('../models/FabricStock');
const Cutting = require('../models/Cutting');
const InlineStock = require('../models/InlineStock');
const ProcessOutput = require('../models/ProcessOutput');

// Connect to database
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://kmendo19:1uaZTbLPMui0VZjP@machineproject.fm8vhtw.mongodb.net/fabric-management';

console.log('Connecting to MongoDB...');
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

const resetData = async () => {
  try {
    console.log('Starting data reset process...');
    
    // Clear ProcessOutput collection
    console.log('Clearing ProcessOutput collection...');
    const processOutputResult = await ProcessOutput.deleteMany({});
    console.log(`Deleted ${processOutputResult.deletedCount} ProcessOutput records`);
    
    // Clear InlineStock collection
    console.log('Clearing InlineStock collection...');
    const inlineStockResult = await InlineStock.deleteMany({});
    console.log(`Deleted ${inlineStockResult.deletedCount} InlineStock records`);
    
    // Clear Cutting collection
    console.log('Clearing Cutting collection...');
    const cuttingResult = await Cutting.deleteMany({});
    console.log(`Deleted ${cuttingResult.deletedCount} Cutting records`);
    
    // Clear FabricStock collection
    console.log('Clearing FabricStock collection...');
    const fabricStockResult = await FabricStock.deleteMany({});
    console.log(`Deleted ${fabricStockResult.deletedCount} FabricStock records`);
    
    console.log('Data reset complete. You can now re-enter your data.');
    
    // Close the database connection
    mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error resetting data:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Confirm before proceeding
console.log('\n⚠️  WARNING: This will delete ALL fabric stock, cutting, and process data! ⚠️');
console.log('This action cannot be undone. Make sure you have a backup if needed.');
console.log('To proceed, type "yes" and press Enter. To cancel, press Ctrl+C.');

process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', (data) => {
  const input = data.trim().toLowerCase();
  
  if (input === 'yes') {
    resetData();
  } else {
    console.log('Operation cancelled.');
    process.exit(0);
  }
});
