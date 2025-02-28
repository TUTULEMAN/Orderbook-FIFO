import React, { useState, useEffect, useRef, useCallback } from 'react';

const OrderBook = () => {
  // Initial sample data
  const initialBuyOrders = [
    { id: 1, price: 49.95, quantity: 10.5, timestamp: Date.now() - 5000 },
    { id: 2, price: 49.90, quantity: 15.2, timestamp: Date.now() - 4000 },
    { id: 3, price: 49.85, quantity: 8.7, timestamp: Date.now() - 3000 },
    { id: 4, price: 49.80, quantity: 20.3, timestamp: Date.now() - 2000 },
    { id: 5, price: 49.75, quantity: 12.1, timestamp: Date.now() - 1000 }
  ];

  const initialSellOrders = [
    { id: 6, price: 50.05, quantity: 7.8, timestamp: Date.now() - 5000 },
    { id: 7, price: 50.10, quantity: 13.4, timestamp: Date.now() - 4000 },
    { id: 8, price: 50.15, quantity: 9.2, timestamp: Date.now() - 3000 },
    { id: 9, price: 50.20, quantity: 18.6, timestamp: Date.now() - 2000 },
    { id: 10, price: 50.25, quantity: 11.3, timestamp: Date.now() - 1000 }
  ];

  // State declarations
  const [buyOrders, setBuyOrders] = useState(initialBuyOrders);
  const [sellOrders, setSellOrders] = useState(initialSellOrders);
  const [lastTradePrice, setLastTradePrice] = useState(50.00);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1000); // in milliseconds
  const [spreadHistory, setSpreadHistory] = useState([]);
  const [marketTrend, setMarketTrend] = useState('neutral'); // 'up', 'down', 'neutral'
  const [volatility, setVolatility] = useState(0.1);
  const [recentTrades, setRecentTrades] = useState([]);
  const [totalVolume, setTotalVolume] = useState(0);
  const [tradeCount, setTradeCount] = useState(0); // using state for trade count

  const intervalRef = useRef(null);
  const cycleCountRef = useRef(0);
  const orderIdCounterRef = useRef(100);

  // Group orders by price level (maintaining FIFO ordering)
  const buyOrdersByPrice = buyOrders.reduce((acc, order) => {
    if (!acc[order.price]) acc[order.price] = [];
    acc[order.price].push(order);
    return acc;
  }, {});

  const sellOrdersByPrice = sellOrders.reduce((acc, order) => {
    if (!acc[order.price]) acc[order.price] = [];
    acc[order.price].push(order);
    return acc;
  }, {});

  // Sorted price levels for display
  const buyPriceLevels = Object.keys(buyOrdersByPrice)
    .map(parseFloat)
    .sort((a, b) => b - a);

  const sellPriceLevels = Object.keys(sellOrdersByPrice)
    .map(parseFloat)
    .sort((a, b) => a - b);

  // Calculate aggregated quantities for each price level
  const buyQuantitiesByPrice = buyPriceLevels.reduce((acc, price) => {
    acc[price] = buyOrdersByPrice[price].reduce((sum, order) => sum + order.quantity, 0);
    return acc;
  }, {});

  const sellQuantitiesByPrice = sellPriceLevels.reduce((acc, price) => {
    acc[price] = sellOrdersByPrice[price].reduce((sum, order) => sum + order.quantity, 0);
    return acc;
  }, {});

  const totalBuyVolume = Object.values(buyQuantitiesByPrice).reduce((sum, qty) => sum + qty, 0);
  const totalSellVolume = Object.values(sellQuantitiesByPrice).reduce((sum, qty) => sum + qty, 0);
  const maxQuantity = Math.max(
    ...Object.values(buyQuantitiesByPrice),
    ...Object.values(sellQuantitiesByPrice),
    1
  );

  const spread = sellPriceLevels.length > 0 && buyPriceLevels.length > 0 
    ? sellPriceLevels[0] - buyPriceLevels[0] 
    : 0;

  // Spread prediction using linear regression on spreadHistory
  const predictSpreadTrend = () => {
    if (spreadHistory.length < 5) return 0;
    const n = spreadHistory.length;
    const lastFive = spreadHistory.slice(-5);
    const xValues = Array.from({ length: lastFive.length }, (_, i) => i);
    const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
    const yMean = lastFive.reduce((sum, y) => sum + y, 0) / n;
    const numerator = xValues.reduce((sum, x, i) => sum + (x - xMean) * (lastFive[i] - yMean), 0);
    const denominator = xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0);
    const slope = denominator !== 0 ? numerator / denominator : 0;
    return slope;
  };

  const predictNextPrice = () => {
    const spreadTrend = predictSpreadTrend();
    const marketBias = marketTrend === 'up' ? 0.02 : marketTrend === 'down' ? -0.02 : 0;
    const randomFactor = (Math.random() - 0.5) * volatility;
    return {
      spreadTrend,
      priceMove: spreadTrend + marketBias + randomFactor
    };
  };

  const generateOrder = () => {
    const { spreadTrend, priceMove } = predictNextPrice();
    let orderType;
    if (marketTrend === 'up') {
      orderType = Math.random() < 0.65 ? 'buy' : 'sell';
    } else if (marketTrend === 'down') {
      orderType = Math.random() < 0.35 ? 'buy' : 'sell';
    } else {
      orderType = Math.random() < 0.5 ? 'buy' : 'sell';
    }
    const baseQuantity = 5 + Math.random() * 20;
    const trendMultiplier = (orderType === 'buy' && spreadTrend < 0) ||
                            (orderType === 'sell' && spreadTrend > 0) ? 1.5 : 1;
    const quantity = baseQuantity * trendMultiplier;
    let price;
    const aggressiveProbability = 0.2;
    if (orderType === 'buy') {
      const highestBuy = buyPriceLevels.length > 0 ? buyPriceLevels[0] : lastTradePrice - 0.1;
      const adjustment = spreadTrend < 0 ? Math.abs(spreadTrend) * 2 : 0;
      price = highestBuy + (priceMove * 0.5) + adjustment;
      if (sellPriceLevels.length > 0 && Math.random() < aggressiveProbability) {
        price = sellPriceLevels[0] + (Math.random() * 0.01);
      }
    } else {
      const lowestSell = sellPriceLevels.length > 0 ? sellPriceLevels[0] : lastTradePrice + 0.1;
      const adjustment = spreadTrend > 0 ? Math.abs(spreadTrend) * 2 : 0;
      price = lowestSell + (priceMove * 0.5) - adjustment;
      if (buyPriceLevels.length > 0 && Math.random() < aggressiveProbability) {
        price = buyPriceLevels[0] - (Math.random() * 0.01);
      }
    }
    price = Math.max(lastTradePrice * 0.9, Math.min(lastTradePrice * 1.1, price));
    price = parseFloat(price.toFixed(2));
    return {
      id: orderIdCounterRef.current++,
      price,
      quantity: parseFloat(quantity.toFixed(1)),
      type: orderType,
      timestamp: Date.now()
    };
  };

  const addGeneratedOrder = () => {
    const newOrder = generateOrder();
    if (newOrder.type === 'buy') {
      setBuyOrders(prev => [...prev, newOrder]);
    } else {
      setSellOrders(prev => [...prev, newOrder]);
    }
  };

  const matchOrders = () => {
    if (buyPriceLevels.length === 0 || sellPriceLevels.length === 0) return false;
    const highestBuyPrice = buyPriceLevels[0];
    const lowestSellPrice = sellPriceLevels[0];
    if (highestBuyPrice >= lowestSellPrice) {
      const highestBuyOrders = [...buyOrdersByPrice[highestBuyPrice]].sort((a, b) => a.timestamp - b.timestamp);
      const lowestSellOrders = [...sellOrdersByPrice[lowestSellPrice]].sort((a, b) => a.timestamp - b.timestamp);
      const oldestBuyOrder = highestBuyOrders[0];
      const oldestSellOrder = lowestSellOrders[0];
      const tradePrice = (highestBuyPrice + lowestSellPrice) / 2;
      const tradeQuantity = Math.min(oldestBuyOrder.quantity, oldestSellOrder.quantity);
      const newTrade = {
        id: Date.now(),
        price: parseFloat(tradePrice.toFixed(2)),
        quantity: parseFloat(tradeQuantity.toFixed(1)),
        time: new Date().toLocaleTimeString()
      };
      // Log the trade (all trades are now shown)
      setRecentTrades(prev => [newTrade, ...prev]);
      setLastTradePrice(newTrade.price);
      setTotalVolume(prev => prev + tradeQuantity);
      setTradeCount(prev => prev + 1);
      let updatedBuyOrders = [...buyOrders];
      let updatedSellOrders = [...sellOrders];
      if (oldestBuyOrder.quantity > oldestSellOrder.quantity) {
        updatedBuyOrders = updatedBuyOrders.map(order =>
          order.id === oldestBuyOrder.id
            ? { ...order, quantity: parseFloat((order.quantity - tradeQuantity).toFixed(1)) }
            : order
        );
        updatedSellOrders = updatedSellOrders.filter(order => order.id !== oldestSellOrder.id);
      } else if (oldestSellOrder.quantity > oldestBuyOrder.quantity) {
        updatedSellOrders = updatedSellOrders.map(order =>
          order.id === oldestSellOrder.id
            ? { ...order, quantity: parseFloat((order.quantity - tradeQuantity).toFixed(1)) }
            : order
        );
        updatedBuyOrders = updatedBuyOrders.filter(order => order.id !== oldestBuyOrder.id);
      } else {
        updatedBuyOrders = updatedBuyOrders.filter(order => order.id !== oldestBuyOrder.id);
        updatedSellOrders = updatedSellOrders.filter(order => order.id !== oldestSellOrder.id);
      }
      setBuyOrders(updatedBuyOrders);
      setSellOrders(updatedSellOrders);
      return true;
    }
    return false;
  };

  const matchAllOrders = () => {
    let matched = true;
    let iterations = 0;
    const maxIterations = 100;
    while (matched && iterations < maxIterations) {
      matched = matchOrders();
      iterations++;
    }
  };

  const updateMarketTrend = () => {
    if (Math.random() < 0.05) {
      const trends = ['up', 'down', 'neutral'];
      const newTrend = trends[Math.floor(Math.random() * trends.length)];
      setMarketTrend(newTrend);
      setVolatility(0.05 + Math.random() * 0.15);
    }
  };

  // Wrap simulationCycle in useCallback to stabilize dependencies
  const simulationCycle = useCallback(() => {
    cycleCountRef.current += 1;
    if (spread > 0) {
      setSpreadHistory(prev => [...prev.slice(-19), spread]);
    }
    updateMarketTrend();
    const ordersToGenerate = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < ordersToGenerate; i++) {
      addGeneratedOrder();
    }
    matchAllOrders();
    if (cycleCountRef.current % 5 === 0) {
      cancelStaleOrders();
    }
    if (buyOrders.length > 100) {
      setBuyOrders(prev => {
        const sortedOrders = [...prev].sort((a, b) => {
          if (b.price !== a.price) return b.price - a.price;
          return b.timestamp - a.timestamp;
        });
        return sortedOrders.slice(0, 100);
      });
    }
    if (sellOrders.length > 100) {
      setSellOrders(prev => {
        const sortedOrders = [...prev].sort((a, b) => {
          if (a.price !== b.price) return a.price - b.price;
          return b.timestamp - a.timestamp;
        });
        return sortedOrders.slice(0, 100);
      });
    }
  }, [spread, buyOrders, sellOrders]);

  const cancelStaleOrders = () => {
    if (buyPriceLevels.length > 0 && sellPriceLevels.length > 0) {
      const midPrice = (buyPriceLevels[0] + sellPriceLevels[0]) / 2;
      setBuyOrders(prev => prev.filter(order => order.price > midPrice * 0.95));
      setSellOrders(prev => prev.filter(order => order.price < midPrice * 1.05));
    }
  };

  useEffect(() => {
    if (isRunning) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(simulationCycle, speed);
    }
    return () => clearInterval(intervalRef.current);
  }, [speed, isRunning, simulationCycle]);

  const toggleSimulation = () => {
    if (isRunning) {
      clearInterval(intervalRef.current);
      setIsRunning(false);
    } else {
      intervalRef.current = setInterval(simulationCycle, speed);
      setIsRunning(true);
    }
  };

  const changeSpeed = (newSpeed) => {
    setSpeed(newSpeed);
    if (isRunning) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(simulationCycle, newSpeed);
    }
  };

  // Render the spread history as a line graph with increased size and white labels
  const renderSpreadHistoryLineGraph = () => {
    const data = spreadHistory;
    if (data.length < 2) {
      return <div className="text-gray-400">Not enough data for spread history</div>;
    }
    const width = 500;
    const height = 150;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const points = data
      .map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");
    return (
      <svg width={width} height={height} style={{ border: '1px solid #444' }}>
        <polyline fill="none" stroke="#00f" strokeWidth="2" points={points} />
        <text x="5" y="15" fill="#fff" fontSize="12">Min: {min.toFixed(2)}</text>
        <text x="5" y={height - 5} fill="#fff" fontSize="12">Max: {max.toFixed(2)}</text>
        <text x={width / 2 - 30} y="15" fill="#fff" fontSize="12">Spread (USD)</text>
      </svg>
    );
  };

  const maxLevels = Math.max(buyPriceLevels.length, sellPriceLevels.length);

  return (
    // Outer container with black background and white text
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 bg-black text-white">
      {/* Simulation Controls */}
      <div className="flex justify-between items-center w-full mb-4">
        <div className="flex items-center gap-4">
          <div className="text-lg">
            <span className="font-semibold">Last Price: </span>
            <span>${lastTradePrice.toFixed(2)}</span>
          </div>
          <div className="text-sm">
            <span>Trades: </span>
            <span>{tradeCount.toFixed(2)}</span>
          </div>
          <div className="text-sm">
            <span>Volume: </span>
            <span>{totalVolume.toFixed(1)}</span>
          </div>
          <div className="text-sm">
            <span>Trend: </span>
            <span className={
              marketTrend === 'up' ? "text-green-500" : 
              marketTrend === 'down' ? "text-red-500" : "text-gray-400"
            }>
              {marketTrend === 'up' ? "↑" : marketTrend === 'down' ? "↓" : "→"}
            </span>
          </div>
        </div>
        <div className="space-x-2">
          <button 
            onClick={toggleSimulation} 
            className={`${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white px-4 py-2 rounded`}
          >
            {isRunning ? 'Stop' : 'Start'}
          </button>
          <select 
            value={speed} 
            onChange={(e) => changeSpeed(Number(e.target.value))}
            className="border rounded p-2 bg-black text-white"
          >
            <option value="2000">Slow</option>
            <option value="1000">Normal</option>
            <option value="500">Fast</option>
            <option value="200">Very Fast</option>
          </select>
        </div>
      </div>

      {/* Spread History Line Graph */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Spread History</h2>
        {renderSpreadHistoryLineGraph()}
      </div>

      {/* Combined Buy and Sell Orders Table */}
      <div className="w-full bg-gray-800 p-4 rounded shadow mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th colSpan="3" className="text-left py-2 text-green-500">Buy Orders</th>
              <th></th>
              <th colSpan="3" className="text-left py-2 text-red-500">Sell Orders</th>
            </tr>
            <tr className="border-b">
              <th className="py-2">Price</th>
              <th className="py-2">Quantity</th>
              <th className="py-2">Orders</th>
              <th></th>
              <th className="py-2">Price</th>
              <th className="py-2">Quantity</th>
              <th className="py-2">Orders</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxLevels }).map((_, i) => {
              const buyPrice = buyPriceLevels[i];
              const sellPrice = sellPriceLevels[i];
              return (
                <tr key={i} className="border-b">
                  <td className="py-2 text-green-500">
                    {buyPrice !== undefined ? `$${buyPrice.toFixed(2)}` : ''}
                  </td>
                  <td className="py-2">
                    {buyPrice !== undefined ? buyQuantitiesByPrice[buyPrice].toFixed(1) : ''}
                  </td>
                  <td className="py-2">
                    {buyPrice !== undefined ? buyOrdersByPrice[buyPrice].length : ''}
                  </td>
                  <td></td>
                  <td className="py-2 text-red-500">
                    {sellPrice !== undefined ? `$${sellPrice.toFixed(2)}` : ''}
                  </td>
                  <td className="py-2">
                    {sellPrice !== undefined ? sellQuantitiesByPrice[sellPrice].toFixed(1) : ''}
                  </td>
                  <td className="py-2">
                    {sellPrice !== undefined ? sellOrdersByPrice[sellPrice].length : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recent Trades Section (all trades displayed without a scroll box) */}
      <div className="w-full bg-gray-800 p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Recent Trades</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Time</th>
              <th className="py-2">Price</th>
              <th className="py-2">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {recentTrades.map(trade => (
              <tr key={trade.id} className="border-b hover:bg-gray-700">
                <td className="py-2 text-gray-300">{trade.time}</td>
                <td className="py-2">${trade.price.toFixed(2)}</td>
                <td className="py-2">{trade.quantity.toFixed(1)}</td>
              </tr>
            ))}
            {recentTrades.length === 0 && (
              <tr>
                <td colSpan="3" className="py-4 text-center text-gray-400">No trades yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default OrderBook;
