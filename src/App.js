// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './components/AuthPage';
import AdminPanel from './components/AdminPanel';
import QuestionnairePage from './components/Questionnaire';
import ScorePage from './components/ScorePage';

function App() {
  const handleAdminSubmit = () => {
    // Your submission logic here
    console.log("Form submitted");
  }; 

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPanel onSubmit={handleAdminSubmit} />} />
        <Route path="/questionnaire" element={<QuestionnairePage />} />
        <Route path="/score" element={<ScorePage />} />
      </Routes>
    </Router>
  );
}

export default App;
