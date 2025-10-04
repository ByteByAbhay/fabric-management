/**
 * Script to add a test vendor with fabric stock for testing
 */

const mongoose = require('mongoose');
const Vendor = require('../models/Vendor');
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
  addTestVendor();
})
.catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

// Function to add a test vendor with fabric stock
async function addTestVendor() {
  try {
    console.log('Adding test vendor with fabric stock...');
    
    // Create test vendor data
    const vendorData = {
      shop_name: "Mitchell Peter",
      party_name: "Mitchell Fabrics",
      contact_person: "Peter Mitchell",
      phone_number: "9876543210",
      address: "123 Fabric Street",
      bill_no: "BILL-001",
      bill_date: new Date(),
      fabricDetails: [
        {
          name: "Pillan",
          fabricColors: [
            {
              color_name: "Dark Grey",
              color_hex: "#444444",
              color_weight: 100
            },
            {
              color_name: "Purple",
              color_hex: "#800080",
              color_weight: 150
            }
          ]
        },
        {
          name: "Vilas",
          fabricColors: [
            {
              color_name: "Purple",
              color_hex: "#800080",
              color_weight: 200
            },
            {
              color_name: "Black",
              color_hex: "#000000",
              color_weight: 120
            }
          ]
        }
      ]
    };
    
    // Create the vendor
    const vendor = new Vendor(vendorData);
    await vendor.save();
    console.log('Vendor created:', vendor._id);
    
    // Add stock for each fabric and color
    for (const fabric of vendorData.fabricDetails) {
      for (const colorInfo of fabric.fabricColors) {
        // Create new stock entry
        const stock = new FabricStock({
          fabric_name: fabric.name,
          color: colorInfo.color_name,
          color_hex: colorInfo.color_hex,
          current_quantity: colorInfo.color_weight,
          standard_weight: colorInfo.color_weight,
          vendor: vendor._id
        });
        await stock.save();
        console.log(`Added stock: ${fabric.name} - ${colorInfo.color_name} (${colorInfo.color_weight} units)`);
      }
    }
    
    console.log('Test vendor and fabric stock added successfully!');
    
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error adding test vendor:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}
