import AdminLayout from '@/layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Package, Eye } from 'lucide-react';
import { useState } from 'react';
import { useGoldPrice } from '@/contexts/GoldPriceContext';

const route = (name, params = {}) => {
    const routes = {
        'admin.products.index': '/admin/products',
        'admin.products.approve': (id) => `/admin/products/${id}/approve`,
        'admin.products.reject': (id) => `/admin/products/${id}/reject`,
        'admin.products.recover': (id) => `/admin/products/${id}/recover`,
    };
    return typeof routes[name] === 'function' ? routes[name](params) : routes[name];
};

export default function Products({ products, filters }) {
    const { goldPrice, getPriceByKarat } = useGoldPrice();
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [detailProduct, setDetailProduct] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [search, setSearch] = useState(filters?.search || '');
    const [ownerName, setOwnerName] = useState(filters?.owner_name || '');
    const [category, setCategory] = useState(filters?.category || 'all');
    const [selectedIds, setSelectedIds] = useState([]);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(products.data.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(pid => pid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkApprove = () => {
        if (selectedIds.length === 0) return;
        if (confirm(`Aprovar ${selectedIds.length} produto(s)?`)) {
            selectedIds.forEach(id => {
                router.post(route('admin.products.approve', id), {}, {
                    preserveState: true,
                    preserveScroll: true,
                });
            });
            setSelectedIds([]);
        }
    };

    const handleApprove = (productId) => {
        if (confirm('Aprovar este produto?')) {
            router.post(route('admin.products.approve', productId));
        }
    };

    const handleReject = (productId) => {
        if (!rejectionReason.trim()) {
            alert('Por favor, informe o motivo da rejeição');
            return;
        }

        router.post(route('admin.products.reject', productId), {
            reason: rejectionReason,
        });

        setSelectedProduct(null);
        setRejectionReason('');
    };

    const handleRecover = (productId) => {
        if (confirm('Recuperar este produto para revisão?')) {
            router.post(route('admin.products.recover', productId));
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
        };
        const labels = {
            pending: 'Pendente',
            approved: 'Aprovado',
            rejected: 'Rejeitado',
        };

        return (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badges[status]}`}>
                {labels[status]}
            </span>
        );
    };

    return (
        <AdminLayout>
            <Head title="Produtos" />

            <div className="mb-6 select-none">
                <h1 className="text-3xl font-bold text-gray-900">Gerenciar Produtos</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Aprovar ou rejeitar produtos enviados pelos vendedores
                </p>
            </div>

            <div className="mb-6 bg-white p-4 rounded-lg shadow select-none">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Produto</label>
                        <Input
                            type="text"
                            placeholder="Buscar por nome..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    router.get(route('admin.products.index'), {
                                        status: filters?.status || 'all',
                                        search: search,
                                        owner_name: ownerName,
                                        category: category
                                    });
                                }
                            }}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Owner</label>
                        <Input
                            type="text"
                            placeholder="Buscar por owner..."
                            value={ownerName}
                            onChange={(e) => setOwnerName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    router.get(route('admin.products.index'), {
                                        status: filters?.status || 'all',
                                        search: search,
                                        owner_name: ownerName,
                                        category: category
                                    });
                                }
                            }}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                        <select
                            className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={category}
                            onChange={(e) => {
                                setCategory(e.target.value);
                                router.get(route('admin.products.index'), {
                                    status: filters?.status || 'all',
                                    search: search,
                                    owner_name: ownerName,
                                    category: e.target.value
                                });
                            }}
                        >
                            <option value="all">Todas</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Feminino">Feminino</option>
                            <option value="Formatura">Formatura</option>
                            <option value="Casamento">Casamento</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Preço Mínimo</label>
                        <Input
                            type="number"
                            placeholder="R$ 0"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Preço Máximo</label>
                        <Input
                            type="number"
                            placeholder="R$ 10000"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                        />
                    </div>
                </div>

                {selectedIds.length > 0 && (
                    <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <span className="text-sm text-blue-700 font-medium">
                            {selectedIds.length} produto(s) selecionado(s)
                        </span>
                        <Button
                            size="sm"
                            onClick={handleBulkApprove}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprovar Selecionados
                        </Button>
                    </div>
                )}

                <div className="flex space-x-2">
                    <Button
                        className={filters?.status === 'all'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200'
                        }
                        onClick={() => router.get(route('admin.products.index'), { status: 'all', search, owner_name: ownerName, category })}
                    >
                        Todos
                    </Button>
                    <Button
                        className={filters?.status === 'pending'
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200'
                        }
                        onClick={() => router.get(route('admin.products.index'), { status: 'pending', search, owner_name: ownerName, category })}
                    >
                        Pendentes
                    </Button>
                    <Button
                        className={filters?.status === 'approved'
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200'
                        }
                        onClick={() => router.get(route('admin.products.index'), { status: 'approved', search, owner_name: ownerName, category })}
                    >
                        Aprovados
                    </Button>
                    <Button
                        className={filters?.status === 'rejected'
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
                        }
                        onClick={() => router.get(route('admin.products.index'), { status: 'rejected', search, owner_name: ownerName, category })}
                    >
                        Rejeitados
                    </Button>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg select-none">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={selectedIds.length === products.data.length && products.data.length > 0}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Produto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Owner
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Categoria
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Peso Ouro
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Preço Base
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Detalhes
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.data.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                    Nenhum produto encontrado
                                </td>
                            </tr>
                        ) : (
                            products.data.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={selectedIds.includes(product.id)}
                                            onChange={() => toggleSelect(product.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0">
                                                {product.images && product.images.length > 0 ? (
                                                    <img
                                                        className="h-10 w-10 rounded-md object-cover"
                                                        src={product.images[0]}
                                                        alt={product.name}
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                                                        <Package className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {product.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {product.subcategory}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {product.seller?.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {product.category}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{product.gold_weight_grams}g</div>
                                        <div className="text-sm text-gray-500">{product.gold_karat || '18k'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        R$ {parseFloat(product.base_price).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(product.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <button
                                            onClick={() => setDetailProduct(product)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex"
                                            title="Ver detalhes"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-2">
                                            {product.status === 'pending' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleApprove(product.id)}
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        Aprovar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => setSelectedProduct(product)}
                                                        className="bg-red-600 hover:bg-red-700 text-white"
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                        Rejeitar
                                                    </Button>
                                                </>
                                            )}
                                            {product.status === 'rejected' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleRecover(product.id)}
                                                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                                >
                                                    Recuperar
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {products.links && products.links.length > 3 && (
                <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-700">
                            Mostrando <span className="font-medium">{products.from || 0}</span> a <span className="font-medium">{products.to || 0}</span> de{' '}
                            <span className="font-medium">{products.total || 0}</span> produtos
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-700">Mostrar:</label>
                            <select
                                value={filters.per_page || 14}
                                onChange={(e) => router.get(route('admin.products.index'), { ...filters, per_page: e.target.value })}
                                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                            >
                                <option value="10">10</option>
                                <option value="14">14</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {products.links.map((link, index) => (
                            <button
                                key={index}
                                onClick={() => link.url && router.visit(link.url)}
                                disabled={!link.url}
                                className={`px-3 py-2 text-sm rounded ${
                                    link.active
                                        ? 'bg-blue-600 text-white'
                                        : link.url
                                        ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {selectedProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Rejeitar Produto
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Produto: <strong>{selectedProduct.name}</strong>
                        </p>
                        <textarea
                            className="w-full border border-gray-300 rounded-md p-2 mb-4"
                            rows="4"
                            placeholder="Motivo da rejeição..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedProduct(null);
                                    setRejectionReason('');
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={() => handleReject(selectedProduct.id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                Confirmar Rejeição
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {detailProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">Detalhes do Produto</h3>
                            <button
                                onClick={() => setDetailProduct(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Product Images */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Imagens</h4>
                                    {detailProduct.images && detailProduct.images.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            {detailProduct.images.map((image, index) => (
                                                <img
                                                    key={index}
                                                    src={image}
                                                    alt={`${detailProduct.name} - ${index + 1}`}
                                                    className="w-full h-48 object-cover rounded-lg border"
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                                            <Package className="w-12 h-12 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Product Details */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700">Nome</label>
                                        <p className="text-gray-900">{detailProduct.name}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700">Categoria</label>
                                            <p className="text-gray-900">{detailProduct.category}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700">Subcategoria</label>
                                            <p className="text-gray-900">{detailProduct.subcategory || '-'}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-gray-700">Descrição</label>
                                        <p className="text-gray-900">{detailProduct.description || '-'}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700">Peso do Ouro</label>
                                            <p className="text-gray-900">{detailProduct.gold_weight_grams}g ({detailProduct.gold_karat || '18k'})</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700">Preço Base</label>
                                            <p className="text-gray-900">R$ {parseFloat(detailProduct.base_price).toFixed(2)}</p>
                                        </div>
                                    </div>

                                    {goldPrice && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-semibold text-blue-700">Custo do Ouro Atual</label>
                                                    <p className="text-blue-900 font-medium">
                                                        R$ {(getPriceByKarat(detailProduct.gold_karat) * detailProduct.gold_weight_grams).toFixed(2)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-semibold text-blue-700">Preço Atual Total</label>
                                                    <p className="text-blue-900 font-semibold text-lg">
                                                        R$ {(parseFloat(detailProduct.base_price) + (getPriceByKarat(detailProduct.gold_karat) * detailProduct.gold_weight_grams)).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-blue-600 mt-2">
                                                Preço do ouro ({detailProduct.gold_karat || '18k'}): R$ {getPriceByKarat(detailProduct.gold_karat).toFixed(2)}/g
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-sm font-semibold text-gray-700">Status</label>
                                        <div className="mt-1">
                                            {getStatusBadge(detailProduct.status)}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                        <label className="text-sm font-semibold text-gray-700 block mb-2">Informações do Vendedor</label>
                                        <div className="space-y-1">
                                            <div>
                                                <span className="text-xs text-gray-600">Nome: </span>
                                                <span className="text-sm text-gray-900 font-medium">{detailProduct.seller?.name || '-'}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-600">Email: </span>
                                                <span className="text-sm text-gray-900">{detailProduct.seller?.email || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {detailProduct.rejection_reason && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                            <label className="text-sm font-semibold text-red-700">Motivo da Rejeição</label>
                                            <p className="text-red-900 text-sm mt-1">{detailProduct.rejection_reason}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700">Criado em</label>
                                            <p className="text-gray-600">{new Date(detailProduct.created_at).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700">Atualizado em</label>
                                            <p className="text-gray-600">{new Date(detailProduct.updated_at).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 flex justify-end space-x-2 border-t pt-4">
                                {detailProduct.status === 'pending' && (
                                    <>
                                        <Button
                                            onClick={() => {
                                                handleApprove(detailProduct.id);
                                                setDetailProduct(null);
                                            }}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Aprovar
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setDetailProduct(null);
                                                setSelectedProduct(detailProduct);
                                            }}
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Rejeitar
                                        </Button>
                                    </>
                                )}
                                {detailProduct.status === 'rejected' && (
                                    <Button
                                        onClick={() => {
                                            handleRecover(detailProduct.id);
                                            setDetailProduct(null);
                                        }}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                    >
                                        Recuperar
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={() => setDetailProduct(null)}
                                >
                                    Fechar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
