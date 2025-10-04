/**
 * Script to directly add fabric stock for testing without vendor
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
  addFabricStock();
})
.catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

// Function to add fabric stock directly
async function addFabricStock() {
  try {
    console.log('Adding fabric stock directly...');
    
    // Create Vilas Purple stock
    const vilasPurpleStock = new FabricStock({
      fabric_name: "Vilas",
      color: "Purple",
      color_hex: "#800080",
      current_quantity: 200,
      standard_weight: 200,
      last_updated: new Date()
    });
    
    await vilasPurpleStock.save();
    console.log('Added Vilas Purple stock');
    
    // Create Vilas Black stock
    const vilasBlackStock = new FabricStock({
      fabric_name: "Vilas",
      color: "Black",
      color_hex: "#000000",
      current_quantity: 120,
      standard_weight: 120,
      last_updated: new Date()
    });
    
    await vilasBlackStock.save();
    console.log('Added Vilas Black stock');
    
    // Create Pillan Dark Grey stock
    const pillanDarkGreyStock = new FabricStock({
      fabric_name: "Pillan",
      color: "Dark Grey",
      color_hex: "#444444",
      current_quantity: 100,
      standard_weight: 100,
      last_updated: new Date()
    });
    
    await pillanDarkGreyStock.save();
    console.log('Added Pillan Dark Grey stock');
    
    // Create Pillan Purple stock
    const pillanPurpleStock = new FabricStock({
      fabric_name: "Pillan",
      color: "Purple",
      color_hex: "#800080",
      current_quantity: 150,
      standard_weight: 150,
      last_updated: new Date()
    });
    
    await pillanPurpleStock.save();
    console.log('Added Pillan Purple stock');
    
    console.log('All fabric stock added successfully!');
    
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error adding fabric stock:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}
