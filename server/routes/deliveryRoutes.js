const express = require('express');
const { 
  createDelivery, 
  getAllDeliveries, 
  getDeliveryById, 
  updateDeliveryStatus, 
  updateDelivery, 
  deleteDelivery,
  generateDeliveryReport
} = require('../controllers/deliveryController');

const router = express.Router();

// Base routes
router.route('/')
  .post(createDelivery)
  .get(getAllDeliveries);

// Single delivery routes
router.route('/:id')
  .get(getDeliveryById)
  .put(updateDelivery)
  .delete(deleteDelivery);

// Update delivery status
router.route('/:id/status')
  .patch(updateDeliveryStatus);

// Generate delivery report
router.route('/report/summary')
  .get(generateDeliveryReport);

module.exports = router;
