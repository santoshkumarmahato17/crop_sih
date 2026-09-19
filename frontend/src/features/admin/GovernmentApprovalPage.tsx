import React, { useEffect, useState } from 'react';
import { adminService, PendingGovernmentUser } from '@/services/adminService';
import { Check, X, ShieldAlert, AlertCircle, Building2, UserCircle2, Clock } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

export const GovernmentApprovalPage: React.FC = () => {
  const [requests, setRequests] = useState<PendingGovernmentUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getPendingGovernmentRequests();
      setRequests(data);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to fetch pending requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (userId: string) => {
    try {
      await adminService.approveGovernmentAccount(userId);
      setRequests(prev => prev.filter(r => r.id !== userId));
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Approval failed');
    }
  };

  const handleReject = async (userId: string) => {
    if (!window.confirm('Are you sure you want to reject and deactivate this account?')) return;
    try {
      await adminService.rejectGovernmentAccount(userId);
      setRequests(prev => prev.filter(r => r.id !== userId));
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Rejection failed');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Government Account Approvals</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Review and verify new regional administration accounts</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full" />
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <ShieldAlert className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No Pending Requests</h3>
          <p className="text-sm text-slate-500">All government accounts have been reviewed.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map(req => (
            <div key={req.id} className="p-5 rounded-2xl bg-white dark:bg-surface-darkCard border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 flex-1">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                    <UserCircle2 className="w-4 h-4 text-slate-400" />
                    {req.full_name}
                  </div>
                  <div className="text-sm text-slate-500">{req.email}</div>
                  {req.phone_number && <div className="text-xs text-slate-400">{req.phone_number}</div>}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300 font-semibold text-sm">
                    <Building2 className="w-4 h-4" />
                    {req.organization_name || 'N/A'}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Dept: {req.department || 'N/A'}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Region: {req.assigned_region || 'N/A'}
                  </div>
                </div>

                <div className="space-y-1 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    Requested: {new Date(req.created_at).toLocaleDateString()}
                  </div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 w-fit">
                    PENDING VERIFICATION
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleReject(req.id)}
                  className="px-4 py-2 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-sm font-bold transition flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={() => handleApprove(req.id)}
                  className="px-4 py-2 rounded-xl text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-sm font-bold transition flex items-center gap-1"
                >
                  <Check className="w-4 h-4" /> Approve
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};
