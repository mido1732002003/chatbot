// structure.js
const fs = require('fs');
const path = require('path');

const structure = [
  'src/app/(auth)/sign-in/page.tsx',
  'src/app/(auth)/sign-up/page.tsx',
  'src/app/(auth)/layout.tsx',
  'src/app/chat/page.tsx',
  'src/app/api/auth/callback/route.ts',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/globals.css',
  'src/components/auth/SignInForm.tsx',
  'src/components/auth/SignUpForm.tsx',
  'src/components/auth/UsernameForm.tsx',
  'src/components/chat/ChatLayout.tsx',
  'src/components/chat/ConversationArea.tsx',
  'src/components/chat/MessageList.tsx',
  'src/components/chat/MessageInput.tsx',
  'src/components/chat/MessageItem.tsx',
  'src/components/chat/UserList.tsx',
  'src/components/shared/Header.tsx',
  'src/components/shared/LoadingSpinner.tsx',
  'src/components/shared/ErrorMessage.tsx',
  'src/components/providers/AuthProvider.tsx',
  'src/lib/supabase/client.ts',
  'src/lib/supabase/server.ts',
  'src/lib/types/database.ts',
  'src/lib/types/chat.ts',
  'src/lib/utils/conversation.ts',
  'src/lib/utils/validation.ts',
  'src/hooks/useAuth.ts',
  'src/hooks/useConversation.ts',
  'src/hooks/useMessages.ts',
  'src/hooks/useRealtimeMessages.ts',
  'src/middleware.ts',
  'supabase/migrations/001_initial_schema.sql',
  'supabase/seed.sql',
  'public/.gitkeep',
  '.env.local.example',
  '.gitignore',
  'next.config.js',
  'package.json',
  'postcss.config.js',
  'tailwind.config.ts',
  'tsconfig.json',
  'README.md'
];

function createStructure(baseDir, files) {
  files.forEach(file => {
    const filePath = path.join(baseDir, file);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '');
    }
  });
}

createStructure(process.cwd(), structure);

console.log('✅ Project structure created successfully!');
