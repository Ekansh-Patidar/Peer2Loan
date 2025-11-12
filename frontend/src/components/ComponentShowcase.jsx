import React, { useState } from 'react';
import {
  Button,
  Input,
  Modal,
  Card,
  Table,
  Alert,
  Loader,
  FileUpload
} from './common';
import { DashboardLayout } from './layout';

/**
 * Component Showcase - Demo page for all common components
 * This file demonstrates how to use all the common components
 */
const ComponentShowcase = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [files, setFiles] = useState([]);

  // Sample data for table
  const tableColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500',
          background: status === 'Active' ? '#e8f5e9' : '#ffebee',
          color: status === 'Active' ? '#2e7d32' : '#c62828'
        }}>
          {status}
        </span>
      )
    }
  ];

  const tableData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Member', status: 'Active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Member', status: 'Inactive' }
  ];

  const user = {
    name: 'Demo User',
    email: 'demo@peer2loan.com'
  };

  return (
    <DashboardLayout user={user}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <h1>Component Showcase</h1>

        {/* Buttons */}
        <Card title="Buttons" subtitle="Various button styles and sizes">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="success">Success</Button>
            <Button variant="warning">Warning</Button>
            <Button variant="error">Error</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="text">Text</Button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', marginTop: '16px' }}>
            <Button size="small">Small</Button>
            <Button size="medium">Medium</Button>
            <Button size="large">Large</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
        </Card>

        {/* Inputs */}
        <Card title="Inputs" subtitle="Form input components">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              helperText="We'll never share your email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter password"
              required
            />
            <Input
              label="Disabled Input"
              placeholder="This is disabled"
              disabled
            />
            <Input
              label="Error Input"
              placeholder="This has an error"
              error="This field is required"
            />
          </div>
        </Card>

        {/* Alerts */}
        <Card title="Alerts" subtitle="Notification and alert messages">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Alert type="success" title="Success">
              Your changes have been saved successfully!
            </Alert>
            <Alert type="error" title="Error">
              An error occurred while processing your request.
            </Alert>
            <Alert type="warning" title="Warning">
              Please review your information before submitting.
            </Alert>
            <Alert type="info" closable onClose={() => console.log('Alert closed')}>
              This is an informational message with a close button.
            </Alert>
          </div>
        </Card>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <Card title="Default Card" variant="default" hoverable>
            This is a default card with hover effect.
          </Card>
          <Card title="Elevated Card" variant="elevated">
            This card has an elevated shadow.
          </Card>
          <Card title="Outlined Card" variant="outlined">
            This card has a colored outline.
          </Card>
        </div>

        {/* Table */}
        <Card title="Table" subtitle="Data table component">
          <Table
            columns={tableColumns}
            data={tableData}
            striped
            hoverable
            onRowClick={(row) => console.log('Row clicked:', row)}
          />
        </Card>

        {/* Loaders */}
        <Card title="Loaders" subtitle="Loading indicators">
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Loader variant="spinner" size="small" />
            <Loader variant="spinner" size="medium" />
            <Loader variant="dots" size="medium" />
            <Loader variant="pulse" size="medium" />
            <Loader variant="bars" size="medium" />
          </div>
        </Card>

        {/* File Upload */}
        <Card title="File Upload" subtitle="Drag and drop file upload">
          <FileUpload
            accept="image/*,.pdf"
            multiple
            onChange={(files) => setFiles(files)}
            helperText="Drag and drop images or PDFs (max 5MB)"
          />
        </Card>

        {/* Modal */}
        <Card title="Modal" subtitle="Modal dialog component">
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Example Modal"
            footer={
              <>
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setModalOpen(false)}>
                  Confirm
                </Button>
              </>
            }
          >
            <p>This is a modal dialog. You can put any content here.</p>
            <p>Click outside, press Escape, or use the buttons to close.</p>
          </Modal>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ComponentShowcase;
