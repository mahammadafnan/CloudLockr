import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div 
      className="bg-background text-on-surface font-body-md min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif' }}
    >
      
      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-outline-variant/10">
        <div className="w-full px-margin-mobile md:px-margin-desktop py-4 flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8190cPQPuby81kmHIOrMUu1tAe4lm5_B2iYIpuC2GwLxTiBmasA5MmyLp3upLh7_qCXkmzWlJiITzj4psHxO_kyoGRYOxpgqPqiMck01UUclOdoi1cK8c1e2m-i_H7m-GVqpE7q4mtDnKZNxyD5mcUM4Fcv5M4n9XFXe6fpwOhzoUOlkjsDeh4nIW-m9MbIWkadX5ED5RokZHQlsAaSqc09bh3iLvdGGs9h1T9OCXO9_EwuBngrAb1bGMBZVHpycen7c" 
              alt="CloudLockr Logo" 
              className="h-[56px] w-auto"
            />
            <span className="font-display-xl-mobile text-headline-md tracking-tighter text-on-surface font-extrabold">CloudLockr</span>
          </div>
          <div className="flex items-center gap-6">
            <Link 
              className="font-label-caps text-label-caps text-on-surface hover:text-primary transition-colors duration-300 font-bold" 
              to="/login"
            >
              Login
            </Link>
            <Link 
              to="/login"
              className="bg-primary text-black px-8 py-3 rounded-full font-label-caps text-label-caps font-bold hover:scale-95 transition-all duration-200 neon-green-btn block text-center"
              style={{ backgroundColor: 'rgb(57, 255, 20)', color: 'rgb(0, 0, 0)' }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 flex-grow">
        
        {/* Hero Section */}
        <section className="relative min-h-[80vh] flex flex-col items-center justify-center text-center overflow-hidden px-margin-mobile md:px-margin-desktop">
          <div className="relative z-10 max-w-5xl mx-auto space-y-10">
            <h1 className="font-display-xl-mobile md:font-display-xl text-display-xl-mobile md:text-display-xl text-on-surface leading-[1.05] tracking-tight">
              We secure your <br />
              <span className="text-primary italic font-medium" style={{ color: 'rgb(57, 255, 20)' }}>cloud</span> environment
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              Real-time compliance monitoring, automated scans auditing, and GenAI remediation advisors for modern enterprise infrastructure.
            </p>
          </div>
          
          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 mt-20">
            <div className="w-[24px] h-[40px] rounded-full border-2 border-outline-variant/50 flex justify-center p-1.5">
              <div 
                className="w-1.5 h-1.5 bg-primary rounded-full animate-scroll-wheel" 
                style={{ backgroundColor: 'rgb(57, 255, 20)' }}
              ></div>
            </div>
          </div>
        </section>

        {/* Core Services Section */}
        <section id="capabilities" className="mt-20 py-24 bg-surface-container-lowest border-t border-outline-variant/10">
          <div className="w-full px-margin-mobile md:px-margin-desktop">
            <div className="mb-16 text-center space-y-4">
              <span className="font-bold tracking-widest text-on-surface uppercase text-xl" style={{ fontFamily: 'Inter, sans-serif' }}>CAPABILITIES</span>
              <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">Our Core Services</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
              {/* Storage Buckets */}
              <div className="group relative p-8 rounded-lg border border-outline-variant/30 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50 min-h-[220px] flex flex-col justify-start" style={{ backgroundColor: '#fff0eb' }}>
                <div className="relative z-10 transition-transform duration-500 group-hover:-translate-y-2">
                  <span className="material-symbols-outlined text-primary mb-6 text-3xl block transition-transform duration-500 group-hover:scale-110" data-icon="database" style={{ color: 'rgb(0, 0, 0)' }}>database</span>
                  <h3 className="font-headline-md text-xl font-bold text-on-surface">Storage Buckets</h3>
                </div>
                <div className="mt-4 opacity-0 max-h-0 overflow-hidden transition-all duration-500 ease-in-out group-hover:opacity-100 group-hover:max-h-40 group-hover:mt-2">
                  <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">Highly available, encrypted object storage for your critical assets with automated lifecycle policies.</p>
                </div>
              </div>

              {/* Compute Instances */}
              <div className="group relative p-8 rounded-lg border border-outline-variant/30 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50 min-h-[220px] flex flex-col justify-start" style={{ backgroundColor: '#f1f5f9' }}>
                <div className="relative z-10 transition-transform duration-500 group-hover:-translate-y-2">
                  <span className="material-symbols-outlined text-primary mb-6 text-3xl block transition-transform duration-500 group-hover:scale-110" data-icon="memory" style={{ color: 'black' }}>memory</span>
                  <h3 className="font-headline-md text-xl font-bold text-on-surface">Compute Instances</h3>
                </div>
                <div className="mt-4 opacity-0 max-h-0 overflow-hidden transition-all duration-500 ease-in-out group-hover:opacity-100 group-hover:max-h-40 group-hover:mt-2">
                  <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">Secure, isolated virtual machines with real-time threat detection and vulnerability patching.</p>
                </div>
              </div>

              {/* IAM */}
              <div className="group relative p-8 rounded-lg border border-outline-variant/30 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50 min-h-[220px] flex flex-col justify-start" style={{ backgroundColor: '#f5f3ff' }}>
                <div className="relative z-10 transition-transform duration-500 group-hover:-translate-y-2">
                  <span className="material-symbols-outlined text-primary mb-6 text-3xl block transition-transform duration-500 group-hover:scale-110" data-icon="badge" style={{ color: 'rgb(0, 0, 0)' }}>badge</span>
                  <h3 className="font-headline-md text-xl font-bold text-on-surface">IAM</h3>
                </div>
                <div className="mt-4 opacity-0 max-h-0 overflow-hidden transition-all duration-500 ease-in-out group-hover:opacity-100 group-hover:max-h-40 group-hover:mt-2">
                  <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">Identity and Access Management with just-in-time permissions and deep privilege analysis.</p>
                </div>
              </div>

              {/* Security Groups */}
              <div className="group relative p-8 rounded-lg border border-outline-variant/30 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50 min-h-[220px] flex flex-col justify-start" style={{ backgroundColor: '#f7fee7' }}>
                <div className="relative z-10 transition-transform duration-500 group-hover:-translate-y-2">
                  <span className="material-symbols-outlined text-primary mb-6 text-3xl block transition-transform duration-500 group-hover:scale-110" data-icon="lan" style={{ color: 'rgb(0, 0, 0)' }}>lan</span>
                  <h3 className="font-headline-md text-xl font-bold text-on-surface">Security Groups</h3>
                </div>
                <div className="mt-4 opacity-0 max-h-0 overflow-hidden transition-all duration-500 ease-in-out group-hover:opacity-100 group-hover:max-h-40 group-hover:mt-2">
                  <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">Micro-segmentation rules that automatically adapt to your application's network topology.</p>
                </div>
              </div>

              {/* Audit Logging */}
              <div className="group relative p-8 rounded-lg border border-outline-variant/30 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50 min-h-[220px] flex flex-col justify-start" style={{ backgroundColor: '#fff1f2' }}>
                <div className="relative z-10 transition-transform duration-500 group-hover:-translate-y-2">
                  <span className="material-symbols-outlined text-primary mb-6 text-3xl block transition-transform duration-500 group-hover:scale-110" data-icon="history_edu" style={{ color: 'rgb(0, 0, 0)' }}>history_edu</span>
                  <h3 className="font-headline-md text-xl font-bold text-on-surface">Audit Logging</h3>
                </div>
                <div className="mt-4 opacity-0 max-h-0 overflow-hidden transition-all duration-500 ease-in-out group-hover:opacity-100 group-hover:max-h-40 group-hover:mt-2">
                  <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">Immutable forensic logs captured across all cloud regions with 10-year retention options.</p>
                </div>
              </div>

              {/* AI Remediation */}
              <div className="group relative p-8 rounded-lg border border-outline-variant/30 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50 min-h-[220px] flex flex-col justify-start" style={{ backgroundColor: '#f0fdfa' }}>
                <div className="relative z-10 transition-transform duration-500 group-hover:-translate-y-2">
                  <span className="material-symbols-outlined text-primary mb-6 text-3xl block transition-transform duration-500 group-hover:scale-110" data-icon="auto_fix_high" style={{ color: 'rgb(0, 0, 0)' }}>auto_fix_high</span>
                  <h3 className="font-headline-md text-xl font-bold text-on-surface">AI Remediation</h3>
                </div>
                <div className="mt-4 opacity-0 max-h-0 overflow-hidden transition-all duration-500 ease-in-out group-hover:opacity-100 group-hover:max-h-40 group-hover:mt-2">
                  <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">Intelligent bots that suggest and apply security fixes before vulnerabilities reach production.</p>
                </div>
              </div>

              {/* PDF Reporting */}
              <div className="group relative p-8 rounded-lg border border-outline-variant/30 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50 min-h-[220px] flex flex-col justify-start sm:col-span-2 lg:col-span-2" style={{ backgroundColor: '#fffbeb' }}>
                <div className="relative z-10 transition-transform duration-500 group-hover:-translate-y-2">
                  <span className="material-symbols-outlined text-primary mb-6 text-3xl block transition-transform duration-500 group-hover:scale-110" data-icon="picture_as_pdf" style={{ color: 'rgb(0, 0, 0)' }}>picture_as_pdf</span>
                  <h3 className="font-headline-md text-xl font-bold text-on-surface">PDF Reporting</h3>
                </div>
                <div className="mt-4 opacity-0 max-h-0 overflow-hidden transition-all duration-500 ease-in-out group-hover:opacity-100 group-hover:max-h-40 group-hover:mt-2">
                  <p className="font-body-md text-on-surface-variant text-sm leading-relaxed max-w-xl font-normal">Executive-ready compliance reports and technical debt summaries delivered to your inbox weekly.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-background border-t border-outline-variant/10">
        <div className="w-full px-margin-mobile md:px-margin-desktop py-20 flex flex-col md:flex-row justify-between items-start gap-gutter">
          <div className="space-y-6 max-w-sm">
            <div className="flex items-center gap-2">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCicPzYuMei0rmM60GaFDzDd4gDiVmKAbtnK8SfjKbG0mak-K2ub3jwdw3-EZbPgGoC4SNWkoVCw5GKx_EAESzeVHvAVYHTo8dqQNdXdewjs2rkvzDcSo5YRCClWfIf8s4_z91HCYEc-AIIxi1OAfAsAD6wCEhDwKzrHYabjaVF2Ahj7eA7e5J1bum9ecknZ9crcvLM9GEwT-euMYobv_Im7xGO70UdnJ7mMXC5zFpWFxPMx9rBtmTrpjWkvJl1A6a7qSY" 
                alt="CloudLockr Logo" 
                className="w-auto h-[56px]"
              />
              <span className="font-display-xl-mobile text-headline-md tracking-tighter text-on-surface font-extrabold">CloudLockr</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed font-normal">
              Next-generation cloud security platform for modern infrastructure teams who value speed without compromising safety.
            </p>
            <div className="flex gap-4">
              <a className="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface hover:text-primary hover:border-primary transition-all duration-300" href="#">
                <span className="material-symbols-outlined text-[18px]" data-icon="share">share</span>
              </a>
              <a className="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface hover:text-primary hover:border-primary transition-all duration-300" href="#">
                <span className="material-symbols-outlined text-[18px]" data-icon="public">public</span>
              </a>
              <a className="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface hover:text-primary hover:border-primary transition-all duration-300" href="#">
                <span className="material-symbols-outlined text-[18px]" data-icon="groups">groups</span>
              </a>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-16 md:gap-20">
            <div className="space-y-4">
              <h4 className="font-label-caps text-label-caps text-on-surface font-bold tracking-widest uppercase">Platform</h4>
              <ul className="space-y-2 font-body-md text-sm text-on-surface-variant font-normal">
                <li><a className="hover:text-primary transition-all" href="#">Security Scan</a></li>
                <li><a className="hover:text-primary transition-all" href="#">Cloud Audit</a></li>
                <li><a className="hover:text-primary transition-all" href="#">Compliance</a></li>
                <li><a className="hover:text-primary transition-all" href="#">Real-time alerts</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-label-caps text-label-caps text-on-surface font-bold tracking-widest uppercase">Resources</h4>
              <ul className="space-y-2 font-body-md text-sm text-on-surface-variant font-normal">
                <li><a className="hover:text-primary transition-all" href="#">Documentation</a></li>
                <li><a className="hover:text-primary transition-all" href="#">API Reference</a></li>
                <li><a className="hover:text-primary transition-all" href="#">Case Studies</a></li>
                <li><a className="hover:text-primary transition-all" href="#">Blog</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-label-caps text-label-caps text-on-surface font-bold tracking-widest uppercase">Legal</h4>
              <ul className="space-y-2 font-body-md text-sm text-on-surface-variant font-normal">
                <li><a className="hover:text-primary transition-all" href="#">Privacy Policy</a></li>
                <li><a className="hover:text-primary transition-all" href="#">Terms of Use</a></li>
                <li><a className="hover:text-primary transition-all" href="#">Security</a></li>
                <li><a className="hover:text-primary transition-all" href="#">Cookie Settings</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="w-full px-margin-mobile md:px-margin-desktop py-6 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-label-caps text-[10px] text-on-surface-variant font-bold">© CLOUDLOCKR . ALL RIGHTS RESERVED.</span>
          <div className="flex gap-10 font-label-caps text-[10px] text-on-surface-variant font-bold">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> 
              SYSTEM STATUS: OPERATIONAL
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
