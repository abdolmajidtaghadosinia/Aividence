import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

/**
 * Primary shell layout that anchors the persistent sidebar and header around routed content.
 *
 * @returns {JSX.Element} The application frame with decorative backgrounds and routed outlet.
 */
const MainLayout: React.FC = () => {
    return (
        <div className="relative min-h-screen overflow-x-hidden text-slate-800 floating-dots">
            <div className="pointer-events-none absolute -top-28 -left-24 w-80 h-80 bg-sky-100 blur-3xl opacity-70" />
            <div className="pointer-events-none absolute -bottom-28 -right-12 w-96 h-96 bg-amber-100 blur-3xl opacity-70" />
            <div className="pointer-events-none absolute top-1/4 left-1/3 w-72 h-72 bg-indigo-100 blur-[100px] opacity-70" />
            <div className="pointer-events-none absolute bottom-12 left-10 w-64 h-64 bg-cyan-100 blur-[90px] opacity-50" />

            <div className="relative flex gap-5 px-4 sm:px-6 lg:px-10 py-6">
                <Sidebar />
                <div className="flex-1 flex flex-col gap-5 max-w-7xl mx-auto w-full">
                    <Header />
                    <main className="flex-grow">
                        <div className="glass-panel rounded-[32px] p-4 sm:p-6 lg:p-8 border border-white/70 shadow-xl shadow-indigo-50/60">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default MainLayout;