/**
 * SENTRY UPI — Backend Service & Real-Time Fraud Evaluation API
 * Express HTTP Server providing REST endpoints for network topology,
 * real-time transaction streams, GNN ring intelligence, and pre-settlement decisioning.
 */

const express = require('express');
const path = require('path');
const SentryDataEngine = require('./data_engine');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Serve static frontend assets
app.use(express.static(__dirname));

// Pre-generate network topology
const networkData = SentryDataEngine.generateNetworkTopology();

// --- API Endpoints ---

// 1. Health & Status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'SENTRY_UPI_FRAUD_ENGINE',
    version: '3.4.0',
    npci_gateway: 'CONNECTED',
    model_scoring_budget_ms: 200,
    end_to_end_sla_ms: 500,
    active_mule_rings_detected: networkData.rings.length
  });
});

// 2. Network Topology (300+ Nodes, Force Links, 3 Rings)
app.get('/api/network', (req, res) => {
  res.json({
    success: true,
    nodesCount: networkData.nodes.length,
    linksCount: networkData.links.length,
    nodes: networkData.nodes,
    links: networkData.links,
    rings: networkData.rings
  });
});

// 3. Fraud Rings Listing
app.get('/api/rings', (req, res) => {
  res.json({
    success: true,
    count: networkData.rings.length,
    rings: networkData.rings
  });
});

// 4. Single Ring Detail
app.get('/api/rings/:id', (req, res) => {
  const ring = networkData.rings.find(r => r.id.toLowerCase() === req.params.id.toLowerCase());
  if (!ring) {
    return res.status(404).json({ success: false, error: 'Ring not found' });
  }
  res.json({ success: true, ring });
});

// 5. Generate Real-Time Transaction Stream Batch
app.get('/api/transactions', (req, res) => {
  const count = parseInt(req.query.count) || 10;
  const transactions = [];
  for (let i = 0; i < count; i++) {
    transactions.push(SentryDataEngine.generateTransaction());
  }
  res.json({ success: true, count: transactions.length, transactions });
});

// 6. Real-Time Transaction Evaluation (Pre-Settlement Interdict)
app.post('/api/evaluate', (req, res) => {
  const startTime = performance.now();
  const { sender_vpa, receiver_vpa, amount, device_fingerprint, touch_telemetry } = req.body;

  // Simulate GNN + ML Scoring (<200ms)
  const isSuspicious = sender_vpa && (sender_vpa.includes('mule') || sender_vpa.includes('spoof'));
  const modelScore = isSuspicious ? 0.92 : 0.08;

  const latencies = {
    ingestion: Math.floor(Math.random() * 15) + 25,
    features: Math.floor(Math.random() * 20) + 70,
    modelScore: Math.floor(Math.random() * 30) + 140, // <200ms
    biometrics: Math.floor(Math.random() * 15) + 40,
    decision: Math.floor(Math.random() * 10) + 15
  };

  const totalDecisionTime = Object.values(latencies).reduce((a, b) => a + b, 0);

  res.json({
    success: true,
    decision: modelScore > 0.85 ? 'BLOCK' : (modelScore > 0.45 ? 'STEP_UP' : 'APPROVE'),
    risk_score: modelScore,
    gnn_mule_proximity: isSuspicious ? 'HIGH' : 'ZERO',
    model_scoring_time_ms: latencies.modelScore,
    model_budget_complied: latencies.modelScore < 200,
    total_end_to_end_ms: totalDecisionTime,
    sla_complied: totalDecisionTime < 500,
    interdict_action: modelScore > 0.85 ? 'NPCI_PRE_SETTLEMENT_HOLD' : 'CLEAR'
  });
});

// 7. Imbalanced Data & Precision-Recall Threshold API
app.get('/api/metrics', (req, res) => {
  const threshold = parseFloat(req.query.threshold) || 0.50;
  const tradeoff = SentryDataEngine.calculateThresholdTradeoff(threshold);
  res.json({
    success: true,
    ...tradeoff,
    latencies: {
      p50_ms: 284,
      p95_ms: 392,
      p99_ms: 468,
      hard_sla_limit_ms: 500
    }
  });
});

// 8. Behavioral Biometrics Profiles
app.get('/api/biometrics', (req, res) => {
  res.json({
    success: true,
    profiles: SentryDataEngine.getBiometricProfiles()
  });
});

// Root Route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`============================================================`);
  console.log(`🛡️ SENTRY UPI: Real-Time Fraud Detection Engine Started!`);
  console.log(`🌐 Dashboard URL: http://localhost:${PORT}/`);
  console.log(`⚡ Model Scoring Budget: < 200 ms | Total Decision SLA: < 500 ms`);
  console.log(`============================================================`);
});
