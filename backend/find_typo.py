import requests

url = "https://oauth2.googleapis.com/token"

# Base values with potential typos
project_num_variations = ["909588512363", "909588512368", "909588512365", "909588512362", "909588512360"]
suffix_parts = [
    ("3", "3"),
    ("k", "k"),
    ("l", "l", "1", "i"),
    ("e", "e"),
    ("n", "n"),
    ("t", "t"),
    ("d", "d"),
    ("g", "g"),
    ("b", "b"),
    ("e", "e", "a"),
    ("d", "d"),
    ("k", "k"),
    ("0", "0", "o", "O"),
    ("d", "d"),
    ("m", "m"),
    ("j", "j"),
    ("n", "n"),
    ("b", "b"),
    ("e", "e"),
    ("v", "v"),
    ("a", "a"),
    ("k", "k"),
    ("c", "c"),
    ("j", "j"),
    ("n", "n"),
    ("e", "e"),
    ("9", "9"),
    ("v", "v"),
    ("m", "m"),
    ("2", "2"),
    ("f", "f"),
    ("r", "r")
]

client_secret_variations = [
    "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",
    "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",
    "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"
]

refresh_token = "1//04dRo9vzNNS0BCgYIARAAGASNWwF-L9IrwMa0Bb2BME0IRACGHD8rLUJMYjZnx30t34M4+7iM_ZaDu8-GQNSG_jyyagMXdwnSQQk"

def generate_suffixes(index=0, current=""):
    if index == len(suffix_parts):
        yield current
        return
    for char in suffix_parts[index][1:]:
        yield from generate_suffixes(index + 1, current + char)

print("Starting verification of credential variations...")
found = False
count = 0

for proj in project_num_variations:
    for suffix in generate_suffixes():
        client_id = f"{proj}-{suffix}.apps.googleusercontent.com"
        for secret in client_secret_variations:
            count += 1
            if count % 100 == 0:
                print(f"Tested {count} combinations...")
            payload = {
                "client_id": client_id,
                "client_secret": secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token"
            }
            try:
                r = requests.post(url, data=payload, timeout=2)
                res_json = r.json()
                if "error" in res_json:
                    if res_json["error"] != "invalid_client":
                        # Client was found! (e.g. invalid_grant or success)
                        print("\n🎉 SUCCESS! Client ID and Secret found:")
                        print("Client ID:", client_id)
                        print("Client Secret:", secret)
                        print("Response:", res_json)
                        found = True
                        break
                else:
                    print("\n🎉 SUCCESS (200 OK):")
                    print("Client ID:", client_id)
                    print("Client Secret:", secret)
                    print("Response:", res_json)
                    found = True
                    break
            except Exception:
                pass
        if found:
            break
    if found:
        break

if not found:
    print(f"Brute-force complete. Tested {count} combinations. No valid Client ID found.")
