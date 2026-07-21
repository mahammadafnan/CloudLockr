import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const cardRef = useRef(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Card Parallax Tilt
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

  const handleContinue = (e) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email address.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { toast.error('Please enter a valid email address.'); return; }
    setStep(2);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) { toast.error('Please enter your password.'); return; }
    setLoading(true);
    try {
      // AuthContext.login() handles the API call internally
      await login(email, password);
      toast.success('Welcome back! Secure session initialized.', { icon: '🔒' });
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center w-full relative select-none"
      style={{ background: '#f8f9fa', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif', color: '#111' }}
    >
      {/* Subtle atmospheric glow */}
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
        <Link to="/" style={{ fontSize: 13, fontWeight: 600, color: '#555' }} className="flex items-center gap-1 hover:text-black transition-colors">
          ← Back
        </Link>
      </nav>

      {/* Main */}
      <main className="flex-grow flex flex-col items-center justify-center w-full px-4 z-10 py-12">
        <div className="w-full flex flex-col items-center space-y-8" style={{ maxWidth: 440 }}>

          {/* Title */}
          <div className="text-center space-y-1">
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.8px', color: '#111' }}>Sign in</h1>
            <p style={{ fontSize: 14, color: '#6B7280' }}>Access your CloudLockr workspace</p>
          </div>

          {/* Card */}
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="w-full"
            style={{
              background: '#fff',
              borderRadius: 16,
              border: '1px solid #E6E8EB',
              padding: '36px 40px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              perspective: 1000,
              transformStyle: 'preserve-3d',
              transition: 'transform 0.3s ease-out',
            }}
          >
            {step === 1 ? (
              <form className="space-y-5" onSubmit={handleContinue}>
                <div className="space-y-1.5">
                  <label htmlFor="email" style={{ fontSize: 13, fontWeight: 600, color: '#111', display: 'block' }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    style={{
                      width: '100%', height: 44, padding: '0 14px', borderRadius: 10,
                      border: '1px solid #D1D5DB', fontSize: 14, color: '#111',
                      background: '#FAFAFA', outline: 'none', boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#0033a2'; e.target.style.boxShadow = '0 0 0 3px rgba(0,51,162,0.08)'; }}
                    onBlur={e => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%', height: 44, borderRadius: 10, border: 'none',
                    backgroundColor: '#39ff14', color: '#000',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.15s ease',
                    boxShadow: '0 2px 8px rgba(57,255,20,0.25)',
                  }}
                  onMouseEnter={e => { e.target.style.transform = 'scale(0.98)'; }}
                  onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
                >
                  Continue
                </button>

                <div className="text-center pt-1">
                  <Link to="/register" style={{ fontSize: 13, color: '#0033a2', fontWeight: 600 }}>
                    Don't have an account? Create one
                  </Link>
                </div>
              </form>
            ) : (
              <form className="space-y-5" onSubmit={handleLogin}>
                {/* Email display */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F3F4F6', borderRadius: 10, border: '1px solid #E6E8EB' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{email}</span>
                  <button type="button" onClick={() => setStep(1)} style={{ fontSize: 12, fontWeight: 700, color: '#0033a2', background: 'none', border: 'none', cursor: 'pointer' }}>Change</button>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" style={{ fontSize: 13, fontWeight: 600, color: '#111', display: 'block' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    style={{
                      width: '100%', height: 44, padding: '0 14px', borderRadius: 10,
                      border: '1px solid #D1D5DB', fontSize: 14, color: '#111',
                      background: '#FAFAFA', outline: 'none', boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#0033a2'; e.target.style.boxShadow = '0 0 0 3px rgba(0,51,162,0.08)'; }}
                    onBlur={e => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', height: 44, borderRadius: 10, border: 'none',
                    backgroundColor: '#39ff14', color: '#000',
                    fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', opacity: loading ? 0.6 : 1,
                    boxShadow: '0 2px 8px rgba(57,255,20,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {loading ? (
                    <div style={{ width: 18, height: 18, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}></div>
                  ) : 'Sign in'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  style={{ width: '100%', fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', paddingTop: 4 }}
                >
                  ← Back to email
                </button>
              </form>
            )}
          </div>

          <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', maxWidth: 320 }}>
            By signing in, you agree to the{' '}
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

export default Login;
