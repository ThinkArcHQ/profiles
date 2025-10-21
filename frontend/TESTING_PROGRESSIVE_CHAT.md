# Testing Progressive Chat UX

## Quick Start

1. **Start the development server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Navigate to the build page:**
   ```
   http://localhost:3000/build
   ```

3. **Test the progressive messaging:**

## Test Cases

### Test 1: Initial Profile Generation

**Input:**
```
Create a modern profile page with hero section, skills showcase, and contact form
```

**Expected Output (5 progressive messages):**

1. **🎯 Planning** (Blue accent)
   - Brief overview of what will be created
   - Lists main sections

2. **📐 Building Structure** (Purple accent)
   - "Creating semantic HTML..."
   - HTML code appears in preview panel

3. **🎨 Adding Styles** (Pink accent)
   - "Implementing responsive design..."
   - CSS code appears in preview panel

4. **⚡ Adding Interactivity** (Yellow accent)
   - "Implementing smooth scrolling..."
   - JavaScript code appears in preview panel

5. **✅ Completion** (Green accent)
   - Summary of what was created
   - Next steps

**Verify:**
- [ ] Messages appear progressively (not all at once)
- [ ] Each message has correct color accent
- [ ] Emojis display correctly
- [ ] Code appears in preview panel, not chat
- [ ] Messages are brief (1-3 sentences)

---

### Test 2: Simple Modification

**Input:**
```
Change the button color to blue
```

**Expected Output (3 progressive messages):**

1. **🔍 Analyzing** (Orange accent)
   - "I'll update the button color..."

2. **🔧 Updating** (Orange accent)
   - "Updating button styles..."
   - SEARCH/REPLACE blocks in preview

3. **✅ Updated** (Green accent)
   - "Button color changed to blue!"

**Verify:**
- [ ] Modification uses SEARCH/REPLACE format
- [ ] Messages are brief and clear
- [ ] Color coding works correctly
- [ ] Preview updates in real-time

---

### Test 3: Complex Request

**Input:**
```
Add a portfolio section with 3 project cards, each with an image, title, description, and link
```

**Expected Output (4-5 progressive messages):**

1. **🎯 Planning**
   - Overview of portfolio section

2. **📐 Building Structure**
   - HTML for portfolio section

3. **🎨 Adding Styles**
   - CSS for project cards

4. **⚡ Adding Interactivity** (if needed)
   - Hover effects, animations

5. **✅ Completion**
   - Summary

**Verify:**
- [ ] Complex requests still use progressive messaging
- [ ] Each step is clear and logical
- [ ] Code is properly organized

---

### Test 4: With Image Upload

**Input:**
1. Upload an image (design mockup or reference)
2. Type: "Create a profile page based on this design"

**Expected Output:**

1. **🎯 Planning**
   - "Analyzing your design..."
   - Lists elements from the image

2. **📐 Building Structure**
   - HTML matching the design

3. **🎨 Adding Styles**
   - CSS matching colors/layout from image

4. **✅ Completion**
   - Summary

**Verify:**
- [ ] AI acknowledges the uploaded image
- [ ] Design elements from image are incorporated
- [ ] Progressive messaging still works with files

---

### Test 5: Multiple Modifications

**Input (sequence):**
1. "Create a simple profile page"
2. "Add a skills section"
3. "Change the color scheme to orange"
4. "Add smooth scroll animations"

**Expected Behavior:**
- Each request should trigger 2-3 progressive messages
- Modifications should use SEARCH/REPLACE format
- Color coding should be consistent
- Chat history should be maintained

**Verify:**
- [ ] Each modification is handled separately
- [ ] Context is maintained across requests
- [ ] SEARCH/REPLACE works correctly
- [ ] No duplicate code generation

---

## Visual Verification Checklist

### Message Styling
- [ ] **Planning (🎯)**: Blue accent visible
- [ ] **Building (📐)**: Purple accent visible
- [ ] **Styling (🎨)**: Pink accent visible
- [ ] **Interactive (⚡)**: Yellow accent visible
- [ ] **Complete (✅)**: Green accent visible
- [ ] **Update (🔧)**: Orange accent visible

### Message Content
- [ ] No code blocks in chat messages
- [ ] Messages are 1-3 sentences max
- [ ] Emojis render correctly
- [ ] Text is readable and clear
- [ ] Timestamps show correctly

### Preview Panel
- [ ] Code appears in preview panel
- [ ] Files are properly organized
- [ ] Syntax highlighting works
- [ ] Real-time updates work
- [ ] File tabs are clickable

### Progress Indicators
- [ ] Spinner shows during generation
- [ ] Progress messages update
- [ ] File count displays correctly
- [ ] Emojis in progress messages

---

## Performance Testing

### Streaming
1. **Test slow network:**
   - Open DevTools → Network → Throttling → Slow 3G
   - Send a request
   - Verify messages still stream progressively

2. **Test fast network:**
   - Normal network speed
   - Verify messages don't appear too fast to read

### Error Handling
1. **Test API error:**
   - Stop the API server
   - Send a request
   - Verify error message displays correctly

2. **Test invalid input:**
   - Send empty message
   - Verify validation works

---

## Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

**Check:**
- Emoji rendering
- Color gradients
- Animations
- Responsive layout

---

## Accessibility Testing

1. **Keyboard Navigation:**
   - [ ] Can tab through messages
   - [ ] Can focus on input
   - [ ] Can submit with Enter

2. **Screen Reader:**
   - [ ] Messages are announced
   - [ ] Emojis have proper labels
   - [ ] Progress updates are announced

3. **Color Contrast:**
   - [ ] Text is readable on all backgrounds
   - [ ] Color coding doesn't rely solely on color
   - [ ] Emojis provide additional context

---

## Common Issues & Solutions

### Issue: Messages appear all at once
**Solution:** Check that streaming is working correctly in the API route

### Issue: Wrong color coding
**Solution:** Verify emoji detection in `getMessageType()` function

### Issue: Code appears in chat
**Solution:** Check `sanitizeMessageForDisplay()` function

### Issue: Emojis don't render
**Solution:** Ensure UTF-8 encoding is set correctly

### Issue: Messages too long
**Solution:** AI needs to follow the system prompt better - may need to adjust prompt

---

## Success Criteria

The progressive chat UX is working correctly when:

1. ✅ Messages appear step-by-step, not all at once
2. ✅ Each message type has correct color coding
3. ✅ Emojis display and provide visual clarity
4. ✅ Code stays in preview panel, not chat
5. ✅ Messages are brief and conversational
6. ✅ Progress is clear and understandable
7. ✅ User experience feels engaging and friendly
8. ✅ No overwhelming walls of text
9. ✅ Real-time updates work smoothly
10. ✅ Works across all browsers and devices

---

## Feedback Collection

After testing, gather feedback on:

1. **Clarity:** Are the progressive steps clear?
2. **Timing:** Do messages appear at the right pace?
3. **Visual Design:** Are colors and emojis helpful?
4. **Engagement:** Does it feel more engaging than before?
5. **Understanding:** Is it easier to understand what's happening?

---

## Next Steps After Testing

1. Collect user feedback
2. Adjust timing if needed
3. Fine-tune color schemes
4. Add more message types if needed
5. Consider adding progress bars
6. Implement step navigation
7. Add undo/redo functionality

---

## Notes

- The AI model needs to follow the system prompt correctly for progressive messaging to work
- If messages aren't progressive, check the system prompt in `profile-generator.ts`
- Streaming must be working for real-time updates
- Color detection is based on emojis and keywords
