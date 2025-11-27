
import React from 'react';
import { XIcon, LogoutIcon } from './Icons';

interface LogoutModalProps {
    onClose: () => void;
    onConfirm: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center">
                 <div className="flex justify-end">
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LogoutIcon className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">خروج از سامانه</h3>
                <p className="text-gray-600 mb-6">آیا مایل به خروج از حساب کاربری خود هستید؟</p>
                <div className="flex justify-center gap-x-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
                    >
                        خیر
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                    >
                        بله
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogoutModal;
