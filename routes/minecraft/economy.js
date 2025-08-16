const express = require('express');
const crypto = require('crypto');

const router = express.Router();

// In-memory storage for economy data (use database in production)
let economies = new Map();
let transactions = [];
let shops = new Map();
let auctions = new Map();

// Create or update economy system
router.post('/create', (req, res) => {
  const {
    name,
    currency = 'coins',
    startingBalance = 100,
    settings = {},
    features = ['banking', 'shops', 'auctions', 'jobs']
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Economy name is required' });
  }

  const economyId = crypto.randomUUID();
  const economy = createEconomy(economyId, name, currency, startingBalance, settings, features);

  economies.set(economyId, economy);

  res.json({
    economyId,
    economy,
    configuration: economy.configuration,
    features: economy.features,
    timestamp: new Date().toISOString()
  });
});

// Player balance management
router.post('/balance/manage', (req, res) => {
  const {
    economyId,
    playerId,
    action, // 'get', 'set', 'add', 'subtract'
    amount = 0,
    reason = ''
  } = req.body;

  if (!economyId || !playerId || !action) {
    return res.status(400).json({ error: 'Economy ID, player ID, and action are required' });
  }

  const economy = economies.get(economyId);
  if (!economy) {
    return res.status(404).json({ error: 'Economy not found' });
  }

  const result = managePlayerBalance(economy, playerId, action, amount, reason);

  res.json({
    playerId,
    action,
    result,
    balance: result.newBalance,
    transaction: result.transaction,
    timestamp: new Date().toISOString()
  });
});

// Transaction history
router.get('/transactions/:economyId', (req, res) => {
  const { economyId } = req.params;
  const { playerId, limit = 50, type, dateFrom, dateTo } = req.query;

  const economyTransactions = getTransactionHistory(economyId, {
    playerId, limit: parseInt(limit), type, dateFrom, dateTo
  });

  res.json({
    economyId,
    transactions: economyTransactions.transactions,
    summary: economyTransactions.summary,
    filters: economyTransactions.filters,
    timestamp: new Date().toISOString()
  });
});

// Shop system
router.post('/shops/create', (req, res) => {
  const {
    economyId,
    ownerId,
    name,
    location = {},
    items = [],
    settings = {}
  } = req.body;

  if (!economyId || !ownerId || !name) {
    return res.status(400).json({ error: 'Economy ID, owner ID, and shop name are required' });
  }

  const shopId = crypto.randomUUID();
  const shop = createShop(shopId, economyId, ownerId, name, location, items, settings);

  shops.set(shopId, shop);

  res.json({
    shopId,
    shop,
    management: generateShopManagement(shop),
    analytics: generateShopAnalytics(shop),
    timestamp: new Date().toISOString()
  });
});

// Shop item management
router.post('/shops/:shopId/items', (req, res) => {
  const { shopId } = req.params;
  const {
    action, // 'add', 'update', 'remove', 'restock'
    itemId,
    item = {},
    quantity = 1
  } = req.body;

  const shop = shops.get(shopId);
  if (!shop) {
    return res.status(404).json({ error: 'Shop not found' });
  }

  const result = manageShopItems(shop, action, itemId, item, quantity);

  res.json({
    shopId,
    action,
    result,
    inventory: shop.inventory,
    timestamp: new Date().toISOString()
  });
});

// Auction system
router.post('/auctions/create', (req, res) => {
  const {
    economyId,
    sellerId,
    item,
    startingBid = 1,
    buyoutPrice = null,
    duration = 86400, // 24 hours
    description = ''
  } = req.body;

  if (!economyId || !sellerId || !item) {
    return res.status(400).json({ error: 'Economy ID, seller ID, and item are required' });
  }

  const auctionId = crypto.randomUUID();
  const auction = createAuction(auctionId, economyId, sellerId, item, startingBid, buyoutPrice, duration, description);

  auctions.set(auctionId, auction);

  res.json({
    auctionId,
    auction,
    bidding: generateBiddingInfo(auction),
    timeline: generateAuctionTimeline(auction),
    timestamp: new Date().toISOString()
  });
});

