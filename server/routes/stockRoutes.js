const express = require('express');
const { 
  getAllStock, 
  getStockByFabric, 
  getStockByColor,
  generateStockReport,
  markStockAsProcessed
} = require('../controllers/stockController');

const router = express.Router();

router.route('/')
  .get(getAllStock);

router.route('/report')
  .get(generateStockReport);

router.route('/color/:color')
  .get(getStockByColor);

router.route('/:fabricName')
  .get(getStockByFabric);

// Route to mark stock as processed
router.route('/processed/:id')
  .put(markStockAsProcessed);

module.exports = router; 