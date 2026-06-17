import re

with open('src/app.ts', 'r', encoding='utf-8') as f:
    content = f.read()

if 'setupSwagger(app);' not in content:
    content = content.replace('// ---- API ENDPOINTS (Módulo por Módulo) ----', '// ---- SETUP SWAGGER DOCS ----\nsetupSwagger(app);\n\n// ---- API ENDPOINTS (Módulo por Módulo) ----')

with open('src/app.ts', 'w', encoding='utf-8') as f:
    f.write(content)
