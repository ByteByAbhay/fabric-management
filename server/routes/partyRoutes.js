const express = require('express');
const { 
  createParty, 
  getParties, 
  getParty, 
  updateParty,
  editParty,
  deleteParty,
  getPartyFabricColors,
  getPartyFabricTypes
} = require('../controllers/partyController');

// Import the reassignStock function from the separate file
const { reassignStock } = require('../controllers/reassignStockFunction');

const router = express.Router();

// Main party routes
router.route('/')
  .post(createParty)
  .get(getParties);

// Fabric data routes
router.get('/fabric-colors', getPartyFabricColors);
router.get('/fabric-types', getPartyFabricTypes);

// Reassign stock from one party to another
router.post('/reassign-stock/:fromPartyId/:toPartyId', reassignStock);

// Individual party routes
router.route('/:id')
  .get(getParty)
  .put(updateParty)
  .delete(deleteParty);

// Enhanced party edit endpoint
router.post('/edit/:id', editParty);

module.exports = router; 