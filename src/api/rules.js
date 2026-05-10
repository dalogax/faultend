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

router.use(express.json());

router.get('/', async (req, res) => {
  const serverId = req.serverId;
  
  if (!serverId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Server ID required. Access via /api/servers/:serverId/rules'
    });
  }
  
  const rules = await getAllRules(serverId);
  res.json({ serverId, rules, count: rules.length });
});

router.get('/:id', async (req, res) => {
  const serverId = req.serverId;
  
  if (!serverId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Server ID required'
    });
  }
  
  const rule = await getRuleById(serverId, req.params.id);
  if (!rule) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Rule with ID '${req.params.id}' not found`
    });
  }
  res.json(rule);
});

router.post('/', async (req, res) => {
  const serverId = req.serverId;
  
  if (!serverId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Server ID required'
    });
  }
  
  try {
    const rule = await addRule(serverId, req.body);
    console.log(`[API] [${serverId}] Created rule: ${rule.name} (${rule.action}, priority: ${rule.priority})`);
    res.status(201).json(rule);
  } catch (error) {
    res.status(400).json({
      error: 'Validation Error',
      message: error.message
    });
  }
});

router.put('/:id', async (req, res) => {
  const serverId = req.serverId;
  
  if (!serverId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Server ID required'
    });
  }
  
  try {
    const rule = await updateRule(serverId, req.params.id, req.body);
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

router.delete('/:id', async (req, res) => {
  const serverId = req.serverId;
  
  if (!serverId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Server ID required'
    });
  }
  
  try {
    await deleteRule(serverId, req.params.id);
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

router.patch('/:id/toggle', async (req, res) => {
  const serverId = req.serverId;
  
  if (!serverId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Server ID required'
    });
  }
  
  try {
    const rule = await toggleRule(serverId, req.params.id);
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

router.post('/export', async (req, res) => {
  const serverId = req.serverId;
  
  if (!serverId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Server ID required'
    });
  }
  
  const exportData = await exportRules(serverId);
  console.log(`[API] [${serverId}] Exported ${exportData.count} rule(s)`);
  res.json(exportData);
});

router.post('/import', async (req, res) => {
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

    const importedRules = await importRules(serverId, rulesArray, mode);
    const allRules = await getAllRules(serverId);

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
