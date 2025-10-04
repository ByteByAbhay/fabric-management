const express = require('express');
const { 
  getProductionData,
  generateEfficiencyReport
} = require('../controllers/productionController');

const router = express.Router();

router.route('/')
  .get(getProductionData);

router.route('/efficiency-report')
  .get(generateEfficiencyReport);

module.exports = router; 