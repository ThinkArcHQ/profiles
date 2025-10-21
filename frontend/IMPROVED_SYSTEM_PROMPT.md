# Improved System Prompt for Code Generation Agent

## What Changed

### Old Prompt (Too Brief)
- Only 1159 characters
- Minimal instructions
- No examples
- No design guidance
- Basic workflow only

### New Prompt (Comprehensive)
- ~5000 characters
- Detailed agentic workflow
- Modern CSS examples
- Design principles
- Clear do's and don'ts
- Example workflow

## Key Improvements

### 1. **Agentic Behavior** 🤖
```
You are an AI agent with tools. NEVER output code in chat - ONLY use tools.
```
- Clear instructions to use createFile/modifyFile tools
- Step-by-step workflow
- Progress messaging between tool calls

### 2. **Complete Code Requirements** 📋
- Semantic HTML5 structure
- Mobile-first responsive CSS
- Vanilla JavaScript interactivity
- Accessibility standards
- NO placeholders or incomplete code

### 3. **Modern Design Techniques** 🎨
Includes actual code examples for:
- CSS Variables for theming
- Modern gradients
- Glassmorphism effects
- Smooth animations
- Grid layouts

### 4. **Interactive Features** ⚡
Specific features to implement:
- Smooth scroll navigation
- Intersection Observer animations
- Mobile menu toggle
- Form validation
- Hover effects

### 5. **Clear Constraints** 🚫
What NOT to do:
- No frameworks (React, Vue, Angular)
- No npm packages
- No backend code
- No placeholders
- No code in chat messages

### 6. **Example Workflow** 📝
Shows exactly how to respond:
1. Send progress message
2. Call createFile tool
3. Send next progress message
4. Call next tool
5. Complete with summary

## Benefits

### For the Agent:
- Clear instructions on tool usage
- Examples of what good code looks like
- Specific design patterns to follow
- Knows when to use which tool

### For Users:
- Better quality code output
- Consistent design patterns
- Complete, working files
- Professional results

### For Development:
- Predictable agent behavior
- Easier to debug issues
- Better streaming experience
- Consistent file structure

## Testing Checklist

Test the agent with these prompts:

- [ ] "Create a minimalist dark theme profile page"
- [ ] "Build a glassmorphism profile with neon accents"
- [ ] "Make a brutalist design with bold typography"
- [ ] "Create a colorful gradient profile page"
- [ ] "Design a cyberpunk neon profile"

Expected behavior:
- ✅ Uses createFile tool for each file
- ✅ Sends brief progress messages
- ✅ Generates complete HTML/CSS/JS
- ✅ No code in chat messages
- ✅ Responsive and accessible
- ✅ Modern design techniques
- ✅ No placeholders

## File Location

`frontend/src/lib/agent/code-generation-agent.ts`

## Next Steps

1. Test with various design requests
2. Monitor tool call patterns
3. Adjust prompt if needed
4. Add more examples if agent struggles
5. Fine-tune messaging style
