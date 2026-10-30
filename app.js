/**
 * SENTRY UPI — Interactive Client Controller & Visualization Engine
 * Controls: Force-Directed Graph Canvas, Live Transaction Stream, Decision Waterfall,
 * SHAP Explainer, Behavioral Biometrics Lab, PR-AUC Threshold Slider, and Command Palette.
 */

(function () {
  'use strict';

  // --- Global Application State ---
  const state = {
    network: null,
    activeRingId: null,
    hoveredNode: null,
    selectedNode: null,
    streamPaused: false,
    streamFilter: 'ALL',
    streamTimer: null,
    graphScale: 1.0,
    panX: 0,
    panY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    threshold: 0.50,
    selectedTxnProfile: 'mule_attack',
    activeScenarioIndex: 0
  };

  // --- Initialize Application on DOM Ready ---
  document.addEventListener('DOMContentLoaded', () => {
    initDataEngine();
    initForceGraph();
    initLiveStream();
    initPipelineWaterfall();
    initShapExplainer();
    initBiometricsLab();
    initImbalanceSlider();
    initCommandPalette();
    initEventListeners();
  });

  // --- 1. Data Engine Initialization ---
  function initDataEngine() {
    if (typeof SentryDataEngine === 'undefined') {
      console.error('SentryDataEngine not loaded');
      return;
    }
    state.network = SentryDataEngine.generateNetworkTopology();
    console.log(`[SENTRY UPI] Topology generated: ${state.network.nodes.length} nodes, ${state.network.links.length} links.`);
  }

  // --- 2. Interactive Force-Directed Graph Engine (HTML5 Canvas) ---
  let canvas, ctx, animFrameId;
  const simulation = {
    alpha: 1.0,
    alphaMin: 0.001,
    alphaDecay: 0.022,
    velocityDecay: 0.72
  };

  function initForceGraph() {
    canvas = document.getElementById('graphCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    resizeGraphCanvas();
    window.addEventListener('resize', resizeGraphCanvas);

    // Initial node positioning in calm layout
    const width = canvas.width;
    const height = canvas.height;
    state.panX = width / 2;
    state.panY = height / 2;

    const nodes = state.network.nodes;
    nodes.forEach((node, i) => {
      // Clustered circular distribution
      let angle = (i / nodes.length) * Math.PI * 2;
      let radius = 80 + Math.random() * 260;

      if (node.cluster === 1) { // Ring 1
        angle = Math.PI * 0.25 + (Math.random() - 0.5) * 0.6;
        radius = 160 + Math.random() * 80;
      } else if (node.cluster === 2) { // Ring 2
        angle = Math.PI * 0.95 + (Math.random() - 0.5) * 0.5;
        radius = 190 + Math.random() * 70;
      } else if (node.cluster === 3) { // Ring 3
        angle = Math.PI * 1.65 + (Math.random() - 0.5) * 0.5;
        radius = 170 + Math.random() * 80;
      }

      node.x = Math.cos(angle) * radius;
      node.y = Math.sin(angle) * radius;
      node.targetX = node.x;
      node.targetY = node.y;
      node.vx = (Math.random() - 0.5) * 2;
      node.vy = (Math.random() - 0.5) * 2;
      node.radius = node.isHub ? 8 : (node.isMule ? 5.5 : 3.5);
    });

    startGraphLoop();
    bindGraphInteractions();
  }

  function resizeGraphCanvas() {
    if (!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  function startGraphLoop() {
    function step() {
      updateForcePhysics();
      renderGraph();
      animFrameId = requestAnimationFrame(step);
    }
    step();
  }

  // Organic spring physics & cluster attraction
  function updateForcePhysics() {
    const nodes = state.network.nodes;
    const links = state.network.links;

    // Node-Node Repulsion
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy || 1;
        if (distSq < 16000) {
          const dist = Math.sqrt(distSq);
          const force = (180 / distSq) * simulation.alpha;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }
    }

    // Link Spring Attraction
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    links.forEach(l => {
      const src = nodeMap.get(l.source);
      const tgt = nodeMap.get(l.target);
      if (src && tgt) {
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        let desiredDist = l.isFraud ? 45 : 75;
        // If ring is active and this link is part of active ring, pull tighter
        if (state.activeRingId && l.ringId === state.activeRingId) {
          desiredDist = 32;
        }

        const force = (dist - desiredDist) * 0.04 * simulation.alpha;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        src.vx += fx;
        src.vy += fy;
        tgt.vx -= fx;
        tgt.vy -= fy;
      }
    });

    // Ring Clustering Attraction (When ring selected/hovered)
    if (state.activeRingId) {
      const ringNodes = nodes.filter(n => n.ringId === state.activeRingId);
      if (ringNodes.length > 0) {
        // Calculate ring centroid
        let cx = 0, cy = 0;
        ringNodes.forEach(n => { cx += n.x; cy += n.y; });
        cx /= ringNodes.length;
        cy /= ringNodes.length;

        ringNodes.forEach(n => {
          n.vx += (cx - n.x) * 0.05;
          n.vy += (cy - n.y) * 0.05;
        });
      }
    }

    // Centering Gravity
    nodes.forEach(n => {
      n.vx -= n.x * 0.0008;
      n.vy -= n.y * 0.0008;

      n.vx *= simulation.velocityDecay;
      n.vy *= simulation.velocityDecay;
      n.x += n.vx;
      n.y += n.vy;
    });

    // Decay alpha smoothly
    if (simulation.alpha > simulation.alphaMin) {
      simulation.alpha -= (simulation.alpha - simulation.alphaMin) * simulation.alphaDecay;
    }
  }

  // High-performance canvas draw routine
  let pulseTime = 0;
  function renderGraph() {
    pulseTime += 0.04;
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(state.panX, state.panY);
    ctx.scale(state.graphScale, state.graphScale);

    const nodes = state.network.nodes;
    const links = state.network.links;
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // 1. Draw Links
    links.forEach(l => {
      const src = nodeMap.get(l.source);
      const tgt = nodeMap.get(l.target);
      if (!src || !tgt) return;

      const isRingActive = state.activeRingId && l.ringId === state.activeRingId;
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);

      if (isRingActive) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.4;
      } else if (l.isFraud) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.lineWidth = 1.6;
      } else {
        ctx.strokeStyle = 'rgba(230, 203, 178, 0.16)';
        ctx.lineWidth = 0.9;
      }
      ctx.stroke();

      // Flow particle animation for active fraud ring
      if (isRingActive) {
        const t = (pulseTime * 1.5 + (src.x * 0.01)) % 1;
        const px = src.x + (tgt.x - src.x) * t;
        const py = src.y + (tgt.y - src.y) * t;
        ctx.beginPath();
        ctx.arc(px, py, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // 2. Draw Nodes
    nodes.forEach(n => {
      const isRingActive = state.activeRingId && n.ringId === state.activeRingId;
      const isHovered = state.hoveredNode === n;

      ctx.beginPath();
      let drawRadius = n.radius;

      if (isRingActive || n.isMule) {
        // Red glowing ring node
        const pulse = Math.sin(pulseTime * 3 + n.x * 0.05) * 2;
        drawRadius = n.radius + (isRingActive ? 2 + pulse : 0);

        ctx.arc(n.x, n.y, drawRadius, 0, Math.PI * 2);
        ctx.fillStyle = isRingActive ? '#ef4444' : '#dc2626';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = isRingActive ? 18 : 9;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Outer ripple aura for active ring
        if (isRingActive) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, drawRadius + 6 + pulse, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
      } else if (n.isHub) {
        // Amber Hub (Skeuomorphic Sphere)
        const radGrad = ctx.createRadialGradient(n.x - 2, n.y - 2, 0, n.x, n.y, drawRadius);
        radGrad.addColorStop(0, '#fffbeb');
        radGrad.addColorStop(0.5, '#f59e0b');
        radGrad.addColorStop(1, '#92400e');
        ctx.arc(n.x, n.y, drawRadius, 0, Math.PI * 2);
        ctx.fillStyle = radGrad;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Normal Safe Node (Tactile Warm Beige & Obsidian Pearl)
        const radGrad = ctx.createRadialGradient(n.x - 1, n.y - 1, 0, n.x, n.y, drawRadius);
        radGrad.addColorStop(0, '#fcfaf6');
        radGrad.addColorStop(0.4, '#dfb892');
        radGrad.addColorStop(1, '#78532f');
        ctx.arc(n.x, n.y, drawRadius, 0, Math.PI * 2);
        ctx.fillStyle = radGrad;
        ctx.shadowColor = 'rgba(230, 203, 178, 0.35)';
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Selection indicator
      if (isHovered || state.selectedNode === n) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, drawRadius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  // Canvas Interactions: Hover, Drag, Zoom, Click
  function bindGraphInteractions() {
    const tooltip = document.getElementById('graphTooltip');

    canvas.addEventListener('mousedown', (e) => {
      state.isDragging = true;
      state.dragStartX = e.clientX - state.panX;
      state.dragStartY = e.clientY - state.panY;
    });

    window.addEventListener('mousemove', (e) => {
      if (state.isDragging) {
        state.panX = e.clientX - state.dragStartX;
        state.panY = e.clientY - state.dragStartY;
        return;
      }

      // Hit testing for hover
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - state.panX) / state.graphScale;
      const mouseY = (e.clientY - rect.top - state.panY) / state.graphScale;

      let found = null;
      for (const node of state.network.nodes) {
        const dx = node.x - mouseX;
        const dy = node.y - mouseY;
        if (dx * dx + dy * dy < (node.radius + 6) * (node.radius + 6)) {
          found = node;
          break;
        }
      }

      state.hoveredNode = found;
      if (found) {
        canvas.style.cursor = 'pointer';
        if (tooltip) {
          tooltip.style.display = 'block';
          tooltip.style.left = `${e.clientX - rect.left + 16}px`;
          tooltip.style.top = `${e.clientY - rect.top + 16}px`;
          tooltip.innerHTML = `
            <div style="font-weight:700; color:#fff; margin-bottom:2px;">${found.vpa}</div>
            <div style="color:${found.isMule ? '#ef4444' : '#10b981'}; font-size:10px;">
              ${found.isMule ? `⚠️ MULE ACCOUNT (${found.ringId || 'FLAGGED'})` : '✓ VERIFIED USER'}
            </div>
            <div style="color:#94a3b8; font-size:10px; margin-top:4px;">
              Score: <strong style="color:#fff;">${found.riskScore}</strong> | Balance: ${found.balance}
            </div>
          `;
        }
      } else {
        canvas.style.cursor = state.isDragging ? 'grabbing' : 'grab';
        if (tooltip) tooltip.style.display = 'none';
      }
    });

    window.addEventListener('mouseup', () => {
      state.isDragging = false;
    });

    // Zoom on wheel
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      state.graphScale = Math.max(0.4, Math.min(3.0, state.graphScale * zoomFactor));
    }, { passive: false });

    // Click on node to activate Ring
    canvas.addEventListener('click', (e) => {
      if (state.hoveredNode) {
        state.selectedNode = state.hoveredNode;
        if (state.hoveredNode.ringId) {
          activateFraudRing(state.hoveredNode.ringId);
        }
      } else {
        // Clicked outside: relax network
        deactivateFraudRing();
      }
    });
  }

  // Ring Activation & Drawer Reveal
  window.activateFraudRing = function (ringId) {
    state.activeRingId = ringId;
    simulation.alpha = 0.8; // Wake up physics gently

    const ring = state.network.rings.find(r => r.id === ringId);
    if (!ring) return;

    // Update Drawer Content
    const drawer = document.getElementById('investigationDrawer');
    if (drawer) {
      document.getElementById('drawerRingId').textContent = ring.id;
      document.getElementById('drawerRingName').textContent = ring.name;
      document.getElementById('drawerRiskScore').textContent = ring.riskScore;
      document.getElementById('drawerTotalVolume').textContent = ring.totalVolume;
      document.getElementById('drawerAccountsCount').textContent = ring.metrics.accountsCount;
      document.getElementById('drawerHopCount').textContent = `${ring.metrics.hopCount} Hops`;
      document.getElementById('drawerFanIn').textContent = ring.metrics.fanInRatio;
      document.getElementById('drawerDevice').textContent = ring.metrics.deviceCluster;
      document.getElementById('drawerTimeWindow').textContent = ring.metrics.timeWindow;
      document.getElementById('drawerDescription').textContent = ring.description;

      const vpaList = document.getElementById('drawerVpaList');
      vpaList.innerHTML = ring.flaggedVpas.map((vpa, idx) => `
        <div class="vpa-item">
          <span class="vpa-address">${idx === 0 ? '👑 ' : ''}${vpa}</span>
          <span class="badge ${idx === 0 ? 'badge-block' : 'badge-step-up'}">
            ${idx === 0 ? 'CASHOUT HUB' : 'MULE FEEDER'}
          </span>
        </div>
      `).join('');

      drawer.classList.add('open');
    }

    // Highlight HUD Pill
    document.querySelectorAll('.hud-ring-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.ring === ringId);
    });
  };

  window.deactivateFraudRing = function () {
    state.activeRingId = null;
    simulation.alpha = 0.5;

    const drawer = document.getElementById('investigationDrawer');
    if (drawer) drawer.classList.remove('open');

    document.querySelectorAll('.hud-ring-btn').forEach(btn => btn.classList.remove('active'));
  };

  // --- 3. Live Transaction Stream Controller ---
  function initLiveStream() {
    const tableBody = document.getElementById('streamTableBody');
    if (!tableBody) return;

    // Seed initial 6 rows
    for (let i = 0; i < 6; i++) {
      const txn = SentryDataEngine.generateTransaction();
      prependStreamRow(txn);
    }

    // Schedule live stream ticker
    startStreamTicker();
  }

  function startStreamTicker() {
    if (state.streamTimer) clearInterval(state.streamTimer);
    state.streamTimer = setInterval(() => {
      if (state.streamPaused) return;
      const txn = SentryDataEngine.generateTransaction();
      if (state.streamFilter === 'FLAGGED' && !txn.isFraud) return;
      if (state.streamFilter === 'BLOCKED' && txn.decision !== 'BLOCK') return;
      prependStreamRow(txn);
    }, 1100);
  }

  function prependStreamRow(txn) {
    const tableBody = document.getElementById('streamTableBody');
    if (!tableBody) return;

    const row = document.createElement('tr');
    row.className = `stream-row ${txn.isFraud ? 'row-fraud' : ''}`;
    row.innerHTML = `
      <td>${txn.timestamp.slice(11, 19)}</td>
      <td style="color:#fff; font-weight:600;">${txn.txnId}</td>
      <td>${txn.senderVpa}</td>
      <td>${txn.receiverVpa}</td>
      <td>${txn.amount}</td>
      <td>
        <span class="decision-badge badge-${txn.decision.toLowerCase().replace('_', '-')}">
          ${txn.decision === 'APPROVE' ? '✓ APPROVE' : (txn.decision === 'BLOCK' ? '⛔ BLOCK' : '⚠️ STEP-UP')}
        </span>
      </td>
      <td>
        <span class="latency-ticker ${txn.totalLatency > 450 ? 'warn' : 'good'}">
          ${txn.totalLatency} ms
        </span>
      </td>
    `;

    // Click row to inspect
    row.addEventListener('click', () => {
      inspectTransaction(txn);
    });

    tableBody.prepend(row);
    // Keep at most 25 rows
    while (tableBody.children.length > 25) {
      tableBody.removeChild(tableBody.lastChild);
    }
  }

  // Simulate Attack Action
  window.simulateMuleAttack = function () {
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        const txn = SentryDataEngine.generateTransaction(true, 0);
        prependStreamRow(txn);
      }, i * 220);
    }
    activateFraudRing('RING-01');
  };

  // --- 4. Pipeline Latency Waterfall ---
  function initPipelineWaterfall() {
    // Stage elements and live latency update
    const stages = [
      { id: 'ingestion', label: '1. Request Ingestion (API Gateway & Kafka)', ms: 34, budget: '50 ms' },
      { id: 'features', label: '2. Real-Time Feature Store (Redis + Feast)', ms: 82, budget: '100 ms' },
      { id: 'modelScore', label: '3. GNN Relational + XGBoost Ensemble', ms: 164, budget: '200 ms MAX', highlight: true },
      { id: 'biometrics', label: '4. Behavioral Biometrics (Typing/Swipe)', ms: 48, budget: '70 ms' },
      { id: 'decision', label: '5. Rule Arbiter & Pre-Settlement Interdict', ms: 22, budget: '30 ms' }
    ];

    const container = document.getElementById('pipelineWaterfallContainer');
    if (!container) return;

    container.innerHTML = stages.map(s => `
      <div class="stage-card ${s.highlight ? 'is-scoring' : ''}">
        <div class="stage-top">
          <div class="stage-name-wrap">
            <span class="stage-step-num">${s.id === 'modelScore' ? '⚡' : '•'}</span>
            <span class="stage-name">${s.label}</span>
            <span class="stage-badge-budget">Budget: ${s.budget}</span>
          </div>
          <span class="stage-latency-read mono" id="latency_${s.id}">${s.ms} ms</span>
        </div>
        <div class="stage-bar-bg">
          <div class="stage-bar-fill ${s.highlight ? 'highlight-score' : ''}" 
               id="bar_${s.id}" 
               style="width: ${(s.ms / 200) * 100}%;">
          </div>
        </div>
        <div class="stage-details">
          <span>P99 SLA Guaranteed</span>
          <span style="color:${s.highlight ? 'var(--beige-champagne)' : 'var(--safe-mint)'};">
            ${s.highlight ? '★ Core Machine Learning Scoring Budget (<200 ms)' : '✓ Within Micro-budget'}
          </span>
        </div>
      </div>
    `).join('');
  }

  // --- 5. SHAP Explainer (Feature Attribution) ---
  function initShapExplainer() {
    updateShapView('mule_attack');
  }

  function updateShapView(profileKey) {
    const shapData = {
      mule_attack: {
        txnId: 'TXN_UPI_982402941',
        sender: 'mule_04_rnc@paytm',
        receiver: 'collector_cashout@ybl',
        amount: '₹48,500',
        score: '0.88',
        decision: 'BLOCK',
        features: [
          { name: 'GNN 2-Hop Neighbor High-Risk Score', delta: '+0.38', type: 'risk', pct: 85 },
          { name: 'Hardware Fingerprint Anomaly (Rooted Emul)', delta: '+0.24', type: 'risk', pct: 60 },
          { name: 'Velocity: 12th Txn in 3 Minutes', delta: '+0.19', type: 'risk', pct: 48 },
          { name: 'Impossible Velocity Travel (Mumbai->Patna 20m)', delta: '+0.12', type: 'risk', pct: 30 },
          { name: 'Biometric Swipe Curvature Deviation', delta: '+0.09', type: 'risk', pct: 22 },
          { name: 'Aadhaar e-KYC Tenure (4+ years)', delta: '-0.14', type: 'safe', pct: 35 }
        ]
      },
      safe_salaried: {
        txnId: 'TXN_UPI_982402850',
        sender: 'arjun.sharma82@oksbi',
        receiver: 'swiggy@icici',
        amount: '₹740',
        score: '0.04',
        decision: 'APPROVE',
        features: [
          { name: 'Historic Merchant Whitelist Match', delta: '-0.32', type: 'safe', pct: 80 },
          { name: 'Device Hardware Consistent (iPhone 15)', delta: '-0.24', type: 'safe', pct: 60 },
          { name: 'Biometric Keystroke Cadence Match (98%)', delta: '-0.18', type: 'safe', pct: 45 },
          { name: 'Normal Diurnal Time-of-Day Window', delta: '-0.11', type: 'safe', pct: 28 },
          { name: 'Beneficiary Volatility Variance', delta: '+0.03', type: 'risk', pct: 8 }
        ]
      }
    };

    const d = shapData[profileKey] || shapData.mule_attack;

    document.getElementById('explainerTxnId').textContent = d.txnId;
    document.getElementById('explainerSender').textContent = d.sender;
    document.getElementById('explainerReceiver').textContent = d.receiver;
    document.getElementById('explainerAmount').textContent = d.amount;
    document.getElementById('explainerScore').textContent = d.score;
    document.getElementById('explainerDecisionBadge').textContent = d.decision;
    document.getElementById('explainerDecisionBadge').className = `score-badge ${d.decision === 'BLOCK' ? 'badge-block' : 'badge-approve'}`;

    const barsContainer = document.getElementById('shapBarsContainer');
    if (!barsContainer) return;

    barsContainer.innerHTML = d.features.map(f => `
      <div class="shap-bar-row">
        <div class="shap-bar-header">
          <span class="shap-feature-name">${f.name}</span>
          <span class="shap-delta ${f.type}">${f.delta}</span>
        </div>
        <div class="shap-bar-track">
          <div class="shap-bar-val ${f.type}" style="width: ${f.pct}%;"></div>
        </div>
      </div>
    `).join('');
  }

  window.selectShapProfile = function (key) {
    updateShapView(key);
  };

  // --- 6. Behavioral Biometrics Lab ---
  function initBiometricsLab() {
    renderKeystrokeCanvas();
    renderSwipeCanvas();
    bindInteractiveTester();
  }

  function renderKeystrokeCanvas() {
    const c = document.getElementById('keystrokeCanvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    const w = c.width = c.parentElement.clientWidth;
    const h = c.height = 200;

    ctx.clearRect(0, 0, w, h);

    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(230, 203, 178, 0.08)';
    ctx.lineWidth = 1;
    for (let y = 30; y < h; y += 35) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 1. Draw Genuine User Natural Gaussian Curve (Warm Beige)
    ctx.beginPath();
    ctx.moveTo(30, h - 30);
    for (let x = 30; x < w - 30; x += 4) {
      const mean = w * 0.45;
      const sigma = 50;
      const y = (h - 30) - Math.exp(-Math.pow(x - mean, 2) / (2 * sigma * sigma)) * 120;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#dfb892';
    ctx.lineWidth = 2.8;
    ctx.stroke();

    // 2. Draw Bot / Emulated Rigid Impulse Spike (Ruby Red)
    ctx.beginPath();
    ctx.moveTo(w * 0.72 - 30, h - 30);
    ctx.lineTo(w * 0.72, 35);
    ctx.lineTo(w * 0.72 + 30, h - 30);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.8;
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#dfb892';
    ctx.font = '11.5px JetBrains Mono';
    ctx.fillText('Genuine Human (Warm Gaussian)', 40, 45);

    ctx.fillStyle = '#ef4444';
    ctx.fillText('Bot Script (Zero Variance Spike)', w * 0.58, 25);
  }

  function renderSwipeCanvas() {
    const c = document.getElementById('swipeCanvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    const w = c.width = c.parentElement.clientWidth;
    const h = c.height = 200;

    ctx.clearRect(0, 0, w, h);

    // 1. Genuine Human Curved Arc (Warm Beige Champagne)
    ctx.beginPath();
    ctx.moveTo(40, h - 40);
    ctx.quadraticCurveTo(w * 0.5, 30, w - 50, h - 60);
    ctx.strokeStyle = '#dfb892';
    ctx.lineWidth = 3.2;
    ctx.stroke();

    // 2. Bot / Remote Emulated Straight Vector (Ruby Red)
    ctx.beginPath();
    ctx.moveTo(40, h - 50);
    ctx.lineTo(w - 50, 45);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.fillStyle = '#dfb892';
    ctx.font = '11.5px JetBrains Mono';
    ctx.fillText('Natural Thumb Arc (96% Match)', 45, h - 20);

    ctx.fillStyle = '#ef4444';
    ctx.fillText('Robotic Linear Vector (31% Match)', w * 0.52, 60);
  }

  function bindInteractiveTester() {
    const input = document.getElementById('biometricTestInput');
    const matchVal = document.getElementById('liveMatchPct');
    if (!input || !matchVal) return;

    let keyTimes = [];
    input.addEventListener('keydown', () => {
      const now = performance.now();
      keyTimes.push(now);
      if (keyTimes.length > 5) {
        // Calculate flight time variance
        let diffs = [];
        for (let i = 1; i < keyTimes.length; i++) {
          diffs.push(keyTimes[i] - keyTimes[i - 1]);
        }
        const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
        const variance = diffs.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / diffs.length;

        // Human has moderate variance; machine has near-zero
        let match = Math.min(99, Math.max(45, Math.round(80 + (variance > 400 ? 15 : -25))));
        matchVal.textContent = `${match}%`;
        matchVal.style.color = match > 75 ? 'var(--safe-emerald)' : 'var(--warn-amber)';
      }
    });
  }

  // --- 7. Imbalanced Data & Precision-Recall Slider ---
  function initImbalanceSlider() {
    const slider = document.getElementById('thresholdSlider');
    if (!slider) return;

    slider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      updateThresholdMetrics(val);
    });

    updateThresholdMetrics(0.50);
  }

  function updateThresholdMetrics(val) {
    const metrics = SentryDataEngine.calculateThresholdTradeoff(val);

    document.getElementById('thresholdValueDisplay').textContent = val.toFixed(2);
    document.getElementById('metricPrecision').textContent = `${metrics.precision}%`;
    document.getElementById('metricRecall').textContent = `${metrics.recall}%`;
    document.getElementById('metricFpr').textContent = `${metrics.fpr}%`;
    document.getElementById('metricTruePositives').textContent = metrics.truePositives;
    document.getElementById('metricFalsePositives').textContent = metrics.falsePositives;
    document.getElementById('metricMissedFraud').textContent = metrics.falseNegatives;
    document.getElementById('metricPreventedLoss').textContent = metrics.financials.preventedFormatted;
  }

  // --- 8. Command Palette (21st.dev Component) ---
  function initCommandPalette() {
    const modal = document.getElementById('cmdPaletteModal');
    const input = document.getElementById('cmdSearchInput');
    const list = document.getElementById('cmdResultsList');
    if (!modal || !input || !list) return;

    window.toggleCommandPalette = function (forceOpen) {
      const isOpen = modal.classList.contains('open');
      if (forceOpen !== undefined ? forceOpen : !isOpen) {
        modal.classList.add('open');
        input.value = '';
        input.focus();
        renderCommandResults('');
      } else {
        modal.classList.remove('open');
      }
    };

    input.addEventListener('input', (e) => {
      renderCommandResults(e.target.value);
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) toggleCommandPalette(false);
    });
  }

  function renderCommandResults(query) {
    const list = document.getElementById('cmdResultsList');
    if (!list) return;

    const commands = [
      { label: 'Inspect Ring #1: Mule Fan-In Aggregator', action: () => activateFraudRing('RING-01'), shortcut: 'R1' },
      { label: 'Inspect Ring #2: Circular Wash Network', action: () => activateFraudRing('RING-02'), shortcut: 'R2' },
      { label: 'Inspect Ring #3: Cloned IMEI Hardware Cluster', action: () => activateFraudRing('RING-03'), shortcut: 'R3' },
      { label: 'Simulate Coordinated Mule Attack (Live Injection)', action: () => simulateMuleAttack(), shortcut: 'ATTACK' },
      { label: 'Reset Graph View (Recenter & Relax)', action: () => deactivateFraudRing(), shortcut: 'ESC' },
      { label: 'Set Decision Threshold to 0.75 (Strict Interdict)', action: () => {
        document.getElementById('thresholdSlider').value = 0.75;
        updateThresholdMetrics(0.75);
      }, shortcut: 'T:75' }
    ];

    const filtered = commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));
    list.innerHTML = filtered.map((c, i) => `
      <li class="cmd-item" data-idx="${i}">
        <span>${c.label}</span>
        <span class="cmd-item-shortcut">${c.shortcut}</span>
      </li>
    `).join('');

    // Bind click handlers
    list.querySelectorAll('.cmd-item').forEach((item, idx) => {
      item.addEventListener('click', () => {
        filtered[idx].action();
        toggleCommandPalette(false);
      });
    });
  }

  // --- 9. Global Keyboard & Button Listeners ---
  function initEventListeners() {
    window.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K: Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
      // Esc: Close drawers / modals
      if (e.key === 'Escape') {
        toggleCommandPalette(false);
        deactivateFraudRing();
      }
    });

    // Stream Pause/Resume Toggle
    const pauseBtn = document.getElementById('streamPauseBtn');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        state.streamPaused = !state.streamPaused;
        pauseBtn.textContent = state.streamPaused ? '▶ Resume Stream' : '⏸ Pause';
      });
    }

    // Stream Filter Pills
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.streamFilter = btn.dataset.filter;
      });
    });

    // Interdict Button
    const interdictBtn = document.getElementById('drawerInterdictBtn');
    if (interdictBtn) {
      interdictBtn.addEventListener('click', () => {
        interdictBtn.textContent = '⚡ NPCI Interdict Executed! Accounts Frozen';
        interdictBtn.style.background = '#10b981';
        setTimeout(() => {
          interdictBtn.textContent = 'Execute Pre-Settlement Interdict';
          interdictBtn.style.background = '';
          deactivateFraudRing();
        }, 2000);
      });
    }
  }

  function inspectTransaction(txn) {
    updateShapView(txn.isFraud ? 'mule_attack' : 'safe_salaried');
    // Scroll smoothly to explainer
    const el = document.getElementById('explainerSection');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

})();
