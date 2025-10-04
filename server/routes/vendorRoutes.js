const express = require('express');
const { 
  createVendor, 
  getVendors, 
  getVendor, 
  updateVendor,
  editVendor,
  deleteVendor,
  getFabricColors,
  getFabricTypes
} = require('../controllers/vendorController');

// Import the reassignStock function from the separate file
const { reassignStock } = require('../controllers/reassignStockFunction');

const router = express.Router();

// Main vendor routes
router.route('/')
  .post(createVendor)
  .get(getVendors);

// Fabric data routes
router.get('/fabric-colors', getFabricColors);
router.get('/fabric-types', getFabricTypes);

// Reassign stock from one vendor to another
router.post('/reassign-stock/:fromVendorId/:toVendorId', reassignStock);

// Individual vendor routes
router.route('/:id')
  .get(getVendor)
  .put(updateVendor)
  .delete(deleteVendor);

// Enhanced vendor edit endpoint
router.post('/edit/:id', editVendor);

module.exports = router; 