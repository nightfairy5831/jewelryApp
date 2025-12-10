import SellerLayout from '@/layouts/SellerLayout';
import { Head } from '@inertiajs/react';
import { Package, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';

export default function Dashboard() {
    return (
        <SellerLayout>
            <Head title="Painel do Vendedor" />
            <div className="px-4 sm:px-0">
                <h1 className="text-3xl font-bold text-gray-900">Painel do Vendedor</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Bem-vindo ao seu painel de vendas
                </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    name="Meus Produtos"
                    value="0"
                    icon={Package}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <StatCard
                    name="Vendas Totais"
                    value="0"
                    icon={ShoppingCart}
                    color="text-green-600"
                    bg="bg-green-50"
                />
                <StatCard
                    name="Receita"
                    value="R$ 0,00"
                    icon={DollarSign}
                    color="text-yellow-600"
                    bg="bg-yellow-50"
                />
                <StatCard
                    name="Taxa de Conversão"
                    value="0%"
                    icon={TrendingUp}
                    color="text-purple-600"
                    bg="bg-purple-50"
                />
            </div>

            <div className="mt-8">
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                        Começar
                    </h2>
                    <p className="text-gray-600">
                        Você está autenticado como vendedor aprovado. Em breve você poderá adicionar produtos e gerenciar suas vendas aqui.
                    </p>
                </div>
            </div>
        </SellerLayout>
    );
}

function StatCard({ name, value, icon: Icon, color, bg }) {
    return (
        <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
                <div className="flex items-center">
                    <div className={`flex-shrink-0 p-3 rounded-lg ${bg}`}>
                        <Icon className={`h-6 w-6 ${color}`} aria-hidden="true" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                                {name}
                            </dt>
                            <dd className="flex items-baseline">
                                <div className="text-2xl font-semibold text-gray-900">
                                    {value}
                                </div>
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}
