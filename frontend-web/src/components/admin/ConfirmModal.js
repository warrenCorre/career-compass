// frontend-web/src/components/admin/ConfirmModal.js - Added confirmDisabled prop

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel", 
  type = "danger",
  confirmDisabled = false
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      button: "bg-red-500 hover:bg-red-600",
      icon: "text-red-500",
      border: "border-red-200",
      bg: "bg-red-50"
    },
    warning: {
      button: "bg-amber-500 hover:bg-amber-600",
      icon: "text-amber-500",
      border: "border-amber-200",
      bg: "bg-amber-50"
    },
    info: {
      button: "bg-primary-500 hover:bg-primary-600",
      icon: "text-primary-500",
      border: "border-primary-200",
      bg: "bg-primary-50"
    },
  };

  const style = typeStyles[type] || typeStyles.danger;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-2xl max-w-md w-full pointer-events-auto shadow-xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-full ${style.bg}`}>
                    <ExclamationTriangleIcon className={`h-6 w-6 ${style.icon}`} />
                  </div>
                  <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                    <XMarkIcon className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600">{message}</p>
              </div>
              
              <div className="p-6 pt-0 flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  disabled={confirmDisabled}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={confirmDisabled}
                  className={`px-4 py-2 rounded-lg text-white font-medium ${style.button} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {confirmDisabled ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      {confirmText}
                    </span>
                  ) : (
                    confirmText
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;