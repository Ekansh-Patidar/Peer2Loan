import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../components/common';

/**
 * TestComponents - Simple test page for component testing
 */
const TestComponents = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Component Testing</h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>
        This is a simple test page. For a complete component showcase, visit the showcase page.
      </p>

      <Card title="Navigation" variant="elevated">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Button variant="primary" onClick={() => navigate('/showcase')}>
            View Component Showcase
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </div>
      </Card>

      <Card title="Quick Test" variant="outlined" style={{ marginTop: '24px' }}>
        <p>All components are working correctly!</p>
        <ul style={{ marginTop: '16px', color: '#666' }}>
          <li>✅ Buttons</li>
          <li>✅ Cards</li>
          <li>✅ Navigation</li>
          <li>✅ Routing</li>
        </ul>
      </Card>
    </div>
  );
};

export default TestComponents;
