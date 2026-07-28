const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../apps/web/src/pages/database-designer.tsx');

let content = fs.readFileSync(file, 'utf8');

if (!content.includes('useAIQueue')) {
  content = content.replace('import { supabase } from "@/lib/supabase";', 'import { supabase } from "@/lib/supabase";\nimport { useAIQueue } from "@/lib/ai-queue-context";');
}

if (!content.includes('const aiQueue = useAIQueue();')) {
  content = content.replace('const { session } = useAuth();', 'const { session } = useAuth();\n  const aiQueue = useAIQueue();');
}

const match = content.match(/const token = session\?\.access_token;[\s\S]*?const data = await res\.json\(\);/m);
if (match) {
  const replacement = `const data = await aiQueue.enqueue('generate-database-schema', input, { prompt: input, dialect: 'postgresql' });`;
  content = content.replace(match[0], replacement);
  fs.writeFileSync(file, content);
  console.log('Updated database-designer.tsx');
} else {
  console.log('No fetch block found in database-designer.tsx');
}
