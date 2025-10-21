# Agentic Workflow Implementation

## Problem Analysis

The original implementation had several critical issues:

1. **Single Large Response**: AI dumped all code in one message
2. **No Progressive Feedback**: Users couldn't see what was happening
3. **No Tool Calling**: Simple chat without agentic capabilities
4. **Incomplete Modifications**: Changes weren't applied across all files
5. **No Iteration Loop**: Couldn't verify and fix issues

## Solution: Multi-Step Agent with Tool Calling

We've implemented a proper **agentic workflow** using Vercel AI SDK's tool calling capabilities.

### Architecture

```
User Request
     ↓
AI Agent (with tools)
     ↓
┌────────────────────────────────┐
│  Step 1: Plan (planImplementation tool)
│  - Analyze request
│  - List steps
│  - Identify files
└────────────────────────────────┘
     ↓
┌────────────────────────────────┐
│  Step 2-N: Execute (createFile/modifyFile tools)
│  - Create files one by one
│  - Modify existing files
│  - Show progress after each tool call
└────────────────────────────────┘
     ↓
┌────────────────────────────────┐
│  Step N+1: Complete (completeTask tool)
│  - Summarize what was done
│  - List all files
│  - Suggest next steps
└────────────────────────────────┘
```

## Implementation Details

### 1. Tool Definitions (`frontend/src/lib/tools/code-generation-tools.ts`)

We created 4 tools for the agent:

#### `planImplementation`
- **Purpose**: Create a plan before starting
- **When**: First step of every request
- **Output**: Steps, files list, summary

#### `createFile`
- **Purpose**: Create or update a complete file
- **When**: Creating new files or replacing entire files
- **Output**: File path, content, explanation

#### `modifyFile`
- **Purpose**: Modify existing file using search/replace
- **When**: Making targeted changes to existing files
- **Output**: File path, search/replace content, explanation

#### `completeTask`
- **Purpose**: Mark task as complete
- **When**: After all files are created/modified
- **Output**: Summary, files created/modified, next steps

### 2. API Route Updates (`frontend/src/app/api/generate/route.ts`)

```typescript
const result = await streamText({
  model,
  messages,
  tools: codeGenerationTools,  // ← Tools enabled
  maxTokens: DEFAULT_GENERATION_CONFIG.maxTokens,
  maxSteps: 10,  // ← Allow up to 10 tool calling steps
  onStepFinish: ({ text, toolCalls, toolResults }) => {
    // Log each step for debugging
  },
});
```

**Key Changes:**
- Added `tools` parameter with our tool definitions
- Added `maxSteps: 10` to allow multi-step execution
- Added `onStepFinish` callback for monitoring
- Using `toTextStreamResponse()` which handles tools automatically

### 3. Client Updates (`frontend/src/app/build/client.tsx`)

The client now handles tool calls from the data stream:

```typescript
// Parse data stream format: "0:{json}"
const data = JSON.parse(jsonStr);

if (data.type === 'tool-call') {
  const toolCall = data.toolCall;
  
  if (toolCall.toolName === 'createFile') {
    // Create file in preview
    fileActions.updateFile(filePath, content, true);
    
    // Show progress message
    accumulatedContent += `\n\n📄 Created ${filePath}`;
  }
  // ... handle other tools
}
```

**Key Features:**
- Parses data stream format from Vercel AI SDK
- Handles different tool types
- Updates file state in real-time
- Shows progress messages after each tool call
- Maintains conversation history

### 4. System Prompt Updates (`frontend/src/lib/prompts/profile-generator.ts`)

Updated to instruct AI to use tools:

```
## CRITICAL: AGENTIC WORKFLOW WITH TOOLS

**You are an AI agent with access to tools. You MUST use tools to create and modify files.**

### Workflow:

Step 1: Plan (use planImplementation tool)
Step 2: Execute (use createFile or modifyFile tools)
Step 3: Complete (use completeTask tool)

### Progressive Messaging Rules:

Between tool calls, send brief progress messages to keep the user informed.
```

## Benefits of Agentic Approach

### 1. Progressive Execution
- AI executes one step at a time
- User sees progress in real-time
- Can stop/modify mid-execution

### 2. Tool-Based File Management
- Files created through tools, not text output
- Proper file state management
- Consistent file handling

### 3. Iterative Loop
- AI can call multiple tools in sequence
- Can verify and fix issues
- Can handle complex multi-file changes

### 4. Better Error Handling
- Each tool call can succeed/fail independently
- Easier to identify which step failed
- Can retry specific steps

### 5. Complete Modifications
- AI can modify all relevant files
- Search/replace works across entire codebase
- No missed updates

## Example Flow

### User Request
```
"Create a modern profile page with hero section and contact form"
```

### Agent Execution

**Step 1: Planning**
```
Tool Call: planImplementation
Args: {
  steps: ["Create HTML structure", "Add CSS styling", "Add JavaScript"],
  files: ["index.html", "styles.css", "script.js"],
  summary: "Creating a modern profile page with 3 files"
}

AI Message: "🎯 Planning your profile page..."
```

**Step 2: Create HTML**
```
Tool Call: createFile
Args: {
  filePath: "index.html",
  content: "<!DOCTYPE html>...",
  explanation: "Main HTML structure with hero and contact form"
}

AI Message: "📐 Building the structure..."
File appears in preview →
```

**Step 3: Create CSS**
```
Tool Call: createFile
Args: {
  filePath: "styles.css",
  content: "* { margin: 0; }...",
  explanation: "Responsive styling with modern design"
}

AI Message: "🎨 Adding styles and design..."
File appears in preview →
```

