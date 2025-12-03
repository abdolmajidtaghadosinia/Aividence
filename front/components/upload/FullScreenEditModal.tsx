import React, { useState, useEffect } from 'react';
import DictionaryTool from '../dictionary/DictionaryTool';
import { XIcon } from '../Icons';
import ModalPortal from '../ModalPortal';

interface FullScreenEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialText: string;
    onSave: (newText: string) => void;
    title: string;
}

const FullScreenEditModal: React.FC<FullScreenEditModalProps> = ({ isOpen, onClose, initialText, onSave, title }) => {
    const [text, setText] = useState(initialText);

    useEffect(() => {
        if (isOpen) {
            setText(initialText);
        }
    }, [isOpen, initialText]);
    
    if (!isOpen) return null;

    const handleSave = () => {
        onSave(text);
        onClose();
    };

    return (
        <ModalPortal>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col m-4">
                    <header className="flex items-center justify-between gap-4 px-6 py-4 border-b bg-gradient-to-l from-sky-50 to-white">
                        <div className="space-y-1">
                            <p className="text-xs text-sky-600 font-semibold">ویرایش پیشرفته</p>
                            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-800 px-3 py-1 rounded-full font-semibold">
                                {text.length.toLocaleString('fa-IR')} کاراکتر
                            </span>
                            <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </header>

                    <main className="flex-grow flex flex-col gap-4 px-6 py-4 overflow-hidden">
                        <textarea
                            dir="rtl"
                            autoFocus
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="w-full flex-grow min-h-[50vh] p-4 bg-slate-50 text-gray-900 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-base leading-relaxed shadow-inner placeholder:text-gray-400"
                            placeholder="متن خود را اینجا ویرایش کنید..."
                        />
                        <DictionaryTool />
                    </main>

                    <footer className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 px-6 py-4 border-t bg-gray-50">
                        <p className="text-sm text-gray-600">پس از ذخیره، متن جدید به عنوان نسخه ویرایش‌شده ذخیره می‌شود و در مراحل بعدی نمایش داده خواهد شد.</p>
                        <div className="flex items-center gap-3">
                            <button onClick={onClose} className="text-gray-700 font-medium py-2 px-6 rounded-lg hover:bg-gray-100 transition">
                                لغو
                            </button>
                            <button onClick={handleSave} className="bg-sky-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-600 transition shadow-md">
                                ذخیره تغییرات
                            </button>
                        </div>
                    </footer>
                </div>
            </div>
        </ModalPortal>
    );
};

export default FullScreenEditModal;