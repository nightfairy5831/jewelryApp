import { Link, useForm } from '@inertiajs/react';
import { Home, Users, Package, Mail, Settings, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function AdminLayout({ children }) {
    const { post, processing } = useForm();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        post(route('logout'));
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-sm border-b select-none">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <h1 className="text-lg sm:text-xl font-bold text-gray-800 select-none">Fala Admin</h1>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <Link
                                    href="/admin/dashboard"
                                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor-pointer select-none"
                                >
                                    <Home className="w-4 h-4 mr-2" />
                                    Dashboard
                                </Link>
                                <Link
                                    href="/admin/sellers"
                                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor-pointer select-none"
                                >
                                    <Users className="w-4 h-4 mr-2" />
                                    Sellers
                                </Link>
                                <Link
                                    href="/admin/products"
                                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor-pointer select-none"
                                >
                                    <Package className="w-4 h-4 mr-2" />
                                    Products
                                </Link>
                                <Link
                                    href="/admin/emails"
                                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor-pointer select-none"
                                >
                                    <Mail className="w-4 h-4 mr-2" />
                                    Email
                                </Link>
                                <Link
                                    href="/admin/email-logs"
                                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor-pointer select-none"
                                >
                                    <Mail className="w-4 h-4 mr-2" />
                                    Logs
                                </Link>
                                <Link
                                    href="/admin/settings"
                                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor-pointer select-none"
                                >
                                    <Settings className="w-4 h-4 mr-2" />
                                    Settings
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <Button
                                onClick={handleLogout}
                                disabled={processing}
                                variant="outline"
                                size="sm"
                                className="hidden sm:flex"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sair
                            </Button>
                            {/* Mobile menu button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="sm:hidden border-t border-gray-200">
                        <div className="pt-2 pb-3 space-y-1">
                            <Link
                                href="/admin/dashboard"
                                className="flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer select-none"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Home className="w-5 h-5 mr-3" />
                                Dashboard
                            </Link>
                            <Link
                                href="/admin/sellers"
                                className="flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer select-none"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Users className="w-5 h-5 mr-3" />
                                Sellers
                            </Link>
                            <Link
                                href="/admin/products"
                                className="flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer select-none"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Package className="w-5 h-5 mr-3" />
                                Products
                            </Link>
                            <Link
                                href="/admin/emails"
                                className="flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer select-none"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Mail className="w-5 h-5 mr-3" />
                                Email
                            </Link>
                            <Link
                                href="/admin/email-logs"
                                className="flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer select-none"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Mail className="w-5 h-5 mr-3" />
                                Email Logs
                            </Link>
                            <Link
                                href="/admin/settings"
                                className="flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer select-none"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Settings className="w-5 h-5 mr-3" />
                                Settings
                            </Link>
                            <button
                                onClick={handleLogout}
                                disabled={processing}
                                className="w-full flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer select-none"
                            >
                                <LogOut className="w-5 h-5 mr-3" />
                                Sair
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            <main className="py-4 sm:py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
