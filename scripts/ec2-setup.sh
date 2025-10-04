#!/usr/bin/env bash
set -euo pipefail

# Basic system prep on Amazon Linux 2023/2

sudo yum update -y

# Install Node.js 20
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo -E bash -
  sudo yum install -y nodejs
fi

# Install PM2 globally
if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm i -g pm2@latest
  sudo env PATH=$PATH:/usr/local/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user || true
fi

# Install/enable nginx
if ! command -v nginx >/dev/null 2>&1; then
  sudo amazon-linux-extras enable nginx1 || true
  sudo yum install -y nginx
  sudo systemctl enable nginx
fi

echo "EC2 base setup complete. Create GitHub Secrets and run the workflow to deploy."


