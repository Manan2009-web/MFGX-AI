import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import CopilotView from './components/CopilotView';
import { fetchKpis } from './utils/api';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [kpiData, setKpiData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchKpis();
      setKpiData(data);
    } catch (err) {
      console.error(err);
      setError('Could not connect to the MFGX AI server. Please verify the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F8FA] text-slate-800 antialiased pb-12">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 flex-1">
        
        {/* Error State Banner */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-red-900">Database connection offline</h3>
                <p className="text-xs text-red-700 mt-1">{error}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={loadData}
                    className="flex items-center gap-1.5 rounded-lg bg-red-100 hover:bg-red-200 px-3 py-1.5 text-xs font-bold text-red-900 cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Retry Connection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab rendering */}
        {activeTab === 'dashboard' ? (
          <DashboardView 
            kpiData={kpiData} 
            isLoading={isLoading} 
            onRefresh={loadData} 
          />
        ) : (
          <CopilotView />
        )}
      </main>
    </div>
  );
}
