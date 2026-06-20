const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { userId: 'admin', role: 'ADMIN', tenantId: 'cmqm1iysl0000agr3l79uecdg', impersonated: true },
  'fallback_secret',
  { expiresIn: '1h' }
);

fetch("https://hexacore-production-4888.up.railway.app/api/admin/licenses", {
  method: "GET",
  headers: { "Authorization": `Bearer ${token}` }
}).then(res => res.json()).then(async (data) => {
  console.log('GET License data:', JSON.stringify(data, null, 2));
}).catch(err => console.error(err));
