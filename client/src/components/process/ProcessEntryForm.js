import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Import our custom components
import Card from '../common/Card';
import Button from '../common/Button';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import Form from 'react-bootstrap/Form';

const ProcessEntryForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    line_no: '',
    operation: '',
    worker_name: '',
    cutting_reference: '',
    piece_count: 0,
    datetime: new Date().toISOString().split('T')[0],
    sizes: {
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0
    }
  });
  
  const [completedCuttings, setCompletedCuttings] = useState([]);
  const [selectedCutting, setSelectedCutting] = useState(null);
  const [maxPieces, setMaxPieces] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompletedCuttings = async () => {
      try {
        // Get only completed cutting batches
        const response = await axios.get('/api/cutting');
        const completed = response.data.data.filter(cutting => cutting.after_cutting_complete);
        setCompletedCuttings(completed);
        setFetchingData(false);
      } catch (err) {
        setError('Failed to fetch cutting data.');
        setFetchingData(false);
      }
    };
    
    fetchCompletedCuttings();
  }, []);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cutting_reference' && value) {
      const selectedCut = completedCuttings.find(cut => cut._id === value);
      setSelectedCutting(selectedCut);
      
      // Calculate max pieces available
      if (selectedCut) {
        const totalPiecesCut = selectedCut.roles.reduce((total, role) => total + (role.pieces_cut || 0), 0);
        
        // Get already processed pieces for this cutting
        const fetchProcessedPieces = async () => {
          try {
            const processResponse = await axios.get(`/api/process`);
            const processed = processResponse.data.data
              .filter(p => p.cutting_reference && p.cutting_reference._id === value)
              .reduce((sum, p) => sum + p.piece_count, 0);
            
            setMaxPieces(totalPiecesCut - processed);
          } catch (err) {
            setError('Failed to calculate available pieces.');
          }
        };
        
        fetchProcessedPieces();
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'piece_count' ? parseInt(value, 10) || 0 : value
    }));
  };

  const handleSizeChange = (size, value) => {
    setFormData(prev => ({
      ...prev,
      sizes: {
        ...prev.sizes,
        [size]: parseInt(value) || 0
      }
    }));
  };

  const handleLoadSize = (size) => {
    setFormData(prev => ({
      ...prev,
      sizes: {
        ...prev.sizes,
        [size]: 0
      }
    }));
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (formData.piece_count > maxPieces) {
        throw new Error(`Cannot process more than ${maxPieces} pieces from this cutting batch.`);
      }
      
      await axios.post('/api/process', formData);
      navigate('/process');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create process entry.');
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Common operations in textile manufacturing
  const commonOperations = [
    { label: 'Stitching', value: 'Stitching' },
    { label: 'Button Attachment', value: 'Button' },
    { label: 'Zip Installation', value: 'Zip' },
    { label: 'Quality Check', value: 'Quality Check' },
    { label: 'Cutting', value: 'Cutting' },
    { label: 'Finishing', value: 'Finishing' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Record Worker Process</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track worker activities and production progress by recording process details.
        </p>
      </div>
      
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-1 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <Card 
          title="Process Information" 
          subtitle="Enter the details of the worker process"
          className="mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label="Line Number"
              id="line_no"
              name="line_no"
              value={formData.line_no}
              onChange={handleChange}
              placeholder="Enter production line number"
              required
            />
            
            <Form.Group className="mb-3">
              <Form.Label>Operation</Form.Label>
              <Form.Control
                type="text"
                name="operation"
                value={formData.operation}
                onChange={handleChange}
                required
                placeholder="Enter operation name"
              />
            </Form.Group>
            
            <FormInput
              label="Worker Name"
              id="worker_name"
              name="worker_name"
              value={formData.worker_name}
              onChange={handleChange}
              placeholder="Enter worker's full name"
              required
            />
            
            <FormInput
              label="Date"
              id="datetime"
              name="datetime"
              type="date"
              value={formData.datetime}
              onChange={handleChange}
              required
            />
            
            <FormSelect
              label="Cutting Batch"
              id="cutting_reference"
              name="cutting_reference"
              value={formData.cutting_reference}
              onChange={handleChange}
              options={completedCuttings.map(cutting => ({
                label: `${cutting.lot_no} - ${cutting.pattern}`,
                value: cutting._id
              }))}
              placeholder="Select cutting batch"
              required
              helpText={selectedCutting ? 
                `Pattern: ${selectedCutting.pattern}, Total Available: ${maxPieces} pieces` : 
                'Select a cutting batch to see available pieces'
              }
            />
            
            <FormInput
              label="Pieces Processed"
              id="piece_count"
              name="piece_count"
              type="number"
              value={formData.piece_count}
              onChange={handleChange}
              required
              min="1"
              max={maxPieces}
              helpText={maxPieces > 0 ? `Maximum available: ${maxPieces} pieces` : ''}
              error={formData.piece_count > maxPieces ? `Cannot exceed ${maxPieces} pieces` : ''}
            />
          </div>
        </Card>
        
        <div className="grid grid-cols-6 gap-4">
          {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
            <div key={size} className="space-y-2">
              <FormInput
                label={size}
                type="number"
                value={formData.sizes[size]}
                onChange={(e) => handleSizeChange(size, e.target.value)}
                min="0"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleLoadSize(size)}
                className="w-full"
              >
                LOAD
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Summary</h3>
          <div className="grid grid-cols-6 gap-4">
            {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
              <div key={size}>
                <p className="text-sm text-gray-600">{size}</p>
                <p className="text-lg font-medium">{formData.sizes[size]}</p>
              </div>
            ))}
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-lg font-medium">
                {Object.values(formData.sizes).reduce((sum, val) => sum + val, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/process')}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading || maxPieces === 0 || !formData.cutting_reference}
          >
            {loading ? 'Saving...' : 'Record Process'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProcessEntryForm;