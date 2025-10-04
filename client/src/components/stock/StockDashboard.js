import React, { useState, useEffect } from 'react';
import { Card, Table, Row, Col, Badge, Spinner, Alert, InputGroup, FormControl } from 'react-bootstrap';
import api from '../../utils/axios';

const StockDashboard = () => {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockByFabric, setStockByFabric] = useState({});
  const [stockByColor, setStockByColor] = useState({});

  useEffect(() => {
    const fetchStock = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching stock data...');
        // Only get active (non-processed) stock by default
        const response = await api.get('/stock/report');
        
        if (!response.data || !response.data.stockItems || !Array.isArray(response.data.stockItems)) {
          console.error('Invalid stock data format:', response.data);
          setStockItems([]);
          setStockByFabric({});
          setStockByColor({});
          throw new Error('Invalid stock data returned from server');
        }
        
        console.log(`Successfully fetched ${response.data.stockItems.length} stock items`);
        console.log(`Total active stock: ${response.data.totalActiveStock}, Total stock: ${response.data.totalStock}`);
        
        // Use the active stock items (non-processed)
        const stockData = response.data.stockItems.filter(item => !item.processed);
        setStockItems(stockData);
        
        // Only process data if we have items
        if (stockData.length > 0) {
          try {
            // Use the type summary from the API response
            const fabricSummary = {};
            response.data.typeSummary.forEach(type => {
              fabricSummary[type.fabricType] = type.activeQuantity;
            });
            setStockByFabric(fabricSummary);
            
            // Process data for summary by color (only active stock)
            const colorSummary = stockData.reduce((acc, item) => {
              if (!item || !item.colorName) return acc;
              
              if (!acc[item.colorName]) {
                acc[item.colorName] = 0;
              }
              acc[item.colorName] += Number(item.currentStock) || 0;
              return acc;
            }, {});
            setStockByColor(colorSummary);
          } catch (processingError) {
            console.error('Error processing stock data:', processingError);
            setStockByFabric({});
            setStockByColor({});
          }
        } else {
          // No data, set empty objects
          setStockByFabric({});
          setStockByColor({});
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching stock data:', err);
        // Provide more detailed error message for debugging
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch stock data.';
        console.log('Error details:', {
          message: errorMessage,
          response: err.response?.data,
          status: err.response?.status
        });
        
        setError(errorMessage);
        setLoading(false);
        
        // Set empty data to prevent UI issues
        setStockItems([]);
        setStockByFabric({});
        setStockByColor({});
      }
    };
    
    fetchStock();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // Helper function to determine text color based on background color
  const getContrastColor = (hex) => {
    // Default to black if hex is invalid
    if (!hex || hex.length < 7) return '#000000';
    
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 128 ? '#000000' : '#ffffff';
    } catch (error) {
      console.error('Error calculating contrast color:', error);
      return '#000000'; // Default to black on error
    }
  };

  const filteredStock = stockItems.filter(item => {
    // Safely check if fields exist before calling toLowerCase
    const fabricTypeMatch = item.fabricType && item.fabricType.toLowerCase().includes(searchTerm.toLowerCase());
    const colorNameMatch = item.colorName && item.colorName.toLowerCase().includes(searchTerm.toLowerCase());
    return fabricTypeMatch || colorNameMatch;
  });

  // Calculate total stock with safety check
  const totalStock = stockByFabric && Object.keys(stockByFabric).length > 0
    ? Object.values(stockByFabric).reduce((sum, qty) => sum + qty, 0)
    : 0;

  return (
    <div>
      <h1 className="mb-4">Fabric Stock Dashboard</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <>
          {/* Stock Summary Cards */}
          <Row className="mb-4">
            <Col md={4} className="mb-3">
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center">
                  <Card.Title>Total Stock</Card.Title>
                  <h2 className="display-4">{totalStock ? totalStock.toFixed(2) : "0.00"}</h2>
                  <Card.Text>Total weight across all fabrics</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4} className="mb-3">
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center">
                  <Card.Title>Fabric Types</Card.Title>
                  <h2 className="display-4">{Object.keys(stockByFabric).length}</h2>
                  <Card.Text>Different fabric types in stock</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4} className="mb-3">
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center">
                  <Card.Title>Color Variants</Card.Title>
                  <h2 className="display-4">{Object.keys(stockByColor).length}</h2>
                  <Card.Text>Different color options available</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* Stock by Fabric Type */}
          <Row className="mb-4">
            <Col md={6}>
              <Card className="shadow-sm">
                <Card.Header>Stock by Fabric Type</Card.Header>
                <Card.Body>
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Fabric Name</th>
                        <th>Quantity</th>
                        <th>% of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockByFabric && Object.keys(stockByFabric).length > 0 ? 
                        Object.entries(stockByFabric).map(([fabric, quantity]) => (
                          <tr key={fabric}>
                            <td>{fabric}</td>
                            <td>{quantity.toFixed(2)}</td>
                            <td>
                              {totalStock > 0 ? ((quantity / totalStock) * 100).toFixed(1) : '0'}%
                            </td>
                          </tr>
                        ))
                      : <tr><td colSpan="3" className="text-center">No fabric data available</td></tr>
                      }
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card className="shadow-sm">
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
                      {stockByColor && Object.keys(stockByColor).length > 0 ? 
                        Object.entries(stockByColor)
                          .sort((a, b) => a[0].localeCompare(b[0])) // Sort colors alphabetically
                          .map(([color, quantity]) => {
                          // Find a stock item with this color to get its hex value
                          const stockItem = stockItems.find(item => item.color === color);
                          const colorHex = stockItem?.color_hex || '#3498db';
                          
                          // Calculate contrast color for text
                          const getContrastColor = (hex) => {
                            const r = parseInt(hex.slice(1, 3), 16);
                            const g = parseInt(hex.slice(3, 5), 16);
                            const b = parseInt(hex.slice(5, 7), 16);
                            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                            return brightness > 128 ? '#000000' : '#ffffff';
                          };
                          
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
                        })
                      : <tr><td colSpan="3" className="text-center">No color data available</td></tr>
                      }
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* Detailed Stock Table */}
          <Card className="shadow-sm mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <div>Detailed Stock List</div>
                <div className="w-25">
                  <InputGroup size="sm">
                    <InputGroup.Text>Search</InputGroup.Text>
                    <FormControl
                      placeholder="Filter by fabric or color..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Fabric Name</th>
                    <th>Color</th>
                    <th>Current Quantity ({stockItems.length > 0 && stockItems[0].weight_type ? stockItems[0].weight_type : 'kg/m'})</th>
                    <th>Incoming Date</th>
                    <th>Shop Name</th>
                    <th>Party Name</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStock.length > 0 ? (
                    // Sort colors alphabetically
                    [...filteredStock]
                      .sort((a, b) => (a.colorName || '').localeCompare(b.colorName || ''))
                      .map(item => (
                      <tr key={`${item.fabricId}`}>
                        <td>{item.fabricType}</td>
                        <td>
                          <div 
                            className="d-inline-block px-3 py-1 rounded" 
                            style={{
                              backgroundColor: item.colorHex || '#3498db',
                              color: getContrastColor(item.colorHex || '#3498db'),
                              minWidth: '80px',
                              textAlign: 'center',
                              fontWeight: '500'
                            }}
                          >
                            {item.colorName}
                          </div>
                        </td>
                        <td>{Number(item.currentStock).toFixed(2)}</td>
                        <td>{formatDate(item.lastUpdated)}</td>
                        <td>{item.vendorName || 'N/A'}</td>
                        <td>{item.partyName || 'N/A'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">No stock items found</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

export default StockDashboard; 