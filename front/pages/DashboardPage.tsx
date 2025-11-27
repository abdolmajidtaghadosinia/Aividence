import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileStatus, FileData } from '../types';
import { STATUS_STYLES, toPersianDigits } from '../constants';
import { useFiles } from '../contexts/FileContext';
import { SearchIcon, EyeIcon, DownloadIcon, PlusIcon, ProcessingIcon, CheckIcon } from '../components/Icons';
import { exportCustomContentZip, getAudioTextByUuid } from '../api/api';
import StatCard from '../components/dashboard/StatCard';
import FileDetailsModal from '../components/dashboard/FileDetailsModal';
import StatusChart from '../components/dashboard/StatusChart';

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { files, loading, error, refreshFiles } = useFiles();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<FileStatus | 'all'>('all');
    const [selectedFile, setSelectedFile] = useState<FileData | null>(null);

    const handleStatusFilterChange = (status: FileStatus | 'all') => {
        setStatusFilter(status);
    };

    const filteredFiles = useMemo(() => {
        return files
            .filter(file => {
                const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesStatus = statusFilter === 'all' || file.status === statusFilter;
                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                const dateA = new Date(a.uploadDate.replace(/\//g, '-')).getTime();
                const dateB = new Date(b.uploadDate.replace(/\//g, '-')).getTime();
                return dateB - dateA;
            });
    }, [files, searchTerm, statusFilter]);

    const stats = useMemo(() => ({
        total: files.length,
        pending: files.filter(f => f.status === FileStatus.Pending).length,
        processing: files.filter(f => f.status === FileStatus.Processing).length,
        processed: files.filter(f => f.status === FileStatus.Processed).length,
        approved: files.filter(f => f.status === FileStatus.Approved).length,
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 soft-card rounded-3xl p-6 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm text-slate-500">مرور کلی امروز</p>
                            <h2 className="text-2xl font-black text-slate-900">همه چیز برای مدیریت فایل‌های صوتی آماده است</h2>
                            <p className="text-slate-500 mt-2">روند آپلود و تایید را در یک نما ببینید و سریعا اقدام کنید.</p>
                        </div>
                        <button
                            onClick={() => navigate('/upload')}
                            className="pill-button px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-bold transition hover:shadow-xl"
                        >
                            <PlusIcon className="w-5 h-5" />
                            <span>ایجاد بارگذاری جدید</span>
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="px-4 py-2 rounded-2xl bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                            {toPersianDigits(stats.processing)} فایل در حال پردازش
                        </div>
                        <div className="px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                            {toPersianDigits(stats.approved)} تایید شده نهایی
                        </div>
                        <div className="px-4 py-2 rounded-2xl bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-100">
                            {toPersianDigits(stats.pending)} در انتظار پردازش
                        </div>
                    </div>
                </div>
                <div className="glass-panel rounded-3xl p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">نرخ تکمیل</p>
                            <h3 className="text-2xl font-bold text-slate-900">{toPersianDigits(completionRate)}%</h3>
                        </div>
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500/20 to-sky-400/20 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-white shadow-inner flex items-center justify-center text-indigo-600 font-black text-lg">
                                {toPersianDigits(stats.total)}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">در انتظار</span>
                            <span className="font-semibold text-slate-800">{toPersianDigits(stats.pending)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">در حال پردازش</span>
                            <span className="font-semibold text-slate-800">{toPersianDigits(stats.processing)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">تایید شده</span>
                            <span className="font-semibold text-slate-800">{toPersianDigits(stats.approved)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                <StatCard title="کل فایل های صوتی " count={stats.total} colorTheme="orange" status="all" onFilterClick={handleStatusFilterChange} isActive={statusFilter === 'all'} />
                <StatCard title="در انتظار پردازش هوشمند" count={stats.pending} colorTheme="gray" status={FileStatus.Pending} onFilterClick={handleStatusFilterChange} isActive={statusFilter === FileStatus.Pending} />
                <StatCard title="در حال پردازش هوشمند" count={stats.processing} colorTheme="blue" status={FileStatus.Processing} onFilterClick={handleStatusFilterChange} isActive={statusFilter === FileStatus.Processing} />
                <StatCard title="محتوای تولید شده" count={stats.processed} colorTheme="purple" status={FileStatus.Processed} onFilterClick={handleStatusFilterChange} isActive={statusFilter === FileStatus.Processed} />
                <StatCard title="تایید شده" count={stats.approved} colorTheme="green" status={FileStatus.Approved} onFilterClick={handleStatusFilterChange} isActive={statusFilter === FileStatus.Approved} />
            </div>

            {stats.processing > 0 && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <div>
                        <h3 className="text-sm font-semibold text-indigo-800">
                            {stats.processing} فایل صوتی در حال پردازش هوشمند
                        </h3>
                        <p className="text-sm text-indigo-600">فایل‌های شما در حال پردازش هوشمند هستند. لطفاً صبر کنید...</p>
                    </div>
                </div>
            )}

            <div className="grid xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <div className="glass-panel rounded-3xl p-6">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                            <h3 className="text-lg font-bold text-slate-800">{`لیست فایل های صوتی${activeFilterText}`}</h3>
                            <div className="flex flex-wrap gap-2 items-center">
                                <button
                                    onClick={refreshFiles}
                                    className="px-3 py-2 text-sm pill-button rounded-xl hover:shadow-xl transition"
                                    title="بروزرسانی"
                                >
                                    🔄
                                </button>
                                <div className="relative w-full md:w-64">
                                    <input
                                        type="text"
                                        placeholder="جستجوی فایل صوتی..."
                                        className="w-full pl-10 pr-4 py-2 border border-white/70 rounded-xl bg-white/80 focus:ring-indigo-500 focus:border-indigo-400"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                </div>
                            </div>
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
                                                        {searchTerm || statusFilter !== 'all'
                                                            ? 'فایل صوتی‌هایی با این فیلتر وجود ندارد'
                                                            : 'هنوز فایل صوتیی آپلود نشده است'}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredFiles.map((file) => (
                                            <tr key={file.id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap max-w-[150px] truncate" title={file.name}>
                                                    {file.name}
                                                </td>
                                                <td className="px-6 py-4">{file.uploadDate}</td>
                                                <td className="px-6 py-4 hidden md:table-cell">{file.type}</td>
                                                <td className="px-6 py-4">{renderStatusBadge(file.status)}</td>
                                                <td className="px-6 py-4 flex items-center gap-x-2">
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
                                                </td>
                                            </tr>
                                        ))
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
                                    <li key={file.id} className="flex items-center justify-between bg-white/80 border border-white/70 rounded-2xl px-4 py-3 shadow-sm">
                                        <div>
                                            <p className="font-semibold text-slate-800">{file.name}</p>
                                            <p className="text-xs text-slate-500">{file.subCollection}</p>
                                        </div>
                                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">{file.status === FileStatus.Processing ? 'در حال پردازش' : 'در انتظار'}</span>
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
                    <div className="glass-panel rounded-3xl p-6">
                        <StatusChart stats={stats} />
                    </div>

                    <div className="soft-card rounded-3xl p-6">
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

                    <div className="glass-panel rounded-3xl p-6">
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
        </div>
    );
};

export default DashboardPage;
