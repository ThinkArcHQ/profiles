# Progressive Chat - Quick Reference

## Emoji Guide

| Emoji | Type | Color | Use Case |
|-------|------|-------|----------|
| 🎯 | Planning | Blue | Initial overview, listing features |
| 📐 | Building | Purple | Creating HTML structure |
| 🎨 | Styling | Pink | Adding CSS design |
| ⚡ | Interactive | Yellow | Adding JavaScript |
| ✅ | Complete | Green | Finished, done |
| 🔧 | Update | Orange | Modifying existing code |
| 🔍 | Analyzing | Orange | Understanding request |

## Message Templates

### Initial Generation (5 messages)

```
1. 🎯 Planning your [feature]
   Brief overview (1-2 lines)

2. 📐 Building the structure
   Creating semantic HTML...
   [FILE: index.html]

3. 🎨 Adding styles and design
   Implementing responsive design...
   [FILE: styles.css]

4. ⚡ Adding interactivity
   Implementing [features]...
   [FILE: script.js]

5. ✅ All done!
   Summary (3-5 bullets)
```

### Modifications (3 messages)

```
1. 🔍 Analyzing your request
   I'll update [what]...

2. 🔧 Updating [component]
   [FILE: path with SEARCH/REPLACE]

3. ✅ Updated!
   [What] changed. Check preview!
```

## Color Codes

```css
/* Planning */
bg-blue-500/10 border-blue-500/30

/* Building */
bg-purple-500/10 border-purple-500/30

/* Styling */
bg-pink-500/10 border-pink-500/30

/* Interactive */
bg-yellow-500/10 border-yellow-500/30

/* Complete */
bg-green-500/10 border-green-500/30

/* Update */
bg-orange-500/10 border-orange-500/30
```

## Rules

### DO ✅
- Break into 4-5 progressive messages
- Use emojis for visual clarity
- Keep messages 1-3 sentences
- Put code in FILE blocks
- Be conversational and friendly

### DON'T ❌
- Dump everything in one message
- Show code in chat text
- Write long explanations
- Skip progressive steps
- Use technical jargon

## Quick Examples

### Simple Request
```
User: "Create a profile page"

AI:
1. 🎯 Planning your profile page
   I'll create a clean profile with name, bio, and contact.

2. 📐 Building the structure
   [HTML]

3. 🎨 Adding styles
   [CSS]

4. ✅ All done!
   Your profile is ready!
```

### Modification
```
User: "Change color to blue"

AI:
1. 🔍 Analyzing your request
   I'll update the color to blue...

2. 🔧 Updating colors
   [SEARCH/REPLACE]

3. ✅ Updated!
   Color changed to blue!
```

## Testing Checklist

- [ ] Messages appear progressively
- [ ] Correct color coding
- [ ] Emojis display properly
- [ ] Code in preview panel
- [ ] Messages are brief
- [ ] Works on mobile

## Common Issues

| Issue | Solution |
|-------|----------|
| All messages at once | Check streaming |
| Wrong colors | Verify emoji detection |
| Code in chat | Check sanitization |
| No emojis | Check UTF-8 encoding |

## Files to Check

1. `frontend/src/lib/prompts/profile-generator.ts` - System prompt
2. `frontend/src/components/build/message-list.tsx` - Message display
3. `frontend/src/components/build/generation-progress.tsx` - Progress indicator

## Success Metrics

✅ Progressive delivery  
✅ Color-coded messages  
✅ Emoji clarity  
✅ Brief content  
✅ Engaging UX  

---

**For detailed documentation, see:**
- `PROGRESSIVE_CHAT_UX_IMPROVEMENTS.md` - Full details
- `CHAT_UX_COMPARISON.md` - Before/after
- `TESTING_PROGRESSIVE_CHAT.md` - Testing guide
- `AI_PROGRESSIVE_MESSAGING_GUIDE.md` - AI model guide
