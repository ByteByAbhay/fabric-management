import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert, Form, Spinner } from 'react-bootstrap';
import axios from 'axios';

const VendorDeleteModal = ({ show, onHide, vendorId, vendorName, onDeleteSuccess }) => {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [error, setError] = useState(null);
  const [stockCount, setStockCount] = useState(0);
  const [deleteOption, setDeleteOption] = useState('reassign');

  useEffect(() => {
    if (show && vendorId) {
      fetchVendorStock();
      fetchVendorOptions();
    }
  }, [show, vendorId]);

  const fetchVendorStock = async () => {
    try {
      const response = await axios.get(`/api/vendors/${vendorId}`);
      if (response.data.fabricStock) {
        setStockCount(response.data.fabricStock.length);
      }
    } catch (err) {
      console.error('Error fetching vendor stock:', err);
      setError('Failed to check vendor stock.');
    }
  };

  const fetchVendorOptions = async () => {
    try {
      setLoadingVendors(true);
      const response = await axios.get('/api/vendors');
      // Filter out the current vendor
      const filteredVendors = response.data.data.filter(vendor => vendor._id !== vendorId);
      setVendors(filteredVendors);
      setLoadingVendors(false);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError('Failed to load vendor options.');
      setLoadingVendors(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);

      if (deleteOption === 'reassign' && !selectedVendor) {
        setError('Please select a vendor to reassign stock to.');
        setLoading(false);
        return;
      }

      if (deleteOption === 'reassign' && selectedVendor) {
        // First reassign stock
        await axios.post(`/api/vendors/reassign-stock/${vendorId}/${selectedVendor}`);
      }

      // Then delete vendor - Use forceDelete for option 'delete'
      const deleteUrl = deleteOption === 'delete' 
        ? `/api/vendors/${vendorId}?forceDelete=true`
        : `/api/vendors/${vendorId}`;
      
      await axios.delete(deleteUrl);
      
      setLoading(false);
      onDeleteSuccess();
      onHide();
    } catch (err) {
      console.error('Error during vendor deletion:', err);
      setError(err.response?.data?.message || 'Failed to delete vendor.');
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Delete Vendor</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        {stockCount > 0 ? (
          <>
            <Alert variant="warning">
              <strong>Warning:</strong> This vendor has {stockCount} associated fabric stock items.
              You need to either reassign or remove the stock before deletion.
            </Alert>
            
            <Form.Group className="mb-3">
              <Form.Label>Choose an option:</Form.Label>
              <Form.Check 
                type="radio" 
                id="reassign-option" 
                label="Reassign stock to another vendor" 
                name="deleteOption" 
                value="reassign" 
                checked={deleteOption === 'reassign'} 
                onChange={() => setDeleteOption('reassign')} 
              />
              <Form.Check 
                type="radio" 
                id="delete-option" 
                label="Remove vendor reference from stock (makes stock unassigned)" 
                name="deleteOption" 
                value="delete" 
                checked={deleteOption === 'delete'} 
                onChange={() => setDeleteOption('delete')} 
              />
            </Form.Group>
            
            {deleteOption === 'reassign' && (
              <Form.Group className="mb-3">
                <Form.Label>Select vendor to reassign stock to:</Form.Label>
                {loadingVendors ? (
                  <div className="text-center">
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : (
                  <Form.Select 
                    value={selectedVendor} 
                    onChange={(e) => setSelectedVendor(e.target.value)}
                    disabled={vendors.length === 0}
                  >
                    <option value="">Select a vendor...</option>
                    {vendors.map(vendor => (
                      <option key={vendor._id} value={vendor._id}>
                        {vendor.shop_name} ({vendor.party_name || 'No party name'})
                      </option>
                    ))}
                  </Form.Select>
                )}
                {vendors.length === 0 && !loadingVendors && (
                  <Alert variant="info" className="mt-2">
                    No other vendors available for reassignment.
                  </Alert>
                )}
              </Form.Group>
            )}
          </>
        ) : (
          <p>Are you sure you want to delete vendor "{vendorName}"?</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="danger" 
          onClick={handleDelete} 
          disabled={loading || (deleteOption === 'reassign' && !selectedVendor && stockCount > 0)}
        >
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              <span className="ms-2">Processing...</span>
            </>
          ) : (
            'Delete Vendor'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default VendorDeleteModal;
