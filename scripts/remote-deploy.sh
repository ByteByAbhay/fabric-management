#!/usr/bin/env bash
set -euo pipefail

# Configuration
REPO_URL=${REPO_URL:-"${1:-}"}
REPO_SSH_URL=${REPO_SSH_URL:-""}
DEPLOY_KEY=${DEPLOY_KEY:-""}
DEPLOY_REF=${DEPLOY_REF:-""}
APP_DIR=${APP_DIR:-"/home/ec2-user/apps/fabric-management"}
NODE_VERSION=${NODE_VERSION:-"20"}
SERVER_PORT=${PORT:-"5002"}

if [[ -z "$REPO_URL" && -z "$REPO_SSH_URL" ]]; then
  echo "Provide REPO_URL (https) or REPO_SSH_URL (ssh) as env or first arg." >&2
  exit 1
fi

mkdir -p "$APP_DIR"

# Ensure git and openssh
if ! command -v git >/dev/null 2>&1; then
  sudo yum install -y git
fi
if ! command -v ssh >/dev/null 2>&1; then
  sudo yum install -y openssh-clients
fi

# Configure deploy key if provided
if [[ -n "$DEPLOY_KEY" ]]; then
  mkdir -p /home/ec2-user/.ssh
  DEPLOY_KEY_PATH="/home/ec2-user/.ssh/deploy_key"
  printf "%s\n" "$DEPLOY_KEY" > "$DEPLOY_KEY_PATH"
  chmod 600 "$DEPLOY_KEY_PATH"
  chown ec2-user:ec2-user "$DEPLOY_KEY_PATH"
  # add GitHub host key
  ssh-keyscan -t rsa,ecdsa,ed25519 github.com >> /home/ec2-user/.ssh/known_hosts 2>/dev/null || true
  export GIT_SSH_COMMAND="ssh -i $DEPLOY_KEY_PATH -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes"
fi

# Ensure Node.js
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
  sudo yum install -y nodejs
fi

# Ensure PM2
if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm i -g pm2@latest
fi

cd "$APP_DIR"

if [[ ! -d .git ]]; then
  if [[ -n "$REPO_SSH_URL" ]]; then
    git clone "$REPO_SSH_URL" .
  else
    git clone "$REPO_URL" .
  fi
else
  git fetch --all --prune
fi

git reset --hard origin/main

# Checkout desired ref if provided (branch, tag, or commit)
if [[ -n "$DEPLOY_REF" ]]; then
  git fetch --all --tags --prune
  if git rev-parse --verify --quiet "$DEPLOY_REF" >/dev/null; then
    git checkout -q "$DEPLOY_REF"
  elif git show-ref --verify --quiet "refs/remotes/origin/$DEPLOY_REF" >/dev/null; then
    git checkout -q -B "$DEPLOY_REF" "origin/$DEPLOY_REF"
  elif git ls-remote --exit-code --tags origin "$DEPLOY_REF" >/dev/null 2>&1; then
    git checkout -q "tags/$DEPLOY_REF"
  else
    echo "Warning: DEPLOY_REF '$DEPLOY_REF' not found. Staying on origin/main." >&2
    git checkout -q -B main origin/main
  fi
else
  git checkout -q -B main origin/main
fi

# Client build
cd client
npm ci
CI=false npm run build
cd ..

# Server install
cd server
npm ci --omit=dev

# Write env if not present (override via Secrets-based .env if desired)
if [[ ! -f .env ]]; then
  cat > .env <<EOF
NODE_ENV=production
PORT=${SERVER_PORT}
MONGO_URI=${MONGO_URI:-""}
ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-""}
EOF
fi

mkdir -p logs

# Start/Reload with PM2
pm2 startOrReload ecosystem.config.js --update-env || pm2 start ecosystem.config.js
pm2 save

# Nginx config
if ! command -v nginx >/dev/null 2>&1; then
  sudo amazon-linux-extras enable nginx1 || true
  sudo yum -y install nginx
  sudo systemctl enable nginx
fi

sudo bash -c 'cat > /etc/nginx/conf.d/fabric-management.conf <<"NGINX"\
server {
  listen 80;
  server_name _;
  root /home/ec2-user/apps/fabric-management/client/build;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }
  location /api/ {
    proxy_pass http://127.0.0.1:'"${SERVER_PORT}"';
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
NGINX'

sudo nginx -t
sudo systemctl restart nginx

echo "Deployment completed successfully."


