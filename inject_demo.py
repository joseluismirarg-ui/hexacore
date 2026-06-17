import os

with open('src/controllers/auth.controller.ts', 'r', encoding='utf-8') as f:
    content = f.read()

with open('append_demo.ts', 'r', encoding='utf-8') as f:
    demo_content = f.read()

# We only need the function part, not the imports
demo_func = demo_content.split('export const createDemoSession')[1]
demo_func = '\nexport const createDemoSession' + demo_func

# Also we need to make sure seedIndustryTemplates is imported
if 'seedIndustryTemplates' not in content:
    content = "import { seedIndustryTemplates } from '../../prisma/giros.seed';\n" + content

if 'createDemoSession' not in content:
    content += demo_func

with open('src/controllers/auth.controller.ts', 'w', encoding='utf-8') as f:
    f.write(content)
