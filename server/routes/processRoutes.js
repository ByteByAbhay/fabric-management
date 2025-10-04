const express = require('express');
const { 
  createProcess, 
  getAllProcesses, 
  getProcessesByLine,
  getWorkersList,
  getOperationsList,
  getWorkerReport,
  generateLotSalaryReport,
  saveProcessOutput,
  getAllProcessOutput,
  getOutputDifferenceReport
} = require('../controllers/processController');

const router = express.Router();

router.route('/')
  .post(createProcess)
  .get(getAllProcesses);

router.route('/line/:line')
  .get(getProcessesByLine);

router.route('/workers')
  .get(getWorkersList);

router.route('/operations')
  .get(getOperationsList);

router.route('/report')
  .get(getWorkerReport);

router.get('/lot-salary-report', generateLotSalaryReport);

// Process output routes
router.route('/output')
  .post(saveProcessOutput)
  .get(getAllProcessOutput);

// Output difference report route
router.get('/output/report', getOutputDifferenceReport);

module.exports = router; 