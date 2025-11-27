import React, { useState, useEffect } from 'react';
import { FileData } from '../../types';
import FullScreenEditModal from './FullScreenEditModal';
import { RefreshCwIcon, TrashIcon, CheckIcon, ArrowRightIcon, EditIcon, FileTypeIcon, FolderIcon } from '../Icons';
import { toPersianDigits } from '../../constants';
import { reprocessAudio } from '../../api/api';

interface UploadStep2Props {
    onNext: (data: Partial<FileData>) => void;
    onBack: () => void;
    data: Partial<FileData>;
}

const UploadStep2: React.FC<UploadStep2Props> = ({ onNext, onBack, data }) => {
    const [progress, setProgress] = useState(0);
    const [localData, setLocalData] = useState(data);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setProgress(100), 500);
        return () => clearTimeout(timer);
    }, []);

    // Sync localData when parent data updates (after backend fetch)
    useEffect(() => {
        setLocalData(prev => ({ ...prev, originalText: data.originalText, editedText: data.editedText }));
    }, [data.originalText, data.editedText]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setLocalData({ ...localData, [e.target.name]: e.target.value });
    };

    const handleSaveEditedText = (newText: string) => {
        setLocalData(prev => ({ ...prev, editedText: newText }));
    };

    return (
        <div className="flex-1 p-2">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">پردازش فایل و ویرایش متن</h3>
                <span className="text-sm text-gray-500">{toPersianDigits(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6"><div className="bg-sky-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div></div>
            
            {progress === 100 ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <input name="name" value={localData.name || ''} onChange={handleChange} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-sky-500 focus:border-sky-500" />
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                                <FileTypeIcon className="w-5 h-5" />
                            </div>
                            <select name="type" value={localData.type || 'صورت جلسه'} className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed appearance-none" disabled><option>صورت جلسه</option><option>درس آموخته</option></select>
                        </div>
                        <div className="relative">
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                                <FolderIcon className="w-5 h-5" />
                            </div>
                            <select name="subCollection" value={localData.subCollection || 'فنی'} onChange={handleChange} className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg bg-white appearance-none"><option>فنی</option><option>مالی</option><option>منابع انسانی</option></select>
                        </div>
                    </div>
                    
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">متن استخراج شده (فقط خواندنی)</label>
                        <div className="w-full h-64 p-3 bg-gray-100 border border-gray-300 rounded-lg overflow-y-auto leading-relaxed">
                           {localData.originalText || ''}
                        </div>
                    </div>
                     <div className="mb-6">
                         <button onClick={() => setIsEditModalOpen(true)} className="text-sky-600 font-semibold hover:underline flex items-center gap-2">
                            <EditIcon className="w-4 h-4"/>
                            <span>ویرایش متن</span>
                        </button>
                    </div>

                    <div className="flex justify-between items-center">
                        <button onClick={onBack} className="text-gray-600 font-medium py-2 px-4 rounded-lg hover:bg-gray-100 transition flex items-center gap-2">
                             <ArrowRightIcon className="w-4 h-4" />
                             <span>بازگشت</span>
                        </button>
                        <div className="flex gap-x-4">
                            <button
                                onClick={async () => {
                                    if (!localData.upload_uuid) return;
                                    try {
                                        setProgress(0);
                                        const res = await reprocessAudio(localData.upload_uuid);
                                        // Optional: handle task_id if needed
                                    } catch (e) {
                                        // noop
                                    }
                                }}
                                className="text-gray-600 font-medium py-2 px-4 rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
                            >
                                <RefreshCwIcon className="w-4 h-4" />
                                <span>پردازش مجدد</span>
                            </button>
                            {/* <button className="bg-red-100 text-red-700 font-bold py-2 px-4 rounded-lg hover:bg-red-200 transition flex items-center gap-2">
                                <TrashIcon className="w-4 h-4" />
                                <span>رد محتوا</span>
                            </button> */}
                            <button onClick={() => onNext(localData)} className="bg-sky-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-600 transition flex items-center gap-2">
                                <CheckIcon className="w-5 h-5" />
                                <span>تایید اولیه و بازبینی</span>
                            </button>
                        </div>
                    </div>

                    <FullScreenEditModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        initialText={localData.editedText || localData.originalText || ''}
                        onSave={handleSaveEditedText}
                        title="ویرایش متن استخراج شده"
                    />
                </>
            ) : (
                <div className="text-center py-10 text-gray-500">
                    <p>در حال پردازش فایل، لطفا منتظر بمانید...</p>
                </div>
            )}
        </div>
    );
};

export default UploadStep2;