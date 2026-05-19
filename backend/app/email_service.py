import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from dotenv import load_dotenv
import os
from typing import NamedTuple 
import requests


load_dotenv() 
class SMTPSettings(NamedTuple): 
    host: str 
    port: int 
    user: str | None 
    password: str | None 
    from_addr: str 
    use_tls: bool

def load_smtp_settings() -> SMTPSettings | None:
    host = os.getenv("SMTP_HOST", "").strip()
    from_addr = os.getenv("SMTP_FROM", "").strip()
    if not host or not from_addr:
        return None

    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "").strip() or None
    password = os.getenv("SMTP_PASSWORD", "").strip() or None
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("1", "true", "yes")
    

    return SMTPSettings(
        host=host,
        port=port,
        user=user,
        password=password,
        from_addr=from_addr,
        use_tls=use_tls,
    )

def send_email_smtp(
    to_addr: str,
    subject: str,
    body: str,
    settings: SMTPSettings,
    attachments=None
) -> None:
    print("🔌 Connecting to SMTP server...")
    print(f"📤 Preparing to send email to: {to_addr}")

    msg = MIMEMultipart()
    msg["Subject"] = subject
    msg["From"] = settings.from_addr
    msg["To"] = to_addr

    # ✅ Email body
    msg.attach(MIMEText(body, "plain", "utf-8"))

    # ✅ Attach files correctly
    if attachments:
        print(f"📎 Attaching {len(attachments)} files...")
        for file in attachments:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(file["content"])

            encoders.encode_base64(part)

            part.add_header(
                "Content-Disposition",
                f'attachment; filename="{file["filename"]}"'
            )

            msg.attach(part)

    try:
        with smtplib.SMTP(settings.host, settings.port, timeout=30) as server:
            print("✅ Connected to SMTP")

            if settings.use_tls:
                print("🔐 Starting TLS...")
                server.starttls()

            if settings.user and settings.password:
                print(f"🔑 Logging in as: {settings.user}")
                server.login(settings.user, settings.password)

            print("📨 Sending email...")
            server.sendmail(settings.from_addr, [to_addr], msg.as_string())

            print("🎉 Email sent successfully (with attachments)")

    except Exception as e:
        print("❌ ERROR while sending email:", str(e))
        raise

def send_email_sendgrid_api(
    api_key: str,
    to_addr: str,
    subject: str,
    body: str,
    from_addr: str,
    attachments=None
) -> None:
    print("🔌 Connecting to SendGrid API...")
    print(f"📤 Preparing to send email to: {to_addr}")

    url = "https://api.sendgrid.com/v3/mail/send"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "personalizations": [
            {
                "to": [{"email": to_addr}],
                "subject": subject
            }
        ],
        "from": {"email": from_addr},
        "content": [
            {
                "type": "text/html",  # Send as HTML to support links, otherwise fallback to plain text if needed
                "value": body
            }
        ]
    }

    if attachments:
        import base64
        print(f"📎 Attaching {len(attachments)} files...")
        sg_attachments = []
        for file in attachments:
            encoded = base64.b64encode(file["content"]).decode("utf-8")
            sg_attachments.append({
                "content": encoded,
                "filename": file["filename"]
            })
        payload["attachments"] = sg_attachments

    try:
        print("📨 Sending email via SendGrid API...")
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        print("🎉 Email sent successfully via SendGrid API!")
    except Exception as e:
        print("❌ ERROR while sending email via SendGrid:", str(e))
        if hasattr(e, "response") and e.response is not None:
            print("Response:", e.response.text)
        raise