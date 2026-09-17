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
    <div className="fixed inset-0 z-50 bg-slate-950/30 dark:bg-agri-950/60 backdrop-blur-md flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white/85 dark:bg-surface-darkBg/80 backdrop-blur-2xl border-l border-agri-200/50/80 dark:border-white/15 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 transition-colors">
        {/* Header */}
        <div className="p-5 border-b border-agri-200/50/80 dark:border-white/10 bg-surface-light/60 dark:bg-white/5 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-agri-500/10 dark:bg-agri-500/15 border border-agri-500/25 dark:border-emerald-400/30 text-agri-600 dark:text-agri-300 backdrop-blur-sm">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-agri-900 dark:text-white text-sm tracking-tight drop-shadow-sm">Notification Center</h3>
              <p className="text-[11px] text-agri-500/70 dark:text-agri-400/70 font-mono">
                {data?.total_unread || 0} unread alerts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data && data.total_unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-2.5 py-1 rounded-xl bg-agri-50 hover:bg-agri-100 dark:bg-white/10 dark:hover:bg-white/20 border border-agri-200/50 dark:border-white/15 text-[11px] text-agri-700 dark:text-agri-200 transition flex items-center gap-1 font-medium backdrop-blur-sm"
              >
                <CheckCheck className="w-3 h-3 text-agri-600 dark:text-agri-400" />
                <span>Mark all read</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-agri-500/70 dark:text-agri-300 hover:text-agri-900 dark:hover:text-white bg-agri-50 dark:bg-white/5 hover:bg-agri-100 dark:hover:bg-white/15 border border-agri-200/50 dark:border-white/10 transition backdrop-blur-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-5 py-2.5 border-b border-agri-200/50/80 dark:border-white/10 bg-surface-light/40 dark:bg-white/5 backdrop-blur-md flex items-center gap-1.5 text-xs">
          {[
            { key: 'ALL', label: 'All' },
            { key: 'UNREAD', label: `Unread (${data?.total_unread || 0})` },
            { key: 'CRITICAL', label: 'Critical' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key as any)}
              className={`px-3 py-1 rounded-xl font-bold transition backdrop-blur-sm ${
                filter === tab.key
                  ? 'bg-agri-500/15 dark:bg-agri-500/15 text-agri-700 dark:text-agri-300 border border-agri-500/25 dark:border-emerald-400/40 shadow-sm'
                  : 'text-agri-600 dark:text-agri-300 hover:text-agri-900 dark:hover:text-white bg-agri-50/60 dark:bg-white/5 hover:bg-agri-100/60 dark:hover:bg-white/10 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="p-12 text-center text-agri-500/70 dark:text-agri-300 space-y-2">
              <div className="w-6 h-6 border-2 border-emerald-500 dark:border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Loading alerts...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center text-agri-500/70 dark:text-agri-300 space-y-2 bg-surface-light/70 dark:bg-white/5 rounded-3xl border border-agri-200/50 dark:border-white/10 backdrop-blur-md my-4">
              <CheckCircle className="w-9 h-9 mx-auto text-agri-600 dark:text-agri-400/80 mb-2" />
              <p className="text-xs font-bold text-agri-900 dark:text-white">No notifications in this view</p>
              <p className="text-[11px] text-agri-500/70 dark:text-agri-400/70">All crop health telemetry is currently nominal.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 backdrop-blur-xl ${
                  !notif.is_read
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-400/40 shadow-md shadow-emerald-500/5 dark:shadow-emerald-950/30'
                    : 'bg-white/85 dark:bg-white/5 border-agri-200/50 dark:border-white/10 text-agri-700 dark:text-agri-300 opacity-90 hover:opacity-100 hover:bg-surface-light dark:hover:bg-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-agri-500 dark:bg-emerald-400 animate-pulse flex-shrink-0" />
                    )}
                    <h4 className="font-bold text-agri-900 dark:text-white text-xs">{notif.title}</h4>
                  </div>
                  <span className="text-[10px] text-agri-400/70 dark:text-agri-400/70 font-mono">
                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-agri-600 dark:text-agri-200 leading-relaxed">{notif.content}</p>

                {/* Delivery Channel Tags */}
                <div className="flex items-center justify-between pt-1 border-t border-agri-200/50/60 dark:border-white/10 text-[10px] text-agri-500/70 dark:text-agri-400/70">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="flex items-center gap-1 text-agri-700 dark:text-agri-300 font-semibold">
                      <Radio className="w-3 h-3 text-agri-600 dark:text-agri-400" />
                      <span>In-System</span>
                    </span>
                    <span className="text-agri-400/70 dark:text-agri-500/70">•</span>
                    <span>SMS / Email Ready</span>
                  </div>

                  {!notif.is_read && (
                    <span className="text-agri-600 dark:text-agri-400 font-semibold hover:underline">
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
