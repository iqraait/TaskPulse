import json
import urllib.request

url = "http://127.0.0.1/api/login/"
payload = json.dumps({"username": "Fareeda", "password": "fareeda123"}).encode("utf-8")
headers = {"Content-Type": "application/json"}

try:
    req = urllib.request.Request(url, data=payload, headers=headers)
    with urllib.request.urlopen(req) as response:
        print("STATUS:", response.status)
        print("RESPONSE:", response.read().decode("utf-8"))
except Exception as e:
    print("ERROR:", e)
