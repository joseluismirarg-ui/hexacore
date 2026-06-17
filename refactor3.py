import os
import re

TARGET_DIRS = [
    'src/controllers',
    'src/routes',
    'src/lib',
    'src/middlewares',
    'src/validators',
    'src',
]

REPLACEMENTS = [
    (r'\bproductId\b', 'itemId'),
    (r'\bproduct\.routes\b', 'item.routes'),
]

def refactor_file(filepath):
    if not os.path.isfile(filepath):
        return
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for pattern, repl in REPLACEMENTS:
        new_content = re.sub(pattern, repl, new_content)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Refactored: {filepath}")

for d in TARGET_DIRS:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.ts') or file.endswith('.tsx'):
                refactor_file(os.path.join(root, file))

print("Done refactoring backend files again.")
