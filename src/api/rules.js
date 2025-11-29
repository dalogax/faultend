/**
 * Rules Management API - Phase 5
 * REST API endpoints for managing routing rules
 */

const express = require('express');
const router = express.Router();
const {
  addRule,
  updateRule,
  deleteRule,
  toggleRule,
  getAllRules,
  getRuleById,
  importRules,
  exportRules
} = require('../rules/rulesEngine');

// Parse JSON bodies for all rules endpoints
router.use(express.json());

/**
 * GET /api/rules
 * List all rules
 */
router.get('/', (req, res) => {
  const rules = getAllRules();
  res.json({ rules, count: rules.length });
});

/**
 * GET /api/rules/:id
 * Get specific rule by ID
 */
router.get('/:id', (req, res) => {
  const rule = getRuleById(req.params.id);
  if (!rule) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Rule with ID '${req.params.id}' not found`
    });
  }
  res.json(rule);
});

/**
 * POST /api/rules
 * Create new rule
 */
router.post('/', (req, res) => {
  try {
    const rule = addRule(req.body);
    console.log(`[API] Created rule: ${rule.name} (${rule.action}, priority: ${rule.priority})`);
    res.status(201).json(rule);
  } catch (error) {
    res.status(400).json({
      error: 'Validation Error',
      message: error.message
    });
  }
});

/**
 * PUT /api/rules/:id
 * Update existing rule
 */
router.put('/:id', (req, res) => {
  try {
    const rule = updateRule(req.params.id, req.body);
    console.log(`[API] Updated rule: ${rule.name} (${rule.action}, priority: ${rule.priority})`);
    res.json(rule);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    res.status(400).json({
      error: 'Validation Error',
      message: error.message
    });
  }
});

/**
 * DELETE /api/rules/:id
 * Delete rule
 */
router.delete('/:id', (req, res) => {
  try {
    deleteRule(req.params.id);
    console.log(`[API] Deleted rule: ${req.params.id}`);
    res.json({
      message: 'Rule deleted successfully',
      id: req.params.id
    });
  } catch (error) {
    res.status(404).json({
      error: 'Not Found',
      message: error.message
    });
  }
});

/**
 * PATCH /api/rules/:id/toggle
 * Toggle rule enabled state
 */
router.patch('/:id/toggle', (req, res) => {
  try {
    const rule = toggleRule(req.params.id);
    console.log(`[API] Toggled rule: ${rule.name} → ${rule.enabled ? 'enabled' : 'disabled'}`);
    res.json({
      id: rule.id,
      enabled: rule.enabled,
      message: `Rule ${rule.enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    res.status(404).json({
      error: 'Not Found',
      message: error.message
    });
  }
});

/**
 * POST /api/rules/export
 * Export all rules as JSON
 */
router.post('/export', (req, res) => {
  const exportData = exportRules();
  console.log(`[API] Exported ${exportData.count} rule(s)`);
  res.json(exportData);
});

/**
 * POST /api/rules/import
 * Import rules from JSON
 */
router.post('/import', (req, res) => {
  try {
    const { mode = 'merge', rules: rulesArray } = req.body;

    if (!rulesArray) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid import data: rules array is required'
      });
    }

    const importedRules = importRules(rulesArray, mode);
    const allRules = getAllRules();

    console.log(`[API] Imported ${importedRules.length} rule(s) in ${mode} mode (total: ${allRules.length})`);

    res.json({
      message: 'Rules imported successfully',
      mode,
      imported: importedRules.length,
      total: allRules.length,
      rules: importedRules
    });
  } catch (error) {
    res.status(400).json({
      error: 'Validation Error',
      message: error.message
    });
  }
});

module.exports = router;
