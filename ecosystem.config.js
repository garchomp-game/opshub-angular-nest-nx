module.exports = {
    apps: [
        {
            name: 'opshub-api',
            script: 'dist/apps/api/main.js',
            interpreter: 'bun',
            instances: 'max',
            exec_mode: 'fork', // Bun doesn't support cluster mode; use fork
            autorestart: true,
            watch: false,
            max_memory_restart: '512M',
            env: {
                NODE_ENV: 'development',
                PORT: 3000,
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3000,
                CLUSTER_ENABLED: 'false', // PM2 handles process management
            },
        },
    ],
};
