import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClickOutside } from '../hooks/useClickOutside';
import { UserIcon, LogoutIcon, ChevronDownIcon, BellIcon, SearchIcon, UploadIcon, LockIcon } from './Icons';
import LogoutModal from './LogoutModal';

/**
 * Dropdown panel presenting account actions for the authenticated user.
 *
 * @param {{ onLogoutClick: () => void }} props - Callback invoked when logout is requested.
 * @returns {JSX.Element} Action sheet with a logout trigger.
 */
const ProfileDropdown: React.FC<{ onLogoutClick: () => void }> = ({ onLogoutClick }) => (
    <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 p-2 animate-fade-in-down z-[70]">
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

    const [isProfileOpen, setProfileOpen] = useState(false);
    const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);

    const profileRef = useRef<HTMLDivElement>(null);
    useClickOutside(profileRef, () => setProfileOpen(false));

    const handleLogout = () => {
        logout(() => navigate('/login'));
    };

    return (
        <>
            <header className="relative overflow-visible rounded-[32px] neo-widget animate-soft-pop backdrop-blur-xl text-slate-50 border border-[#27407a]/60">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-[#58bdf3]/45 via-[#4f46e5]/40 to-[#10244c]/55 blur-[120px] animate-breath" />
                    <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-gradient-to-br from-[#22d3ee]/18 via-[#93c5fd]/15 to-[#a855f7]/15 blur-[140px] animate-pulse-slow" />
                    <div className="absolute bottom-[-26%] left-1/3 h-64 w-64 rounded-full bg-gradient-to-br from-[#0ea5e9]/40 via-[#22d3ee]/35 to-[#0b1125]/35 blur-[135px] animate-breath" />
                    <div className="absolute inset-x-6 top-1 h-12 bg-gradient-to-r from-white/15 via-white/0 to-white/12 blur-3xl" />
                    <div className="absolute right-10 top-14 h-14 w-14 rounded-2xl border border-white/20 bg-white/10 blur-md shadow-inner" />
                </div>

                <div className="relative px-4 sm:px-6 lg:px-8 py-6 space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 animate-card" style={{ animationDelay: '80ms' }}>
                            <div className="relative flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-900/60 shadow-inner ring-1 ring-slate-700 hover-lift">
                                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-700/60 via-slate-800/70 to-slate-900/70 blur-sm" />
                                <div className="absolute -inset-1 rounded-[22px] border border-white/10 shadow-lg" />
                                <div className="relative flex h-11 w-11 items-center justify-center rounded-[18px] bg-gradient-to-br from-emerald-500 to-sky-500 text-white shadow-xl animate-soft-pop">
                                    <LockIcon className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-slate-100 shadow-sm border border-white/10">پروژه مستندساز</span>
                                    <p className="text-xs text-slate-300">کنترل لحظه‌ای • جریان هوشمند</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-3xl font-black text-white">داشبورد مدیریت عملیات</h1>
                                    <span className="rounded-2xl bg-gradient-to-r from-[#1f2937] via-[#0f172a] to-[#0b1224] px-3 py-1 text-[11px] font-bold text-amber-200 shadow-inner border border-white/5">نسخه پیشرفته</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 animate-card" style={{ animationDelay: '140ms' }}>
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setProfileOpen(!isProfileOpen)}
                                    className="group flex items-center gap-x-2 rounded-2xl bg-slate-900/60 px-2 py-1 text-slate-100 shadow-lg border border-slate-700 hover:-translate-y-0.5 hover:shadow-xl transition hover-lift"
                                >
                                    <div className="relative h-11 w-11 rounded-2xl bg-gradient-to-br from-slate-800/70 to-slate-900/60 border border-white/5 flex items-center justify-center shadow-sm">
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-white/0" />
                                        <UserIcon className="relative w-6 h-6 text-sky-300" />
                                    </div>
                                    <div className="hidden sm:flex flex-col items-start leading-tight">
                                        <span className="font-bold text-sm text-white">{user?.name}</span>
                                        <span className="text-xs text-slate-300">{user?.role}</span>
                                    </div>
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isProfileOpen && <ProfileDropdown onLogoutClick={() => setLogoutModalOpen(true)} />}
                            </div>
                            <button
                                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-500/40 border border-amber-200/30 shadow hover:shadow-lg transition"
                                aria-label="اعلان‌ها"
                            >
                                <BellIcon className="w-5 h-5 text-amber-200" />
                            </button>
                            <button
                                onClick={() => setLogoutModalOpen(true)}
                                className="hidden sm:inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2 text-sm font-bold text-white shadow-lg border border-rose-300/40 hover:-translate-y-0.5 hover:shadow-xl transition"
                            >
                                <LogoutIcon className="w-5 h-5" />
                                <span>خروج از سیستم</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[260px]">
                            <div className="absolute left-3 top-2.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#132548]/70 text-sky-300 shadow-sm border border-sky-500/30">
                                <SearchIcon className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="جستجو در فایل‌های صوتی، پروژه‌ها یا عبارات..."
                                className="w-full pl-14 pr-4 py-3.5 rounded-[18px] border border-[#2f3f6c] bg-[#0f1d36]/80 text-slate-100 placeholder:text-slate-300 focus:ring-2 focus:ring-[#5ee0ff] focus:border-[#5ee0ff] shadow-inner"
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => navigate('/upload', { state: { autoOpenPicker: true } })}
                            className="relative overflow-hidden flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#ef9f64] via-[#f0843c] to-[#f55d4e] px-4 py-3 text-sm font-bold text-white shadow-xl transition hover:shadow-2xl hover:-translate-y-0.5 hover-lift"
                        >
                            <span className="absolute inset-0 bg-gradient-to-r from-white/15 via-white/0 to-white/15" />
                            <UploadIcon className="w-5 h-5" />
                            <span>بارگذاری سریع</span>
                        </button>
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
