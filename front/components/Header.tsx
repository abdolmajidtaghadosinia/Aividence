import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClickOutside } from '../hooks/useClickOutside';
import { useFiles } from '../contexts/FileContext';
import { FileStatus } from '../types';
import { toPersianDigits } from '../constants';
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
            <header className="relative overflow-hidden rounded-[32px] neo-widget border border-white/80 animate-soft-pop backdrop-blur-md">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -left-10 -top-14 h-44 w-44 rounded-full bg-gradient-to-br from-[#e9e2ff] via-[#d8ecff] to-[#fff2f5] blur-[100px] animate-breath" />
                    <div className="absolute right-6 top-6 h-32 w-32 rounded-full bg-gradient-to-br from-[#ffe4c7]/80 via-white/70 to-[#f2eaff]/80 blur-2xl animate-pulse-slow" />
                    <div className="absolute bottom-[-26%] left-1/3 h-56 w-56 rounded-full bg-gradient-to-br from-[#d6e7ff]/80 via-[#f4eaff]/80 to-[#ffeef5]/70 blur-[115px] animate-breath" />
                    <div className="absolute inset-x-10 top-1 h-16 bg-gradient-to-r from-[#cbd6ff]/35 via-white/0 to-[#c5e9ff]/30 blur-3xl" />
                    <div className="absolute right-10 top-14 h-16 w-16 rounded-full border border-white/60 bg-white/40 blur-md shadow-inner" />
                </div>

                <div className="relative px-4 sm:px-6 lg:px-8 py-6 space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 animate-card" style={{ animationDelay: '80ms' }}>
                            <div className="relative flex h-14 w-14 items-center justify-center rounded-3xl bg-white/90 shadow-inner ring-1 ring-white/80 hover-lift">
                                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-200/60 via-white to-indigo-100/80 blur-sm" />
                                <div className="absolute -inset-1 rounded-[22px] border border-white/50 shadow-lg" />
                                <div className="relative flex h-11 w-11 items-center justify-center rounded-[18px] bg-gradient-to-br from-indigo-600 via-sky-500 to-cyan-400 text-white shadow-xl animate-soft-pop">
                                    <LockIcon className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold text-indigo-700 shadow-sm border border-white/70">پروژه مستندساز</span>
                                    <p className="text-xs text-slate-500">کنترل لحظه‌ای • جریان هوشمند</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-2xl font-black text-slate-800">داشبورد مدیریت عملیات</h1>
                                    <span className="rounded-2xl bg-gradient-to-r from-amber-200/90 via-white to-emerald-100/80 px-3 py-1 text-[11px] font-bold text-amber-800 shadow-inner border border-white/60">نسخه پیشرفته</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 animate-card" style={{ animationDelay: '140ms' }}>
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setProfileOpen(!isProfileOpen)}
                                    className="group flex items-center gap-x-2 rounded-2xl bg-white/85 px-2 py-1 text-slate-700 shadow-lg border border-white/70 hover:-translate-y-0.5 hover:shadow-xl transition hover-lift"
                                >
                                    <div className="relative h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-50 to-sky-50 border border-white/70 flex items-center justify-center shadow-sm">
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/70 to-indigo-100/60" />
                                        <UserIcon className="relative w-6 h-6 text-indigo-600" />
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
                                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-white/90 border border-white/70 shadow hover:shadow-lg transition"
                                aria-label="اعلان‌ها"
                            >
                                <BellIcon className="w-5 h-5 text-amber-500" />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[260px]">
                            <div className="absolute left-3 top-2.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-white/90 via-[#f1edff]/80 to-white/90 text-indigo-600 shadow-sm border border-white/80">
                                <SearchIcon className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="جستجو در فایل‌های صوتی، پروژه‌ها یا عبارات..."
                                className="w-full pl-14 pr-4 py-3.5 rounded-[18px] border border-white/70 bg-gradient-to-br from-white/95 via-[#f7f5ff]/80 to-white shadow-inner focus:ring-2 focus:ring-[#c5d3ff] focus:border-[#6c5dd3] text-slate-700 placeholder:text-slate-400"
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <div className="rounded-2xl px-3 py-2 text-[11px] font-semibold text-amber-800 shadow-sm border border-amber-100 pulse-chip animate-card" style={{ animationDelay: '60ms' }}>{toPersianDigits(processingCount)} در حال پردازش</div>
                            <div className="rounded-2xl px-3 py-2 text-[11px] font-semibold text-emerald-700 shadow-sm border border-emerald-100 pulse-chip animate-card" style={{ animationDelay: '120ms' }}>{toPersianDigits(approvedCount)} تایید شده</div>
                            <div className="rounded-2xl px-3 py-2 text-[11px] font-semibold text-indigo-700 shadow-sm border border-indigo-100 pulse-chip animate-card" style={{ animationDelay: '180ms' }}>{toPersianDigits(totalFiles)} فایل</div>
                        </div>
                        <button
                            onClick={() => navigate('/upload')}
                            className="relative overflow-hidden flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 px-4 py-3 text-sm font-bold text-white shadow-xl transition hover:shadow-2xl hover:-translate-y-0.5 hover-lift"
                        >
                            <span className="absolute inset-0 bg-gradient-to-r from-white/15 via-white/0 to-white/20" />
                            <UploadIcon className="w-5 h-5" />
                            <span>بارگذاری سریع</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs text-slate-600">
                        <div className="frosted-chip px-3 py-3 rounded-2xl flex flex-col gap-1 shadow-sm border border-white/70">
                            <span className="text-[11px] text-rose-500 font-semibold">در حال پردازش</span>
                            <span className="text-slate-900 font-bold text-base">{toPersianDigits(processingCount)}</span>
                        </div>
                        <div className="frosted-chip px-3 py-3 rounded-2xl flex flex-col gap-1 shadow-sm border border-white/70">
                            <span className="text-[11px] text-indigo-500 font-semibold">در صف</span>
                            <span className="text-slate-900 font-bold text-base">{toPersianDigits(processingCount)}</span>
                        </div>
                        <div className="frosted-chip px-3 py-3 rounded-2xl flex flex-col gap-1 shadow-sm border border-white/70">
                            <span className="text-[11px] text-teal-500 font-semibold">فایل موفق</span>
                            <span className="text-slate-900 font-bold text-base">{toPersianDigits(approvedCount)}</span>
                        </div>
                        <div className="frosted-chip px-3 py-3 rounded-2xl flex flex-col gap-1 shadow-sm border border-white/70">
                            <span className="text-[11px] text-fuchsia-500 font-semibold">فایل رد شده</span>
                            <span className="text-slate-900 font-bold text-base">{toPersianDigits(rejectedCount)}</span>
                        </div>
                        <div className="frosted-chip px-3 py-3 rounded-2xl flex flex-col gap-1 shadow-sm border border-white/70">
                            <span className="text-[11px] text-amber-600 font-semibold">کل فایل</span>
                            <span className="text-slate-900 font-bold text-base">{toPersianDigits(totalFiles)}</span>
                        </div>
                        <div className="frosted-chip px-3 py-3 rounded-2xl flex flex-col gap-1 shadow-sm border border-white/70">
                            <span className="text-[11px] text-slate-500 font-semibold">فایل امروز</span>
                            <span className="text-slate-900 font-bold text-base">{toPersianDigits(totalFiles)}</span>
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
