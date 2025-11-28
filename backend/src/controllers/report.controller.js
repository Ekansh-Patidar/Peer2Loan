const reportService = require('../services/report.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get group ledger
 * @route   GET /api/v1/reports/group/:groupId/ledger
 * @access  Private
 */
const getGroupLedger = asyncHandler(async (req, res) => {
  const ledger = await reportService.getGroupLedger(req.params.groupId);

  return ApiResponse.success(
    res,
    ledger,
    'Group ledger retrieved successfully'
  );
});

/**
 * @desc    Get monthly summary
 * @route   GET /api/v1/reports/group/:groupId/monthly/:cycleNumber
 * @access  Private
 */
const getMonthlySummary = asyncHandler(async (req, res) => {
  const summary = await reportService.getMonthlySummary(
    req.params.groupId,
    parseInt(req.params.cycleNumber)
  );

  return ApiResponse.success(
    res,
    summary,
    'Monthly summary retrieved successfully'
  );
});

/**
 * @desc    Get member ledger
 * @route   GET /api/v1/reports/member/:memberId/ledger
 * @access  Private
 */
const getMemberLedger = asyncHandler(async (req, res) => {
  const ledger = await reportService.getMemberLedger(req.params.memberId);

  return ApiResponse.success(
    res,
    ledger,
    'Member ledger retrieved successfully'
  );
});

/**
 * @desc    Get audit log
 * @route   GET /api/v1/reports/group/:groupId/audit-log
 * @access  Private
 */
const getAuditLog = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const result = await reportService.getAuditLog(
    req.params.groupId,
    { page: parseInt(page), limit: parseInt(limit) }
  );

  return ApiResponse.success(
    res,
    result,
    'Audit log retrieved successfully'
  );
});

/**
 * @desc    Export group data as CSV
 * @route   GET /api/v1/reports/group/:groupId/export/csv
 * @access  Private
 */
const exportGroupCSV = asyncHandler(async (req, res) => {
  const csv = await reportService.exportGroupCSV(req.params.groupId);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=group-${req.params.groupId}-report.csv`);
  res.send(csv);
});

/**
 * @desc    Export member ledger as CSV
 * @route   GET /api/v1/reports/member/:memberId/export/csv
 * @access  Private
 */
const exportMemberCSV = asyncHandler(async (req, res) => {
  const csv = await reportService.exportMemberCSV(req.params.memberId);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=member-${req.params.memberId}-ledger.csv`);
  res.send(csv);
});

/**
 * @desc    Export monthly summary as CSV
 * @route   GET /api/v1/reports/group/:groupId/monthly/:cycleNumber/export/csv
 * @access  Private
 */
const exportMonthlySummaryCSV = asyncHandler(async (req, res) => {
  const csv = await reportService.exportMonthlySummaryCSV(req.params.groupId, parseInt(req.params.cycleNumber));

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=monthly-summary-cycle-${req.params.cycleNumber}.csv`);
  res.send(csv);
});

/**
 * @desc    Export audit log as CSV
 * @route   GET /api/v1/reports/group/:groupId/audit-log/export/csv
 * @access  Private
 */
const exportAuditLogCSV = asyncHandler(async (req, res) => {
  const csv = await reportService.exportAuditLogCSV(req.params.groupId);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=audit-log-${req.params.groupId}.csv`);
  res.send(csv);
});

/**
 * @desc    Export group data as PDF
 * @route   GET /api/v1/reports/group/:groupId/export/pdf
 * @access  Private
 */
const exportGroupPDF = asyncHandler(async (req, res) => {
  const pdfBuffer = await reportService.exportGroupPDF(req.params.groupId);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=group-${req.params.groupId}-report.pdf`);
  res.send(pdfBuffer);
});

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