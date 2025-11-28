import React, { useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { FileStatus, FileData } from '../types';
import { STATUS_STYLES, toPersianDigits } from '../constants';
import { useFiles } from '../contexts/FileContext';
import { EyeIcon, DownloadIcon, ProcessingIcon, CheckIcon, TrashIcon, StopIcon } from '../components/Icons';
import { exportCustomContentZip, getAudioTextByUuid, deleteAudioFile, reprocessAudio } from '../api/api';
import StatCard from '../components/dashboard/StatCard';
import FileDetailsModal from '../components/dashboard/FileDetailsModal';
import StatusChart from '../components/dashboard/StatusChart';
import ModalPortal from '../components/ModalPortal';

interface LayoutContext {
    headerSearchTerm: string;
}

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { files, loading, error, refreshFiles, removeFile } = useFiles();
    const [statusFilter, setStatusFilter] = useState<FileStatus | 'all'>('all');
    const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ type: 'cancel' | 'delete'; file: FileData } | null>(null);
    const [isActing, setIsActing] = useState(false);
    const [retryingId, setRetryingId] = useState<string | null>(null);
    const { headerSearchTerm } = useOutletContext<LayoutContext>();

    const handleStatusFilterChange = (status: FileStatus | 'all') => {
        setStatusFilter(status);
    };

    const openCancelModal = (file: FileData) => setConfirmAction({ type: 'cancel', file });
    const openDeleteModal = (file: FileData) => setConfirmAction({ type: 'delete', file });

    const handleConfirmAction = async () => {
        if (!confirmAction) return;
        const { file } = confirmAction;
        if (!file.upload_uuid) {
            setConfirmAction(null);
            return;
        }

        setIsActing(true);
        try {
            await deleteAudioFile(file.upload_uuid);
            removeFile(file.id);
            await refreshFiles();
        } catch (err) {
            console.error('Unable to update file', err);
            alert('خطا در انجام عملیات. لطفاً دوباره تلاش کنید.');
        } finally {
            setIsActing(false);
            setConfirmAction(null);
        }
    };

    const handleRetryProcessing = async (file: FileData) => {
        if (!file.upload_uuid) return;
        setRetryingId(file.id);
        try {
            await reprocessAudio(file.upload_uuid);
            await refreshFiles();
        } catch (err) {
            console.error('Unable to retry processing', err);
            alert('سرویس پردازش موقتا در دسترس نیست. لطفاً کمی بعد دوباره تلاش کنید.');
        } finally {
            setRetryingId(null);
        }
    };

    const toEnglishDigits = (value: string | undefined) => (value || '').replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

    const filteredFiles = useMemo(() => {
        const getSortableDateValue = (file: FileData) => {
            if (file.uploadedAt) {
                return new Date(file.uploadedAt).getTime();
            }
            const normalized = file.uploadDate ? toEnglishDigits(file.uploadDate).replace(/\//g, '-') : '';
            const parsed = normalized ? Date.parse(normalized) : 0;
            return Number.isFinite(parsed) ? parsed : 0;
        };

        return files
            .filter(file => {
                const matchesSearch = file.name.toLowerCase().includes(headerSearchTerm.toLowerCase());
                const matchesStatus = statusFilter === 'all' || file.status === statusFilter;
                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                const dateA = getSortableDateValue(a);
                const dateB = getSortableDateValue(b);
                return dateB - dateA;
            });
    }, [files, headerSearchTerm, statusFilter]);

    const stats = useMemo(() => ({
        total: files.length,
        pending: files.filter(f => f.status === FileStatus.Pending).length,
        processing: files.filter(f => f.status === FileStatus.Processing).length,
        processed: files.filter(f => f.status === FileStatus.Processed).length,
        approved: files.filter(f => f.status === FileStatus.Approved).length,
        unavailable: files.filter(f => f.status === FileStatus.ServiceUnavailable).length,
        rejected: files.filter(f => f.status === FileStatus.Rejected).length,
    }), [files]);

    const subsetStats = useMemo(() => {
        const map: Record<string, { total: number; approved: number; processing: number }> = {};
        files.forEach((file) => {
            const key = file.subCollection || 'بدون دسته بندی';
            if (!map[key]) {
                map[key] = { total: 0, approved: 0, processing: 0 };
            }
            map[key].total += 1;
            if (file.status === FileStatus.Approved) map[key].approved += 1;
            if (file.status === FileStatus.Processing) map[key].processing += 1;
        });
        return Object.entries(map)
            .map(([name, value]) => ({ name, ...value, completion: value.total ? Math.round((value.approved / value.total) * 100) : 0 }))
            .sort((a, b) => b.total - a.total);
    }, [files]);

    const uploadCadence = useMemo(() => {
        const buckets: Record<string, number> = {};
        files.forEach((file) => {
            buckets[file.uploadDate] = (buckets[file.uploadDate] || 0) + 1;
        });
        return Object.entries(buckets)
            .map(([date, count]) => ({ date, count }))
            .slice(0, 14);
    }, [files]);

    const processingQueue = useMemo(() => files
        .filter((f) => f.status === FileStatus.Processing || f.status === FileStatus.Pending)
        .slice(0, 5), [files]);

    const completionRate = stats.total ? Math.round((stats.approved / stats.total) * 100) : 0;

    const activeFilterText = statusFilter === 'all' ? '' : ` (فیلتر: ${statusFilter})`;

    const formatPersianDateTime = (file: FileData) => {
        const dateObject = file.uploadedAt ? new Date(file.uploadedAt) : null;
        if (dateObject && !isNaN(dateObject.getTime())) {
            const dateFormatter = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' });
            const timeFormatter = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false });
            return {
                date: dateFormatter.format(dateObject),
                time: timeFormatter.format(dateObject),
            };
        }

        if (file.lastUpdatedLabel) {
            const [rawDate, rawTime] = file.lastUpdatedLabel.split('•').map((part) => part.trim());
            return {
                date: rawDate,
                time: rawTime || '',
            };
        }

        const numericDate = file.uploadDate ? toEnglishDigits(file.uploadDate) : '';
        return {
            date: file.uploadDate || '',
            time: '',
            numericDate,
        };
    };

    const getSummaryLine = (file: FileData) => {
        const content = file.processedText || file.editedText || file.originalText;
        if (!content) return '';
        const normalized = content.replace(/\s+/g, ' ').trim();
        return normalized.length > 90 ? `${normalized.slice(0, 90)}…` : normalized;
    };

    const renderStatusBadge = (status: FileStatus) => {
        const { bg, text, dot } = STATUS_STYLES[status];
        const isProcessing = status === FileStatus.Processing;

        return (
            <span className={`inline-flex items-center justify-center min-w-[100px] px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text} gap-x-1.5`}>
                {isProcessing ? (
                    <div className="w-2 h-2 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
                ) : (
                    <span className={`w-2 h-2 rounded-full ${dot}`}></span>
                )}
                {status}
            </span>
        );
    };

    const handleViewClick = async (file: FileData) => {
        if (file.status === FileStatus.Pending || file.status === FileStatus.Processed) {
            navigate(`/review/${file.id}`);
            return;
        }

        if (file.status === FileStatus.Approved && file.upload_uuid) {
            try {
                const res = await getAudioTextByUuid(file.upload_uuid);
                setSelectedFile({
                    ...file,
                    originalText: res.original_text,
                    editedText: res.custom_text || res.original_text,
                });
                return;
            } catch (error) {
                // اگر دریافت متن نهایی با خطا مواجه شد همان داده اولیه نمایش داده شود
            }
        }

        setSelectedFile(file);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">خطا در بارگذاری داده‌ها</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={refreshFiles}
                        className="px-4 py-2 pill-button rounded-lg hover:shadow-xl transition"
                    >
                        تلاش مجدد
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                <StatCard title="کل فایل های صوتی " count={stats.total} colorTheme="orange" status="all" onFilterClick={handleStatusFilterChange} isActive={statusFilter === 'all'} />
                <StatCard title="در انتظار پردازش هوشمند" count={stats.pending} colorTheme="gray" status={FileStatus.Pending} onFilterClick={handleStatusFilterChange} isActive={statusFilter === FileStatus.Pending} />
                <StatCard title="در حال پردازش هوشمند" count={stats.processing} colorTheme="blue" status={FileStatus.Processing} onFilterClick={handleStatusFilterChange} isActive={statusFilter === FileStatus.Processing} />
                <StatCard title="سرویس در دسترس نیست" count={stats.unavailable} colorTheme="amber" status={FileStatus.ServiceUnavailable} onFilterClick={handleStatusFilterChange} isActive={statusFilter === FileStatus.ServiceUnavailable} />
                <StatCard title="محتوای تولید شده" count={stats.processed} colorTheme="purple" status={FileStatus.Processed} onFilterClick={handleStatusFilterChange} isActive={statusFilter === FileStatus.Processed} />
                <StatCard title="تایید شده" count={stats.approved} colorTheme="green" status={FileStatus.Approved} onFilterClick={handleStatusFilterChange} isActive={statusFilter === FileStatus.Approved} />
            </div>

            {stats.processing > 0 && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <div>
                        <h3 className="text-sm font-semibold text-indigo-800">
                            {toPersianDigits(stats.processing)} فایل صوتی در حال پردازش هوشمند
                        </h3>
                        <p className="text-sm text-indigo-600">فایل‌های شما در حال پردازش هوشمند هستند. لطفاً صبر کنید...</p>
                    </div>
                </div>
            )}

            <div className="grid xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <div className="glass-panel rounded-3xl p-6 animate-card">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                            <h3 className="text-lg font-bold text-slate-800">{`لیست فایل های صوتی${activeFilterText}`}</h3>
                            <button
                                onClick={refreshFiles}
                                className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white/80 text-slate-600 shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition"
                                title="بروزرسانی"
                            >
                                🔄
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-right text-gray-600">
                                <thead className="text-xs text-gray-700 uppercase bg-slate-50/80">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">نام فایل صوتی</th>
                                        <th scope="col" className="px-6 py-3">تاریخ</th>
                                        <th scope="col" className="px-6 py-3 hidden md:table-cell">نوع</th>
                                        <th scope="col" className="px-6 py-3">وضعیت</th>
                                        <th scope="col" className="px-6 py-3">اقدامات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFiles.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center">
                                                    <div className="text-4xl mb-2">📁</div>
                                                    <p className="text-lg font-medium mb-1">فایل صوتی یافت نشد</p>
                                                    <p className="text-sm">
                                                        {headerSearchTerm || statusFilter !== 'all'
                                                            ? 'فایل صوتی‌هایی با این فیلتر وجود ندارد'
                                                            : 'هنوز فایل صوتیی آپلود نشده است'}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredFiles.map((file, index) => {
                                            const summary = getSummaryLine(file);
                                            const { date, time } = formatPersianDateTime(file);

                                            return (
                                            <tr key={file.id} className="bg-white border-b hover:bg-gray-50 table-row-animate" style={{ animationDelay: `${index * 45}ms` }}>
                                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap max-w-[170px]">
                                                    <div className="truncate" title={file.name}>{file.name}</div>
                                                    <div className="text-xs text-slate-500 mt-1">{file.uploader ? `توسط ${file.uploader}` : 'بارگذاری شده'}</div>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <div className="space-y-1 text-[13px] text-slate-700">
                                                        <div className="font-semibold">{date && toPersianDigits(date)}</div>
                                                        {time && (
                                                            <div className="text-xs text-slate-500">آخرین تغییر: {toPersianDigits(time)}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell">{file.type}</td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-2">
                                                        {renderStatusBadge(file.status)}
                                                        {file.status === FileStatus.Processing && (
                                                            <div className="space-y-1">
                                                                <div className="flex items-center justify-between text-[11px] text-slate-500">
                                                                    <span className="truncate max-w-[180px]" title={file.progressLabel || 'در حال ترنسکرایب...'}>
                                                                        {file.progressLabel || 'در حال ترنسکرایب...'}
                                                                    </span>
                                                                    <span className="font-bold text-slate-800">
                                                                        {toPersianDigits(Math.round(file.progress ?? 0))}%
                                                                    </span>
                                                                </div>
                                                                <div className="w-full h-2.5 bg-indigo-50 rounded-full overflow-hidden border border-indigo-100/60 shadow-inner">
                                                                    <div
                                                                        className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-cyan-300 transition-all duration-700"
                                                                        style={{ width: `${Math.min(Math.max(file.progress ?? 5, 5), 100)}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {file.status === FileStatus.ServiceUnavailable && (
                                                            <div className="space-y-2">
                                                                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 leading-6">
                                                                    سرویس پردازش در دسترس نیست. لطفاً چند دقیقه دیگر تلاش کنید.
                                                                </div>
                                                                <button
                                                                    onClick={() => handleRetryProcessing(file)}
                                                                    className="w-full text-center text-[13px] font-semibold text-amber-800 bg-amber-100 border border-amber-200 rounded-xl py-2 hover:bg-amber-200 transition disabled:opacity-50"
                                                                    disabled={retryingId === file.id}
                                                                >
                                                                    {retryingId === file.id ? 'در حال تلاش مجدد...' : 'تلاش دوباره برای پردازش'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-2">
                                                        {summary && (
                                                            <p className="text-xs text-slate-500 max-w-[260px] truncate" title={summary}>
                                                                {summary}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-x-2">
                                                            <button
                                                                onClick={() => handleViewClick(file)}
                                                                className="p-1.5 text-gray-500 hover:text-indigo-600 rounded-md hover:bg-gray-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                                                title="مشاهده جزئیات"
                                                                disabled={file.status === FileStatus.Processing}
                                                            >
                                                                <EyeIcon className="w-5 h-5"/>
                                                            </button>
                                                            <button onClick={() => exportCustomContentZip(file.id)} disabled={file.status !== FileStatus.Approved} className="p-1.5 text-gray-500 hover:text-indigo-600 rounded-md hover:bg-gray-100 transition disabled:opacity-30 disabled:cursor-not-allowed" title="دانلود">
                                                                <DownloadIcon className="w-5 h-5" />
                                                            </button>
                                                            {(file.status === FileStatus.Processing || file.status === FileStatus.Pending) && (
                                                                <button
                                                                    onClick={() => openCancelModal(file)}
                                                                    className="p-1.5 text-amber-600 hover:text-amber-700 rounded-md hover:bg-amber-50 transition"
                                                                    title="توقف و حذف از صف"
                                                                >
                                                                    <StopIcon className="w-5 h-5" />
                                                                </button>
                                                            )}
                                                            {file.status !== FileStatus.Processing && file.status !== FileStatus.Pending && (
                                                                <button
                                                                    onClick={() => openDeleteModal(file)}
                                                                    className="p-1.5 text-rose-600 hover:text-rose-700 rounded-md hover:bg-rose-50 transition"
                                                                    title="حذف آیتم"
                                                                >
                                                                    <TrashIcon className="w-5 h-5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="soft-card rounded-3xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-sm text-slate-500">صف پردازش</p>
                                    <h4 className="text-lg font-bold text-slate-900">در اولویت رسیدگی</h4>
                                </div>
                                <ProcessingIcon className="w-6 h-6 text-indigo-500" />
                            </div>
                            <ul className="space-y-3">
                                {processingQueue.length === 0 && (
                                    <li className="text-sm text-slate-500">صف پردازش خالی است.</li>
                                )}
                                {processingQueue.map((file) => (
                                    <li key={file.id} className="flex flex-col gap-2 bg-white/80 border border-white/70 rounded-2xl px-4 py-3 shadow-sm">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-800 truncate" title={file.name}>{file.name}</p>
                                                <p className="text-xs text-slate-500">{file.subCollection}</p>
                                            </div>
                                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">{file.status === FileStatus.Processing ? 'در حال پردازش' : 'در انتظار'}</span>
                                        </div>
                                        {file.status === FileStatus.Processing && (
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-[11px] text-slate-500">
                                                    <span className="truncate max-w-[150px]" title={file.progressLabel || 'در حال ترنسکرایب...'}>
                                                        {file.progressLabel || 'در حال ترنسکرایب...'}
                                                    </span>
                                                    <span className="font-bold text-slate-800">{toPersianDigits(Math.round(file.progress ?? 0))}%</span>
                                                </div>
                                                <div className="w-full h-2 rounded-full bg-indigo-50 overflow-hidden border border-indigo-100/60">
                                                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-cyan-300 transition-all duration-700" style={{ width: `${Math.min(Math.max(file.progress ?? 5, 5), 100)}%` }}></div>
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="soft-card rounded-3xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-sm text-slate-500">پیشرفت تایید نهایی</p>
                                    <h4 className="text-lg font-bold text-slate-900">گام‌های بعدی</h4>
                                </div>
                                <CheckIcon className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">تولید محتوا</span>
                                    <span className="font-semibold text-slate-900">{toPersianDigits(stats.processed)}</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <div className="h-full bg-purple-400 rounded-full" style={{ width: `${stats.total ? (stats.processed / stats.total) * 100 : 0}%` }}></div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">تایید مدیر</span>
                                    <span className="font-semibold text-slate-900">{toPersianDigits(stats.approved)}</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${completionRate}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="glass-panel rounded-3xl p-6 animate-card" style={{ animationDelay: '120ms' }}>
                        <StatusChart stats={stats} />
                    </div>

                    <div className="soft-card rounded-3xl p-6 animate-card" style={{ animationDelay: '180ms' }}>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-sm text-slate-500">زیرمجموعه‌ها</p>
                                <h4 className="text-lg font-bold text-slate-900">وضعیت مجموعه‌ها</h4>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {subsetStats.map((subset) => (
                                <div key={subset.name} className="p-3 rounded-2xl bg-white/70 border border-white/80">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-slate-800">{subset.name}</p>
                                            <p className="text-xs text-slate-500">{toPersianDigits(subset.approved)} تایید شده • {toPersianDigits(subset.total)} کل</p>
                                        </div>
                                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">{toPersianDigits(subset.completion)}%</span>
                                    </div>
                                    <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                                        <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${subset.completion}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-panel rounded-3xl p-6 animate-card" style={{ animationDelay: '240ms' }}>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-sm text-slate-500">ریتم آپلود</p>
                                <h4 className="text-lg font-bold text-slate-900">دو هفته اخیر</h4>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            {uploadCadence.map((item) => (
                                <div key={item.date} className="flex items-center justify-between bg-white/70 border border-white/80 rounded-2xl px-3 py-2">
                                    <span className="text-slate-600">{item.date}</span>
                                    <span className="font-bold text-indigo-600">{toPersianDigits(item.count)}</span>
                                </div>
                            ))}
                            {uploadCadence.length === 0 && <p className="text-slate-500">هنوز آپلودی ثبت نشده است.</p>}
                        </div>
                    </div>
                </div>
            </div>

            {selectedFile && <FileDetailsModal file={selectedFile} onClose={() => setSelectedFile(null)} />}

            {confirmAction && (
                <ModalPortal>
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${confirmAction.type === 'delete' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {confirmAction.type === 'delete' ? <TrashIcon className="w-5 h-5" /> : <StopIcon className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">
                                        {confirmAction.type === 'delete' ? 'حذف فایل از لیست' : 'توقف پردازش و حذف از صف'}
                                    </h3>
                                    <p className="text-sm text-slate-600">{confirmAction.file.name}</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed mb-6">
                                {confirmAction.type === 'delete'
                                    ? 'با تایید، این فایل از لیست شما حذف می‌شود. آیا مطمئن هستید؟'
                                    : 'با تایید، پردازش این فایل متوقف شده و آیتم از صف حذف می‌شود. ادامه می‌دهید؟'}
                            </p>
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setConfirmAction(null)}
                                    className="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                                    disabled={isActing}
                                >
                                    انصراف
                                </button>
                                <button
                                    onClick={handleConfirmAction}
                                    disabled={isActing}
                                    className={`px-4 py-2 text-sm rounded-xl text-white shadow-md ${confirmAction.type === 'delete' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-amber-500 hover:bg-amber-600'} disabled:opacity-60`}
                                >
                                    {isActing ? 'در حال انجام...' : 'تایید و حذف'}
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
};

export default DashboardPage;
