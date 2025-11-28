import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogoIcon, DashboardIcon, UploadIcon, DictionaryIcon, AssistantIcon } from './Icons';
import Logo from './Logo';

/**
 * Build the persistent right-hand navigation with descriptive menu entries and status cards.
 *
 * @returns {JSX.Element} Sticky sidebar featuring navigation links and quick project context.
 */
const Sidebar: React.FC = () => {
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
            'group flex items-center gap-x-4 px-5 py-4 rounded-[22px] transition-all duration-200 border backdrop-blur-sm shadow-sm text-base';
        return isActive
            ? `${baseClass} bg-gradient-to-l from-[#6c5dd3] via-[#8a7aec] to-[#55c5ff] text-white border-transparent shadow-lg shadow-indigo-100 hover:shadow-xl hover:-translate-y-0.5`
            : `${baseClass} bg-white/85 text-slate-700 border-white/70 hover:border-indigo-100 hover:shadow-md hover:-translate-y-0.5`;
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
            className={`shrink-0 p-3.5 rounded-2xl text-white bg-gradient-to-br ${gradient} shadow-md shadow-indigo-100/60 flex items-center justify-center text-lg`}
        >
            {icon}
        </span>
    );

    return (
        <aside className="w-80 max-w-[23rem] neo-panel flex-shrink-0 flex-col hidden md:flex rounded-[30px] p-6 md:sticky md:top-6 self-start max-h-[calc(100vh-32px)] md:overflow-y-auto overflow-x-hidden animate-fade-in-down">
            <div className="p-5 rounded-[26px] bg-gradient-to-br from-white via-[#f1edff] to-[#f8f6ff] border border-white/80 shadow-inner flex items-center gap-4 hover-lift">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#6c5dd3] to-[#55c5ff] shadow-lg flex items-center justify-center text-white">
                    <LogoIcon className="w-7 h-7" />
                </div>
                <div className="flex-1">
                    <Logo size="sm" showText className="justify-start" />
                    <p className="text-xs text-slate-500 mt-1">داشبورد پردازش صوتی</p>
                </div>
            </div>

            <nav className="flex-grow py-6 overflow-x-hidden">
                <p className="text-sm text-slate-400 font-semibold px-2 mb-4">بخش ها</p>
                <ul className="space-y-3">
                    {menuItems.map((item, index) => (
                        <li key={item.label} style={{ animationDelay: `${index * 60}ms` }} className="animate-card">
                            {item.disabled ? (
                                <div
                                    aria-disabled
                                    className="flex items-center gap-3 px-4 py-3 rounded-[22px] bg-white/70 border border-white/70 text-slate-400 shadow-sm cursor-not-allowed"
                                >
                                    {renderIcon(item.icon, item.gradient)}
                                    <div className="flex flex-col">
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
                                                <span className={`text-base font-extrabold ${isActive ? 'text-white' : 'text-slate-800'}`}>
                                                    {item.label}
                                                </span>
                                                <span className={`text-sm transition-colors ${isActive ? 'text-white/90' : 'text-slate-600 group-hover:text-slate-700'}`}>
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
