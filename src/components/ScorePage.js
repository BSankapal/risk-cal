import React from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/ScorePage.css';

function ScorePage() {
  const location = useLocation();
  const { responses, jsonData } = location.state || {};

  // Handle loading state
  if (!jsonData || !responses) return <p className="loading">Loading...</p>;

  const goodPoints = [];
  const improvementPoints = [];

  // Safely access the layers and loop through the structure
  jsonData?.layers?.forEach(layer => {
    layer?.topics?.forEach(topic => {
      topic?.subtopics?.forEach(subtopic => {
        subtopic?.sections?.forEach(section => {
          section?.questions?.forEach(q => {
            const response = responses[q.name];
            
            if (response === "Yes") {
              // If response is Yes, collect good points
              if (q.good_point) {
                goodPoints.push(q.good_point);
              }
            } else {
              // If response is No, collect areas for improvement
              if (q.scope_for_improvement) {
                improvementPoints.push(q.scope_for_improvement);
              }
            }
          });
        });
      });
    });
  });

  return (
    <div className="score-page">
      <div className="score-summary">
        <h2>Evaluation</h2>
        <p>Total Score: {goodPoints.length}</p>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Good Points</h3>
        </div>
        <div className="panel-body">
          {goodPoints.length > 0 ? (
            <ul>
              {goodPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          ) : (
            <p className="no-items">No good points to display.</p>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Areas for Improvement</h3>
        </div>
        <div className="panel-body">
          {improvementPoints.length > 0 ? (
            <ul>
              {improvementPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          ) : (
            <p className="no-items">No areas for improvement to display.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScorePage;
