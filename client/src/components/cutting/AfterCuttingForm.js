import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Alert, Spinner, Badge, Table } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AfterCuttingForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [cutting, setCutting] = useState(null);
  const [formData, setFormData] = useState({ roles: [] });
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCutting = async () => {
      try {
        const response = await axios.get(`/api/cutting/${id}`);
        const cuttingData = response.data.data;
        
        setCutting(cuttingData);
        
        const rolesWithCutData = cuttingData.roles.map(role => ({
          _id: role._id,
          role_no: role.role_no,
          role_color: role.role_color,
          role_weight: role.role_weight,
          layers_cut: role.layers_cut || 0,
          pieces_cut: role.pieces_cut || 0
        }));
        
        setFormData({ roles: rolesWithCutData });
        setFetchingData(false);
      } catch (err) {
        setError('Failed to fetch cutting data.');
        setFetchingData(false);
      }
    };
    
    fetchCutting();
  }, [id]);

  // Calculate pieces_cut based on layers_cut and number of sizes
  const calculatePiecesCut = (layers_cut) => {
    if (!cutting || !cutting.sizes) return 0;
    return layers_cut * cutting.sizes.length;
  };

  // Handle role field changes
  const handleRoleChange = (index, e) => {
    const { name, value } = e.target;
    const updatedRoles = [...formData.roles];
    
    if (name === 'layers_cut') {
      const layers = parseInt(value, 10) || 0;
      updatedRoles[index] = {
        ...updatedRoles[index],
        layers_cut: layers,
        pieces_cut: calculatePiecesCut(layers)
      };
    } else {
      updatedRoles[index] = {
        ...updatedRoles[index],
        [name]: parseInt(value, 10) || 0
      };
    }
    
    setFormData(prev => ({
      ...prev,
      roles: updatedRoles
    }));
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await axios.put(`/api/cutting/${id}/after`, formData);
      navigate('/cutting');
    } catch (err) {
      setError('Failed to update cutting data. Please try again.');
      setLoading(false);
    }
  };

  // Calculate total pieces from all roles
  const getTotalPieces = () => {
    return formData.roles.reduce((total, role) => total + (role.pieces_cut || 0), 0);
  };

  // Get color summary
  const getColorSummary = () => {
    const colorSummary = {};
    formData.roles.forEach(role => {
      if (!colorSummary[role.role_color]) {
        colorSummary[role.role_color] = {
          totalLayers: 0,
          totalPieces: 0
        };
      }
      colorSummary[role.role_color].totalLayers += role.layers_cut || 0;
      colorSummary[role.role_color].totalPieces += role.pieces_cut || 0;
    });
    return colorSummary;
  };

  if (fetchingData) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (!cutting) {
    return <Alert variant="warning">Cutting record not found.</Alert>;
  }

  if (cutting.after_cutting_complete) {
    return (
      <Alert variant="info">
        This cutting batch has already been completed. 
        <Button 
          variant="link" 
          onClick={() => navigate('/cutting')}
        >
          Return to Cutting List
        </Button>
      </Alert>
    );
  }

  return (
    <div>
      <h1 className="mb-4">Complete Cutting Process</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="mb-4">
        <Card.Header>Cutting Information</Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <p><strong>Lot Number:</strong> {cutting.lot_no}</p>
              <p><strong>Pattern:</strong> {cutting.pattern}</p>
              <p><strong>Date:</strong> {new Date(cutting.datetime).toLocaleDateString()}</p>
            </Col>
            <Col md={6}>
              <p><strong>Sizes:</strong></p>
              {cutting.sizes.map((size, idx) => (
                <Badge key={idx} bg="secondary" className="me-1">{size}</Badge>
              ))}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>Color Summary</Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Color</th>
                <th>Total Layers</th>
                <th>Total Pieces</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(getColorSummary()).map(([color, data]) => (
                <tr key={color}>
                  <td>
                    <Badge 
                      bg="primary" 
                      style={{ 
                        backgroundColor: color.toLowerCase(), 
                        color: ['black', 'yellow', 'white', 'lightgreen'].includes(color.toLowerCase()) ? 'black' : 'white' 
                      }}
                    >
                      {color}
                    </Badge>
                  </td>
                  <td>{data.totalLayers}</td>
                  <td>{data.totalPieces}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      <h3 className="mb-3">After Cutting Details</h3>
      <p className="text-muted">
        Please enter the actual number of layers cut for each role. Pieces will be automatically calculated based on layers and sizes.
      </p>
      
      <Form onSubmit={handleSubmit}>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Role No</th>
              <th>Color</th>
              <th>Weight</th>
              <th>Layers Cut</th>
              <th>Pieces Cut</th>
            </tr>
          </thead>
          <tbody>
            {formData.roles.map((role, index) => (
              <tr key={role._id}>
                <td>{role.role_no}</td>
                <td>
                  <Badge 
                    bg="primary" 
                    style={{ 
                      backgroundColor: role.role_color.toLowerCase(), 
                      color: ['black', 'yellow', 'white', 'lightgreen'].includes(role.role_color.toLowerCase()) ? 'black' : 'white' 
                    }}
                  >
                    {role.role_color}
                  </Badge>
                </td>
                <td>{role.role_weight}</td>
                <td>
                  <Form.Control
                    type="number"
                    name="layers_cut"
                    value={role.layers_cut}
                    onChange={(e) => handleRoleChange(index, e)}
                    required
                    min="0"
                  />
                </td>
                <td>
                  <Form.Control
                    type="number"
                    name="pieces_cut"
                    value={role.pieces_cut}
                    disabled
                    readOnly
                  />
                </td>
              </tr>
            ))}
            <tr className="table-info">
              <td colSpan="4" className="text-end">
                <strong>Total Pieces:</strong>
              </td>
              <td>
                <strong>{getTotalPieces()}</strong>
              </td>
            </tr>
          </tbody>
        </Table>
        
        <div className="d-flex justify-content-between mt-4">
          <Button variant="secondary" onClick={() => navigate('/cutting')}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Complete Cutting Process'}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default AfterCuttingForm; 