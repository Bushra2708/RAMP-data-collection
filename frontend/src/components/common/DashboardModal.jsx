import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function DashboardModal({ title, description, onClose, children, footer }) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const openCount = Number(document.body.dataset.dashboardModalCount || 0) + 1;
    document.body.dataset.dashboardModalCount = String(openCount);
    document.body.style.overflow = 'hidden';
    document.body.classList.add('dashboard-modal-open');
    return () => {
      const nextOpenCount = Math.max(0, Number(document.body.dataset.dashboardModalCount || 1) - 1);
      if (nextOpenCount === 0) {
        delete document.body.dataset.dashboardModalCount;
        document.body.style.overflow = originalOverflow || 'auto';
        document.body.classList.remove('dashboard-modal-open');
      } else {
        document.body.dataset.dashboardModalCount = String(nextOpenCount);
      }
    };
  }, []);

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-slate-950/70 backdrop-blur-md px-3 pt-16 pb-4 sm:px-5 sm:pt-20 sm:pb-8">
      <div
        className="relative flex w-[min(1120px,calc(100vw-1.5rem))] max-h-[calc(100vh-5rem)] flex-col overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#081225] shadow-2xl sm:w-[min(1120px,calc(100vw-2.5rem))] sm:max-h-[calc(100vh-7rem)]"
      >
        <div className="shrink-0 z-20 border-b border-white/10 bg-[#081225]/95 backdrop-blur-sm p-5 flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h2 className="text-lg font-bold text-white truncate">{title}</h2>
            {description && <p className="text-xs text-slate-400 truncate">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="shrink-0 z-20 border-t border-white/10 bg-[#081225]/95 backdrop-blur-sm p-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
