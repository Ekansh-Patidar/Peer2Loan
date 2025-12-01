const Group = require('../models/Group.model');
const Member = require('../models/Member.model');
const Cycle = require('../models/Cycle.model');
const Payment = require('../models/Payment.model');
const Payout = require('../models/Payout.model');
const Penalty = require('../models/Penalty.model');
const AuditLog = require('../models/AuditLog.model');
const ApiError = require('../utils/apiError');

/**
 * Get group ledger
 */
const getGroupLedger = async (groupId) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw ApiError.notFound('Group not found');
  }

  // Get all cycles with payments and payouts
  const cycles = await Cycle.find({ group: groupId })
    .populate('beneficiary')
    .populate({ path: 'beneficiary', populate: { path: 'user', select: 'name' } })
    .sort({ cycleNumber: 1 });

  const cycleDetails = await Promise.all(
    cycles.map(async (cycle) => {
      const payments = await Payment.find({ cycle: cycle._id })
        .populate('member')
        .populate({ path: 'member', populate: { path: 'user', select: 'name' } });

      const payout = await Payout.findOne({ cycle: cycle._id });

      return {
        cycleNumber: cycle.cycleNumber,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        status: cycle.status,
        beneficiary: cycle.beneficiary.user.name,
        beneficiaryTurn: cycle.beneficiary.turnNumber,
        expectedAmount: cycle.expectedAmount,
        collectedAmount: cycle.collectedAmount,
        payoutAmount: cycle.payoutAmount,
        paidCount: cycle.paidCount,
        pendingCount: cycle.pendingCount,
        lateCount: cycle.lateCount,
        payments: payments.map((p) => ({
          member: p.member.user.name,
          turnNumber: p.member.turnNumber,
          amount: p.amount,
          status: p.status,
          paidAt: p.paidAt,
          isLate: p.isLate,
          lateFee: p.lateFee,
        })),
        payout: payout ? {
          amount: payout.amount,
          status: payout.status,
          completedAt: payout.completedAt,
          transferReference: payout.transferReference,
        } : null,
      };
    })
  );

  return {
    group: {
      name: group.name,
      monthlyContribution: group.monthlyContribution,
      memberCount: group.memberCount,
      duration: group.duration,
      status: group.status,
      startDate: group.startDate,
      endDate: group.endDate,
    },
    stats: group.stats,
    cycles: cycleDetails,
  };
};

/**
 * Get monthly summary
 */
