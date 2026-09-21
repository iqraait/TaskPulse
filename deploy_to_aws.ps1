# TaskPulse Pro - One-Click AWS Deployment Script
# Target AWS IP: 13.233.155.48

$AWS_IP = "13.233.155.48"
$PEM_PATH = "C:\Users\IT\Downloads\jdt-key.pem" # Update if using a different .pem file name in C:\Users\IT\Desktop\My Projects

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "🚀 TaskPulse Pro Auto-Deploying to AWS ($AWS_IP)..." -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan

# Step 1: Push latest code to GitHub
Write-Host "`n1. Pushing latest code to GitHub repository..." -ForegroundColor Green
git add .
git commit -m "Auto-deploy update to AWS"
git push origin main

# Step 2: SSH into AWS EC2 server and pull/restart
Write-Host "`n2. SSH connecting to AWS Server ($AWS_IP) to pull & deploy..." -ForegroundColor Green

ssh -i "$PEM_PATH" -o StrictHostKeyChecking=no "ubuntu@$AWS_IP" @"
  echo 'Connected to AWS Server...'
  cd /var/www/TaskPulse || cd ~/TaskPulse || cd ~/todo-team-app || exit
  
  echo '1. Pulling latest git code...'
  git pull origin main
  
  echo '2. Applying Django backend migrations...'
  if [ -d "backend" ]; then
    cd backend
    source venv/bin/activate || true
    python manage.py migrate
    cd ..
  fi

  echo '3. Building Vite frontend...'
  if [ -d "frontend" ]; then
    cd frontend
    npm install
    npm run build
    cd ..
  fi

  echo '4. Restarting backend services & Nginx...'
  sudo systemctl restart gunicorn || sudo systemctl restart taskpulse || pm2 restart all || true
  sudo systemctl restart nginx || true
  
  echo '✅ AWS Deployment Completed Successfully!'
"@

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "🎉 AWS Server Deployed Successfully! Live at http://$AWS_IP:800" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
