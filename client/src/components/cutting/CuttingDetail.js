import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Row, Col, Badge, Table, Button, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

const CuttingDetail = () => {
  const { id } = useParams();
  const [cutting, setCutting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCuttingDetails();
  }, []);

  const fetchCuttingDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/cutting/${id}`);
      setCutting(response.data.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch cutting details. Please try again later.');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!cutting) {
    return <Alert variant="warning">Cutting batch not found</Alert>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Cutting Details</h1>
        <Button as={Link} to="/cutting" variant="secondary">Back to List</Button>
      </div>

      <Card className="mb-4">
        <Card.Header>
          <h3>Batch Information</h3>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <h5>Lot Number</h5>
              <p className="lead">{cutting.lot_no}</p>
            </Col>
            <Col md={4}>
              <h5>Pattern</h5>
              <p className="lead">{cutting.pattern}</p>
            </Col>
            <Col md={4}>
              <h5>Date</h5>
              <p className="lead">{formatDate(cutting.datetime)}</p>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col md={4}>
              <h5>Status</h5>
              <p>
                {cutting.after_cutting_complete ? (
                  <Badge bg="success">Completed</Badge>
                ) : cutting.before_cutting_complete ? (
                  <Badge bg="warning">In Progress</Badge>
                ) : (
                  <Badge bg="danger">Not Started</Badge>
                )}
              </p>
            </Col>
            <Col md={8}>
              <h5>Sizes</h5>
              <p>
                {cutting.sizes.map((size, idx) => (
                  <Badge key={idx} bg="secondary" className="me-1">{size}</Badge>
                ))}
              </p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h3>Roles Information</h3>
        </Card.Header>
        <Card.Body>
          <Table striped bordered responsive>
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
              {cutting.roles && cutting.roles.length > 0 ? (
                cutting.roles.map((role, index) => (
                  <tr key={index}>
                    <td>{role.role_no}</td>
                    <td>
                      <span 
                        className="color-swatch me-2" 
                        style={{ 
                          display: 'inline-block',
                          width: '20px',
                          height: '20px',
                          backgroundColor: role.role_color.toLowerCase(),
                          border: '1px solid #ddd',
                          verticalAlign: 'middle'
                        }}
                      ></span>
                      {role.role_color}
                    </td>
                    <td>{role.role_weight}</td>
                    <td>{role.layers_cut || 'Not cut yet'}</td>
                    <td>{role.pieces_cut || 'Not cut yet'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center">No roles found</td>
                </tr>
              )}
            </tbody>
          </Table>
          
          <div className="mt-4">
            <h5>Total Pieces: {cutting.roles.reduce((total, role) => total + (role.pieces_cut || 0), 0)}</h5>
          </div>

          {!cutting.after_cutting_complete && cutting.before_cutting_complete && (
            <div className="mt-3">
              <Button 
                as={Link} 
                to={`/cutting/${cutting._id}/after`} 
                variant="primary"
              >
                Complete Cutting
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default CuttingDetail; 