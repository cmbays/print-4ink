### Issue: Fix: Prevent cascading renders in DTF validation effect

#### Description:

At line 346 in `QuoteForm.tsx`, we are calling `setState` synchronously within a `useEffect` hook. This can lead to cascading renders and affect performance.

#### Current Code Snippet:

```javascript
useEffect(() => {
  setState(someValue) // This line is causing the issue
}, [dependencies])
```

#### Suggested Fixes:

1. **Use functional updates:**
   Instead of calling `setState` directly, use a functional update to avoid cascading renders:
   ```javascript
   setState((prevState) => ({ ...prevState, someValue }))
   ```
2. **Debounce the updates:**
   Implement a debounce mechanism to limit the frequency of updates to the state.
3. **Optimize dependencies:**
   Ensure that the dependencies array is accurately set to avoid unnecessary renders.

Addressing these points can significantly improve performance and prevent the cascading renders.

**Created on:** 2026-02-16 10:52:40 UTC
