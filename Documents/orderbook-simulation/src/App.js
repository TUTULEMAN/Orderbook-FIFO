import React from 'react';
import './App.css';
import Orderbook from './Orderbook';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>FIFO Orderbook Simulation</h1>
        <Orderbook /> {/* This ensures the component is used */}
      </header>
    </div>
  );
}

export default App;
