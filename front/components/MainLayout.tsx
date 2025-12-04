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
        <div className="relative min-h-screen overflow-x-hidden text-slate-100 animate-page-safe">
            <div className="pointer-events-none absolute -top-16 -left-10 h-72 w-72 rounded-full bg-gradient-to-br from-[#58bdf3]/60 via-[#3a64e0]/55 to-[#10244c]/55 blur-[120px] opacity-90" />
            <div className="pointer-events-none absolute -bottom-40 -right-10 h-96 w-96 rounded-full bg-gradient-to-tr from-[#101a33]/75 via-[#0c2344]/70 to-[#0e1730]/70 blur-[140px] opacity-80" />
            <div className="pointer-events-none absolute top-24 left-1/3 h-[22rem] w-[22rem] rounded-full bg-gradient-to-br from-[#8b5cf6]/45 via-[#14b8a6]/35 to-[#0ea5e9]/35 blur-[150px] opacity-80" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_35%),radial-gradient(circle_at_20%_40%,rgba(94,234,212,0.08),transparent_45%)]" />

            <Sidebar />

            <div className="relative flex items-start gap-5 px-4 sm:px-6 lg:px-10 py-6 floating-dots grid-overlay md:pr-[23rem] lg:pr-[25rem]">
                <div className="flex-1 flex flex-col gap-5 max-w-7xl mx-auto w-full">
                    <Header searchTerm={headerSearchTerm} onSearchChange={setHeaderSearchTerm} />
                    <main className="flex-grow">
                        <div className="neo-panel p-4 sm:p-6 lg:p-8 border border-white/70 animate-card shadow-[0_24px_80px_rgba(9,16,40,0.25)]">
                            <Outlet context={{ headerSearchTerm, setHeaderSearchTerm }} />
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default MainLayout;