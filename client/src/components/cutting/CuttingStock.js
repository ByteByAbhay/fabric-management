import React, { useState, useEffect } from 'react';
import { Table, Card, Row, Col, Button, Modal, Form } from 'react-bootstrap';
import axios from '../../utils/axios';

const CuttingStock = () => {
  const [cuttingData, setCuttingData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedDayData, setSelectedDayData] = useState(null);
  const [loadData, setLoadData] = useState({
    text: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchCuttingData = async () => {
    try {
      const response = await axios.get('/api/cutting');
      const formattedData = formatCuttingData(response.data.data);
      setCuttingData(formattedData);
    } catch (error) {
      console.error('Error fetching cutting data:', error);
    }
  };

  const formatCuttingData = (data) => {
    return data.reduce((acc, cutting) => {
      if (!cutting.after_cutting_complete) return acc;

      const lotNo = cutting.lot_no;
      if (!acc[lotNo]) {
        acc[lotNo] = {
          lotNo,
          pattern: cutting.pattern,
          date: new Date(cutting.datetime).toLocaleDateString(),
          summary: {},
          sizeTotals: {},
          sizes: cutting.sizes // <-- store actual sizes for this batch
        };
      }

      // Count roles by color
      const colorRoles = cutting.roles.reduce((colorCount, role) => {
        const color = role.role_color;
        colorCount[color] = (colorCount[color] || 0) + 1;
        return colorCount;
      }, {});

      // Aggregate data by color
      cutting.roles.forEach(role => {
        const color = role.role_color;
        if (!acc[lotNo].summary[color]) {
          acc[lotNo].summary[color] = {
            roles: colorRoles[color],
            sizes: {},
            total: 0
          };
          // Initialize only the batch's sizes
          cutting.sizes.forEach(size => {
            acc[lotNo].summary[color].sizes[size] = 0;
          });
        }
        cutting.sizes.forEach(size => {
          // Use pieces_cut for each size if available, else fallback to layers_cut
          const quantity = (role.pieces_cut && typeof role.pieces_cut === 'object' && role.pieces_cut[size])
            ? role.pieces_cut[size]
            : (role.layers_cut || 0);
          acc[lotNo].summary[color].sizes[size] += quantity;
          acc[lotNo].summary[color].total += quantity;
          acc[lotNo].sizeTotals[size] = (acc[lotNo].sizeTotals[size] || 0) + quantity;
        });
      });

      return acc;
    }, {});
  };

  const handleLoadClick = (size, dayData) => {
    setSelectedSize(size);
    setSelectedDayData(dayData);
    setLoadData({
      text: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedSize(null);
    setSelectedDayData(null);
    setLoadData({
      text: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleSubmit = async () => {
    try {
      if (!loadData.text.trim()) {
        alert('Please enter a descriptive Load Name');
        return;
      }

      const inlineStockData = {
        loadId: loadData.text,
        date: loadData.date,
        size: selectedSize,
        lotNo: selectedDayData.lotNo,  // Add lot number for better tracking
        pattern: selectedDayData.pattern, // Add pattern information
        colors: {},
        total: selectedDayData.sizeTotals[selectedSize]
      };

      Object.entries(selectedDayData.summary).forEach(([color, data]) => {
        if (data.sizes[selectedSize] > 0) {
          inlineStockData.colors[color] = {
            quantity: data.sizes[selectedSize],
            bundle: data.roles
          };
        }
      });

      // Use the correct endpoint to move and remove the size from cutting stock
      const response = await axios.post('/api/inline-stock/remove-loaded', inlineStockData);

      if (response.data.success) {
        setCuttingData(prevData => {
          const updatedData = { ...prevData };
          const lotData = updatedData[selectedDayData.lotNo];
          
          if (lotData) {
            lotData.sizeTotals[selectedSize] = 0;
            Object.keys(lotData.summary).forEach(color => {
              lotData.summary[color].sizes[selectedSize] = 0;
              lotData.summary[color].total = Object.values(lotData.summary[color].sizes)
                .reduce((sum, qty) => sum + qty, 0);
            });
          }
          
          return updatedData;
        });

        handleModalClose();
      } else {
        // Show backend error message if available
        alert('Failed to move items to inline stock. ' + (response.data.error || 'Please try again.'));
      }
    } catch (error) {
      // Show error details from backend if available
      if (error.response && error.response.data && error.response.data.error) {
        alert('Failed to move items to inline stock. ' + error.response.data.error);
      } else {
        alert('Failed to move items to inline stock. Please try again.');
      }
      console.error('Move to inline stock error:', error);
    }
  };

  useEffect(() => {
    fetchCuttingData();
    const interval = setInterval(fetchCuttingData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Helper to get the actual sizes for a lot
  const getLotSizes = (lotData) => lotData.sizes || [];

  return (
    <div className="p-4">
      <h2 className="mb-4">Cutting Stock Summary</h2>
      {Object.values(cuttingData).map((lotData) => {
        const lotSizes = getLotSizes(lotData);
        return (
          <Card key={lotData.lotNo} className="mb-4">
            <Card.Header>
              <Row>
                <Col md={1}>
                  <h3 className="text-primary">{lotData.lotNo}</h3>
                </Col>
                <Col>
                  <h5>Pattern: {lotData.pattern}</h5>
                  <div className="text-muted">
                    Date: {lotData.date}
                  </div>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              <Table bordered responsive>
                <thead>
                  <tr>
                    <th>SUMMARY</th>
                    {lotSizes.map(size => (
                      <th key={size}>{size}</th>
                    ))}
                    <th>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(lotData.summary).map(([color, data]) => (
                    <tr key={color}>
                      <td>
                        {color}
                        <span className="ms-2 text-muted">({data.roles})</span>
                      </td>
                      {lotSizes.map(size => (
                        <td key={size}>{data.sizes[size]}</td>
                      ))}
                      <td>{data.total}</td>
                    </tr>
                  ))}
                  <tr>
                    <td></td>
                    {lotSizes.map(size => (
                      <td key={size}>
                        {lotData.sizeTotals[size] > 0 && (
                          <Button 
                            variant="success" 
                            size="sm" 
                            onClick={() => handleLoadClick(size, lotData)}
                          >
                            LOAD
                          </Button>
                        )}
                      </td>
                    ))}
                    <td></td>
                  </tr>
                  <tr className="table-secondary">
                    <td>TOTAL</td>
                    {lotSizes.map(size => (
                      <td key={size}>{lotData.sizeTotals[size]}</td>
                    ))}
                    <td>{Object.values(lotData.summary).reduce((sum, data) => sum + data.total, 0)}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        );
      })}

      <Modal show={showModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Load Details - Size {selectedSize}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Load Name</Form.Label>
              <Form.Control
                type="text"
                value={loadData.text}
                onChange={(e) => setLoadData({ ...loadData, text: e.target.value })}
                placeholder="Enter descriptive name"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={loadData.date}
                onChange={(e) => setLoadData({ ...loadData, date: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Close
          </Button>
          <Button variant="success" onClick={handleSubmit}>
            Load
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CuttingStock;