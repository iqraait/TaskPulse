# TaskPulse Pro - One-Click AWS Deployment Script
# Target AWS IP: 13.233.155.48

$AWS_IP = "13.233.155.48"
$PEM_PATH = "C:\Users\IT\Desktop\My Projects\Taskpulse\taskPulse-django-server-key.pem"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "🚀 TaskPulse Pro Auto-Deploying to AWS ($AWS_IP)..." -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan

# Step 1: Push latest code to GitHub
Write-Host "`n1. Pushing latest code to GitHub repository..." -ForegroundColor Green
git add .
git commit -m "Auto-deploy update to AWS"
git push origin main

# Step 2: Build frontend bundle locally
Write-Host "`n2. Building frontend production bundle locally..." -ForegroundColor Green
Set-Location "$PSScriptRoot\frontend"
cmd /c "npm run build"
Set-Location "$PSScriptRoot"

# Step 3: Upload frontend dist folder to AWS
Write-Host "`n3. Uploading compiled frontend dist to AWS server..." -ForegroundColor Green
scp -i "$PEM_PATH" -o StrictHostKeyChecking=no -r "$PSScriptRoot\frontend\dist\*" "ubuntu@${AWS_IP}:/home/ubuntu/TaskPulse/frontend/dist/"

# Step 4: SSH into AWS EC2 server, pull backend code & restart backend
Write-Host "`n4. Updating backend code & restarting server on AWS..." -ForegroundColor Green

ssh -i "$PEM_PATH" -o ConnectTimeout=15 -o StrictHostKeyChecking=no "ubuntu@$AWS_IP" "bash -c '
  cd /home/ubuntu/TaskPulse || exit 1
  echo \"1. Pulling latest code...\"
  git pull origin main

  echo \"2. Restarting Django backend...\"
  cd /home/ubuntu/TaskPulse/backend
  source venv/bin/activate
  python manage.py migrate
  pkill -f \"manage.py runserver\" || true
  sleep 1
  nohup python manage.py runserver 0.0.0.0:8000 > /dev/null 2>&1 &

  echo \"3. Reloading Nginx...\"
  sudo systemctl reload nginx || sudo systemctl restart nginx || true
  echo \"✅ AWS Server Update Completed Successfully!\"
'"

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "🎉 AWS Server Deployed Successfully! Live at http://$AWS_IP:800" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
