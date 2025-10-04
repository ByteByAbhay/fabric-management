import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Spinner, Alert, Badge, Form, InputGroup, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaEye, FaFileDownload } from 'react-icons/fa';

const DeliveryList = () => {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    customerName: '',
    startDate: '',
    endDate: ''
  });
  
  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deliveryToDelete, setDeliveryToDelete] = useState(null);

  // State for view delivery details modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  useEffect(() => {
    fetchDeliveries();
  }, [currentPage, filters]);

  const fetchDeliveries = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', 10);
      
      if (filters.status) params.append('status', filters.status);
      if (filters.customerName) params.append('customerName', filters.customerName);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      // TEMPORARY: Using mock data since the /api/delivery endpoint is not available in the deployed backend
      // This will be replaced with the actual API call once the backend is redeployed
      // const response = await axios.get(`/api/delivery?${params.toString()}`);
      
      // Mock response
      const mockResponse = {
        data: {
          success: true,
          count: 0,
          total: 0,
          totalPages: 1,
          currentPage: 1,
          data: []
        }
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = mockResponse;
      
      setDeliveries(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching deliveries:', err);
      setError('Failed to load deliveries. Please try again.');
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      customerName: '',
      startDate: '',
      endDate: ''
    });
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleViewDelivery = (delivery) => {
    setSelectedDelivery(delivery);
    setShowViewModal(true);
  };

  const handleEditDelivery = (id) => {
    navigate(`/delivery/edit/${id}`);
  };

  const confirmDeleteDelivery = (delivery) => {
    setDeliveryToDelete(delivery);
    setShowDeleteModal(true);
  };

  const handleDeleteDelivery = async () => {
    if (!deliveryToDelete) return;
    
    setLoading(true);
    
    try {
      await axios.delete(`/api/delivery/${deliveryToDelete._id}`);
      
      setSuccess(`Delivery ${deliveryToDelete.deliveryNumber} deleted successfully.`);
      setShowDeleteModal(false);
      setDeliveryToDelete(null);
      
      // Refresh the list
      fetchDeliveries();
    } catch (err) {
      console.error('Error deleting delivery:', err);
      setError(err.response?.data?.message || 'Failed to delete delivery. Please try again.');
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setLoading(true);
    
    try {
      await axios.patch(`/api/delivery/${id}/status`, { status: newStatus });
      
      setSuccess('Delivery status updated successfully.');
      
      // Refresh the list
      fetchDeliveries();
    } catch (err) {
      console.error('Error updating delivery status:', err);
      setError(err.response?.data?.message || 'Failed to update delivery status. Please try again.');
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    // Create CSV content
    let csvContent = 'Delivery Number,Customer Name,Delivery Date,Status,Total Quantity,Items Count,Created At\n';
    
    // Add data rows
    deliveries.forEach(delivery => {
      csvContent += `"${delivery.deliveryNumber}","${delivery.customerName}","${formatDate(delivery.deliveryDate)}","${delivery.status}","${delivery.totalQuantity}","${delivery.items.length}","${formatDate(delivery.createdAt)}"\n`;
    });
    
    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'deliveries.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1>Deliveries</h1>
          <p className="text-muted">Manage and track all deliveries</p>
        </Col>
        <Col xs="auto" className="d-flex align-items-center">
          <Button variant="primary" onClick={() => navigate('/delivery/new')}>
            <FaPlus className="me-2" /> New Delivery
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
      
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Filter Deliveries</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Customer Name</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    name="customerName"
                    value={filters.customerName}
                    onChange={handleFilterChange}
                    placeholder="Search by customer"
                  />
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>
          </Row>
          <div className="d-flex justify-content-between">
            <Button variant="secondary" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button variant="outline-primary" onClick={exportToCSV}>
              <FaFileDownload className="me-2" /> Export to CSV
            </Button>
          </div>
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Body>
          {loading && deliveries.length === 0 ? (
            <div className="text-center my-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-2">Loading deliveries...</p>
            </div>
          ) : deliveries.length === 0 ? (
            <Alert variant="info">
              No deliveries found. Use the filters above to refine your search or create a new delivery.
            </Alert>
          ) : (
            <>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Delivery #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Total Qty</th>
                    <th>Items</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map(delivery => (
                    <tr key={delivery._id}>
                      <td>{delivery.deliveryNumber}</td>
                      <td>{delivery.customerName}</td>
                      <td>{formatDate(delivery.deliveryDate)}</td>
                      <td>
                        <Badge bg={getStatusBadgeVariant(delivery.status)}>
                          {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
                        </Badge>
                      </td>
                      <td>{delivery.totalQuantity}</td>
                      <td>{delivery.items.length}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button 
                            variant="outline-info" 
                            size="sm"
                            onClick={() => handleViewDelivery(delivery)}
                          >
                            <FaEye />
                          </Button>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => handleEditDelivery(delivery._id)}
                          >
                            <FaEdit />
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => confirmDeleteDelivery(delivery)}
                          >
                            <FaTrash />
                          </Button>
                          {delivery.status === 'pending' && (
                            <Button 
                              variant="outline-success" 
                              size="sm"
                              onClick={() => handleUpdateStatus(delivery._id, 'delivered')}
                            >
                              Mark Delivered
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <ul className="pagination">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    {[...Array(totalPages).keys()].map(page => (
                      <li 
                        key={page + 1} 
                        className={`page-item ${currentPage === page + 1 ? 'active' : ''}`}
                      >
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(page + 1)}
                        >
                          {page + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deliveryToDelete && (
            <p>
              Are you sure you want to delete delivery <strong>{deliveryToDelete.deliveryNumber}</strong> for customer <strong>{deliveryToDelete.customerName}</strong>?
              This action cannot be undone.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteDelivery} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* View Delivery Details Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Delivery Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDelivery && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <p><strong>Delivery Number:</strong> {selectedDelivery.deliveryNumber}</p>
                  <p><strong>Customer:</strong> {selectedDelivery.customerName}</p>
                  <p><strong>Delivery Date:</strong> {formatDate(selectedDelivery.deliveryDate)}</p>
                </Col>
                <Col md={6}>
                  <p>
                    <strong>Status:</strong>{' '}
                    <Badge bg={getStatusBadgeVariant(selectedDelivery.status)}>
                      {selectedDelivery.status.charAt(0).toUpperCase() + selectedDelivery.status.slice(1)}
                    </Badge>
                  </p>
                  <p><strong>Total Quantity:</strong> {selectedDelivery.totalQuantity}</p>
                  <p><strong>Created At:</strong> {formatDate(selectedDelivery.createdAt)}</p>
                </Col>
              </Row>
              
              {selectedDelivery.remarks && (
                <div className="mb-3">
                  <strong>Remarks:</strong>
                  <p className="mb-0">{selectedDelivery.remarks}</p>
                </div>
              )}
              
              <h5 className="mt-4 mb-3">Delivery Items</h5>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Lot No</th>
                    <th>Pattern</th>
                    <th>Size</th>
                    <th>Color</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDelivery.items.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{item.lotNo}</td>
                      <td>{item.pattern}</td>
                      <td>{item.size}</td>
                      <td>{item.color}</td>
                      <td>{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
          {selectedDelivery && selectedDelivery.status === 'pending' && (
            <Button 
              variant="success" 
              onClick={() => {
                handleUpdateStatus(selectedDelivery._id, 'delivered');
                setShowViewModal(false);
              }}
            >
              Mark as Delivered
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DeliveryList;
