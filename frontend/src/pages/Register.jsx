import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Viewer');
  const [loading, setLoading] = useState(false);
  const cardRef = useRef(null);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleMouseMove = (e) => {
    if (!cardRef.current || window.innerWidth < 768) return;
    const card = cardRef.current;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    card.style.transform = `rotateY(${x / 25}deg) rotateX(${-y / 25}deg)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'rotateY(0deg) rotateX(0deg)';
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) { toast.error('All fields are required.'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      // AuthContext.register() handles the API call internally
      await register(name, email, password, role);
      toast.success('Account created! Welcome to CloudLockr.', { icon: '🔒' });
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', height: 44, padding: '0 14px', borderRadius: 10,
    border: '1px solid #D1D5DB', fontSize: 14, color: '#111',
    background: '#FAFAFA', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center w-full relative select-none"
      style={{ background: '#f8f9fa', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif', color: '#111' }}
    >
      {/* Atmospheric background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full" style={{ background: 'rgba(0,51,162,0.04)', filter: 'blur(120px)' }}></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[30%] h-[30%] rounded-full" style={{ background: 'rgba(57,255,20,0.04)', filter: 'blur(100px)' }}></div>
      </div>

      {/* Top Bar */}
      <nav className="w-full h-16 flex items-center justify-between px-6 z-10 border-b" style={{ background: '#fff', borderColor: '#E6E8EB' }}>
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8190cPQPuby81kmHIOrMUu1tAe4lm5_B2iYIpuC2GwLxTiBmasA5MmyLp3upLh7_qCXkmzWlJiITzj4psHxO_kyoGRYOxpgqPqiMck01UUclOdoi1cK8c1e2m-i_H7m-GVqpE7q4mtDnKZNxyD5mcUM4Fcv5M4n9XFXe6fpwOhzoUOlkjsDeh4nIW-m9MbIWkadX5ED5RokZHQlsAaSqc09bh3iLvdGGs9h1T9OCXO9_EwuBngrAb1bGMBZVHpycen7c"
            alt="CloudLockr"
            className="h-9 w-auto"
          />
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.4px', color: '#111' }}>CloudLockr</span>
        </Link>
        <Link to="/" style={{ fontSize: 13, fontWeight: 600, color: '#555' }} className="hover:text-black transition-colors">
          ← Back
        </Link>
      </nav>

      {/* Main */}
      <main className="flex-grow flex flex-col items-center justify-center w-full px-4 z-10 py-12">
        <div className="w-full flex flex-col items-center space-y-8" style={{ maxWidth: 440 }}>

          <div className="text-center space-y-1">
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.8px', color: '#111' }}>Create account</h1>
            <p style={{ fontSize: 14, color: '#6B7280' }}>Join CloudLockr and secure your cloud</p>
          </div>

          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              width: '100%',
              background: '#fff',
              borderRadius: 16,
              border: '1px solid #E6E8EB',
              padding: '36px 40px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              perspective: 1000,
              transformStyle: 'preserve-3d',
              transition: 'transform 0.3s ease-out',
              boxSizing: 'border-box',
            }}
          >
            <form className="space-y-4" onSubmit={handleRegister}>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="name" style={{ fontSize: 13, fontWeight: 600, color: '#111', display: 'block' }}>Full Name</label>
                <input
                  type="text" id="name" value={name} onChange={e => setName(e.target.value)}
                  placeholder="John Doe" required disabled={loading} style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#0033a2'; e.target.style.boxShadow = '0 0 0 3px rgba(0,51,162,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="reg-email" style={{ fontSize: 13, fontWeight: 600, color: '#111', display: 'block' }}>Email address</label>
                <input
                  type="email" id="reg-email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com" required disabled={loading} style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#0033a2'; e.target.style.boxShadow = '0 0 0 3px rgba(0,51,162,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="reg-password" style={{ fontSize: 13, fontWeight: 600, color: '#111', display: 'block' }}>Password</label>
                <input
                  type="password" id="reg-password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 characters" required disabled={loading} style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#0033a2'; e.target.style.boxShadow = '0 0 0 3px rgba(0,51,162,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label htmlFor="role" style={{ fontSize: 13, fontWeight: 600, color: '#111', display: 'block' }}>Security Role</label>
                <select
                  id="role" value={role} onChange={e => setRole(e.target.value)}
                  disabled={loading}
                  style={{ ...inputStyle, background: '#fff', cursor: 'pointer' }}
                  onFocus={e => { e.target.style.borderColor = '#0033a2'; e.target.style.boxShadow = '0 0 0 3px rgba(0,51,162,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; }}
                >
                  <option value="Viewer">Viewer</option>
                  <option value="Security Analyst">Security Analyst</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', height: 44, borderRadius: 10, border: 'none',
                  backgroundColor: '#39ff14', color: '#000',
                  fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', opacity: loading ? 0.6 : 1, marginTop: 8,
                  boxShadow: '0 2px 8px rgba(57,255,20,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {loading ? (
                  <div style={{ width: 18, height: 18, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}></div>
                ) : 'Create Account'}
              </button>

              <div className="text-center pt-1">
                <Link to="/login" style={{ fontSize: 13, color: '#0033a2', fontWeight: 600 }}>
                  Already have an account? Sign in
                </Link>
              </div>
            </form>
          </div>

          <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', maxWidth: 320 }}>
            By registering, you agree to the{' '}
            <a href="#" style={{ color: '#0033a2' }}>CloudLockr Privacy Policy</a>.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full z-10" style={{ background: '#fff', borderTop: '1px solid #E6E8EB' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px' }}>
          <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginBottom: 32, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Connect all your clouds</p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 64, flexWrap: 'wrap', opacity: 0.5, filter: 'grayscale(1)' }}>
            <div style={{ width: 120, height: 48, backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDGmwhQt24Q5uh3NZ68MaAo9Id8JEBwv_yG3qJymWfzeZHxi9OKDdBL8Vqg8zSywmO_qmeMggnUfipU-xPFVu863i0tBRCzVX5pXCaRwehvEzDA5H8Xv-wlon0gHPiwpRBdAMUcU9oOPzLnaq9tAtVgfEB938XXX-Y4aBHZ7aNDnM-wbMya-LMSWcH0cC9NOSWisnqvqcEJD6UVKyRccqxAoFv7MqdIU-wC_h7hF5pv7YzDD3tSUKGctw")', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}></div>
            <div style={{ width: 140, height: 48, backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAiy0Jg45fNh_wlngk9dc4gb3dLAEi6JGLlgtCZiOt60_jhpIcCgBsXBUBUHQYIgOq8YCO0NjDMxNrkjFUr1Y4kQx1Xa8X4wJTT8mLV8K7nwYP-WOTzIEyI0nW8fmjVuGnljHi0F6bDgvvnlad-agKD1206iv1E43hl1_8vLtq0MCD8ljGUlcXRTyHk1OtteXpw90kIsolcIEGBbRfVslWEdLoWiHF3w8PZluIannCg1w3CIrmyMSGHyw")', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}></div>
            <div style={{ width: 140, height: 48, backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAxYS4uqG4q5SBbaQSOtjrrZg_zognVqvYCAPh5HY7Rj_du41L8nMiWrOwnI8MH1XYWSJkOdb9s9bulOJF3e0ipk9x7RO5ZB9bfVohGso8sV0t6UkMh9rgOyJ8le1abx_mw7l8_ciYioPsdCJgFHstAknsV8oQJIj5JhIVaJ7RSxeyvEowYMsEQ7xIeXoUFmbu25u4vIqeuEHwR_y7R-dBpEscE9E4fSwXA50Rx0YQ86lLRLZNbMpTohA")', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}></div>
          </div>
          <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 48 }}>© CloudSecure Inc. All rights reserved.</p>
        </div>
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Register;
