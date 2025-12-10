import { Link, useForm } from '@inertiajs/react';
import { Home, ShoppingCart, Heart, User, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function BuyerLayout({ children }) {
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
                                <h1 className="text-xl font-bold text-gray-800 select-none">Fala</h1>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <Link
                                    href="/buyer/dashboard"
                                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor-pointer select-none"
                                >
                                    <Home className="w-4 h-4 mr-2" />
                                    Início
                                </Link>
                                <Link
                                    href="/buyer/orders"
                                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor-pointer select-none"
                                >
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    Meus Pedidos
                                </Link>
                                <Link
                                    href="/buyer/wishlist"
                                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor-pointer select-none"
                                >
                                    <Heart className="w-4 h-4 mr-2" />
                                    Favoritos
                                </Link>
                                <Link
                                    href="/buyer/profile"
                                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor-pointer select-none"
                                >
                                    <User className="w-4 h-4 mr-2" />
                                    Perfil
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
                                href="/buyer/dashboard"
                                className="flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer select-none"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Home className="w-5 h-5 mr-3" />
                                Início
                            </Link>
                            <Link
                                href="/buyer/orders"
                                className="flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer select-none"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <ShoppingCart className="w-5 h-5 mr-3" />
                                Meus Pedidos
                            </Link>
                            <Link
                                href="/buyer/wishlist"
                                className="flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer select-none"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Heart className="w-5 h-5 mr-3" />
                                Favoritos
                            </Link>
                            <Link
                                href="/buyer/profile"
                                className="flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer select-none"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <User className="w-5 h-5 mr-3" />
                                Perfil
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
