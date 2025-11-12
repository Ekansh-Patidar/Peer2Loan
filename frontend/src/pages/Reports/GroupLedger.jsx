import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Alert, Loader, Button, Table, Input } from '../../components/common';
import reportService from '../../services/reportService';
import useAuth from '../../hooks/useAuth';
import './Reports.css';

/**
 * GroupLedger - Complete transaction history for a group
 */
const GroupLedger = () => {
  const { groupId } = useParams();
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchLedger();
  }, [groupId]);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportService.getGroupLedger(groupId);
      setData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch group ledger');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      await reportService.exportGroupCSV(groupId);
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    }
  };

  const handleExportPDF = async () => {
    try {
      await reportService.exportGroupPDF(groupId);
    } catch (err) {
      alert('Failed to export PDF: ' + err.message);
    }
  };

  if (loading) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <div className="reports-loading">
          <Loader variant="spinner" size="large" />
          <p>Loading ledger...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <Alert type="error" title="Error">
          {error}
        </Alert>
        <Button onClick={fetchLedger} style={{ marginTop: '16px' }}>
          Retry
        </Button>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <Alert type="info">No ledger data available</Alert>
      </DashboardLayout>
    );
  }

  const { group, transactions, summary } = data;

  // Filter transactions
  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      txn.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || txn.type === filterType;
    return matchesSearch && matchesType;
  });

  // Table columns
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Cycle',
      dataIndex: 'cycleNumber',
      key: 'cycleNumber',
      render: (cycle) => `#${cycle}`,
    },
    {
      title: 'Member',
      dataIndex: 'memberName',
      key: 'memberName',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <span
          style={{
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            background: type === 'contribution' ? '#e3f2fd' : type === 'payout' ? '#e8f5e9' : '#fff3e0',
            color: type === 'contribution' ? '#1976d2' : type === 'payout' ? '#2e7d32' : '#f57c00',
          }}
        >
          {type}
        </span>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => (
        <span
          style={{
            fontWeight: '600',
            color: record.type === 'payout' ? '#4caf50' : record.type === 'penalty' ? '#f44336' : '#1a1a1a',
          }}
        >
          {record.type === 'payout' ? '+' : '-'}₹{amount.toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className="reports-container">
        {/* Header */}
        <div className="reports-header">
          <div>
            <h1>Group Ledger</h1>
            <p className="reports-subtitle">{group.name}</p>
          </div>
          <div className="reports-actions">
            <Button variant="outline" onClick={handleExportCSV}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export PDF
            </Button>
            <Button variant="primary" onClick={fetchLedger}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="ledger-summary-grid">
          <Card variant="elevated">
            <div className="summary-stat">
              <div className="summary-stat-label">Total Contributions</div>
              <div className="summary-stat-value green">₹{summary.totalContributions.toLocaleString()}</div>
            </div>
          </Card>
          <Card variant="elevated">
            <div className="summary-stat">
              <div className="summary-stat-label">Total Payouts</div>
              <div className="summary-stat-value blue">₹{summary.totalPayouts.toLocaleString()}</div>
            </div>
          </Card>
          <Card variant="elevated">
            <div className="summary-stat">
              <div className="summary-stat-label">Total Penalties</div>
              <div className="summary-stat-value red">₹{summary.totalPenalties.toLocaleString()}</div>
            </div>
          </Card>
          <Card variant="elevated">
            <div className="summary-stat">
              <div className="summary-stat-label">Total Transactions</div>
              <div className="summary-stat-value">{summary.totalTransactions}</div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="ledger-filters">
            <Input
              placeholder="Search by member or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, maxWidth: '400px' }}
            />
            <div className="filter-buttons">
              <Button
                variant={filterType === 'all' ? 'primary' : 'ghost'}
                size="small"
                onClick={() => setFilterType('all')}
              >
                All
              </Button>
              <Button
                variant={filterType === 'contribution' ? 'primary' : 'ghost'}
                size="small"
                onClick={() => setFilterType('contribution')}
              >
                Contributions
              </Button>
              <Button
                variant={filterType === 'payout' ? 'primary' : 'ghost'}
                size="small"
                onClick={() => setFilterType('payout')}
              >
                Payouts
              </Button>
              <Button
                variant={filterType === 'penalty' ? 'primary' : 'ghost'}
                size="small"
                onClick={() => setFilterType('penalty')}
              >
                Penalties
              </Button>
            </div>
          </div>
        </Card>

        {/* Transactions Table */}
        <Card title="Transaction History" subtitle={`${filteredTransactions.length} transaction(s)`}>
          {filteredTransactions.length > 0 ? (
            <Table columns={columns} data={filteredTransactions} striped hoverable />
          ) : (
            <div className="empty-state">
              <p>No transactions found</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default GroupLedger;
