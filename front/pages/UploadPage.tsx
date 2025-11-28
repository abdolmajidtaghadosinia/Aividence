import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFiles } from '../contexts/FileContext';
import { useAuth } from '../contexts/AuthContext';
import { FileData, FileStatus } from '../types';
import UploadStep1 from '../components/upload/UploadStep1';
import { toPersianDigits } from '../constants';

const UploadPage: React.FC = () => {
    const navigate = useNavigate();
    const { addFile } = useFiles();
    const { user } = useAuth();

    const handleUpload = (data: Partial<FileData>) => {
        if (user) {
            const formattedUploadDate = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
            const newFile: FileData = {
                id: `file_${Date.now()}`,
                name: data.name ?? 'بدون نام',
                uploadDate: toPersianDigits(formattedUploadDate),
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
        <div className="space-y-6 animate-page">
            <div className="soft-card rounded-3xl p-6 flex items-center justify-between gap-4 shadow-lg relative overflow-hidden animate-card">
                <div className="pointer-events-none absolute -left-10 -top-12 h-32 w-32 bg-sky-200/50 blur-3xl animate-breath" />
                <div className="pointer-events-none absolute -right-14 -bottom-16 h-36 w-36 bg-indigo-200/40 blur-3xl animate-breath" />
                <div>
                    <p className="text-sm text-slate-500">آپلود جدید</p>
                    <h2 className="text-2xl font-black text-slate-900">پردازش هوشمند را همین حالا آغاز کنید</h2>
                    <p className="text-slate-500 mt-2">فایل صوتی خود را بارگذاری کنید تا در صف پردازش قرار گیرد.</p>
                    <div className="card-divider my-3" />
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="frosted-chip px-3 py-1 rounded-full text-indigo-700 font-semibold animate-soft-pop" style={{ animationDelay: '40ms' }}>کیفیت بالا</span>
                        <span className="frosted-chip px-3 py-1 rounded-full text-emerald-700 font-semibold animate-soft-pop" style={{ animationDelay: '80ms' }}>ضد خطا</span>
                        <span className="frosted-chip px-3 py-1 rounded-full text-amber-700 font-semibold animate-soft-pop" style={{ animationDelay: '120ms' }}>ردیابی وضعیت</span>
                    </div>
                </div>
                <div className="hidden md:block px-4 py-3 rounded-2xl bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 shadow-md animate-soft-pop" style={{ animationDelay: '160ms' }}>
                    زمان میانگین پردازش: ۸ دقیقه
                </div>
            </div>
            <div className="glass-panel p-6 rounded-3xl animate-soft-pop">
                 <UploadStep1 onUpload={handleUpload} />
            </div>
        </div>
    );
};

export default UploadPage;