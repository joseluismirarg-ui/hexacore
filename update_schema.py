import re

with open('prisma/schema.prisma', 'r') as f:
    content = f.read()

# Add Enums
if "enum TenantPlan" not in content:
    enums_str = """
enum TenantPlan {
  BASIC
  PRO
  ENTERPRISE
}

enum TenantStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  SUSPENDED
}

// =============================================================================
// TENANT (Multitenancy)"""
    content = content.replace("// =============================================================================\n// TENANT (Multitenancy)", enums_str)

# Add Tenant fields
if "stripeCustomerId" not in content:
    tenant_fields = """  industry  String   @default("GENERAL") // RETAIL, CONSTRUCTION, OIL, etc.
  plan                 TenantPlan    @default(BASIC)
  status               TenantStatus  @default(TRIAL)
  stripeCustomerId     String?       @map("stripe_customer_id")
  stripeSubscriptionId String?       @map("stripe_subscription_id")
  expiresAt            DateTime?     @map("expires_at")"""
    content = content.replace('  industry  String   @default("GENERAL") // RETAIL, CONSTRUCTION, OIL, etc.', tenant_fields)

# Add PredictiveStockAlert to Tenant relations
if "predictiveStockAlerts PredictiveStockAlert[]" not in content:
    content = content.replace("kardexMovements     KardexMovement[]\n  billOfMaterials     BillOfMaterials[]", "kardexMovements     KardexMovement[]\n  billOfMaterials     BillOfMaterials[]\n  predictiveStockAlerts PredictiveStockAlert[]")

# Add PredictiveStockAlert model at the end
if "model PredictiveStockAlert" not in content:
    alert_model = """
// =============================================================================
// PREDICTIVE STOCK ALERTS
// =============================================================================

model PredictiveStockAlert {
  id                String   @id @default(cuid())
  currentStock      Int      @map("current_stock")
  estimatedDaysLeft Int      @map("estimated_days_left")
  velocityRate      Decimal  @db.Decimal(14, 4) @map("velocity_rate")
  createdAt         DateTime @default(now()) @map("created_at")

  itemId String @map("item_id")
  item   Item   @relation(fields: [itemId], references: [id], onDelete: Restrict)

  tenantId String @default("default-tenant") @map("tenant_id")
  tenant   Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([itemId])
  @@map("predictive_stock_alerts")
}
"""
    content += alert_model

# Update Item relations
if "predictiveAlerts   PredictiveStockAlert[]" not in content:
    content = content.replace('  bomComponent       BOMItem[]          @relation("ComponentItem")', '  bomComponent       BOMItem[]          @relation("ComponentItem")\n  predictiveAlerts   PredictiveStockAlert[]')

with open('prisma/schema.prisma', 'w') as f:
    f.write(content)

print("Schema updated successfully")
