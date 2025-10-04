import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Import our custom components
import Card from '../common/Card';
import Button from '../common/Button';
import FormInput from '../common/FormInput';
import FormCheckbox from '../common/FormCheckbox';

const CuttingTrackingForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    program_no: '',
    pattern: '',
    datetime: new Date().toISOString().split('T')[0],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    custom_sizes: [],
    rolls: [],
    l_length: '',
    avg_weight_per_piece: '',
    cut_by: '',
    entry_by: '',
    start_time: '',
    end_time: ''
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAddRoll = () => {
    const newRoll = {
      roll_no: `R${formData.rolls.length + 1}`,
      color: '',
      weight: '',
      layers: Array(20).fill(0)
    };
    
    setFormData(prev => ({
      ...prev,
      rolls: [...prev.rolls, newRoll]
    }));
  };

  const handleRollChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      rolls: prev.rolls.map((roll, i) => 
        i === index ? { ...roll, [field]: value } : roll
      )
    }));
  };

  const handleLayerChange = (rollIndex, layerIndex, value) => {
    setFormData(prev => ({
      ...prev,
      rolls: prev.rolls.map((roll, i) => 
        i === rollIndex ? {
          ...roll,
          layers: roll.layers.map((layer, j) => 
            j === layerIndex ? parseInt(value) || 0 : layer
          )
        } : roll
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await axios.post('/api/cutting/tracking', formData);
      navigate('/cutting');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create cutting tracking entry.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Cutting Tracking</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track cutting operations with detailed roll and layer information.
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
        <Card title="Basic Information" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label="Program Number"
              name="program_no"
              value={formData.program_no}
              onChange={(e) => setFormData(prev => ({ ...prev, program_no: e.target.value }))}
              required
            />
            <FormInput
              label="Pattern"
              name="pattern"
              value={formData.pattern}
              onChange={(e) => setFormData(prev => ({ ...prev, pattern: e.target.value }))}
              required
            />
            <FormInput
              label="Date"
              name="datetime"
              type="date"
              value={formData.datetime}
              onChange={(e) => setFormData(prev => ({ ...prev, datetime: e.target.value }))}
              required
            />
          </div>
        </Card>

        <Card title="Sizes" className="mb-6">
          <div className="grid grid-cols-5 gap-4">
            {formData.sizes.map(size => (
              <FormCheckbox
                key={size}
                label={size}
                checked={formData.sizes.includes(size)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData(prev => ({
                      ...prev,
                      sizes: [...prev.sizes, size]
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      sizes: prev.sizes.filter(s => s !== size)
                    }));
                  }
                }}
              />
            ))}
          </div>
        </Card>

        <Card title="Rolls" className="mb-6">
          <div className="space-y-4">
            {formData.rolls.map((roll, rollIndex) => (
              <div key={rollIndex} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <FormInput
                    label="Roll Number"
                    value={roll.roll_no}
                    disabled
                  />
                  <FormInput
                    label="Color"
                    value={roll.color}
                    onChange={(e) => handleRollChange(rollIndex, 'color', e.target.value)}
                    required
                  />
                  <FormInput
                    label="Weight"
                    type="number"
                    step="0.01"
                    value={roll.weight}
                    onChange={(e) => handleRollChange(rollIndex, 'weight', e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {roll.layers.map((layer, layerIndex) => (
                    <FormInput
                      key={layerIndex}
                      label={`Layer ${layerIndex + 1}`}
                      type="number"
                      value={layer}
                      onChange={(e) => handleLayerChange(rollIndex, layerIndex, e.target.value)}
                    />
                  ))}
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddRoll}
            >
              Add Roll
            </Button>
          </div>
        </Card>

        <Card title="Additional Information" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label="L. Length"
              name="l_length"
              value={formData.l_length}
              onChange={(e) => setFormData(prev => ({ ...prev, l_length: e.target.value }))}
            />
            <FormInput
              label="Average Weight/Piece"
              name="avg_weight_per_piece"
              type="number"
              step="0.01"
              value={formData.avg_weight_per_piece}
              onChange={(e) => setFormData(prev => ({ ...prev, avg_weight_per_piece: e.target.value }))}
            />
            <FormInput
              label="Cut By"
              name="cut_by"
              value={formData.cut_by}
              onChange={(e) => setFormData(prev => ({ ...prev, cut_by: e.target.value }))}
              required
            />
            <FormInput
              label="Entry By"
              name="entry_by"
              value={formData.entry_by}
              onChange={(e) => setFormData(prev => ({ ...prev, entry_by: e.target.value }))}
              required
            />
            <FormInput
              label="Start Time"
              name="start_time"
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
              required
            />
            <FormInput
              label="End Time"
              name="end_time"
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
              required
            />
          </div>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/cutting')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Cutting Tracking'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CuttingTrackingForm; 