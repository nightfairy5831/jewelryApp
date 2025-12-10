import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { GoldPriceProvider } from '@/contexts/GoldPriceContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const appName = import.meta.env.VITE_APP_NAME || 'Fala';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        window.route = (name, params) => {
            const routes = props.initialPage.props.ziggy;
            if (!routes || !routes.routes[name]) {
                console.error(`Route "${name}" not found`);
                return name;
            }
            let url = routes.routes[name].uri;
            if (params) {
                Object.keys(params).forEach(key => {
                    url = url.replace(`{${key}}`, params[key]);
                });
            }
            return `/${url}`;
        };

        root.render(
            <GoldPriceProvider>
                <App {...props} />
                <ToastContainer position="top-right" autoClose={3000} />
            </GoldPriceProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
