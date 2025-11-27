
import React from 'react';
import { FileData } from '../../types';
import { STATUS_STYLES } from '../../constants';
import { XIcon } from '../Icons';
import ModalPortal from '../ModalPortal';
import StructuredTextPreview from '../StructuredTextPreview';

interface FileDetailsModalProps {
    file: FileData;
    onClose: () => void;
}

const FileDetailsModal: React.FC<FileDetailsModalProps> = ({ file, onClose }) => {
  return (
    <ModalPortal>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-page">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] animate-soft-pop">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">جزئیات فایل</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div><strong className="text-gray-600">نام فایل:</strong> <span className="text-gray-800 break-words">{file.name}</span></div>
                        <div><strong className="text-gray-600">وضعیت:</strong> <span className={`font-semibold ${STATUS_STYLES[file.status].text}`}>{file.status}</span></div>
                        <div><strong className="text-gray-600">موضوع:</strong> <span className="text-gray-800">جلسه بررسی فنی</span></div>
                        <div><strong className="text-gray-600">نوع:</strong> <span className="text-gray-800">{file.type}</span></div>
                        <div><strong className="text-gray-600">زیر مجموعه:</strong> <span className="text-gray-800">{file.subCollection}</span></div>
                        <div><strong className="text-gray-600">بارگذاری شده توسط:</strong> <span className="text-gray-800">{file.uploader}</span></div>
                    </div>
                    {(file.editedText || file.originalText) && (
                        <div className="mt-6 space-y-4">
                            {file.editedText && (
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-2">متن نهایی تایید شده:</h4>
                                    <div className="text-gray-700 bg-green-50 p-4 rounded-lg border border-green-100 leading-relaxed">
                                        <StructuredTextPreview
                                            text={file.editedText}
                                            title={file.type || 'متن نهایی'}
                                            subject={file.name}
                                            dateValue={file.uploadDate}
                                        />
                                    </div>
                                </div>
                            )}
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">متن استخراج شده:</h4>
                                <p className="text-gray-600 bg-gray-50 p-4 rounded-lg border leading-relaxed whitespace-pre-wrap">{file.originalText || 'متنی برای نمایش وجود ندارد.'}</p>
                            </div>
                        </div>
                    )}
                    {file.audioSrc && (
                        <div className="mt-6">
                            <h4 className="font-semibold text-gray-700 mb-2">پخش فایل صوتی:</h4>
                            <audio controls className="w-full">
                                <source src={file.audioSrc} type="audio/mpeg" />
                                مرورگر شما از پخش صدا پشتیبانی نمی‌کند.
                            </audio>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </ModalPortal>
  );
};

export default FileDetailsModal;
