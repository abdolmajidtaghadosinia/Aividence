import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogoIcon, DashboardIcon, UploadIcon, DictionaryIcon, AssistantIcon } from './Icons';
import Logo from './Logo';
import { useFiles } from '../contexts/FileContext';
import { FileStatus } from '../types';
import { toPersianDigits } from '../constants';

/**
 * Build the persistent right-hand navigation with descriptive menu entries and status cards.
 *
 * @returns {JSX.Element} Sticky sidebar featuring navigation links and quick project context.
 */
const Sidebar: React.FC = () => {
    const { files } = useFiles();

    const totalFiles = files.length;
    const approvedCount = files.filter(f => f.status === FileStatus.Approved).length;
    const processingCount = files.filter(f => f.status === FileStatus.Processing).length;
    const pendingCount = files.filter(f => f.status === FileStatus.Pending).length;
    const completionRate = totalFiles ? Math.round((approvedCount / totalFiles) * 100) : 0;

    const menuItems = [
        {
            to: '/dashboard',
            label: 'داشبورد',
            description: 'مرور سریع وضعیت سامانه',
            icon: <DashboardIcon className="w-6 h-6" />,
            gradient: 'from-[#4b5f95] via-[#3c4f7f] to-[#1f2a44]',
        },
        {
            to: '/upload',
            label: 'بارگذاری صوت',
            description: 'ارسال فایل جدید به صف',
            icon: <UploadIcon className="w-6 h-6" />,
            gradient: 'from-[#f59e0b] via-[#ef9f64] to-[#c2410c]',
        },
        {
            to: '/dictionary',
            label: 'دیکشنری',
            description: 'مدیریت واژه‌های کلیدی',
            icon: <DictionaryIcon className="w-6 h-6" />,
            gradient: 'from-[#2dd4bf] via-[#14b8a6] to-[#0f766e]',
        },
        {
            to: undefined,
            label: 'دستیار هوشمند',
            description: 'به زودی فعال می‌شود',
            icon: <AssistantIcon className="w-6 h-6" />,
            gradient: 'from-[#7c83ff] via-[#6366f1] to-[#35477d]',
            disabled: true,
        },
    ];

    /**
     * Compose utility classes for navigation links based on their active state.
     *
     * @param {boolean} isActive - Whether the nav item matches the current route.
     * @returns {string} Tailwind class string for styling the nav item.
     */
    const getNavLinkClass = (isActive: boolean) => {
        const baseClass =
            'group flex items-center gap-x-4 px-5 py-4 rounded-[22px] transition-all duration-200 border backdrop-blur-sm shadow-sm text-base';
        return isActive
            ? `${baseClass} bg-gradient-to-l from-[#2c3d66] via-[#1f2f52] to-[#15233d] text-amber-50 border-amber-300/40 ring-1 ring-amber-300/30 shadow-lg shadow-indigo-800/40 hover:shadow-xl hover:-translate-y-0.5`
            : `${baseClass} bg-slate-900/70 text-slate-100 border-slate-800 hover:border-slate-600 hover:text-white hover:shadow-md hover:-translate-y-0.5`;
    };

    /**
     * Wrap menu icons with a gradient chip container.
     *
     * @param {React.ReactNode} icon - Icon element to display.
     * @param {string} gradient - Tailwind gradient classes for the badge background.
     * @returns {JSX.Element} Stylized icon capsule element.
     */
    const renderIcon = (icon: React.ReactNode, gradient: string, disabled: boolean = false) => (
        <span
            className={`shrink-0 p-3.5 rounded-2xl text-white bg-gradient-to-br ${gradient} shadow-md shadow-indigo-900/40 flex items-center justify-center text-lg ${disabled ? 'opacity-50 grayscale' : ''}`}
        >
            {icon}
        </span>
    );

    return (
        <aside className="hidden md:flex fixed top-4 lg:top-6 right-4 lg:right-6 z-40 w-80 max-w-[23rem] flex-col rounded-[30px] p-6 max-h-[calc(100vh-40px)] overflow-y-auto overflow-x-hidden animate-fade-in-down bg-gradient-to-b from-[#0b142b]/95 via-[#0b1c37]/94 to-[#0c1a33]/92 border border-[#213056]/70 shadow-[0_30px_90px_rgba(5,10,34,0.55)] text-slate-100 backdrop-blur-xl">
            <div className="p-5 rounded-[26px] bg-gradient-to-br from-[#0f1d3a]/85 via-[#0c2446]/85 to-[#0f1a35]/85 border border-[#2d3f6d] shadow-inner flex items-center gap-4 hover-lift">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#6bc3f8] to-[#4b5f95] shadow-lg flex items-center justify-center text-white">
                    <LogoIcon className="w-7 h-7" />
                </div>
                <div className="flex-1">
                    <Logo size="sm" showText className="justify-start text-white" />
                    <p className="text-xs text-slate-400 mt-1">داشبورد پردازش صوتی</p>
                </div>
            </div>

            <div className="soft-card text-slate-900 mt-5 p-4 rounded-2xl shadow-lg bg-gradient-to-r from-white/90 via-white/94 to-[#e8f2ff]/95 border border-white/60">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs text-slate-500 font-semibold">کل وظایف فعال</p>
                        <p className="text-3xl font-black text-slate-800 mt-1">{toPersianDigits(totalFiles)}</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl px-3 py-2 bg-gradient-to-r from-[#26d1d5]/10 via-[#60a5fa]/15 to-[#8b5cf6]/15 text-[#0f172a] border border-[#c7d9ff]">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow" />
                        <span className="text-xs font-bold">سرویس‌ها پایدار</span>
                    </div>
                </div>
                <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>نرخ اتمام</span>
                        <span className="font-bold text-slate-900">{toPersianDigits(completionRate)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full bg-gradient-to-l from-[#0ea5e9] via-[#22d3ee] to-[#5ef3a3] rounded-full" style={{ width: `${completionRate}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-sky-400" /> در حال پردازش</span>
                        <span className="font-semibold text-slate-800">{toPersianDigits(processingCount)}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="glass-panel rounded-2xl p-3 flex flex-col gap-1 text-center">
                    <span className="text-[11px] text-emerald-100 font-semibold">تایید شده</span>
                    <span className="text-lg font-bold text-emerald-200">{toPersianDigits(approvedCount)}</span>
                </div>
                <div className="glass-panel rounded-2xl p-3 flex flex-col gap-1 text-center">
                    <span className="text-[11px] text-sky-100 font-semibold">در حال پردازش</span>
                    <span className="text-lg font-bold text-sky-100">{toPersianDigits(processingCount)}</span>
                </div>
                <div className="glass-panel rounded-2xl p-3 flex flex-col gap-1 text-center">
                    <span className="text-[11px] text-amber-100 font-semibold">در صف</span>
                    <span className="text-lg font-bold text-amber-100">{toPersianDigits(pendingCount)}</span>
                </div>
            </div>

            <nav className="flex-grow py-6 overflow-x-hidden">
                <p className="text-sm text-slate-300 font-semibold px-2 mb-4">بخش ها</p>
                <ul className="space-y-3">
                    {menuItems.map((item, index) => (
                        <li key={item.label} style={{ animationDelay: `${index * 60}ms` }} className="animate-card">
                            {item.disabled ? (
                                <div
                                    aria-disabled
                                    className="flex items-center gap-3 px-4 py-3 rounded-[22px] bg-slate-900/40 border border-slate-800 text-slate-500 shadow-inner cursor-not-allowed"
                                >
                                    {renderIcon(item.icon, item.gradient, true)}
                                    <div className="flex flex-col text-start">
                                        <span className="text-base font-extrabold">{item.label}</span>
                                        <span className="text-sm text-slate-500">{item.description}</span>
                                    </div>
                                </div>
                            ) : (
                                <NavLink to={item.to!} className={({ isActive }) => getNavLinkClass(isActive)}>
                                    {({ isActive }) => (
                                        <>
                                            {renderIcon(item.icon, item.gradient)}
                                            <div className="flex flex-col text-start">
                                                <span className={`text-base font-extrabold ${isActive ? 'text-amber-50 drop-shadow-[0_1px_4px_rgba(255,255,255,0.45)]' : 'text-slate-100'}`}>
                                                    {item.label}
                                                </span>
                                                <span className={`text-sm transition-colors ${isActive ? 'text-amber-50/90' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                                    {item.description}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </NavLink>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>

        </aside>
    );
};

export default Sidebar;
