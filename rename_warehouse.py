import re

with open('prisma/schema.prisma', 'r') as f:
    content = f.read()

# Replace model name
content = content.replace("model Warehouse {", "model Location {")
content = content.replace('@@map("warehouses")', '@@map("locations")')

# Replace references in Inventory
content = content.replace("warehouseId String    @map(\"warehouse_id\")", "locationId  String    @map(\"location_id\")")
content = content.replace("warehouse   Warehouse @relation(fields: [warehouseId]", "location    Location  @relation(fields: [locationId]")
content = content.replace("@@unique([tenantId, itemId, warehouseId])", "@@unique([tenantId, itemId, locationId])")

# Replace references in KardexMovement
content = content.replace("warehouseId String?    @map(\"warehouse_id\")", "locationId  String?    @map(\"location_id\")")
content = content.replace("warehouse   Warehouse? @relation(fields: [warehouseId]", "location    Location?  @relation(fields: [locationId]")

# Replace references in Tenant
content = content.replace("warehouses          Warehouse[]", "locations           Location[]")

with open('prisma/schema.prisma', 'w') as f:
    f.write(content)

print("Schema updated for Location rename")
