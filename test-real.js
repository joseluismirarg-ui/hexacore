const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { userId: 'admin', role: 'ADMIN', tenantId: 'default-tenant', impersonated: true },
  'fallback_secret',
  { expiresIn: '1h' }
);

// We first get the tenants to get a valid ID!
fetch("https://hexacore-production-4888.up.railway.app/api/admin/tenants", {
  method: "GET",
  headers: { "Authorization": `Bearer ${token}` }
}).then(res => res.json()).then(async (data) => {
  console.log('Tenants fetched:', data.data?.length);
  if (data.data?.length > 0) {
    const tenantId = data.data[0].id;
    console.log('Testing PUT with real tenantId:', tenantId);
    
    const putRes = await fetch(`https://hexacore-production-4888.up.railway.app/api/admin/tenants/${tenantId}/licenses`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ erpActive: false })
    });
    
    console.log('PUT STATUS:', putRes.status);
    console.log('PUT BODY:', await putRes.text());
  }
}).catch(err => console.error(err));
