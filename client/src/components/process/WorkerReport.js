import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeftIcon, 
  ExclamationTriangleIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Import our custom components
import Card from '../common/Card';
import Button from '../common/Button';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import Table from '../common/Table';

const WorkerReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    workerName: queryParams.get('workerName') || '',
    operation: ''
  });
  const [workers, setWorkers] = useState([]);
  const [operations, setOperations] = useState([]);

  useEffect(() => {
    // Fetch list of workers and operations for filter dropdowns
    fetchWorkersList();
    fetchOperationsList();
    
    // If we have a worker name in the URL, generate report automatically
    if (queryParams.get('workerName')) {
      generateReport();
    }
  }, []);

  const fetchWorkersList = async () => {
    try {
      const response = await axios.get('/api/process/workers');
      setWorkers(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch workers list', err);
    }
  };

  const fetchOperationsList = async () => {
    try {
      const response = await axios.get('/api/process/operations');
      setOperations(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch operations list', err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construct query parameters
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.workerName) params.append('workerName', filters.workerName);
      if (filters.operation) params.append('operation', filters.operation);
      
      const response = await axios.get(`/api/process/report?${params.toString()}`);
      
      // Transform the data for reporting
      const reportData = transformReportData(response.data.data);
      setReports(reportData);
      setLoading(false);
    } catch (err) {
      setError('Failed to generate report. Please try again.');
      setLoading(false);
    }
  };

  // Transform the raw data into a grouped format for the report
  const transformReportData = (data) => {
    // Group by worker name and operation
    const groupedData = data.reduce((acc, item) => {
      const key = `${item.worker_name}-${item.operation}`;
      
      if (!acc[key]) {
        acc[key] = {
          worker_name: item.worker_name,
          operation: item.operation,
          total_pieces: 0,
          lot_numbers: new Set(),
          dates: new Set()
        };
      }
      
      acc[key].total_pieces += item.piece_count;
      if (item.cutting_reference?.lot_no) {
        acc[key].lot_numbers.add(item.cutting_reference.lot_no);
      }
      acc[key].dates.add(new Date(item.datetime).toLocaleDateString());
      
      return acc;
    }, {});
    
    // Convert to array and format for display
    return Object.values(groupedData).map(item => ({
      ...item,
      lot_numbers: Array.from(item.lot_numbers).join(', '),
      dates: Array.from(item.dates).join(', '),
      avg_daily_production: Math.round(item.total_pieces / item.dates.size)
    }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      workerName: '',
      operation: ''
    });
  };

  // Define columns for the report table
  const columns = [
    {
      header: 'Worker Name',
      field: 'worker_name',
      sortable: true
    },
    {
      header: 'Operation',
      field: 'operation',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
          {row.operation}
        </span>
      )
    },
    {
      header: 'Total Pieces',
      field: 'total_pieces',
      sortable: true,
      cellClassName: 'font-medium text-right'
    },
    {
      header: 'Lot Numbers',
      field: 'lot_numbers',
      cellClassName: 'max-w-xs truncate'
    },
    {
      header: 'Working Dates',
      field: 'dates',
      cellClassName: 'max-w-xs truncate'
    },
    {
      header: 'Avg. Daily',
      field: 'avg_daily_production',
      sortable: true,
      cellClassName: 'font-medium text-right'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Worker Operations Report</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and analyze worker productivity and operation statistics.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            onClick={() => navigate('/process')}
            icon={<ArrowLeftIcon className="h-5 w-5" />}
            variant="outline"
          >
            Back to Process List
          </Button>
        </div>
      </div>

      <Card 
        title="Report Filters"
        subtitle="Select criteria to generate your report"
        headerActions={
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            icon={<XMarkIcon className="h-4 w-4" />}
          >
            Clear
          </Button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <FormInput
            label="Start Date"
            id="startDate"
            name="startDate"
            type="date"
            value={filters.startDate}
            onChange={handleFilterChange}
          />
          
          <FormInput
            label="End Date"
            id="endDate"
            name="endDate"
            type="date"
            value={filters.endDate}
            onChange={handleFilterChange}
          />
          
          <FormSelect
            label="Worker"
            id="workerName"
            name="workerName"
            value={filters.workerName}
            onChange={handleFilterChange}
            options={[
              { label: 'All Workers', value: '' },
              ...workers.map(worker => ({ label: worker, value: worker }))
            ]}
          />
          
          <FormSelect
            label="Operation"
            id="operation"
            name="operation"
            value={filters.operation}
            onChange={handleFilterChange}
            options={[
              { label: 'All Operations', value: '' },
              ...operations.map(operation => ({ label: operation, value: operation }))
            ]}
          />
        </div>
        
        <div className="flex justify-end">
          <Button
            onClick={generateReport}
            icon={<FunnelIcon className="h-5 w-5" />}
          >
            Generate Report
          </Button>
        </div>
      </Card>

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

      {reports.length > 0 && (
        <Card 
          title="Worker Operations Summary"
          subtitle={`Showing ${reports.length} result${reports.length !== 1 ? 's' : ''}`}
        >
          <Table
            columns={columns}
            data={reports}
            loading={loading}
            initialSortField="worker_name"
            emptyMessage="No data available for the selected criteria."
            striped={true}
          />
        </Card>
      )}
      
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      )}
    </div>
  );
};

export default WorkerReport; 