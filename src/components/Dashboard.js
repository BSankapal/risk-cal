import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Dashboard.css";
import { auth, db } from "../firebase/firebase.js";
import { signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";

function Dashboard() {
  const location = useLocation();
  const userId = location.state?.userId; // Retrieve userId
  const fullData = location.state?.fullData;
  const [selectedTab, setSelectedTab] = useState("My Profile");
  const [layersData, setLayersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disabledSections, setDisabledSections] = useState([]);
  const [analysisData, setAnalysisData] = useState([]);
  // const [data, setData] = useState(initialData);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    organization: "",
  });
  const [formData, setFormData] = useState({
    sector: "",
    dataSensitivity: "",
    digitalFootprint: "",
    employees: "",
    revenue: "",
    itInvestment: "",
    cyberMaturity: "",
    thirdPartyDependencies: "",
  });
  const [assessmentLogs, setAssessmentLogs] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth); // Firebase logout
      navigate("/"); // Redirect to AuthPage (Login/Signup)
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Define fetchProfileData outside the useEffect
  const fetchProfileData = async () => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log("Fetched User Data:", userData);

        // Safely assign profile data
        setProfileData({
          name: userData.name || "",
          email: userData.email || "",
          organization: userData.organization || "",
        });

        // Safely assign formData
        if (userData.info) {
          setFormData({
            sector: userData.info.sector || "",
            dataSensitivity: userData.info.dataSensitivity || "",
            digitalFootprint: userData.info.digitalFootprint || "",
            employees: userData.info.employees || "",
            revenue: userData.info.revenue || "",
            itInvestment: userData.info.itInvestment || "",
            cyberMaturity: userData.info.cyberMaturity || "",
            thirdPartyDependencies: userData.info.thirdPartyDependencies || "",
          });
        } else {
          console.warn("Info data is missing or null.");
        }

        // Safely assign assessment logs
        if (Array.isArray(userData.logs)) {
          setAssessmentLogs(userData.logs);
        } else {
          console.warn("Logs are missing or not in array format.");
          setAssessmentLogs([]);
        }
      } else {
        console.error("User data not found!");
      }
    } catch (err) {
      console.error("Error fetching profile data:", err);
    }
  };

  useEffect(() => {
    console.log("Updated Profile Data:", profileData);
  }, [profileData]); // Logs profileData when it changes

  useEffect(() => {
    console.log("Updated Form Data:", formData);
  }, [formData]); // Logs formData when it changes

  useEffect(() => {
    console.log("Updated Assessment Logs:", assessmentLogs);
  }, [assessmentLogs]);

  useEffect(() => {
    if (userId) {
      fetchProfileData();
    }
  }, [userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    // Check if all fields are filled
    const isFormComplete = Object.values(formData).every(
      (value) => value.trim() !== ""
    );

    if (!isFormComplete) {
      setError("All fields are mandatory. Please fill out all the fields.");
      return;
    }

    console.log("Dashboard Data:", formData);
    setError(""); // Clear any previous errors
    // onSubmit();
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { info: formData });
      console.log("User info updated in Firestore");
      alert("Details submitted successfully!");
    } catch (err) {
      console.error("Error updating user info:", err);
    }
    //navigate('/questionnaire'); // Navigate to the questionnaire page
  };

  const fetchDisabledSections = async () => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const fetchedDisabledSections = userData.disabledSections || [];
        setDisabledSections(fetchedDisabledSections);
        return fetchedDisabledSections;
      } else {
        console.error("User document does not exist.");
        return [];
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      return [];
    }
  };

  const fetchLayersData = async (disabledSections) => {
    try {
      const layersCollection = collection(db, "layers");
      const layersSnapshot = await getDocs(layersCollection);

      if (!layersSnapshot.empty) {
        const layers = await Promise.all(
          layersSnapshot.docs.map(async (layerDoc) => {
            const layerData = layerDoc.data();
            const topicsSnapshot = await getDocs(
              collection(layerDoc.ref, "topics")
            );
            const topics = topicsSnapshot.docs.map((topicDoc) => {
              const topicData = topicDoc.data();
              // Default selected to true, will update later based on disabledSections
              return { name: topicData.name, selected: true };
            });

            return { name: layerData.name, topics };
          })
        );

        // Merge disabled sections into layers
        const updatedLayers = mergeDisabledSections(layers, disabledSections);
        setLayersData(updatedLayers); // Set the updated layers
      } else {
        console.log("No layers found in Firestore.");
      }
    } catch (error) {
      console.error("Error fetching layers data:", error);
    } finally {
      setLoading(false); // Stop loading when fetch is complete
    }
  };

  const mergeDisabledSections = (layers, disabledSections) => {
    return layers.map((layer, layerIndex) => {
      const updatedTopics = layer.topics.map((topic, topicIndex) => {
        const isDisabled = disabledSections.some(
          (section) =>
            section.layerIndex === layerIndex &&
            section.topicIndex === topicIndex
        );
        return { ...topic, selected: !isDisabled };
      });
      return { ...layer, topics: updatedTopics };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const disabledSections = await fetchDisabledSections(); // Fetch disabled sections first
      await fetchLayersData(disabledSections); // Then fetch layers and merge
    };

    fetchData();
  }, []);

  const handleTopicSelection = (layerIndex, topicIndex) => {
    const updatedLayers = [...layersData];
    updatedLayers[layerIndex].topics[topicIndex].selected =
      !updatedLayers[layerIndex].topics[topicIndex].selected;

    // Update the disabledSections array
    const updatedDisabledSections = [];
    updatedLayers.forEach((layer, layerIdx) => {
      layer.topics.forEach((topic, topicIdx) => {
        if (!topic.selected) {
          updatedDisabledSections.push({
            layerIndex: layerIdx,
            topicIndex: topicIdx,
          });
        }
      });
    });

    setLayersData(updatedLayers);
    setDisabledSections(updatedDisabledSections);
  };

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, "users", userId), {
        disabledSections,
      });
      console.log("Disabled sections saved:", disabledSections);
      alert("Your custom evaluation settings have been saved.");
    } catch (error) {
      console.error("Error saving disabled sections:", error);
    }
  };

  const handleStartAssessment = async () => {
    try {
      console.log("Start Assessment clicked");

      // Clear the `responses` subcollection
      await clearSubcollection(userId, "responses");

      // Navigate to the questionnaire page
      navigate("/questionnaire", { state: { userId } });
    } catch (error) {
      console.error("Error during start assessment:", error);
    }
  };

  const clearSubcollection = async (userId, subcollectionName) => {
    try {
      const userRef = doc(db, "users", userId);
      const responsesRef = collection(userRef, subcollectionName);

      // Check if the subcollection has any documents
      const querySnapshot = await getDocs(responsesRef);

      if (querySnapshot.empty) {
        console.log("No responses to clear."); // Subcollection doesn't exist or is empty
        return;
      }

      // Loop through and delete each document in the subcollection
      const deletePromises = querySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);

      console.log("Responses subcollection cleared successfully.");
    } catch (error) {
      console.error("Error clearing responses subcollection:", error);
    }
  };

  const generateDetailedAnalysis = async () => {
    try {
      console.log("Starting generateDetailedAnalysis...");
      console.log("User ID:", userId);
      console.log("Full Data:", fullData);

      const responsesRef = collection(doc(db, "users", userId), "responses");
      const responsesSnapshot = await getDocs(responsesRef);
      const responses = responsesSnapshot.docs.map((doc) => doc.data());

      console.log("Responses fetched:", responses);

      if (!responses.length) {
        console.warn("No responses found.");
        return;
      }

      const detailedAnalysis = responses.map((response) => {
        const question =
          fullData[response.layerIndex].topics[response.topicIndex].subtopics[
            response.subtopicIndex
          ].sections[response.sectionIndex].questions[response.questionIndex];

        return {
          layerName: fullData[response.layerIndex].name,
          topicName:
            fullData[response.layerIndex].topics[response.topicIndex].name,
          subtopicName:
            fullData[response.layerIndex].topics[response.topicIndex].subtopics[
              response.subtopicIndex
            ].name,
          questionText: question.text,
          goodPoints: question.goodPoints,
          scopeForImprovement: question.scopeForImprovement,
          userAnswer: response.answer,
        };
      });

      console.log("Detailed Analysis Data:", detailedAnalysis);
      setAnalysisData(detailedAnalysis);
    } catch (error) {
      console.error("Error generating detailed analysis:", error);
    }
  };

  // Fetch detailed analysis data on initial load
  useEffect(() => {
    console.log("User ID:", userId);
      console.log("Full Data:", fullData);
    if (userId && fullData && fullData.length > 0) {
      generateDetailedAnalysis();
    }
  }, [userId, fullData,generateDetailedAnalysis]);

  const renderContent = () => {
    switch (selectedTab) {
      case "My Profile":
        return (
          <div className="content">
            <h2>My Profile</h2>
            {/* Profile Information Section */}
            <div className="profile-info">
              <div className="info-item">
                <span className="info-label">Name:</span>
                <input
                  className="info-input"
                  type="text"
                  value={profileData.name}
                  readOnly
                />
              </div>
              <div className="info-item">
                <span className="info-label">Organization:</span>
                <input
                  className="info-input"
                  type="text"
                  value={profileData.organization}
                  readOnly
                />
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <input
                  className="info-input"
                  type="email"
                  value={profileData.email}
                  readOnly
                />
              </div>
            </div>

            {/* Questions Section */}
            <div className="questionnaire-section">
              <h3>Organizational Details</h3>
              {/* Error Message */}
              {error && <div className="error-box">{error}</div>}

              <div>
                <label>Sector of Industry</label>
                <select
                  name="sector"
                  value={formData.sector || ""}
                  onChange={handleInputChange}
                >
                  <option value="">Select Sector</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Technology">Information Technology</option>
                  <option value="Retail">Retail and E-commerce</option>
                  <option value="Government">
                    Government and Public Sector
                  </option>
                  <option value="Energy">Energy and Utilities</option>
                  <option value="Telecommunications">Telecommunications</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Education">Education</option>
                  <option value="Transportation">
                    Transportation and Logistics
                  </option>
                  <option value="Defense">Defense and Aerospace</option>
                  <option value="Media">Media and Entertainment</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Legal Services">Legal Services</option>
                  <option value="Non-Profit Organizations">
                    Non-Profit Organizations
                  </option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label>Nature of the Data Handled</label>
                <select
                  name="dataSensitivity"
                  value={formData.dataSensitivity || ""}
                  onChange={handleInputChange}
                >
                  <option value="">Select Sensitivity</option>
                  <option value="Highly Sensitive">Highly Sensitive</option>
                  <option value="Moderately Sensitive">
                    Moderately Sensitive
                  </option>
                  <option value="Low Sensitivity">Low Sensitivity</option>
                </select>
              </div>

              {/* Repeat this structure for other fields */}
              <div>
                <label>Digital Footprint</label>
                <select
                  name="digitalFootprint"
                  value={formData.digitalFootprint || ""}
                  onChange={handleInputChange}
                >
                  <option value="">Select Digital Footprint</option>
                  <option value="Extensive">Extensive</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Limited">Limited</option>
                </select>
              </div>

              <div>
                <label>Number of Employees</label>
                <select
                  name="employees"
                  value={formData.employees || ""}
                  onChange={handleInputChange}
                >
                  <option value="">Select Number of Employees</option>
                  <option value="Small">Small: &lt;50 employees</option>
                  <option value="Medium">Medium: 50–500 employees</option>
                  <option value="Large">Large: &gt;500 employees</option>
                </select>
              </div>

              <div>
                <label>Revenue</label>
                <select
                  name="revenue"
                  value={formData.revenue || ""}
                  onChange={handleInputChange}
                >
                  <option value="">Select Revenue</option>
                  <option value="Small-scale">&lt;10M Rs</option>
                  <option value="Medium-scale">10M–500M Rs</option>
                  <option value="Large-scale">&gt;500M Rs</option>
                </select>
              </div>

              <div>
                <label>IT Infrastructure Investment</label>
                <select
                  name="itInvestment"
                  value={formData.itInvestment || ""}
                  onChange={handleInputChange}
                >
                  <option value="">Select Investment</option>
                  <option value="Low">&lt;5,00,000 Rs/year</option>
                  <option value="Medium">5,00,000–50,00,000 Rs/year</option>
                  <option value="High">&gt;50,00,000 Rs/year</option>
                </select>
              </div>

              <div>
                <label>Cybersecurity Maturity Level</label>
                <select
                  name="cyberMaturity"
                  value={formData.cyberMaturity || ""}
                  onChange={handleInputChange}
                >
                  <option value="">Select Maturity Level</option>
                  <option value="Mature">Mature</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label>Third-party Dependencies</label>
                <select
                  name="thirdPartyDependencies"
                  value={formData.thirdPartyDependencies || ""}
                  onChange={handleInputChange}
                >
                  <option value="">Select Dependency Level</option>
                  <option value="High">High</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <button className="save-btn" onClick={handleSubmit}>
                Submit
              </button>
            </div>
          </div>
        );
      case "Customize Evaluation":
        return (
          <div className="content">
            <h2>Customize Evaluation</h2>
            <p>
              Note that unselect all those topics which your organization does
              not have:
            </p>
            {loading ? (
              <p>Loading layers...</p>
            ) : (
              <div className="layer-container">
                {layersData.map((layer, layerIndex) => (
                  <div key={layerIndex} className="layer">
                    <h3>{layer.name}</h3>
                    <ul>
                      {layer.topics.map((topic, topicIndex) => (
                        <li key={topicIndex} className="topic-item">
                          <label>
                            <input
                              type="checkbox"
                              checked={topic.selected}
                              onChange={() =>
                                handleTopicSelection(layerIndex, topicIndex)
                              }
                            />
                            {topic.name}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            <button className="save-btn" onClick={handleSave}>
              Save
            </button>
          </div>
        );
      case "Start Evaluation":
        return (
          <div className="content">
            <h2>Start Evaluation</h2>
            <p>Yet to be</p>
            <button
              className="start-assessment-btn"
              onClick={handleStartAssessment}
            >
              Start Assessment
            </button>
          </div>
        );
      case "Score":
        return (
          <div className="content">
            <h2>Score</h2>
            <div className="score-card-container">
              <div className="score-card">Good Points: 80</div>
              <div className="score-card">Risk Score: 20</div>
              <div className="score-card">Improvement: 70</div>
              <div className="score-card">
                Final Measure: Moderate
                <p>Risk is moderate. Implement additional measures.</p>
              </div>
            </div>
            <div className="score-details">
              <div className="improvement-areas">
                <h3>Top Areas of Improvement</h3>
                <ul>
                  <li>Data Encryption</li>
                  <li>Access Control</li>
                </ul>
              </div>
              <div className="security-graph">
                <h3>Security Progress</h3>
                <div className="graph">Graph Placeholder</div>
              </div>
            </div>
            <div className="topic-charts">
              {["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"].map(
                (topic, index) => (
                  <div className="chart-card" key={index}>
                    <h4>{topic}</h4>
                    <div className="doughnut-chart">Doughnut Chart</div>
                  </div>
                )
              )}
            </div>
          </div>
        );
      case "Detailed Analysis":
        return (
          <div className="content">
            <h2>Detailed Analysis</h2>
            {analysisData.length === 0 ? (
              <p>Loading analysis data or no data available...</p>
            ) : (
              analysisData.map((item, index) => (
                <div key={index} className="detailed-analysis-box">
                  <h3>
                    {item.layerName} - {item.topicName}
                  </h3>
                  <p>
                    <strong>Question:</strong> {item.questionText}
                  </p>
                  {item.userAnswer === "Yes" ? (
                    <p>
                      <strong>Good Points:</strong> {item.goodPoints}
                    </p>
                  ) : (
                    <p>
                      <strong>Scope for Improvement:</strong>{" "}
                      {item.scopeForImprovement}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        );
      case "Assessment Logs":
        return (
          <div className="content">
            <h2>Assessment Logs</h2>
            {assessmentLogs.length > 0 ? (
              <ul>
                {assessmentLogs.map((log, index) => (
                  <li key={index}>
                    Date: {log.date}, Score: {log.score}, Risk Level:{" "}
                    {log.riskLevel}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Take at least one assessment to display logs.</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>SecuriFi</h2>
        </div>
        <nav>
          <ul>
            <div className="sidebar-above">
              <li onClick={() => setSelectedTab("My Profile")}>My Profile</li>
              <li onClick={() => setSelectedTab("Customize Evaluation")}>
                Customize Evaluation
              </li>
              <li onClick={() => setSelectedTab("Start Evaluation")}>
                Start Evaluation
              </li>
            </div>
            <hr />
            <div className="sidebar-below">
              <li onClick={() => setSelectedTab("Score")}>Score</li>
              <li onClick={() => setSelectedTab("Detailed Analysis")}>
                Detailed Analysis
              </li>
              <li onClick={() => setSelectedTab("Assessment Logs")}>
                Assessment Logs
              </li>
            </div>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Navbar */}
        <header className="top-navbar">
          <div className="navbar-brand">Dashboard</div>
          <div className="navbar-links">
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {/* Content Area */}
        {renderContent()}
      </div>
    </div>
  );
}

export default Dashboard;
