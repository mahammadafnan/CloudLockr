import React, { createContext, useContext, useState, useEffect } from 'react';

const CloudContext = createContext();

export const CloudProvider = ({ children }) => {
  // Saved selected cloud provider: 'ALL', 'AWS', 'GCP', 'AZURE'
  const [selectedCloud, setSelectedCloud] = useState(() => {
    return localStorage.getItem('cloudlockr_selected_cloud') || 'ALL';
  });

  useEffect(() => {
    localStorage.setItem('cloudlockr_selected_cloud', selectedCloud);
  }, [selectedCloud]);

  return (
    <CloudContext.Provider value={{ selectedCloud, setSelectedCloud }}>
      {children}
    </CloudContext.Provider>
  );
};

export const useCloud = () => {
  const context = useContext(CloudContext);
  if (!context) {
    throw new Error('useCloud must be used within a CloudProvider');
  }
  return context;
};
