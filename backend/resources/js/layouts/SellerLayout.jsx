import { Link, useForm } from '@inertiajs/react';
import { Home, Package, ShoppingCart, BarChart, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function SellerLayout({ children }) {
    const { post, processing } = useForm();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        post(route('logout'));
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <h1 className="text-base sm:text-xl font-bold text-gray-800 select-none">Fala Vendedor</h1>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <Link
                                    href="/seller/dashboard"
                                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor-pointer select-none"
                                >
                                    <Home className="w-4 h-4 mr-2" />
                                    Dashboard
                                </Link>
                                <Link
                                    href="/seller/products"
                                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor-pointer select-none"
                                >
                                    <Package className="w-4 h-4 mr-2" />
                                    Produtos
                                </Link>
                                <Link
                                    href="/seller/orders"
                                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor-pointer select-none"
                                >
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    Pedidos
                                </Link>
                                <Link
                                    href="/seller/analytics"
                                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor-pointer select-none"
                                >
                                    <BarChart className="w-4 h-4 mr-2" />
                                    Análises
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
                                href="/seller/dashboard"
                                className="flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer select-none"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Home className="w-5 h-5 mr-3" />
                                Dashboard
                            </Link>
                            <Link
                                href="/seller/products"
                                className="flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer select-none"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Package className="w-5 h-5 mr-3" />
                                Produtos
                            </Link>
                            <Link
                                href="/seller/orders"
                                className="flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer select-none"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <ShoppingCart className="w-5 h-5 mr-3" />
                                Pedidos
                            </Link>
                            <Link
                                href="/seller/analytics"
                                className="flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer select-none"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <BarChart className="w-5 h-5 mr-3" />
                                Análises
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
