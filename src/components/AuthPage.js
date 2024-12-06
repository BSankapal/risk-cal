import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AuthPage.css";
import { auth, db } from "../firebase/firebase.js"; // Firebase config
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { collection, doc, setDoc, getDoc, addDoc } from "firebase/firestore"; // Firestore functions

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    organization: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password, name, organization } = formData;

    // Input validation for signup
    if (!isLogin) {
      if (!name.trim()) {
        setError("Name is required.");
        return;
      }
      if (!organization.trim()) {
        setError("Organization is required.");
        return;
      }
    }

    try {
      if (!isLogin) {
        // Signup logic
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );
          const userId = userCredential.user.uid;

          // Save additional details to Firestore
          await setDoc(doc(db, "users", userId), {
            name,
            organization,
            email,
            info: {
              sector: null,
              dataSensitivity: null,
              digitalFootprint: null,
              employees: null,
              revenue: null,
              itInvestment: null,
              cyberMaturity: null,
              thirdPartyDependencies: null,
            },
            logs: [],
            disabledSections: [], // List of pairs of layerNumber and topicNumber
            responses: [],
          });

          const responsesRef = collection(db, "users", userId, "responses");
          await addDoc(responsesRef, {
            layerIndex: null,
            topicIndex: null,
            subtopicIndex: null,
            sectionIndex: null,
            questionIndex: null,
            answer: null,
          });

          console.log(
            "User and responses subcollection initialized successfully."
          );
          navigate("/admin", { state: { userId } });
          
        } catch (error) {
          console.error("Error initializing user:", error);
        }
        

      } else {
        // Login logic
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const userId = userCredential.user.uid;

        // Fetch additional user data from Firestore
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("User data retrieved:", userData);
          navigate("/admin", { state: { userId } });
        } else {
          console.error("No user data found in Firestore!");
        }
      }
    } catch (err) {
      // Custom error messages based on Firebase error codes
      let customError = "An unexpected error occurred.";
      if (err.code === "auth/invalid-credential") {
        customError = "Invalid email or password.";
      } else if (err.code === "auth/weak-password") {
        customError = "Password should be at least 6 characters long.";
      } else if (err.code === "auth/email-already-in-use") {
        customError = "This email is already registered. Please log in.";
      } else if (err.code === "auth/user-not-found") {
        customError = "No account found with this email.";
      } else if (err.code === "auth/wrong-password") {
        customError = "Incorrect password. Please try again.";
      }

      setError(customError);
      console.error("Auth error:", err);
    }
  };

  return (
    <div className="auth-page">
      <h2>{isLogin ? "Login" : "Signup"}</h2>
      {error && (
        <div className="error-box">
          <p>{error}</p>
        </div>
      )}
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
        <button type="submit">{isLogin ? "Login" : "Signup"}</button>
        <button
          type="button"
          className="toggle-button"
          onClick={toggleAuthMode}
        >
          {isLogin ? "Go to Signup" : "Go to Login"}
        </button>
      </form>
    </div>
  );
}

export default AuthPage;