// Place bid on auction
router.post('/auctions/:auctionId/bid', (req, res) => {
  const { auctionId } = req.params;
  const { bidderId, amount } = req.body;

  if (!bidderId || !amount) {
    return res.status(400).json({ error: 'Bidder ID and bid amount are required' });
  }

  const auction = auctions.get(auctionId);
  if (!auction) {
    return res.status(404).json({ error: 'Auction not found' });
  }

  const result = placeBid(auction, bidderId, amount);

  res.json({
    auctionId,
    bid: result.bid,
    auction: result.auction,
    status: result.status,
    timestamp: new Date().toISOString()
  });
});

// Banking system
router.post('/banking/account', (req, res) => {
  const {
    economyId,
    playerId,
    action, // 'create', 'deposit', 'withdraw', 'transfer', 'loan'
    amount = 0,
    targetPlayerId = null,
    accountType = 'savings'
  } = req.body;

  if (!economyId || !playerId || !action) {
    return res.status(400).json({ error: 'Economy ID, player ID, and action are required' });
  }

  const economy = economies.get(economyId);
  if (!economy) {
    return res.status(404).json({ error: 'Economy not found' });
  }

  const result = manageBankAccount(economy, playerId, action, amount, targetPlayerId, accountType);

  res.json({
    playerId,
    action,
    result,
    account: result.account,
    transaction: result.transaction,
    timestamp: new Date().toISOString()
  });
});

// Job system
router.post('/jobs/manage', (req, res) => {
  const {
    economyId,
    playerId,
    action, // 'join', 'leave', 'work', 'promote'
    jobId,
    jobData = {}
  } = req.body;

  if (!economyId || !playerId || !action) {
    return res.status(400).json({ error: 'Economy ID, player ID, and action are required' });
  }

  const economy = economies.get(economyId);
  if (!economy) {
    return res.status(404).json({ error: 'Economy not found' });
  }

  const result = managePlayerJob(economy, playerId, action, jobId, jobData);

  res.json({
    playerId,
    action,
    result,
    job: result.job,
    earnings: result.earnings,
    timestamp: new Date().toISOString()
  });
});

// Economy analytics
router.get('/analytics/:economyId', (req, res) => {
  const { economyId } = req.params;
  const { period = '7d', metrics = 'all' } = req.query;

  const economy = economies.get(economyId);
  if (!economy) {
    return res.status(404).json({ error: 'Economy not found' });
  }

  const analytics = generateEconomyAnalytics(economy, period, metrics);

  res.json({
    economyId,
    period,
    analytics,
    insights: generateEconomicInsights(analytics),
    recommendations: generateEconomicRecommendations(analytics),
    timestamp: new Date().toISOString()
  });
});

// Tax system
router.post('/taxes/configure', (req, res) => {
  const {
    economyId,
    taxType, // 'income', 'sales', 'property', 'wealth'
    rate = 0.1,
    brackets = [],
    exemptions = []
  } = req.body;

  if (!economyId || !taxType) {
    return res.status(400).json({ error: 'Economy ID and tax type are required' });
  }

  const economy = economies.get(economyId);
  if (!economy) {
    return res.status(404).json({ error: 'Economy not found' });
  }

  const taxSystem = configureTaxSystem(economy, taxType, rate, brackets, exemptions);

  res.json({
    economyId,
    taxSystem,
    impact: calculateTaxImpact(economy, taxSystem),
    collection: generateTaxCollection(taxSystem),
    timestamp: new Date().toISOString()
  });
});

// Helper functions
function createEconomy(id, name, currency, startingBalance, settings, features) {
  return {
    id,
    name,
    currency,
    startingBalance,
    settings: {
      maxBalance: settings.maxBalance || 1000000,
      minBalance: settings.minBalance || 0,
      dailyLimit: settings.dailyLimit || 10000,
      taxRate: settings.taxRate || 0.05,
      inflationRate: settings.inflationRate || 0.02,
      ...settings
    },
    features,
    players: new Map(),
    banks: new Map(),
    jobs: generateDefaultJobs(),
    statistics: {
      totalMoney: 0,
      totalTransactions: 0,
      activeShops: 0,
      activeAuctions: 0
    },
    configuration: generateEconomyConfiguration(features, settings),
    created: new Date().toISOString()
  };
}

