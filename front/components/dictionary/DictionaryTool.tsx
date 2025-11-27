import React from 'react';
import { ArrowLeftIcon, ReplaceIcon } from '../Icons';

const DictionaryTool: React.FC = () => {
    return (
        <div className="bg-gray-50 p-4 rounded-lg border mt-4">
            <div className="flex items-center gap-4">
                <label className="font-semibold text-gray-700 whitespace-nowrap">ثبت معادل:</label>
                <input
                    type="text"
                    placeholder="انتخاب یا تایپ عبارت"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                />
                <ArrowLeftIcon className="w-6 h-6 text-gray-500 shrink-0" />
                <input
                    type="text"
                    placeholder="عبارت جایگزین"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                />
                <button className="bg-sky-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-600 transition whitespace-nowrap flex items-center gap-2">
                    <ReplaceIcon className="w-4 h-4" />
                    <span>جایگزین کن</span>
                </button>
            </div>
        </div>
    );
};

export default DictionaryTool;