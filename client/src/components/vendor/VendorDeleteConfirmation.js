import React, { useState } from 'react';
import { Modal, Button, Alert, Spinner, Form } from 'react-bootstrap';
import axios from 'axios';

const VendorDeleteConfirmation = ({ 
  show, 
  onHide, 
  vendor, 
  onDeleteSuccess,
  onError
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasAssociatedStock, setHasAssociatedStock] = useState(false);
  const [stockCount, setStockCount] = useState(0);
  const [forceDelete, setForceDelete] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Attempt to delete the vendor
      const url = forceDelete 
        ? `/api/vendors/${vendor._id}?forceDelete=true` 
        : `/api/vendors/${vendor._id}`;
        
      const response = await axios.delete(url);
      
      if (response.data.success) {
        setLoading(false);
        onDeleteSuccess(response.data.message);
      }
    } catch (err) {
      console.error('Error deleting vendor:', err);
      setLoading(false);
      
      // Check if this is a stock association error
      if (err.response?.data?.hasAssociatedStock) {
        setHasAssociatedStock(true);
        setStockCount(err.response.data.stockCount || 0);
        setError(err.response.data.message);
      } else {
        setError(err.response?.data?.message || 'Failed to delete vendor');
        if (onError) {
          onError(err.response?.data?.message || 'Failed to delete vendor');
        }
      }
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Confirm Deletion</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!hasAssociatedStock ? (
          <>
            <p>Are you sure you want to delete vendor <strong>{vendor?.shop_name}</strong>?</p>
            <p className="text-danger">This action cannot be undone and will remove all associated data.</p>
          </>
        ) : (
          <>
            <Alert variant="warning">
              <Alert.Heading>Associated Stock Found</Alert.Heading>
              <p>{error}</p>
              <p>This vendor has {stockCount} associated fabric stock items.</p>
              <hr />
              <p className="mb-0">
                You can either reassign the stock to another vendor or force delete the vendor and remove the vendor reference from stock items.
              </p>
            </Alert>
            
            <Form.Check 
              type="checkbox"
              id="force-delete-checkbox"
              label="Force delete and remove vendor reference from stock items"
              checked={forceDelete}
              onChange={(e) => setForceDelete(e.target.checked)}
              className="mb-3"
            />
            
            <p className="text-danger">
              <strong>Warning:</strong> Force deleting will remove the vendor reference from all stock items, which may make it difficult to track the origin of the fabric.
            </p>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button 
          variant="outline-secondary" 
          onClick={onHide}
          disabled={loading}
          className="px-4"
        >
          Cancel
        </Button>
        <Button 
          variant="danger" 
          onClick={handleDelete}
          disabled={loading}
          className="px-4"
        >
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
              Deleting...
            </>
          ) : (
            hasAssociatedStock && forceDelete ? 'Force Delete' : 'Delete'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default VendorDeleteConfirmation;
