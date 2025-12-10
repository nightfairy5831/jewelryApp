export default function GoldPriceChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                Aguardando dados do gráfico...
            </div>
        );
    }

    // Chart dimensions
    const chartWidth = 700;
    const chartHeight = 250;
    const padding = { top: 20, right: 40, bottom: 50, left: 60 };
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    // Find min and max prices for scaling
    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Scale functions
    const scaleX = (index) => padding.left + (index / (data.length - 1 || 1)) * innerWidth;
    const scaleY = (price) => padding.top + innerHeight - ((price - minPrice) / priceRange) * innerHeight;

    return (
        <div className="overflow-x-auto">
            <svg width={chartWidth} height={chartHeight} className="mx-auto">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map((i) => {
                    const y = padding.top + (i * innerHeight / 4);
                    return (
                        <line
                            key={`grid-${i}`}
                            x1={padding.left}
                            y1={y}
                            x2={chartWidth - padding.right}
                            y2={y}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* Y-axis labels */}
                {[0, 1, 2, 3, 4].map((i) => {
                    const price = maxPrice - (i * priceRange / 4);
                    const y = padding.top + (i * innerHeight / 4);
                    return (
                        <text
                            key={`y-label-${i}`}
                            x={padding.left - 10}
                            y={y + 4}
                            textAnchor="end"
                            className="text-xs fill-gray-600"
                        >
                            R$ {price.toFixed(2)}
                        </text>
                    );
                })}

                {/* Line path */}
                <path
                    d={data.map((d, i) => {
                        const x = scaleX(i);
                        const y = scaleY(d.price);
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Area fill */}
                <path
                    d={[
                        ...data.map((d, i) => {
                            const x = scaleX(i);
                            const y = scaleY(d.price);
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }),
                        `L ${scaleX(data.length - 1)} ${padding.top + innerHeight}`,
                        `L ${padding.left} ${padding.top + innerHeight}`,
                        'Z'
                    ].join(' ')}
                    fill="#fef3c7"
                    opacity="0.3"
                />

                {/* Data points */}
                {data.map((d, i) => {
                    const x = scaleX(i);
                    const y = scaleY(d.price);
                    return (
                        <g key={d.id}>
                            <circle
                                cx={x}
                                cy={y}
                                r="5"
                                fill="#eab308"
                                stroke="white"
                                strokeWidth="2"
                            />
                            {/* X-axis labels */}
                            <text
                                x={x}
                                y={chartHeight - padding.bottom + 20}
                                textAnchor="middle"
                                className="text-xs fill-gray-600"
                            >
                                {d.time}
                            </text>
                        </g>
                    );
                })}

                {/* Axes */}
                <line
                    x1={padding.left}
                    y1={padding.top}
                    x2={padding.left}
                    y2={chartHeight - padding.bottom}
                    stroke="#374151"
                    strokeWidth="2"
                />
                <line
                    x1={padding.left}
                    y1={chartHeight - padding.bottom}
                    x2={chartWidth - padding.right}
                    y2={chartHeight - padding.bottom}
                    stroke="#374151"
                    strokeWidth="2"
                />
            </svg>
        </div>
    );
}
