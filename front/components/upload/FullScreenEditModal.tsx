import React, { useState, useEffect } from 'react';
import DictionaryTool from '../dictionary/DictionaryTool';
import { XIcon } from '../Icons';

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
        <div className="fixed inset-0 bg-white z-50 animate-fade-in p-4 sm:p-6 lg:p-8 flex flex-col">
            <header className="flex justify-between items-center pb-4 border-b mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                    <XIcon className="w-6 h-6" />
                </button>
            </header>
            
            <main className="flex-grow flex flex-col overflow-hidden">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full flex-grow p-4 border border-gray-300 rounded-lg resize-none focus:ring-sky-500 focus:border-sky-500 text-base leading-relaxed"
                    placeholder="متن خود را اینجا ویرایش کنید..."
                />
                <DictionaryTool />
            </main>
            
            <footer className="flex justify-end items-center gap-4 pt-4 mt-4 border-t">
                <button onClick={onClose} className="text-gray-600 font-medium py-2 px-6 rounded-lg hover:bg-gray-100 transition">
                    لغو
                </button>
                <button onClick={handleSave} className="bg-sky-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-600 transition">
                    ذخیره تغییرات
                </button>
            </footer>
        </div>
    );
};

export default FullScreenEditModal;