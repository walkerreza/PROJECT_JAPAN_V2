import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { installInterfaceSoundEffects } from '@/Components/UI/SoundEffects';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        const isUser = props.initialPage?.props?.auth?.user?.role === 'user';
        const removeInterfaceSoundEffects = isUser
            ? installInterfaceSoundEffects(el)
            : () => {};

        root.render(<App {...props} />);

        if (import.meta.hot) {
            import.meta.hot.dispose(removeInterfaceSoundEffects);
        }
    },
    progress: {
        color: '#DC2626',
    },
});
