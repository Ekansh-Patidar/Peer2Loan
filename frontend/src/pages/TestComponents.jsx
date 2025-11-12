import React, { useState } from 'react';
import { Button, Input, Card, Alert } from '../components/common';

function TestComponents() {
  const [name, setName] = useState('');

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Component Test Page</h1>
      
      <Card title="Test Card" style={{ marginBottom: '20px' }}>
        <Alert type="success">Components are working!</Alert>
        
        <div style={{ marginTop: '20px' }}>
          <Input
            label="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>
        
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="success">Success</Button>
        </div>
      </Card>
    </div>
  );
}

export default TestComponents;