const getMonthlySummary = async (groupId, cycleNumber) => {
  const cycle = await Cycle.findOne({ group: groupId, cycleNumber })
    .populate('beneficiary')
    .populate({ path: 'beneficiary', populate: { path: 'user', select: 'name email phone' } })
    .populate('group');

  if (!cycle) {
    throw ApiError.notFound('Cycle not found');
  }

  // Get payments for this cycle
  const payments = await Payment.find({ cycle: cycle._id })
    .populate('member')
    .populate({ path: 'member', populate: { path: 'user', select: 'name email phone' } });

  // Get penalties for this cycle
  const penalties = await Penalty.find({ cycle: cycle._id })
    .populate('member')
    .populate({ path: 'member', populate: { path: 'user', select: 'name' } });

  // Get payout
  const payout = await Payout.findOne({ cycle: cycle._id });

  // Generate summary text
  const paidMembers = payments.filter((p) => p.status === 'paid' || p.status === 'confirmed').length;
  const totalMembers = cycle.totalMembers;
  const collectedAmount = cycle.collectedAmount;
  const expectedAmount = cycle.expectedAmount;
  const variance = collectedAmount - expectedAmount;

  let summaryText = `Month ${cycleNumber}: ${paidMembers}/${totalMembers} paid; `;
  summaryText += `₹${collectedAmount} collected (Expected: ₹${expectedAmount}); `;
  
  if (payout && payout.status === 'completed') {
    summaryText += `Payout of ₹${payout.amount} to ${cycle.beneficiary.user.name} completed on ${payout.completedAt.toLocaleDateString()}`;
  } else if (cycle.isReadyForPayout) {
    summaryText += `Ready for payout to ${cycle.beneficiary.user.name}`;
  } else {
    const pendingCount = cycle.pendingCount;
    summaryText += `${pendingCount} payment(s) pending`;
  }

  if (cycle.lateCount > 0) {
    summaryText += `; ${cycle.lateCount} late payment(s)`;
  }

  return {
    cycle: {
      cycleNumber: cycle.cycleNumber,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
      status: cycle.status,
    },
    beneficiary: {
      name: cycle.beneficiary.user.name,
      email: cycle.beneficiary.user.email,
      phone: cycle.beneficiary.user.phone,
      turnNumber: cycle.beneficiary.turnNumber,
    },
    financials: {
      expectedAmount,
      collectedAmount,
      variance,
      totalPenalties: cycle.totalPenalties,
    },
    payments: payments.map((p) => ({
      member: p.member.user.name,
      turnNumber: p.member.turnNumber,
      amount: p.amount,
      status: p.status,
      paidAt: p.paidAt,
      dueDate: p.dueDate,
      isLate: p.isLate,
      daysLate: p.daysLate,
      lateFee: p.lateFee,
    })),
    penalties: penalties.map((p) => ({
      member: p.member.user.name,
      type: p.type,
      amount: p.amount,
      reason: p.reason,
      isPaid: p.isPaid,
      isWaived: p.isWaived,
    })),
    payout: payout ? {
      amount: payout.amount,
      status: payout.status,
      transferMode: payout.transferMode,
      transferReference: payout.transferReference,
      completedAt: payout.completedAt,
    } : null,
    summary: summaryText,
  };
};

/**
 * Get member ledger
 */
const getMemberLedger = async (memberId) => {
  const member = await Member.findById(memberId)
    .populate('user', 'name email phone')
    .populate('group', 'name monthlyContribution duration');

  if (!member) {
    throw ApiError.notFound('Member not found');
  }

  // Get all payments
  const payments = await Payment.find({ member: memberId })
    .populate('cycle', 'cycleNumber startDate endDate')
    .sort({ createdAt: 1 });

  // Get all penalties
  const penalties = await Penalty.find({ member: memberId })
    .populate('cycle', 'cycleNumber')
    .sort({ createdAt: 1 });

  // Get payout if received
  const payout = member.hasReceivedPayout
    ? await Payout.findOne({ beneficiary: memberId })
    : null;

  // Calculate contribution history
  const contributionHistory = payments.map((p) => ({
    cycleNumber: p.cycle.cycleNumber,
    date: p.paidAt,
    amount: p.amount,
    status: p.status,
    isLate: p.isLate,
    lateFee: p.lateFee,
  }));

  // Calculate running balance
  let runningBalance = 0;
  const balanceHistory = [];

  payments.forEach((p) => {
    runningBalance -= p.amount + (p.lateFee || 0);
    balanceHistory.push({
      cycleNumber: p.cycle.cycleNumber,
      date: p.paidAt,
      type: 'payment',
      amount: -(p.amount + (p.lateFee || 0)),
      runningBalance,
    });
  });

  if (payout) {
    runningBalance += payout.amount;
    balanceHistory.push({
      cycleNumber: payout.cycle ? payout.cycle.cycleNumber : member.turnNumber,
      date: payout.completedAt,
      type: 'payout',
      amount: payout.amount,
      runningBalance,
    });
  }

  return {
    member: {
      name: member.user.name,
      email: member.user.email,
      phone: member.user.phone,
      turnNumber: member.turnNumber,
      status: member.status,
    },
    group: {
      name: member.group.name,
      monthlyContribution: member.group.monthlyContribution,
      duration: member.group.duration,
    },
    summary: {
      totalContributed: Math.round(member.totalContributed),
      totalPenalties: Math.round(member.totalPenalties),
      payoutReceived: Math.round(member.payoutAmount),
      netPosition: Math.round(member.payoutAmount - member.totalContributed - member.totalPenalties),
      missedPayments: member.missedPayments,
      latePayments: member.latePayments,
      paymentStreak: member.paymentStreak,
      performanceScore: member.performanceScore,
    },
    contributionHistory,
    penaltyHistory: penalties.map((p) => ({
      cycleNumber: p.cycle.cycleNumber,
      date: p.appliedAt,
      type: p.type,
      amount: p.amount,
      reason: p.reason,
      isPaid: p.isPaid,
      isWaived: p.isWaived,
    })),
    payout: payout ? {
      amount: payout.amount,
      date: payout.completedAt,
      reference: payout.transferReference,
    } : null,
    balanceHistory,
  };
};

