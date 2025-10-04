import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert, Table, Badge } from 'react-bootstrap';
import { FaFileDownload, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { CSVLink } from 'react-csv';

const DeliveryReport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    customerName: '',
    status: ''
  });
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      customerName: '',
      status: ''
    });
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.customerName) params.append('customerName', filters.customerName);
      if (filters.status) params.append('status', filters.status);
      
      const response = await axios.get(`/api/delivery/report/summary?${params.toString()}`);
      
      if (response.data.success) {
        setReportData(response.data.data);
        prepareCSVData(response.data.data);
      } else {
        setError('Failed to generate report. Please try again.');
      }
    } catch (err) {
      console.error('Error generating delivery report:', err);
      setError(err.response?.data?.message || 'Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const prepareCSVData = (data) => {
    if (!data || !data.deliveries) return;
    
    // Prepare headers
    const headers = [
      { label: 'Delivery Number', key: 'deliveryNumber' },
      { label: 'Customer Name', key: 'customerName' },
      { label: 'Delivery Date', key: 'deliveryDate' },
      { label: 'Status', key: 'status' },
      { label: 'Total Quantity', key: 'totalQuantity' },
      { label: 'Item Count', key: 'itemCount' },
      { label: 'Created At', key: 'createdAt' }
    ];
    
    // Format data for CSV
    const formattedData = data.deliveries.map(delivery => ({
      ...delivery,
      deliveryDate: formatDate(delivery.deliveryDate),
      createdAt: formatDate(delivery.createdAt),
      status: delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)
    }));
    
    setCsvHeaders(headers);
    setCsvData(formattedData);
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
          <h1>Delivery Reports</h1>
          <p className="text-muted">Generate and export delivery reports</p>
        </Col>
      </Row>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Report Filters</h5>
        </Card.Header>
        <Card.Body>
          <Row>
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
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Customer Name</Form.Label>
                <Form.Control
                  type="text"
                  name="customerName"
                  value={filters.customerName}
                  onChange={handleFilterChange}
                  placeholder="Filter by customer"
                />
              </Form.Group>
            </Col>
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
          </Row>
          <div className="d-flex justify-content-between">
            <div>
              <Button variant="primary" onClick={generateReport} disabled={loading}>
                {loading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FaSearch className="me-2" />
                    Generate Report
                  </>
                )}
              </Button>
              <Button variant="secondary" onClick={clearFilters} className="ms-2" disabled={loading}>
                Clear Filters
              </Button>
            </div>
            {reportData && csvData.length > 0 && (
              <CSVLink
                data={csvData}
                headers={csvHeaders}
                filename={`delivery-report-${new Date().toISOString().split('T')[0]}.csv`}
                className="btn btn-success"
              >
                <FaFileDownload className="me-2" />
                Export to CSV
              </CSVLink>
            )}
          </div>
        </Card.Body>
      </Card>
      
      {loading && !reportData && (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Generating report...</p>
        </div>
      )}
      
      {reportData && (
        <>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Summary</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <div className="text-center p-3 border rounded mb-3">
                    <h3>{reportData.summary.totalDeliveries}</h3>
                    <p className="mb-0 text-muted">Total Deliveries</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3 border rounded mb-3">
                    <h3>{reportData.summary.totalQuantity}</h3>
                    <p className="mb-0 text-muted">Total Quantity</p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="p-3 border rounded mb-3">
                    <h6>Status Breakdown</h6>
                    <div className="d-flex justify-content-between">
                      <div>
                        <Badge bg="warning" className="me-2">Pending</Badge>
                        {reportData.summary.statusCounts.pending}
                      </div>
                      <div>
                        <Badge bg="success" className="me-2">Delivered</Badge>
                        {reportData.summary.statusCounts.delivered}
                      </div>
                      <div>
                        <Badge bg="danger" className="me-2">Cancelled</Badge>
                        {reportData.summary.statusCounts.cancelled}
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header>
              <h5 className="mb-0">Delivery Details</h5>
            </Card.Header>
            <Card.Body>
              {reportData.deliveries.length === 0 ? (
                <Alert variant="info">
                  No deliveries found matching the selected filters.
                </Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Delivery #</th>
                      <th>Customer</th>
                      <th>Delivery Date</th>
                      <th>Status</th>
                      <th>Total Qty</th>
                      <th>Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.deliveries.map(delivery => (
                      <tr key={delivery.id}>
                        <td>{delivery.deliveryNumber}</td>
                        <td>{delivery.customerName}</td>
                        <td>{formatDate(delivery.deliveryDate)}</td>
                        <td>
                          <Badge bg={getStatusBadgeVariant(delivery.status)}>
                            {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
                          </Badge>
                        </td>
                        <td>{delivery.totalQuantity}</td>
                        <td>{delivery.itemCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </>
      )}
    </Container>
  );
};

export default DeliveryReport;
