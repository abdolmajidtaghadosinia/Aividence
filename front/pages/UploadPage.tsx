import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFiles } from '../contexts/FileContext';
import { useAuth } from '../contexts/AuthContext';
import { FileData, FileStatus } from '../types';
import UploadStep1 from '../components/upload/UploadStep1';
import { toPersianDigits } from '../constants';

const UploadPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { addFile } = useFiles();
    const { user } = useAuth();
    const [shouldAutoOpenPicker, setShouldAutoOpenPicker] = useState(false);

    useEffect(() => {
        if ((location.state as { autoOpenPicker?: boolean } | null)?.autoOpenPicker) {
            setShouldAutoOpenPicker(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.pathname, location.state, navigate]);

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
            navigate('/dashboard', { state: { scrollToTop: true } });
        }
    };

    return (
        <div className="space-y-6 animate-page">
            <div className="neo-widget rounded-[30px] p-6 flex items-center justify-between gap-4 shadow-lg relative overflow-hidden animate-card text-slate-50">
                <div className="pointer-events-none absolute -left-12 -top-10 h-36 w-36 bg-gradient-to-br from-[#1b2b47]/70 via-[#233556]/60 to-[#0f172a]/70 blur-[90px] animate-breath" />
                <div className="pointer-events-none absolute -right-14 -bottom-16 h-40 w-40 bg-gradient-to-tr from-[#0ea5e9]/20 via-[#f59e0b]/18 to-[#6366f1]/16 blur-[110px] animate-breath" />
                <div className="space-y-2">
                    <p className="text-sm text-slate-300">آپلود جدید</p>
                    <h2 className="text-2xl font-black text-white">پردازش هوشمند را همین حالا آغاز کنید</h2>
                    <p className="text-slate-300">فایل صوتی خود را بارگذاری کنید تا در صف پردازش قرار گیرد.</p>
                    <div className="card-divider my-3" />
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="frosted-chip px-3 py-1 rounded-full text-indigo-100 font-semibold animate-soft-pop" style={{ animationDelay: '40ms' }}>کیفیت بالا</span>
                        <span className="frosted-chip px-3 py-1 rounded-full text-emerald-100 font-semibold animate-soft-pop" style={{ animationDelay: '80ms' }}>ضد خطا</span>
                        <span className="frosted-chip px-3 py-1 rounded-full text-amber-100 font-semibold animate-soft-pop" style={{ animationDelay: '120ms' }}>ردیابی وضعیت</span>
                    </div>
                </div>
                <div className="hidden md:block px-4 py-3 rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-white/10 text-amber-100 font-semibold border border-white/10 shadow-md animate-soft-pop" style={{ animationDelay: '160ms' }}>
                    زمان میانگین پردازش: ۸ دقیقه
                </div>
            </div>
            <div className="neo-panel p-6 rounded-[28px] animate-soft-pop">
                 <UploadStep1 onUpload={handleUpload} autoOpenPicker={shouldAutoOpenPicker} />
            </div>
        </div>
    );
};

export default UploadPage;