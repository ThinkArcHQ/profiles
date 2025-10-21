# Input Clear Fix - Root Cause

## The Problem
Input field wasn't clearing after submission.

## Root Cause
The `PromptInput` component uses an **uncontrolled form** with `name="message"` on the textarea. When you pass `value={text}`, it creates a controlled component, but the form still reads from FormData on submit, not from the React state.

After submission, the PromptInput's internal `clear()` only clears attachments, NOT the text input.

## The Simple Fix

```tsx
const handleSubmit = async (message: PromptInputMessage, event?: FormEvent) => {
  // ... send message logic ...
  
  sendMessage({ text: enhancedMessage });
  
  // Clear React state
  setText("");
  
  // Reset the HTML form to clear the textarea
  if (event?.currentTarget instanceof HTMLFormElement) {
    event.currentTarget.reset();
  }
};
```

## Why This Works
1. `setText("")` - Clears the React state (for the controlled value)
2. `event.currentTarget.reset()` - Resets the HTML form (clears the actual textarea DOM element)

## Files Changed
- `frontend/src/app/build/client.tsx` - Added form reset logic

## Test
1. Type a message
2. Press Enter or click Send
3. Input should be empty immediately
