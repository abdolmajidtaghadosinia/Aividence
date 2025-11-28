import React from 'react';
import { FileStatus } from '../../types';
import { toPersianDigits } from '../../constants';

interface StatusChartProps {
    stats: {
        pending: number;
        processing: number;
        processed: number;
        approved: number;
        unavailable: number;
        rejected: number;
        total: number;
    };
}

const DonutSegment: React.FC<{
    radius: number;
    strokeWidth: number;
    color: string;
    percentage: number;
    offset: number;
}> = ({ radius, strokeWidth, color, percentage, offset }) => {
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = (offset / 100) * circumference;

    return (
        <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            transform={`rotate(-90 50 50)`}
            style={{ strokeDashoffset: -strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            strokeLinecap="round"
        />
    );
};

const StatusChart: React.FC<StatusChartProps> = ({ stats }) => {
    const { total, approved, rejected, pending, processing, processed, unavailable } = stats;

    const data = [
        { name: FileStatus.Approved, value: approved, color: '#22c55e' }, // green-500
        { name: FileStatus.Processed, value: processed, color: '#a855f7' }, // purple-500
        { name: FileStatus.Pending, value: pending, color: '#eab308' }, // yellow-500
        { name: FileStatus.Processing, value: processing, color: '#0ea5e9' }, // sky-500
        { name: FileStatus.ServiceUnavailable, value: unavailable, color: '#f59e0b' }, // amber-500
        { name: FileStatus.Rejected, value: rejected, color: '#ef4444' }, // red-500
    ];

    const radius = 40;
    const strokeWidth = 10;
    let accumulatedPercentage = 0;

    return (
        <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4">نمودار وضعیت فایل‌های صوتی</h3>
            <div className="relative w-48 h-48 mx-auto">
                <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#e2e8f0" strokeWidth={strokeWidth} />
                    {data.map((item, index) => {
                        const percentage = total > 0 ? (item.value / total) * 100 : 0;
                        const offset = accumulatedPercentage;
                        accumulatedPercentage += percentage;
                        return (
                            <DonutSegment
                                key={index}
                                radius={radius}
                                strokeWidth={strokeWidth}
                                color={item.color}
                                percentage={percentage}
                                offset={offset}
                            />
                        );
                    })}
                </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-slate-800">{toPersianDigits(total)}</span>
                    <span className="text-sm text-slate-500">مجموع</span>
                </div>
            </div>
            <div className="mt-6 space-y-2 text-sm">
                {data.map((item) => (
                     <div key={item.name} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                            <span>{item.name}</span>
                        </div>
                        <span className="font-semibold">{toPersianDigits(item.value)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StatusChart;
