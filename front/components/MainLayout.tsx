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
            <div className="pointer-events-none absolute -top-24 -left-10 h-64 w-64 rounded-full bg-gradient-to-br from-[#15233d] via-[#1a2d4a] to-[#101a2f] blur-[100px] opacity-70" />
            <div className="pointer-events-none absolute -bottom-32 -right-6 h-80 w-80 rounded-full bg-gradient-to-tr from-[#1b2c48] via-[#0f172a] to-[#09101f] blur-[120px] opacity-70" />
            <div className="pointer-events-none absolute top-32 left-1/2 h-72 w-72 rounded-full bg-gradient-to-br from-[#1d2f4a] via-[#11233c] to-[#0a1426] blur-[125px] opacity-60" />

            <Sidebar />

            <div className="relative flex items-start gap-5 px-4 sm:px-6 lg:px-10 py-6 floating-dots grid-overlay md:pr-[23rem] lg:pr-[25rem]">
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