const express = require('express');

/**
 * Custom body parser that preserves raw body for proxying
 * while making parsed body available for inspection
 */
function createBodyParser() {
  return [
    // Parse JSON bodies
    express.json({
      limit: '10mb',
      verify: (req, res, buf, encoding) => {
        // Store raw body for proxying
        req.rawBody = buf.toString(encoding || 'utf8');
      }
    }),
    
    // Parse URL-encoded bodies
    express.urlencoded({ 
      extended: true,
      limit: '10mb',
      verify: (req, res, buf, encoding) => {
        if (!req.rawBody) {
          req.rawBody = buf.toString(encoding || 'utf8');
        }
      }
    }),
    
    // Handle raw text
    express.text({
      type: 'text/*',
      limit: '10mb',
      verify: (req, res, buf, encoding) => {
        req.rawBody = buf.toString(encoding || 'utf8');
      }
    })
  ];
}

module.exports = { createBodyParser };
