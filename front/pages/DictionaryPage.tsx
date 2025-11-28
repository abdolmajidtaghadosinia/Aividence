import React, { useState, useMemo, useEffect } from 'react';
import { toPersianDigits } from '../constants';
import { DictionaryTerm } from '../types';
import {
    SearchIcon,
    ChevronDownIcon,
    FolderIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    PlusIcon
} from '../components/Icons';
import DictionaryTermCard from '../components/dictionary/DictionaryTermCard';
import { createDictionaryTerm, getDictionaryTerms } from '../api/api';

const DictionaryPage: React.FC = () => {
    const [terms, setTerms] = useState<DictionaryTerm[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [subCollectionFilter, setSubCollectionFilter] = useState('همه زیرمجموعه ها');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const [isAddFormVisible, setAddFormVisible] = useState(false);
    const [newTerm, setNewTerm] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newSubCollection, setNewSubCollection] = useState('');
    const [formError, setFormError] = useState('');

    useEffect(() => {
        const fetchDictionaryTerms = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getDictionaryTerms();
                setTerms(data);
            } catch (err: any) {
                setError(err.message || 'خطا در دریافت عبارات دیکشنری');
                console.error('Error fetching dictionary terms:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDictionaryTerms();
    }, []);

    const filteredTerms = useMemo(() => {
        return terms
            .filter(term => term.Keyword.toLowerCase().includes(searchTerm.toLowerCase()))
            .filter(term => subCollectionFilter === 'همه زیرمجموعه ها' || term.subset === subCollectionFilter);
    }, [terms, searchTerm, subCollectionFilter]);

    const paginatedTerms = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredTerms.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredTerms, currentPage]);

    const totalPages = Math.ceil(filteredTerms.length / itemsPerPage);

    const handleAddTerm = async () => {
        if (!newTerm.trim() || !newDescription.trim() || !newSubCollection.trim()) {
            setFormError('لطفاً همه فیلدها را پر کنید.');
            return;
        }

        const newTermData: DictionaryTerm = {
            id: Date.now(),
            Keyword: newTerm,
            description: newDescription,
            subset: newSubCollection,
        };

        try {
            const createdTerm = await createDictionaryTerm(newTermData);
            setTerms(prevTerms => [createdTerm, ...prevTerms]);
            setCurrentPage(1);
            setAddFormVisible(false);
            setFormError('');
            setNewTerm('');
            setNewDescription('');
            setNewSubCollection('');
        } catch (err: any) {
            setError(err.message || 'خطا در ایجاد عبارت جدید');
        }
    };

    if (loading) {
        return <div className="text-center py-10 text-gray-600">در حال بارگذاری...</div>;
    }

    if (error) {
        return (
            <div className="text-center py-10 text-red-500">
                {error}
                <button
                    onClick={() => window.location.reload()}
                    className="block mx-auto mt-4 pill-button text-white py-2 px-4 rounded"
                >
                    تلاش مجدد
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-page">
            <div className="soft-card rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg relative overflow-hidden animate-card">
                <div className="pointer-events-none absolute -left-10 -top-8 h-28 w-28 bg-emerald-200/50 blur-3xl animate-breath" />
                <div className="pointer-events-none absolute -right-14 -bottom-10 h-32 w-32 bg-purple-200/45 blur-3xl animate-breath" />
                <div>
                    <p className="text-sm text-slate-500">کتابخانه عبارات</p>
                    <h2 className="text-2xl font-black text-slate-900">اصطلاحات کلیدی سازمان را مدیریت کنید</h2>
                    <p className="text-slate-500 mt-2">جستجو، فیلتر و افزودن عبارات جدید با یک تجربه بصری تازه.</p>
                    <div className="card-divider my-3" />
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="frosted-chip px-3 py-1 rounded-full text-indigo-700 font-semibold animate-soft-pop" style={{ animationDelay: '40ms' }}>همگام با تیم</span>
                        <span className="frosted-chip px-3 py-1 rounded-full text-emerald-700 font-semibold animate-soft-pop" style={{ animationDelay: '80ms' }}>به روز</span>
                        <span className="frosted-chip px-3 py-1 rounded-full text-amber-700 font-semibold animate-soft-pop" style={{ animationDelay: '120ms' }}>دسترسی سریع</span>
                    </div>
                </div>
                <button
                    onClick={() => setAddFormVisible(true)}
                    className="pill-button flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold hover:shadow-xl transition animate-soft-pop"
                    style={{ animationDelay: '160ms' }}
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>افزودن عبارت جدید</span>
                </button>
            </div>

            <div className="glass-panel rounded-3xl p-6 animate-soft-pop">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="جستجو بر اساس نام عبارت..."
                            className="w-full pl-10 pr-4 py-3 border border-white/70 rounded-xl bg-white/80 focus:ring-indigo-500 focus:border-indigo-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    <div className="relative w-full md:w-56">
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                            <FolderIcon className="w-5 h-5" />
                        </div>
                        <select
                            className="w-full appearance-none bg-white border border-indigo-100 text-gray-700 py-2 pl-10 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            value={subCollectionFilter}
                            onChange={(e) => setSubCollectionFilter(e.target.value)}
                        >
                            <option>همه زیرمجموعه ها</option>
                            {[...new Set(terms.map(t => t.subset))].map(sc => (
                                <option key={sc} value={sc}>{sc}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-700">
                            <ChevronDownIcon className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                {isAddFormVisible && (
                    <div className="soft-card p-6 rounded-2xl mb-6 transition-all">
                        <h3 className="font-bold text-lg mb-4">افزودن عبارت جدید</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="عبارت"
                                value={newTerm}
                                onChange={(e) => setNewTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-indigo-100 rounded-xl focus:ring-indigo-400 focus:border-indigo-300"
                            />
                            <select
                                value={newSubCollection}
                                onChange={(e) => setNewSubCollection(e.target.value)}
                                className="w-full px-4 py-2 border border-indigo-100 rounded-xl bg-white focus:ring-indigo-400 focus:border-indigo-300"
                            >
                                <option value="">انتخاب زیرمجموعه</option>
                                {[...new Set(terms.map(t => t.subset))].map(sc => (
                                    <option key={sc} value={sc}>{sc}</option>
                                ))}
                            </select>
                        </div>
                        <textarea
                            placeholder="توضیحات"
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            className="w-full mt-4 px-4 py-2 border border-indigo-100 rounded-xl focus:ring-indigo-400 focus:border-indigo-300"
                            rows={3}
                        />
                        {formError && <p className="text-red-500 text-sm mt-2">{formError}</p>}
                        <div className="flex justify-end gap-4 mt-4">
                            <button
                                onClick={() => { setAddFormVisible(false); setFormError(''); }}
                                className="px-6 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                            >
                                لغو
                            </button>
                            <button
                                onClick={handleAddTerm}
                                className="px-6 py-2 rounded-xl pill-button text-white font-semibold"
                            >
                                ذخیره
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {paginatedTerms.map(term => (
                        <DictionaryTermCard key={term.id} term={term} />
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center items-center mt-8">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 mx-1 text-gray-700 transition-colors duration-300 transform bg-white rounded-md border hover:bg-indigo-500 hover:text-white disabled:opacity-50 flex items-center gap-2"
                        >
                            <ArrowRightIcon className="w-4 h-4" />
                            <span>قبلی</span>
                        </button>

                        <span className="px-4 py-2 mx-1 text-gray-700">
                            صفحه {toPersianDigits(currentPage)} از {toPersianDigits(totalPages)}
                        </span>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 mx-1 text-gray-700 transition-colors duration-300 transform bg-white rounded-md border hover:bg-indigo-500 hover:text-white disabled:opacity-50 flex items-center gap-2"
                        >
                            <span>بعدی</span>
                            <ArrowLeftIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DictionaryPage;
