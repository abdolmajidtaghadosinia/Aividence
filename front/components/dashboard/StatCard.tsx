import React from 'react';
import { toPersianDigits } from '../../constants';
import { UsersIcon, ClockIcon, ProcessingIcon, CheckIcon } from '../Icons';
import { FileStatus } from '../../types';

interface StatCardProps {
    title: string;
    count: number;
    colorTheme: 'orange' | 'yellow' | 'blue' | 'green' | 'gray' | 'purple';
    status: FileStatus | 'all';
    onFilterClick: (status: FileStatus | 'all') => void;
    isActive: boolean;
}

const THEMES: Record<string, { bg: string; text: string; icon: React.ReactElement; accent: string }> = {
    orange: { bg: 'from-amber-100 via-orange-50 to-white', text: 'text-amber-600', icon: <UsersIcon />, accent: 'bg-orange-400' },
    yellow: { bg: 'from-yellow-100 via-amber-50 to-white', text: 'text-amber-600', icon: <ClockIcon />, accent: 'bg-amber-400' },
    blue: { bg: 'from-sky-100 via-blue-50 to-white', text: 'text-sky-600', icon: <ProcessingIcon />, accent: 'bg-sky-500' },
    green: { bg: 'from-emerald-100 via-green-50 to-white', text: 'text-emerald-600', icon: <CheckIcon />, accent: 'bg-emerald-500' },
    gray: { bg: 'from-slate-100 via-slate-50 to-white', text: 'text-slate-600', icon: <ClockIcon />, accent: 'bg-slate-400' },
    purple: { bg: 'from-purple-100 via-indigo-50 to-white', text: 'text-purple-600', icon: <ProcessingIcon />, accent: 'bg-purple-500' },
};

const StatCard: React.FC<StatCardProps> = ({ title, count, colorTheme, status, onFilterClick, isActive }) => {
    const theme = THEMES[colorTheme] || THEMES.orange;
    const icon = React.cloneElement(theme.icon, { className: `w-6 h-6 ${theme.text}` });
    const accentWidth = Math.min(100, Math.max(18, count * 6));

    return (
        <div
            className={`relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br ${theme.bg} shadow-lg shadow-slate-200/60 transition-all duration-200 cursor-pointer border border-white/70 ${isActive ? 'ring-2 ring-offset-2 ring-indigo-400' : ''} animate-card hover-lift`}
            onClick={() => onFilterClick(status)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && onFilterClick(status)}
        >
            <div className="flex items-center justify-between relative z-10">
                <div className="p-2.5 rounded-xl bg-white/70 border border-white/70 shadow-inner">
                    {icon}
                </div>
                <p className="font-semibold text-slate-700 text-base text-left">{title}</p>
            </div>
            <div className="mt-4 flex items-center justify-between relative z-10">
                <p className={`text-4xl font-extrabold ${theme.text}`}>{toPersianDigits(count)}</p>
                <span className="text-xs font-semibold text-slate-500 bg-white/70 px-3 py-1 rounded-full border border-white/80">کلیک برای فیلتر</span>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/70 overflow-hidden">
                <div className={`h-full ${theme.accent} rounded-full`} style={{ width: `${accentWidth}%` }}></div>
            </div>
        </div>
    );
};

export default StatCard;
