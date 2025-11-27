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

            <div className="mt-4 rounded-2xl soft-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-semibold">پروژه‌ها</p>
                    <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] border border-indigo-100">3 فعال</span>
                </div>
                <div className="flex flex-col gap-2 text-sm text-slate-700">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white/70 border border-white/80">
                        <span className="font-semibold">سند مرجع</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">پیشرفت ۸۰%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white/70 border border-white/80">
                        <span className="font-semibold">لایو ثبت</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700">در انتظار</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white/70 border border-white/80">
                        <span className="font-semibold">گزارش صوتی</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-sky-50 text-sky-700">در حال پردازش</span>
                    </div>
                </div>
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

            <div className="soft-card rounded-3xl p-4 text-slate-700 space-y-4">
                 <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-800">برنامه امروز</p>
                    <span className="text-[11px] px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">۳ جلسه</span>
                 </div>
                 <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                        <span className="px-2 py-1 rounded-xl bg-white/80 border border-white/70 text-xs">۰۹:۰۰</span>
                        <div>
                            <p className="font-semibold text-slate-800">بررسی فایل‌های جدید</p>
                            <p className="text-xs text-slate-500">همگام سازی ورودی‌های امروز</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="px-2 py-1 rounded-xl bg-white/80 border border-white/70 text-xs">۱۲:۳۰</span>
                        <div>
                            <p className="font-semibold text-slate-800">جلسه تیم محتوا</p>
                            <p className="text-xs text-slate-500">مرور خروجی‌های تایید شده</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="px-2 py-1 rounded-xl bg-white/80 border border-white/70 text-xs">۱۶:۰۰</span>
                        <div>
                            <p className="font-semibold text-slate-800">برنامه ریزی آپلود</p>
                            <p className="text-xs text-slate-500">تنظیم صف پردازش فردا</p>
                        </div>
                    </div>
                 </div>
                 <button
                    onClick={() => navigate('/upload')}
                    className="w-full pill-button text-sm font-bold py-2.5 rounded-xl hover:shadow-xl transition"
                 >
                    + فایل جدید
                 </button>
            </div>
        </aside>
    );
};

export default Sidebar;
