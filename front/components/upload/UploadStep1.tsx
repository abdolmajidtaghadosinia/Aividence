import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_FILES, toPersianDigits } from '../../constants';
import { ArrowRightIcon, ProcessingIcon, InfoIcon, FileTypeIcon, FolderIcon } from '../Icons';
import { FileData } from '../../types';
import { getUploadFormData, UploadFormData, submitUploadForm } from '../../api/api';

interface UploadStep1Props {
    onUpload: (data: Partial<FileData>) => void;
    autoOpenPicker?: boolean;
}

const UploadStep1: React.FC<UploadStep1Props> = ({ onUpload, autoOpenPicker }) => {
    const [fileName, setFileName] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [formData, setFormData] = useState<UploadFormData>({ file_type_choices: {}, subsets: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const formatSizeMb = (bytes: number) => toPersianDigits((bytes / (1024 * 1024)).toFixed(1));

    useEffect(() => {
        const fetchFormData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getUploadFormData();
                setFormData({
                    file_type_choices: data.file_type_choices || {},
                    subsets: data.subsets || []
                });
            } catch (err: any) {
                setError(err.message || 'خطا در دریافت اطلاعات فرم');
                console.error('Error fetching form data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchFormData();
    }, []);

    useEffect(() => {
        if (autoOpenPicker && fileInputRef.current) {
            const clickTimeout = window.setTimeout(() => {
                fileInputRef.current?.click();
            }, 150);

            return () => window.clearTimeout(clickTimeout);
        }
    }, [autoOpenPicker]);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            const maxSize = 10 * 1024 * 1024; // 10MB
            
            if (droppedFile.size > maxSize) {
                setError(`حجم فایل صوتی باید کمتر از ۱۰ مگابایت باشد. حجم فایل صوتی انتخاب شده: ${formatSizeMb(droppedFile.size)} مگابایت`);
                return;
            }
            
            setFile(droppedFile);
            setFileName(droppedFile.name);
            setError(null); // Clear any previous errors
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            const maxSize = 10 * 1024 * 1024; // 10MB
            
            if (selectedFile.size > maxSize) {
                setError(`حجم فایل صوتی باید کمتر از ۱۰ مگابایت باشد. حجم فایل صوتی انتخاب شده: ${formatSizeMb(selectedFile.size)} مگابایت`);
                return;
            }
            
            setFile(selectedFile);
            setFileName(selectedFile.name);
            setError(null); // Clear any previous errors
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            setSubmitting(true);
            setError(null);

            const form = e.currentTarget;
            const formDataObj = new FormData();

            const fileInput = file;
            const fileNameValue = (form.elements.namedItem('fileName') as HTMLInputElement)?.value;
            const subject = (form.elements.namedItem('subject') as HTMLInputElement)?.value;
            const fileType = (form.elements.namedItem('fileType') as HTMLSelectElement)?.value;
            const subCollection = (form.elements.namedItem('subCollection') as HTMLSelectElement)?.value;

            if (!fileInput) {
                setError("لطفاً یک فایل صوتی انتخاب کنید.");
                return;
            }

            // اضافه کردن فایل صوتی و سایر فیلدها به FormData
            formDataObj.append('file', fileInput);
            formDataObj.append('fileName', fileNameValue);
            formDataObj.append('subject', subject);
            formDataObj.append('fileType', fileType);
            formDataObj.append('subCollection', subCollection);

            // دیباگ: نمایش محتوای FormData
            for (let [key, value] of formDataObj.entries()) {
                console.log(key, value);
            }

            const response = await submitUploadForm(formDataObj);

            const data = {
                name: fileNameValue,
                type: fileType,
                subCollection,
                originalText: MOCK_FILES[2].originalText,
                editedText: MOCK_FILES[2].originalText,
                extractedPhrases: MOCK_FILES[2].extractedPhrases,
            };

            onUpload(data);
        } catch (err: any) {
            const serverError = err.response?.data?.error || err.message || 'خطا در ارسال فرم';
            setError(serverError);
            console.error('Error submitting form:', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                <span className="mr-3 text-gray-600">در حال بارگذاری اطلاعات فرم...</span>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col md:flex-row gap-8">
            <div className="flex-1 p-2">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">بارگذاری فایل صوتی</h3>
                    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-sky-600">
                        <span>بازگشت به داشبورد</span>
                        <ArrowRightIcon className="w-4 h-4" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">فایل صوتی جدید (MP3 یا WAV)</label>
                        <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-indigo-200 border-dashed rounded-2xl transition bg-white/80 ${dragActive ? 'border-indigo-400 bg-indigo-50' : ''}`}>
                            <div className="space-y-1 text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="flex text-sm text-gray-600">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-sky-600 hover:text-sky-500">
                                        <span>انتخاب فایل صوتی</span>
                                        <input id="file-upload" name="file" type="file" className="sr-only" onChange={handleChange} accept=".mp3,.wav" ref={fileInputRef} />
                                    </label>
                                    <p className="pr-1">یا آن را اینجا بکشید</p>
                                </div>
                                <p className="text-xs text-gray-500">{fileName || 'هیچ فایل صوتیی انتخاب نشده'}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="fileName" className="block text-sm font-medium text-slate-700 mb-1">نام فایل صوتی *</label>
                        <input type="text" id="fileName" name="fileName" className="w-full px-4 py-2 border border-indigo-100 rounded-xl bg-white focus:ring-indigo-400 focus:border-indigo-300" required />
                    </div>

                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">موضوع *</label>
                        <input type="text" id="subject" name="subject" maxLength={50} className="w-full px-4 py-2 border border-indigo-100 rounded-xl bg-white focus:ring-indigo-400 focus:border-indigo-300" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="fileType" className="block text-sm font-medium text-gray-700 mb-1">نوع فایل صوتی</label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                                    <FileTypeIcon className="w-5 h-5" />
                                </div>
                                <select id="fileType" name="fileType" className="w-full pl-3 pr-10 py-2 border border-indigo-100 rounded-xl focus:ring-indigo-400 focus:border-indigo-300 bg-white appearance-none">
                                    {Object.entries(formData.file_type_choices).map(([key, value]) => (
                                        <option key={key} value={key}>{value}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="subCollection" className="block text-sm font-medium text-gray-700 mb-1">زیرمجموعه</label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                                    <FolderIcon className="w-5 h-5" />
                                </div>
                                <select id="subCollection" name="subCollection" className="w-full pl-3 pr-10 py-2 border border-indigo-100 rounded-xl focus:ring-indigo-400 focus:border-indigo-300 bg-white appearance-none">
                                    {formData.subsets.map(subset => (
                                        <option key={subset.id} value={subset.title}>{subset.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={submitting} className="w-full pill-button text-white font-bold py-2.5 px-4 rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        {submitting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>در حال ارسال...</span>
                            </>
                        ) : (
                            <>
                                <ProcessingIcon className="w-5 h-5" />
                                <span>شروع پردازش هوشمند</span>
                            </>
                        )}
                    </button>
                </form>
            </div>

            <div className="w-full md:w-72 bg-indigo-50 p-6 rounded-2xl border border-indigo-100 self-start">
                <h4 className="font-bold text-indigo-800 mb-4 flex items-center gap-2">
                    <InfoIcon className="w-5 h-5" />
                    <span>نکاتی برای بهبود کیفیت</span>
                </h4>
                <ul className="space-y-3 text-sm text-indigo-700 list-disc list-inside">
                    <li>از فایل‌های صوتی با کیفیت بالا و بدون نویز استفاده کنید.</li>
                    <li>صدای گوینده باید واضح و بلند باشد.</li>
                    <li>فرمت‌های مجاز MP3, WAV، حداکثر ۱۰ مگابایت.</li>
                    <li>فایل‌های صوتی بلند را به بخش‌های کوتاه‌تر تقسیم کنید.</li>
                </ul>
            </div>
        </div>
    );
};

export default UploadStep1;