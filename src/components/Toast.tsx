import React, { useEffect, useState } from 'react';
import { useToastStore } from '../hooks/useToast';

interface ToastItemProps {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ id, message, type, onRemove }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Start exit animation 500ms before removal
    const timer = setTimeout(() => {
      setExiting(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`toast toast-${type} ${exiting ? 'toast-exit' : 'toast-enter'}`}
      onClick={() => onRemove(id)}
    >
      <span className="toast-icon">
        {type === 'success' && '\u2713'}
        {type === 'error' && '\u2717'}
        {type === 'info' && '\u2139'}
      </span>
      <span className="toast-message">{message}</span>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onRemove={removeToast}
        />
      ))}
    </div>
  );
};
