import React, { useState, useEffect } from 'react';
import { Card, Table, Form, Button, Alert, Row, Col, Badge, Spinner, InputGroup, FormControl } from 'react-bootstrap';
import { FaUser, FaSearch, FaClipboardCheck, FaSave, FaTimes } from 'react-icons/fa';
import axios from '../../utils/axios';

const ProcessOutput = () => {
  const [inlineStock, setInlineStock] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [processData, setProcessData] = useState([]);
  const [workerName, setWorkerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentWorkers, setRecentWorkers] = useState([]);

  // Fetch inline stock and recent workers on component mount
  useEffect(() => {
    fetchInlineStock();
    fetchRecentWorkers();
  }, []);
  
  // Fetch recent workers
  const fetchRecentWorkers = async () => {
    try {
      const response = await axios.get('/api/process/workers');
      if (response && response.data && response.data.data) {
        setRecentWorkers(response.data.data.slice(0, 5)); // Get top 5 recent workers
      }
    } catch (error) {
      console.error('Error fetching recent workers:', error);
    }
  };

  const fetchInlineStock = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/inline-stock');
      
      // Process the data to ensure lot numbers and patterns are properly displayed
      const processedData = response.data.data.map(item => {
        // Check if lot number or pattern is missing
        const missingData = !item.lotNo || !item.pattern;
        
        return {
          ...item,
          lotNo: item.lotNo || 'Missing',
          pattern: item.pattern || 'Missing',
          hasMissingData: missingData
        };
      });
      
      setInlineStock(processedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching inline stock:', error);
      setError('Failed to load inline stock data');
      setLoading(false);
    }
  };

  // Handle selection of inline stock item
  const handleSelectStock = (stock) => {
    // Check if lot number or pattern is missing
    if (!stock.lotNo || stock.lotNo === 'Missing' || !stock.pattern || stock.pattern === 'Missing') {
      setError('Cannot process stock with missing lot number or pattern. Please update the stock record first.');
      return;
    }
    
    setSelectedStock(stock);
    
    // Initialize process data with quantities set to 0
    const initialData = Object.entries(stock.colors).map(([color, data]) => ({
      color,
      expectedQuantity: data.quantity,
      actualQuantity: '',
      difference: null,
      bundle: data.bundle
    }));
    
    setProcessData(initialData);
  };

  // Removed handleUpdateLotInfo since we're using a relationship-based approach

  // Handle change in actual quantity input
  const handleQuantityChange = (index, value) => {
    const newValue = value === '' ? '' : Number(value);
    const updatedData = [...processData];
    updatedData[index].actualQuantity = newValue;
    
    // Calculate difference if both values are numbers
    if (newValue !== '' && !isNaN(newValue)) {
      updatedData[index].difference = newValue - updatedData[index].expectedQuantity;
    } else {
      updatedData[index].difference = null;
    }
    
    setProcessData(updatedData);
  };

  // Submit process data
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Ensure lot number and pattern are included in the payload
      if (!selectedStock.lotNo || selectedStock.lotNo === 'Missing' || !selectedStock.pattern || selectedStock.pattern === 'Missing') {
        setError('Missing lot number or pattern information. Please update the stock record first.');
        setLoading(false);
        return;
      }
      
      // Validate worker name
      if (!workerName.trim()) {
        setError('Worker name is required');
        setLoading(false);
        return;
      }
      
      const payload = {
        loadId: selectedStock.loadId,
        lotNo: selectedStock.lotNo,
        pattern: selectedStock.pattern, // Include pattern in the payload
        size: selectedStock.size,
        workerName: workerName.trim(), // Add worker name to the payload
        processItems: processData.map(item => ({
          color: item.color,
          expectedQuantity: item.expectedQuantity,
          actualQuantity: item.actualQuantity === '' ? 0 : item.actualQuantity,
          difference: item.difference
        }))
      };
      
      const response = await axios.post('/api/process/output', payload);
      
      setSuccess('Output data saved successfully');
      setSelectedStock(null);
      setProcessData([]);
      setWorkerName(''); // Reset worker name
      
      // Refresh inline stock data
      fetchInlineStock();
      
      setLoading(false);
    } catch (error) {
      console.error('Error saving output data:', error);
      setError('Failed to save output data. Please try again.');
      setLoading(false);
    }
  };

  // Filter inline stock based on search term
  const filteredStock = inlineStock.filter(item => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (item.lotNo && item.lotNo.toLowerCase().includes(search)) ||
      (item.pattern && item.pattern.toLowerCase().includes(search)) ||
      (item.loadId && item.loadId.toLowerCase().includes(search))
    );
  });

  return (
    <div className="container-fluid py-4">
      {error && 
        <Alert variant="danger" className="d-flex align-items-center" onClose={() => setError(null)} dismissible>
          <div className="me-2"><FaTimes size={18} /></div>
          <div>{error}</div>
        </Alert>
      }
      {success && 
        <Alert variant="success" className="d-flex align-items-center" onClose={() => setSuccess(null)} dismissible>
          <div className="me-2"><FaClipboardCheck size={18} /></div>
          <div>{success}</div>
        </Alert>
      }
      
      <Row>
        <Col md={selectedStock ? 6 : 12}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center bg-light">
              <h5 className="m-0">Inline Stock</h5>
              <InputGroup className="w-50">
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <FormControl
                  placeholder="Search by lot no, pattern, or load ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Loading stock data...</p>
                </div>
              ) : filteredStock.length === 0 ? (
                <Alert variant="info">No inline stock available</Alert>
              ) : (
                <Table responsive hover striped>
                  <thead className="table-light">
                    <tr>
                      <th>Lot No</th>
                      <th>Pattern</th>
                      <th>Size</th>
                      <th>Load ID</th>
                      <th>Colors</th>
                      <th>Total</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStock.map(stock => (
                      <tr key={stock._id}>
                        <td>{stock.lotNo}</td>
                        <td>{stock.pattern}</td>
                        <td>
                          <Badge bg="info" pill>{stock.size}</Badge>
                        </td>
                        <td>{stock.loadId}</td>
                        <td>
                          {Object.entries(stock.colors).map(([color, data], idx) => (
                            <div key={idx} className="d-flex align-items-center mb-1">
                              <div 
                                className="color-swatch me-2" 
                                style={{ 
                                  backgroundColor: color, 
                                  width: '12px', 
                                  height: '12px', 
                                  borderRadius: '50%',
                                  display: 'inline-block'
                                }} 
                              />
                              <span>{color}: <strong>{data.quantity}</strong></span>
                            </div>
                          ))}
                        </td>
                        <td><strong>{stock.total}</strong></td>
                        <td>
                          <Button 
                            variant={stock.hasMissingData ? "outline-secondary" : "outline-primary"} 
                            size="sm" 
                            onClick={() => handleSelectStock(stock)}
                            disabled={stock.hasMissingData}
                            className="d-flex align-items-center"
                          >
                            <span className="me-1">Process</span>
                            <FaClipboardCheck />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        {selectedStock && (
          <Col md={6}>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                <h5 className="m-0">Process Output</h5>
                <div>
                  <Badge bg="secondary" className="me-2">Lot: {selectedStock.lotNo}</Badge>
                  <Badge bg="secondary" className="me-2">Pattern: {selectedStock.pattern}</Badge>
                  <Badge bg="secondary" className="me-2">Size: {selectedStock.size}</Badge>
                </div>
              </Card.Header>
              <Card.Body>
                {/* Worker Name Input with Recent Workers */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">Worker Name</Form.Label>
                  <InputGroup>
                    <InputGroup.Text><FaUser /></InputGroup.Text>
                    <Form.Control 
                      type="text" 
                      placeholder="Enter worker name" 
                      value={workerName}
                      onChange={(e) => setWorkerName(e.target.value)}
                      required
                      className="border-end-0"
                    />
                    {workerName && (
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => setWorkerName('')}
                      >
                        Clear
                      </Button>
                    )}
                  </InputGroup>
                  {recentWorkers.length > 0 && (
                    <div className="mt-2">
                      <small className="text-muted">Recent workers:</small>
                      <div className="d-flex flex-wrap mt-1">
                        {recentWorkers.map((worker, idx) => (
                          <Badge 
                            key={idx} 
                            bg="light" 
                            text="dark" 
                            className="me-2 mb-1 px-2 py-1" 
                            style={{ cursor: 'pointer' }}
                            onClick={() => setWorkerName(worker)}
                          >
                            {worker}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Form.Group>
                
                <Table responsive striped hover>
                  <thead className="table-light">
                    <tr>
                      <th>Color</th>
                      <th>Bundle</th>
                      <th>Expected</th>
                      <th>Actual</th>
                      <th>Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processData.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div 
                              className="color-swatch me-2" 
                              style={{ 
                                backgroundColor: item.color, 
                                width: '16px', 
                                height: '16px', 
                                borderRadius: '50%',
                                display: 'inline-block'
                              }} 
                            />
                            {item.color}
                          </div>
                        </td>
                        <td><Badge bg="secondary">{item.bundle}</Badge></td>
                        <td className="fw-bold">{item.expectedQuantity}</td>
                        <td>
                          <Form.Control
                            type="number"
                            min="0"
                            value={item.actualQuantity}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                            className={
                              item.difference !== null 
                                ? item.difference < 0 
                                  ? 'border-danger' 
                                  : item.difference > 0 
                                    ? 'border-warning'
                                    : 'border-success'
                                : ''
                            }
                          />
                        </td>
                        <td>
                          {item.difference !== null && (
                            <Badge bg={
                              item.difference < 0 
                                ? 'danger' 
                                : item.difference > 0 
                                  ? 'warning'
                                  : 'success'
                            }>
                              {item.difference === 0 
                                ? 'Correct' 
                                : item.difference < 0 
                                  ? `${Math.abs(item.difference)} piece${Math.abs(item.difference) !== 1 ? 's' : ''} missing` 
                                  : `${item.difference} piece${item.difference !== 1 ? 's' : ''} extra`
                              }
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <div className="d-flex justify-content-between mt-4">
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => {
                      setSelectedStock(null);
                      setProcessData([]);
                      setWorkerName('');
                    }}
                    className="d-flex align-items-center"
                  >
                    <FaTimes className="me-2" />
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleSubmit}
                    disabled={loading || processData.some(item => item.actualQuantity === '') || !workerName.trim()}
                    className="d-flex align-items-center"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave className="me-2" />
                        Save Output Data
                      </>
                    )}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default ProcessOutput;
