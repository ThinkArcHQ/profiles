# Iterative Refinement Flow Diagram

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
│  ┌────────────────────┐         ┌─────────────────────────┐    │
│  │   Chat Panel       │         │   Preview Panel         │    │
│  │                    │         │                         │    │
│  │  User: "Change     │         │  [Generated Code]       │    │
│  │   the color to     │         │  - Profile.tsx          │    │
│  │   blue"            │         │  - styles.css           │    │
│  │                    │         │  - index.html           │    │
│  └────────────────────┘         └─────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │ Modification        │
                    │ Detection           │
                    │ isModificationReq() │
                    └─────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │ Context Builder     │
                    │ - User message      │
                    │ - Current files     │
                    │ - Conversation hist │
                    └─────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API Route (/api/generate)                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  1. Detect refinement mode (has conversation history)  │    │
│  │  2. Build messages array:                              │    │
│  │     - System prompt (with refinement instructions)     │    │
│  │     - Conversation history                             │    │
│  │     - Current message (with code context)              │    │
│  │  3. Stream AI response                                 │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      AI Provider (Azure/OpenAI)                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  System: "You are in iterative refinement mode..."     │    │
│  │  User: "Change color to blue"                          │    │
│  │  Context: [Current code files]                         │    │
│  │                                                         │    │
│  │  AI: Generates updated files with modifications        │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Response Processing                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  1. Parse code blocks (FILE: format)                   │    │
│  │  2. Merge with existing files                          │    │
│  │  3. Update file state                                  │    │
│  │  4. Refresh preview                                    │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Flow

### Step 1: User Sends Modification Request

```typescript
User Input: "Change the hero background to blue"
                    ↓
        isModificationRequest(message)
                    ↓
              Returns: true
```

### Step 2: Context Enhancement

```typescript
// Client builds enhanced message
if (isModificationRequest && hasFiles) {
  enhancedMessage = `
    ${userMessage}
    
    --- Current Code Context ---
    FILE: components/Profile.tsx
    \`\`\`tsx
    export default function Profile() {
      return <div className="hero">...</div>
    }
    \`\`\`
    
    FILE: styles/profile.css
    \`\`\`css
    .hero {
      background: white;
    }
    \`\`\`
    --- End of Current Code ---
  `;
}
```

### Step 3: API Processing

```typescript
// API route detects refinement mode
const isIterativeRefinement = conversationHistory.length > 0;

// Builds messages with adaptive system prompt
messages = [
  {
    role: 'system',
    content: BASE_PROMPT + ITERATIVE_REFINEMENT_INSTRUCTIONS
  },
  ...conversationHistory,
  {
    role: 'user',
    content: enhancedMessage
  }
];
```

### Step 4: AI Response

```
AI generates updated files:

FILE: styles/profile.css
\`\`\`css
.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
\`\`\`

I've updated the hero background to use a blue gradient.
```

### Step 5: Code Parsing & Merging

```typescript
// Parse AI response
const blocks = parseCodeBlocks(aiResponse);
// Result: [{ path: 'styles/profile.css', content: '...', language: 'css' }]

// Merge with existing files
const updatedFiles = mergeCodeBlocks(existingFiles, blocks);
// Result: Updates profile.css, keeps Profile.tsx unchanged
```

## Key Features

### 1. Smart Context Inclusion

```typescript
// Only includes context when needed
if (isModificationRequest(message) && hasExistingFiles) {
  // Include code context
} else {
  // Don't include (saves tokens)
}
```

### 2. Adaptive System Prompt

```typescript
// Initial generation
systemPrompt = BASE_PROMPT;

// Iterative refinement
systemPrompt = BASE_PROMPT + REFINEMENT_INSTRUCTIONS;
```

### 3. File Merging Strategy

```typescript
// Updates existing files
existingFile.content = newContent;

// Adds new files
files.push(newFile);

// Preserves unchanged files
unchangedFiles.forEach(file => keep(file));
```

## Example Conversation

```
User: "Create a profile page with hero and skills sections"
AI: [Generates Profile.tsx, styles.css, index.html]

User: "Make the hero background blue"
System: [Includes current code in context]
AI: [Updates styles.css with blue background]

User: "Add a contact form"
System: [Includes updated code in context]
AI: [Adds ContactForm.tsx, updates Profile.tsx to include it]

User: "Make the form fields larger"
System: [Includes all current code in context]
AI: [Updates styles.css with larger input styles]
```

## Benefits

1. **Seamless Iterations**: Natural conversation flow
2. **Context Awareness**: AI always knows current state
3. **Token Efficiency**: Only includes context when needed
4. **Structure Preservation**: Maintains code organization
5. **Complete Updates**: Always outputs full files
6. **Smart Detection**: Automatic modification detection

## Technical Implementation

### Files Modified
- `client.tsx` - Context management & detection
- `route.ts` - Refinement mode handling
- `profile-generator.ts` - Adaptive prompts
- `code-parser.ts` - Enhanced parsing & merging

### Tests Added
- Modification detection tests
- FILE: format parsing tests
- Code merging tests
- Structure preservation tests

All tests passing ✅
