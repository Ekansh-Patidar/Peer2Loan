import React from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Alert, Loader, Button } from '../../components/common';
import {
  StatusCards,
  ContributionHeatmap,
  PotCounter,
  UpcomingTurn,
} from '../../components/features/dashboard';
import useDashboard from '../../hooks/useDashboard';
import useAuth from '../../hooks/useAuth';
import './Dashboard.css';

/**
 * AdminDashboard - Organizer/Admin view of group dashboard
 */
const AdminDashboard = () => {
  const { groupId } = useParams();
  const { data, loading, error, refresh } = useDashboard('group', groupId);
  const { user, logout } = useAuth();

  if (loading) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <div className="dashboard-loading">
          <Loader variant="spinner" size="large" />
          <p>Loading dashboard...</p>
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
        <Button onClick={refresh} style={{ marginTop: '16px' }}>
          Retry
        </Button>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <Alert type="info">No dashboard data available</Alert>
      </DashboardLayout>
    );
  }

  const { group, activeCycle, contributionHeatmap, stats, upcomingCycles, alerts } = data;

  // Prepare stats for StatusCards
  const statusStats = [
    {
      type: 'members',
      label: 'Total Members',
      value: stats.totalMembers,
      subtext: `${stats.activeMembers} active`,
    },
    {
      type: 'collected',
      label: 'Total Collected',
      value: stats.totalCollected.toLocaleString(),
      prefix: '₹',
    },
    {
      type: 'disbursed',
      label: 'Total Disbursed',
      value: stats.totalDisbursed.toLocaleString(),
      prefix: '₹',
    },
    {
      type: 'cycles',
      label: 'Completed Cycles',
      value: stats.completedCycles,
      subtext: `of ${group.totalCycles}`,
    },
  ];

  // Add active cycle stats if available
  if (activeCycle) {
    statusStats.push(
      {
        type: 'pending',
        label: 'Pending Payments',
        value: activeCycle.pendingCount,
      },
      {
        type: 'late',
        label: 'Late Payments',
        value: activeCycle.lateCount,
      }
    );
  }

  // Add unpaid penalties stat if available
  if (stats.unpaidPenaltiesCount > 0) {
    statusStats.push({
      type: 'penalties',
      label: 'Unpaid Penalties',
      value: stats.unpaidPenaltiesCount,
      subtext: `₹${stats.unpaidPenalties.toLocaleString()} total`,
    });
  }

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>{group.name}</h1>
            <p className="dashboard-subtitle">
              Cycle {group.currentCycle} of {group.totalCycles} • ₹{group.monthlyContribution.toLocaleString()}/month
            </p>
          </div>
          <div className="dashboard-actions">
            {group.status === 'draft' && (
              <Button
                variant="success"
                onClick={async () => {
                  if (window.confirm('Are you sure you want to activate this group? This will start the first cycle and cannot be undone.')) {
                    try {
                      const api = (await import('../../services/api')).default;
                      await api.post(`/groups/${groupId}/activate`);
                      alert('Group activated successfully!');
                      refresh();
                    } catch (err) {
                      alert(err.message || 'Failed to activate group');
                    }
                  }
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                  <path d="M5 3l14 9-14 9V3z" />
                </svg>
                Activate Group
              </Button>
            )}
            <Button variant="outline" onClick={refresh}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {alerts && alerts.length > 0 && (
          <div className="dashboard-alerts">
            {alerts.map((alert, index) => (
              <Alert key={index} type={alert.type}>
                {alert.message}
              </Alert>
            ))}
          </div>
        )}

        {/* Pot Counter */}
        <PotCounter amount={group.potAmount} label="Current Pot Amount" />

        {/* Status Cards */}
        <StatusCards stats={statusStats} />

        {/* Active Cycle Info */}
        {activeCycle && (
          <Card title={`Cycle ${activeCycle.cycleNumber} - Active`} variant="elevated">
            <div className="cycle-info">
              <div className="cycle-info-item">
                <span className="label">Beneficiary:</span>
                <span className="value">{activeCycle.beneficiary} (Turn {activeCycle.beneficiaryTurn})</span>
              </div>
              <div className="cycle-info-item">
                <span className="label">Period:</span>
                <span className="value">
                  {new Date(activeCycle.startDate).toLocaleDateString()} - {new Date(activeCycle.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="cycle-info-item">
                <span className="label">Collection:</span>
                <span className="value">
                  ₹{activeCycle.collectedAmount.toLocaleString()} / ₹{activeCycle.expectedAmount.toLocaleString()} ({activeCycle.collectionPercentage}%)
                </span>
              </div>
              <div className="cycle-info-item">
                <span className="label">Status:</span>
                <span className="value">
                  {activeCycle.paidCount} paid, {activeCycle.pendingCount} pending, {activeCycle.lateCount} late
                </span>
              </div>
              {activeCycle.isReadyForPayout && !activeCycle.isPayoutCompleted && (
                <Button variant="success" style={{ marginTop: '16px' }}>
                  Process Payout
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Contribution Heatmap */}
        {contributionHeatmap && contributionHeatmap.length > 0 && (
          <ContributionHeatmap data={contributionHeatmap} />
        )}

        {/* Upcoming Turns */}
        {upcomingCycles && upcomingCycles.length > 0 && (
          <UpcomingTurn turns={upcomingCycles} currentCycle={group.currentCycle} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
