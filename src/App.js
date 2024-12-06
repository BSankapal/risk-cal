// src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import QuestionnairePage from './components/Questionnaire';
import ScorePage from './components/ScorePage';
import { auth } from './firebase/firebase.js'; // Import Firebase auth

function App() {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true); // To track loading state

  useEffect(() => {
    // Check if a user is logged in
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setCurrentUserId(user.uid); // Set currentUserId if user is logged in
      } else {
        setCurrentUserId(null); // Set it to null if no user is logged in
      }
      setLoading(false); // Set loading to false once user info is loaded
    });

    // Cleanup the subscription when the component unmounts
    return () => unsubscribe();
  }, []);

  // const handleAdminSubmit = () => {
  //   // Your submission logic here
  //   console.log("Form submitted");
  // };

  if (loading) {
    // Show a loading screen or a fallback component while the auth state is being checked
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/questionnaire" element={<QuestionnairePage userId={currentUserId}/>} />
        <Route path="/score" element={<ScorePage />} />
      </Routes>
    </Router>
  );
}

export default App;
