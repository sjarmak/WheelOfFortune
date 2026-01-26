# iOS Standard Mode Spin Crash - Session Notes

## Status
**BLOCKER**: App crashes when wheel lands on a wedge and tries to display spin result.

## What Works
- ✅ App starts and loads Standard Mode correctly
- ✅ Wheel renders with 24 wedges, correct colors
- ✅ Spin animation plays smoothly (4 second rotation with easing)
- ✅ Text labels now show full words (BANKRUPT, LOSE A TURN, FREE PLAY, $amounts)
- ✅ Game reducer logic fully tested (17 unit tests all passing)
- ✅ All types fixed (CASH → VALUE wedge type)

## What's Broken
**CRASH POINT**: When spin completes and wheel lands on a wedge, app crashes immediately.

### Timeline of Crash
1. User clicks SPIN button
2. Wheel rotates for 4 seconds
3. Animation completes
4. `onSpinComplete(wedge)` callback fires in StandardWheel.tsx
5. Handler calls `handleSpinComplete(wedge)` in StandardModeApp.tsx (line 127)
6. This dispatches `SPIN_RESULT` action to gameReducer
7. **APP CRASHES** (no error message visible, just immediate crash)

### Attempted Fixes (All Failed)
1. **textPath approach**: Used SVG `<TextPath>` with `href` to render text along a path
   - Failed: Likely serialization issue with href prop in react-native-svg
   
2. **rotation prop**: Used `rotation` and `origin` props on SvgText
   - Failed: React-native-svg doesn't support these props
   
3. **transform prop**: Changed to `transform={`rotate(...)`}`
   - **Current state**: Still crashes even with transform

## Root Cause (Hypothesis)
The crash happens **after** the wheel animation completes, not during rendering. Most likely:
- Memory leak or unhandled exception in the spin completion callback
- The wedge object being passed may have a property that causes serialization error
- The game reducer may be failing silently when processing SPIN_RESULT

## Files Involved
- `ios/src/components/StandardWheel.tsx` - Wheel animation, spin completion callback
- `ios/src/components/StandardModeApp.tsx` - Handlers for spin results (line 127)
- `ios/src/engine/game.ts` - SPIN_RESULT reducer case (line 76-99)
- `ios/src/engine/types.ts` - WheelWedge type definition (line 52-58)

## Next Agent: Debug Steps

### 1. Check the actual error
```bash
# Kill and restart with full console output
pkill -9 -f "expo"
cd ios && npx expo run:ios 2>&1 | tee build.log

# Look for the JS error stack trace when it crashes
# Check Xcode console directly (Product > Scheme > Edit Scheme > Run > Console)
```

### 2. Add error boundary
Wrap the wheel component in a try-catch in StandardModeApp.tsx to see the actual error:
```tsx
try {
  dispatch({ type: 'SPIN_RESULT', wedge });
} catch (err) {
  console.error('SPIN_RESULT dispatch failed:', err);
}
```

### 3. Test the reducer in isolation
Run the unit tests and add a specific test for SPIN_RESULT with VALUE wedges:
```bash
cd ios && npm test -- src/engine/game.test.ts
```

### 4. Simplify the wheel
Try removing the transform on text completely:
```tsx
// Remove transform temporarily, just render text at center
<SvgText x="100" y="100" fontSize="6" ... >
  {wedge.label}
</SvgText>
```

### 5. Check wedge serialization
The wedge object being passed might have circular references or non-serializable props. Log it:
```tsx
const handleSpinComplete = useCallback((wedge: WheelWedge) => {
  console.log('Spin result wedge:', JSON.stringify(wedge));
  dispatch({ type: 'SPIN_RESULT', wedge });
}, []);
```

## Workaround (For Testing)
To continue development without the crash, you could:
1. Comment out the dispatch in handleSpinComplete to see if that's the issue
2. Or add a 1-2 second delay before dispatching to see if async is the problem

## Notes for Next Session
- Do NOT try to make the text perfect yet (rotation, positioning, alignment)
- Focus ONLY on fixing the crash
- Once spin result works without crashing, then improve text rendering
- The web UI uses textPath which works fine in HTML/SVG but react-native-svg may not support it properly

## Commit History
- Latest: "Fix: Text paths on wheel, fix wedge type mismatch (CASH -> VALUE), update app name"
- All changes are committed, build works, just crashes at runtime on spin complete
