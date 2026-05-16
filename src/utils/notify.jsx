import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// Simple event bus
const bus = { toast: [], confirm: [] };
const emit = (ch, d) => bus[ch].forEach(fn => fn(d));
const sub = (ch, fn) => {
  bus[ch].push(fn);
  return () => { bus[ch] = bus[ch].filter(f => f !== fn); };
};

// ─── Toast Item ───────────────────────────────────────────────────────────────
function ToastItem({ id, message, type, onRemove }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(id), 4000);
    return () => clearTimeout(t);
  }, [id, onRemove]);

  const cfg = {
    success: { bg: 'bg-emerald-500', border: 'border-emerald-600', icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )},
    error: { bg: 'bg-red-500', border: 'border-red-600', icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    )},
    warning: { bg: 'bg-amber-500', border: 'border-amber-600', icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    )},
    info: { bg: 'bg-blue-500', border: 'border-blue-600', icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    )},
  }[type] || { bg: 'bg-blue-500', border: 'border-blue-600', icon: 'ℹ' };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl shadow-xl border ${cfg.bg} ${cfg.border} text-white min-w-[300px] max-w-sm pointer-events-auto`}
      style={{ animation: 'notifySlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
    >
      <span className="shrink-0">{cfg.icon}</span>
      <span className="text-sm font-semibold flex-1 leading-snug">{message}</span>
      <button onClick={() => onRemove(id)} className="opacity-60 hover:opacity-100 transition shrink-0 ml-1">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialogUI({ message, title, confirmText, cancelText, isDanger, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        style={{ animation: 'notifyScaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        {/* Icon */}
        <div className={`mx-auto mb-4 h-14 w-14 flex items-center justify-center rounded-full ${isDanger ? 'bg-red-100' : 'bg-blue-100'}`}>
          {isDanger ? (
            <svg className="h-7 w-7 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          ) : (
            <svg className="h-7 w-7 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <h3 className="text-center text-lg font-bold text-slate-800 mb-2">{title || 'Konfirmasi'}</h3>
        <p className="text-center text-slate-500 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
          >
            {cancelText || 'Batal'}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition ${isDanger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {confirmText || 'Ya'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Notification Manager ─────────────────────────────────────────────────────
function NotificationManager() {
  const [toasts, setToasts] = useState([]);
  const [confirmData, setConfirmData] = useState(null);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const offToast = sub('toast', ({ message, type }) => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, message, type }]);
    });
    const offConfirm = sub('confirm', (data) => setConfirmData(data));
    return () => { offToast(); offConfirm(); };
  }, []);

  const handleConfirm = (result) => {
    confirmData?.resolve(result);
    setConfirmData(null);
  };

  return (
    <>
      <div className="fixed top-4 right-4 z-[9998] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => <ToastItem key={t.id} {...t} onRemove={removeToast} />)}
      </div>
      {confirmData && (
        <ConfirmDialogUI
          {...confirmData}
          onConfirm={() => handleConfirm(true)}
          onCancel={() => handleConfirm(false)}
        />
      )}
    </>
  );
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
function init() {
  if (document.getElementById('__notify_root__')) return;
  const div = document.createElement('div');
  div.id = '__notify_root__';
  document.body.appendChild(div);
  createRoot(div).render(<NotificationManager />);
}
init();

// ─── Public API ───────────────────────────────────────────────────────────────
export function toast(message, type = 'success') {
  emit('toast', { message, type });
}

export function confirmDialog(message, options = {}) {
  return new Promise(resolve => emit('confirm', { message, resolve, ...options }));
}
