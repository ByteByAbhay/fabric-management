import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Tab } from '@headlessui/react';
import { 
  ClockIcon, 
  PlusIcon, 
  DocumentTextIcon, 
  MagnifyingGlassIcon, 
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  UserGroupIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';

// Import our custom components
import Card from '../common/Card';
import Button from '../common/Button';
import Table from '../common/Table';

const ProcessList = () => {
  const navigate = useNavigate();
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [workerProcesses, setWorkerProcesses] = useState({});

  const fetchProcesses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/process?limit=100');
      setProcesses(response.data.data || []);
      
      // Process data to group by worker
      const groupedByWorker = groupProcessesByWorker(response.data.data || []);
      setWorkerProcesses(groupedByWorker);
      
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching processes:', err);
      setError('Failed to fetch process data. Please try again later.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  const groupProcessesByWorker = (processData) => {
    return processData.reduce((acc, process) => {
      const { worker_name } = process;
      
      if (!acc[worker_name]) {
        acc[worker_name] = {
          processes: [],
          totalPieces: 0,
          operations: new Set(),
          lastActivity: new Date(0),
          lineNumbers: new Set()
        };
      }
      
      // Add process to worker's list
      acc[worker_name].processes.push(process);
      
      // Update worker stats
      acc[worker_name].totalPieces += process.piece_count;
      acc[worker_name].operations.add(process.operation);
      acc[worker_name].lineNumbers.add(process.line_no);
      
      // Update last activity if this process is more recent
      const processDate = new Date(process.datetime);
      if (processDate > acc[worker_name].lastActivity) {
        acc[worker_name].lastActivity = processDate;
      }
      
      return acc;
    }, {});
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTimeSince = (dateString) => {
    const now = new Date();
    const then = new Date(dateString);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  const getActivityStatus = (dateString) => {
    const now = new Date();
    const then = new Date(dateString);
    const diffHours = (now - then) / (1000 * 60 * 60);
    
    if (diffHours < 2) return 'success'; // Active
    if (diffHours < 8) return 'warning'; // Idle
    return 'danger'; // Inactive
  };

  const getActivityLabel = (dateString) => {
    const status = getActivityStatus(dateString);
    
    if (status === 'success') return 'Active';
    if (status === 'warning') return 'Idle';
    return 'Inactive';
  };

  const getStatusColor = (status) => {
    const colors = {
      'success': 'bg-green-500',
      'warning': 'bg-yellow-400',
      'danger': 'bg-red-500',
      'primary': 'bg-primary-500',
      'secondary': 'bg-secondary-500',
      'info': 'bg-blue-500'
    };
    
    return colors[status] || 'bg-gray-500';
  };

  const getStatusTextColor = (status) => {
    const colors = {
      'success': 'text-green-500',
      'warning': 'text-yellow-500',
      'danger': 'text-red-500',
      'primary': 'text-primary-500',
      'secondary': 'text-secondary-500',
      'info': 'text-blue-500'
    };
    
    return colors[status] || 'text-gray-500';
  };

  const getWorkersArray = () => {
    return Object.entries(workerProcesses)
      .map(([name, data]) => ({
        name,
        ...data,
        operationsArray: Array.from(data.operations),
        lineNumbersArray: Array.from(data.lineNumbers),
        activityStatus: getActivityStatus(data.lastActivity)
      }))
      .sort((a, b) => b.lastActivity - a.lastActivity); // Sort by most recent activity
  };

  const getOperationColors = (operation) => {
    const operationColors = {
      'Stitching': 'success',
      'Cutting': 'primary',
      'Button': 'warning',
      'Zip': 'info',
      'Quality Check': 'danger'
    };
    
    return operationColors[operation] || 'secondary';
  };

  // Define table columns for the process list
  const columns = [
    {
      header: 'Date',
      field: 'datetime',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium">{formatDate(row.datetime)}</div>
          <div className="inline-flex items-center px-2 py-0.5 mt-1 text-xs rounded-full bg-gray-100 text-gray-600">
            <ClockIcon className="h-3 w-3 mr-1" aria-hidden="true" />
            {getTimeSince(row.datetime)}
          </div>
        </div>
      )
    },
    {
      header: 'Line',
      field: 'line_no',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {row.line_no}
        </span>
      )
    },
    {
      header: 'Operation',
      field: 'operation',
      sortable: true,
      render: (row) => {
        const colorClass = getStatusColor(getOperationColors(row.operation));
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${colorClass}`}>
            {row.operation}
          </span>
        );
      }
    },
    {
      header: 'Worker',
      field: 'worker_name',
      sortable: true
    },
    {
      header: 'Lot No',
      sortable: true,
      render: (row) => (
        row.cutting_reference?.lot_no ? (
          <Link 
            to={`/cutting/${row.cutting_reference._id}`} 
            className="text-primary-600 hover:text-primary-800 flex items-center"
          >
            {row.cutting_reference.lot_no}
            <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" aria-hidden="true" />
          </Link>
        ) : (
          <span className="text-gray-400 text-sm">N/A</span>
        )
      )
    },
    {
      header: 'Pieces',
      field: 'piece_count',
      sortable: true,
      cellClassName: 'text-right font-medium'
    }
  ];

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  const filteredProcesses = processes.filter(process => {
    return (
      process.worker_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.operation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (process.cutting_reference?.lot_no || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const workersArray = getWorkersArray();
  const filteredWorkers = workersArray.filter(worker => 
    worker.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Worker Processes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage all worker processes and production activities.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:flex space-x-3">
          <Button
            onClick={() => navigate('/process/report')}
            icon={<DocumentTextIcon className="h-5 w-5" />}
            variant="outline"
          >
            Worker Report
          </Button>
          
          <Button
            onClick={() => navigate('/process/new')}
            icon={<PlusIcon className="h-5 w-5" />}
            variant="primary"
          >
            New Process Entry
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="w-full md:w-auto flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-md border-0 py-2.5 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm"
                placeholder="Search worker, operation, or lot number..."
              />
            </div>
          </div>
        </div>
      </Card>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <Tab.Group>
          <div className="mb-4 border-b border-gray-200">
            <Tab.List className="-mb-px flex space-x-8">
              <Tab
                className={({ selected }) =>
                  classNames(
                    selected
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                    'flex whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm items-center'
                  )
                }
              >
                <UserGroupIcon className="h-5 w-5 mr-2" />
                Workers View
              </Tab>
              <Tab
                className={({ selected }) =>
                  classNames(
                    selected
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                    'flex whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm items-center'
                  )
                }
              >
                <ListBulletIcon className="h-5 w-5 mr-2" />
                Process List
              </Tab>
            </Tab.List>
          </div>
          
          <Tab.Panels>
            {/* Workers View */}
            <Tab.Panel>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWorkers.map(worker => (
                  <Card key={worker.name} className="h-full">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{worker.name}</h3>
                        <div className="flex flex-wrap mt-1 space-x-1">
                          {worker.operationsArray.map(operation => {
                            const colorClass = getStatusTextColor(getOperationColors(operation));
                            return (
                              <span key={operation} className={`text-xs mt-1 ${colorClass}`}>{operation}</span>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <span 
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            worker.activityStatus === 'success' ? 'bg-green-100 text-green-800' :
                            worker.activityStatus === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {getActivityLabel(worker.lastActivity)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 my-4">
                      <div className="bg-gray-50 p-3 rounded-md">
                        <span className="text-xs text-gray-500 block">Processes</span>
                        <span className="text-lg font-semibold">{worker.processes.length}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <span className="text-xs text-gray-500 block">Pieces</span>
                        <span className="text-lg font-semibold">{worker.totalPieces}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <span className="text-xs text-gray-500 block">Lines</span>
                        <span className="text-lg font-semibold">{worker.lineNumbersArray.join(', ')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 text-sm">
                      <div>
                        <span className="text-gray-500">Last active:</span>{' '}
                        <span className="font-medium">{getTimeSince(worker.lastActivity)}</span>
                      </div>
                      <button 
                        className="text-primary-600 hover:text-primary-800 flex items-center font-medium"
                        onClick={() => setSearchTerm(worker.name)}
                      >
                        View Details
                        <ArrowRightIcon className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
              
              {filteredWorkers.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No workers found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search to find workers.
                  </p>
                </div>
              )}
            </Tab.Panel>
            
            {/* Process List View */}
            <Tab.Panel>
              <Card>
                <Table
                  columns={columns}
                  data={filteredProcesses}
                  emptyMessage="No processes found. Try adjusting your search."
                />
              </Card>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      )}
    </div>
  );
};

export default ProcessList; 