import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { BsArrowLeft, BsCheck2 } from 'react-icons/bs';
import PartyFormUpdated from './PartyFormUpdated';

const PartyEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [party, setParty] = useState(null);

  useEffect(() => {
    const fetchPartyData = async () => {
      try {
        console.log(`PartyEdit: Fetching party data for ID: ${id}`);
        setLoading(true);
        
        // Temporarily using /api/vendors endpoint until backend deployment is updated
        const response = await axios.get(`/api/vendors/${id}`);
        console.log('PartyEdit: Party data response:', response.data);
        
        if (response.data.success) {
          setParty(response.data.data);
        } else {
          setError('Failed to load party data: ' + (response.data.message || 'Unknown error'));
        }
      } catch (err) {
        console.error('PartyEdit: Error fetching party data:', err);
        setError('Failed to load party data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPartyData();
    } else {
      setError('No party ID provided');
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
              <p className="mt-3">Loading party data...</p>
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
          onClick={() => navigate('/fabric-income')}
          className="mt-3"
        >
          <BsArrowLeft className="me-2" /> Back to Parties
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-0">Edit Party</h2>
          <p className="text-muted">Update party information and fabric details</p>
        </Col>
      </Row>
      
      {party ? (
        <PartyFormUpdated initialVendorData={party} partyId={id} isEditMode={true} />
      ) : (
        <Alert variant="warning">No party data available to edit.</Alert>
      )}
    </Container>
  );
};

export default PartyEdit;