function managePlayerBalance(economy, playerId, action, amount, reason) {
  let player = economy.players.get(playerId) || {
    id: playerId,
    balance: economy.startingBalance,
    bankAccounts: {},
    transactions: [],
    jobs: [],
    joined: new Date().toISOString()
  };

  let newBalance = player.balance;
  let success = false;
  let message = '';

  switch (action) {
    case 'get':
      success = true;
      message = 'Balance retrieved';
      break;
    case 'set':
      newBalance = Math.max(economy.settings.minBalance, Math.min(amount, economy.settings.maxBalance));
      success = true;
      message = `Balance set to ${newBalance}`;
      break;
    case 'add':
      newBalance = Math.min(player.balance + amount, economy.settings.maxBalance);
      success = newBalance > player.balance;
      message = success ? `Added ${amount} to balance` : 'Cannot exceed maximum balance';
      break;
    case 'subtract':
      newBalance = Math.max(player.balance - amount, economy.settings.minBalance);
      success = newBalance < player.balance;
      message = success ? `Subtracted ${amount} from balance` : 'Insufficient funds';
      break;
  }

  if (success && action !== 'get') {
    player.balance = newBalance;
    
    const transaction = {
      id: crypto.randomUUID(),
      playerId,
      type: action,
      amount,
      oldBalance: player.balance,
      newBalance,
      reason,
      timestamp: new Date().toISOString()
    };

    player.transactions.push(transaction);
    transactions.push(transaction);
    economy.players.set(playerId, player);
  }

  return {
    success,
    message,
    oldBalance: player.balance,
    newBalance,
    transaction: success && action !== 'get' ? player.transactions[player.transactions.length - 1] : null
  };
}

function getTransactionHistory(economyId, filters) {
  let filteredTransactions = transactions.filter(t => {
    let match = true;
    if (filters.playerId) match = match && t.playerId === filters.playerId;
    if (filters.type) match = match && t.type === filters.type;
    if (filters.dateFrom) match = match && new Date(t.timestamp) >= new Date(filters.dateFrom);
    if (filters.dateTo) match = match && new Date(t.timestamp) <= new Date(filters.dateTo);
    return match;
  });

  filteredTransactions = filteredTransactions.slice(0, filters.limit);

  return {
    transactions: filteredTransactions,
    summary: {
      total: filteredTransactions.length,
      totalAmount: filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
      types: [...new Set(filteredTransactions.map(t => t.type))]
    },
    filters
  };
}

function createShop(id, economyId, ownerId, name, location, items, settings) {
  return {
    id,
    economyId,
    ownerId,
    name,
    location,
    inventory: items.map(item => ({
      id: crypto.randomUUID(),
      ...item,
      stock: item.stock || 0,
      price: item.price || 1
    })),
    settings: {
      maxItems: settings.maxItems || 100,
      taxRate: settings.taxRate || 0.05,
      autoRestock: settings.autoRestock || false,
      ...settings
    },
    statistics: {
      totalSales: 0,
      totalRevenue: 0,
      customers: new Set()
    },
    created: new Date().toISOString()
  };
}

function manageShopItems(shop, action, itemId, item, quantity) {
  let success = false;
  let message = '';

  switch (action) {
    case 'add':
      if (shop.inventory.length < shop.settings.maxItems) {
        shop.inventory.push({
          id: crypto.randomUUID(),
          ...item,
          stock: quantity
        });
        success = true;
        message = 'Item added to shop';
      } else {
        message = 'Shop inventory full';
      }
      break;
    case 'update':
      const itemIndex = shop.inventory.findIndex(i => i.id === itemId);
      if (itemIndex !== -1) {
        shop.inventory[itemIndex] = { ...shop.inventory[itemIndex], ...item };
        success = true;
        message = 'Item updated';
      } else {
        message = 'Item not found';
      }
      break;
    case 'remove':
      const removeIndex = shop.inventory.findIndex(i => i.id === itemId);
      if (removeIndex !== -1) {
        shop.inventory.splice(removeIndex, 1);
        success = true;
        message = 'Item removed from shop';
      } else {
        message = 'Item not found';
      }
      break;
    case 'restock':
      const restockIndex = shop.inventory.findIndex(i => i.id === itemId);
      if (restockIndex !== -1) {
        shop.inventory[restockIndex].stock += quantity;
        success = true;
        message = `Restocked ${quantity} items`;
      } else {
        message = 'Item not found';
      }
      break;
  }

  return { success, message };
}

