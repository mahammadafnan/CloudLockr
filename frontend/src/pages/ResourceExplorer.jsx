import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { HiOutlineSearch, HiOutlineDatabase, HiOutlineRefresh } from 'react-icons/hi';

const ResourceExplorer = () => {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('All');

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/dashboard/resources');
      if (res.data.success) {
        setResources(res.data.resources || []);
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

  // Filter and search lists
  const filteredResources = resources.filter((res) => {
    const matchesSearch = 
      res.name.toLowerCase().includes(search.toLowerCase()) || 
      res.resourceArn.toLowerCase().includes(search.toLowerCase());
    
    const matchesService = serviceFilter === 'All' || res.service === serviceFilter;
    return matchesSearch && matchesService;
  });

  const services = ['All', ...new Set(resources.map((r) => r.service))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Resource Explorer</h2>
          <p className="text-sm text-gray-400 mt-1">Full inventory of AWS cloud assets discovered during security scans.</p>
        </div>
        <button
          onClick={fetchResources}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-semibold active:scale-95 transition-all"
        >
          <HiOutlineRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload Assets</span>
        </button>
      </div>

      {/* Filter and Search Bar controls */}
      <div className="flex flex-col sm:flex-row gap-4 bg-[#111827] border border-gray-800 rounded-xl p-4 cyber-glass">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3 top-3.5 text-gray-500 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by resource name, type, or ARN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-black border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-black border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition"
          >
            {services.map((svc) => (
              <option key={svc} value={svc}>{svc === 'All' ? 'All Services' : svc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid inventory list or table */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-gray-800 rounded-xl bg-[#111827]/30">
          <HiOutlineDatabase className="h-12 w-12 text-gray-600 mb-2" />
          <p className="text-sm font-semibold text-white">No cloud resources inventoried</p>
          <p className="text-xs text-gray-500 mt-1">Try triggering a new security scan from the dashboard to ingest assets.</p>
        </div>
      ) : (
        <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden cyber-glass">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-black/40 text-[10px] uppercase font-bold tracking-wider text-gray-500">
                  <th className="p-4">Resource Name</th>
                  <th className="p-4">Service</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">ARN</th>
                  <th className="p-4">Ingested At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-xs">
                {filteredResources.map((res) => (
                  <tr key={res._id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-semibold text-white">{res.name}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[10px]">
                        {res.service}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300 font-mono text-[10px]">{res.type}</td>
                    <td className="p-4 text-gray-400 font-mono select-all truncate max-w-[200px]" title={res.resourceArn}>
                      {res.resourceArn}
                    </td>
                    <td className="p-4 text-gray-400">
                      {new Date(res.lastScannedAt || Date.now()).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceExplorer;
