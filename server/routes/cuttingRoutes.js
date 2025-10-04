const express = require('express');
const { 
  createBeforeCutting, 
  updateAfterCutting, 
  getAllCutting,
  getCutting,
  generateCuttingReport,
  generateProductionSummary
} = require('../controllers/cuttingController');

const router = express.Router();

router.route('/')
  .get(getAllCutting);

router.route('/before')
  .post(createBeforeCutting);

router.route('/:id')
  .get(getCutting);

router.route('/:id/after')
  .put(updateAfterCutting);

router.get('/report', generateCuttingReport);
router.get('/production-summary', generateProductionSummary);

module.exports = router; 