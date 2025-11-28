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
    orange: { bg: 'from-[#fff2e4] via-white to-[#ffe9d6]', text: 'text-[#ff9f5a]', icon: <UsersIcon />, accent: 'bg-[#ffb87d]' },
    yellow: { bg: 'from-[#fff6e2] via-white to-[#ffecc7]', text: 'text-[#f3b14b]', icon: <ClockIcon />, accent: 'bg-[#f7c86a]' },
    blue: { bg: 'from-[#e8f2ff] via-white to-[#edf5ff]', text: 'text-[#5aa0ff]', icon: <ProcessingIcon />, accent: 'bg-[#7abbff]' },
    green: { bg: 'from-[#e9fff6] via-white to-[#ddf7ec]', text: 'text-[#2f9b70]', icon: <CheckIcon />, accent: 'bg-[#6cd4a3]' },
    gray: { bg: 'from-[#f5f7fb] via-white to-[#eef1f7]', text: 'text-[#6b7280]', icon: <ClockIcon />, accent: 'bg-[#cdd4e2]' },
    purple: { bg: 'from-[#efe9ff] via-white to-[#f4edff]', text: 'text-[#6c5dd3]', icon: <ProcessingIcon />, accent: 'bg-[#8b78ff]' },
};

const StatCard: React.FC<StatCardProps> = ({ title, count, colorTheme, status, onFilterClick, isActive }) => {
    const theme = THEMES[colorTheme] || THEMES.orange;
    const icon = React.cloneElement(theme.icon, { className: `w-6 h-6 ${theme.text}` });
    const accentWidth = Math.min(100, Math.max(18, count * 6));

    return (
        <div
            className={`relative overflow-hidden p-5 rounded-[22px] bg-gradient-to-br ${theme.bg} shadow-lg shadow-slate-200/60 transition-all duration-200 cursor-pointer border border-white/70 ${isActive ? 'ring-2 ring-offset-2 ring-[#6c5dd3]' : ''} animate-card hover-lift`}
            onClick={() => onFilterClick(status)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && onFilterClick(status)}
        >
            <div className="flex items-center justify-between relative z-10">
                <div className="p-2.5 rounded-xl bg-white/80 border border-white/70 shadow-inner">
                    {icon}
                </div>
                <p className="font-semibold text-slate-700 text-base text-left">{title}</p>
            </div>
            <div className="mt-4 flex items-center justify-between relative z-10">
                <p className={`text-4xl font-extrabold ${theme.text}`}>{toPersianDigits(count)}</p>
                <span className="text-xs font-semibold text-slate-500 bg-white/75 px-3 py-1 rounded-full border border-white/80">کلیک برای فیلتر</span>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/70 overflow-hidden">
                <div className={`h-full ${theme.accent} rounded-full`} style={{ width: `${accentWidth}%` }}></div>
            </div>
        </div>
    );
};

export default StatCard;
