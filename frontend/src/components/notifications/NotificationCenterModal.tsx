import React, { useEffect, useState } from 'react';
import {
  Bell,
  CheckCheck,
  CheckCircle,
  Radio,
  X,
} from 'lucide-react';
import { alertService } from '@/services/alertService';
import { NotificationCenterSummary } from '@/types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateCount?: (count: number) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onUpdateCount,
}) => {
  const [data, setData] = useState<NotificationCenterSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'CRITICAL'>('ALL');

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await alertService.getNotifications(false);
      setData(res);
      if (onUpdateCount) {
        onUpdateCount(res.total_unread);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await alertService.markRead([id]);
      if (data) {
        const updated = data.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        );
        const newUnread = Math.max(0, data.total_unread - 1);
        setData({
          ...data,
          total_unread: newUnread,
          notifications: updated,
        });
        if (onUpdateCount) onUpdateCount(newUnread);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await alertService.markAllRead();
      if (data) {
        const updated = data.notifications.map((n) => ({ ...n, is_read: true }));
        setData({
          ...data,
          total_unread: 0,
          notifications: updated,
        });
        if (onUpdateCount) onUpdateCount(0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const notifications = data?.notifications || [];
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.is_read;
    if (filter === 'CRITICAL') return n.title.toLowerCase().includes('rust') || n.title.toLowerCase().includes('critical');
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900/85 dark:bg-slate-950/85 backdrop-blur-2xl border-l border-white/15 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Notification Center</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {data?.total_unread || 0} unread alerts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data && data.total_unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition flex items-center gap-1 font-medium"
              >
                <CheckCheck className="w-3 h-3 text-emerald-400" />
                <span>Mark all read</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-5 py-2.5 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 text-xs">
          {[
            { key: 'ALL', label: 'All' },
            { key: 'UNREAD', label: `Unread (${data?.total_unread || 0})` },
            { key: 'CRITICAL', label: 'Critical' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key as any)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                filter === tab.key
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Loading alerts...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-1">
              <CheckCircle className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-400">No notifications in this view</p>
              <p className="text-[11px]">All crop health telemetry is currently nominal.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-2 ${
                  !notif.is_read
                    ? 'bg-slate-950/90 border-emerald-500/40 shadow-sm shadow-emerald-950/20'
                    : 'bg-slate-950/40 border-slate-800/80 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                    )}
                    <h4 className="font-bold text-slate-200 text-xs">{notif.title}</h4>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{notif.content}</p>

                {/* Delivery Channel Tags */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-500">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Radio className="w-3 h-3 text-emerald-400" />
                      <span>In-System</span>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span>SMS / Email Ready</span>
                  </div>

                  {!notif.is_read && (
                    <span className="text-emerald-400 font-semibold hover:underline">
                      Click to mark read
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
