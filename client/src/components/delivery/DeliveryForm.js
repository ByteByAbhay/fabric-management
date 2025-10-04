import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaSave, FaPlus, FaTrash } from 'react-icons/fa';

const DeliveryForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [processOutputs, setProcessOutputs] = useState([]);
  const [formData, setFormData] = useState({
    deliveryNumber: '',
    customerName: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    items: [],
    remarks: '',
    createdBy: ''
  });

  // Generate a unique delivery number when component mounts
  useEffect(() => {
    generateDeliveryNumber();
    fetchAvailableProcessOutputs();
  }, []);

  const generateDeliveryNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const deliveryNumber = `DEL-${year}${month}${day}-${random}`;
    
    setFormData(prev => ({
      ...prev,
      deliveryNumber
    }));
  };

  const fetchAvailableProcessOutputs = async () => {
    try {
      // TEMPORARY: Using mock data since the /api/process/output endpoint may not be available in the deployed backend
      // This will be replaced with the actual API call once the backend is redeployed
      // const response = await axios.get('/api/process/output');
      
      // Mock process outputs data
      const mockProcessOutputs = [
        { _id: 'mock1', lotNo: 'LOT-001', pattern: 'Pattern A', size: 'M', color: 'Blue', quantity: 100 },
        { _id: 'mock2', lotNo: 'LOT-002', pattern: 'Pattern B', size: 'L', color: 'Red', quantity: 150 },
        { _id: 'mock3', lotNo: 'LOT-003', pattern: 'Pattern C', size: 'S', color: 'Green', quantity: 75 }
      ];
      
      setProcessOutputs(mockProcessOutputs);
    } catch (err) {
      console.error('Error fetching process outputs:', err);
      setError('Failed to load available process outputs. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          lotNo: '',
          pattern: '',
          size: '',
          color: '',
          quantity: 1,
          processOutputId: ''
        }
      ]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };
      return {
        ...prev,
        items: updatedItems
      };
    });
  };

  const handleProcessOutputSelect = (index, processOutputId) => {
    if (!processOutputId) return;
    
    const selectedOutput = processOutputs.find(output => output._id === processOutputId);
    if (!selectedOutput) return;
    
    // Find the process item with the highest actual quantity
    const processItem = selectedOutput.processItems.reduce((prev, current) => 
      (current.actualQuantity > prev.actualQuantity) ? current : prev
    );
    
    setFormData(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        lotNo: selectedOutput.lotNo,
        pattern: selectedOutput.pattern,
        size: selectedOutput.size,
        color: processItem.color,
        quantity: processItem.actualQuantity,
        processOutputId: selectedOutput._id
      };
      return {
        ...prev,
        items: updatedItems
      };
    });
  };

  const validateForm = () => {
    if (!formData.deliveryNumber.trim()) {
      setError('Delivery number is required.');
      return false;
    }
    
    if (!formData.customerName.trim()) {
      setError('Customer name is required.');
      return false;
    }
    
    if (!formData.deliveryDate) {
      setError('Delivery date is required.');
      return false;
    }
    
    if (formData.items.length === 0) {
      setError('At least one item is required.');
      return false;
    }
    
    for (const [index, item] of formData.items.entries()) {
      if (!item.lotNo.trim()) {
        setError(`Lot number is required for item #${index + 1}.`);
        return false;
      }
      
      if (!item.pattern.trim()) {
        setError(`Pattern is required for item #${index + 1}.`);
        return false;
      }
      
      if (!item.size.trim()) {
        setError(`Size is required for item #${index + 1}.`);
        return false;
      }
      
      if (!item.color.trim()) {
        setError(`Color is required for item #${index + 1}.`);
        return false;
      }
      
      if (!item.quantity || item.quantity <= 0) {
        setError(`Quantity must be greater than 0 for item #${index + 1}.`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // TEMPORARY: Using mock implementation since the /api/delivery endpoint is not available in the deployed backend
      // This will be replaced with the actual API call once the backend is redeployed
      // const response = await axios.post('/api/delivery', formData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful response
      const mockResponse = {
        data: {
          success: true,
          message: 'Delivery created successfully!',
          data: { ...formData, _id: 'mock-delivery-id-' + Date.now() }
        }
      };
      
      setSuccess('Delivery created successfully! (Mock Implementation)');
      setFormData({
        deliveryNumber: '',
        customerName: '',
        deliveryDate: new Date().toISOString().split('T')[0],
        items: [],
        remarks: '',
        createdBy: ''
      });
      
      // Generate a new delivery number for the next entry
      generateDeliveryNumber();
      
      // Refresh available process outputs
      fetchAvailableProcessOutputs();
      
      // Navigate to delivery list after a short delay
      setTimeout(() => {
        navigate('/delivery');
      }, 2000);
    } catch (err) {
      console.error('Error creating delivery:', err);
      setError(err.response?.data?.message || 'Failed to create delivery. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1>Create New Delivery</h1>
          <p className="text-muted">Enter delivery details and add items</p>
        </Col>
        <Col xs="auto" className="d-flex align-items-center">
          <Button variant="outline-secondary" onClick={() => navigate('/delivery')}>
            Back to Deliveries
          </Button>
        </Col>
      </Row>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
          {success}
        </Alert>
      )}
      
      <Form onSubmit={handleSubmit}>
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Delivery Information</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Delivery Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="deliveryNumber"
                    value={formData.deliveryNumber}
                    onChange={handleInputChange}
                    required
                    readOnly
                  />
                  <Form.Text className="text-muted">
                    Auto-generated delivery number
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Customer Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Delivery Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Remarks</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Created By</Form.Label>
                  <Form.Control
                    type="text"
                    name="createdBy"
                    value={formData.createdBy}
                    onChange={handleInputChange}
                    placeholder="Optional"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        
        <Card className="mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Delivery Items</h5>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={addItem}
              disabled={loading}
            >
              <FaPlus className="me-1" /> Add Item
            </Button>
          </Card.Header>
          <Card.Body>
            {formData.items.length === 0 ? (
              <Alert variant="info">
                No items added yet. Click "Add Item" to add delivery items.
              </Alert>
            ) : (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Process Output</th>
                    <th>Lot No</th>
                    <th>Pattern</th>
                    <th>Size</th>
                    <th>Color</th>
                    <th>Quantity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        <Form.Select
                          value={item.processOutputId}
                          onChange={(e) => handleProcessOutputSelect(index, e.target.value)}
                        >
                          <option value="">Select Process Output</option>
                          {processOutputs.map(output => (
                            <option key={output._id} value={output._id}>
                              {output.lotNo} - {output.size} - {output.processItems.map(p => p.color).join(', ')}
                            </option>
                          ))}
                        </Form.Select>
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          value={item.lotNo}
                          onChange={(e) => handleItemChange(index, 'lotNo', e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          value={item.pattern}
                          onChange={(e) => handleItemChange(index, 'pattern', e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          value={item.size}
                          onChange={(e) => handleItemChange(index, 'size', e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          value={item.color}
                          onChange={(e) => handleItemChange(index, 'color', e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || '')}
                          required
                        />
                      </td>
                      <td>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removeItem(index)}
                          disabled={loading}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
        
        <div className="d-flex justify-content-end">
          <Button
            variant="secondary"
            className="me-2"
            onClick={() => navigate('/delivery')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
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
                Save Delivery
              </>
            )}
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default DeliveryForm;
