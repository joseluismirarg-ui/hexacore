import re

with open('prisma/schema.prisma', 'r') as f:
    content = f.read()

content = content.replace('// WAREHOUSE', '// LOCATION')
content = content.replace('OriginWarehouse', 'OriginLocation')
content = content.replace('DestinationWarehouse', 'DestinationLocation')
content = content.replace('warehouseId String   @map("warehouse_id")', 'locationId  String   @map("location_id")')
content = content.replace('@@unique([warehouseId, itemId])', '@@unique([locationId, itemId])')
content = content.replace('origin        Warehouse', 'origin        Location')
content = content.replace('destination   Warehouse', 'destination   Location')

with open('prisma/schema.prisma', 'w') as f:
    f.write(content)

print("Remaining Location renames applied")
