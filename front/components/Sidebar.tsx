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
        <aside className="hidden md:flex fixed top-4 lg:top-6 right-4 lg:right-6 z-40 w-80 max-w-[23rem] flex-col rounded-[30px] p-6 max-h-[calc(100vh-40px)] overflow-y-auto overflow-x-hidden animate-fade-in-down bg-gradient-to-b from-[#0f172a] via-[#0e1b31] to-[#0a1326] border border-slate-800/70 shadow-[0_24px_70px_rgba(8,15,29,0.4)] text-slate-100">
            <div className="p-5 rounded-[26px] bg-gradient-to-br from-[#111a2e] via-[#0f172a] to-[#0a1323] border border-slate-800 shadow-inner flex items-center gap-4 hover-lift">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#6bc3f8] to-[#4b5f95] shadow-lg flex items-center justify-center text-white">
                    <LogoIcon className="w-7 h-7" />
                </div>
                <div className="flex-1">
                    <Logo size="sm" showText className="justify-start text-white" />
                    <p className="text-xs text-slate-400 mt-1">داشبورد پردازش صوتی</p>
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
