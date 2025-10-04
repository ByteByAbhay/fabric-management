import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Spinner, Alert, Row, Col, InputGroup, FormControl } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

const CuttingList = () => {
  const [cuttings, setCuttings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCuttings();
  }, [currentPage]);

  const fetchCuttings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/cutting?page=${currentPage}`);
      setCuttings(response.data.data);
      setTotalPages(response.data.totalPages || 1);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch cutting data. Please try again later.');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredCuttings = cuttings.filter(
    cutting => cutting.lot_no.toLowerCase().includes(searchTerm.toLowerCase()) || 
               cutting.pattern.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <Row className="mb-4 align-items-center">
        <Col>
          <h1>Cutting Batches</h1>
        </Col>
        <Col md="auto">
          <Button as={Link} to="/cutting/before" variant="success">Start New Cutting</Button>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>Search</InputGroup.Text>
            <FormControl
              placeholder="Search by lot number or pattern..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Lot No</th>
                <th>Pattern</th>
                <th>Date</th>
                <th>Sizes</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCuttings.length > 0 ? (
                filteredCuttings.map(cutting => (
                  <tr key={cutting._id}>
                    <td>{cutting.lot_no}</td>
                    <td>{cutting.pattern}</td>
                    <td>{formatDate(cutting.datetime)}</td>
                    <td>
                      {cutting.sizes.map((size, idx) => (
                        <Badge key={idx} bg="secondary" className="me-1">{size}</Badge>
                      ))}
                    </td>
                    <td>{cutting.roles?.length || 0}</td>
                    <td>
                      {cutting.after_cutting_complete ? (
                        <Badge bg="success">Completed</Badge>
                      ) : cutting.before_cutting_complete ? (
                        <Badge bg="warning">In Progress</Badge>
                      ) : (
                        <Badge bg="danger">Not Started</Badge>
                      )}
                    </td>
                    <td>
                      {cutting.before_cutting_complete && !cutting.after_cutting_complete ? (
                        <Button 
                          as={Link} 
                          to={`/cutting/${cutting._id}/after`} 
                          variant="primary" 
                          size="sm"
                        >
                          Complete Cutting
                        </Button>
                      ) : (
                        <Button 
                          as={Link} 
                          to={`/cutting/${cutting._id}`} 
                          variant="info" 
                          size="sm"
                        >
                          View Details
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center">No cutting batches found</td>
                </tr>
              )}
            </tbody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Button
                variant="outline-primary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="me-2"
              >
                Previous
              </Button>
              <Button
                variant="outline-primary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CuttingList; 