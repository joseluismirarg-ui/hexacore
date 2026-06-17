import os
import re

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    new_content = new_content.replace('warehouseId_itemId', 'locationId_itemId')
    new_content = new_content.replace('warehouseId_itemId_tenantId', 'locationId_itemId_tenantId')
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.ts'):
            replace_in_file(os.path.join(root, file))

print("Search and replace for warehouseId_itemId completed")
