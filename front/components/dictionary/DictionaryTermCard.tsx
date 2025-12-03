import React, { useState } from 'react';
import { DictionaryTerm } from '../../types';
import { CheckIcon, XIcon, EditIcon } from '../Icons';
import { updateDictionaryTerm } from '../../api/api';

type DictionaryTermCardProps = {
    term: DictionaryTerm;
    onUpdate: (id: DictionaryTerm['id'], description: string) => void;
};

const DictionaryTermCard: React.FC<DictionaryTermCardProps> = ({ term, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [description, setDescription] = useState(term.description);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        setDescription(term.description);
    }, [term.description]);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setError(null);
            
            // ارسال درخواست PUT برای به‌روزرسانی description
            const updated = await updateDictionaryTerm(term.id, description);
            onUpdate(term.id, updated.description);
            setIsEditing(false);
            console.log("Description updated successfully:", description);
        } catch (err: any) {
            setError(err.message || 'خطا در به‌روزرسانی توضیحات');
            console.error("Error updating description:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setDescription(term.description);
        setError(null);
        setIsEditing(false);
    };

    return (
        <div className="soft-card p-4 rounded-2xl border border-white/80 flex flex-col justify-between transition-all hover:shadow-xl">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-900">{term.Keyword}</h3>
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full border border-indigo-100">{term.subset}</span>
                </div>
                {isEditing ? (
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full text-sm text-slate-700 p-2 border border-indigo-100 rounded-xl resize-none focus:ring-indigo-400 focus:border-indigo-300 bg-white"
                        rows={4}
                    />
                ) : (
                    <p className="text-sm text-slate-600 h-20 overflow-hidden">{description}</p>
                )}
            </div>
            <div className="mt-4 flex justify-end items-center h-8">
                {isEditing ? (
                    <div className="flex gap-2">
                        <button onClick={handleCancel} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full" title="لغو"><XIcon className="w-5 h-5"/></button>
                        <button onClick={handleSave} disabled={isSaving} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full disabled:opacity-60" title="ذخیره">
                            <CheckIcon className="w-5 h-5"/>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-sm text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                    >
                        <EditIcon className="w-4 h-4" />
                        <span>ویرایش</span>
                    </button>
                )}
            </div>
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
    );
}

export default DictionaryTermCard;