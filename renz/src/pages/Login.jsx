import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Lock, Mail } from 'lucide-react';
import '../styles/Login.css';

// 1. Import the logo
import clinicLogo from '../assets/CLINICCARE.png'; 

export default function Login() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Logging in with:", formData);
    navigate('/'); 
  };

  return (
    <div className="login-page">
      
      {/* Left Side: Branding */}
      <div className="login-brand-section">
        
        {/* 2. Insert Logo Here */}
        <img 
          src={clinicLogo} 
          alt="ClinicCare Logo" 
          style={{ width: '300px', marginBottom: '0.1rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }} 
        />

        <div className="brand-logo">CALONIA</div>
        <p className="brand-subtitle">
          Clinic Appointment & Live Operations Network Interface Assistant
        </p>
        <div style={{marginTop: '2rem', opacity: 0.7, fontSize: '0.9rem'}}>
          &copy; 2025 Clinic Appointment System
        </div>
      </div>

      {/* Right Side: Form (Unchanged) */}
      <div className="login-form-section">
        <div className="login-card animate-slide-up">
          <div className="login-header">
            <h2>Staff Portal</h2>
            <p>Please enter your credentials to access the system.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="login-form-group">
              <label className="login-label">Email Address</label>
              <div style={{position: 'relative'}}>
                <Mail size={18} style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8'}} />
                <input 
                  type="email" 
                  required
                  className="login-input"
                  placeholder="staff@calonia.com"
                  style={{paddingLeft: '2.5rem'}}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="login-form-group">
              <label className="login-label">Password</label>
              <div style={{position: 'relative'}}>
                <Lock size={18} style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8'}} />
                <input 
                  type="password" 
                  required
                  className="login-input"
                  placeholder="••••••••"
                  style={{paddingLeft: '2.5rem'}}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <div style={{textAlign: 'right', marginBottom: '1.5rem'}}>
              <a href="#" style={{fontSize: '0.85rem', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500'}}>Forgot Password?</a>
            </div>

            <button type="submit" className="login-btn">
              <LogIn size={20} /> Sign In
            </button>
          </form>

          <div className="login-footer">
            Authorized personnel only. <br/> 
            Contact IT support for access issues.
          </div>
        </div>
      </div>
    </div>
  );
}