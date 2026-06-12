import concurrent.futures
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

def check_combination(client_id, secret):
    payload = {
        "client_id": client_id,
        "client_secret": secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token"
    }
    try:
        r = requests.post(url, data=payload, timeout=5)
        res_json = r.json()
        if "error" in res_json:
            if res_json["error"] != "invalid_client":
                return True, client_id, secret, res_json
        else:
            return True, client_id, secret, res_json
    except Exception as e:
        pass
    return False, client_id, secret, None

if __name__ == "__main__":
    print("Starting concurrent verification of credential variations...")
    tasks = []
    for proj in project_num_variations:
        for suffix in generate_suffixes():
            client_id = f"{proj}-{suffix}.apps.googleusercontent.com"
            for secret in client_secret_variations:
                tasks.append((client_id, secret))
    
    print(f"Total combinations to test: {len(tasks)}")
    
    found = False
    with concurrent.futures.ThreadPoolExecutor(max_workers=30) as executor:
        futures = {executor.submit(check_combination, cid, sec): (cid, sec) for cid, sec in tasks}
        for future in concurrent.futures.as_completed(futures):
            success, client_id, secret, res_json = future.result()
            if success:
                print("\n🎉 SUCCESS! Client ID and Secret found:")
                print("Client ID:", client_id)
                print("Client Secret:", secret)
                print("Response:", res_json)
                found = True
                # Cancel remaining futures
                for f in futures:
                    f.cancel()
                break
                
    if not found:
        print("Brute-force complete. No valid Client ID found.")
