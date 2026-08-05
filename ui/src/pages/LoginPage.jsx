import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const cardRef = useRef(null);
  const navigate = useNavigate();

  // Card Parallax Tilt Micro-Interaction
  const handleMouseMove = (e) => {
    if (!cardRef.current || window.innerWidth < 768) return;
    const card = cardRef.current;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    // Rotate card slightly based on mouse position
    card.style.transform = `rotateY(${x / 25}deg) rotateX(${-y / 25}deg)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'rotateY(0deg) rotateX(0deg)';
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your corporate email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid corporate email address.');
      return;
    }
    setStep(2);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!password) {
      toast.error('Please enter your access password.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Identity verified. Secure session initialized!', {
        icon: '🔒',
        style: {
          background: '#090a0f',
          color: '#39ff14',
          border: '1px solid rgba(57, 255, 20, 0.15)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }
      });
      navigate('/');
    }, 1000);
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center font-body-md w-full relative select-none">
      
      {/* Hero/Atmospheric Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Top Bar (With CloudLockr Logo on the top-leftmost side) */}
      <nav className="w-full h-16 flex items-center justify-between px-gutter z-10 border-b border-border-subtle bg-white">
        <Link to="/" className="flex items-center gap-1.5 hover:opacity-85 transition-opacity">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8190cPQPuby81kmHIOrMUu1tAe4lm5_B2iYIpuC2GwLxTiBmasA5MmyLp3upLh7_qCXkmzWlJiITzj4psHxO_kyoGRYOxpgqPqiMck01UUclOdoi1cK8c1e2m-i_H7m-GVqpE7q4mtDnKZNxyD5mcUM4Fcv5M4n9XFXe6fpwOhzoUOlkjsDeh4nIW-m9MbIWkadX5ED5RokZHQlsAaSqc09bh3iLvdGGs9h1T9OCXO9_EwuBngrAb1bGMBZVHpycen7c" 
            alt="CloudLockr Logo" 
            className="h-10 w-auto"
          />
          <span className="font-display-xl-mobile text-lg tracking-tighter text-on-surface font-extrabold">CloudLockr</span>
        </Link>
        <Link to="/" className="text-gray-400 hover:text-black font-semibold text-xs transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back
        </Link>
      </nav>

      {/* Main Content Canvas */}
      <main className="flex-grow flex flex-col items-center justify-center w-full px-margin-mobile z-10 py-stack-lg">
        
        {/* Center Login Container */}
        <div className="w-full max-w-[480px] flex flex-col items-center space-y-stack-lg">
          
          {/* Brand Identity */}
          <div className="flex flex-col items-center space-y-stack-md text-center">
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Sign in</h1>
          </div>

          {/* Login Card with Tilt Interaction */}
          <div 
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="w-full bg-white rounded-lg px-12 py-10 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-border-subtle transition-all duration-300 ease-out"
            style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
          >
            {step === 1 ? (
              /* Step 1: Email Entry */
              <form className="space-y-stack-md" onSubmit={handleContinue}>
                <div className="space-y-stack-sm">
                  <div className="flex items-center justify-between">
                    <label htmlFor="email" className="font-label-md text-label-md text-on-surface font-semibold">Email</label>
                    <span 
                      className="material-symbols-outlined text-[16px] text-outline cursor-help select-none" 
                      title="Enter your corporate email address"
                    >
                      info
                    </span>
                  </div>
                  <div className="relative">
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john.doe@mycompany.com" 
                      className="w-full h-[48px] px-4 border border-border-subtle rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-outline-variant text-black"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full h-[48px] font-label-md text-label-md rounded-lg active:scale-[0.98] transition-all flex items-center justify-center font-bold shadow-md hover:shadow-lg cursor-pointer" 
                  style={{ backgroundColor: 'rgb(57, 255, 20)', color: 'black' }}
                >
                  Continue
                </button>

                <div className="flex justify-center pt-2">
                  <a href="#" className="font-label-md text-label-md text-primary hover:underline transition-all font-semibold">
                    Does not have one, Create Account?
                  </a>
                </div>
              </form>
            ) : (
              /* Step 2: Password Entry */
              <form className="space-y-stack-md" onSubmit={handleLogin}>
                
                {/* Entered Email display */}
                <div className="flex justify-between items-center bg-slate-50 border border-border-subtle p-3 rounded-lg text-xs font-semibold text-gray-700">
                  <span className="truncate max-w-[200px]">{email}</span>
                  <button 
                    type="button" 
                    onClick={() => setStep(1)} 
                    className="text-primary hover:underline font-bold"
                  >
                    Change
                  </button>
                </div>

                <div className="space-y-stack-sm">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="font-label-md text-label-md text-on-surface font-semibold">Password</label>
                    <span 
                      className="material-symbols-outlined text-[16px] text-outline cursor-help select-none" 
                      title="Enter your corporate access credentials"
                    >
                      info
                    </span>
                  </div>
                  <div className="relative">
                    <input 
                      type="password" 
                      id="password" 
                      name="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full h-[48px] px-4 border border-border-subtle rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-outline-variant text-black"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-[48px] font-label-md text-label-md rounded-lg active:scale-[0.98] transition-all flex items-center justify-center font-bold shadow-md hover:shadow-lg cursor-pointer" 
                    style={{ backgroundColor: 'rgb(57, 255, 20)', color: 'black' }}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Login'
                    )}
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setStep(1)}
                    disabled={loading}
                    className="w-full text-center text-xs text-gray-500 hover:text-black font-semibold py-1.5 transition-colors cursor-pointer"
                  >
                    ← Back to email
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Disclaimer */}
          <p className="font-label-sm text-label-sm text-link-gray text-center max-w-[340px]">
            By logging in, you acknowledge that you have read and agree to the 
            <a href="#" className="text-primary hover:underline ml-1 font-semibold">CloudLockr Privacy Policy</a>.
          </p>
        </div>
      </main>

      {/* Industry Leader Footer Section */}
      <footer className="w-full bg-white border-t border-border-subtle py-16 px-gutter mt-auto z-10">
        <div className="max-w-6xl mx-auto flex flex-col items-center space-y-12">
          <div className="text-center">
            <h2 className="font-label-md text-label-md text-link-gray uppercase tracking-[0.1em] font-semibold">Connect all your clouds</h2>
          </div>
          
          {/* Logo Grid */}
          <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-8 w-full opacity-60 grayscale">
            {/* AWS Logo */}
            <div 
              className="bg-contain bg-center bg-no-repeat w-32 h-16" 
              style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDGmwhQt24Q5uh3NZ68MaAo9Id8JEBwv_yG3qJymWfzeZHxi9OKDdBL8Vqg8zSywmO_qmeMggnUfipU-xPFVu863i0tBRCzVX5pXCaRwehvEzDA5H8Xv-wlon0gHPiwpRBdAMUcU9oOPzLnaq9tAtVgfEB938XXX-Y4aBHZ7aNDnM-wbMya-LMSWcH0cC9NOSWisnqvqcEJD6UVKyRccqxAoFv7MqdIU-wC_h7hF5pv7YzDD3tSUKGctw")' }}
            ></div>
            {/* Azure Logo */}
            <div 
              className="w-36 h-16 bg-contain bg-center bg-no-repeat" 
              style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAiy0Jg45fNh_wlngk9dc4gb3dLAEi6JGLlgtCZiOt60_jhpIcCgBsXBUBUHQYIgOq8YCO0NjDMxNrkjFUr1Y4kQx1Xa8X4wJTT8mLV8K7nwYP-WOTzIEyI0nW8fmjVuGnljHi0F6bDgvvnlad-agKD1206iv1E43hl1_8vLtq0MCD8ljGUlcXRTyHk1OtteXpw90kIsolcIEGBbRfVslWEdLoWiHF3w8PZluIannCg1w3CIrmyMSGHyw")' }}
            ></div>
            {/* GCP Logo */}
            <div 
              className="w-36 h-16 bg-contain bg-center bg-no-repeat" 
              style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAxYS4uqG4q5SBbaQSOtjrrZg_zognVqvYCAPh5HY7Rj_du41L8nMiWrOwnI8MH1XYWSJkOdb9s9bulOJF3e0ipk9x7RO5ZB9bfVohGso8sV0t6UkMh9rgOyJ8le1abx_mw7l8_ciYioPsdCJgFHstAknsV8oQJIj5JhIVaJ7RSxeyvEowYMsEQ7xIeXoUFmbu25u4vIqeuEHwR_y7R-dBpEscE9E4fSwXA50Rx0YQ86lLRLZNbMpTohA")' }}
            ></div>
          </div>
          
          {/* Footer Links */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 pt-12 border-t border-border-subtle w-full text-xs">
            <span className="font-label-sm text-label-sm text-on-surface font-bold">© CloudSecure Inc. All rights reserved.</span>
            <a className="font-label-sm text-label-sm text-link-gray hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="font-label-sm text-label-sm text-link-gray hover:text-primary transition-colors" href="#">Terms of Service</a>
            <a className="font-label-sm text-label-sm text-link-gray hover:text-primary transition-colors" href="#">Security Audit</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
