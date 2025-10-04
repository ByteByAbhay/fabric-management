import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Card, Table } from 'react-bootstrap';

const InlineStock = () => {
  const [groupedData, setGroupedData] = useState({});

  const fetchInlineStock = async () => {
    try {
      const response = await axios.get('/api/inline-stock');
      if (response.data.success) {
        setGroupedData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching inline stock:', error);
      alert('Failed to fetch inline stock. Please try again.');
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete all items? This action cannot be undone.')) {
      try {
        const response = await axios.delete('/api/inline-stock/all');
        if (response.data.success) {
          alert(`Successfully deleted ${response.data.message}`);
          fetchInlineStock();
        }
      } catch (error) {
        console.error('Error deleting items:', error);
        alert('Failed to delete items. Please try again.');
      }
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      try {
        const response = await axios.delete(`/api/inline-stock/${id}`);
        if (response.data.success) {
          alert('Item deleted successfully');
          fetchInlineStock();
        }
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Failed to delete item. Please try again.');
      }
    }
  };

  useEffect(() => {
    fetchInlineStock();
  }, []);

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Inline Stock</h2>
        <Button variant="danger" onClick={handleDeleteAll}>
          Delete All Items
        </Button>
      </div>
      
      {Object.entries(groupedData).map(([date, items]) => (
        <Card key={date} className="mb-4">
          <Card.Header>
            <h5>{date}</h5>
          </Card.Header>
          <Card.Body>
            <Table bordered responsive>
              <thead>
                <tr>
                  <th>Load ID</th>
                  <th>Size</th>
                  <th>Colors</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id}>
                    <td>{item.loadId}</td>
                    <td>{item.size}</td>
                    <td>
                      {Object.entries(item.colors).map(([color, data]) => (
                        <div key={color}>
                          {color}: {data.quantity} ({data.bundle})
                        </div>
                      ))}
                    </td>
                    <td>{item.total}</td>
                    <td>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => handleDeleteItem(item._id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};

export default InlineStock; 