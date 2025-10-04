import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Alert, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BeforeCuttingForm = () => {
  const navigate = useNavigate();
  
  // Function to generate role number
  const generateRoleNumber = (index) => {
    return index + 1;
  };

  const [formData, setFormData] = useState({
    lot_no: '',
    pattern: '',
    fabric: '',
    datetime: new Date().toISOString().split('T')[0],
    sizes: [''],
    roles: [
      {
        role_no: generateRoleNumber(0),
        role_weight: 0,
        role_color: ''
      }
    ]
  });
  
  const [availableFabrics, setAvailableFabrics] = useState([]);
  const [availableColors, setAvailableColors] = useState({});
  const [colorWeights, setColorWeights] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFabricData = async () => {
      try {
        const response = await axios.get('/api/stock');
        console.log('Stock data received:', response.data.data);
        
        if (!response.data.data || !Array.isArray(response.data.data)) {
          console.error('Invalid stock data format:', response.data);
          setError('Invalid stock data received');
          setFetchingData(false);
          return;
        }
        
        // Extract unique fabric names
        const fabrics = [...new Set(response.data.data.map(item => item.fabric_name))];
        setAvailableFabrics(fabrics);
        
        // Create mapping of fabric name to available colors
        const colorMap = {};
        const weightMap = {};
        
        // Process the stock data
        response.data.data.forEach(item => {
          const fabricName = item.fabric_name;
          const color = item.color;
          const weight = Number(item.standard_weight) || 0;
          
          // Initialize arrays and objects if they don't exist
          if (!colorMap[fabricName]) {
            colorMap[fabricName] = [];
          }
          if (!weightMap[fabricName]) {
            weightMap[fabricName] = {};
          }
          
          // Add color to the list if not already there
          if (!colorMap[fabricName].includes(color)) {
            colorMap[fabricName].push(color);
          }
          
          // Store the weight
          weightMap[fabricName][color] = weight;
          
          console.log(`Processed: ${fabricName}/${color} with weight ${weight}`);
        });
        
        setAvailableColors(colorMap);
        setColorWeights(weightMap);
        
        console.log('Available colors:', colorMap);
        console.log('Color weights:', weightMap);
        
        setFetchingData(false);
      } catch (err) {
        console.error('Error fetching fabric data:', err);
        setError('Failed to fetch fabric data: ' + (err.message || 'Unknown error'));
        setFetchingData(false);
      }
    };
    
    fetchFabricData();
  }, []);

  // Handle change in form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update the form field
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // If fabric is changed, update available colors and reset weights
    if (name === 'fabric' && value) {
      console.log(`Fabric changed to: ${value}`);
      const colors = availableColors[value] || [];
      
      // Reset roles with the new fabric
      setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          roles: prev.roles.map(role => ({
            ...role,
            role_color: colors.includes(role.role_color) ? role.role_color : '',
            // Reset weights when fabric changes
            role_weight: colors.includes(role.role_color) && 
                        colorWeights[value] && 
                        colorWeights[value][role.role_color] ? 
                        Number(colorWeights[value][role.role_color]) : 0
          }))
        }));
      }, 0);
    }
  };

  // Handle size field changes
  const handleSizeChange = (index, value) => {
    const updatedSizes = [...formData.sizes];
    updatedSizes[index] = value;
    
    // If this is the last size field and it's not empty, add a new empty size field
    if (index === updatedSizes.length - 1 && value.trim() !== '') {
      updatedSizes.push('');
    }
    
    setFormData(prev => ({
      ...prev,
      sizes: updatedSizes
    }));
  };

  // Add new size field
  const addSize = () => {
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, '']
    }));
  };

  // Remove size field
  const removeSize = (index) => {
    const updatedSizes = [...formData.sizes];
    updatedSizes.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      sizes: updatedSizes
    }));
  };

  // Handle role field changes
  const handleRoleChange = (roleIndex, e) => {
    const { name, value } = e.target;
    
    // Make a deep copy of the roles array to avoid state mutation issues
    const updatedRoles = JSON.parse(JSON.stringify(formData.roles));
    
    // If color is being changed, auto-populate the weight if available
    if (name === 'role_color' && value !== '') {
      const selectedFabric = formData.fabric;
      const selectedColor = value;
      
      console.log(`Color selected: ${selectedColor} for fabric: ${selectedFabric}`);
      console.log('Available weights:', JSON.stringify(colorWeights));
      
      // First update the color
      updatedRoles[roleIndex].role_color = selectedColor;
      
      // Then check if we have a standard weight for this fabric and color
      if (selectedFabric && 
          colorWeights[selectedFabric] && 
          colorWeights[selectedFabric][selectedColor]) {
        
        const standardWeight = Number(colorWeights[selectedFabric][selectedColor]);
        console.log(`Found standard weight: ${standardWeight}`);
        
        if (standardWeight > 0) {
          // Update the weight
          updatedRoles[roleIndex].role_weight = standardWeight;
          console.log(`Auto-populated weight ${standardWeight} for ${selectedFabric} - ${selectedColor}`);
        } else {
          console.log(`Standard weight is zero or invalid: ${standardWeight}`);
        }
      } else {
        console.log(`No standard weight found for ${selectedFabric}/${selectedColor}`);
        // Weight stays as is
      }
    } else {
      // For other fields, just update normally
      updatedRoles[roleIndex][name] = value;
    }
    
    // If this is the last role and both weight and color are filled, add a new role
    if (roleIndex === updatedRoles.length - 1) {
      const currentRole = updatedRoles[roleIndex];
      if (currentRole.role_weight > 0 && currentRole.role_color.trim() !== '') {
        updatedRoles.push({
          role_no: generateRoleNumber(updatedRoles.length),
          role_weight: 0,
          role_color: ''
        });
      }
    }
    
    // Update the form data with the new roles array
    setFormData(prev => ({
      ...prev,
      roles: updatedRoles
    }));
  };

  // Add new role
  const addRole = () => {
    setFormData(prev => ({
      ...prev,
      roles: [
        ...prev.roles,
        {
          role_no: generateRoleNumber(prev.roles.length),
          role_weight: 0,
          role_color: ''
        }
      ]
    }));
  };

  // Remove role field
  const removeRole = (index) => {
    const updatedRoles = [...formData.roles];
    updatedRoles.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      roles: updatedRoles
    }));
  };

  // Get available colors for the selected fabric
  const getAvailableColors = () => {
    return formData.fabric ? availableColors[formData.fabric] || [] : [];
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Filter out empty size fields
      const filteredSizes = formData.sizes.filter(size => size.trim() !== '');
      
      if (filteredSizes.length === 0) {
        setError('Please add at least one size.');
        setLoading(false);
        return;
      }
      
      const submissionData = {
        ...formData,
        sizes: filteredSizes
      };

      await axios.post('/api/cutting/before', submissionData);
      navigate('/cutting');
    } catch (err) {
      setError('Failed to create cutting batch. Please check your inputs and try again.');
      setLoading(false);
    }
  };

  if (fetchingData) {
    return <div className="text-center my-5">Loading fabric data...</div>;
  }

  return (
    <div>
      <h1 className="mb-4">Start New Cutting</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Form onSubmit={handleSubmit}>
        <Card className="mb-4">
          <Card.Header>Cutting Information</Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Lot Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="lot_no"
                    value={formData.lot_no}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Pattern</Form.Label>
                  <Form.Control
                    type="text"
                    name="pattern"
                    value={formData.pattern}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fabric</Form.Label>
                  <Form.Select
                    name="fabric"
                    value={formData.fabric}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Fabric</option>
                    {availableFabrics.map((fabric, index) => (
                      <option key={index} value={fabric}>{fabric}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="datetime"
                    value={formData.datetime}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        
        <Card className="mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <span>Sizes</span>
            <Button variant="outline-primary" size="sm" onClick={addSize}>
              Add Size
            </Button>
          </Card.Header>
          <Card.Body>
            <ListGroup>
              {formData.sizes.map((size, index) => (
                <ListGroup.Item key={index} className="mb-2">
                  <Row className="align-items-center">
                    <Col md={10}>
                      <Form.Control
                        type="text"
                        placeholder="Enter size (e.g., S, M, L, XL)"
                        value={size}
                        onChange={(e) => handleSizeChange(index, e.target.value)}
                        required
                      />
                    </Col>
                    <Col md={2}>
                      {formData.sizes.length > 1 && (
                        <Button 
                          variant="danger" 
                          size="sm" 
                          onClick={() => removeSize(index)}
                          className="w-100"
                        >
                          Remove
                        </Button>
                      )}
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card.Body>
        </Card>
        
        <Card className="mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <span>Fabric Roles</span>
            <Button variant="outline-primary" size="sm" onClick={addRole}>
              Add Role
            </Button>
          </Card.Header>
          <Card.Body>
            {formData.roles.map((role, index) => (
              <Card key={index} className="mb-3">
                <Card.Body>
                  <Row className="align-items-end">
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Role Number</Form.Label>
                        <Form.Control
                          type="text"
                          name="role_no"
                          value={role.role_no}
                          readOnly
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Role Color</Form.Label>
                        <Form.Select
                          name="role_color"
                          value={role.role_color}
                          onChange={(e) => handleRoleChange(index, e)}
                          required
                        >
                          <option value="">Select Color</option>
                          {getAvailableColors().map((color, colorIndex) => (
                            <option key={colorIndex} value={color}>{color}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Role Weight</Form.Label>
                        <Form.Control
                          type="number"
                          name="role_weight"
                          value={role.role_weight === 0 ? '' : role.role_weight}
                          onChange={(e) => handleRoleChange(index, e)}
                          required
                          min="0"
                          step="0.01"
                          placeholder="Auto-populated from color"
                          className={role.role_color && role.role_weight > 0 ? 'bg-light' : ''}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      {formData.roles.length > 1 && (
                        <Button 
                          variant="danger" 
                          size="sm" 
                          onClick={() => removeRole(index)}
                          className="w-100 mb-3"
                        >
                          Remove
                        </Button>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}
          </Card.Body>
        </Card>
        
        <div className="d-flex justify-content-between">
          <Button variant="secondary" onClick={() => navigate('/cutting')}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Start Cutting Process'}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default BeforeCuttingForm; 