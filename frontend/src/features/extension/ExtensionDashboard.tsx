import { useState, useEffect } from 'react';
import { apiClient as api } from '@/services/apiClient';
import { MapPin, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import FieldVerificationForm from './FieldVerificationForm';

interface VerificationCase {
  id: string;
  case_number: string;
  status: string;
  priority: string;
  suspected_condition: string;
  farm_id: string;
  created_at: string;
}

export default function ExtensionDashboard() {
  const [cases, setCases] = useState<VerificationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<VerificationCase | null>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/extension/queue');
      setCases(response.data);
    } catch (error) {
      console.error('Failed to fetch extension queue', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading field verification queue...</div>;
  }

  if (selectedCase) {
    return (
      <div className="p-6">
        <button 
          onClick={() => setSelectedCase(null)}
          className="mb-4 text-sm text-blue-500 hover:underline flex items-center gap-1"
        >
          &larr; Back to Queue
        </button>
        <FieldVerificationForm 
          verificationCase={selectedCase} 
          onSuccess={() => {
            setSelectedCase(null);
            fetchCases();
          }} 
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Field Officer Operations</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Review AI flagged anomalies and verify ground truth in the field.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-sm border-none p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 font-medium">Pending Verifications</p>
              <h3 className="text-4xl font-bold mt-2">{cases.length}</h3>
            </div>
            <div className="p-3 bg-blue-400/30 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-sm border-none p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-orange-100 font-medium">High Priority</p>
              <h3 className="text-4xl font-bold mt-2">{cases.filter(c => c.priority === 'HIGH' || c.priority === 'CRITICAL').length}</h3>
            </div>
            <div className="p-3 bg-orange-400/30 rounded-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl shadow-sm border-none p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-100 font-medium">Verified Today</p>
              <h3 className="text-4xl font-bold mt-2">0</h3>
            </div>
            <div className="p-3 bg-emerald-400/30 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden bg-white dark:bg-gray-900">
        <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4">
          <h2 className="text-lg font-semibold">Regional Verification Queue</h2>
        </div>
        <div>
          {cases.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-50" />
              <p>Your queue is clear. No pending field verifications.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {cases.map((c) => (
                <div key={c.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-gray-500">{c.case_number}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getPriorityColor(c.priority)}`}>
                          {c.priority}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400">
                          AI FLAGGED
                        </span>
                      </div>
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">{c.suspected_condition}</h4>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(c.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Farm ID: {c.farm_id.substring(0, 8)}...</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setSelectedCase(c)}
                      className="px-4 py-2 bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium rounded-lg shadow-sm transition-colors"
                    >
                      Verify in Field
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
