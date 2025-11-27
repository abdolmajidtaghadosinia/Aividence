import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogoIcon, DashboardIcon, UploadIcon, DictionaryIcon } from './Icons';
import Logo from './Logo';

const Sidebar: React.FC = () => {
    const navigate = useNavigate();

    const getNavLinkClass = ({ isActive }: { isActive: boolean }) => {
        const baseClass = "flex items-center gap-x-3 px-4 py-3 rounded-2xl transition-all duration-200 text-base font-medium";
        return isActive
            ? `${baseClass} bg-gradient-to-l from-indigo-500 to-sky-500 text-white shadow-lg shadow-indigo-100`
            : `${baseClass} text-slate-600 hover:bg-white/80 hover:text-indigo-600 border border-white/60`;
    };

    return (
        <aside className="w-72 glass-panel flex-shrink-0 flex-col hidden md:flex rounded-[28px] p-5 h-[92vh] sticky top-6">
            <div className="p-4 rounded-3xl bg-gradient-to-r from-indigo-50/80 via-white to-amber-50/70 border border-white/70 shadow-inner flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white shadow flex items-center justify-center">
                    <LogoIcon className="w-7 h-7 text-indigo-600" />
                </div>
                <div className="flex-1">
                    <Logo size="sm" showText className="justify-start" />
                    <p className="text-xs text-slate-500 mt-1">پنل مدیریت هوشمند</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs bg-emerald-50 text-emerald-600 border border-emerald-100">Online</span>
            </div>

            <nav className="flex-grow py-6">
                <p className="text-xs text-slate-400 font-semibold px-2 mb-3">بخش ها</p>
                <ul className="space-y-3">
                    <li>
                        <NavLink to="/dashboard" className={getNavLinkClass}>
                            <DashboardIcon className="w-5 h-5" />
                            <span>داشبورد</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/upload" className={getNavLinkClass}>
                            <UploadIcon className="w-5 h-5" />
                            <span>بارگذاری صوت</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/dictionary" className={getNavLinkClass}>
                            <DictionaryIcon className="w-5 h-5" />
                            <span>دیکشنری</span>
                        </NavLink>
                    </li>
                </ul>
            </nav>

            <div className="soft-card rounded-3xl p-4 text-center text-slate-600">
                 <p className="font-bold text-slate-800 mb-1">پروژه مستندساز</p>
                 <p className="text-xs text-slate-400 mb-3">پایش لحظه‌ای فایل‌های صوتی</p>
                 <button
                    onClick={() => navigate('/upload')}
                    className="w-full pill-button text-sm font-bold py-2 rounded-xl hover:shadow-xl transition"
                 >
                    + فایل جدید
                 </button>
            </div>
        </aside>
    );
};

export default Sidebar;
