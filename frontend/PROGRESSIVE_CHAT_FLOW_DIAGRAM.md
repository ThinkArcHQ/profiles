# Progressive Chat Flow Diagram

## User Journey Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER SENDS REQUEST                        │
│  "Create a modern profile page with hero and contact form"  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   API RECEIVES REQUEST                       │
│  • Validates input                                           │
│  • Builds conversation history                              │
│  • Sends to AI model with system prompt                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  AI GENERATES RESPONSE                       │
│  • Follows progressive messaging format                      │
│  • Breaks down into logical steps                           │
│  • Uses emojis for visual clarity                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   STREAMING RESPONSE                         │
│  • Text streams to client in real-time                       │
│  • Client updates UI progressively                           │
│  • Code blocks parsed and sent to preview                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌──────────────────┐                  ┌──────────────────┐
│   CHAT PANEL     │                  │  PREVIEW PANEL   │
│                  │                  │                  │
│  Shows messages  │                  │  Shows code      │
│  with emojis     │                  │  with syntax     │
│  and colors      │                  │  highlighting    │
└──────────────────┘                  └──────────────────┘
```

## Progressive Message Flow

```
TIME →

┌─────────────────────────────────────────────────────────────┐
│ t=0s                                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎯 Planning your profile page                           │ │
│ │                                                         │ │
│ │ I'll create a modern profile page with hero section,   │ │
│ │ skills showcase, and contact form. Let's start...      │ │
│ └─────────────────────────────────────────────────────────┘ │
│ Color: Blue (bg-blue-500/10)                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ t=2s                                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📐 Building the structure                               │ │
│ │                                                         │ │
│ │ Creating semantic HTML with proper accessibility...    │ │
│ └─────────────────────────────────────────────────────────┘ │
│ Color: Purple (bg-purple-500/10)                            │
│                                                             │
│ Preview Panel: index.html appears →                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ t=4s                                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎨 Adding styles and design                             │ │
│ │                                                         │ │
│ │ Implementing responsive design with modern CSS...      │ │
│ └─────────────────────────────────────────────────────────┘ │
│ Color: Pink (bg-pink-500/10)                                │
│                                                             │
│ Preview Panel: styles.css appears →                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ t=6s                                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚡ Adding interactivity                                  │ │
│ │                                                         │ │
│ │ Implementing smooth scrolling and form validation...   │ │
│ └─────────────────────────────────────────────────────────┘ │
│ Color: Yellow (bg-yellow-500/10)                            │
│                                                             │
│ Preview Panel: script.js appears →                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ t=8s                                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✅ All done!                                            │ │
│ │                                                         │ │
│ │ Your profile page is ready! It includes:               │ │
│ │ • Fully responsive design                              │ │
│ │ • Smooth animations                                    │ │
│ │ • Interactive contact form                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│ Color: Green (bg-green-500/10)                              │
└─────────────────────────────────────────────────────────────┘
```

## Message Type Detection Flow

```
┌─────────────────────────────────────────────────────────────┐
│              MESSAGE RECEIVED FROM AI                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              SANITIZE MESSAGE CONTENT                        │
│  • Remove FILE: blocks                                       │
│  • Remove SEARCH/REPLACE blocks                             │
│  • Remove code blocks                                        │
│  • Keep only chat text                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              DETECT MESSAGE TYPE                             │
│                                                              │
│  Contains 🎯 or "planning"? → Planning (Blue)               │
│  Contains 📐 or "structure"? → Building (Purple)            │
│  Contains 🎨 or "style"? → Styling (Pink)                   │
│  Contains ⚡ or "interactivity"? → Interactive (Yellow)     │
│  Contains ✅ or "done"? → Complete (Green)                  │
│  Contains 🔧 or "updating"? → Update (Orange)               │
│  Otherwise → Default (White)                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              APPLY STYLING                                   │
│  • Get color scheme for message type                         │
│  • Apply background color                                    │
│  • Apply border color                                        │
│  • Add shadow effect                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              RENDER MESSAGE                                  │
│  • Display in chat panel                                     │
│  • Show with appropriate styling                             │
│  • Auto-scroll to bottom                                     │
└─────────────────────────────────────────────────────────────┘
```

## Code Parsing Flow

```
┌─────────────────────────────────────────────────────────────┐
│              AI RESPONSE STREAMING                           │
│  Contains both chat text and FILE blocks                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              PARSE CODE BLOCKS                               │
│  • Extract FILE: declarations                                │
│  • Parse code blocks (```html, ```css, ```js)              │
│  • Detect SEARCH/REPLACE blocks                             │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
┌──────────────────────┐    ┌──────────────────────┐
│   CHAT TEXT          │    │   CODE BLOCKS        │
│                      │    │                      │
│  • Sanitized         │    │  • File path         │
│  • No code           │    │  • Language          │
│  • Brief message     │    │  • Content           │
│                      │    │  • Complete flag     │
└──────────────────────┘    └──────────────────────┘
        │                           │
        ▼                           ▼
┌──────────────────────┐    ┌──────────────────────┐
│   CHAT PANEL         │    │   PREVIEW PANEL      │
│                      │    │                      │
│  Display with        │    │  Display with        │
│  color coding        │    │  syntax highlight    │
└──────────────────────┘    └──────────────────────┘
```

## User Interaction Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER ACTIONS                              │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Send Message │   │ Upload File  │   │ View Preview │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Progressive  │   │ Attach to    │   │ Switch Mode  │
│ Messages     │   │ Message      │   │ Code/Preview │
│ Appear       │   │              │   │              │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    UPDATED UI                                │
│  • Chat shows progressive messages                           │
│  • Preview shows generated code                              │
│  • Progress indicator shows status                           │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  BuildPageClient                             │
│  (Main container component)                                  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ MessageList  │   │ ChatInput    │   │ PreviewPanel │
│              │   │              │   │              │
│ • Display    │   │ • User input │   │ • Code view  │
│ • Sanitize   │   │ • File upload│   │ • Preview    │
│ • Color code │   │ • Send       │   │ • Download   │
└──────────────┘   └──────────────┘   └──────────────┘
        │
        ▼
┌──────────────┐
│ Generation   │
│ Progress     │
│              │
│ • Spinner    │
│ • Messages   │
│ • File count │
└──────────────┘
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION STATE                         │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ messages[]   │   │ fileState    │   │ isGenerating │
│              │   │              │   │              │
│ • User msgs  │   │ • files[]    │   │ • true/false │
│ • AI msgs    │   │ • activeFile │   │              │
│ • Timestamps │   │ • generating │   │              │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    UI UPDATES                                │
│  • Messages render with colors                               │
│  • Files appear in preview                                   │
│  • Progress indicator shows/hides                            │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ERROR OCCURS                              │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ API Error    │   │ Parse Error  │   │ Network Error│
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    ERROR MESSAGE                             │
│  • Display in chat as assistant message                      │
│  • Show error details                                        │
│  • Suggest retry                                             │
│  • Stop generation indicator                                 │
└─────────────────────────────────────────────────────────────┘
```

## Visual Legend

```
┌─────────────────────────────────────────────────────────────┐
│                    COLOR MEANINGS                            │
├─────────────────────────────────────────────────────────────┤
│ 🎯 Blue    → Planning, Overview                             │
│ 📐 Purple  → Building, Structure, HTML                      │
│ 🎨 Pink    → Styling, Design, CSS                           │
│ ⚡ Yellow  → Interactivity, JavaScript                      │
│ ✅ Green   → Complete, Success, Done                        │
│ 🔧 Orange  → Update, Modify, Fix                            │
│ 🔍 Orange  → Analyzing, Understanding                       │
└─────────────────────────────────────────────────────────────┘
```

## Performance Considerations

```
┌─────────────────────────────────────────────────────────────┐
│                    OPTIMIZATION                              │
├─────────────────────────────────────────────────────────────┤
│ • Streaming: Real-time updates without waiting              │
│ • Sanitization: Remove code before rendering                │
│ • Auto-scroll: Smooth scroll to latest message              │
│ • Memoization: Prevent unnecessary re-renders               │
│ • Lazy loading: Load preview only when needed               │
└─────────────────────────────────────────────────────────────┘
```

This diagram provides a complete visual overview of how the progressive chat system works from user input to final display.
