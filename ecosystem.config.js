// PM2 Configuration for Production
module.exports = {
  apps: [
    {
      name: 'healthcare-app',
      script: './start-server.sh',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/app-error.log',
      out_file: './logs/app-out.log',
      log_file: './logs/app-combined.log',
      time: true,
    },
  ],
};