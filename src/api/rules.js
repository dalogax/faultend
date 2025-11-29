

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

router.get('/', (req, res) => {
  const serverId = req.serverId;
  
  if (!serverId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Server ID required. Access via /servers/:serverId/rules'
    });
  }
  
  const rules = getAllRules(serverId);
  res.json({ serverId, rules, count: rules.length });
});

router.get('/:id', (req, res) => {
  const serverId = req.serverId;
  
  if (!serverId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Server ID required'
    });
  }
  
  const rule = getRuleById(serverId, req.params.id);
  if (!rule) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Rule with ID '${req.params.id}' not found`
    });
  }
  res.json(rule);
});

router.post('/', (req, res) => {
  const serverId = req.serverId;
  
  if (!serverId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Server ID required'
    });
  }
  
  try {
    const rule = addRule(serverId, req.body);
    console.log(`[API] [${serverId}] Created rule: ${rule.name} (${rule.action}, priority: ${rule.priority})`);
    res.status(201).json(rule);
  } catch (error) {
    res.status(400).json({
      error: 'Validation Error',
      message: error.message
    });
  }
});

router.put('/:id', (req, res) => {
  const serverId = req.serverId;
  
  if (!serverId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Server ID required'
    });
  }
  
  try {
    const rule = updateRule(serverId, req.params.id, req.body);
    console.log(`[API] [${serverId}] Updated rule: ${rule.name} (${rule.action}, priority: ${rule.priority})`);
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

router.delete('/:id', (req, res) => {
  const serverId = req.serverId;
  
  if (!serverId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Server ID required'
    });
  }
  
  try {
    deleteRule(serverId, req.params.id);
    console.log(`[API] [${serverId}] Deleted rule: ${req.params.id}`);
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
 * PATCH /servers/:serverId/rules/:id/toggle
 * Toggle rule enabled state
 * Phase 6.1: Scoped per serverId
 */
router.patch('/:id/toggle', (req, res) => {
  const serverId = req.serverId;
  
  if (!serverId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Server ID required'
    });
  }
  
  try {
    const rule = toggleRule(serverId, req.params.id);
    console.log(`[API] [${serverId}] Toggled rule: ${rule.name} → ${rule.enabled ? 'enabled' : 'disabled'}`);
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
 * POST /servers/:serverId/rules/export
 * Export all rules as JSON
 * Phase 6.1: Scoped per serverId
 */
router.post('/export', (req, res) => {
  const serverId = req.serverId;
  
  if (!serverId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Server ID required'
    });
  }
  
  const exportData = exportRules(serverId);
  console.log(`[API] [${serverId}] Exported ${exportData.count} rule(s)`);
  res.json(exportData);
});

/**
 * POST /servers/:serverId/rules/import
 * Import rules from JSON
 * Phase 6.1: Scoped per serverId
 */
router.post('/import', (req, res) => {
  const serverId = req.serverId;
  
  if (!serverId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Server ID required'
    });
  }
  
  try {
    const { mode = 'merge', rules: rulesArray } = req.body;

    if (!rulesArray) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid import data: rules array is required'
      });
    }

    const importedRules = importRules(serverId, rulesArray, mode);
    const allRules = getAllRules(serverId);

    console.log(`[API] [${serverId}] Imported ${importedRules.length} rule(s) in ${mode} mode (total: ${allRules.length})`);

    res.json({
      message: 'Rules imported successfully',
      serverId,
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
