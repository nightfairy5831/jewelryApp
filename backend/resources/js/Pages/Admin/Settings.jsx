import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Zap } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

export default function Settings() {
    const [goldLoading, setGoldLoading] = useState(false);
    const [goldResult, setGoldResult] = useState(null);
    const [conversionLoading, setConversionLoading] = useState(false);
    const [conversionResult, setConversionResult] = useState(null);

    const testGoldApi = async () => {
        setGoldLoading(true);
        setGoldResult(null);

        try {
            const response = await axios.post(route('admin.settings.test-gold-api'));
            setGoldResult(response.data);
        } catch (error) {
            setGoldResult({
                success: false,
                error: 'Request failed',
                message: error.response?.data?.message || error.message,
            });
        } finally {
            setGoldLoading(false);
        }
    };

    const testConversionApi = async () => {
        setConversionLoading(true);
        setConversionResult(null);

        try {
            const response = await axios.post(route('admin.settings.test-conversion-api'));
            setConversionResult(response.data);
        } catch (error) {
            setConversionResult({
                success: false,
                error: 'Request failed',
                message: error.response?.data?.message || error.message,
            });
        } finally {
            setConversionLoading(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="Configurações" />
            <div className="px-4 sm:px-0">
                <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Gerencie as configurações do sistema
                </p>
            </div>

            <div className="mt-8 space-y-6">
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <SettingsIcon className="h-5 w-5 text-gray-600" />
                            <h2 className="text-lg font-medium text-gray-900">
                                API do Ouro (GoldAPI.io)
                            </h2>
                        </div>
                    </div>
                    <div className="p-6">
                        <p className="text-sm text-gray-600 mb-4">
                            Teste a conexão com a API de preços do ouro em tempo real.
                        </p>
                        <Button
                            onClick={testGoldApi}
                            disabled={goldLoading}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Zap className="w-4 h-4 mr-2" />
                            {goldLoading ? 'Testando...' : 'Testar API'}
                        </Button>

                        {goldResult && (
                            <div className={`mt-6 p-4 rounded-lg border ${goldResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <h3 className={`font-semibold mb-3 ${goldResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                    {goldResult.success ? 'Sucesso!' : 'Erro'}
                                </h3>

                                {goldResult.success ? (
                                    <div className="space-y-2 text-sm">
                                        <div className="pb-3 border-b border-green-200">
                                            <span className="font-medium text-gray-700">Metal:</span>
                                            <span className="ml-2 text-gray-900">{goldResult.metal || 'N/A'}</span>
                                            <span className="ml-4 font-medium text-gray-700">Moeda:</span>
                                            <span className="ml-2 text-gray-900">{goldResult.currency || 'N/A'}</span>
                                            <span className="ml-4 font-medium text-gray-700">Data/Hora:</span>
                                            <span className="ml-2 text-gray-900">{goldResult.date || 'N/A'}</span>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                                            <div className="p-3 bg-green-50 rounded">
                                                <span className="text-xs text-gray-600">24k</span>
                                                <p className="text-lg font-bold text-green-700">${goldResult.price_gram_24k?.toFixed(2) || 'N/A'}</p>
                                            </div>
                                            <div className="p-3 bg-green-50 rounded">
                                                <span className="text-xs text-gray-600">22k</span>
                                                <p className="text-lg font-bold text-green-700">${goldResult.price_gram_22k?.toFixed(2) || 'N/A'}</p>
                                            </div>
                                            <div className="p-3 bg-green-50 rounded">
                                                <span className="text-xs text-gray-600">21k</span>
                                                <p className="text-lg font-bold text-green-700">${goldResult.price_gram_21k?.toFixed(2) || 'N/A'}</p>
                                            </div>
                                            <div className="p-3 bg-green-50 rounded">
                                                <span className="text-xs text-gray-600">20k</span>
                                                <p className="text-lg font-bold text-green-700">${goldResult.price_gram_20k?.toFixed(2) || 'N/A'}</p>
                                            </div>
                                            <div className="p-3 bg-green-50 rounded">
                                                <span className="text-xs text-gray-600">18k</span>
                                                <p className="text-lg font-bold text-green-700">${goldResult.price_gram_18k?.toFixed(2) || 'N/A'}</p>
                                            </div>
                                            <div className="p-3 bg-green-50 rounded">
                                                <span className="text-xs text-gray-600">16k</span>
                                                <p className="text-lg font-bold text-green-700">${goldResult.price_gram_16k?.toFixed(2) || 'N/A'}</p>
                                            </div>
                                            <div className="p-3 bg-green-50 rounded">
                                                <span className="text-xs text-gray-600">14k</span>
                                                <p className="text-lg font-bold text-green-700">${goldResult.price_gram_14k?.toFixed(2) || 'N/A'}</p>
                                            </div>
                                            <div className="p-3 bg-green-50 rounded">
                                                <span className="text-xs text-gray-600">10k</span>
                                                <p className="text-lg font-bold text-green-700">${goldResult.price_gram_10k?.toFixed(2) || 'N/A'}</p>
                                            </div>
                                        </div>

                                        {goldResult.raw_response && (
                                            <details className="mt-4">
                                                <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                                                    Resposta Completa da API
                                                </summary>
                                                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                                                    {JSON.stringify(goldResult.raw_response, null, 2)}
                                                </pre>
                                            </details>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2 text-sm text-red-800">
                                        <div>
                                            <span className="font-medium">Erro:</span>
                                            <span className="ml-2">{goldResult.error}</span>
                                        </div>
                                        {goldResult.message && (
                                            <div>
                                                <span className="font-medium">Mensagem:</span>
                                                <pre className="mt-2 p-3 bg-red-100 rounded text-xs overflow-x-auto">
                                                    {goldResult.message}
                                                </pre>
                                            </div>
                                        )}
                                        {goldResult.status_code && (
                                            <div>
                                                <span className="font-medium">Status Code:</span>
                                                <span className="ml-2">{goldResult.status_code}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <SettingsIcon className="h-5 w-5 text-gray-600" />
                            <h2 className="text-lg font-medium text-gray-900">
                                Taxa de Conversão (ExchangeRate.host)
                            </h2>
                        </div>
                    </div>
                    <div className="p-6">
                        <p className="text-sm text-gray-600 mb-4">
                            Teste a conversão de USD para BRL em tempo real.
                        </p>
                        <Button
                            onClick={testConversionApi}
                            disabled={conversionLoading}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            <Zap className="w-4 h-4 mr-2" />
                            {conversionLoading ? 'Testando...' : 'Testar Conversão'}
                        </Button>

                        {conversionResult && (
                            <div className={`mt-6 p-4 rounded-lg border ${conversionResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <h3 className={`font-semibold mb-3 ${conversionResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                    {conversionResult.success ? 'Sucesso!' : 'Erro'}
                                </h3>

                                {conversionResult.success ? (
                                    <div className="space-y-2 text-sm">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="font-medium text-gray-700">De:</span>
                                                <p className="text-lg font-bold text-green-700 mt-1">
                                                    {conversionResult.from || 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">Para:</span>
                                                <p className="text-lg font-bold text-green-700 mt-1">
                                                    {conversionResult.to || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="pt-3 border-t border-green-200">
                                            <span className="font-medium text-gray-700">Taxa de Conversão:</span>
                                            <p className="text-2xl font-bold text-green-700 mt-1">
                                                {conversionResult.rate ? `1 USD = ${conversionResult.rate.toFixed(4)} BRL` : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700">Data:</span>
                                            <span className="ml-2 text-gray-900">{conversionResult.date || 'N/A'}</span>
                                        </div>

                                        {conversionResult.raw_response && (
                                            <details className="mt-4">
                                                <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                                                    Resposta Completa da API
                                                </summary>
                                                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                                                    {JSON.stringify(conversionResult.raw_response, null, 2)}
                                                </pre>
                                            </details>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2 text-sm text-red-800">
                                        <div>
                                            <span className="font-medium">Erro:</span>
                                            <span className="ml-2">{conversionResult.error}</span>
                                        </div>
                                        {conversionResult.message && (
                                            <div>
                                                <span className="font-medium">Mensagem:</span>
                                                <pre className="mt-2 p-3 bg-red-100 rounded text-xs overflow-x-auto">
                                                    {conversionResult.message}
                                                </pre>
                                            </div>
                                        )}
                                        {conversionResult.status_code && (
                                            <div>
                                                <span className="font-medium">Status Code:</span>
                                                <span className="ml-2">{conversionResult.status_code}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
