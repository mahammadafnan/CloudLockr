import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useCloud } from '../context/CloudContext';
import { 
  HiOutlineSearch, 
  HiOutlineDatabase, 
  HiOutlineRefresh, 
  HiChevronDown, 
  HiChevronUp,
  HiOutlineSparkles,
  HiOutlineCheckCircle,
  HiOutlineExclamation
} from 'react-icons/hi';

const ResourceExplorer = () => {
  const navigate = useNavigate();
  const { selectedCloud } = useCloud();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const [findings, setFindings] = useState([]);
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const [resResources, resFindings] = await Promise.all([
        axios.get('/api/dashboard/resources'),
        axios.get('/api/dashboard/findings')
      ]);
      
      if (resResources.data.success) {
        setResources(resResources.data.resources || []);
      }
      if (resFindings.data.success) {
        setFindings(resFindings.data.findings || []);
      }
    } catch (error) {
      console.error('[Resources API] Error:', error.message);
      toast.error('Failed to query resource inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleRowClick = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Filter list by cloud provider first
  const cloudFilteredResources = resources.filter(res => {
    if (!selectedCloud || selectedCloud === 'ALL') return true;
    const arnStr = res.arn || res.resourceArn || '';
    const provider = res.cloudProvider || (arnStr.includes('gcp') ? 'GCP' : arnStr.includes('azure') ? 'AZURE' : 'AWS');
    return provider.toUpperCase() === selectedCloud.toUpperCase();
  });

  const filteredResources = cloudFilteredResources.filter((res) => {
    const nameStr = res.name || '';
    const arnStr = res.arn || res.resourceArn || '';
    const matchesSearch = 
      nameStr.toLowerCase().includes(search.toLowerCase()) || 
      arnStr.toLowerCase().includes(search.toLowerCase());
    const matchesService = serviceFilter === 'All' || res.service === serviceFilter;
    return matchesSearch && matchesService;
  });

  const services = ['All', ...new Set(cloudFilteredResources.map((r) => r.service))];

  // Resource aggregation counts (Supports AWS, GCP, and Azure)
  const s3Count = cloudFilteredResources.filter(r => r.service === 'S3' || r.service === 'GCS' || r.service === 'BlobStorage' || r.service === 'StorageAccount').length;
  const ec2Count = cloudFilteredResources.filter(r => r.service === 'EC2' || r.service === 'GCE' || r.service === 'AzureVM' || r.service === 'VirtualMachine').length;
  const iamCount = cloudFilteredResources.filter(r => r.service === 'IAM' || r.service === 'EntraID' || r.service === 'RoleAssignment').length;
  const sgCount = cloudFilteredResources.filter(r => r.service === 'Security Groups' || r.service === 'Firewall' || r.service === 'NSG').length;

  return (
    <div className="space-y-8 text-black select-none font-sans" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-black" style={{ letterSpacing: '-0.8px' }}>Resource Findings</h2>
          <p className="text-sm text-gray-500 mt-1">Full inventory of cloud assets discovered during security scans.</p>
        </div>
        <button
          onClick={fetchResources}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 text-black rounded-xl text-xs font-bold active:scale-95 transition-all border border-[#e6e8eb] shadow-sm"
        >
          <HiOutlineRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload Assets</span>
        </button>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-[#f0fdf4] border border-[#c3f4b0] rounded-[1.5rem] p-5 shadow-sm">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            {selectedCloud === 'AWS' ? 'S3 Buckets' : selectedCloud === 'GCP' ? 'GCS Buckets' : selectedCloud === 'AZURE' ? 'Blob Storage' : 'Storage Buckets'}
          </span>
          <h3 className="text-2xl font-black text-black mt-1.5">{loading ? '-' : s3Count}</h3>
        </div>
        <div className="bg-[#f0fdfa] border border-[#bfebe3] rounded-[1.5rem] p-5 shadow-sm">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            {selectedCloud === 'AWS' ? 'EC2 Instances' : selectedCloud === 'GCP' ? 'GCE Instances' : selectedCloud === 'AZURE' ? 'Azure VMs' : 'Compute Instances'}
          </span>
          <h3 className="text-2xl font-black text-black mt-1.5">{loading ? '-' : ec2Count}</h3>
        </div>
        <div className="bg-[#fffdf0] border border-[#fce9a0] rounded-[1.5rem] p-5 shadow-sm">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            {selectedCloud === 'AZURE' ? 'Entra ID Users' : 'IAM Identities'}
          </span>
          <h3 className="text-2xl font-black text-black mt-1.5">{loading ? '-' : iamCount}</h3>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-[1.5rem] p-5 shadow-sm">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            {selectedCloud === 'AWS' ? 'Security Groups' : selectedCloud === 'GCP' ? 'VPC Firewalls' : selectedCloud === 'AZURE' ? 'NSG Rules' : 'Security Groups'}
          </span>
          <h3 className="text-2xl font-black text-black mt-1.5">{loading ? '-' : sgCount}</h3>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white border border-[#e6e8eb] rounded-[1.5rem] p-4 shadow-sm">
        <div className="relative flex-grow">
          <HiOutlineSearch className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by resource name, service or ARN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-[#e6e8eb] rounded-xl text-xs text-black placeholder-gray-400 outline-none focus:bg-white focus:border-black transition"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="w-full px-3 py-3 bg-gray-50 border border-[#e6e8eb] rounded-xl text-xs text-black focus:outline-none focus:bg-white focus:border-black cursor-pointer transition font-semibold"
          >
            {services.map((svc) => (
              <option key={svc} value={svc}>{svc === 'All' ? 'All Services' : svc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid inventory list */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-[#e6e8eb] rounded-[2rem] bg-white">
          <HiOutlineDatabase className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm font-bold text-black">No cloud resources found</p>
          <p className="text-xs text-gray-500 mt-1">Execute a scan from the dashboard to ingest AWS account boundaries.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#e6e8eb] rounded-[2rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-[#f9fafb] text-[10px] uppercase font-bold tracking-wider text-gray-400">
                  <th className="p-5 pl-8">Resource Name</th>
                  <th className="p-5">Service</th>
                  <th className="p-5">Type</th>
                  <th className="p-5">Audit Status</th>
                  <th className="p-5 pr-8 text-right">Expand</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {filteredResources.map((res) => {
                  const isExpanded = expandedId === res._id;
                  
                  // Dynamically calculate compliance based on active findings for this specific resource
                  const resourceFindings = findings.filter(f => 
                    f.status === 'Active' && 
                    f.resourceId && 
                    (f.resourceId === res._id || f.resourceId._id === res._id)
                  );
                  
                  let realCompliance = 100;
                  const hasCritical = resourceFindings.some(f => f.severity === 'Critical');
                  const hasHigh = resourceFindings.some(f => f.severity === 'High');
                  const hasMedium = resourceFindings.some(f => f.severity === 'Medium');
                  
                  if (hasCritical) realCompliance = 0;
                  else if (hasHigh) realCompliance = 45;
                  else if (hasMedium) realCompliance = 75;
                  else if (resourceFindings.length > 0) realCompliance = 90;
                  
                  return (
                    <React.Fragment key={res._id}>
                      <tr 
                        onClick={() => handleRowClick(res._id)} 
                        className="hover:bg-gray-50/70 transition cursor-pointer select-none"
                      >
                        <td className="p-5 pl-8 font-bold text-black text-sm">{res.name}</td>
                        <td className="p-5">
                          <span className="px-3 py-1 rounded-full bg-gray-50 border border-gray-200 font-mono text-[10px] font-bold text-black">
                            {res.service}
                          </span>
                        </td>
                        <td className="p-5 text-gray-500 font-mono text-[10px] font-semibold">{res.type}</td>
                        <td className="p-5">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  realCompliance >= 90 ? 'bg-[#39ff14]' : realCompliance >= 75 ? 'bg-amber-400' : 'bg-red-500'
                                }`}
                                style={{ width: `${realCompliance}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-500 font-mono">{realCompliance}% compliant</span>
                          </div>
                        </td>
                        <td className="p-5 pr-8 text-right text-gray-400">
                          {isExpanded ? <HiChevronUp size={16} /> : <HiChevronDown size={16} />}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="bg-gray-50/50 p-6 border-b border-gray-100">
                            <div className="space-y-4 max-w-4xl">
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase text-gray-400 font-bold tracking-widest">Resource ARN</span>
                                <div className="p-3 bg-white border border-[#e6e8eb] rounded-xl font-mono text-xs text-black break-all select-all font-semibold shadow-sm">
                                  {res.resourceArn}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                                <div className="p-4 bg-white border border-[#e6e8eb] rounded-xl shadow-sm space-y-2">
                                  <span className="text-[9px] uppercase text-gray-400 font-bold tracking-widest block">Resource Details</span>
                                  <div className="space-y-1.5 text-xs text-gray-600 font-medium">
                                    <div className="flex justify-between">
                                      <span>Last Scanned:</span>
                                      <span className="text-black font-semibold">{new Date(res.lastScannedAt || Date.now()).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Configuration Audit:</span>
                                      <span className={`${realCompliance === 100 ? 'text-black' : 'text-red-500'} font-semibold`}>
                                        {realCompliance === 100 ? 'Verified compliant' : `${resourceFindings.length} active vulnerabilities`}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-4 bg-white border border-[#e6e8eb] rounded-xl shadow-sm space-y-3 flex flex-col justify-between">
                                  <div>
                                    <span className="text-[9px] uppercase text-gray-400 font-bold tracking-widest block">Policy Evaluation</span>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                      Configuration is scanned dynamically against CIS framework metrics to establish access controls sanity.
                                    </p>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      toast.success('Opening AI Remediation dashboard...');
                                      navigate('/findings');
                                    }}
                                    className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-[#39ff14] hover:bg-[#32e612] text-black text-xs font-bold rounded-xl transition shadow-sm w-full"
                                  >
                                    <HiOutlineSparkles size={16} />
                                    <span>Remediate Configuration</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceExplorer;
