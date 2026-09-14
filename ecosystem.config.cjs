/** PM2 process file for production on VPS. See DEPLOY_VPS_PM2.md */
module.exports = {
  apps: [
    {
      name: "rythm-group",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
}
