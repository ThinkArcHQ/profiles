# Improved System Prompt for Profile Building

## What Changed

### ❌ Old Prompt (Generic)
- Generic "web page" builder
- No specific focus on profiles
- Vague instructions about messaging
- No clear workflow

### ✅ New Prompt (Profile-Focused)

#### 1. Clear Mission
```
You are an expert profile page builder for ProfileBase - a platform where 
people create discoverable profiles for AI agents.
```

#### 2. Specific Workflow with Progressive Messaging
```
Step 1: Plan (ALWAYS FIRST)
- Call planImplementation tool
- Send text: "🎯 Planning your profile page..."

Step 2: Execute (One File at a Time)
- Call createFile tool
- Send text: "📐 Building the structure..."
- Call createFile tool
- Send text: "🎨 Adding styles..."

Step 3: Complete (ALWAYS LAST)
- Send text: "✅ All done!"
- Call completeTask tool
```

#### 3. Technology Stack Clarity
```
✅ HTML5 (semantic elements)
✅ CSS3 (modern features, Grid, Flexbox)
✅ Vanilla JavaScript (pure JS)
❌ NO React, NO JSX, NO TypeScript
❌ NO external libraries
```

#### 4. Profile-Specific Sections
- Hero Section (name, title, photo)
- About/Bio
- Skills showcase
- Experience/Portfolio
- Contact form
- Social links
- Resume download

#### 5. Progressive Messaging Examples
```
"🎯 **Planning your profile page**

I'll create a modern profile with hero section, skills showcase, 
and contact form. Let's start building..."

"📐 **Building the structure**

Creating semantic HTML with proper accessibility..."

"🎨 **Adding styles and design**

Implementing responsive design with modern CSS and smooth animations..."

"⚡ **Adding interactivity**

Implementing smooth scrolling, form validation, and mobile menu..."

"✅ **All done!**

Your profile page is ready with responsive design, animations, 
and full accessibility!"
```

## Key Improvements

### 1. Real-Time Updates
**CRITICAL instruction added:**
> "You MUST send a text message BETWEEN each tool call. This is how users see progress."

**Example flow:**
1. Send text: "🎯 Planning..."
2. Call tool
3. Send text: "📐 Building..."
4. Call tool
5. Send text: "🎨 Styling..."
6. Call tool
7. Send text: "✅ Done!"

### 2. Profile-Focused
- Specific to personal profile pages
- Lists common profile sections
- Emphasizes personal branding
- Focused on showcasing individuals

### 3. Technology Clarity
- Explicitly states: NO React, NO frameworks
- Only vanilla HTML/CSS/JS
- Clear file structure (index.html, styles.css, script.js)
- Proper linking instructions

### 4. Design Guidelines
- Modern & professional
- Fully responsive (mobile-first)
- Accessible (WCAG compliant)
- Beautiful CSS examples provided

### 5. Communication Style
- Use emojis for visual clarity
- Keep messages brief (1-2 sentences)
- Be conversational and encouraging
- Focus on WHAT, not HOW

## Expected User Experience

### Before (Generic)
```
User: "Create a profile page"
AI: [Creates files without clear progress updates]
User: "What's happening?"
```

### After (Profile-Focused with Progressive Updates)
```
User: "Create a profile page"

AI: "🎯 **Planning your profile page**

I'll create a modern profile with hero section, skills showcase, 
and contact form. Let's start building..."

[planImplementation tool called]

AI: "📐 **Building the structure**

Creating semantic HTML with proper accessibility..."

[createFile tool called - index.html appears]

AI: "🎨 **Adding styles and design**

Implementing responsive design with modern CSS and smooth animations..."

[createFile tool called - styles.css appears]

AI: "⚡ **Adding interactivity**

Implementing smooth scrolling, form validation, and mobile menu..."

[createFile tool called - script.js appears]

AI: "✅ **All done!**

Your profile page is ready with responsive design, animations, 
and full accessibility!"

[completeTask tool called]
```

## Benefits

### For Users
1. ✅ Clear progress updates at each step
2. ✅ Know exactly what's being built
3. ✅ See files appear in real-time
4. ✅ Understand the workflow
5. ✅ Feel engaged in the process

### For Profiles
1. ✅ Focused on personal branding
2. ✅ Professional, polished designs
3. ✅ Responsive across all devices
4. ✅ Accessible to everyone
5. ✅ Production-ready code

### For Development
1. ✅ Clear workflow for agent
2. ✅ Consistent messaging pattern
3. ✅ Easy to debug issues
4. ✅ Predictable behavior
5. ✅ Maintainable system

## Testing

### Test 1: Initial Profile
```
Input: "Create a modern profile page for a software developer"

Expected Messages:
1. "🎯 Planning your profile page..."
2. "📐 Building the structure..."
3. "🎨 Adding styles and design..."
4. "⚡ Adding interactivity..."
5. "✅ All done!"

Expected Files:
- index.html (with hero, skills, projects, contact)
- styles.css (responsive, modern design)
- script.js (smooth scrolling, form validation)
```

### Test 2: Modification
```
Input: "Change the color scheme to blue"

Expected Messages:
1. "🔍 Analyzing your request..."
2. "🔧 Updating color scheme..."
3. "✅ Updated!"

Expected Changes:
- styles.css modified with blue colors
```

### Test 3: Add Section
```
Input: "Add a portfolio section with 3 projects"

Expected Messages:
1. "🔍 Analyzing your request..."
2. "📐 Adding portfolio section..."
3. "🎨 Styling portfolio cards..."
4. "✅ Updated!"

Expected Changes:
- index.html modified (portfolio section added)
- styles.css modified (portfolio styles added)
```

## Conclusion

The new system prompt is:
- ✅ Profile-focused (not generic)
- ✅ Clear workflow with progressive messaging
- ✅ Technology stack clarity (vanilla only)
- ✅ Better communication style
- ✅ Real-time progress updates

This will provide a much better user experience with clear, progressive feedback at every step! 🚀
