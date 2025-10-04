/**
 * Script to check a specific cutting entry
 */

const mongoose = require('mongoose');
const Cutting = require('../models/Cutting');

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
  checkCutting('682b3c9c96197b170a480cc9');
})
.catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

// Function to check a specific cutting entry
async function checkCutting(cuttingId) {
  try {
    console.log(`Checking cutting with ID: ${cuttingId}`);
    
    // Get the cutting entry
    const cutting = await Cutting.findById(cuttingId);
    
    if (!cutting) {
      console.log('Cutting entry not found');
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log('Cutting Entry Details:');
    console.log('=====================');
    console.log(`Lot Number: ${cutting.lot_number}`);
    console.log(`Pattern: ${cutting.pattern}`);
    console.log(`Fabric: ${cutting.fabric}`);
    console.log(`Status: ${cutting.status}`);
    console.log(`Created At: ${cutting.createdAt}`);
    console.log(`Updated At: ${cutting.updatedAt}`);
    console.log('\nRoles:');
    
    cutting.roles.forEach((role, index) => {
      console.log(`  Role ${index + 1}:`);
      console.log(`    Color: ${role.role_color}`);
      console.log(`    Weight: ${role.role_weight}`);
      console.log(`    Actual Layers Cut: ${role.actual_layers_cut || 'Not set'}`);
    });
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error checking cutting:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}
