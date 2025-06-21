#!/usr/bin/env node
// Production server for Healthcare Alert System

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);

// Since we're using Expo export, we need to serve the static files
const express = require('express');
const app = express();

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(port, '0.0.0.0', () => {

});

// Graceful shutdown
process.on('SIGTERM', () => {

  process.exit(0);
});

process.on('SIGINT', () => {

  process.exit(0);
});