import React, { useState, useEffect } from 'react';
import { Table, Card, Row, Col, Button, Form, Alert, Modal, Spinner } from 'react-bootstrap';
import axios from '../../utils/axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const InlineStock = () => {
  const [inlineStockData, setInlineStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferDate, setTransferDate] = useState(new Date());
  const [selectedSize, setSelectedSize] = useState('S');
  const [loadId, setLoadId] = useState('');

  // Available sizes
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

  useEffect(() => {
    fetchInlineStockData();
  }, []);

  const fetchInlineStockData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/inline-stock');
      
      // Process data to identify records with missing lot numbers or patterns
      const processedData = response.data.data.map(item => ({
        ...item,
        hasMissingData: !item.lotNo || !item.pattern
      }));
      
      setInlineStockData(processedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching inline stock data:', error);
      setError('Failed to load inline stock data. Please try again.');
      setLoading(false);
    }
  };

  const handleTransferStock = async () => {
    try {
      if (!loadId.trim()) {
        setError('Load ID is required');
        return;
      }

      setLoading(true);
      setError(null);
      setSuccess(null);

      // Call the API to transfer stock from cutting to inline stock
      // The backend will now ensure lot numbers and patterns are properly transferred
      const response = await axios.post('/api/inline-stock/remove-loaded', {
        date: transferDate,
        size: selectedSize,
        loadId: loadId
      });

      // Display success message with lot number and pattern information if available
      const successMessage = response.data.lotNo && response.data.pattern
        ? `Successfully transferred ${response.data.totalPieces} pieces to inline stock (Lot: ${response.data.lotNo}, Pattern: ${response.data.pattern})`
        : `Successfully transferred ${response.data.totalPieces} pieces to inline stock`;
      
      setSuccess(successMessage);
      setShowTransferModal(false);
      setLoadId('');
      
      // Refresh the inline stock data
      fetchInlineStockData();
    } catch (error) {
      console.error('Error transferring stock:', error);
      setError(error.response?.data?.error || 'Failed to transfer stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearInlineStock = async () => {
    if (!window.confirm('Are you sure you want to clear all inline stock? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await axios.delete('/api/inline-stock/clear');
      setSuccess('All inline stock items have been cleared');
      setInlineStockData([]);
    } catch (error) {
      console.error('Error clearing inline stock:', error);
      setError('Failed to clear inline stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Inline Stock</h2>
        <div>
          <Button 
            variant="primary" 
            className="me-2" 
            onClick={() => setShowTransferModal(true)}
            disabled={loading}
          >
            Transfer from Cutting
          </Button>
          <Button 
            variant="danger" 
            onClick={handleClearInlineStock}
            disabled={loading || inlineStockData.length === 0}
          >
            Clear All
          </Button>
        </div>
      </div>

      {loading && <div className="text-center my-4"><Spinner animation="border" /></div>}
      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

      {inlineStockData.length === 0 && !loading ? (
        <Alert variant="info">No inline stock items found. Transfer items from cutting to get started.</Alert>
      ) : (
        inlineStockData.map((stockItem) => (
          <Card key={stockItem.loadId} className={`mb-4 ${stockItem.hasMissingData ? 'border-danger' : ''}`}>
            <Card.Header className={stockItem.hasMissingData ? 'bg-danger bg-opacity-10' : ''}>
              <Row>
                <Col>
                  <h5>{stockItem.loadId}</h5>
                  {stockItem.lotNo ? (
                    <h6>Lot: {stockItem.lotNo}</h6>
                  ) : (
                    <h6 className="text-danger">Missing Lot Number</h6>
                  )}
                </Col>
                <Col className="text-end">
                  <h6>Date: {new Date(stockItem.date).toLocaleDateString()}</h6>
                  {stockItem.pattern ? (
                    <h6>Pattern: {stockItem.pattern}</h6>
                  ) : (
                    <h6 className="text-danger">Missing Pattern</h6>
                  )}
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              <h6 className="mb-3">Size: {stockItem.size}</h6>
              <Table bordered responsive>
                <thead>
                  <tr>
                    <th>Color</th>
                    <th>Bundle</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stockItem.colors).map(([color, data]) => (
                    <tr key={color}>
                      <td>{color}</td>
                      <td>{data.bundle}</td>
                      <td>{data.quantity}</td>
                    </tr>
                  ))}
                  <tr className="table-secondary">
                    <td colSpan="2"><strong>Total</strong></td>
                    <td><strong>{stockItem.total}</strong></td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        ))
      )}

      {/* Transfer Modal */}
      <Modal show={showTransferModal} onHide={() => setShowTransferModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Transfer Stock from Cutting</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <DatePicker
                selected={transferDate}
                onChange={(date) => setTransferDate(date)}
                className="form-control"
                dateFormat="yyyy-MM-dd"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Size</Form.Label>
              <Form.Select 
                value={selectedSize} 
                onChange={(e) => setSelectedSize(e.target.value)}
              >
                {sizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Load ID</Form.Label>
              <Form.Control 
                type="text" 
                value={loadId} 
                onChange={(e) => setLoadId(e.target.value)}
                placeholder="Enter a unique load identifier"
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTransferModal(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleTransferStock} disabled={loading}>
            {loading ? <><Spinner animation="border" size="sm" /> Processing...</> : 'Transfer Stock'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default InlineStock;