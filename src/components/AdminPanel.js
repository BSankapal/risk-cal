import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminPanel.css';

function AdminPanel({ initialData, onSubmit }) {
  const [data, setData] = useState(initialData);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    sector: '',
    dataSensitivity: '',
    digitalFootprint: '',
    employees: '',
    revenue: '',
    itInvestment: '',
    cyberMaturity: '',
    thirdPartyDependencies: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    console.log('Admin Panel Data:', formData);
    // Save the data or pass it to another component
    onSubmit(); 
    navigate('/questionnaire'); // Navigate to the questionnaire page
  };

  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>

      <div>
        <label>Sector of Industry</label>
        <select name="sector" value={formData.sector} onChange={handleInputChange}>
          <option value="">Select Sector</option>
          <option value="Finance">Finance</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Technology">Information Technology</option>
          <option value="Retail">Retail and E-commerce</option>
          <option value="Government">Government and Public Sector</option>
          <option value="Energy">Energy and Utilities</option>
          <option value="Telecommunications">Telecommunications</option>
          <option value="Manufacturing">Manufacturing</option>
          <option value="Education">Education</option>
          <option value="Transportation">Transportation and Logistics</option>
          <option value="Defense">Defense and Aerospace</option>
          <option value="Media">Media and Entertainment</option>
          <option value="Real Estate">Real Estate</option>
          <option value="Legal Services">Legal Services</option>
          <option value="Non-Profit Organizations">Non-Profit Organizations</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label>Nature of the Data Handled</label>
        <select name="dataSensitivity" value={formData.dataSensitivity} onChange={handleInputChange}>
          <option value="">Select Sensitivity</option>
          <option value="Highly Sensitive">Highly Sensitive (e.g., financial, healthcare, government data)</option>
          <option value="Moderately Sensitive">Moderately Sensitive (e.g., internal business data)</option>
          <option value="Low Sensitivity">Low Sensitivity (e.g., publicly available data)</option>
        </select>
      </div>

      <div>
        <label>Digital Footprint</label>
        <select name="digitalFootprint" value={formData.digitalFootprint} onChange={handleInputChange}>
          <option value="">Select Digital Footprint</option>
          <option value="Extensive">Extensive (e.g., global e-commerce, social media heavy)</option>
          <option value="Moderate">Moderate</option>
          <option value="Limited">Limited (e.g., local presence only)</option>
        </select>
      </div>

      <div>
        <label>Number of Employees</label>
        <select name="employees" value={formData.employees} onChange={handleInputChange}>
          <option value="">Select Number of Employees</option>
          <option value="Small">Small: &lt;50 employees</option>
          <option value="Medium">Medium: 50–500 employees</option>
          <option value="Large">Large: &gt;500 employees</option>
        </select>
      </div>

      <div>
        <label>Revenue</label>
        <select name="revenue" value={formData.revenue} onChange={handleInputChange}>
          <option value="">Select Revenue</option>
          <option value="Small-scale">&lt;10M</option>
          <option value="Medium-scale">10M–500M</option>
          <option value="Large-scale">&gt;500M</option>
        </select>
      </div>

      <div>
        <label>IT Infrastructure Investment</label>
        <select name="itInvestment" value={formData.itInvestment} onChange={handleInputChange}>
          <option value="">Select Investment</option>
          <option value="Low">&lt;5,00,000/year</option>
          <option value="Medium">5,00,000–50,00,000/year</option>
          <option value="High">&gt;50,00,000/year</option>
        </select>
      </div>

      <div>
        <label>Cybersecurity Maturity Level</label>
        <select name="cyberMaturity" value={formData.cyberMaturity} onChange={handleInputChange}>
          <option value="">Select Maturity Level</option>
          <option value="Mature">Mature (comprehensive policies, regular audits)</option>
          <option value="Intermediate">Intermediate (basic policies, occasional audits)</option>
          <option value="Low">Low (minimal or no cybersecurity practices)</option>
        </select>
      </div>

      <div>
        <label>Third-party Dependencies</label>
        <select name="thirdPartyDependencies" value={formData.thirdPartyDependencies} onChange={handleInputChange}>
          <option value="">Select Dependency Level</option>
          <option value="High">High dependency (multiple vendors, cloud-heavy)</option>
          <option value="Moderate">Moderate dependency</option>
          <option value="Low">Low dependency</option>
        </select>
      </div>

      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}

export default AdminPanel;



