import BuyerLayout from '@/layouts/BuyerLayout';
import { Head, router } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Package, Heart, Eye, ShoppingCart, FileText, X } from 'lucide-react';
import { useState } from 'react';
import { useGoldPrice } from '@/contexts/GoldPriceContext';

export default function Dashboard({ products, filters }) {
    const { goldPrice, getPriceByKarat } = useGoldPrice();
    const [search, setSearch] = useState(filters?.search || '');
    const [category, setCategory] = useState(filters?.category || 'all');
    const [subcategory, setSubcategory] = useState(filters?.subcategory || 'all');
    const [minPrice, setMinPrice] = useState(filters?.min_price || '');
    const [maxPrice, setMaxPrice] = useState(filters?.max_price || '');
    const [detailProduct, setDetailProduct] = useState(null);

    const applyFilters = () => {
        router.get('/buyer/dashboard', {
            search: search || null,
            category: category !== 'all' ? category : null,
            subcategory: subcategory !== 'all' ? subcategory : null,
            min_price: minPrice || null,
            max_price: maxPrice || null,
        });
    };

    const subcategories = {
        'Masculino': ['Anéis', 'Colares', 'Pulseiras'],
        'Feminino': ['Anéis', 'Colares', 'Pulseiras'],
        'Formatura': ['Anéis', 'Medalhas', 'Broches'],
        'Casamento': ['Alianças', 'Conjuntos', 'Tiaras'],
    };

    return (
        <BuyerLayout>
            <Head title="Produtos" />

            <div className="flex flex-col lg:flex-row gap-6">
                <aside className="w-full lg:w-64 flex-shrink-0">
                    <div className="bg-white rounded-lg shadow p-4 lg:sticky lg:top-4 select-none">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                                <Input
                                    type="text"
                                    placeholder="Nome do produto..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                                <select
                                    className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={category}
                                    onChange={(e) => {
                                        setCategory(e.target.value);
                                        setSubcategory('all');
                                    }}
                                >
                                    <option value="all">Todas</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Feminino">Feminino</option>
                                    <option value="Formatura">Formatura</option>
                                    <option value="Casamento">Casamento</option>
                                </select>
                            </div>

                            {category !== 'all' && subcategories[category] && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Subcategoria</label>
                                    <select
                                        className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={subcategory}
                                        onChange={(e) => setSubcategory(e.target.value)}
                                    >
                                        <option value="all">Todas</option>
                                        {subcategories[category].map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

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

                            <button
                                onClick={applyFilters}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Aplicar Filtros
                            </button>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 w-full">
                    <div className="mb-6 select-none">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Produtos</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            {products.total} produto(s) encontrado(s)
                        </p>
                    </div>

                    {products.data.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center select-none">
                            <Package className="mx-auto h-12 sm:h-16 w-12 sm:w-16 text-gray-400 mb-4" />
                            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
                            <p className="text-sm text-gray-500">Tente ajustar os filtros para ver mais resultados</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                            {products.data.map((product) => (
                                <ProductCard key={product.id} product={product} onDetailClick={setDetailProduct} />
                            ))}
                        </div>
                    )}

                    {products.last_page > 1 && (
                        <div className="mt-6 flex flex-wrap justify-center gap-2">
                            {Array.from({ length: products.last_page }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => router.get(`/buyer/dashboard?page=${page}`)}
                                    className={`px-3 sm:px-4 py-2 rounded text-sm ${
                                        page === products.current_page
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Product Detail Modal */}
            {detailProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">Detalhes do Produto</h3>
                            <button
                                onClick={() => setDetailProduct(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
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
                                                    <label className="text-sm font-semibold text-blue-700">Preço Total Atual</label>
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
                                <button
                                    className="flex items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    Comprar
                                </button>
                                <button
                                    className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <FileText className="w-4 h-4" />
                                    Pedir
                                </button>
                                <button
                                    onClick={() => setDetailProduct(null)}
                                    className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </BuyerLayout>
    );
}

function ProductCard({ product, onDetailClick }) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    const hasValidImage = product.images && Array.isArray(product.images) && product.images.length > 0 && !imageError;

    return (
        <div className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 overflow-hidden select-none group">
            <div className="relative">
                {hasValidImage ? (
                    <>
                        {imageLoading && (
                            <div className="w-full h-48 bg-gray-200 animate-pulse flex items-center justify-center">
                                <Package className="h-12 w-12 text-gray-300" />
                            </div>
                        )}
                        <img
                            src={product.images[0]}
                            alt={product.name}
                            className={`w-full h-48 object-cover transition-opacity duration-300 ${
                                imageLoading ? 'opacity-0 absolute' : 'opacity-100'
                            }`}
                            onLoad={() => setImageLoading(false)}
                            onError={() => {
                                setImageError(true);
                                setImageLoading(false);
                            }}
                        />
                    </>
                ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <div className="text-center">
                            <Package className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">Sem imagem</p>
                        </div>
                    </div>
                )}
                <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white hover:scale-110 transition-all duration-200"
                >
                    <Heart className={`h-5 w-5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                </button>
                {product.images && product.images.length > 1 && (
                    <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs rounded-full">
                        +{product.images.length - 1} fotos
                    </div>
                )}
            </div>
            <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {product.name}
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                    {product.category} • {product.subcategory}
                </p>
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">{product.gold_weight_grams}g</span>
                    <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full font-medium">{product.gold_karat || '18k'}</span>
                </div>
                <div className="mb-3 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Preço base</p>
                        <span className="text-2xl font-bold text-blue-600">
                            R$ {parseFloat(product.base_price).toFixed(2)}
                        </span>
                    </div>
                    <button
                        onClick={() => onDetailClick(product)}
                        className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:scale-95 transition-all duration-200"
                        title="Ver detalhes"
                    >
                        <Eye className="h-5 w-5" />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="flex-1 bg-green-600 text-white py-2 px-2 rounded-lg text-sm font-medium hover:bg-green-700 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
                        title="Compra direta"
                    >
                        <ShoppingCart className="h-4 w-4" />
                        <span>Comprar</span>
                    </button>
                    <button
                        className="flex-1 bg-blue-600 text-white py-2 px-2 rounded-lg text-sm font-medium hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
                        title="Fazer pedido"
                    >
                        <FileText className="h-4 w-4" />
                        <span>Pedir</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
