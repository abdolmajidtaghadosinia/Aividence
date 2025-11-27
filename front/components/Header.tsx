import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClickOutside } from '../hooks/useClickOutside';
import { useFiles } from '../contexts/FileContext';
import { FileStatus } from '../types';
import { UserIcon, LogoutIcon, ChevronDownIcon, BellIcon, SearchIcon, UploadIcon } from './Icons';
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
const Header: React.FC = () => {
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

    return (
        <>
            <header className="glass-panel rounded-[32px] px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl gradient-chip flex items-center justify-center shadow-inner">
                                <Logo size="sm" showText={false} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">پروژه مستندساز • کنترل لحظه‌ای</p>
                                <h1 className="text-xl font-bold text-slate-800">داشبورد مدیریت عملیات</h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-x-2 text-slate-600 hover:text-indigo-600 transition"
                                >
                                    <div className="w-11 h-11 bg-gradient-to-br from-indigo-50 to-sky-50 border border-white/70 rounded-2xl flex items-center justify-center shadow-sm">
                                        <UserIcon className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div className="hidden sm:flex flex-col items-start">
                                        <span className="font-semibold text-sm">{user?.name}</span>
                                        <span className="text-xs text-slate-500">{user?.role}</span>
                                    </div>
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isProfileOpen && <ProfileDropdown onLogoutClick={() => setLogoutModalOpen(true)} />}
                            </div>
                            <button
                                className="w-11 h-11 rounded-2xl bg-white border border-white/70 shadow flex items-center justify-center hover:shadow-lg transition"
                                aria-label="اعلان‌ها"
                            >
                                <BellIcon className="w-5 h-5 text-amber-500" />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[240px]">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="جستجو در فایل‌های صوتی، پروژه‌ها یا عبارات..."
                                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-white/70 bg-white/80 shadow-inner focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <div className="px-3 py-2 rounded-2xl bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-100">{processingCount} در حال پردازش</div>
                            <div className="px-3 py-2 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">{approvedCount} تایید شده</div>
                            <div className="px-3 py-2 rounded-2xl bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">{totalFiles} فایل</div>
                        </div>
                        <button
                            onClick={() => navigate('/upload')}
                            className="pill-button px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-bold transition hover:shadow-xl"
                        >
                            <UploadIcon className="w-5 h-5" />
                            <span>بارگذاری سریع</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-600">
                        <div className="frosted-chip px-3 py-2 rounded-2xl flex items-center justify-between">
                            <span>تکمیل امروز</span>
                            <span className="text-indigo-700 font-bold">{approvedCount}</span>
                        </div>
                        <div className="frosted-chip px-3 py-2 rounded-2xl flex items-center justify-between">
                            <span>در صف</span>
                            <span className="text-amber-600 font-bold">{processingCount}</span>
                        </div>
                        <div className="frosted-chip px-3 py-2 rounded-2xl flex items-center justify-between">
                            <span>کل فایل‌ها</span>
                            <span className="text-slate-800 font-bold">{totalFiles}</span>
                        </div>
                        <div className="frosted-chip px-3 py-2 rounded-2xl hidden md:flex items-center justify-between">
                            <span>کاربر فعال</span>
                            <span className="text-emerald-600 font-bold">{user?.name}</span>
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
