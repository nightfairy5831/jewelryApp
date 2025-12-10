import AdminLayout from '@/layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Users, Package, UserCheck, Clock, CheckCircle, XCircle, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import SellerRegistrationsChart from '@/components/SellerRegistrationsChart';
import GoldPriceChart from '@/components/GoldPriceChart';
import { useGoldPrice } from '@/contexts/GoldPriceContext';
import { useState, useEffect } from 'react';

export default function Dashboard({ stats, recent_sellers, recent_products, gold_price_history, seller_registrations_chart }) {
    const { goldPrice, loading: goldPriceLoading, lastUpdate, refresh } = useGoldPrice();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await refresh();
        router.reload({ only: ['gold_price_history'] });
        setTimeout(() => setIsRefreshing(false), 500);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ['gold_price_history'],
                preserveScroll: true,
                preserveState: true
            });
        }, 5 * 60 * 60 * 1000); 

        return () => clearInterval(interval);
    }, []);

    const gold_price_change = gold_price_history?.length >= 2
        ? (() => {
            const latest = gold_price_history[gold_price_history.length - 1];
            const previous = gold_price_history[gold_price_history.length - 2];
            const latestPrice = latest.price_gram_24k;
            const previousPrice = previous.price_gram_24k;

            if (!latestPrice || !previousPrice) return 0;

            const change = parseFloat((((latestPrice - previousPrice) / previousPrice) * 100).toFixed(2));
            return change;
        })()
        : 0;
    const statsDisplay = [
        {
            name: 'Total de Usuários',
            value: stats.total_users,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        {
            name: 'Vendedores Aprovados',
            value: stats.total_sellers,
            icon: UserCheck,
            color: 'text-green-600',
            bg: 'bg-green-50',
        },
        {
            name: 'Compradores',
            value: stats.total_buyers,
            icon: Users,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
        },
        {
            name: 'Total de Produtos',
            value: stats.total_products,
            icon: Package,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
        },
        {
            name: 'Produtos Aprovados',
            value: stats.approved_products,
            icon: CheckCircle,
            color: 'text-green-600',
            bg: 'bg-green-50',
        },
        {
            name: 'Produtos Pendentes',
            value: stats.pending_products,
            icon: Clock,
            color: 'text-yellow-600',
            bg: 'bg-yellow-50',
        },
    ];

    return (
        <AdminLayout>
            <Head title="Dashboard" />
            <div className="px-4 sm:px-0 select-none">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Bem-vindo ao painel administrativo da Fala
                </p>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white overflow-hidden shadow rounded-lg h-full select-none">
                    <div className="p-5 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                        {goldPrice && !goldPriceLoading ? (
                            <>
                                <div className="flex flex-col items-center w-full">
                                    <div className="flex items-center justify-between w-full mb-3">
                                        <div className="flex-1"></div>
                                        <div className={`p-3 rounded-lg ${gold_price_change >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                                            {gold_price_change >= 0 ? (
                                                <TrendingUp className={`h-6 w-6 ${gold_price_change >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                                            ) : (
                                                <TrendingDown className="h-6 w-6 text-red-600" />
                                            )}
                                        </div>
                                        <div className="flex-1 flex justify-end">
                                            <button
                                                onClick={handleManualRefresh}
                                                disabled={isRefreshing}
                                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Atualizar preço"
                                            >
                                                <RefreshCw className={`h-5 w-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">
                                            Preço do Ouro (18k/g)
                                        </dt>
                                        <dd className="flex items-baseline gap-2 justify-center mt-1">
                                            <div className="text-2xl font-semibold text-gray-900">
                                                R$ {goldPrice.price_18k.toFixed(2)}
                                            </div>
                                            <span className={`text-sm font-medium ${gold_price_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {gold_price_change >= 0 ? '+' : ''}{gold_price_change}%
                                            </span>
                                        </dd>
                                        {lastUpdate && (
                                            <p className="text-xs text-gray-400 mt-2">
                                                Atualizado: {new Date(lastUpdate).toLocaleTimeString('pt-BR')}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-200 w-full">
                                    <p className="text-xs text-gray-500 mb-3 text-left">Exemplo de Produto</p>
                                    <div className="flex gap-3 items-start">
                                        <img
                                            src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200&h=200&fit=crop"
                                            alt="Anel de Ouro"
                                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0 text-left">
                                            <p className="text-sm font-medium text-gray-900 truncate">Anel de Ouro 18k</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Peso: 5g</p>
                                            <div className="mt-2 space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500">Preço Base:</span>
                                                    <span className="text-gray-900 font-medium">R$ 1.500,00</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500">Preço Atual:</span>
                                                    <span className="text-green-600 font-semibold">
                                                        R$ {(1500 + (goldPrice.price_18k * 5)).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center">
                                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-sm text-gray-500">Aguardando dados do preço do ouro...</p>
                                <p className="text-xs text-gray-400 mt-2">Os dados serão atualizados em breve</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white shadow rounded-lg select-none">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">
                            Histórico de Preços do Ouro
                        </h2>
                    </div>
                    <div className="p-6">
                        <GoldPriceChart data={gold_price_history || []} />
                    </div>
                </div>
            </div>

            <div className="mt-8 space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    {statsDisplay.slice(0, 3).map((item) => (
                        <div
                            key={item.name}
                            className="bg-white overflow-hidden shadow rounded-lg select-none"
                        >
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className={`flex-shrink-0 p-3 rounded-lg ${item.bg}`}>
                                        <item.icon
                                            className={`h-6 w-6 ${item.color}`}
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                {item.name}
                                            </dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-gray-900">
                                                    {item.value}
                                                </div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    {statsDisplay.slice(3, 6).map((item) => (
                        <div
                            key={item.name}
                            className="bg-white overflow-hidden shadow rounded-lg select-none"
                        >
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className={`flex-shrink-0 p-3 rounded-lg ${item.bg}`}>
                                        <item.icon
                                            className={`h-6 w-6 ${item.color}`}
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                {item.name}
                                            </dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-gray-900">
                                                    {item.value}
                                                </div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {seller_registrations_chart && seller_registrations_chart.length > 0 && (
                <div className="mt-8">
                    <SellerRegistrationsChart data={seller_registrations_chart} />
                </div>
            )}

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white shadow rounded-lg p-6 select-none">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-medium text-gray-900">
                            Produtos Pendentes Recentes
                        </h2>
                        <Link
                            href="/admin/products"
                            className="text-sm text-blue-600 hover:text-blue-500"
                        >
                            Ver todos
                        </Link>
                    </div>
                    {recent_products?.length > 0 ? (
                        <div className="space-y-3">
                            {recent_products.map((product) => (
                                <ProductQuickCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">Nenhum produto pendente</p>
                    )}
                </div>

                <div className="bg-white shadow rounded-lg p-6 select-none">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-medium text-gray-900">
                            Vendedores Pendentes Recentes
                        </h2>
                        <Link
                            href="/admin/sellers"
                            className="text-sm text-blue-600 hover:text-blue-500"
                        >
                            Ver todos
                        </Link>
                    </div>
                    {recent_sellers?.length > 0 ? (
                        <div className="space-y-3">
                            {recent_sellers.map((seller) => (
                                <SellerQuickCard key={seller.id} seller={seller} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">Nenhum vendedor pendente</p>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

function SellerQuickCard({ seller }) {
    const { post, processing } = useForm();

    const approve = () => {
        post(`/admin/sellers/${seller.id}/approve`);
    };

    const reject = () => {
        if (confirm('Tem certeza que deseja rejeitar esta solicitação?')) {
            post(`/admin/sellers/${seller.id}/reject`);
        }
    };

    return (
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex-1">
                <p className="font-medium text-gray-900">{seller.name}</p>
                <p className="text-sm text-gray-500">{seller.email}</p>
                <p className="text-xs text-gray-400 mt-1">
                    Cadastrado em: {new Date(seller.created_at).toLocaleDateString('pt-BR')}
                </p>
            </div>
            <div className="flex space-x-2 ml-4">
                <Button
                    onClick={approve}
                    disabled={processing}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Aprovar
                </Button>
                <Button
                    onClick={reject}
                    disabled={processing}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                >
                    <XCircle className="w-4 h-4 mr-1" />
                    Rejeitar
                </Button>
            </div>
        </div>
    );
}

function ProductQuickCard({ product }) {
    const { post, processing } = useForm();

    const approve = () => {
        post(`/admin/products/${product.id}/approve`);
    };

    const reject = () => {
        if (confirm('Tem certeza que deseja rejeitar este produto?')) {
            post(`/admin/products/${product.id}/reject`, {
                data: { reason: 'Rejeitado via dashboard' }
            });
        }
    };

    return (
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex-1">
                <p className="font-medium text-gray-900">{product.name}</p>
                <p className="text-sm text-gray-500">
                    Vendedor: {product.seller?.name || 'N/A'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                    Preço: R$ {parseFloat(product.base_price).toFixed(2)} | {product.gold_weight_grams}g
                </p>
            </div>
            <div className="flex space-x-2 ml-4">
                <Button
                    onClick={approve}
                    disabled={processing}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Aprovar
                </Button>
                <Button
                    onClick={reject}
                    disabled={processing}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                >
                    <XCircle className="w-4 h-4 mr-1" />
                    Rejeitar
                </Button>
            </div>
        </div>
    );
}
