import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AuthPage.css';
import { auth, db } from '../firebase/firebase.js'; // Firebase config
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore'; // Firestore functions

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    organization: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password, name, organization } = formData;

    try {
      if (!isLogin) {
        // Signup logic
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const userId = userCredential.user.uid;

        // Save additional details to Firestore
        await setDoc(doc(db, 'users', userId), { name, organization, email });
        console.log('Signup successful and user data saved in Firestore');
        navigate('/admin');
      } else {
        // Login logic
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const userId = userCredential.user.uid;

        // Fetch additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('User data retrieved:', userData);
          // You can use userData for further processing (e.g., storing in state, displaying)
          navigate('/admin');
        } else {
          console.error('No user data found in Firestore!');
        }
      }
    } catch (err) {
      setError(err.message);
      console.error('Auth error:', err);
    }
  };

  return (
    <div className="auth-page">
      <h2>{isLogin ? 'Login' : 'Signup'}</h2>
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <>
            <input
              type="text"
              name="name"
              placeholder="Name"
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="organization"
              placeholder="Organization"
              onChange={handleInputChange}
            />
          </>
        )}
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleInputChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleInputChange}
        />
        <button type="submit">{isLogin ? 'Login' : 'Signup'}</button>
        {error && <p>{error}</p>}
        <button className="toggle-button" onClick={toggleAuthMode}>
          {isLogin ? 'Go to Signup' : 'Go to Login'}
        </button>
      </form>
    </div>
  );
}

export default AuthPage;
