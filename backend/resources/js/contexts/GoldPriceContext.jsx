import { createContext, useContext, useState, useEffect } from 'react';

const GoldPriceContext = createContext(null);

const STORAGE_KEY = 'fala_gold_price';
const STORAGE_TIMESTAMP_KEY = 'fala_gold_price_timestamp';
const UPDATE_INTERVAL = 5 * 60 * 60 * 1000; // 5 hours

export function GoldPriceProvider({ children }) {
    const [goldPrice, setGoldPrice] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Failed to parse stored gold price:', e);
                return null;
            }
        }
        return null;
    });

    const [loading, setLoading] = useState(!goldPrice);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(() => {
        return localStorage.getItem(STORAGE_TIMESTAMP_KEY) || null;
    });

    const fetchGoldPrice = async () => {
        try {
            const timestamp = new Date().getTime();
            const response = await fetch(`/api/gold-price/current?t=${timestamp}`);
            const data = await response.json();

            if (data.success) {
                const priceData = data.data;
                const updateTime = new Date().toISOString();

                setGoldPrice(priceData);
                setError(null);
                setLastUpdate(updateTime);

                localStorage.setItem(STORAGE_KEY, JSON.stringify(priceData));
                localStorage.setItem(STORAGE_TIMESTAMP_KEY, updateTime);

                console.log('Gold price updated:', priceData.price_18k, 'at', updateTime);
            } else {
                setError(data.message || 'Failed to fetch gold price');
            }
        } catch (err) {
            console.error('Gold price fetch error:', err);
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGoldPrice();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchGoldPrice();
        }, UPDATE_INTERVAL);

        return () => clearInterval(interval);
    }, []);

    const getPriceByKarat = (karat) => {
        if (!goldPrice) return null;

        const karatMap = {
            '24k': goldPrice.price_24k,
            '22k': goldPrice.price_22k,
            '21k': goldPrice.price_21k,
            '20k': goldPrice.price_20k,
            '18k': goldPrice.price_18k,
            '16k': goldPrice.price_16k,
            '14k': goldPrice.price_14k,
            '10k': goldPrice.price_10k,
        };

        return karatMap[karat?.toLowerCase()] || goldPrice.price_18k;
    };

    const calculateProductPrice = (basePrice, goldWeightGrams, goldKarat = '18k') => {
        if (!goldPrice) return null;

        const pricePerGram = getPriceByKarat(goldKarat);
        if (!pricePerGram) return null;

        return parseFloat(basePrice) + (pricePerGram * goldWeightGrams);
    };

    const value = {
        goldPrice,
        loading,
        error,
        lastUpdate,
        getPriceByKarat,
        calculateProductPrice,
        refresh: fetchGoldPrice,
    };

    return (
        <GoldPriceContext.Provider value={value}>
            {children}
        </GoldPriceContext.Provider>
    );
}

export function useGoldPrice() {
    const context = useContext(GoldPriceContext);
    if (!context) {
        throw new Error('useGoldPrice must be used within GoldPriceProvider');
    }
    return context;
}
