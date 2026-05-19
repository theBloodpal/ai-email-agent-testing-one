import os
import smtplib
import time
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from imap_tools import MailBox

load_dotenv()

# ================= SMTP =================
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASSWORD")
SMTP_FROM = os.getenv("SMTP_FROM")

# ================= IMAP =================
IMAP_HOST = os.getenv("IMAP_HOST")
IMAP_USER = os.getenv("SMTP_USER")
IMAP_PASS = os.getenv("SMTP_PASSWORD")


# ================= SEND EMAIL =================
def send_email(to_email: str):
    print(f"\n📤 Sending to {to_email}")

    msg = MIMEMultipart()
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg["Subject"] = "Test Email Bounce Detection"

    body = "This is a test email for bounce detection."
    msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_FROM, to_email, msg.as_string())

        print("✅ Sent successfully (accepted by server)")

    except Exception as e:
        print("❌ Send failed:", str(e))


# ================= CHECK BOUNCES =================
from datetime import datetime, timedelta, timezone

BOUNCE_KEYWORDS = [
    "delivery status notification",
    "undelivered",
    "mail delivery subsystem",
    "failure",
    "returned to sender",
    "address not found",
    "550",
    "5.1.1"
]


from datetime import datetime, timedelta, timezone

def extract_failed_email(text: str):
    match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
    return match.group(0) if match else None


def check_bounces(
    imap_host=None,
    imap_user=None,
    imap_pass=None,
):

    print("\n📥 Checking recent bounce emails...")

    bounced = []

    # recent bounce window
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=5)

    # dynamic credentials
    host = (imap_host or IMAP_HOST or "imap.gmail.com").strip()

    user = imap_user or IMAP_USER

    password = imap_pass or IMAP_PASS

    if not user or not password:

        print("⚠️ Missing IMAP credentials")

        return []

    with MailBox(host).login(user, password) as mailbox:

        for msg in mailbox.fetch(limit=50, reverse=True):

            subject = (msg.subject or "").lower()

            body = msg.text or msg.html or ""

            msg_time = msg.date

            # timezone safety
            if msg_time.tzinfo is None:

                msg_time = msg_time.replace(
                    tzinfo=timezone.utc
                )

            # skip old emails
            if msg_time < cutoff:
                continue

            print("\n-------------------")
            print("FROM:", msg.from_)
            print("SUBJECT:", msg.subject)
            print("DATE:", msg.date)

            bounce_keywords = [
                "delivery status notification",
                "undelivered",
                "returned mail",
                "mail delivery failed",
                "delivery failure",
                "failure notice",
                "recipient address rejected",
                "address not found",
                "550",
                "5.1.1"
            ]

            is_bounce = any(
                keyword in subject
                for keyword in bounce_keywords
            )

            if not is_bounce:
                continue

            failed_email = extract_failed_email(body)

            print("🚨 Bounce detected")
            print("❌ Failed Email:", failed_email)

            if not failed_email:
                continue

            bounced.append({
                "email": failed_email.lower().strip(),
                "reason": msg.subject,
                "date": msg_time.isoformat()
            })

    print("\n📊 Final bounced emails:")
    print(bounced)

    return bounced
# # ================= MAIN TEST =================
# if __name__ == "__main__":

#     test_emails = [
#         # "jarilstudentfycs2021@gmail.com",   # valid
#         "abc@nonexistentdomain12345.com"    # invalid domain
#     ]

#     print("🚀 Starting test...")

#     # STEP 1: Send emails
#     for email in test_emails:
#         send_email(email)

#     # STEP 2: wait for bounce
#     print("\n⏳ Waiting for bounce emails (30 sec)...")
#     time.sleep(10)

#     # STEP 3: Check bounce
#     results = check_bounces()

#     print("\n📊 Bounce Results:")
#     for r in results:
#         print(r)

#     if not results:
#         print("⚠️ No bounce emails detected yet")