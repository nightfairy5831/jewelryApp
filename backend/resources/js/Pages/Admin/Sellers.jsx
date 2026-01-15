import AdminLayout from '@/layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { CheckCircle, XCircle, UserX, UserCheck, MoreVertical, CreditCard } from 'lucide-react';
import { useState } from 'react';

const route = window.route;

export default function Sellers({ sellers, filters }) {
    const [nameSearch, setNameSearch] = useState(filters?.name || '');
    const [emailSearch, setEmailSearch] = useState(filters?.email || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
    const [selectedIds, setSelectedIds] = useState([]);
    const { post, processing } = useForm();

    const handleSearch = () => {
        router.get(route('admin.sellers.index'), {
            name: nameSearch || null,
            email: emailSearch || null,
            status: statusFilter !== 'all' ? statusFilter : null,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearSearch = () => {
        setNameSearch('');
        setEmailSearch('');
        setStatusFilter('all');
        router.get(route('admin.sellers.index'), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(sellers.map(s => s.id));
        } else {
            setSelectedIds([]);
        }
    };

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const getStatus = (seller) => {
        if (seller.seller_status) {
            switch (seller.seller_status) {
                case 'pending':
                    return { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' };
                case 'approved':
                    return { label: 'Aprovado', color: 'bg-green-100 text-green-800' };
                case 'rejected':
                    return { label: 'Rejeitado', color: 'bg-red-100 text-red-800' };
                case 'inactive':
                    return { label: 'Inativo', color: 'bg-gray-100 text-gray-800' };
                default:
                    return { label: 'Desconhecido', color: 'bg-gray-100 text-gray-600' };
            }
        }

        if (seller.role === 'seller') {
            return { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' };
        }

        return { label: 'Desconhecido', color: 'bg-gray-100 text-gray-600' };
    };

    return (
        <AdminLayout>
            <Head title="Vendedores" />

            <div className="px-4 sm:px-0 select-none">
                <h1 className="text-3xl font-bold text-gray-900">Vendedores</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Gerenciar vendedores e solicitações
                </p>
            </div>

            <div className="mt-8 bg-white shadow rounded-lg p-6 select-none">
                <div className="flex gap-3">
                    <Input
                        type="text"
                        placeholder="Nome"
                        value={nameSearch}
                        onChange={(e) => {
                            setNameSearch(e.target.value);
                            if (e.target.value === '' && emailSearch === '') {
                                handleSearch();
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSearch();
                            }
                        }}
                        className="w-64"
                    />
                    <Input
                        type="text"
                        placeholder="Email"
                        value={emailSearch}
                        onChange={(e) => {
                            setEmailSearch(e.target.value);
                            if (e.target.value === '' && nameSearch === '') {
                                handleSearch();
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSearch();
                            }
                        }}
                        className="w-64"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            const newStatus = e.target.value;
                            setStatusFilter(newStatus);
                            router.get(route('admin.sellers.index'), {
                                name: nameSearch || null,
                                email: emailSearch || null,
                                status: newStatus !== 'all' ? newStatus : null,
                            }, {
                                preserveState: true,
                                preserveScroll: true,
                            });
                        }}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="pending">Pendente</option>
                        <option value="approved">Aprovado</option>
                        <option value="rejected">Rejeitado</option>
                        <option value="inactive">Inativo</option>
                    </select>
                    {(nameSearch || emailSearch || statusFilter !== 'all') && (
                        <button
                            onClick={handleClearSearch}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
                        >
                            Limpar
                        </button>
                    )}
                </div>
            </div>

            {selectedIds.length > 0 && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 select-none">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">
                            {selectedIds.length} vendedor(es) selecionado(s)
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={processing}
                                onClick={() => {
                                    if (confirm(`Aprovar ${selectedIds.length} vendedor(es)?`)) {
                                        selectedIds.forEach(id => {
                                            post(route('admin.sellers.approve', { seller: id }), {
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    setSelectedIds([]);
                                                }
                                            });
                                        });
                                    }
                                }}
                                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Aprovar
                            </button>
                            <button
                                disabled={processing}
                                onClick={() => {
                                    if (confirm(`Cancelar ${selectedIds.length} vendedor(es)?`)) {
                                        selectedIds.forEach(id => {
                                            post(route('admin.sellers.reject', { seller: id }), {
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    setSelectedIds([]);
                                                }
                                            });
                                        });
                                    }
                                }}
                                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancelar
                            </button>
                            <button
                                disabled={processing}
                                onClick={() => {
                                    if (confirm(`Desativar ${selectedIds.length} vendedor(es)?`)) {
                                        selectedIds.forEach(id => {
                                            post(route('admin.sellers.deactivate', { seller: id }), {
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    setSelectedIds([]);
                                                }
                                            });
                                        });
                                    }
                                }}
                                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                            >
                                <UserX className="w-4 h-4 mr-2" />
                                Desativar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-6">
                <div className="bg-white shadow rounded-lg border border-gray-200 select-none">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={selectedIds.length === sellers.length && sellers.length > 0}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        Nome
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        Email
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        Telefone
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        Mercado Pago
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        Data de Cadastro
                                    </th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sellers.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                            Nenhum vendedor encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    sellers.map((seller) => (
                                        <SellerRow
                                            key={seller.id}
                                            seller={seller}
                                            getStatus={getStatus}
                                            isSelected={selectedIds.includes(seller.id)}
                                            onToggleSelect={() => toggleSelect(seller.id)}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function SellerRow({ seller, getStatus, isSelected, onToggleSelect }) {
    const { post, processing } = useForm();
    const status = getStatus(seller);
    const isPending = seller.role === 'buyer' && seller.seller_requested_at;
    const hasMpConnected = seller.mercadopago_connected && seller.mercadopago_user_id;

    const handleApprove = () => {
        if (!hasMpConnected) {
            alert('O vendedor precisa conectar sua conta do Mercado Pago antes de ser aprovado.');
            return;
        }
        post(route('admin.sellers.approve', { seller: seller.id }), {
            preserveScroll: true,
        });
    };

    const handleReject = () => {
        if (confirm('Tem certeza que deseja rejeitar esta solicitação?')) {
            post(route('admin.sellers.reject', { seller: seller.id }), {
                preserveScroll: true,
            });
        }
    };

    const handleDeactivate = () => {
        if (confirm('Tem certeza que deseja desativar este vendedor?')) {
            post(route('admin.sellers.deactivate', { seller: seller.id }), {
                preserveScroll: true,
            });
        }
    };

    const handleActivate = () => {
        post(route('admin.sellers.activate', { seller: seller.id }), {
            preserveScroll: true,
        });
    };

    return (
        <tr className="hover:bg-gray-50 border-b border-gray-100">
            <td className="px-6 py-4">
                <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={isSelected}
                    onChange={onToggleSelect}
                />
            </td>
            <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900">{seller.name}</div>
            </td>
            <td className="px-6 py-4">
                <div className="text-sm text-gray-600">{seller.email}</div>
            </td>
            <td className="px-6 py-4">
                <div className="text-sm text-gray-600">{seller.phone || '-'}</div>
            </td>
            <td className="px-6 py-4">
                <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-full ${status.color}`}>
                    {status.label}
                </span>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <CreditCard className={`w-4 h-4 ${hasMpConnected ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={`text-xs font-medium ${hasMpConnected ? 'text-green-600' : 'text-gray-500'}`}>
                        {hasMpConnected ? 'Conectado' : 'Não conectado'}
                    </span>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="text-sm text-gray-600">
                    {new Date(seller.created_at).toLocaleDateString('pt-BR')}
                </div>
            </td>
            <td className="px-6 py-4 text-right">
                <Dropdown
                    trigger={
                        <button
                            disabled={processing}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    }
                >
                    <DropdownItem
                        onClick={handleApprove}
                        variant={hasMpConnected ? "success" : "disabled"}
                        icon={CheckCircle}
                        disabled={!hasMpConnected}
                        title={!hasMpConnected ? "Vendedor precisa conectar Mercado Pago" : ""}
                    >
                        {hasMpConnected ? 'Aprovar' : 'Aprovar (MP não conectado)'}
                    </DropdownItem>
                    <DropdownItem
                        onClick={handleReject}
                        variant="danger"
                        icon={XCircle}
                    >
                        {isPending ? 'Rejeitar' : 'Cancelar'}
                    </DropdownItem>
                    <DropdownItem
                        onClick={seller.is_active ? handleDeactivate : handleActivate}
                        variant={seller.is_active ? "warning" : "success"}
                        icon={seller.is_active ? UserX : UserCheck}
                    >
                        {seller.is_active ? 'Desativar' : 'Ativar'}
                    </DropdownItem>
                </Dropdown>
            </td>
        </tr>
    );
}
