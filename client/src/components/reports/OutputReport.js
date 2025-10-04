import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Spinner, Alert, Button, Form, InputGroup, Modal, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import axios from 'axios';
import { BsDownload, BsArrowLeft, BsSearch, BsInfoCircle } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import './OutputReport.css'; // We'll create this file later

const OutputReport = () => {
  const navigate = useNavigate();
  const [outputData, setOutputData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of current month
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  const [searchTerm, setSearchTerm] = useState('');

  // State for the modal
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchOutputData();
  }, [dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchOutputData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch process output difference report data
      const response = await axios.get('/api/process/output/report', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      });
      
      setOutputData(response.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching output data:', err);
      setError('Failed to load output report data. Please try again.');
      setLoading(false);
    }
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

  const exportToCSV = () => {
    // Create CSV content
    let csvContent = 'Date,Worker Name,Fabric Type,Size,Color,Expected Pieces,Actual Pieces,Difference,Percentage Difference\n';
    
    // Add data rows
    filteredData.forEach(item => {
      const difference = item.actualPieces - item.expectedPieces;
      const percentageDiff = item.expectedPieces > 0 
        ? ((difference / item.expectedPieces) * 100).toFixed(2) 
        : '0.00';
      
      csvContent += `"${formatDate(item.date)}","${item.workerName}","${item.fabricType}","${item.size}","${item.color}","${item.expectedPieces}","${item.actualPieces}","${difference}","${percentageDiff}%"\n`;
    });
    
    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'output-difference-report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter data based on search term
  const filteredData = outputData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return searchTerm === '' || (
      (item.workerName && item.workerName.toLowerCase().includes(searchLower)) ||
      (item.fabricType && item.fabricType.toLowerCase().includes(searchLower)) ||
      (item.color && item.color.toLowerCase().includes(searchLower)) ||
      (item.size && item.size.toLowerCase().includes(searchLower)) ||
      (item.lotNo && item.lotNo.toString().includes(searchLower))
    );
  });

  // Calculate summary statistics
  const calculateSummary = () => {
    if (filteredData.length === 0) return null;
    
    const totalExpected = filteredData.reduce((sum, item) => sum + item.expectedPieces, 0);
    const totalActual = filteredData.reduce((sum, item) => sum + item.actualPieces, 0);
    const totalDifference = totalActual - totalExpected;
    const percentageDiff = totalExpected > 0 
      ? ((totalDifference / totalExpected) * 100).toFixed(2) 
      : '0.00';
    
    // Calculate by worker
    const workerStats = {};
    filteredData.forEach(item => {
      if (!workerStats[item.workerName]) {
        workerStats[item.workerName] = {
          expected: 0,
          actual: 0
        };
      }
      workerStats[item.workerName].expected += item.expectedPieces;
      workerStats[item.workerName].actual += item.actualPieces;
    });
    
    // Calculate by fabric type
    const fabricStats = {};
    filteredData.forEach(item => {
      if (!fabricStats[item.fabricType]) {
        fabricStats[item.fabricType] = {
          expected: 0,
          actual: 0
        };
      }
      fabricStats[item.fabricType].expected += item.expectedPieces;
      fabricStats[item.fabricType].actual += item.actualPieces;
    });
    
    return {
      totalExpected,
      totalActual,
      totalDifference,
      percentageDiff,
      workerStats,
      fabricStats
    };
  };

  const summary = calculateSummary();

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <Button variant="outline-secondary" className="me-3" onClick={() => navigate(-1)}>
            <BsArrowLeft className="me-1" /> Back
          </Button>
          <h2 className="m-0">Output Difference Report</h2>
        </div>
        <div className="d-flex">
          <InputGroup className="search-box me-2">
            <InputGroup.Text className="bg-light">
              <BsSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by worker, fabric, size, lot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-start-0"
            />
            {searchTerm && (
              <Button 
                variant="outline-secondary" 
                onClick={() => setSearchTerm('')}
              >
                Clear
              </Button>
            )}
          </InputGroup>
        </div>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6} className="mb-3 mb-md-0">
              <Form.Group>
                <Form.Label>Date Range</Form.Label>
                <Row>
                  <Col>
                    <Form.Control
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                    />
                  </Col>
                  <Col>
                    <Form.Control
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                    />
                  </Col>
                </Row>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading report data...</p>
        </div>
      ) : (
        <>
          {summary && (
            <Row className="mb-4">
              <Col md={3} className="mb-3 mb-md-0">
                <Card className="h-100 text-center">
                  <Card.Body>
                    <h2>{summary.totalExpected}</h2>
                    <Card.Text>Expected Pieces</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3} className="mb-3 mb-md-0">
                <Card className="h-100 text-center">
                  <Card.Body>
                    <h2>{summary.totalActual}</h2>
                    <Card.Text>Actual Pieces</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3} className="mb-3 mb-md-0">
                <Card className="h-100 text-center">
                  <Card.Body>
                    <h2 className={summary.totalDifference >= 0 ? 'text-success' : 'text-danger'}>
                      {summary.totalDifference >= 0 ? '+' : ''}{summary.totalDifference}
                    </h2>
                    <Card.Text>Difference</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="h-100 text-center">
                  <Card.Body>
                    <h2 className={parseFloat(summary.percentageDiff) >= 0 ? 'text-success' : 'text-danger'}>
                      {parseFloat(summary.percentageDiff) >= 0 ? '+' : ''}{summary.percentageDiff}%
                    </h2>
                    <Card.Text>Percentage Difference</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
          
          <Row className="mb-4">
            <Col md={6} className="mb-3 mb-md-0">
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>Worker Performance</div>
                </Card.Header>
                <Card.Body>
                  {summary && Object.keys(summary.workerStats).length > 0 ? (
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>Worker</th>
                          <th>Expected</th>
                          <th>Actual</th>
                          <th>Difference</th>
                          <th>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(summary.workerStats).map(([worker, stats]) => {
                          const diff = stats.actual - stats.expected;
                          const percentDiff = stats.expected > 0 
                            ? ((diff / stats.expected) * 100).toFixed(2) 
                            : '0.00';
                          
                          return (
                            <tr key={worker}>
                              <td>{worker}</td>
                              <td>{stats.expected}</td>
                              <td>{stats.actual}</td>
                              <td className={diff >= 0 ? 'text-success' : 'text-danger'}>
                                {diff >= 0 ? '+' : ''}{diff}
                              </td>
                              <td className={parseFloat(percentDiff) >= 0 ? 'text-success' : 'text-danger'}>
                                {parseFloat(percentDiff) >= 0 ? '+' : ''}{percentDiff}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  ) : (
                    <Alert variant="info">No worker data available.</Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>Fabric Type Performance</div>
                </Card.Header>
                <Card.Body>
                  {summary && Object.keys(summary.fabricStats).length > 0 ? (
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>Fabric Type</th>
                          <th>Expected</th>
                          <th>Actual</th>
                          <th>Difference</th>
                          <th>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(summary.fabricStats).map(([fabric, stats]) => {
                          const diff = stats.actual - stats.expected;
                          const percentDiff = stats.expected > 0 
                            ? ((diff / stats.expected) * 100).toFixed(2) 
                            : '0.00';
                          
                          return (
                            <tr key={fabric}>
                              <td>{fabric}</td>
                              <td>{stats.expected}</td>
                              <td>{stats.actual}</td>
                              <td className={diff >= 0 ? 'text-success' : 'text-danger'}>
                                {diff >= 0 ? '+' : ''}{diff}
                              </td>
                              <td className={parseFloat(percentDiff) >= 0 ? 'text-success' : 'text-danger'}>
                                {parseFloat(percentDiff) >= 0 ? '+' : ''}{percentDiff}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  ) : (
                    <Alert variant="info">No fabric data available.</Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>Detailed Output Difference</div>
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={exportToCSV}
                disabled={filteredData.length === 0}
              >
                <BsDownload className="me-1" /> Export to CSV
              </Button>
            </Card.Header>
            <Card.Body>
              {filteredData.length > 0 ? (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Worker</th>
                      <th>Fabric Type</th>
                      <th>Size</th>
                      <th>Color</th>
                      <th>Expected Pieces</th>
                      <th>Actual Pieces</th>
                      <th>Difference</th>
                      <th>%</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item, index) => {
                      const difference = item.actualPieces - item.expectedPieces;
                      const percentageDiff = item.expectedPieces > 0 
                        ? ((difference / item.expectedPieces) * 100).toFixed(2) 
                        : '0.00';
                      
                      return (
                        <tr key={index} className={difference === 0 ? 'table-success' : difference < 0 ? 'table-danger' : 'table-warning'}>
                          <td>{formatDate(item.date)}</td>
                          <td>
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Click to filter by this worker</Tooltip>}
                            >
                              <Badge 
                                bg="secondary" 
                                className="worker-badge"
                                onClick={() => {
                                  setSearchTerm(item.workerName);
                                }}
                              >
                                {item.workerName}
                              </Badge>
                            </OverlayTrigger>
                          </td>
                          <td>
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Click to filter by this fabric</Tooltip>}
                            >
                              <Badge 
                                bg="info" 
                                className="fabric-badge"
                                onClick={() => {
                                  setSearchTerm(item.fabricType);
                                }}
                              >
                                {item.fabricType}
                              </Badge>
                            </OverlayTrigger>
                          </td>
                          <td>
                            <Badge bg="dark" pill>{item.size}</Badge>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div 
                                className="color-swatch me-2" 
                                style={{ 
                                  backgroundColor: item.color, 
                                  width: '16px', 
                                  height: '16px', 
                                  borderRadius: '50%',
                                  display: 'inline-block'
                                }} 
                              />
                              {item.color}
                            </div>
                          </td>
                          <td className="fw-bold">{item.expectedPieces}</td>
                          <td className="fw-bold">{item.actualPieces}</td>
                          <td>
                            <Badge bg={difference >= 0 ? 'success' : 'danger'} className="difference-badge">
                              {difference >= 0 ? '+' : ''}{difference}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={parseFloat(percentageDiff) >= 0 ? 'success' : 'danger'} className="percentage-badge">
                              {parseFloat(percentageDiff) >= 0 ? '+' : ''}{percentageDiff}%
                            </Badge>
                          </td>
                          <td>
                            <Button 
                              variant="outline-info" 
                              size="sm" 
                              className="details-button"
                              onClick={() => {
                                setSelectedItem(item);
                                setShowModal(true);
                              }}
                            >
                              <BsInfoCircle className="me-1" /> Details
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="info">
                  No output data found for the selected criteria.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </>
      )}
      {/* Modal for displaying worker and actual details */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Output Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <>
              <Row className="mb-4">
                <Col md={6}>
                  <Card>
                    <Card.Header>Worker Details</Card.Header>
                    <Card.Body>
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Worker Name</th>
                            <th>Operation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedItem.workerDetails && selectedItem.workerDetails.map((worker, idx) => (
                            <tr key={idx}>
                              <td>{worker.name}</td>
                              <td>{worker.operation}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card>
                    <Card.Header>Actual Production Details</Card.Header>
                    <Card.Body>
                      <Table striped bordered hover size="sm">
                        <tbody>
                          <tr>
                            <th>Load ID</th>
                            <td>{selectedItem.loadId}</td>
                          </tr>
                          <tr>
                            <th>Lot Number</th>
                            <td>{selectedItem.lotNo}</td>
                          </tr>
                          <tr>
                            <th>Size</th>
                            <td>{selectedItem.size}</td>
                          </tr>
                          <tr>
                            <th>Actual Quantity</th>
                            <td>{selectedItem.actualDetails.quantity}</td>
                          </tr>
                          <tr>
                            <th>Completed At</th>
                            <td>{formatDate(selectedItem.actualDetails.completedAt)}</td>
                          </tr>
                          {selectedItem.actualDetails.notes && (
                            <tr>
                              <th>Notes</th>
                              <td>{selectedItem.actualDetails.notes}</td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default OutputReport;
