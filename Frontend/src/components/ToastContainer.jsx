import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeToast } from '../store/UiSlice';
import { undoLastAction } from '../store/TaskSlice';
import { CheckCircle2, AlertCircle, Info, RotateCcw, X } from 'lucide-react';

export default function ToastContainer() {
    const toasts = useSelector((state) => state.ui.toasts);
    const dispatch = useDispatch();

    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none font-sans">
            {toasts.map((toast) => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onDismiss={() => dispatch(removeToast(toast.id))}
                    onUndo={() => {
                        dispatch(undoLastAction());
                        dispatch(removeToast(toast.id));
                    }}
                />
            ))}
        </div>
    );
}

function ToastItem({ toast, onDismiss, onUndo }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss();
        }, 4500);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />;
            case 'error':
                return <AlertCircle size={16} className="text-red-500 shrink-0" />;
            default:
                return <Info size={16} className="text-primary shrink-0" />;
        }
    };

    return (
        <div className="pointer-events-auto flex items-center justify-between p-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg shadow-black/5 text-gray-900 dark:text-gray-100 text-xs animate-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                {getIcon()}
                <span className="font-medium truncate">{toast.message}</span>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
                {toast.canUndo && (
                    <button
                        onClick={onUndo}
                        className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                        <RotateCcw size={12} />
                        <span>Undo</span>
                    </button>
                )}
                <button
                    onClick={onDismiss}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}
