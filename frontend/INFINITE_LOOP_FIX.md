# Infinite Loop Fix

## Error
```
Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.
```

## Root Cause
The useEffect was watching `fileState.files` in its dependency array:

```tsx
useEffect(() => {
  // ... process messages and call fileActions.updateFile() ...
}, [messages, fileState.files, fileActions]); // ❌ fileState.files causes loop
```

When `fileActions.updateFile()` is called, it updates `fileState.files`, which triggers the useEffect again, creating an infinite loop.

## The Fix
Remove `fileState.files` from the dependency array:

```tsx
useEffect(() => {
  // ... process messages and call fileActions.updateFile() ...
}, [messages, fileActions]); // ✅ Only watch messages and actions
```

## Why This Works
- `messages` changes when new AI responses arrive (what we want to watch)
- `fileActions` is memoized with `useCallback` (stable reference)
- `fileState.files` is READ inside the effect but we don't need to re-run when it changes
- The `processedToolCallsRef` prevents duplicate processing

## Result
- No infinite loop
- Files stream properly
- All tool calls are processed
- Input clears after submission
