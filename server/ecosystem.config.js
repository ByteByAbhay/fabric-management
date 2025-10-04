module.exports = {
  apps: [
    {
      name: 'fabric-server',
      script: 'index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 5002,
        MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fabric-management',
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z'
    }
  ]
};


