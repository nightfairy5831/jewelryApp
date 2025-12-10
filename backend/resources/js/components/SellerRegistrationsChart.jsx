import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SellerRegistrationsChart({ data }) {
    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    // Custom tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const date = new Date(payload[0].payload.date);
            const formattedDate = date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });

            return (
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                    <p className="text-sm text-gray-600 mb-1">{formattedDate}</p>
                    <p className="text-lg font-semibold text-blue-600">
                        {payload[0].value} {payload[0].value === 1 ? 'vendedor' : 'vendedores'}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white shadow rounded-lg p-6 select-none">
            <div className="mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                    Vendedores Registrados (Últimos 7 Dias)
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    Acompanhe o crescimento de vendedores na plataforma
                </p>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart
                    data={data}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                        interval="preserveStartEnd"
                        tickCount={8}
                    />
                    <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                        allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ fill: '#2563eb', r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>

            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span>Novos vendedores</span>
                </div>
                <div>
                    Total: <span className="font-semibold text-gray-900">
                        {data.reduce((sum, item) => sum + item.count, 0)}
                    </span>
                </div>
            </div>
        </div>
    );
}
