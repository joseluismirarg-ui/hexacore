import re

with open('prisma/schema.prisma', 'r') as f:
    c = f.read()

c = re.sub(r'tenantId String @map\("tenant_id"\)', 'tenantId String @default("default-tenant") @map("tenant_id")', c)

with open('prisma/schema.prisma', 'w') as f:
    f.write(c)
