import React, { useState, useRef, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Alert, InputGroup, Badge, Spinner, Container } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
// Color picker removed as requested
import { BsTrash, BsPlus, BsCheck2, BsArrowLeft, BsPalette } from 'react-icons/bs';

// Common colors with their hex values for quick selection
const COMMON_COLORS = [
  { name: 'Red', hex: '#FF0000' },
  { name: 'Green', hex: '#008000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Pink', hex: '#FFC0CB' },
  { name: 'Brown', hex: '#A52A2A' },
  { name: 'Grey', hex: '#808080' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Teal', hex: '#008080' },
  { name: 'Maroon', hex: '#800000' },
  { name: 'Olive', hex: '#808000' },
];

// Function to get contrasting text color for a background
const getContrastColor = (hexColor) => {
  // Remove the # if it exists
  hexColor = hexColor?.replace('#', '') || '000000';
  
  // Parse the hex color
  const r = parseInt(hexColor.substr(0, 2), 16);
  const g = parseInt(hexColor.substr(2, 2), 16);
  const b = parseInt(hexColor.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black or white depending on background brightness
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

// Function to format date for input field
const formatDateForInput = (date) => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

const PartyFormUpdated = ({ initialVendorData = null, partyId = null, isEditMode = false }) => {
  const navigate = useNavigate();
  const { id: urlId } = useParams();
  const effectiveId = partyId || urlId;
  const effectiveIsEditMode = isEditMode || !!effectiveId;
  
  // Debug information
  console.log('PartyFormUpdated component loaded');
  console.log('Props:', { initialVendorData, partyId, isEditMode });
  console.log('URL params:', { urlId });
  console.log('Effective values:', { effectiveId, effectiveIsEditMode });
  
  // State for form data
  const [formData, setFormData] = useState({
    shop_name: '',
    party_name: '',
    bill_no: '',
    contact_number: '',
    address: '',
    gstin: '',
    date_time: formatDateForInput(new Date()),
    // Payment fields removed as requested
    fabricDetails: [
      {
        name: '',
        type: '',
        weight_type: 'kg',
        total_weight: '',
        remarks: '',
        fabricColors: [
          {
            color_name: '',
            color_weight: ''
          }
        ]
      }
    ]
  });
  
  // UI state
  // Color picker removed as requested
  const [availableFabrics, setAvailableFabrics] = useState([]);
  const [availableColors, setAvailableColors] = useState({});
  const [suggestedColors, setSuggestedColors] = useState([]);
  const nextColorInputRef = useRef(null);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(effectiveIsEditMode && !initialVendorData);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Use initialVendorData if provided, otherwise fetch from API
  useEffect(() => {
    const processVendorData = (partyData) => {
      // Format date for input field
      partyData.date_time = formatDateForInput(partyData.date_time);
      
      // Ensure all color_hex values are set
      if (partyData.fabricDetails && Array.isArray(partyData.fabricDetails)) {
        partyData.fabricDetails.forEach(fabric => {
          if (fabric.fabricColors && Array.isArray(fabric.fabricColors)) {
            fabric.fabricColors.forEach(color => {
              if (!color.color_hex) {
                color.color_hex = '#3498db'; // Default blue color
              }
            });
          }
        });
      }
      
      console.log('Processed party data for form:', partyData);
      setFormData(partyData);
    };
    
    // If initialVendorData is provided, use it directly
    if (initialVendorData) {
      console.log('Using provided initialVendorData:', initialVendorData);
      processVendorData({...initialVendorData});
      return;
    }
    
    // Otherwise fetch from API if in edit mode
    if (effectiveIsEditMode && effectiveId) {
      const fetchVendorData = async () => {
        try {
          setInitialLoading(true);
          console.log(`Fetching party data for ID: ${effectiveId}`);
          
          // Temporarily using /api/vendors endpoint until backend deployment is updated
          const response = await axios.get(`/api/vendors/${effectiveId}`);
          console.log('Vendor data response:', response.data);
          
          if (response.data.success) {
            processVendorData(response.data.data);
          } else {
            setError('Failed to load party data: ' + (response.data.message || 'Unknown error'));
          }
          setInitialLoading(false);
        } catch (err) {
          console.error('Error fetching party data:', err);
          setError('Failed to load party data. Please try again.');
          setInitialLoading(false);
        }
      };
      fetchVendorData();
    }
  }, [effectiveId, effectiveIsEditMode, initialVendorData]);
  
  // Fetch available fabric types and colors for suggestions
  useEffect(() => {
    const fetchFabricData = async () => {
      try {
        // Get fabric types
        const typesResponse = await axios.get('/api/parties/fabric-types');
        if (typesResponse.data.success) {
          setAvailableFabrics(typesResponse.data.data);
        }
        
        // Get fabric colors
        const colorsResponse = await axios.get('/api/parties/fabric-colors');
        if (colorsResponse.data.success) {
          setAvailableColors(colorsResponse.data.data);
        }
      } catch (err) {
        console.error('Error fetching fabric data:', err);
      }
    };
    fetchFabricData();
  }, []);
  
  // Generate suggested colors based on selected fabric
  useEffect(() => {
    const generateSuggestedColors = () => {
      const allSuggestions = [];
      
      // Add colors from available fabrics
      formData.fabricDetails.forEach(fabric => {
        if (fabric.name && availableColors[fabric.name]) {
          availableColors[fabric.name].forEach(color => {
            if (!allSuggestions.some(c => c.name === color.color_name)) {
              allSuggestions.push({
                name: color.color_name,
                hex: color.color_hex || '#000000',
                weight: color.standard_weight || 0
              });
            }
          });
        }
      });
      
      // Add common colors if we don't have enough suggestions
      if (allSuggestions.length < 5) {
        COMMON_COLORS.forEach(color => {
          if (!allSuggestions.some(c => c.name === color.name)) {
            allSuggestions.push({
              name: color.name,
              hex: color.hex,
              weight: 0
            });
          }
        });
      }
      
      setSuggestedColors(allSuggestions.slice(0, 10)); // Limit to 10 suggestions
    };
    
    generateSuggestedColors();
  }, [formData.fabricDetails, availableColors]);

  // Handle base form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle fabric detail field changes
  const handleFabricChange = (fabricIndex, e) => {
    const { name, value } = e.target;
    const updatedFabrics = [...formData.fabricDetails];
    
    // Special handling for fabric name to auto-suggest fabric type
    if (name === 'name' && value) {
      // Look for matching fabric in available fabrics
      const matchingFabric = availableFabrics.find(f => 
        f.name.toLowerCase() === value.toLowerCase());
      
      if (matchingFabric) {
        // Auto-populate the fabric type
        updatedFabrics[fabricIndex] = {
          ...updatedFabrics[fabricIndex],
          name: value,
          type: matchingFabric.type || updatedFabrics[fabricIndex].type
        };
      } else {
        updatedFabrics[fabricIndex] = {
          ...updatedFabrics[fabricIndex],
          [name]: value
        };
      }
    } else {
      updatedFabrics[fabricIndex] = {
        ...updatedFabrics[fabricIndex],
        [name]: value
      };
    }
    
    // Update total weight whenever fabric details change
    updatedFabrics[fabricIndex].total_weight = calculateTotalWeight(fabricIndex, updatedFabrics);
    
    setFormData(prev => ({
      ...prev,
      fabricDetails: updatedFabrics
    }));
  };

  // Handle color field changes within a fabric
  const handleColorChange = (fabricIndex, colorIndex, e) => {
    const { name, value } = e.target;
    const updatedFabrics = [...formData.fabricDetails];
    updatedFabrics[fabricIndex].fabricColors[colorIndex] = {
      ...updatedFabrics[fabricIndex].fabricColors[colorIndex],
      [name]: value
    };
    
    // If this is the last color and both name and weight are filled, add a new color automatically
    const currentColor = updatedFabrics[fabricIndex].fabricColors[colorIndex];
    const isLastColor = colorIndex === updatedFabrics[fabricIndex].fabricColors.length - 1;
    
    if (isLastColor && currentColor.color_name && currentColor.color_weight > 0) {
      updatedFabrics[fabricIndex].fabricColors.push({
        color_name: '',
        color_hex: '#3498db',
        color_weight: ''
      });
    }
    
    // Update total weight
    updatedFabrics[fabricIndex].total_weight = calculateTotalWeight(fabricIndex, updatedFabrics);
    
    setFormData(prev => ({
      ...prev,
      fabricDetails: updatedFabrics
    }));
  };

  // Handle color selection from suggested colors
  const handleColorSelect = (fabricIndex, colorIndex, selectedColor) => {
    const updatedFabrics = [...formData.fabricDetails];
    
    // Update color name and hex
    updatedFabrics[fabricIndex].fabricColors[colorIndex] = {
      ...updatedFabrics[fabricIndex].fabricColors[colorIndex],
      color_name: selectedColor.name,
      color_hex: selectedColor.hex
    };
    
    // Auto-populate weight if available
    if (selectedColor.weight > 0) {
      updatedFabrics[fabricIndex].fabricColors[colorIndex].color_weight = selectedColor.weight;
    }
    
    // Update total weight
    updatedFabrics[fabricIndex].total_weight = calculateTotalWeight(fabricIndex, updatedFabrics);
    
    // If this is the last color and it now has a name, add a new empty color
    const isLastColor = colorIndex === updatedFabrics[fabricIndex].fabricColors.length - 1;
    if (isLastColor && selectedColor.name) {
      // Only add a new color if this one has a weight
      if (updatedFabrics[fabricIndex].fabricColors[colorIndex].color_weight) {
        updatedFabrics[fabricIndex].fabricColors.push({
          color_name: '',
          color_hex: '#3498db',
          color_weight: ''
        });
      }
      
      // Focus on the weight input of the current color if it's empty
      setTimeout(() => {
        const weightInput = document.querySelector(`#color-weight-${fabricIndex}-${colorIndex}`);
        if (weightInput && !updatedFabrics[fabricIndex].fabricColors[colorIndex].color_weight) {
          weightInput.focus();
        }
      }, 0);
    }
    
    setFormData(prev => ({
      ...prev,
      fabricDetails: updatedFabrics
    }));
    
    // Color picker functionality has been removed
  };

  // Add new fabric detail field
  const addFabric = () => {
    setFormData(prev => ({
      ...prev,
      fabricDetails: [
        ...prev.fabricDetails, 
        {
          name: '',
          type: '',
          weight_type: 'kg',
          total_weight: 0,
          remarks: '',
          fabricColors: [
            {
              color_name: '',
              color_hex: '#3498db',
              color_weight: ''
            }
          ]
        }
      ]
    }));
  };

  // Remove fabric detail field
  const removeFabric = (index) => {
    if (formData.fabricDetails.length <= 1) {
      setError('At least one fabric is required');
      return;
    }
    
    const updatedFabrics = [...formData.fabricDetails];
    updatedFabrics.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      fabricDetails: updatedFabrics
    }));
  };

  // Add new color field to fabric
  const addColor = (fabricIndex) => {
    const updatedFabrics = [...formData.fabricDetails];
    updatedFabrics[fabricIndex].fabricColors.push({
      color_name: '',
      color_hex: '#3498db',
      color_weight: ''
    });
    
    setFormData(prev => ({
      ...prev,
      fabricDetails: updatedFabrics
    }));
    
    // Focus on the new color input after rendering
    setTimeout(() => {
      if (nextColorInputRef.current) {
        nextColorInputRef.current.focus();
      }
    }, 100);
  };

  // Remove color field from fabric
  const removeColor = (fabricIndex, colorIndex) => {
    const updatedFabrics = [...formData.fabricDetails];
    
    // Prevent removing the last color
    if (updatedFabrics[fabricIndex].fabricColors.length <= 1) {
      setError('At least one color is required for each fabric');
      return;
    }
    
    updatedFabrics[fabricIndex].fabricColors.splice(colorIndex, 1);
    
    // Update total weight
    updatedFabrics[fabricIndex].total_weight = calculateTotalWeight(fabricIndex, updatedFabrics);
    
    setFormData(prev => ({
      ...prev,
      fabricDetails: updatedFabrics
    }));
  };

  // Calculate total weight based on all colors
  const calculateTotalWeight = (fabricIndex, fabricsArray = formData.fabricDetails) => {
    return fabricsArray[fabricIndex].fabricColors.reduce(
      (total, color) => total + (parseFloat(color.color_weight) || 0), 0
    );
  };

  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    // Validate form
    if (!formData.shop_name || !formData.party_name || !formData.bill_no) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }
    
    // Validate fabrics
    for (const fabric of formData.fabricDetails) {
      if (!fabric.name || !fabric.type) {
        setError('Please fill in all fabric details');
        setLoading(false);
        return;
      }
      
      // Validate colors
      for (const color of fabric.fabricColors) {
        if (!color.color_name || !color.color_weight) {
          setError('Please fill in all color details');
          setLoading(false);
          return;
        }
      }
    }
    
    // Calculate total weights for each fabric
    const updatedFormData = {
      ...formData,
      fabricDetails: formData.fabricDetails.map(fabric => {
        // Calculate total weight for this fabric from all colors
        const totalWeight = fabric.fabricColors.reduce(
          (total, color) => total + (parseFloat(color.color_weight) || 0), 0
        );
        
        console.log(`Calculated total weight for ${fabric.name}: ${totalWeight}`);
        
        return {
          ...fabric,
          total_weight: totalWeight
        };
      })
    };
    
    // Calculate the overall total weight across all fabrics
    const totalFabricWeight = updatedFormData.fabricDetails.reduce(
      (total, fabric) => total + fabric.total_weight, 0
    );
    
    console.log(`Total fabric weight across all fabrics: ${totalFabricWeight}`);
    updatedFormData.totalWeight = totalFabricWeight;
    
    // Ensure all color_hex values are properly set
    updatedFormData.fabricDetails.forEach(fabric => {
      fabric.fabricColors.forEach(color => {
        // Make sure color_hex is not empty
        if (!color.color_hex) {
          color.color_hex = '#3498db'; // Default blue color
        }
      });
    });
    
    console.log('Submitting party data:', updatedFormData);
    
    // Use the new editVendor endpoint for updates, regular endpoint for creates
    let apiCall;
    if (effectiveIsEditMode) {
      // Temporarily using /api/vendors endpoint until backend deployment is updated
      apiCall = axios.post(`/api/vendors/edit/${effectiveId}`, updatedFormData);
      console.log(`Using enhanced edit endpoint: /api/vendors/edit/${effectiveId}`);
    } else {
      // Temporarily using /api/vendors endpoint until backend deployment is updated
      apiCall = axios.post('/api/vendors', updatedFormData);
      console.log('Using create endpoint: /api/vendors');
    }
    
    apiCall
      .then(response => {
        console.log('API response:', response.data);
        setLoading(false);
        
        if (isEditMode) {
          setSuccess('Vendor updated successfully');
        } else {
          setSuccess('Vendor created successfully');
        }
        
        // Show success message for 1.5 seconds before navigating
        setTimeout(() => navigate('/fabric-income'), 1500);
      })
      .catch(err => {
        console.error('Error saving party:', err);
        setLoading(false);
        setError(err.response?.data?.message || 'Failed to save party');
      });
  };

  if (initialLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading party data...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-light">
          <h4 className="mb-0">{isEditMode ? 'Edit Vendor' : 'Add New Vendor'}</h4>
        </Card.Header>
        <Card.Body>
          {error && (
            <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert variant="success" className="mb-4" dismissible onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}
          
          <Form onSubmit={handleSubmit}>
            {/* Vendor Information Section */}
            <Card className="mb-4 border-light">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Vendor Information</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Shop Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="shop_name"
                        value={formData.shop_name}
                        onChange={handleChange}
                        required
                        placeholder="Enter shop name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Party Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="party_name"
                        value={formData.party_name}
                        onChange={handleChange}
                        required
                        placeholder="Enter party name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Bill Number <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="bill_no"
                        value={formData.bill_no}
                        onChange={handleChange}
                        required
                        placeholder="Enter bill number"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="date"
                        name="date_time"
                        value={formData.date_time}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Contact Number</Form.Label>
                      <Form.Control
                        type="text"
                        name="contact_number"
                        value={formData.contact_number}
                        onChange={handleChange}
                        placeholder="Enter contact number"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>GSTIN</Form.Label>
                      <Form.Control
                        type="text"
                        name="gstin"
                        value={formData.gstin}
                        onChange={handleChange}
                        placeholder="Enter GSTIN number"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Enter address"
                      />
                    </Form.Group>
                  </Col>
                  {/* Payment status field removed as requested */}
                </Row>
              </Card.Body>
            </Card>
            
            {/* Fabric Details Section */}
            {formData.fabricDetails.map((fabric, fabricIndex) => (
              <Card key={fabricIndex} className="mb-4 border-light">
                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Fabric Details {fabricIndex + 1}</h5>
                  {formData.fabricDetails.length > 1 && (
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      className="d-flex align-items-center justify-content-center gap-2 shadow-sm"
                      style={{
                        borderRadius: '4px',
                        padding: '6px 12px',
                        transition: 'all 0.2s ease',
                        borderColor: '#dc3545',
                        color: '#dc3545',
                        fontWeight: '500'
                      }}
                      onClick={() => removeFabric(fabricIndex)}
                    >
                      <BsTrash size={14} /> Remove
                    </Button>
                  )}
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Fabric Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={fabric.name}
                          onChange={e => handleFabricChange(fabricIndex, e)}
                          required
                          placeholder="Enter fabric name"
                          list={`fabric-list-${fabricIndex}`}
                        />
                        <datalist id={`fabric-list-${fabricIndex}`}>
                          {availableFabrics.map((f, i) => (
                            <option key={i} value={f.name} />
                          ))}
                        </datalist>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Fabric Type <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          name="type"
                          value={fabric.type}
                          onChange={e => handleFabricChange(fabricIndex, e)}
                          required
                          placeholder="Enter fabric type"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Weight Type <span className="text-danger">*</span></Form.Label>
                        <Form.Select
                          name="weight_type"
                          value={fabric.weight_type}
                          onChange={e => handleFabricChange(fabricIndex, e)}
                          required
                        >
                          <option value="kg">Kilogram (kg)</option>
                          <option value="meter">Meter (m)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <h6 className="mt-4 mb-3">Fabric Colors</h6>
                  
                  {/* Suggested Colors */}
                  <div className="mb-3">
                    <p className="text-muted small mb-2">Common colors (click to select):</p>
                    <div className="d-flex flex-wrap gap-2">
                      {COMMON_COLORS.map((commonColor, i) => (
                        <Badge 
                          key={i} 
                          bg="light" 
                          text="dark" 
                          style={{
                            backgroundColor: commonColor.hex,
                            color: getContrastColor(commonColor.hex),
                            cursor: 'pointer',
                            padding: '8px 12px',
                            border: '1px solid #dee2e6',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            fontSize: '0.9rem'
                          }}
                          className="d-flex align-items-center"
                          onClick={() => {
                            // Find the first empty color or the last color
                            const colorIndex = fabric.fabricColors.findIndex(c => !c.color_name) !== -1 ?
                              fabric.fabricColors.findIndex(c => !c.color_name) :
                              fabric.fabricColors.length - 1;
                            handleColorSelect(fabricIndex, colorIndex, { 
                              name: commonColor.name, 
                              hex: commonColor.hex 
                            });
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                          }}
                        >
                          {commonColor.name}
                        </Badge>
                      ))}
                    </div>
                    
                    {suggestedColors.length > 0 && (
                      <div className="mt-3">
                        <p className="text-muted small mb-2">Suggested colors from this fabric:</p>
                        <div className="d-flex flex-wrap gap-2">
                          {suggestedColors.map((suggestedColor, i) => (
                            <Badge 
                              key={i} 
                              bg="light" 
                              text="dark" 
                              style={{
                                backgroundColor: suggestedColor.hex,
                                color: getContrastColor(suggestedColor.hex),
                                cursor: 'pointer',
                                padding: '8px 12px',
                                border: '1px solid #dee2e6',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                fontSize: '0.9rem'
                              }}
                              className="d-flex align-items-center"
                              onClick={() => {
                                // Find the first empty color or the last color
                                const colorIndex = fabric.fabricColors.findIndex(c => !c.color_name) !== -1 ?
                                  fabric.fabricColors.findIndex(c => !c.color_name) :
                                  fabric.fabricColors.length - 1;
                                handleColorSelect(fabricIndex, colorIndex, suggestedColor);
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                              }}
                            >
                              {suggestedColor.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Color Input Fields */}
                  {fabric.fabricColors.map((color, colorIndex) => (
                    <Card key={colorIndex} className="mb-3 border-light">
                      <Card.Body className="py-3">
                        <Row className="align-items-center">
                          <Col md={3}>
                            <Form.Group>
                              <Form.Label>Color Name <span className="text-danger">*</span></Form.Label>
                              <Form.Control
                                type="text"
                                name="color_name"
                                value={color.color_name}
                                onChange={e => handleColorChange(fabricIndex, colorIndex, e)}
                                required
                                placeholder="Enter color name"
                                ref={colorIndex === fabric.fabricColors.length - 1 ? nextColorInputRef : null}
                              />
                            </Form.Group>
                          </Col>
                           {/* Color picker replaced with text-based color name input */}
                          <Col md={3}>
                            <Form.Group>
                              <Form.Label>Weight ({fabric.weight_type}) <span className="text-danger">*</span></Form.Label>
                              <InputGroup>
                                <Form.Control
                                  id={`color-weight-${fabricIndex}-${colorIndex}`}
                                  type="number"
                                  name="color_weight"
                                  value={color.color_weight}
                                  onChange={e => handleColorChange(fabricIndex, colorIndex, e)}
                                  required
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                />
                                <InputGroup.Text>{fabric.weight_type}</InputGroup.Text>
                              </InputGroup>
                            </Form.Group>
                          </Col>
                          <Col md={3} className="d-flex align-items-end">
                            {fabric.fabricColors.length > 1 && (
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                className="d-flex align-items-center justify-content-center shadow-sm"
                                style={{
                                  borderRadius: '4px',
                                  padding: '6px 12px',
                                  transition: 'all 0.2s ease',
                                  borderColor: '#dc3545',
                                  color: '#dc3545',
                                  fontWeight: '500',
                                  width: '100%',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                                onClick={() => removeColor(fabricIndex, colorIndex)}
                              >
                                <BsTrash size={14} className="me-1" /> Remove
                              </Button>
                            )}
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                  
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => addColor(fabricIndex)}
                    className="mt-2 d-flex align-items-center shadow-sm"
                    style={{
                      borderRadius: '4px',
                      padding: '6px 12px',
                      transition: 'all 0.2s ease',
                      fontWeight: '500'
                    }}
                  >
                    <BsPlus className="me-1" /> Add Another Color
                  </Button>
                  
                  <Row className="mt-4">
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Total Weight</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type="number"
                            value={calculateTotalWeight(fabricIndex)}
                            readOnly
                            className="bg-light"
                          />
                          <InputGroup.Text>{fabric.weight_type}</InputGroup.Text>
                        </InputGroup>
                        <Form.Text className="text-muted">
                          Automatically calculated from colors
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Remarks</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          name="remarks"
                          value={fabric.remarks}
                          onChange={e => handleFabricChange(fabricIndex, e)}
                          placeholder="Optional notes about this fabric"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}
            
            <div className="mb-4">
              <Button 
                variant="outline-primary" 
                onClick={addFabric}
                className="d-flex align-items-center shadow-sm"
                style={{
                  borderRadius: '6px',
                  padding: '8px 16px',
                  transition: 'all 0.2s ease',
                  fontWeight: '500'
                }}
              >
                <BsPlus className="me-1" size={18} /> Add Another Fabric
              </Button>
            </div>
            
            <div className="d-flex justify-content-between">
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate('/fabric-income')}
                className="d-flex align-items-center px-4 py-2 shadow-sm"
                style={{
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                  fontWeight: '500',
                  backgroundColor: '#f8f9fa',
                  borderColor: '#dee2e6'
                }}
                disabled={loading}
              >
                <BsArrowLeft className="me-2" /> Back to Vendors
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading}
                className="d-flex align-items-center px-4 py-2 shadow-sm"
                style={{
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                  fontWeight: '500',
                  backgroundColor: isEditMode ? '#28a745' : '#007bff',
                  borderColor: isEditMode ? '#28a745' : '#007bff'
                }}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    {isEditMode ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <BsCheck2 className="me-2" /> {isEditMode ? 'Update Vendor' : 'Save Vendor'}
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PartyFormUpdated;
