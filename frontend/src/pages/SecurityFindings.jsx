import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  HiOutlineSearch, 
  HiOutlineShieldExclamation, 
  HiOutlineRefresh, 
  HiOutlineSparkles,
  HiX
} from 'react-icons/hi';

const SecurityFindings = () => {
  const [loading, setLoading] = useState(true);
  const [findings, setFindings] = useState([]);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');

  // AI Drawer panel states
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  const fetchFindings = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/dashboard/findings');
      if (res.data.success) {
        setFindings(res.data.findings || []);
      }
    } catch (error) {
      console.error('[Findings API] Error:', error.message);
      toast.error('Failed to load vulnerabilities index.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFindings();
  }, []);

  const handleFindingSelect = async (finding) => {
    setSelectedFinding(finding);
    setLoadingAi(true);
    setAiResponse('');
    
    try {
      const res = await axios.get(`/api/ai/explain/${finding._id}`);
      if (res.data.success) {
        setAiResponse(res.data.analysis);
      }
    } catch (error) {
      console.error('[AI Assistant API] Error:', error.message);
      toast.error('Failed to query AI Assistant.');
    } finally {
      setLoadingAi(false);
    }
  };

  // Custom parser to format and copy AI code blocks cleanly
  const renderMarkdown = (text) => {
    if (!text) return null;
    const segments = text.split(/(```[\s\S]*?```)/g);

    return segments.map((seg, idx) => {
      if (seg.startsWith('```')) {
        const code = seg.replace(/```[a-zA-Z]*/, '').replace(/```$/, '').trim();
        return (
          <div key={idx} className="my-4 bg-black border border-gray-800 rounded-lg overflow-hidden font-mono text-xs">
            <div className="flex items-center justify-between px-4 py-1.5 bg-gray-950 border-b border-gray-800 text-[10px] uppercase text-gray-500 font-sans tracking-wider">
              <span>Remediation CLI Code</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  toast.success('AWS CLI command copied to clipboard!');
                }}
                className="text-blue-400 hover:text-blue-300 font-semibold lowercase active:scale-95"
              >
                copy
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-emerald-400 select-all leading-relaxed whitespace-pre-wrap">{code}</pre>
          </div>
        );
      }

      return seg.split('\n').map((line, lIdx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('###')) {
          return (
            <h4 key={`${idx}-${lIdx}`} className="text-xs font-bold text-blue-400 mt-6 mb-2 tracking-wider uppercase border-b border-gray-850 pb-1 flex items-center space-x-1.5">
              <span>{trimmed.replace(/^###\s*/, '')}</span>
            </h4>
          );
        }
        if (trimmed.startsWith('-')) {
          return (
            <div key={`${idx}-${lIdx}`} className="flex items-start space-x-2 my-2 text-xs text-gray-300 pl-1">
              <span className="text-blue-500 font-extrabold mt-0.5">•</span>
              <span>{trimmed.replace(/^-\s*/, '')}</span>
            </div>
          );
        }
        return trimmed ? (
          <p key={`${idx}-${lIdx}`} className="text-xs text-gray-300 my-2 leading-relaxed">
            {trimmed}
          </p>
        ) : null;
      });
    });
  };

  // Filter list
  const filteredFindings = findings.filter((f) => {
    const matchesSearch = 
      f.title.toLowerCase().includes(search.toLowerCase()) || 
      f.resourceArn.toLowerCase().includes(search.toLowerCase());
    
    const matchesSeverity = severityFilter === 'All' || f.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const severities = ['All', 'Critical', 'High', 'Medium', 'Low'];

  return (
    <div className="space-y-6 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Security Findings</h2>
          <p className="text-sm text-gray-400 mt-1">Audit trail listing all configuration misconfigurations and policy audits raised by active scanners.</p>
        </div>
        <button
          onClick={fetchFindings}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-semibold active:scale-95 transition-all"
        >
          <HiOutlineRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter and Search Bar controls */}
      <div className="flex flex-col sm:flex-row gap-4 bg-[#111827] border border-gray-800 rounded-xl p-4 cyber-glass">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3 top-3.5 text-gray-500 h-4 w-4" />
          <input
            type="text"
            placeholder="Search findings by title, resource name, or ARN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-black border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-black border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition"
          >
            {severities.map((sev) => (
              <option key={sev} value={sev}>{sev === 'All' ? 'All Severities' : `${sev} Severity`}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Findings inventory list */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredFindings.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-gray-800 rounded-xl bg-[#111827]/30">
          <HiOutlineShieldExclamation className="h-12 w-12 text-gray-600 mb-2" />
          <p className="text-sm font-semibold text-white">No active vulnerability records found</p>
          <p className="text-xs text-gray-500 mt-1">Your cloud systems are secure, or a scan needs to be executed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFindings.map((finding) => {
            let badgeStyle = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            let cardStyle = 'border-gray-800 bg-[#111827]/40 hover:border-gray-700';

            if (finding.severity === 'Critical') {
              badgeStyle = 'bg-red-500/10 text-red-400 border-red-500/20';
              cardStyle = 'border-red-500/20 bg-red-950/5 hover:border-red-500/40';
            } else if (finding.severity === 'High') {
              badgeStyle = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
              cardStyle = 'border-orange-500/20 bg-orange-950/5 hover:border-orange-500/40';
            } else if (finding.severity === 'Medium') {
              badgeStyle = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
              cardStyle = 'border-yellow-500/20 bg-yellow-950/5 hover:border-yellow-500/40';
            }

            return (
              <div
                key={finding._id}
                onClick={() => handleFindingSelect(finding)}
                className={`p-5 border rounded-xl flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 cursor-pointer transition-all duration-150 ${cardStyle}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${badgeStyle}`}>
                      {finding.severity}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      CIS: {finding.complianceMapping?.cisAWS} • NIST: {finding.complianceMapping?.nist}
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-white">{finding.title}</h4>
                  <p className="text-xs text-gray-400 select-all font-mono break-all">{finding.resourceArn}</p>
                  <p className="text-xs text-gray-300 leading-relaxed mt-2">{finding.description}</p>
                </div>
                <div className="flex flex-row sm:flex-col sm:items-end justify-between items-center sm:gap-2 pt-2 sm:pt-0">
                  <span className="text-[10px] font-mono text-gray-500 uppercase px-2 py-0.5 bg-black/40 border border-gray-800 rounded">
                    {finding.resourceId?.service || 'Cloud Asset'}
                  </span>
                  <span className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-2 flex items-center space-x-1">
                    <HiOutlineSparkles className="h-3 w-3" />
                    <span>Explain Fix</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- SLIDING DRAWER AI ASSISTANT PANEL --- */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md border-l border-gray-800 bg-gray-950 p-6 flex flex-col justify-between shadow-2xl">
                
                {/* Drawer Header */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-blue-400">
                      <HiOutlineSparkles className="h-5 w-5 animate-pulse" />
                      <h3 className="text-base font-bold tracking-tight text-white uppercase font-sans">AI Remediation Assistant</h3>
                    </div>
                    <button
                      onClick={() => setSelectedFinding(null)}
                      className="p-1 rounded-lg border border-gray-800 text-gray-500 hover:text-white hover:border-gray-700 bg-gray-900/50 active:scale-95 transition-all"
                    >
                      <HiX className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Vulnerability Metadata Header Card */}
                  <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        selectedFinding.severity === 'Critical' 
                          ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                          : selectedFinding.severity === 'High'
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }`}>
                        {selectedFinding.severity}
                      </span>
                      <span className="text-[10px] font-mono text-gray-500">
                        {selectedFinding.resourceId?.service} • {selectedFinding.resourceId?.type}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-2">{selectedFinding.title}</h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{selectedFinding.description}</p>
                  </div>
                </div>

                {/* AI Explanation Content Body */}
                <div className="flex-1 my-6 overflow-y-auto pr-1 custom-scrollbar">
                  {loadingAi ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      <p className="text-xs text-gray-400 font-medium">Google Gemini is compiling audit recommendations...</p>
                    </div>
                  ) : (
                    <div className="space-y-2 leading-relaxed">
                      {renderMarkdown(aiResponse)}
                    </div>
                  )}
                </div>

                {/* Drawer Footer Warning */}
                <div className="border-t border-gray-800 pt-4 text-[10px] text-gray-500 leading-normal bg-gray-950">
                  <span className="font-bold text-yellow-500 uppercase mr-1">Remediation Disclaimer:</span>
                  AI suggestions are for guidance purposes. Always audit generated CLI command blocks inside isolated staging environments before deploying to live production infrastructures.
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityFindings;