**Step 4: Create JavaScript**
```
Tool Call: createFile
Args: {
  filePath: "script.js",
  content: "document.addEventListener...",
  explanation: "Form validation and smooth scrolling"
}

AI Message: "⚡ Adding interactivity..."
File appears in preview →
```

**Step 5: Complete**
```
Tool Call: completeTask
Args: {
  summary: "Created a modern profile page with responsive design",
  filesCreated: ["index.html", "styles.css", "script.js"],
  filesModified: [],
  nextSteps: ["Preview the page", "Customize colors", "Add more sections"]
}

AI Message: "✅ All done! Your profile page is ready..."
```

## Modification Example

### User Request
```
"Change the button color to blue and add a hover effect"
```

### Agent Execution

**Step 1: Planning**
```
Tool Call: planImplementation
Args: {
  steps: ["Modify CSS for button color", "Add hover effect"],
  files: ["styles.css"],
  summary: "Updating button styles"
}

AI Message: "🔍 Analyzing your request..."
```

**Step 2: Modify CSS**
```
Tool Call: modifyFile
Args: {
  filePath: "styles.css",
  searchContent: ".button { background: red; }",
  replaceContent: ".button { background: blue; }\n.button:hover { background: darkblue; }",
  explanation: "Changed button color to blue with hover effect"
}

AI Message: "🔧 Updating button styles..."
File updated in preview →
```

**Step 3: Complete**
```
Tool Call: completeTask
Args: {
  summary: "Updated button color to blue with hover effect",
  filesCreated: [],
  filesModified: ["styles.css"]
}

AI Message: "✅ Updated! Check the preview..."
```

## Technical Details

### Data Stream Format

Vercel AI SDK uses a data stream format:

```
0:{"type":"text-delta","textDelta":"Hello"}
0:{"type":"tool-call","toolCall":{"toolName":"createFile","args":{...}}}
0:{"type":"tool-result","toolCallId":"123","result":{...}}
```

Each line starts with `0:` followed by JSON data.

### Tool Call Lifecycle

1. **AI decides to call a tool**
   - Sends `tool-call` event with tool name and args
   
2. **Server executes tool**
   - Runs the `execute` function
   - Returns result to AI

3. **AI receives result**
   - Sends `tool-result` event
   - AI can see the result and decide next step

4. **Loop continues**
   - AI can call more tools
   - Or finish with final message

### Max Steps

We set `maxSteps: 10` which means:
- AI can call up to 10 tools in one request
- Prevents infinite loops
- Enough for complex multi-file operations

## Comparison: Before vs After

### Before (Simple Chat)
```
User: "Create a profile page"
AI: [dumps 500 lines of code in one message]
User: "Change button color"
AI: [dumps entire file again]
```

**Problems:**
- No progress feedback
- Can't see what's happening
- Modifications replace entire files
- No iteration or verification

### After (Agentic Workflow)
```
User: "Create a profile page"
AI: 🎯 Planning... [tool call]
AI: 📐 Building structure... [tool call → file created]
AI: 🎨 Adding styles... [tool call → file created]
AI: ⚡ Adding interactivity... [tool call → file created]
AI: ✅ All done!

User: "Change button color"
AI: 🔍 Analyzing... [tool call]
AI: 🔧 Updating styles... [tool call → file modified]
AI: ✅ Updated!
```

**Benefits:**
- Clear progress at each step
- Files created through tools
- Targeted modifications
- Can iterate and verify

## Future Enhancements

### 1. Verification Tools
Add tools for the AI to verify its work:
- `readFile` - Read current file content
- `listFiles` - See what files exist
- `validateHTML` - Check HTML validity
- `validateCSS` - Check CSS validity

### 2. Error Recovery
- Automatic retry on tool failures
- Rollback capability
- Undo/redo support

### 3. Parallel Execution
- Create multiple files in parallel
- Faster generation for large projects

### 4. Context Awareness
- AI can read existing files before modifying
- Better understanding of project structure
- Smarter modifications

### 5. User Approval
- Ask for confirmation before applying changes
- Show diff preview
- Allow selective application

## Testing

### Test Case 1: Initial Generation
```bash
Input: "Create a simple profile page"
Expected:
1. planImplementation tool called
2. createFile called for index.html
3. createFile called for styles.css
4. completeTask tool called
5. All files appear in preview
```

### Test Case 2: Modification
```bash
Input: "Change background color to dark"
Expected:
1. planImplementation tool called
2. modifyFile called for styles.css
3. completeTask tool called
4. File updated in preview
```

### Test Case 3: Complex Request
```bash
Input: "Add a portfolio section with 3 project cards"
Expected:
1. planImplementation tool called
2. modifyFile called for index.html (add section)
3. modifyFile called for styles.css (add styles)
4. modifyFile called for script.js (add interactivity)
5. completeTask tool called
6. All files updated in preview
```

## Conclusion

The agentic workflow transforms the chat from a simple code generator into an intelligent assistant that:

1. **Plans** before executing
2. **Executes** step-by-step with tools
3. **Shows progress** at each step
4. **Verifies** and iterates as needed
5. **Completes** with a summary

This provides a much better user experience and enables complex multi-file operations that weren't possible with simple chat.

## Files Changed

1. ✅ `frontend/src/lib/tools/code-generation-tools.ts` - Tool definitions
2. ✅ `frontend/src/app/api/generate/route.ts` - API route with tools
3. ✅ `frontend/src/app/build/client.tsx` - Client with tool handling
4. ✅ `frontend/src/lib/prompts/profile-generator.ts` - System prompt updates

## Next Steps

1. Test the agentic workflow with various prompts
2. Monitor tool call logs in console
3. Verify files are created/modified correctly
4. Gather user feedback on the experience
5. Add more tools as needed (verification, validation, etc.)
