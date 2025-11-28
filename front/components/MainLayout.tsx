import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

/**
 * Primary shell layout that anchors the persistent sidebar and header around routed content.
 *
 * @returns {JSX.Element} The application frame with decorative backgrounds and routed outlet.
 */
const MainLayout: React.FC = () => {
    const [headerSearchTerm, setHeaderSearchTerm] = useState('');

    return (
        <div className="relative min-h-screen overflow-x-hidden text-slate-800 animate-page">
            <div className="pointer-events-none absolute -top-24 -left-10 h-64 w-64 rounded-full bg-gradient-to-br from-[#f1e8ff] via-[#e6f3ff] to-[#fdf6ff] blur-[90px] opacity-90" />
            <div className="pointer-events-none absolute -bottom-32 -right-6 h-80 w-80 rounded-full bg-gradient-to-tr from-[#ffe4c7] via-[#f5e6ff] to-[#eaf4ff] blur-[110px] opacity-80" />
            <div className="pointer-events-none absolute top-32 left-1/2 h-72 w-72 rounded-full bg-gradient-to-br from-[#c2d9ff] via-[#e6ddff] to-[#fff3f6] blur-[120px] opacity-70" />

            <div className="relative flex items-start gap-5 px-4 sm:px-6 lg:px-10 py-6 floating-dots">
                <Sidebar />
                <div className="flex-1 flex flex-col gap-5 max-w-7xl mx-auto w-full">
                    <Header searchTerm={headerSearchTerm} onSearchChange={setHeaderSearchTerm} />
                    <main className="flex-grow">
                        <div className="neo-panel p-4 sm:p-6 lg:p-8 border border-white/70 animate-card">
                            <Outlet context={{ headerSearchTerm, setHeaderSearchTerm }} />
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default MainLayout;