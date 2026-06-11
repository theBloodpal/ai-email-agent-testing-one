from __future__ import annotations

import base64
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from dotenv import load_dotenv

load_dotenv()

_cached_creds: Credentials | None = None
_cached_service = None

def get_gmail_credentials() -> Credentials | None:
    global _cached_creds, _cached_service
    client_id = os.getenv("GOOGLE_CLIENT_ID", "").strip()
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
    refresh_token = os.getenv("GOOGLE_REFRESH_TOKEN", "").strip()

    if not all([client_id, client_secret, refresh_token]):
        _cached_creds = None
        _cached_service = None
        return None

    if (_cached_creds 
        and _cached_creds.client_id == client_id 
        and _cached_creds.client_secret == client_secret 
        and _cached_creds.refresh_token == refresh_token):
        return _cached_creds

    _cached_creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret
    )
    _cached_service = None
    return _cached_creds

def is_gmail_api_configured() -> bool:
    return get_gmail_credentials() is not None

def send_email_gmail_api(
    to_addr: str,
    subject: str,
    body: str,
    attachments=None
) -> None:
    global _cached_service
    print("[Gmail API] Connecting to Google Gmail API...")
    print(f"[Gmail API] Preparing to send email via Gmail API to: {to_addr}")

    creds = get_gmail_credentials()
    if not creds:
        raise ValueError("Google API credentials (client_id, client_secret, refresh_token) are not fully configured in env.")

    # Refresh token if needed
    if not creds.valid:
        print("[Gmail API] Refreshing Google OAuth access token...")
        creds.refresh(Request())

    if _cached_service is None:
        _cached_service = build("gmail", "v1", credentials=creds)
    service = _cached_service

    from_addr = os.getenv("GOOGLE_FROM_EMAIL", "").strip() or os.getenv("SMTP_FROM", "").strip()
    if not from_addr:
        # Fallback: get profile email from Google service itself
        try:
            profile = service.users().getProfile(userId="me").execute()
            from_addr = profile.get("emailAddress")
        except Exception:
            from_addr = "me"

    msg = MIMEMultipart()
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to_addr

    # Email body
    msg.attach(MIMEText(body, "plain", "utf-8"))

    if attachments:
        print(f"[Gmail API] Attaching {len(attachments)} files...")
        for file in attachments:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(file["content"])
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f'attachment; filename="{file["filename"]}"'
            )
            msg.attach(part)

    raw_message = base64.urlsafe_b64encode(msg.as_bytes()).decode("utf-8")
    payload = {"raw": raw_message}

    try:
        print("[Gmail API] Sending email via Gmail REST API...")
        send_result = service.users().messages().send(userId="me", body=payload).execute()
        print(f"[Gmail API] Email sent successfully! Message ID: {send_result.get('id')}")
    except Exception as e:
        print("[Gmail API] ERROR while sending email via Gmail API:", str(e))
        raise
