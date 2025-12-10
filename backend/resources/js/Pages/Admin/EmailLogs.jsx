import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2, XCircle, Clock, Search, Filter, RefreshCw } from 'lucide-react';

export default function EmailLogs({ logs, stats, templates, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [templateFilter, setTemplateFilter] = useState(filters.template || '');

    const handleFilter = () => {
        router.get('/admin/email-logs', {
            search: search || undefined,
            status: statusFilter || undefined,
            template: templateFilter || undefined,
        }, { preserveState: true });
    };

    const handleClearFilters = () => {
        setSearch('');
        setStatusFilter('');
        setTemplateFilter('');
        router.get('/admin/email-logs');
    };

    const handleRetry = (id) => {
        if (confirm('Deseja reenviar este email?')) {
            router.post(`/admin/email-logs/${id}/retry`, {}, {
                preserveScroll: true,
                onSuccess: () => {
                    alert('Email adicionado à fila para reenvio!');
                }
            });
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            sent: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Enviado' },
            failed: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Falhou' },
            pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendente' },
        };

        const badge = badges[status] || badges.pending;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                <Icon className="w-3 h-3" />
                {badge.label}
            </span>
        );
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('pt-BR');
    };

    return (
        <AdminLayout>
            <Head title="Logs de Email" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Logs de Email</h1>
                    <p className="mt-2 text-gray-600">
                        Visualize todos os emails enviados pelo sistema
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <Mail className="w-8 h-8 text-gray-400" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Enviados</p>
                                <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
                            </div>
                            <CheckCircle2 className="w-8 h-8 text-green-400" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Falhas</p>
                                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                            </div>
                            <XCircle className="w-8 h-8 text-red-400" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pendentes</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-400" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                                    placeholder="Buscar por email..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">Todos os status</option>
                            <option value="sent">Enviado</option>
                            <option value="failed">Falhou</option>
                            <option value="pending">Pendente</option>
                        </select>

                        <select
                            value={templateFilter}
                            onChange={(e) => setTemplateFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">Todos os templates</option>
                            {templates.map((template) => (
                                <option key={template} value={template}>{template}</option>
                            ))}
                        </select>

                        <Button onClick={handleFilter} className="bg-purple-600 hover:bg-purple-700">
                            <Filter className="w-4 h-4 mr-2" />
                            Filtrar
                        </Button>

                        {(search || statusFilter || templateFilter) && (
                            <Button onClick={handleClearFilters} variant="outline">
                                Limpar
                            </Button>
                        )}
                    </div>
                </div>

                {/* Logs Table */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Template
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Destinatário
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Assunto
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Data
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {logs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                            <Mail className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                            <p>Nenhum email encontrado</p>
                                        </td>
                                    </tr>
                                ) : (
                                    logs.data.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {log.template_key}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900">{log.recipient_email}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-900">{log.subject}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(log.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(log.sent_at || log.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {log.status === 'failed' && (
                                                    <button
                                                        onClick={() => handleRetry(log.id)}
                                                        className="text-purple-600 hover:text-purple-900 inline-flex items-center gap-1"
                                                    >
                                                        <RefreshCw className="w-4 h-4" />
                                                        Reenviar
                                                    </button>
                                                )}
                                                {log.error_message && (
                                                    <span className="ml-2 text-red-600" title={log.error_message}>
                                                        ⚠️
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {logs.last_page > 1 && (
                        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Mostrando <span className="font-medium">{logs.from}</span> até{' '}
                                    <span className="font-medium">{logs.to}</span> de{' '}
                                    <span className="font-medium">{logs.total}</span> resultados
                                </div>
                                <div className="flex gap-2">
                                    {logs.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`px-3 py-1 rounded ${
                                                link.active
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-white text-gray-700 hover:bg-gray-50 border'
                                            } ${!link.url && 'opacity-50 cursor-not-allowed'}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
