const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { userId: 'admin', role: 'ADMIN', tenantId: 'default-tenant', impersonated: true },
  'fallback_secret',
  { expiresIn: '1h' }
);

fetch("https://hexacore-production-4888.up.railway.app/api/admin/tenants/test/licenses", {
  method: "PUT",
  headers: { 
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  },
  body: JSON.stringify({ erpActive: false })
}).then(res => {
  console.log('STATUS:', res.status);
  return res.text();
}).then(text => console.log('BODY:', text))
  .catch(err => console.error(err));
