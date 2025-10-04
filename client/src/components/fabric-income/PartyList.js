import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Spinner, Alert, Modal } from 'react-bootstrap';
import { BsSearch, BsPlus, BsPencil, BsTrash, BsEye, BsArrowUp, BsArrowDown, BsFilter } from 'react-icons/bs';
import { format } from 'date-fns';

const PartyList = () => {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalParties, setTotalParties] = useState(0);
  const [sortField, setSortField] = useState('date_time');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [partyToDelete, setPartyToDelete] = useState(null);

  // Fetch parties on component mount and when search/sort/page changes
  useEffect(() => {
    fetchParties();
  }, [currentPage, searchTerm, sortField, sortDirection]);

  // Fetch parties from the API
  const fetchParties = async () => {
    try {
      setLoading(true);
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', 10);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await axios.get(`/api/parties?${params.toString()}`);
      
      if (response.data.success) {
        setParties(response.data.data);
        setTotalPages(response.data.totalPages || 1);
        setTotalParties(response.data.total || 0);
      } else {
        setError('Failed to fetch parties');
      }
    } catch (err) {
      console.error('Error fetching parties:', err);
      setError('Failed to fetch parties. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  // Handle sort column click
  const handleSort = (field) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sort changes
  };

  // Get sort icon for column headers
  const getSortIcon = (field) => {
    if (field === sortField) {
      return sortDirection === 'asc' ? 
        <BsArrowUp className="ms-1" size={14} /> : 
        <BsArrowDown className="ms-1" size={14} />;
    }
    return null;
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Handle party deletion
  const confirmDelete = (party) => {
    setPartyToDelete(party);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!partyToDelete) return;
    
    try {
      // Temporarily using /api/parties endpoint until backend deployment is updated
      const response = await axios.delete(`/api/parties/${partyToDelete._id}`);
      if (response.data.success) {
        // Remove party from state
        setParties(parties.filter(v => v._id !== partyToDelete._id));
        setShowDeleteModal(false);
        setPartyToDelete(null);
      } else {
        setError(response.data.message || 'Failed to delete party');
      }
    } catch (err) {
      console.error('Error deleting party:', err);
      setError(err.response?.data?.message || 'Failed to delete party');
    }
  };

  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return (
      <div className="d-flex justify-content-center mt-4">
        <ul className="pagination">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button 
              className="page-link" 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              &laquo;
            </button>
          </li>
          
          {pageNumbers.map(number => (
            <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => handlePageChange(number)}
              >
                {number}
              </button>
            </li>
          ))}
          
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button 
              className="page-link" 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              &raquo;
            </button>
          </li>
        </ul>
      </div>
    );
  };

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="mb-0">Party Management</h2>
          <p className="text-muted">Manage your fabric suppliers</p>
        </Col>
        <Col xs="auto">
          <Button 
            variant="primary" 
            onClick={() => navigate('/fabric-income/new')}
            className="d-flex align-items-center shadow-sm px-3 py-2"
            style={{
              borderRadius: '6px',
              fontSize: '0.95rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              backgroundColor: '#4361ee',
              border: 'none'
            }}
          >
            <BsPlus className="me-2" size={20} /> Add New Party
          </Button>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={6}>
              <InputGroup>
                <Form.Control
                  placeholder="Search parties by name, shop or bill number"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <Button variant="outline-secondary">
                  <BsSearch />
                </Button>
              </InputGroup>
            </Col>
            <Col md={6} className="d-flex justify-content-end align-items-center">
              <span className="text-muted me-2">
                {totalParties} {totalParties === 1 ? 'party' : 'parties'} found
              </span>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Partys Table */}
      <Card className="shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading parties...</p>
            </div>
          ) : parties.length === 0 ? (
            <div className="text-center py-5">
              <p className="mb-0">No parties found. Add your first party to get started.</p>
            </div>
          ) : (
            <Table hover responsive className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="cursor-pointer" onClick={() => handleSort('shop_name')}>
                    Shop Name {getSortIcon('shop_name')}
                  </th>
                  <th className="cursor-pointer" onClick={() => handleSort('party_name')}>
                    Party Name {getSortIcon('party_name')}
                  </th>
                  <th className="cursor-pointer" onClick={() => handleSort('date_time')}>
                    Date {getSortIcon('date_time')}
                  </th>
                  <th className="cursor-pointer" onClick={() => handleSort('bill_no')}>
                    Bill No. {getSortIcon('bill_no')}
                  </th>
                  <th>Total Fabric</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {parties.map(party => (
                  <tr key={party._id} className="cursor-pointer" onClick={() => navigate(`/fabric-income/${party._id}`)}>
                    <td>{party.shop_name}</td>
                    <td>{party.party_name}</td>
                    <td>{formatDate(party.date_time)}</td>
                    <td>{party.bill_no}</td>
                    <td>
                      {party.totalWeight ? (
                        <Badge bg="info">{party.totalWeight.toFixed(2)} kg</Badge>
                      ) : (
                        <Badge bg="secondary">N/A</Badge>
                      )}
                    </td>
                    <td>
                      <div className="d-flex justify-content-center gap-2">
                        <Button 
                          variant="outline-info" 
                          size="sm"
                          className="d-flex align-items-center justify-content-center shadow-sm"
                          style={{
                            borderRadius: '4px',
                            width: '32px',
                            height: '32px',
                            padding: '0',
                            transition: 'all 0.2s ease',
                            borderColor: '#0dcaf0',
                            color: '#0dcaf0'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/fabric-income/${party._id}`);
                          }}
                          title="View Details"
                        >
                          <BsEye size={16} />
                        </Button>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          className="d-flex align-items-center justify-content-center shadow-sm"
                          style={{
                            borderRadius: '4px',
                            width: '32px',
                            height: '32px',
                            padding: '0',
                            transition: 'all 0.2s ease',
                            borderColor: '#4361ee',
                            color: '#4361ee'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/fabric-income/${party._id}/edit`);
                          }}
                          title="Edit Party"
                        >
                          <BsPencil size={16} />
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          className="d-flex align-items-center justify-content-center shadow-sm"
                          style={{
                            borderRadius: '4px',
                            width: '32px',
                            height: '32px',
                            padding: '0',
                            transition: 'all 0.2s ease',
                            borderColor: '#dc3545',
                            color: '#dc3545'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(party);
                          }}
                          title="Delete Party"
                        >
                          <BsTrash size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Pagination */}
      {renderPagination()}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete party <strong>{partyToDelete?.shop_name}</strong>?
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowDeleteModal(false)}
            className="px-4 py-2"
            style={{
              borderRadius: '6px',
              fontSize: '0.95rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete}
            className="px-4 py-2"
            style={{
              borderRadius: '6px',
              fontSize: '0.95rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              backgroundColor: '#dc3545',
              border: 'none'
            }}
          >
            Delete Party
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PartyList;