/**
 * Get audit log
 */
const getAuditLog = async (groupId, options = {}) => {
  const { page = 1, limit = 50 } = options;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find({ group: groupId })
      .populate('performedBy', 'name email')
      .populate('affectedMember')
      .populate({ path: 'affectedMember', populate: { path: 'user', select: 'name' } })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments({ group: groupId }),
  ]);

  return {
    logs: logs.map((log) => ({
      id: log._id,
      action: log.action,
      description: log.description,
      performedBy: log.performedBy.name,
      affectedMember: log.affectedMember ? log.affectedMember.user.name : null,
      timestamp: log.timestamp,
      oldValues: log.oldValues,
      newValues: log.newValues,
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Export group data as CSV
 */
const exportGroupCSV = async (groupId) => {
  const ledger = await getGroupLedger(groupId);

  let csv = 'Cycle Number,Start Date,End Date,Beneficiary,Expected Amount,Collected Amount,Payout Amount,Status\n';

  ledger.cycles.forEach((cycle) => {
    const startDate = cycle.startDate ? new Date(cycle.startDate).toISOString().split('T')[0] : 'N/A';
    const endDate = cycle.endDate ? new Date(cycle.endDate).toISOString().split('T')[0] : 'N/A';
    csv += `${cycle.cycleNumber || 'N/A'},${startDate},${endDate},${cycle.beneficiary || 'N/A'},${cycle.expectedAmount || 0},${cycle.collectedAmount || 0},${cycle.payoutAmount || 0},${cycle.status || 'N/A'}\n`;
  });

  csv += '\n\nPayment Details\n';
  csv += 'Cycle,Member,Turn Number,Amount,Status,Paid At,Is Late,Late Fee\n';

  ledger.cycles.forEach((cycle) => {
    if (cycle.payments && cycle.payments.length > 0) {
      cycle.payments.forEach((payment) => {
        const paidAt = payment.paidAt ? new Date(payment.paidAt).toISOString().split('T')[0] : 'N/A';
        csv += `${cycle.cycleNumber || 'N/A'},${payment.member || 'N/A'},${payment.turnNumber || 'N/A'},${payment.amount || 0},${payment.status || 'N/A'},${paidAt},${payment.isLate ? 'Yes' : 'No'},${payment.lateFee || 0}\n`;
      });
    }
  });

  return csv;
};

/**
 * Export member ledger as CSV
 */
const exportMemberCSV = async (memberId) => {
  const ledger = await getMemberLedger(memberId);

  let csv = `Member Ledger - ${ledger.member.name}\n`;
  csv += `Group: ${ledger.group.name}\n`;
  csv += `Turn Number: ${ledger.member.turnNumber}\n\n`;

  csv += 'Summary\n';
  csv += 'Total Contributed,Payout Received,Total Penalties,Net Position\n';
  csv += `${ledger.summary.totalContributed},${ledger.summary.payoutReceived},${ledger.summary.totalPenalties},${ledger.summary.netPosition}\n\n`;

  csv += 'Contribution History\n';
  csv += 'Cycle,Date,Amount,Status,Is Late,Late Fee\n';

  ledger.contributionHistory.forEach((payment) => {
    const date = payment.date ? new Date(payment.date).toISOString().split('T')[0] : 'N/A';
    csv += `${payment.cycleNumber || 'N/A'},${date},${payment.amount || 0},${payment.status || 'N/A'},${payment.isLate ? 'Yes' : 'No'},${payment.lateFee || 0}\n`;
  });

  if (ledger.payout) {
    csv += '\nPayout Information\n';
    csv += 'Amount,Date,Reference\n';
    const payoutDate = ledger.payout.date ? new Date(ledger.payout.date).toISOString().split('T')[0] : 'N/A';
    csv += `${ledger.payout.amount},${payoutDate},${ledger.payout.reference || 'N/A'}\n`;
  }

  return csv;
};

/**
 * Export audit log as CSV
 */
const exportAuditLogCSV = async (groupId) => {
  const auditData = await getAuditLog(groupId, { page: 1, limit: 10000 }); // Get all logs

  let csv = 'Audit Log\n';
  csv += 'Timestamp,Action,Description,Performed By,Affected Member\n';

  auditData.logs.forEach((log) => {
    const timestamp = new Date(log.timestamp).toISOString();
    const description = `"${log.description.replace(/"/g, '""')}"`;
    csv += `${timestamp},${log.action},${description},${log.performedBy},${log.affectedMember || 'N/A'}\n`;
  });

  return csv;
};

/**
 * Export monthly summary as CSV
 */
const exportMonthlySummaryCSV = async (groupId, cycleNumber) => {
  const summary = await getMonthlySummary(groupId, cycleNumber);

  let csv = `Monthly Summary - Cycle ${cycleNumber}\n`;
  csv += `Period: ${new Date(summary.cycle.startDate).toLocaleDateString()} - ${new Date(summary.cycle.endDate).toLocaleDateString()}\n`;
  csv += `Beneficiary: ${summary.beneficiary.name} (Turn #${summary.beneficiary.turnNumber})\n`;
  csv += `Status: ${summary.cycle.status}\n\n`;

  csv += 'Financial Summary\n';
  csv += 'Expected Amount,Collected Amount,Variance,Total Penalties\n';
  csv += `${summary.financials.expectedAmount},${summary.financials.collectedAmount},${summary.financials.variance},${summary.financials.totalPenalties}\n\n`;

  csv += 'Payment Details\n';
  csv += 'Member,Turn Number,Amount,Status,Paid At,Due Date,Is Late,Days Late,Late Fee\n';

  summary.payments.forEach((payment) => {
    const paidAt = payment.paidAt ? new Date(payment.paidAt).toISOString().split('T')[0] : 'N/A';
    const dueDate = payment.dueDate ? new Date(payment.dueDate).toISOString().split('T')[0] : 'N/A';
    csv += `${payment.member},${payment.turnNumber},${payment.amount},${payment.status},${paidAt},${dueDate},${payment.isLate ? 'Yes' : 'No'},${payment.daysLate || 0},${payment.lateFee || 0}\n`;
  });

  if (summary.payout) {
    csv += '\nPayout Information\n';
    csv += 'Amount,Status,Transfer Mode,Transfer Reference,Completed At\n';
    const completedAt = summary.payout.completedAt ? new Date(summary.payout.completedAt).toISOString().split('T')[0] : 'N/A';
    csv += `${summary.payout.amount},${summary.payout.status},${summary.payout.transferMode || 'N/A'},${summary.payout.transferReference || 'N/A'},${completedAt}\n`;
  }

  if (summary.summary) {
    csv += `\nSummary\n"${summary.summary}"\n`;
  }

  return csv;
};

/**
 * Export group data as PDF (placeholder - requires PDF library)
 */
const exportGroupPDF = async (groupId) => {
  // This is a placeholder. In production, you would use a library like pdfkit or puppeteer
  const ledger = await getGroupLedger(groupId);
  
  // For now, return a simple text representation
  // In production, implement actual PDF generation
  const textContent = JSON.stringify(ledger, null, 2);
  return Buffer.from(textContent);
};

module.exports = {
  getGroupLedger,
  getMonthlySummary,
  getMemberLedger,
  getAuditLog,
  exportGroupCSV,
  exportMemberCSV,
  exportMonthlySummaryCSV,
  exportAuditLogCSV,
  exportGroupPDF,
};