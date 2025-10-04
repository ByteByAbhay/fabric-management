import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Spinner, Alert, Tabs, Tab, Badge, Button } from 'react-bootstrap';
import axios from 'axios';
import { BsDownload, BsArrowLeft } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';

// Function to get contrasting text color for a background
const getContrastColor = (hexColor) => {
  // Remove the # if it exists
  hexColor = hexColor?.replace('#', '') || '000000';
  
  // Parse the hex color
  const r = parseInt(hexColor.substr(0, 2), 16);
  const g = parseInt(hexColor.substr(2, 2), 16);
  const b = parseInt(hexColor.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black or white depending on background brightness
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

const DataReport = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('vendors');
  const [vendorData, setVendorData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch vendor data
        const vendorResponse = await axios.get('/api/vendors');
        setVendorData(vendorResponse.data.data || []);
        
        // Fetch stock data
        const stockResponse = await axios.get('/api/stock');
        setStockData(stockResponse.data.data || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError('Failed to load report data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportToCSV = (data, filename) => {
    // Create CSV content
    let csvContent = '';
    
    if (filename === 'vendors.csv') {
      // Headers for vendor data
      csvContent = 'Shop Name,Party Name,Bill No,Contact Number,Date,Payment Status,Total Weight\n';
      
      // Add vendor data rows
      data.forEach(vendor => {
        csvContent += `"${vendor.shop_name || ''}","${vendor.party_name || ''}","${vendor.bill_no || ''}","${vendor.contact_number || ''}","${formatDate(vendor.date_time)}","${vendor.payment_status || ''}","${vendor.totalWeight || 0}"\n`;
      });
    } else if (filename === 'stock.csv') {
      // Headers for stock data
      csvContent = 'Fabric Name,Color,Color Hex,Current Quantity,Standard Weight,Last Updated,Vendor\n';
      
      // Add stock data rows
      data.forEach(item => {
        csvContent += `"${item.fabric_name || ''}","${item.color || ''}","${item.color_hex || ''}","${item.current_quantity || 0}","${item.standard_weight || 0}","${formatDate(item.last_updated)}","${item.vendor?.shop_name || 'N/A'}"\n`;
      });
    }
    
    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderVendorReport = () => {
    if (vendorData.length === 0) {
      return <Alert variant="info">No vendor data available.</Alert>;
    }
    
    return (
      <>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>Vendor Report</h4>
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={() => exportToCSV(vendorData, 'vendors.csv')}
          >
            <BsDownload className="me-1" /> Export to CSV
          </Button>
        </div>
        
        <Table striped bordered hover responsive>
          <thead className="bg-light">
            <tr>
              <th>Shop Name</th>
              <th>Party Name</th>
              <th>Bill No</th>
              <th>Contact Number</th>
              <th>Date</th>
              <th>Payment Status</th>
              <th>Total Weight</th>
            </tr>
          </thead>
          <tbody>
            {vendorData.map(vendor => (
              <tr key={vendor._id}>
                <td>{vendor.shop_name}</td>
                <td>{vendor.party_name}</td>
                <td>{vendor.bill_no}</td>
                <td>{vendor.contact_number || 'N/A'}</td>
                <td>{formatDate(vendor.date_time)}</td>
                <td>
                  <Badge bg={
                    vendor.payment_status === 'Paid' ? 'success' :
                    vendor.payment_status === 'Partial' ? 'warning' : 'danger'
                  }>
                    {vendor.payment_status}
                  </Badge>
                </td>
                <td>{vendor.totalWeight ? vendor.totalWeight.toFixed(2) : '0.00'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        
        <Card className="mt-4">
          <Card.Header>Vendor Summary</Card.Header>
          <Card.Body>
            <Row>
              <Col md={4}>
                <Card className="text-center mb-3">
                  <Card.Body>
                    <h2>{vendorData.length}</h2>
                    <Card.Text>Total Vendors</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="text-center mb-3">
                  <Card.Body>
                    <h2>
                      {vendorData.reduce((total, vendor) => {
                        return total + (vendor.totalWeight || 0);
                      }, 0).toFixed(2)}
                    </h2>
                    <Card.Text>Total Weight (kg)</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="text-center mb-3">
                  <Card.Body>
                    <h2>
                      {vendorData.filter(v => v.payment_status === 'Paid').length}
                    </h2>
                    <Card.Text>Paid Vendors</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </>
    );
  };

  const renderStockReport = () => {
    if (stockData.length === 0) {
      return <Alert variant="info">No stock data available.</Alert>;
    }
    
    // Calculate fabric type summary
    const fabricSummary = stockData.reduce((acc, item) => {
      if (!acc[item.fabric_name]) {
        acc[item.fabric_name] = 0;
      }
      acc[item.fabric_name] += item.current_quantity || 0;
      return acc;
    }, {});
    
    // Calculate color summary
    const colorSummary = stockData.reduce((acc, item) => {
      if (!acc[item.color]) {
        acc[item.color] = 0;
      }
      acc[item.color] += item.current_quantity || 0;
      return acc;
    }, {});
    
    // Calculate total stock
    const totalStock = Object.values(fabricSummary).reduce((sum, qty) => sum + qty, 0);
    
    return (
      <>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>Stock Report</h4>
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={() => exportToCSV(stockData, 'stock.csv')}
          >
            <BsDownload className="me-1" /> Export to CSV
          </Button>
        </div>
        
        <Row className="mb-4">
          <Col md={4}>
            <Card className="text-center h-100">
              <Card.Body>
                <h2>{totalStock.toFixed(2)}</h2>
                <Card.Text>Total Stock (kg)</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center h-100">
              <Card.Body>
                <h2>{Object.keys(fabricSummary).length}</h2>
                <Card.Text>Fabric Types</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center h-100">
              <Card.Body>
                <h2>{Object.keys(colorSummary).length}</h2>
                <Card.Text>Color Varieties</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Row className="mb-4">
          <Col md={6}>
            <Card>
              <Card.Header>Stock by Fabric Type</Card.Header>
              <Card.Body>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Fabric Type</th>
                      <th>Quantity</th>
                      <th>% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(fabricSummary)
                      .sort((a, b) => b[1] - a[1])
                      .map(([fabric, quantity]) => (
                        <tr key={fabric}>
                          <td>{fabric}</td>
                          <td>{quantity.toFixed(2)}</td>
                          <td>
                            {((quantity / totalStock) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card>
              <Card.Header>Stock by Color</Card.Header>
              <Card.Body>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Color</th>
                      <th>Quantity</th>
                      <th>% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(colorSummary)
                      .sort((a, b) => b[1] - a[1])
                      .map(([color, quantity]) => {
                        // Find a stock item with this color to get its hex value
                        const stockItem = stockData.find(item => item.color === color);
                        const colorHex = stockItem?.color_hex || '#3498db';
                        
                        return (
                          <tr key={color}>
                            <td>
                              <div 
                                className="d-inline-block px-3 py-1 rounded" 
                                style={{
                                  backgroundColor: colorHex,
                                  color: getContrastColor(colorHex),
                                  minWidth: '80px',
                                  textAlign: 'center',
                                  fontWeight: '500'
                                }}
                              >
                                {color}
                              </div>
                            </td>
                            <td>{quantity.toFixed(2)}</td>
                            <td>
                              {((quantity / totalStock) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Card>
          <Card.Header>Detailed Stock List</Card.Header>
          <Card.Body>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Fabric Name</th>
                  <th>Color</th>
                  <th>Current Quantity</th>
                  <th>Standard Weight</th>
                  <th>Last Updated</th>
                  <th>Vendor</th>
                </tr>
              </thead>
              <tbody>
                {stockData.map(item => (
                  <tr key={item._id}>
                    <td>{item.fabric_name}</td>
                    <td>
                      <div 
                        className="d-inline-block px-3 py-1 rounded" 
                        style={{
                          backgroundColor: item.color_hex || '#3498db',
                          color: getContrastColor(item.color_hex || '#3498db'),
                          minWidth: '80px',
                          textAlign: 'center',
                          fontWeight: '500'
                        }}
                      >
                        {item.color}
                      </div>
                    </td>
                    <td>{item.current_quantity.toFixed(2)}</td>
                    <td>{item.standard_weight.toFixed(2)}</td>
                    <td>{formatDate(item.last_updated)}</td>
                    <td>{item.vendor ? item.vendor.shop_name : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </>
    );
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Data Reports</h1>
        <Button variant="outline-secondary" onClick={() => navigate('/')}>
          <BsArrowLeft className="me-1" /> Back to Dashboard
        </Button>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading report data...</p>
        </div>
      ) : (
        <Tabs
          activeKey={activeTab}
          onSelect={k => setActiveTab(k)}
          className="mb-4"
        >
          <Tab eventKey="vendors" title="Vendor Report">
            {renderVendorReport()}
          </Tab>
          <Tab eventKey="stock" title="Stock Report">
            {renderStockReport()}
          </Tab>
        </Tabs>
      )}
    </Container>
  );
};

export default DataReport;
