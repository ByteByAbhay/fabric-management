import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { PlusIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Button from '../common/Button';

// Define the process stages
const STAGES = [
  { id: 'cutting', name: 'Cutting', color: 'bg-blue-100 text-blue-800' },
  { id: 'stitching', name: 'Stitching', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'button', name: 'Button', color: 'bg-purple-100 text-purple-800' },
  { id: 'qc', name: 'Quality Check', color: 'bg-amber-100 text-amber-800' },
  { id: 'packaging', name: 'Packaging', color: 'bg-green-100 text-green-800' }
];

const ProcessKanban = () => {
  const [tasks, setTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/process');
        
        // Group tasks by stage
        const groupedTasks = STAGES.reduce((acc, stage) => {
          acc[stage.id] = [];
          return acc;
        }, {});
        
        // For demo purposes - using sample data
        const sampleTasks = [
          { id: '1', title: 'Lot 123 - Cotton Shirt', worker: 'John D.', pieces: 150, stage: 'cutting', qcStatus: null, image: 'https://via.placeholder.com/40', notes: 'Needs to be done by EOD' },
          { id: '2', title: 'Lot 124 - Denim Pants', worker: 'Sarah M.', pieces: 100, stage: 'stitching', qcStatus: null, image: 'https://via.placeholder.com/40', notes: 'Special stitching pattern' },
          { id: '3', title: 'Lot 125 - Silk Blouse', worker: 'Mike T.', pieces: 75, stage: 'button', qcStatus: null, image: 'https://via.placeholder.com/40', notes: 'Pearl buttons' },
          { id: '4', title: 'Lot 126 - Wool Jacket', worker: 'Emily R.', pieces: 50, stage: 'qc', qcStatus: 'pending', image: 'https://via.placeholder.com/40', notes: 'Check pattern alignment' },
          { id: '5', title: 'Lot 127 - Cotton T-Shirt', worker: 'David B.', pieces: 200, stage: 'packaging', qcStatus: 'passed', image: 'https://via.placeholder.com/40', notes: 'Box packaging' },
          { id: '6', title: 'Lot 128 - Polyester Dress', worker: 'Linda K.', pieces: 80, stage: 'qc', qcStatus: 'failed', image: 'https://via.placeholder.com/40', notes: 'Stitching issues found' },
          { id: '7', title: 'Lot 129 - Linen Shirt', worker: 'Robert S.', pieces: 120, stage: 'stitching', qcStatus: null, image: 'https://via.placeholder.com/40', notes: '' },
        ];
        
        // Populate groups with sample data
        sampleTasks.forEach(task => {
          if (groupedTasks[task.stage]) {
            groupedTasks[task.stage].push(task);
          }
        });
        
        setTasks(groupedTasks);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching process tasks:', err);
        setError('Failed to load tasks');
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, []);
  
  // Handle drag and drop
  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    
    // Dropped outside a valid droppable
    if (!destination) return;
    
    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;
    
    // Create a copy of the current tasks state
    const newTasks = { ...tasks };
    
    // Remove task from source
    const [movedTask] = newTasks[source.droppableId].splice(source.index, 1);
    
    // Add task to destination with updated stage
    const updatedTask = { ...movedTask, stage: destination.droppableId };
    newTasks[destination.droppableId].splice(destination.index, 0, updatedTask);
    
    // Update state optimistically
    setTasks(newTasks);
    
    // In a real app, you would update the backend here
    try {
      // await axios.patch(`/api/process/${draggableId}`, { stage: destination.droppableId });
      console.log(`Task ${draggableId} moved to ${destination.droppableId}`);
    } catch (err) {
      console.error('Error updating task:', err);
      // Revert to previous state on error
      setTasks({ ...tasks });
    }
  };
  
  // Handle QC status update
  const handleQCStatusUpdate = async (taskId, stage, index, status) => {
    const newTasks = { ...tasks };
    const taskIndex = newTasks[stage].findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
      newTasks[stage][taskIndex] = {
        ...newTasks[stage][taskIndex],
        qcStatus: status
      };
      
      // If passed QC and in QC stage, move to packaging
      if (status === 'passed' && stage === 'qc') {
        const [movedTask] = newTasks[stage].splice(taskIndex, 1);
        const updatedTask = { ...movedTask, stage: 'packaging' };
        newTasks['packaging'].push(updatedTask);
      }
      
      // Update state optimistically
      setTasks(newTasks);
      
      // In a real app, you would update the backend here
      try {
        // await axios.patch(`/api/process/${taskId}`, { qcStatus: status });
        console.log(`Task ${taskId} QC status updated to ${status}`);
      } catch (err) {
        console.error('Error updating QC status:', err);
        // Revert to previous state on error
        setTasks({ ...tasks });
      }
    }
  };
  
  // Get QC status badge color
  const getQCStatusColor = (status) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Worker Process Board</h1>
          <p className="mt-1 text-sm text-gray-500">
            Drag and drop tasks between stages to update their status
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Button
            to="/process/new"
            variant="primary"
            icon={<PlusIcon className="h-5 w-5" />}
          >
            New Process
          </Button>
        </div>
      </div>
      
      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 overflow-x-auto">
          {STAGES.map((stage) => (
            <div key={stage.id} className="flex flex-col h-full min-w-[280px]">
              <div className={`px-4 py-2 rounded-t-lg ${stage.color} flex items-center justify-between`}>
                <h3 className="font-semibold">{stage.name}</h3>
                <span className="text-xs font-medium rounded-full bg-white px-2 py-0.5">
                  {tasks[stage.id]?.length || 0}
                </span>
              </div>
              
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 min-h-[70vh] rounded-b-lg p-2 ${
                      snapshot.isDraggingOver ? 'bg-gray-100' : 'bg-gray-50'
                    } border border-gray-200 border-t-0 overflow-y-auto`}
                  >
                    {tasks[stage.id]?.length > 0 ? (
                      tasks[stage.id].map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-3 rounded-lg bg-white border border-gray-200 shadow-sm ${
                                snapshot.isDragging ? 'shadow-md' : ''
                              }`}
                            >
                              <div className="p-3">
                                <div className="flex items-start">
                                  <div className="flex-shrink-0">
                                    <img
                                      src={task.image}
                                      alt={task.worker}
                                      className="h-10 w-10 rounded-full"
                                    />
                                  </div>
                                  <div className="ml-3 flex-1 min-w-0">
                                    <Link
                                      to={`/process/${task.id}`}
                                      className="text-sm font-medium text-gray-900 hover:text-indigo-600 truncate block"
                                    >
                                      {task.title}
                                    </Link>
                                    <p className="text-xs text-gray-500">
                                      <span className="font-medium">{task.worker}</span> •{' '}
                                      <span>{task.pieces} pieces</span>
                                    </p>
                                  </div>
                                </div>
                                
                                {task.notes && (
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-500 line-clamp-2">
                                      {task.notes}
                                    </p>
                                  </div>
                                )}
                                
                                <div className="mt-2 flex items-center justify-between">
                                  {task.qcStatus ? (
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getQCStatusColor(
                                        task.qcStatus
                                      )}`}
                                    >
                                      {task.qcStatus.charAt(0).toUpperCase() + task.qcStatus.slice(1)}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400">
                                      {stage.id === 'qc' ? 'Pending QC' : ''}
                                    </span>
                                  )}
                                  
                                  {stage.id === 'qc' && task.qcStatus !== 'passed' && task.qcStatus !== 'failed' && (
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={() => handleQCStatusUpdate(task.id, stage.id, index, 'passed')}
                                        className="text-green-600 hover:text-green-800"
                                        title="Pass QC"
                                      >
                                        <CheckCircleIcon className="h-5 w-5" />
                                      </button>
                                      <button
                                        onClick={() => handleQCStatusUpdate(task.id, stage.id, index, 'failed')}
                                        className="text-red-600 hover:text-red-800"
                                        title="Fail QC"
                                      >
                                        <XCircleIcon className="h-5 w-5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-20 border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-500">No tasks</p>
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default ProcessKanban; 