function createAuction(id, economyId, sellerId, item, startingBid, buyoutPrice, duration, description) {
  return {
    id,
    economyId,
    sellerId,
    item,
    startingBid,
    currentBid: startingBid,
    buyoutPrice,
    duration,
    description,
    bids: [],
    status: 'active',
    endTime: new Date(Date.now() + duration * 1000).toISOString(),
    created: new Date().toISOString()
  };
}

function placeBid(auction, bidderId, amount) {
  if (auction.status !== 'active') {
    return { success: false, message: 'Auction is not active' };
  }

  if (new Date() > new Date(auction.endTime)) {
    auction.status = 'ended';
    return { success: false, message: 'Auction has ended' };
  }

  if (amount <= auction.currentBid) {
    return { success: false, message: 'Bid must be higher than current bid' };
  }

  if (auction.buyoutPrice && amount >= auction.buyoutPrice) {
    auction.status = 'sold';
    auction.winnerId = bidderId;
  }

  const bid = {
    id: crypto.randomUUID(),
    bidderId,
    amount,
    timestamp: new Date().toISOString()
  };

  auction.bids.push(bid);
  auction.currentBid = amount;

  return {
    success: true,
    bid,
    auction,
    status: auction.status
  };
}

function manageBankAccount(economy, playerId, action, amount, targetPlayerId, accountType) {
  let player = economy.players.get(playerId) || {
    id: playerId,
    balance: economy.startingBalance,
    bankAccounts: {},
    transactions: []
  };

  let account = player.bankAccounts[accountType] || {
    type: accountType,
    balance: 0,
    interestRate: accountType === 'savings' ? 0.02 : 0,
    created: new Date().toISOString()
  };

  let success = false;
  let message = '';
  let transaction = null;

  switch (action) {
    case 'create':
      player.bankAccounts[accountType] = account;
      success = true;
      message = `${accountType} account created`;
      break;
    case 'deposit':
      if (player.balance >= amount) {
        player.balance -= amount;
        account.balance += amount;
        success = true;
        message = `Deposited ${amount} to ${accountType} account`;
      } else {
        message = 'Insufficient funds';
      }
      break;
    case 'withdraw':
      if (account.balance >= amount) {
        account.balance -= amount;
        player.balance += amount;
        success = true;
        message = `Withdrew ${amount} from ${accountType} account`;
      } else {
        message = 'Insufficient account balance';
      }
      break;
  }

  if (success) {
    player.bankAccounts[accountType] = account;
    economy.players.set(playerId, player);
  }

  return { success, message, account, transaction };
}

function managePlayerJob(economy, playerId, action, jobId, jobData) {
  const jobs = economy.jobs;
  let player = economy.players.get(playerId) || {
    id: playerId,
    balance: economy.startingBalance,
    jobs: []
  };

  let success = false;
  let message = '';
  let earnings = 0;

  switch (action) {
    case 'join':
      if (jobs[jobId] && !player.jobs.find(j => j.id === jobId)) {
        player.jobs.push({
          id: jobId,
          name: jobs[jobId].name,
          level: 1,
          experience: 0,
          joined: new Date().toISOString()
        });
        success = true;
        message = `Joined ${jobs[jobId].name}`;
      }
      break;
    case 'work':
      const job = player.jobs.find(j => j.id === jobId);
      if (job && jobs[jobId]) {
        earnings = calculateJobEarnings(jobs[jobId], job.level);
        player.balance += earnings;
        job.experience += 10;
        if (job.experience >= job.level * 100) {
          job.level++;
          job.experience = 0;
        }
        success = true;
        message = `Worked and earned ${earnings}`;
      }
      break;
  }

  if (success) {
    economy.players.set(playerId, player);
  }

  return { success, message, job: player.jobs.find(j => j.id === jobId), earnings };
}

