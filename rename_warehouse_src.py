import os
import re

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    new_content = re.sub(r'\bWarehouse\b', 'Location', new_content)
    new_content = re.sub(r'\bwarehouse\b', 'location', new_content)
    new_content = re.sub(r'\bwarehouses\b', 'locations', new_content)
    new_content = re.sub(r'\bWarehouses\b', 'Locations', new_content)
    new_content = re.sub(r'\bwarehouseId\b', 'locationId', new_content)
    new_content = re.sub(r'\bwarehouse_id\b', 'location_id', new_content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.ts'):
            replace_in_file(os.path.join(root, file))

print("Search and replace completed in src/")
