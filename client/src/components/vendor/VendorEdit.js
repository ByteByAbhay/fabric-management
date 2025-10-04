import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { BsArrowLeft, BsCheck2 } from 'react-icons/bs';
import VendorFormUpdated from './VendorFormUpdated';

const VendorEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vendor, setVendor] = useState(null);

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        console.log(`VendorEdit: Fetching vendor data for ID: ${id}`);
        setLoading(true);
        
        const response = await axios.get(`/api/vendors/${id}`);
        console.log('VendorEdit: Vendor data response:', response.data);
        
        if (response.data.success) {
          setVendor(response.data.data);
        } else {
          setError('Failed to load vendor data: ' + (response.data.message || 'Unknown error'));
        }
      } catch (err) {
        console.error('VendorEdit: Error fetching vendor data:', err);
        setError('Failed to load vendor data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVendorData();
    } else {
      setError('No vendor ID provided');
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <Container className="py-4">
        <Card className="shadow-sm">
          <Card.Body className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading vendor data...</p>
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
        <Button 
          variant="outline-secondary" 
          onClick={() => navigate('/vendors')}
          className="mt-3"
        >
          <BsArrowLeft className="me-2" /> Back to Vendors
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-0">Edit Vendor</h2>
          <p className="text-muted">Update vendor information and fabric details</p>
        </Col>
      </Row>
      
      {vendor ? (
        <VendorFormUpdated initialVendorData={vendor} vendorId={id} isEditMode={true} />
      ) : (
        <Alert variant="warning">No vendor data available to edit.</Alert>
      )}
    </Container>
  );
};

export default VendorEdit;
