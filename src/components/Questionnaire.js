import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
// import "../styles/Questionnaire.css";
import { db } from "../firebase/firebase.js"; // Import Firestore instance
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  arrayUnion,
} from "firebase/firestore";

function QuestionnairePage({ userId }) {
  const [data, setData] = useState(null);
  const [currentLayerIndex, setLayerIndex] = useState(0);
  const [currentTopicIndex, setTopicIndex] = useState(0);
  const [currentSubtopicIndex, setSubtopicIndex] = useState(0);
  const [currentSectionIndex, setSectionIndex] = useState(0);
  const [currentQuestionIndex, setQuestionIndex] = useState(0);
  const [responses, setResponses] = useState([]);
  const [resp, setResp] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [animationDirection, setAnimationDirection] = useState("slide-in");
  const navigate = useNavigate();

  const sanitizeName = (name) => name.replace(/[^a-zA-Z0-9]/g, "_");

  const extractFirestoreData = (doc) => {
    const rawData = doc.data();

    // Extract Firestore fields and handle nested `integerValue` or `stringValue`
    const parsedData = Object.entries(rawData).reduce((acc, [key, value]) => {
      if (value.integerValue !== undefined) {
        acc[key] = parseInt(value.integerValue, 10); // Convert to number
      } else if (value.stringValue !== undefined) {
        acc[key] = value.stringValue;
      } else {
        acc[key] = value; // Add as-is if no special handling required
      }
      return acc;
    }, {});

    return parsedData;
  };

  const addDataToFirestore = useCallback(async (jsonData) => {
    try {
      const layers = jsonData.layers;

      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        const layerRef = doc(
          collection(db, "layers"),
          sanitizeName(layer.name)
        );
        await setDoc(layerRef, { name: layer.name, order: i });

        for (let j = 0; j < layer.topics.length; j++) {
          const topic = layer.topics[j];
          const topicRef = doc(
            collection(layerRef, "topics"),
            sanitizeName(topic.name)
          );
          await setDoc(topicRef, { name: topic.name, order: j });

          for (let k = 0; k < topic.subtopics.length; k++) {
            const subtopic = topic.subtopics[k];
            const subtopicRef = doc(
              collection(topicRef, "subtopics"),
              sanitizeName(subtopic.name)
            );
            await setDoc(subtopicRef, { name: subtopic.name, order: k });

            for (let l = 0; l < subtopic.sections.length; l++) {
              const section = subtopic.sections[l];
              const sectionRef = doc(
                collection(subtopicRef, "sections"),
                sanitizeName(section.name)
              );
              await setDoc(sectionRef, { name: section.name, order: l });

              for (let m = 0; m < section.questions.length; m++) {
                const question = section.questions[m];
                const questionRef = doc(
                  collection(sectionRef, "questions"),
                  sanitizeName(question.name)
                );
                await setDoc(questionRef, {
                  name: question.name,
                  info: question.info,
                  good_point: question.good_point,
                  scope_for_improvement: question.scope_for_improvement,
                  mandatory: question.mandatory,
                  tags: question.tags,
                  order: m,
                });
              }
            }
          }
        }
      }

      console.log("Data successfully added to Firestore!");
    } catch (error) {
      console.error("Error adding data to Firestore:", error);
    }
  }, []);

  const getFirestoreData = async (layersSnapshot) => {
    const layers = [];
    for (const layerDoc of layersSnapshot.docs) {
      const layerData = extractFirestoreData(layerDoc);
      const topicsSnapshot = await getDocs(collection(layerDoc.ref, "topics"));
      const topics = [];

      for (const topicDoc of topicsSnapshot.docs) {
        const topicData = topicDoc.data();
        const subtopicsSnapshot = await getDocs(
          collection(topicDoc.ref, "subtopics")
        );
        const subtopics = [];
        for (const subtopicDoc of subtopicsSnapshot.docs) {
          const subtopicData = subtopicDoc.data();
          const sectionsSnapshot = await getDocs(
            collection(subtopicDoc.ref, "sections")
          );
          const sections = [];
          for (const sectionDoc of sectionsSnapshot.docs) {
            const sectionData = sectionDoc.data();
            const questionsSnapshot = await getDocs(
              collection(sectionDoc.ref, "questions")
            );
            const questions = questionsSnapshot.docs
              .map((doc) => doc.data())
              .sort((a, b) => a.order - b.order);
            sections.push({ ...sectionData, questions });
          }

          sections.sort((a, b) => a.order - b.order); // Sort sections by order
          subtopics.push({ ...subtopicData, sections });
        }

        subtopics.sort((a, b) => a.order - b.order); // Sort subtopics by order
        topics.push({ ...topicData, subtopics });
      }

      topics.sort((a, b) => a.order - b.order); // Sort topics by order
      layers.push({ ...layerData, topics });
    }

    layers.sort((a, b) => a.order - b.order);
    console.log(layers);
    return { layers };
  };

  useEffect(() => {
    const fetchDataFromFirestore = async () => {
      try {
        const layersCollection = collection(db, "layers");
        const layersSnapshot = await getDocs(layersCollection);

        if (layersSnapshot.empty) {
          console.log("Firestore is empty. Adding data...");
          fetch("/questionnaireData.json")
            .then((resp) => resp.json())
            .then(async (jsonData) => {
              await addDataToFirestore(jsonData); // Add JSON to Firestore
              setData(jsonData); // Set state with the loaded data
            });
        } else {
          console.log("Fetching data from Firestore...");
          console.log("Fetched data1:", layersSnapshot);
          const firestoreData = await getFirestoreData(layersSnapshot);
          console.log("Fetched data2:", firestoreData);
          setData(firestoreData); // Set state with Firestore data
        }
      } catch (error) {
        console.error("Error fetching data from Firestore:", error);
      }
    };

    fetchDataFromFirestore();
  }, [addDataToFirestore]);

  if (!data) return <div>Loading...</div>;
  console.log("data", data);

  const layer = data.layers[currentLayerIndex];
  const topic = layer.topics[currentTopicIndex];
  const subtopic = topic.subtopics[currentSubtopicIndex];
  const section = subtopic.sections[currentSectionIndex];
  const question = section.questions[currentQuestionIndex];

  const handleResponseChange = (question, answer) => {
    // Ensure you are accessing the correct layer, topic, subtopic, section, and question
    const layer = data.layers[currentLayerIndex];
    const topic = layer.topics[currentTopicIndex];
    const subtopic = topic.subtopics[currentSubtopicIndex];
    const section = subtopic.sections[currentSectionIndex];
    const questionData = section.questions[currentQuestionIndex];

    setResponses((prevResponses) => [
      ...prevResponses,
      {
        layerIndex: layer.order, // Use the 'order' attribute from the layer
        topicIndex: topic.order, // Use the 'order' attribute from the topic
        subtopicIndex: subtopic.order, // Use the 'order' attribute from the subtopic
        sectionIndex: section.order, // Use the 'order' attribute from the section
        questionIndex: questionData.order, // Use the 'order' attribute from the question
        answer,
      },
    ]);
    setSelectedAnswer(answer); // Track the selected answer
  };

  const saveResponseToFirebase = async (response) => {
    console.log("Saving response:", response); // Log the response to inspect its data
    try {
      const userRef = doc(db, "users", userId);
      const responsesRef = collection(userRef, "responses");

      // Ensure the response data is valid before saving
      if (response.questionIndex === undefined) {
        console.error("Invalid questionIndex:", response); // Log error if undefined
        return;
      }

      // Save the response to Firestore
      await addDoc(responsesRef, {
        layerIndex: response.layerIndex,
        topicIndex: response.topicIndex,
        subtopicIndex: response.subtopicIndex,
        sectionIndex: response.sectionIndex,
        questionIndex: response.questionIndex,
        answer: response.answer,
      });

      console.log("Response saved successfully:", response);
    } catch (error) {
      console.error("Error saving response to Firebase:", error);
    }
  };

  const handleNext = async () => {
    if (selectedAnswer === null) {
      // If no answer selected, set answer as "No"
      setSelectedAnswer("No");
    }

    if (responses.length === 0) return;

    const lastResponse = responses[responses.length - 1]; // Get the last response added

    // Save the current response to Firebase
    await saveResponseToFirebase(lastResponse);

    // Immediately jump to the next question without delay
    setSelectedAnswer(null); // Reset selected answer for the next question

    if (currentQuestionIndex < section.questions.length - 1) {
      setQuestionIndex(currentQuestionIndex + 1);
    } else if (currentSectionIndex < subtopic.sections.length - 1) {
      setSectionIndex(currentSectionIndex + 1);
      setQuestionIndex(0);
    } else if (currentSubtopicIndex < topic.subtopics.length - 1) {
      setSubtopicIndex(currentSubtopicIndex + 1);
      setSectionIndex(0);
      setQuestionIndex(0);
    } else if (currentTopicIndex < layer.topics.length - 1) {
      setTopicIndex(currentTopicIndex + 1);
      setSubtopicIndex(0);
      setSectionIndex(0);
      setQuestionIndex(0);
    } else if (currentLayerIndex < data.layers.length - 1) {
      setLayerIndex(currentLayerIndex + 1);
      setTopicIndex(0);
      setSubtopicIndex(0);
      setSectionIndex(0);
      setQuestionIndex(0);
    } else {
      // Calculate Scores and Save to Firebase
      const totalQuestions = responses.length;
      const yesCount = responses.filter(
        (response) => response.answer === "Yes"
      ).length;

      // Calculate the total score
      const totalScore = (yesCount / totalQuestions) * 100;

      // Initialize layer-wise scores
      const layerScores = Array(data.layers.length).fill(0);
      const layerYesCounts = Array(data.layers.length).fill(0);
      const layerQuestionCounts = Array(data.layers.length).fill(0);

      // Calculate scores for each layer
      responses.forEach((response) => {
        layerYesCounts[response.layerIndex] +=
          response.answer === "Yes" ? 1 : 0;
        layerQuestionCounts[response.layerIndex] += 1;
      });

      // Populate scores for each layer
      layerYesCounts.forEach((yesCount, index) => {
        layerScores[index] = (yesCount / layerQuestionCounts[index]) * 100 || 0; // Handle division by zero
      });

      // Assign layer scores
      const assessmentData = {
        dateOfTest: new Date().toLocaleDateString(),
        timeOfTest: new Date().toLocaleTimeString(),
        score: totalScore.toFixed(2), // Total score
        orgScore: layerScores[0]?.toFixed(2) || 0, // Organization level score
        appScore: layerScores[1]?.toFixed(2) || 0, // Application level score
        dataScore: layerScores[2]?.toFixed(2) || 0, // Data level score
        awareScore: layerScores[3]?.toFixed(2) || 0, // Awareness level score
        polScore: layerScores[4]?.toFixed(2) || 0, // Policies level score
        riskLevel:
          totalScore > 90
            ? "Highly Secure"
            : totalScore > 70
            ? "Moderately Secure"
            : totalScore > 40
            ? "Less Secure"
            : "Critical Stage/Very High Risk",
      };

      // Save to Firestore

      try {
        // Reference to the user's document
        const userRef = doc(db, "users", userId);

        // Update the `logs` array with the new assessment data
        await updateDoc(userRef, {
          logs: arrayUnion(assessmentData), // Use arrayUnion to add the new data
        });

        console.log("Assessment data saved to logs:", assessmentData);
      } catch (error) {
        console.error("Error saving assessment data to logs:", error);
      }

      // Navigate to the score page
      console.log("Questionnaire completed", data);
      navigate("/admin", {
        state: {
          userId,
          data, // Include the fetched data
        },
      });
    }
  };

  // const handleNext = async () => {
  //   //if (!selectedAnswer) return; // Ensure an answer is selected before proceeding

  //   const question = section.questions[currentQuestionIndex];
  //   const response = responses[question.name];

  //   // Save the current response to Firebase
  //   await saveResponseToFirebase(response);

  //   setAnimationDirection("slide-out");
  //   setTimeout(() => {
  //     setSelectedAnswer(null); // Reset selected answer for the next question

  //     if (currentQuestionIndex < section.questions.length - 1) {
  //       setQuestionIndex(currentQuestionIndex + 1);
  //     } else if (currentSectionIndex < subtopic.sections.length - 1) {
  //       setSectionIndex(currentSectionIndex + 1);
  //       setQuestionIndex(0);
  //     } else if (currentSubtopicIndex < topic.subtopics.length - 1) {
  //       setSubtopicIndex(currentSubtopicIndex + 1);
  //       setSectionIndex(0);
  //       setQuestionIndex(0);
  //     } else if (currentTopicIndex < layer.topics.length - 1) {
  //       setTopicIndex(currentTopicIndex + 1);
  //       setSubtopicIndex(0);
  //       setSectionIndex(0);
  //       setQuestionIndex(0);
  //     } else if (currentLayerIndex < data.layers.length - 1) {
  //       setLayerIndex(currentLayerIndex + 1);
  //       setTopicIndex(0);
  //       setSubtopicIndex(0);
  //       setSectionIndex(0);
  //       setQuestionIndex(0);
  //     } else {
  //       console.log("Questionnaire completed");
  //       navigate("/score", { state: { responses, jsonData: data } });
  //     }
  //     setAnimationDirection("slide-in");
  //   }, 300);
  // };

  return (
    <div className="panel">
      <div className="panel-header">
        <h1>{layer.name}</h1>
        <h2>{topic.name}</h2>
        <h3>{subtopic.name}</h3>
      </div>

      <div className="panel-body">
        <div className={`question-panel ${animationDirection}`}>
          <p>
            <strong>{question.name}</strong>
          </p>
          <div className="buttons">
            <button
              className={selectedAnswer === "Yes" ? "selected" : ""}
              onClick={() => handleResponseChange(question.name, "Yes")}
            >
              Yes
            </button>
            <button
              className={selectedAnswer === "No" ? "selected" : ""}
              onClick={() => handleResponseChange(question.name, "No")}
            >
              No
            </button>
          </div>
          <button
            className="next-button"
            //disabled={!selectedAnswer} // Disable until an answer is selected
            onClick={handleNext}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuestionnairePage;

// import React, { useState, useEffect, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import "../styles/Questionnaire.css";
// import { db } from "../firebase/firebase.js"; // Import Firestore instance
// import { collection, doc, setDoc, getDocs } from "firebase/firestore";

// function QuestionnairePage() {
//   const [data, setData] = useState(null);
//   const [currentLayerIndex, setLayerIndex] = useState(0);
//   const [currentTopicIndex, setTopicIndex] = useState(0);
//   const [currentSubtopicIndex, setSubtopicIndex] = useState(0);
//   const [currentSectionIndex, setSectionIndex] = useState(0); // New state for section
//   const [responses, setResponses] = useState({});
//   const navigate = useNavigate();

//   const sanitizeName = (name) => name.replace(/[^a-zA-Z0-9]/g, "_");

//   const addDataToFirestore = useCallback(async (jsonData) => {
//     try {
//       const layers = jsonData.layers;

//       for (const layer of layers) {
//         const layerRef = doc(collection(db, "layers"), sanitizeName(layer.name));
//         await setDoc(layerRef, { name: layer.name });

//         for (const topic of layer.topics) {
//           const topicRef = doc(
//             collection(layerRef, "topics"),
//             sanitizeName(topic.name)
//           );
//           await setDoc(topicRef, { name: topic.name });

//           for (const subtopic of topic.subtopics) {
//             const subtopicRef = doc(
//               collection(topicRef, "subtopics"),
//               sanitizeName(subtopic.name)
//             );
//             await setDoc(subtopicRef, { name: subtopic.name });

//             for (const section of subtopic.sections) {
//               const sectionRef = doc(
//                 collection(subtopicRef, "sections"),
//                 sanitizeName(section.name)
//               );
//               await setDoc(sectionRef, { name: section.name });

//               for (const question of section.questions) {
//                 const questionRef = doc(
//                   collection(sectionRef, "questions"),
//                   sanitizeName(question.name)
//                 );
//                 await setDoc(questionRef, {
//                   name: question.name,
//                   info: question.info,
//                   good_point: question.good_point,
//                   scope_for_improvement: question.scope_for_improvement,
//                   mandatory: question.mandatory,
//                   tags: question.tags,
//                 });
//               }
//             }
//           }
//         }
//       }

//       console.log("Data successfully added to Firestore!");
//     } catch (error) {
//       console.error("Error adding data to Firestore:", error);
//     }
//   }, []);

//   const getFirestoreData = async (layersSnapshot) => {
//     const layers = [];
//     for (const layerDoc of layersSnapshot.docs) {
//       const topicsSnapshot = await getDocs(collection(layerDoc.ref, "topics"));
//       const topics = [];
//       for (const topicDoc of topicsSnapshot.docs) {
//         const subtopicsSnapshot = await getDocs(
//           collection(topicDoc.ref, "subtopics")
//         );
//         const subtopics = [];
//         for (const subtopicDoc of subtopicsSnapshot.docs) {
//           const sectionsSnapshot = await getDocs(
//             collection(subtopicDoc.ref, "sections")
//           );
//           const sections = [];
//           for (const sectionDoc of sectionsSnapshot.docs) {
//             const questionsSnapshot = await getDocs(
//               collection(sectionDoc.ref, "questions")
//             );
//             const questions = questionsSnapshot.docs.map((doc) => doc.data());
//             sections.push({ name: sectionDoc.id, questions });
//           }
//           subtopics.push({ name: subtopicDoc.id, sections });
//         }
//         topics.push({ name: topicDoc.id, subtopics });
//       }
//       layers.push({ name: layerDoc.id, topics });
//     }
//     return { layers };
//   };

//   useEffect(() => {
//     const fetchDataFromFirestore = async () => {
//       try {
//         const layersCollection = collection(db, "layers");
//         const layersSnapshot = await getDocs(layersCollection);

//         if (layersSnapshot.empty) {
//           console.log("Firestore is empty. Adding data...");
//           fetch("/questionnaireData.json")
//             .then((response) => response.json())
//             .then(async (jsonData) => {
//               await addDataToFirestore(jsonData); // Add JSON to Firestore
//               setData(jsonData); // Set state with the loaded data
//             });
//         } else {
//           console.log("Fetching data from Firestore...");
//           const firestoreData = await getFirestoreData(layersSnapshot);
//           console.log("Fetched data:", firestoreData);
//           setData(firestoreData); // Set state with Firestore data
//         }
//       } catch (error) {
//         console.error("Error fetching data from Firestore:", error);
//       }
//     };

//     fetchDataFromFirestore();
//   }, [addDataToFirestore]);

//   if (!data) return <div>Loading...</div>;

//   const layer = data.layers[currentLayerIndex];
//   const topic = layer.topics[currentTopicIndex];
//   const subtopic = topic.subtopics[currentSubtopicIndex];
//   const section = subtopic.sections[currentSectionIndex];

//   const handleResponseChange = (questionName, answer) => {
//     setResponses((prevResponses) => ({
//       ...prevResponses,
//       [questionName]: answer,
//     }));
//   };

//   const handleNext = () => {
//     if (currentSectionIndex < subtopic.sections.length - 1) {
//       setSectionIndex(currentSectionIndex + 1); // Move to next section
//     } else if (currentSubtopicIndex < topic.subtopics.length - 1) {
//       setSectionIndex(0);
//       setSubtopicIndex(currentSubtopicIndex + 1);
//     } else if (currentTopicIndex < layer.topics.length - 1) {
//       setSectionIndex(0);
//       setSubtopicIndex(0);
//       setTopicIndex(currentTopicIndex + 1);
//     } else if (currentLayerIndex < data.layers.length - 1) {
//       setLayerIndex(currentLayerIndex + 1);
//       setSectionIndex(0);
//       setTopicIndex(0);
//       setSubtopicIndex(0);
//     } else {
//       console.log("Questionnaire completed");
//       navigate("/score", { state: { responses, jsonData: data } });
//     }
//   };

//   return (
//     <div className="panel">
//       <div className="panel-header">
//         <h2>Layer: {layer.name}</h2>
//         <h3>Topic: {topic.name}</h3>
//         <h4>Subtopic: {subtopic.name}</h4>
//         <h5>Section: {section.name}</h5>
//       </div>

//       <div className="panel-body">
//         {section.questions.map((question, index) => (
//           <div key={index} className="question-panel">
//             <p><strong>{question.name}</strong></p>
//             <div className="buttons">
//               <button onClick={() => handleResponseChange(question.name, "Yes")}>
//                 Yes
//               </button>
//               <button onClick={() => handleResponseChange(question.name, "No")}>
//                 No
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>

//       <button className="next-button" onClick={handleNext}>
//         Next
//       </button>
//     </div>
//   );
// }

// export default QuestionnairePage;
