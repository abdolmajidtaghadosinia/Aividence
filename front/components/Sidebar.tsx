import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogoIcon, DashboardIcon, UploadIcon, DictionaryIcon, AssistantIcon } from './Icons';
import Logo from './Logo';

/**
 * Build the persistent right-hand navigation with descriptive menu entries and status cards.
 *
 * @returns {JSX.Element} Sticky sidebar featuring navigation links and quick project context.
 */
const Sidebar: React.FC = () => {
    const navigate = useNavigate();

    const menuItems = [
        {
            to: '/dashboard',
            label: 'داشبورد',
            description: 'مرور سریع وضعیت سامانه',
            icon: <DashboardIcon className="w-6 h-6" />,
            gradient: 'from-indigo-500 via-sky-500 to-cyan-400',
        },
        {
            to: '/upload',
            label: 'بارگذاری صوت',
            description: 'ارسال فایل جدید به صف',
            icon: <UploadIcon className="w-6 h-6" />,
            gradient: 'from-amber-400 via-orange-400 to-pink-400',
        },
        {
            to: '/dictionary',
            label: 'دیکشنری',
            description: 'مدیریت واژه‌های کلیدی',
            icon: <DictionaryIcon className="w-6 h-6" />,
            gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
        },
        {
            to: undefined,
            label: 'دستیار هوشمند',
            description: 'به زودی فعال می‌شود',
            icon: <AssistantIcon className="w-6 h-6" />,
            gradient: 'from-violet-500 via-purple-500 to-indigo-500',
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
            'group flex items-center gap-x-3 px-4 py-3 rounded-2xl transition-all duration-200 border backdrop-blur-sm shadow-sm';
        return isActive
            ? `${baseClass} bg-gradient-to-l from-indigo-500/90 via-sky-500/90 to-cyan-500/90 text-white border-transparent shadow-lg shadow-indigo-100 hover:shadow-xl hover:-translate-y-0.5`
            : `${baseClass} bg-white/70 text-slate-700 border-white/60 hover:border-indigo-100 hover:shadow-md hover:-translate-y-0.5`;
    };

    /**
     * Wrap menu icons with a gradient chip container.
     *
     * @param {React.ReactNode} icon - Icon element to display.
     * @param {string} gradient - Tailwind gradient classes for the badge background.
     * @returns {JSX.Element} Stylized icon capsule element.
     */
    const renderIcon = (icon: React.ReactNode, gradient: string) => (
        <span
            className={`shrink-0 p-3 rounded-2xl text-white bg-gradient-to-br ${gradient} shadow-md shadow-indigo-100/60 flex items-center justify-center`}
        >
            {icon}
        </span>
    );

    return (
        <aside className="w-72 glass-panel flex-shrink-0 flex-col hidden md:flex rounded-[28px] p-5 sticky top-6 self-start max-h-[calc(100vh-32px)]">
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
                    {menuItems.map((item) => (
                        <li key={item.label}>
                            {item.disabled ? (
                                <div
                                    aria-disabled
                                    className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/60 border border-white/70 text-slate-400 shadow-sm cursor-not-allowed"
                                >
                                    {renderIcon(item.icon, item.gradient)}
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">{item.label}</span>
                                        <span className="text-xs text-slate-500">{item.description}</span>
                                    </div>
                                    <span className="ms-auto text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-500">به زودی</span>
                                </div>
                            ) : (
                                <NavLink to={item.to!} className={({ isActive }) => getNavLinkClass(isActive)}>
                                    {({ isActive }) => (
                                        <>
                                            {renderIcon(item.icon, item.gradient)}
                                            <div className="flex flex-col text-start">
                                                <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-800'}`}>
                                                    {item.label}
                                                </span>
                                                <span className={`text-xs transition-colors ${isActive ? 'text-white/90' : 'text-slate-600 group-hover:text-slate-700'}`}>
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
