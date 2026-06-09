import os

root_dir = "d:/CSP_pro/frontend/src"
search_terms = ["updateUser"]

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith((".js", ".jsx")):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                for term in search_terms:
                    if term in content:
                        print(f"Found '{term}' in {os.path.relpath(path, root_dir)}")
