import React from 'react';
import { toPersianDigits } from '../../constants';
import { UsersIcon, ClockIcon, ProcessingIcon, CheckIcon } from '../Icons';
import { FileStatus } from '../../types';

interface StatCardProps {
    title: string;
    count: number;
    colorTheme: 'orange' | 'yellow' | 'blue' | 'green' | 'gray' | 'purple' | 'amber';
    status: FileStatus | 'all';
    onFilterClick: (status: FileStatus | 'all') => void;
    isActive: boolean;
}

const THEMES: Record<string, { bg: string; text: string; icon: React.ReactElement; accent: string }> = {
    orange: { bg: 'from-[#f7efe3] via-[#efe0d0] to-[#e6d4c2]', text: 'text-[#d88432]', icon: <UsersIcon />, accent: 'bg-[#efb373]' },
    yellow: { bg: 'from-[#f5f0df] via-[#ecdec2] to-[#e3d5b4]', text: 'text-[#c77b24]', icon: <ClockIcon />, accent: 'bg-[#e3b15e]' },
    blue: { bg: 'from-[#e7edf7] via-[#dbe4f4] to-[#d2ddef]', text: 'text-[#2f6cb3]', icon: <ProcessingIcon />, accent: 'bg-[#7aa4d6]' },
    green: { bg: 'from-[#e6f4f0] via-[#d6ebe5] to-[#cbe3dd]', text: 'text-[#1f8a6a]', icon: <CheckIcon />, accent: 'bg-[#70c4a3]' },
    gray: { bg: 'from-[#eceff4] via-[#e2e6ee] to-[#d8dde8]', text: 'text-[#475569]', icon: <ClockIcon />, accent: 'bg-[#c1c8d6]' },
    amber: { bg: 'from-[#fff4e5] via-[#fde9cc] to-[#f9d9a8]', text: 'text-[#b45309]', icon: <ClockIcon />, accent: 'bg-[#fbbf24]' },
    purple: { bg: 'from-[#e8e9f6] via-[#dcdeef] to-[#d2d6eb]', text: 'text-[#4c579f]', icon: <ProcessingIcon />, accent: 'bg-[#8d9add]' },
};

const StatCard: React.FC<StatCardProps> = ({ title, count, colorTheme, status, onFilterClick, isActive }) => {
    const theme = THEMES[colorTheme] || THEMES.orange;
    const icon = React.cloneElement(theme.icon, { className: `w-6 h-6 ${theme.text}` });
    const accentWidth = Math.min(100, Math.max(18, count * 6));

    return (
        <div
            className={`relative overflow-hidden p-5 rounded-[22px] bg-gradient-to-br ${theme.bg} shadow-lg shadow-slate-500/15 transition-all duration-200 cursor-pointer border border-slate-200/70 ${isActive ? 'ring-2 ring-offset-2 ring-[#4b5f95] ring-offset-white' : ''} animate-card hover-lift`}
            onClick={() => onFilterClick(status)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && onFilterClick(status)}
        >
            <div className="flex items-center justify-between relative z-10">
                <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200 shadow-inner">
                    {icon}
                </div>
                <p className="font-semibold text-slate-700 text-base text-left">{title}</p>
            </div>
            <div className="mt-4 flex items-center justify-between relative z-10">
                <p className={`text-4xl font-extrabold ${theme.text}`}>{toPersianDigits(count)}</p>
                <span className="text-xs font-semibold text-slate-600 bg-white/85 px-3 py-1 rounded-full border border-slate-200">کلیک برای فیلتر</span>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/70 overflow-hidden">
                <div className={`h-full ${theme.accent} rounded-full`} style={{ width: `${accentWidth}%` }}></div>
            </div>
        </div>
    );
};

export default StatCard;
