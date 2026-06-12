import os
import sys
from urllib.parse import urlparse, parse_qs

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Allow HTTP redirect URIs for local OAuth exchange
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

from google_auth_oauthlib.flow import Flow
from dotenv import load_dotenv

def main():
    load_dotenv()
    client_id = os.getenv("GOOGLE_CLIENT_ID", "").strip()
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
    
    if not client_id or not client_secret:
        print("[ERROR] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing from backend/.env.")
        client_id = input("Enter GOOGLE_CLIENT_ID: ").strip()
        client_secret = input("Enter GOOGLE_CLIENT_SECRET: ").strip()
        if not client_id or not client_secret:
            print("Client ID and Client Secret are required.")
            return

    # Scopes required
    scopes = [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.readonly"
    ]
    
    client_config = {
        "installed": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }
    
    # We use http://localhost:8080/ as a redirect URI. 
    # Make sure this redirect URI is added to your OAuth client credentials configuration in the Google Cloud Console.
    redirect_uri = "http://localhost:8080/"
    
    print("\n* Initializing OAuth flow...")
    try:
        flow = Flow.from_client_config(
            client_config, 
            scopes=scopes,
            redirect_uri=redirect_uri
        )
        
        auth_url, _ = flow.authorization_url(
            access_type="offline",
            prompt="consent"
        )
        
        print("\n======================================================================")
        print("1. Copy the following authorization link and open it in your browser:")
        print("======================================================================")
        print(auth_url)
        print("======================================================================\n")
        
        print("2. Log in and click 'Allow' to authorize the application.")
        print("3. After authorizing, you will be redirected to a page (e.g. localhost:8080).")
        print("   Even if the page shows 'Site can't be reached' or 'Unable to connect',")
        print("   copy the full URL from your browser's address bar (containing 'code=...').\n")
        
        url_input = input("4. Paste the redirected URL (or the 'code' parameter) here:\n> ").strip()
        
        if not url_input:
            print("[ERROR] No input received.")
            return
            
        # Extract the code from the URL or query parameters if needed
        code = url_input
        if "code=" in url_input:
            try:
                parsed = urlparse(url_input)
                query_params = parse_qs(parsed.query)
                if "code" in query_params:
                    code = query_params["code"][0]
                    print(f"\n* Extracted auth code: {code[:15]}...")
            except Exception as e:
                print(f"[WARNING] Could not parse URL query parameters: {e}. Using raw input as code.")
        
        print("\n* Exchanging authorization code for refresh token...")
        flow.fetch_token(code=code)
        creds = flow.credentials
        
        print("\n🎉 SUCCESS! Obtained Credentials.")
        print(f"Refresh Token: {creds.refresh_token}")
        
        save = input("\nDo you want to save this GOOGLE_REFRESH_TOKEN to your backend/.env file? (y/n): ").strip().lower()
        if save in ("y", "yes"):
            env_path = ".env"
            if os.path.exists(env_path):
                with open(env_path, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                
                updated = False
                new_lines = []
                for line in lines:
                    if line.startswith("GOOGLE_REFRESH_TOKEN="):
                        new_lines.append(f"GOOGLE_REFRESH_TOKEN={creds.refresh_token}\n")
                        updated = True
                    elif line.startswith("GOOGLE_CLIENT_ID=") and not line.strip().endswith(client_id):
                        new_lines.append(f"GOOGLE_CLIENT_ID={client_id}\n")
                    elif line.startswith("GOOGLE_CLIENT_SECRET=") and not line.strip().endswith(client_secret):
                        new_lines.append(f"GOOGLE_CLIENT_SECRET={client_secret}\n")
                    else:
                        new_lines.append(line)
                
                if not updated:
                    new_lines.append(f"\nGOOGLE_REFRESH_TOKEN={creds.refresh_token}\n")
                
                with open(env_path, "w", encoding="utf-8") as f:
                    f.writelines(new_lines)
                print("Successfully updated .env with GOOGLE_REFRESH_TOKEN!")
            else:
                with open(env_path, "w", encoding="utf-8") as f:
                    f.write(f"GOOGLE_CLIENT_ID={client_id}\n")
                    f.write(f"GOOGLE_CLIENT_SECRET={client_secret}\n")
                    f.write(f"GOOGLE_REFRESH_TOKEN={creds.refresh_token}\n")
                print("Created .env and saved credentials!")
                
    except Exception as e:
        print(f"\n[ERROR] Error during authorization flow: {e}")
        print("\nNote: Make sure that 'http://localhost:8080/' is added as an Authorized Redirect URI in your OAuth Credentials settings in Google Cloud Console.")

if __name__ == "__main__":
    main()
