import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClickOutside } from '../hooks/useClickOutside';
import { useFiles } from '../contexts/FileContext';
import { FileStatus } from '../types';
import { UserIcon, LogoutIcon, ChevronDownIcon, BellIcon, SearchIcon, UploadIcon, LockIcon } from './Icons';
import LogoutModal from './LogoutModal';
import Logo from './Logo';

/**
 * Dropdown panel presenting account actions for the authenticated user.
 *
 * @param {{ onLogoutClick: () => void }} props - Callback invoked when logout is requested.
 * @returns {JSX.Element} Action sheet with a logout trigger.
 */
const ProfileDropdown: React.FC<{ onLogoutClick: () => void }> = ({ onLogoutClick }) => (
    <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 p-2 animate-fade-in-down z-50">
        <button
            onClick={onLogoutClick}
            className="w-full flex items-center gap-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
            <LogoutIcon className="w-5 h-5" />
            <span>خروج از سیستم</span>
        </button>
    </div>
);


/**
 * Dashboard header showing user info, quick stats, and shortcut actions.
 *
 * @returns {JSX.Element} Composed header block with search, notifications, and session controls.
 */
interface HeaderProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
}

const Header: React.FC<HeaderProps> = ({ searchTerm, onSearchChange }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { files } = useFiles();

    const [isProfileOpen, setProfileOpen] = useState(false);
    const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);

    const profileRef = useRef<HTMLDivElement>(null);
    useClickOutside(profileRef, () => setProfileOpen(false));

    const handleLogout = () => {
        logout(() => navigate('/login'));
    };

    const totalFiles = files.length;
    const processingCount = files.filter(f => f.status === FileStatus.Processing).length;
    const approvedCount = files.filter(f => f.status === FileStatus.Approved).length;
    const rejectedCount = files.filter(f => f.status === FileStatus.Rejected).length;

    return (
        <>
            <header className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-r from-sky-50 via-white to-indigo-50 shadow-xl animate-soft-pop">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -left-16 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-200/50 to-sky-200/40 blur-3xl animate-breath" />
                    <div className="absolute right-0 top-1/2 h-28 w-28 translate-x-10 -translate-y-1/2 rounded-full bg-amber-100/60 blur-2xl animate-breath" />
                    <div className="absolute bottom-[-30%] left-1/3 h-44 w-44 rounded-full bg-gradient-to-br from-emerald-100/60 to-cyan-100/60 blur-3xl animate-breath" />
                </div>

                <div className="relative px-4 sm:px-6 lg:px-8 py-5 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 animate-card" style={{ animationDelay: '80ms' }}>
                            <div className="relative flex h-14 w-14 items-center justify-center rounded-3xl bg-white/80 shadow-inner ring-1 ring-white/70 hover-lift">
                                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-200/50 via-white to-indigo-100/70 blur-sm" />
                                <div className="relative flex h-11 w-11 items-center justify-center rounded-[18px] bg-gradient-to-br from-indigo-500 to-sky-400 text-white shadow-lg animate-soft-pop">
                                    <LockIcon className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-slate-500">پروژه مستندساز • کنترل لحظه‌ای</p>
                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-100">امنیت فعال</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-2xl font-black text-slate-800">داشبورد مدیریت عملیات</h1>
                                    <span className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold text-indigo-700 shadow-sm">به‌روزرسانی زنده</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 animate-card" style={{ animationDelay: '140ms' }}>
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setProfileOpen(!isProfileOpen)}
                                    className="group flex items-center gap-x-2 rounded-2xl bg-white/80 px-2 py-1 text-slate-600 shadow border border-white/60 hover:-translate-y-0.5 hover:shadow-lg transition hover-lift"
                                >
                                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-50 to-sky-50 border border-white/70 flex items-center justify-center shadow-sm">
                                        <UserIcon className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div className="hidden sm:flex flex-col items-start leading-tight">
                                        <span className="font-bold text-sm text-slate-800">{user?.name}</span>
                                        <span className="text-xs text-slate-500">{user?.role}</span>
                                    </div>
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isProfileOpen && <ProfileDropdown onLogoutClick={() => setLogoutModalOpen(true)} />}
                            </div>
                            <button
                                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 border border-white/70 shadow hover:shadow-lg transition"
                                aria-label="اعلان‌ها"
                            >
                                <BellIcon className="w-5 h-5 text-amber-500" />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[260px]">
                            <div className="absolute left-3 top-2.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-indigo-500 shadow-sm border border-white/80">
                                <SearchIcon className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="جستجو در فایل‌های صوتی، پروژه‌ها یا عبارات..."
                                className="w-full pl-14 pr-4 py-3.5 rounded-[18px] border border-white/70 bg-white/90 shadow-inner focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-slate-700 placeholder:text-slate-400"
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <div className="rounded-2xl px-3 py-2 text-[11px] font-semibold text-amber-800 shadow-sm border border-amber-100 pulse-chip animate-card" style={{ animationDelay: '60ms' }}>{processingCount} در حال پردازش</div>
                            <div className="rounded-2xl px-3 py-2 text-[11px] font-semibold text-emerald-700 shadow-sm border border-emerald-100 pulse-chip animate-card" style={{ animationDelay: '120ms' }}>{approvedCount} تایید شده</div>
                            <div className="rounded-2xl px-3 py-2 text-[11px] font-semibold text-indigo-700 shadow-sm border border-indigo-100 pulse-chip animate-card" style={{ animationDelay: '180ms' }}>{totalFiles} فایل</div>
                        </div>
                        <button
                            onClick={() => navigate('/upload')}
                            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:shadow-xl hover:-translate-y-0.5 hover-lift"
                        >
                            <UploadIcon className="w-5 h-5" />
                            <span>بارگذاری سریع</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs text-slate-600">
                        <div className="frosted-chip px-3 py-3 rounded-2xl flex flex-col gap-1 shadow-sm border border-white/70">
                            <span className="text-[11px] text-rose-500 font-semibold">در حال پردازش</span>
                            <span className="text-slate-900 font-bold text-base">{processingCount}</span>
                        </div>
                        <div className="frosted-chip px-3 py-3 rounded-2xl flex flex-col gap-1 shadow-sm border border-white/70">
                            <span className="text-[11px] text-indigo-500 font-semibold">در صف</span>
                            <span className="text-slate-900 font-bold text-base">{processingCount}</span>
                        </div>
                        <div className="frosted-chip px-3 py-3 rounded-2xl flex flex-col gap-1 shadow-sm border border-white/70">
                            <span className="text-[11px] text-teal-500 font-semibold">فایل موفق</span>
                            <span className="text-slate-900 font-bold text-base">{approvedCount}</span>
                        </div>
                        <div className="frosted-chip px-3 py-3 rounded-2xl flex flex-col gap-1 shadow-sm border border-white/70">
                            <span className="text-[11px] text-fuchsia-500 font-semibold">فایل رد شده</span>
                            <span className="text-slate-900 font-bold text-base">{rejectedCount}</span>
                        </div>
                        <div className="frosted-chip px-3 py-3 rounded-2xl flex flex-col gap-1 shadow-sm border border-white/70">
                            <span className="text-[11px] text-amber-600 font-semibold">کل فایل</span>
                            <span className="text-slate-900 font-bold text-base">{totalFiles}</span>
                        </div>
                        <div className="frosted-chip px-3 py-3 rounded-2xl flex flex-col gap-1 shadow-sm border border-white/70">
                            <span className="text-[11px] text-slate-500 font-semibold">فایل امروز</span>
                            <span className="text-slate-900 font-bold text-base">{totalFiles}</span>
                        </div>
                    </div>
                </div>
            </header>
            {isLogoutModalOpen && (
                <LogoutModal
                    onClose={() => setLogoutModalOpen(false)}
                    onConfirm={handleLogout}
                />
            )}
        </>
    );
};

export default Header;
