import re

filepath = 'prisma/stress-test-simulator.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('prisma.product', 'prisma.item')
content = content.replace('prisma.warehouse', 'prisma.location')
content = content.replace('productId', 'itemId')
content = content.replace('warehouseId', 'locationId')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Simulator fixed")
