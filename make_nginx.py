import os

nginx_conf = """server {
    listen 80;
    listen 800;
    server_name _;

    location ^~ /admin {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ^~ /static/admin {
        proxy_pass http://127.0.0.1:8000;
    }

    location ^~ /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ^~ /media {
        alias /home/ubuntu/TaskPulse/backend/media;
    }

    location / {
        root /home/ubuntu/TaskPulse/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
"""

with open("/tmp/taskpulse_site", "w") as f:
    f.write(nginx_conf)

os.system("sudo cp /tmp/taskpulse_site /etc/nginx/sites-available/taskpulse")
os.system("sudo cp /tmp/taskpulse_site /etc/nginx/sites-available/default")
os.system("sudo nginx -t && sudo systemctl reload nginx")
print("TASKPULSE_NGINX_FULLY_ACTIVATED_V5")
