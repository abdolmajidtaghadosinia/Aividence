import React, { useState } from 'react';
import { updateAudioStatus, updateAudioTextByUuid } from '../../api/api';
import { FileData } from '../../types';
import FullScreenEditModal from './FullScreenEditModal';
import { TagIcon, EditIcon, CheckIcon, ArrowRightIcon, ClipboardListIcon } from '../Icons';
import StructuredTextPreview from '../StructuredTextPreview';

interface UploadStep3Props {
    onBack: () => void;
    onFinish: (data: Partial<FileData>) => void;
    data: Partial<FileData>;
}

const UploadStep3: React.FC<UploadStep3Props> = ({ onBack, onFinish, data }) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editedText, setEditedText] = useState(data.editedText || data.processedText || data.originalText || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    React.useEffect(() => {
        setEditedText(data.editedText || data.processedText || data.originalText || '');
    }, [data.editedText, data.originalText, data.processedText]);

    const handleSaveEditedText = async (newText: string) => {
        setEditedText(newText);
        setSaveMessage(null);

        if (!data.upload_uuid) {
            setSaveMessage('شناسه فایل برای ذخیره در دسترس نیست.');
            return;
        }

        setIsSavingEdit(true);
        try {
            await updateAudioTextByUuid(data.upload_uuid, newText);
            setSaveMessage('تغییرات ذخیره شد و به عنوان متن نهایی در نظر گرفته می‌شود.');
        } catch (error) {
            console.error('Unable to persist final text', error);
            setSaveMessage('خطا در ذخیره متن. لطفا دوباره تلاش کنید.');
        } finally {
            setIsSavingEdit(false);
        }
    };
    
    const persistEditedText = async () => {
        if (!data.upload_uuid) return;
        try {
            await updateAudioTextByUuid(
                data.upload_uuid,
                editedText || data.processedText || data.originalText || '',
            );
        } catch (error) {
            console.error('Unable to persist final text', error);
        }
    };

    const handleFinalFinish = async () => {
        try {
            setIsSaving(true);
            await persistEditedText();
            onFinish({ ...data, editedText });
            if (data && (data as any).id) {
                try {
                    await updateAudioStatus(Number((data as any).id), 'A');
                } catch (e) {
                    // در صورت نیاز نمایش پیام خطا اضافه شود
                }
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
         <div className="flex-1 p-2">
             <h3 className="font-bold text-lg mb-6 text-center">بازبینی و تایید نهایی</h3>
             {saveMessage && (
                <div className={`mb-4 text-sm px-3 py-2 rounded-lg border ${isSavingEdit ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                    {isSavingEdit ? 'در حال ذخیره تغییرات...' : saveMessage}
                </div>
             )}
             <div className="flex flex-col md:flex-row gap-8">
                 <div className="w-full md:w-1/3 md:border-l md:border-gray-200 md:pl-6">
                     <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <ClipboardListIcon className="w-5 h-5 text-sky-600"/>
                        <span>مشخصات فایل</span>
                     </h4>
                     <div className="space-y-3 text-sm">
                         <p><strong className="text-gray-600">نام فایل:</strong> {data.name}</p>
                         <p><strong className="text-gray-600">نوع فایل:</strong> {data.type}</p>
                         <p><strong className="text-gray-600">زیر مجموعه:</strong> {data.subCollection}</p>
                     </div>
                      <h4 className="font-semibold text-gray-800 mt-8 mb-4 flex items-center gap-2">
                        <TagIcon className="w-5 h-5 text-sky-600"/>
                        <span>عبارات تخصصی استخراج شده</span>
                      </h4>
                     <div className="flex flex-wrap gap-2">
                         {data.extractedPhrases?.map((phrase: string) => (
                            <span key={phrase} className="bg-sky-100 text-sky-800 text-xs font-medium px-2.5 py-1.5 rounded-full">{phrase}</span>
                         ))}
                     </div>
                 </div>
                 <div className="w-full md:w-2/3">
                      <h4 className="font-semibold text-gray-800 mb-4">متن نهایی</h4>
                      <div className="bg-gray-50 p-4 rounded-lg border h-64 overflow-y-auto text-gray-700 leading-relaxed">
                          <StructuredTextPreview
                              text={editedText || data.processedText || data.originalText || ''}
                              title={data.type || 'متن نهایی'}
                              subject={data.name}
                              dateValue={data.uploadDate}
                          />
                      </div>
                      <div className="mt-4">
                        <button onClick={() => setIsEditModalOpen(true)} className="text-sky-600 font-semibold hover:underline flex items-center gap-2">
                            <EditIcon className="w-4 h-4"/>
                            <span>ویرایش متن نهایی</span>
                        </button>
                      </div>
                 </div>
             </div>
             <div className="flex justify-between items-center mt-8 pt-6 border-t">
                 <button onClick={onBack} className="text-gray-600 font-medium py-2 px-4 rounded-lg hover:bg-gray-100 transition flex items-center gap-2">
                    <ArrowRightIcon className="w-4 h-4" />
                    <span>بازگشت به مرحله قبل</span>
                 </button>
                 <button
                    onClick={handleFinalFinish}
                    disabled={isSaving}
                    className={`bg-sky-500 text-white font-bold py-2.5 px-6 rounded-lg transition shadow-md flex items-center gap-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-sky-600'}`}
                 >
                    <CheckIcon className="w-5 h-5" />
                    <span>{isSaving ? 'در حال ذخیره...' : 'تایید نهایی و اتمام'}</span>
                 </button>
             </div>

            <FullScreenEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                initialText={editedText}
                onSave={handleSaveEditedText}
                title="ویرایش نهایی صورتجلسه"
            />
         </div>
    );
};

export default UploadStep3;