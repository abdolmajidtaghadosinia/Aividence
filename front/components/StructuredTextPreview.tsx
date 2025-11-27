import React from 'react';

interface StructuredTextPreviewProps {
    text: string;
    title?: string;
    subject?: string;
    dateLabel?: string;
    dateValue?: string;
}

const StructuredTextPreview: React.FC<StructuredTextPreviewProps> = ({
    text,
    title = 'متن ساختار یافته',
    subject,
    dateLabel = 'تاریخ',
    dateValue,
}) => {
    const formattedDate = dateValue || new Intl.DateTimeFormat('fa-IR').format(new Date());

    return (
        <div>
            <h3 className="text-lg font-bold mb-2">{title}</h3>
            {subject && (
                <p className="text-gray-600 mb-1">
                    <strong>موضوع:</strong> {subject}
                </p>
            )}
            <p className="text-gray-600 mb-4">
                <strong>{dateLabel}:</strong> {formattedDate}
            </p>
            <div className="whitespace-pre-wrap leading-relaxed">{text}</div>
        </div>
    );
};

export default StructuredTextPreview;
