/**
 * SENTRY UPI — Core Data Engine & Simulated API Layer
 * Generates realistic high-volume UPI transaction streams, relational graph topology (300 nodes),
 * 3 hidden coordinated fraud rings, SHAP explainability weights, and behavioral biometrics profiles.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SentryDataEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  // --- Seed Data & Constants ---
  const BANKS = ['oksbi', 'okhdfcbank', 'paytm', 'ybl', 'okaxis', 'icici', 'indus', 'kotak', 'barodampay'];
  const FIRST_NAMES = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
    'Shaurya', 'Ananya', 'Diya', 'Aadhya', 'Pari', 'Saanvi', 'Myra', 'Kavya', 'Anushka', 'Riya',
    'Rohan', 'Vikram', 'Pooja', 'Neha', 'Sunil', 'Rajesh', 'Priya', 'Amit', 'Deepak', 'Sanjay'];
  const LAST_NAMES = ['Sharma', 'Verma', 'Patel', 'Reddy', 'Mehta', 'Nair', 'Singh', 'Deshmukh', 'Joshi', 'Gupta',
    'Rao', 'Iyer', 'Bhat', 'Chatterjee', 'Das', 'Malhotra', 'Kapoor', 'Chauhan', 'Yadav', 'Kulkarni'];
  const MERCHANTS = ['swiggy@icici', 'zomato@hdfc', 'flipkart@axis', 'amazon@apl', 'uber@icici', 'ola@paytm',
    'jiomart@sbi', 'tataneu@hdfc', 'blinkit@icici', 'zepto@hdfc'];

  // 3 Hidden Fraud Rings Definition
  const FRAUD_RINGS = [
    {
      id: 'RING-01',
      name: 'Mule Fan-In Aggregator',
      type: 'fan_in',
      riskScore: 0.94,
      totalVolume: '₹42,80,000',
      description: '14 mule accounts rapidly funnelling micro-transactions into 1 central collector VPA within 18 minutes, followed by immediate crypto P2P cashout.',
      metrics: {
        accountsCount: 15,
        hopCount: 2,
        fanInRatio: '14:1',
        deviceCluster: 'Shared Emulator Fingerprint (Bluestacks_x86_ID: 9942a)',
        timeWindow: '18 minutes',
        avgTxnSize: '₹28,500'
      },
      flaggedVpas: [
        'collector_cashout@ybl',
        'mule_01_del@oksbi', 'mule_02_pat@oksbi', 'mule_03_lko@ybl', 'mule_04_rnc@paytm',
        'mule_05_blr@okaxis', 'mule_06_kol@oksbi', 'mule_07_mum@icici', 'mule_08_jai@ybl',
        'mule_09_ahm@okhdfcbank', 'mule_10_sur@oksbi', 'mule_11_nag@paytm', 'mule_12_bho@okaxis',
        'mule_13_ind@oksbi', 'mule_14_kan@ybl'
      ]
    },
    {
      id: 'RING-02',
      name: 'Circular Wash Network',
      type: 'circular_wash',
      riskScore: 0.91,
      totalVolume: '₹18,50,000',
      description: 'Closed-loop 6-hop circular transaction chain designed to artificially inflate account trust scores and obscure source of compromised OTP funds.',
      metrics: {
        accountsCount: 6,
        hopCount: 6,
        fanInRatio: '1:1 Circular',
        deviceCluster: 'Distributed VPN (AS13335 Cloudflare Exit Hops)',
        timeWindow: '42 minutes',
        avgTxnSize: '₹45,000'
      },
      flaggedVpas: [
        'wash_alpha@okaxis',
        'wash_bravo@okhdfcbank',
        'wash_charlie@oksbi',
        'wash_delta@ybl',
        'wash_echo@paytm',
        'wash_foxtrot@icici'
      ]
    },
    {
      id: 'RING-03',
      name: 'Cloned IMEI Device Cluster',
      type: 'device_clone',
      riskScore: 0.89,
      totalVolume: '₹27,10,000',
      description: '9 distinct user accounts transacting simultaneously from an identical cloned hardware IMEI and rooted Android operating system fingerprint.',
      metrics: {
        accountsCount: 9,
        hopCount: 1,
        fanInRatio: 'Multi-target Phishing',
        deviceCluster: 'Hardware Hash: SHA256(IMEI:86429104882190)',
        timeWindow: '12 minutes',
        avgTxnSize: '₹34,000'
      },
      flaggedVpas: [
        'spoof_usr1@oksbi', 'spoof_usr2@okhdfcbank', 'spoof_usr3@ybl', 'spoof_usr4@okaxis',
        'spoof_usr5@paytm', 'spoof_usr6@icici', 'spoof_usr7@oksbi', 'spoof_usr8@ybl', 'spoof_usr9@kotak'
      ]
    }
  ];

  // Helper: Random generator
  function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function randomFloat(min, max, decimals = 2) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
  }
  function sample(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // --- Network Topology Generator (300+ Nodes) ---
  function generateNetworkTopology() {
    const nodes = [];
    const links = [];
    const nodeMap = new Map();

    let idCounter = 1;

    // 1. Generate Ring 1 Nodes (Fan-In Aggregator)
    const ring1 = FRAUD_RINGS[0];
    const collectorNode = {
      id: `NODE_${String(idCounter++).padStart(4, '0')}`,
      vpa: ring1.flaggedVpas[0],
      name: 'P2P Crypto Cashout Hub',
      ringId: ring1.id,
      isMule: true,
      isHub: true,
      riskScore: 0.98,
      status: 'HIGH_RISK',
      totalTxnCount: 142,
      balance: '₹38,20,500',
      cluster: 1,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0
    };
    nodes.push(collectorNode);
    nodeMap.set(collectorNode.vpa, collectorNode);

    for (let i = 1; i < ring1.flaggedVpas.length; i++) {
      const vpa = ring1.flaggedVpas[i];
      const node = {
        id: `NODE_${String(idCounter++).padStart(4, '0')}`,
        vpa: vpa,
        name: `Mule Feeder #${i}`,
        ringId: ring1.id,
        isMule: true,
        isHub: false,
        riskScore: randomFloat(0.85, 0.94),
        status: 'HIGH_RISK',
        totalTxnCount: randomBetween(8, 25),
        balance: `₹${randomBetween(2000, 15000)}`,
        cluster: 1,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0
      };
      nodes.push(node);
      nodeMap.set(vpa, node);
      // Link to collector
      links.push({
        source: node.id,
        target: collectorNode.id,
        volume: randomBetween(25000, 48000),
        isFraud: true,
        ringId: ring1.id
      });
    }

    // 2. Generate Ring 2 Nodes (Circular Wash)
    const ring2 = FRAUD_RINGS[1];
    const ring2Nodes = [];
    for (let i = 0; i < ring2.flaggedVpas.length; i++) {
      const vpa = ring2.flaggedVpas[i];
      const node = {
        id: `NODE_${String(idCounter++).padStart(4, '0')}`,
        vpa: vpa,
        name: `Wash Layer Node ${String.fromCharCode(65 + i)}`,
        ringId: ring2.id,
        isMule: true,
        isHub: false,
        riskScore: randomFloat(0.88, 0.93),
        status: 'HIGH_RISK',
        totalTxnCount: randomBetween(12, 35),
        balance: `₹${randomBetween(10000, 55000)}`,
        cluster: 2,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0
      };
      nodes.push(node);
      nodeMap.set(vpa, node);
      ring2Nodes.push(node);
    }
    // Connect in circular loop
    for (let i = 0; i < ring2Nodes.length; i++) {
      const nextIdx = (i + 1) % ring2Nodes.length;
      links.push({
        source: ring2Nodes[i].id,
        target: ring2Nodes[nextIdx].id,
        volume: randomBetween(35000, 52000),
        isFraud: true,
        ringId: ring2.id
      });
    }

    // 3. Generate Ring 3 Nodes (Cloned IMEI)
    const ring3 = FRAUD_RINGS[2];
    const ring3Nodes = [];
    for (let i = 0; i < ring3.flaggedVpas.length; i++) {
      const vpa = ring3.flaggedVpas[i];
      const node = {
        id: `NODE_${String(idCounter++).padStart(4, '0')}`,
        vpa: vpa,
        name: `Cloned Victim Account #${i + 1}`,
        ringId: ring3.id,
        isMule: true,
        isHub: false,
        riskScore: randomFloat(0.82, 0.91),
        status: 'HIGH_RISK',
        totalTxnCount: randomBetween(5, 18),
        balance: `₹${randomBetween(5000, 32000)}`,
        cluster: 3,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0
      };
      nodes.push(node);
      nodeMap.set(vpa, node);
      ring3Nodes.push(node);
    }
    // Cross links among ring 3
    for (let i = 0; i < ring3Nodes.length - 1; i++) {
      links.push({
        source: ring3Nodes[i].id,
        target: ring3Nodes[i + 1].id,
        volume: randomBetween(20000, 42000),
        isFraud: true,
        ringId: ring3.id
      });
    }

    // 4. Generate 270 Legitimate / Safe Nodes
    const targetCount = 300;
    while (nodes.length < targetCount) {
      const firstName = sample(FIRST_NAMES);
      const lastName = sample(LAST_NAMES);
      const bank = sample(BANKS);
      const vpa = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomBetween(10, 99)}@${bank}`;
      
      const isMerchant = Math.random() < 0.12;
      const node = {
        id: `NODE_${String(idCounter++).padStart(4, '0')}`,
        vpa: isMerchant ? sample(MERCHANTS) : vpa,
        name: isMerchant ? 'Verified Merchant' : `${firstName} ${lastName}`,
        ringId: null,
        isMule: false,
        isHub: isMerchant,
        riskScore: randomFloat(0.01, 0.18),
        status: 'SAFE',
        totalTxnCount: randomBetween(3, 85),
        balance: `₹${randomBetween(1200, 95000)}`,
        cluster: 0,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0
      };
      nodes.push(node);
    }

    // 5. Generate Natural Transaction Links between Legitimate Nodes (Power Law Distribution)
    for (let i = 30; i < nodes.length; i++) {
      // Connect to 1 to 3 other random nodes
      const connectionCount = randomBetween(1, 3);
      for (let c = 0; c < connectionCount; c++) {
        const targetNode = nodes[randomBetween(30, nodes.length - 1)];
        if (targetNode.id !== nodes[i].id) {
          links.push({
            source: nodes[i].id,
            target: targetNode.id,
            volume: randomBetween(150, 4500),
            isFraud: false,
            ringId: null
          });
        }
      }
    }

    return { nodes, links, rings: FRAUD_RINGS };
  }

  // --- Real-Time Transaction Generator ---
  let txnSequence = 982402100;
  function generateTransaction(forceFraud = false, ringIndex = 0) {
    txnSequence += randomBetween(1, 4);
    const txnId = `TXN_UPI_${txnSequence}`;
    const timestamp = new Date().toISOString();

    const isFraud = forceFraud || Math.random() < 0.005; // 0.5% fraud rate

    let senderVpa, receiverVpa, amount, riskScore, decision, ringId = null;
    let pipelineLatencies, topFeatures, biometrics;

    if (isFraud) {
      const ring = FRAUD_RINGS[ringIndex % FRAUD_RINGS.length];
      ringId = ring.id;
      senderVpa = sample(ring.flaggedVpas.slice(1)) || 'compromised.user88@oksbi';
      receiverVpa = ring.flaggedVpas[0] || 'mule_aggregator@ybl';
      amount = randomBetween(24000, 75000);
      riskScore = randomFloat(0.86, 0.98);
      decision = riskScore > 0.90 ? 'BLOCK' : 'STEP_UP';

      pipelineLatencies = {
        ingestion: randomBetween(28, 42),      // API Gateway & Kafka
        features: randomBetween(75, 95),       // Redis + Feast Feature Store
        modelScore: randomBetween(145, 185),   // GNN + XGBoost Ensemble (<200ms)
        biometrics: randomBetween(45, 62),     // Typing & Swipe Validation
        decision: randomBetween(18, 28)        // Arbiter & Interdict Action
      };

      topFeatures = [
        { name: 'GNN 2-Hop Mule Network Proximity', delta: '+0.38', type: 'risk' },
        { name: 'Device Fingerprint / Root Check Anomaly', delta: '+0.24', type: 'risk' },
        { name: 'Velocity: 8th Txn in 180s', delta: '+0.19', type: 'risk' },
        { name: 'Impossible Velocity Travel (Delhi->Patna 22m)', delta: '+0.12', type: 'risk' },
        { name: 'Swipe Trajectory Curvature Deviation', delta: '+0.09', type: 'risk' },
        { name: 'Aadhaar e-KYC Account Age (4 yrs)', delta: '-0.14', type: 'safe' }
      ];

      biometrics = {
        matchScore: randomBetween(22, 42),
        typingRhythmVariance: 'HIGH (Synthetic/Bot cadence)',
        swipeAngleDeviation: '41.8° (Erratic / Emulated)',
        flightTimeMs: 42,
        dwellTimeMs: 18,
        status: 'FAILED'
      };
    } else {
      senderVpa = `${sample(FIRST_NAMES).toLowerCase()}.${sample(LAST_NAMES).toLowerCase()}${randomBetween(10, 99)}@${sample(BANKS)}`;
      receiverVpa = Math.random() < 0.4 ? sample(MERCHANTS) : `${sample(FIRST_NAMES).toLowerCase()}@${sample(BANKS)}`;
      amount = randomBetween(120, 8500);
      riskScore = randomFloat(0.02, 0.28);
      decision = 'APPROVE';

      pipelineLatencies = {
        ingestion: randomBetween(22, 35),
        features: randomBetween(65, 82),
        modelScore: randomBetween(132, 168),   // Strict <200ms budget
        biometrics: randomBetween(38, 54),
        decision: randomBetween(14, 22)
      };

      topFeatures = [
        { name: 'Historic VPA Whitelist Affinity', delta: '-0.28', type: 'safe' },
        { name: 'Device Fingerprint Consistent', delta: '-0.21', type: 'safe' },
        { name: 'Usual Circadian Spending Window', delta: '-0.15', type: 'safe' },
        { name: 'Low Beneficiary Volatility', delta: '-0.08', type: 'safe' }
      ];

      biometrics = {
        matchScore: randomBetween(88, 99),
        typingRhythmVariance: 'NORMAL (Natural Human Curve)',
        swipeAngleDeviation: '4.2° (Standard thumb arc)',
        flightTimeMs: 148,
        dwellTimeMs: 84,
        status: 'PASSED'
      };
    }

    const totalLatency = Object.values(pipelineLatencies).reduce((a, b) => a + b, 0);

    return {
      txnId,
      timestamp,
      senderVpa,
      receiverVpa,
      amount: `₹${amount.toLocaleString('en-IN')}`,
      rawAmount: amount,
      isFraud,
      riskScore,
      decision,
      ringId,
      pipelineLatencies,
      totalLatency,
      topFeatures,
      biometrics
    };
  }

  // --- Behavioral Biometrics Synthesizer ---
  function getBiometricProfiles() {
    return {
      genuineUser: {
        label: 'Genuine Account Holder',
        keystrokeCadence: [145, 162, 138, 175, 142, 158, 169, 144, 151],
        dwellTimes: [82, 88, 79, 94, 85, 89, 91, 84, 86],
        swipeTrajectory: [
          { x: 40, y: 180 }, { x: 55, y: 162 }, { x: 78, y: 138 },
          { x: 110, y: 110 }, { x: 152, y: 84 }, { x: 198, y: 68 },
          { x: 245, y: 58 }, { x: 290, y: 54 }
        ],
        velocityProfile: [1.2, 1.8, 2.4, 2.9, 2.6, 2.1, 1.4, 0.8],
        tremorHz: 9.8,
        matchPct: 96.4
      },
      attackSession: {
        label: 'Suspicious Session (Bot / Hijacked)',
        keystrokeCadence: [45, 46, 44, 45, 45, 46, 44, 45, 45], // Unnatural machine rigidity
        dwellTimes: [20, 20, 19, 21, 20, 20, 20, 21, 20],
        swipeTrajectory: [
          { x: 40, y: 180 }, { x: 80, y: 160 }, { x: 120, y: 140 },
          { x: 160, y: 120 }, { x: 200, y: 100 }, { x: 240, y: 80 },
          { x: 280, y: 60 } // Unnatural straight vector injection
        ],
        velocityProfile: [3.8, 3.8, 3.8, 3.8, 3.8, 3.8, 3.8],
        tremorHz: 0.0, // Zero biological micro-tremor
        matchPct: 31.8
      }
    };
  }

  // --- Imbalanced Data & Precision-Recall Performance Model ---
  // Model trained on 50,000,000 UPI txns with 0.18% base fraud prevalence
  function calculateThresholdTradeoff(threshold = 0.50) {
    const totalTransactions = 100000;
    const actualFraud = 200; // 0.2%
    const actualLegit = totalTransactions - actualFraud;

    // Logistic sensitivity curves for high-precision GNN model
    // At higher threshold: Recall drops, Precision increases, FPR drops
    const recall = Math.max(0.60, Math.min(0.99, 1 / (1 + Math.exp(5 * (threshold - 0.35)))));
    const precision = Math.max(0.70, Math.min(0.995, 1 / (1 + Math.exp(-6 * (threshold - 0.45)))));
    const fpr = Math.max(0.0001, Math.min(0.015, 0.008 * Math.exp(-4 * threshold)));

    const truePositives = Math.round(actualFraud * recall);
    const falseNegatives = actualFraud - truePositives; // Missed fraud
    const falsePositives = Math.round(actualLegit * fpr);
    const trueNegatives = actualLegit - falsePositives;

    const avgFraudLoss = 32000; // ₹32,000 per unstopped fraud
    const falsePositiveFrictionCost = 450; // ₹450 support/friction cost per blocked legit user

    const fraudLossPrevented = truePositives * avgFraudLoss;
    const missedFraudLoss = falseNegatives * avgFraudLoss;
    const customerFrictionLoss = falsePositives * falsePositiveFrictionCost;

    return {
      threshold,
      precision: parseFloat((precision * 100).toFixed(2)),
      recall: parseFloat((recall * 100).toFixed(2)),
      prAuc: 0.942,
      rocAuc: 0.991,
      fpr: parseFloat((fpr * 100).toFixed(3)),
      truePositives,
      falseNegatives,
      falsePositives,
      trueNegatives,
      financials: {
        preventedFormatted: `₹${(fraudLossPrevented / 100000).toFixed(1)} Lakhs`,
        missedLossFormatted: `₹${(missedFraudLoss / 100000).toFixed(1)} Lakhs`,
        frictionCostFormatted: `₹${(customerFrictionLoss / 1000).toFixed(1)}K`
      }
    };
  }

  return {
    generateNetworkTopology,
    generateTransaction,
    getBiometricProfiles,
    calculateThresholdTradeoff,
    FRAUD_RINGS
  };
});