function generateDefaultJobs() {
  return {
    miner: { name: 'Miner', baseWage: 10, multiplier: 1.2 },
    farmer: { name: 'Farmer', baseWage: 8, multiplier: 1.1 },
    builder: { name: 'Builder', baseWage: 15, multiplier: 1.3 },
    merchant: { name: 'Merchant', baseWage: 12, multiplier: 1.25 }
  };
}

function calculateJobEarnings(jobType, level) {
  return Math.floor(jobType.baseWage * Math.pow(jobType.multiplier, level - 1));
}

function generateEconomyConfiguration(features, settings) {
  return {
    features: features.map(f => ({ name: f, enabled: true })),
    settings: Object.entries(settings).map(([key, value]) => ({ key, value })),
    commands: generateEconomyCommands(features),
    permissions: generateEconomyPermissions(features)
  };
}

function generateEconomyCommands(features) {
  const commands = ['/balance', '/pay', '/baltop'];
  if (features.includes('banking')) commands.push('/bank', '/loan');
  if (features.includes('shops')) commands.push('/shop', '/sell');
  if (features.includes('auctions')) commands.push('/auction', '/bid');
  if (features.includes('jobs')) commands.push('/jobs', '/work');
  return commands;
}

function generateEconomyPermissions(features) {
  return {
    admin: ['economy.*'],
    moderator: ['economy.manage', 'economy.view'],
    player: ['economy.balance', 'economy.pay']
  };
}

function generateShopManagement(shop) {
  return {
    inventory: shop.inventory.length,
    revenue: shop.statistics.totalRevenue,
    customers: shop.statistics.customers.size,
    recommendations: [
      'Stock popular items',
      'Adjust prices based on demand',
      'Implement loyalty programs'
    ]
  };
}

function generateShopAnalytics(shop) {
  return {
    performance: 'good',
    topItems: shop.inventory.slice(0, 3),
    trends: 'increasing sales',
    suggestions: ['Add seasonal items', 'Optimize pricing']
  };
}

function generateBiddingInfo(auction) {
  return {
    currentBid: auction.currentBid,
    bidCount: auction.bids.length,
    timeRemaining: Math.max(0, new Date(auction.endTime) - new Date()),
    buyoutAvailable: !!auction.buyoutPrice
  };
}

function generateAuctionTimeline(auction) {
  return auction.bids.map(bid => ({
    time: bid.timestamp,
    event: `Bid placed: ${bid.amount}`,
    bidder: bid.bidderId
  }));
}

function generateEconomyAnalytics(economy, period, metrics) {
  return {
    players: {
      total: economy.players.size,
      active: Math.floor(economy.players.size * 0.7),
      richest: Array.from(economy.players.values()).sort((a, b) => b.balance - a.balance).slice(0, 10)
    },
    money: {
      circulation: economy.statistics.totalMoney,
      averageBalance: economy.statistics.totalMoney / economy.players.size || 0,
      inflation: 2.5
    },
    activity: {
      transactions: economy.statistics.totalTransactions,
      shops: economy.statistics.activeShops,
      auctions: economy.statistics.activeAuctions
    }
  };
}

function generateEconomicInsights(analytics) {
  return [
    'Money circulation is healthy',
    'Player activity is increasing',
    'Shop economy is growing'
  ];
}

function generateEconomicRecommendations(analytics) {
  return [
    'Consider implementing money sinks',
    'Add more job opportunities',
    'Monitor inflation rates'
  ];
}

function configureTaxSystem(economy, taxType, rate, brackets, exemptions) {
  return {
    type: taxType,
    rate,
    brackets,
    exemptions,
    collection: {
      total: 0,
      lastCollection: new Date().toISOString()
    }
  };
}

function calculateTaxImpact(economy, taxSystem) {
  const totalWealth = Array.from(economy.players.values()).reduce((sum, p) => sum + p.balance, 0);
  const estimatedRevenue = totalWealth * taxSystem.rate;
  
  return {
    estimatedRevenue,
    affectedPlayers: economy.players.size,
    economicImpact: 'moderate'
  };
}

function generateTaxCollection(taxSystem) {
  return {
    schedule: 'weekly',
    method: 'automatic',
    notifications: true,
    appeals: true
  };
}

module.exports = router;
