import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AgentList from './components/AgentList';
import AgentDetail from './components/AgentDetail';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<AgentList />} />
          <Route path="/agent/:id" element={<AgentDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
