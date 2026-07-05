const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');
const StockTransaction = require('../models/StockTransaction');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const { protect } = require('../middleware/auth');

// @route   GET /api/stock-reports/overview/:shopId
// @desc    Get stock overview report
// @access  Private
router.get('/overview/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view stock reports for this shop' });
    }

    const [stockData, lowStock, totalProducts] = await Promise.all([
      Stock.find({ shopId })
        .populate('productId', 'name sku category brand')
        .sort({ quantity: 1 }),
      Stock.find({ shopId, quantity: { $lt: 10 } })
        .populate('productId', 'name sku category brand minStockLevel'),
      Product.countDocuments({ status: 'active' })
    ]);

    const totalStockValue = stockData.reduce((sum, stock) => {
      if (stock.productId && stock.productId.costPrice) {
        return sum + (stock.quantity * stock.productId.costPrice);
      }
      return sum;
    }, 0);

    const totalStockValueSelling = stockData.reduce((sum, stock) => {
      if (stock.productId && stock.productId.price) {
        return sum + (stock.quantity * stock.productId.price);
      }
      return sum;
    }, 0);

    const totalPotentialProfit = totalStockValueSelling - totalStockValue;

    // Calculate stock by category
    const stockByCategory = {};
    stockData.forEach(stock => {
      if (stock.productId && stock.productId.category) {
        const category = stock.productId.category;
        if (!stockByCategory[category]) {
          stockByCategory[category] = {
            category,
            totalProducts: 0,
            totalQuantity: 0,
            totalValue: 0
          };
        }
        stockByCategory[category].totalProducts += 1;
        stockByCategory[category].totalQuantity += stock.quantity;
        stockByCategory[category].totalValue += stock.quantity * (stock.productId.costPrice || 0);
      }
    });

    res.json({
      shopId,
      summary: {
        totalProducts,
        productsInStock: stockData.length,
        lowStockCount: lowStock.length,
        totalItems: stockData.reduce((sum, s) => sum + s.quantity, 0),
        totalStockValue,
        totalStockValueSelling,
        totalPotentialProfit,
        averageStockLevel: stockData.length > 0 ? (stockData.reduce((sum, s) => sum + s.quantity, 0) / stockData.length).toFixed(0) : 0
      },
      lowStock: lowStock.map(s => ({
        productId: s.productId._id,
        name: s.productId.name,
        sku: s.productId.sku,
        category: s.productId.category,
        currentStock: s.quantity,
        minStockLevel: s.productId.minStockLevel,
        deficit: s.productId.minStockLevel - s.quantity
      })),
      stockByCategory: Object.values(stockByCategory).sort((a, b) => b.totalValue - a.totalValue)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reports/stock/movement/:shopId
// @desc    Get stock movement report
// @access  Private
router.get('/movement/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { period = '30days', type } = req.query;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view stock reports for this shop' });
    }

    // Calculate date range
    const now = new Date();
    let startDate;

    if (period === '7days') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30days') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '90days') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 90);
    } else {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
    }

    const endDate = new Date();

    // Build query
    let query = {
      shopId,
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (type && type !== 'all') {
      query.type = type;
    }

    const transactions = await StockTransaction.find(query)
      .populate('productId', 'name sku')
      .sort({ createdAt: -1 });

    // Aggregate by type
    const movementByType = transactions.reduce((acc, t) => {
      if (!acc[t.type]) {
        acc[t.type] = {
          type: t.type,
          count: 0,
          totalQuantity: 0
        };
      }
      acc[t.type].count += 1;
      acc[t.type].totalQuantity += t.quantity;
      return acc;
    }, {});

    // Aggregate by product
    const productMovement = transactions.reduce((acc, t) => {
      const key = t.productId._id.toString();
      if (!acc[key]) {
        acc[key] = {
          productId: t.productId._id,
          productName: t.productId.name,
          sku: t.productId.sku,
          in: 0,
          out: 0,
          transferIn: 0,
          transferOut: 0
        };
      }

      if (t.type === 'in') {
        acc[key].in += t.quantity;
      } else if (t.type === 'out') {
        acc[key].out += t.quantity;
      } else if (t.referenceType === 'transfer') {
        if (t.fromShop) {
          acc[key].transferOut += t.quantity;
        } else if (t.toShop) {
          acc[key].transferIn += t.quantity;
        }
      }

      return acc;
    }, {});

    const topProducts = Object.values(productMovement)
      .sort((a, b) => (b.in + b.out) - (a.in + a.out))
      .slice(0, 10);

    res.json({
      shopId,
      period,
      type: type || 'all',
      dateRange: { startDate, endDate },
      summary: {
        totalTransactions: transactions.length,
        movementByType: Object.values(movementByType)
      },
      productMovement: Object.values(productMovement).map(p => ({
        ...p,
        netMovement: p.in - p.out,
        totalMovement: p.in + p.out + p.transferIn + p.transferOut
      })),
      topProducts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reports/stock/low-stock/:shopId
// @desc    Get low stock alerts
// @access  Private
router.get('/low-stock/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { severity = 'medium' } = req.query;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view stock reports for this shop' });
    }

    let threshold = 10; // default medium
    if (severity === 'critical') {
      threshold = 5;
    } else if (severity === 'high') {
      threshold = 7;
    } else if (severity === 'low') {
      threshold = 15;
    }

    const lowStockItems = await Stock.find({ shopId, quantity: { $lt: threshold } })
      .populate('productId', 'name sku category brand minStockLevel price costPrice')
      .sort({ quantity: 1 });

    // Categorize by severity
    const critical = lowStockItems.filter(s => s.quantity <= 5);
    const high = lowStockItems.filter(s => s.quantity > 5 && s.quantity <= 10);
    const medium = lowStockItems.filter(s => s.quantity > 10 && s.quantity <= 15);

    // Calculate restocking costs
    const restockingCosts = lowStockItems.map(s => {
      const deficit = (s.productId.minStockLevel || 10) - s.quantity;
      return {
        productId: s.productId._id,
        name: s.productId.name,
        currentStock: s.quantity,
        minStockLevel: s.productId.minStockLevel || 10,
        deficit: deficit > 0 ? deficit : 0,
        restockingCost: deficit > 0 ? deficit * (s.productId.costPrice || 0) : 0,
        restockingValue: deficit > 0 ? deficit * (s.productId.price || 0) : 0
      };
    });

    const totalRestockingCost = restockingCosts.reduce((sum, r) => sum + r.restockingCost, 0);
    const totalRestockingValue = restockingCosts.reduce((sum, r) => sum + r.restockingValue, 0);

    res.json({
      shopId,
      severity,
      threshold,
      summary: {
        totalLowStockItems: lowStockItems.length,
        critical: critical.length,
        high: high.length,
        medium: medium.length,
        totalRestockingCost,
        totalRestockingValue,
        potentialRevenue: totalRestockingValue - totalRestockingCost
      },
      items: restockingCosts.filter(r => r.deficit > 0),
      allLowStock: lowStockItems.map(s => ({
        productId: s.productId._id,
        name: s.productId.name,
        sku: s.productId.sku,
        category: s.productId.category,
        brand: s.productId.brand,
        currentStock: s.quantity,
        minStockLevel: s.productId.minStockLevel || 10,
        price: s.productId.price,
        costPrice: s.productId.costPrice,
        severity: s.quantity <= 5 ? 'critical' : s.quantity <= 10 ? 'high' : 'medium'
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reports/stock/valuation/:shopId
// @desc    Get stock valuation report
// @access  Private
router.get('/valuation/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view stock reports for this shop' });
    }

    const stockData = await Stock.find({ shopId })
      .populate('productId', 'name sku category brand costPrice price');

    // Calculate valuations
    let totalStockValue = 0;
    let totalPotentialRevenue = 0;
    let totalPotentialProfit = 0;

    const valuations = stockData.map(stock => {
      const itemValue = stock.quantity * (stock.productId.costPrice || 0);
      const itemRevenue = stock.quantity * (stock.productId.price || 0);
      const itemProfit = itemRevenue - itemValue;

      totalStockValue += itemValue;
      totalPotentialRevenue += itemRevenue;
      totalPotentialProfit += itemProfit;

      return {
        productId: stock.productId._id,
        name: stock.productId.name,
        sku: stock.productId.sku,
        category: stock.productId.category,
        quantity: stock.quantity,
        unitCost: stock.productId.costPrice || 0,
        unitPrice: stock.productId.price || 0,
        itemValue,
        itemRevenue,
        itemProfit,
        profitMargin: itemRevenue > 0 ? ((itemProfit / itemRevenue) * 100).toFixed(1) : 0
      };
    });

    // Sort by value
    valuations.sort((a, b) => b.itemValue - a.itemValue);

    // Calculate by category
    const valuationByCategory = {};
    valuations.forEach(v => {
      if (!valuationByCategory[v.category]) {
        valuationByCategory[v.category] = {
          category: v.category,
          totalValue: 0,
          totalRevenue: 0,
          totalProfit: 0,
          itemCount: 0
        };
      }
      valuationByCategory[v.category].totalValue += v.itemValue;
      valuationByCategory[v.category].totalRevenue += v.itemRevenue;
      valuationByCategory[v.category].totalProfit += v.itemProfit;
      valuationByCategory[v.category].itemCount += 1;
    });

    res.json({
      shopId,
      summary: {
        totalItems: stockData.length,
        totalQuantity: stockData.reduce((sum, s) => sum + s.quantity, 0),
        totalStockValue,
        totalPotentialRevenue,
        totalPotentialProfit,
        overallProfitMargin: totalPotentialRevenue > 0
          ? ((totalPotentialProfit / totalPotentialRevenue) * 100).toFixed(1)
          : 0
      },
      valuations: valuations.map(v => ({
        ...v,
        valueShare: totalStockValue > 0 ? ((v.itemValue / totalStockValue) * 100).toFixed(1) : 0,
        revenueShare: totalPotentialRevenue > 0 ? ((v.itemRevenue / totalPotentialRevenue) * 100).toFixed(1) : 0
      })),
      valuationByCategory: Object.values(valuationByCategory).map(c => ({
        ...c,
        profitMargin: c.totalRevenue > 0 ? ((c.totalProfit / c.totalRevenue) * 100).toFixed(1) : 0
      })).sort((a, b) => b.totalValue - a.totalValue)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
