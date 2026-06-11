import os
import requests
from dotenv import load_dotenv

load_dotenv()

client_id = os.getenv("GOOGLE_CLIENT_ID")
client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
refresh_token = os.getenv("GOOGLE_REFRESH_TOKEN")

print("Client ID:", client_id)
print("Client Secret:", client_secret)
print("Refresh Token:", refresh_token)

url = "https://oauth2.googleapis.com/token"
payload = {
    "client_id": client_id,
    "client_secret": client_secret,
    "refresh_token": refresh_token,
    "grant_type": "refresh_token"
}

r = requests.post(url, data=payload)
print("Response:", r.status_code)
print("Body:", r.text)
