# SEARCH/REPLACE Improvements & Temperature Fix

## Issues Fixed

### 1. Temperature/TopP Warnings
**Problem**: Console warnings about unsupported settings for reasoning models
```
AI SDK Warning: The "temperature" setting is not supported by this model
AI SDK Warning: The "topP" setting is not supported by this model
```

**Solution**: Removed temperature and topP settings from AI configuration
- Removed from `DEFAULT_GENERATION_CONFIG`
- Removed from `streamText()` call in generate API
- Only keeping `maxTokens` setting

### 2. SEARCH/REPLACE Matching Failures
**Problem**: Search blocks not matching existing code
```
Failed to apply SEARCH/REPLACE to index.html: 
["Search block not found in index.html:\n            <div class=\"hero__actions\">..."]
```

**Root Cause**: 
- Exact string matching was too strict
- Whitespace differences caused failures
- AI-generated search blocks had slight formatting differences

**Solution**: Implemented fuzzy matching algorithm

## New Matching Algorithm

### 1. Normalization Function
```typescript
function normalizeForComparison(text: string): string {
  return text
    .replace(/\s+/g, ' ')      // Multiple spaces → single space
    .replace(/>\s+</g, '><')   // Remove spaces between tags
    .trim();
}
```

### 2. Best Match Finder
```typescript
function findBestMatch(content: string, searchText: string) {
  // 1. Try exact match first (fastest)
  if (content.includes(searchText)) return match;
  
  // 2. Try normalized match (flexible)
  // Compare normalized versions of text
  // Find matching sequence of lines
  // Return character positions
}
```

### 3. Matching Strategy

**Step 1: Exact Match**
- Try to find search text exactly as-is
- Fastest, most reliable when it works

**Step 2: Normalized Match**
- Normalize both search text and content
- Remove extra whitespace
- Remove spaces between HTML tags
- Compare normalized versions

**Step 3: Line-by-Line Search**
- Split content into lines
- Try different line ranges
- Find sequence that matches normalized search
- Calculate exact character positions

## Benefits

### Before
```
❌ Exact match only
❌ Fails on whitespace differences
❌ Fails on indentation changes
❌ No helpful error messages
```

### After
```
✅ Exact match (fast path)
✅ Fuzzy match (flexible)
✅ Handles whitespace differences
✅ Handles indentation changes
✅ Better error messages with preview
✅ Console logging for debugging
```

## Example Scenarios

### Scenario 1: Extra Whitespace

**Search Block (AI generated)**:
```html
<div class="hero__actions">
  <button class="btn">Click</button>
</div>
```

**Actual Code**:
```html
<div class="hero__actions">
    <button class="btn">Click</button>
</div>
```

**Result**: ✅ Matches (normalized comparison ignores extra spaces)

### Scenario 2: Different Indentation

**Search Block**:
```html
<div>
  <p>Text</p>
</div>
```

**Actual Code**:
```html
<div>
    <p>Text</p>
</div>
```

**Result**: ✅ Matches (normalization handles indentation)

### Scenario 3: Spaces Between Tags

**Search Block**:
```html
<div> <span>Text</span> </div>
```

**Actual Code**:
```html
<div><span>Text</span></div>
```

**Result**: ✅ Matches (removes spaces between tags)

## Error Handling

### Better Error Messages

**Before**:
```
Search block not found in index.html
```

**After**:
```
✗ Failed to find search block in index.html:
            <div class=\"hero__actions\">\n              <button class=\"btn btn-primary\" id=\"connectBtn...
```

### Console Logging

**Success**:
```
✓ Applied SEARCH/REPLACE in index.html
```

**Failure**:
```
✗ Failed to find search block in index.html: <div class="hero__actions">\n...
```

## Performance

- **Exact match**: O(n) - very fast
- **Normalized match**: O(n²) - slower but still acceptable
- **Fallback**: Only used when exact match fails
- **Early exit**: Returns as soon as match is found

## Testing

The improved matching handles:
- ✅ Extra whitespace
- ✅ Different indentation (tabs vs spaces)
- ✅ Spaces between HTML tags
- ✅ Trailing/leading whitespace
- ✅ Mixed line endings (CRLF vs LF)

## Configuration Changes

### ai-config.ts
```typescript
// Before
export const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.7,
  maxTokens: 4000,
  topP: 0.9,
};

// After
export const DEFAULT_GENERATION_CONFIG = {
  maxTokens: 4000,
};
```

### generate/route.ts
```typescript
// Before
const result = await streamText({
  model,
  messages,
  temperature: DEFAULT_GENERATION_CONFIG.temperature,
  maxTokens: DEFAULT_GENERATION_CONFIG.maxTokens,
  topP: DEFAULT_GENERATION_CONFIG.topP,
});

// After
const result = await streamText({
  model,
  messages,
  maxTokens: DEFAULT_GENERATION_CONFIG.maxTokens,
});
```

## Summary

✅ **Fixed temperature warnings** - Removed unsupported settings
✅ **Improved SEARCH/REPLACE matching** - Fuzzy matching with normalization
✅ **Better error messages** - Show preview of failed search blocks
✅ **Console logging** - Track success/failure of replacements
✅ **More reliable** - Handles whitespace and formatting differences

The system is now much more robust and should successfully apply SEARCH/REPLACE blocks even when there are minor formatting differences between the AI's search block and the actual code!
