import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, ListGroup, Badge, Spinner, Alert, Table } from 'react-bootstrap';
import { BsArrowLeft, BsPencil, BsTrash, BsPrinter } from 'react-icons/bs';
import { format } from 'date-fns';
import axios from 'axios';
import PartyDeleteConfirmation from './PartyDeleteConfirmation';

const PartyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchParty();
  }, [id]);

  const fetchParty = async () => {
    try {
      setLoading(true);
      // Temporarily using /api/parties endpoint until backend deployment is updated
      const response = await axios.get(`/api/parties/${id}`);
      if (response.data.success) {
        setParty(response.data.data);
      } else {
        setError('Failed to fetch party details.');
      }
    } catch (err) {
      console.error('Error fetching party:', err);
      setError('Failed to fetch party details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const handleDeleteSuccess = (message) => {
    setShowDeleteModal(false);
    navigate('/fabric-income', { 
      state: { 
        message: message || 'Party deleted successfully', 
        type: 'success' 
      } 
    });
  };
  
  const handleDeleteError = (errorMessage) => {
    setError(errorMessage || 'Failed to delete party');
    setShowDeleteModal(false);
  };

  // Calculate total fabric weight across all fabrics
  const calculateTotalWeight = () => {
    if (!party || !party.fabricDetails || party.fabricDetails.length === 0) return 0;
    
    // Calculate the sum of all fabric weights
    const calculatedTotal = party.fabricDetails.reduce((total, fabric) => {
      // First check if the fabric has a valid total_weight
      if (fabric.total_weight !== undefined && fabric.total_weight !== null && !isNaN(parseFloat(fabric.total_weight))) {
        return total + parseFloat(fabric.total_weight);
      }
      
      // If not, calculate from the color weights
      if (fabric.fabricColors && Array.isArray(fabric.fabricColors)) {
        const fabricTotal = fabric.fabricColors.reduce((sum, color) => {
          return sum + (parseFloat(color.color_weight) || 0);
        }, 0);
        return total + fabricTotal;
      }
      
      return total;
    }, 0);
    
    console.log('Calculated total weight:', calculatedTotal);
    return calculatedTotal;
  };

  // Get a color display with a visually appropriate text color
  const getColorDisplay = (colorName, colorHex) => {
    if (!colorName) return null;
    
    // Map common color names to hex values
    const colorMap = {
      'red': '#FF0000',
      'green': '#008000',
      'blue': '#0000FF',
      'yellow': '#FFFF00',
      'black': '#000000',
      'white': '#FFFFFF',
      'purple': '#800080',
      'orange': '#FFA500',
      'pink': '#FFC0CB',
      'brown': '#A52A2A',
      'grey': '#808080',
      'gray': '#808080',
      'navy': '#000080',
      'teal': '#008080',
      'maroon': '#800000',
      'olive': '#808000',
      'light blue': '#ADD8E6',
      'dark blue': '#00008B',
      'light green': '#90EE90',
      'dark green': '#006400'
    };
    
    // Use the provided hex color or look up the color name in our map
    // If neither is available, default to a standard blue
    const bgColor = colorHex || colorMap[colorName.toLowerCase()] || '#3498db';
    
    // Calculate text color based on background brightness
    const getContrastColor = (hexColor) => {
      // Remove the # if it exists
      hexColor = hexColor.replace('#', '');
      
      // Parse the hex color
      const r = parseInt(hexColor.substr(0, 2), 16);
      const g = parseInt(hexColor.substr(2, 2), 16);
      const b = parseInt(hexColor.substr(4, 2), 16);
      
      // Calculate luminance
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      // Return black or white depending on background brightness
      return luminance > 0.5 ? '#000000' : '#ffffff';
    };
    
    const textColor = getContrastColor(bgColor);
    
    return (
      <Badge 
        className="shadow-sm"
        style={{ 
          backgroundColor: bgColor,
          color: textColor,
          minWidth: '80px',
          display: 'inline-block',
          textAlign: 'center',
          padding: '8px 12px',
          borderRadius: '4px',
          fontWeight: '500',
          fontSize: '0.9rem',
          border: textColor === '#000000' ? '1px solid #dee2e6' : 'none'
        }}
      >
        {colorName}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading party details...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex justify-content-end">
            <Button variant="outline-danger" onClick={() => navigate('/fabric-income')}>
              Back to Partys
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!party) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>Party Not Found</Alert.Heading>
          <p>The party you're looking for doesn't exist or has been removed.</p>
          <div className="d-flex justify-content-end">
            <Button variant="outline-warning" onClick={() => navigate('/fabric-income')}>
              Back to Partys
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header with Actions */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="align-items-center">
            <Col>
              <div className="d-flex align-items-center">
                <Button 
                  variant="outline-secondary" 
                  className="me-3"
                  onClick={() => navigate('/fabric-income')}
                >
                  <BsArrowLeft />
                </Button>
                <div>
                  <h2 className="mb-0">{party.shop_name}</h2>
                  <p className="text-muted mb-0">{party.party_name}</p>
                </div>
              </div>
            </Col>
            <Col xs="auto">
              <div className="d-flex gap-2">
                <Button variant="outline-primary" onClick={() => navigate(`/fabric-income/${id}/edit`)}>
                  <BsPencil className="me-1" /> Edit
                </Button>
                <Button variant="outline-danger" onClick={() => setShowDeleteModal(true)}>
                  <BsTrash className="me-1" /> Delete
                </Button>
                <Button variant="outline-secondary">
                  <BsPrinter className="me-1" /> Print
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row>
        {/* Party Information */}
        <Col md={4}>
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Party Information</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between align-items-center py-3">
                  <strong>Shop Name</strong>
                  <span>{party.shop_name}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center py-3">
                  <strong>Party Name</strong>
                  <span>{party.party_name}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center py-3">
                  <strong>Bill Number</strong>
                  <span>{party.bill_no}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center py-3">
                  <strong>Date</strong>
                  <span>{formatDate(party.date_time)}</span>
                </ListGroup.Item>
                {party.contact_number && (
                  <ListGroup.Item className="d-flex justify-content-between align-items-center py-3">
                    <strong>Contact</strong>
                    <span>{party.contact_number}</span>
                  </ListGroup.Item>
                )}
                {party.address && (
                  <ListGroup.Item className="d-flex justify-content-between align-items-center py-3">
                    <strong>Address</strong>
                    <span>{party.address}</span>
                  </ListGroup.Item>
                )}
                {party.gstin && (
                  <ListGroup.Item className="d-flex justify-content-between align-items-center py-3">
                    <strong>GSTIN</strong>
                    <span>{party.gstin}</span>
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
            <Card.Footer className="bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <strong>Total Fabric Weight</strong>
                <Badge 
                  bg="primary" 
                  className="fs-6 px-3 py-2"
                  style={{
                    fontWeight: '600',
                    borderRadius: '6px'
                  }}
                >
                  {calculateTotalWeight().toFixed(2)} kg
                </Badge>
              </div>
            </Card.Footer>
          </Card>

          {/* Payment Information section removed as requested */}
        </Col>

        {/* Fabric Details */}
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Fabric Details</h5>
            </Card.Header>
            <Card.Body>
              {party.fabricDetails && party.fabricDetails.length > 0 ? (
                party.fabricDetails.map((fabric, index) => (
                  <div key={index} className="mb-4 pb-4 border-bottom">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0">{fabric.name}</h5>
                      <Badge bg="info">{fabric.type}</Badge>
                    </div>
                    
                    <Row className="mb-3">
                      <Col md={4}>
                        <div className="mb-2">
                          <strong>Weight Type:</strong> {fabric.weight_type}
                        </div>
                        <div>
                          <strong>Total Weight:</strong> {
                            // Calculate fabric total weight from colors if total_weight is 0
                            fabric.total_weight > 0 ? 
                              fabric.total_weight : 
                              fabric.fabricColors?.reduce((sum, color) => sum + (parseFloat(color.color_weight) || 0), 0) || 0
                          } {fabric.weight_type}
                        </div>
                      </Col>
                      {fabric.remarks && (
                        <Col md={8}>
                          <div>
                            <strong>Remarks:</strong>
                            <p className="mb-0">{fabric.remarks}</p>
                          </div>
                        </Col>
                      )}
                    </Row>

                    <h6 className="mb-3">Color Distribution</h6>
                    <Table responsive bordered hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th>Color</th>
                          <th>Weight ({fabric.weight_type})</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fabric.fabricColors && fabric.fabricColors.length > 0 ? (
                          fabric.fabricColors.map((color, colorIndex) => (
                            <tr key={colorIndex}>
                              <td>{getColorDisplay(color.color_name, color.color_hex)}</td>
                              <td>{color.color_weight}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="text-center">No color information available</td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                ))
              ) : (
                <Alert variant="info">No fabric details available for this party.</Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Enhanced Delete Confirmation Modal */}
      {party && (
        <PartyDeleteConfirmation
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          party={party}
          onDeleteSuccess={handleDeleteSuccess}
          onError={handleDeleteError}
        />
      )}
    </Container>
  );
};

export default PartyDetail; 