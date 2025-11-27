import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFiles } from '../contexts/FileContext';
import { useAuth } from '../contexts/AuthContext';
import { FileData, FileStatus } from '../types';
import UploadStep1 from '../components/upload/UploadStep1';

const UploadPage: React.FC = () => {
    const navigate = useNavigate();
    const { addFile } = useFiles();
    const { user } = useAuth();

    const handleUpload = (data: Partial<FileData>) => {
        if (user) {
            const newFile: FileData = {
                id: `file_${Date.now()}`,
                name: data.name ?? 'بدون نام',
                uploadDate: new Intl.DateTimeFormat('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
                type: data.type ?? 'نامشخص',
                subCollection: data.subCollection ?? 'نامشخص',
                status: FileStatus.Processing,
                uploader: user.name,
                originalText: data.originalText,
                editedText: data.editedText,
                extractedPhrases: data.extractedPhrases,
                duration: Math.floor(Math.random() * 500) + 100
            };
            addFile(newFile);
            navigate('/dashboard');
        }
    };

    return (
        <div className="space-y-6">
            <div className="soft-card rounded-3xl p-6 flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm text-slate-500">آپلود جدید</p>
                    <h2 className="text-2xl font-black text-slate-900">پردازش هوشمند را همین حالا آغاز کنید</h2>
                    <p className="text-slate-500 mt-2">فایل صوتی خود را بارگذاری کنید تا در صف پردازش قرار گیرد.</p>
                </div>
                <div className="hidden md:block px-4 py-3 rounded-2xl bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                    زمان میانگین پردازش: ۸ دقیقه
                </div>
            </div>
            <div className="glass-panel p-6 rounded-3xl">
                 <UploadStep1 onUpload={handleUpload} />
            </div>
        </div>
    );
};

export default UploadPage;