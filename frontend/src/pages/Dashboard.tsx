

export const Dashboard = () => {
    return (
        <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
            {/* Sidebar / Overlay */}
            <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col z-10 shadow-xl">
                <div className="p-4 border-b border-gray-700 bg-gray-900">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                        ShieldMaiden
                    </h1>
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm text-gray-400">Secure Storage</span>
                        <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-sm font-mono">
                            Online
                        </span>
                    </div>
                </div>

                {/* Navigation / Menu Placeholder */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <p className="text-gray-500 text-sm italic">Dashboard module ready.</p>
                </div>

                {/* Status Footer */}
                <div className="p-3 border-t border-gray-700 bg-gray-900 text-xs text-gray-500 flex justify-between">
                    <span>System: Encrypted</span>
                    <span className="text-green-500">Secure</span>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 relative flex items-center justify-center bg-gray-950">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-700">ShieldMaiden Secure Vault</h2>
                    <p className="text-gray-500 mt-2">Select a module to begin.</p>
                </div>
            </div>
        </div>
    );
};
