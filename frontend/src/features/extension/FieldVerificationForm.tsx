import { useState } from 'react';
import { Camera, MapPin, Search, CheckCircle, XCircle, Beaker, FileText } from 'lucide-react';
import { apiClient as api } from '@/services/apiClient';

interface VerificationCase {
  id: string;
  case_number: string;
  status: string;
  priority: string;
  suspected_condition: string;
  farm_id: string;
}

export default function FieldVerificationForm({ verificationCase, onSuccess }: { verificationCase: VerificationCase, onSuccess: () => void }) {
  const [decision, setDecision] = useState<'CONFIRMED' | 'REJECTED' | 'UNCERTAIN' | 'LAB_REFERRAL' | 'REQUEST_MORE_EVIDENCE' | ''>('');
  const [notes, setNotes] = useState('');
  const [condition, setCondition] = useState(verificationCase.suspected_condition);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!decision) return;
    
    try {
      setLoading(true);
      await api.post(`/api/v1/extension/cases/${verificationCase.id}/verify`, {
        decision,
        expert_notes: notes,
        confirmed_condition: condition
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to submit verification', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm max-w-4xl mx-auto bg-white dark:bg-gray-900 overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400">FIELD VERIFICATION</span>
              <span className="font-mono text-sm text-gray-500">{verificationCase.case_number}</span>
            </div>
            <h2 className="text-2xl font-semibold">Field Evidence Review</h2>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" /> AI Findings
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Suspected Condition</p>
              <p className="font-semibold text-gray-900 dark:text-white text-lg mb-4">{verificationCase.suspected_condition}</p>
              
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Farm ID: {verificationCase.farm_id}</span>
              </div>
              
              <div className="mt-4 p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-white dark:bg-gray-900 h-32">
                <Camera className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-sm">Farmer Image 1</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" /> Ground Truth Decision
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Verification Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setDecision('CONFIRMED')}
                    className={`p-3 border rounded-lg flex items-center gap-2 transition-colors ${decision === 'CONFIRMED' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/30' : 'bg-white border-gray-200 text-gray-700 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <CheckCircle className="w-5 h-5" /> Confirm AI
                  </button>
                  <button 
                    onClick={() => setDecision('REJECTED')}
                    className={`p-3 border rounded-lg flex items-center gap-2 transition-colors ${decision === 'REJECTED' ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-900/30' : 'bg-white border-gray-200 text-gray-700 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <XCircle className="w-5 h-5" /> Reject AI
                  </button>
                  <button 
                    onClick={() => setDecision('LAB_REFERRAL')}
                    className={`p-3 border rounded-lg flex items-center gap-2 transition-colors ${decision === 'LAB_REFERRAL' ? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-900/30' : 'bg-white border-gray-200 text-gray-700 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <Beaker className="w-5 h-5" /> Escalate to Lab
                  </button>
                  <button 
                    onClick={() => setDecision('REQUEST_MORE_EVIDENCE')}
                    className={`p-3 border rounded-lg flex items-center gap-2 transition-colors ${decision === 'REQUEST_MORE_EVIDENCE' ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30' : 'bg-white border-gray-200 text-gray-700 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <Camera className="w-5 h-5" /> More Evidence
                  </button>
                </div>
              </div>
              
              {decision === 'CONFIRMED' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmed Condition</label>
                  <input 
                    type="text" 
                    value={condition} 
                    onChange={e => setCondition(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-800 dark:border-gray-700" 
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Field Notes</label>
                <textarea 
                  rows={4}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Enter details from your physical field inspection..."
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-800 dark:border-gray-700"
                ></textarea>
              </div>
              
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 p-4">
        <button 
          onClick={onSuccess}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={handleSubmit}
          disabled={!decision || loading}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? 'Submitting...' : 'Submit Field Verification'}
        </button>
      </div>
    </div>
  );
}
