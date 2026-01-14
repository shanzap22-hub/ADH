# Reply Click-to-Scroll Feature - Implementation Guide

## Problem
Reply mention click ചെയ്താൽ original message-ലേക്ക് scroll ചെയ്യണം (WhatsApp പോലെ)

## Solution - Manual Edit Required

ChatWindow.tsx file വളരെ വലുതായതുകൊണ്ട്, നിങ്ങൾ manually ഈ changes ചെയ്യണം:

### Step 1: Add scrollToMessage Function
Line 39-ന് ശേഷം add ചെയ്യുക:

```tsx
const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-purple-500', 'transition-all');
        setTimeout(() => element.classList.remove('ring-2', 'ring-purple-500'), 2000);
    }
};
```

### Step 2: Add ID to Message Container
Messages render ചെയ്യുന്ന div-ൽ (approx line 285):

**Before:**
```tsx
<div key={msg.id} className={cn("flex max-w-[80%] mb-2", ...)}>
```

**After:**
```tsx
<div key={msg.id} id={`msg-${msg.id}`} className={cn("flex max-w-[80%] mb-2", ...)}>
```

### Step 3: Add onClick to Reply Context
Reply context render ചെയ്യുന്ന div-ൽ (approx line 308-320):

**Before:**
```tsx
{msg.reply_to && (
    <div className={cn("mb-2 p-2 rounded text-xs border-l-2 cursor-pointer opacity-90", ...)}>
```

**After:**
```tsx
{msg.reply_to && (
    <div 
        onClick={() => scrollToMessage(msg.reply_to.id)}
        className={cn("mb-2 p-2 rounded text-xs border-l-2 cursor-pointer opacity-90 hover:opacity-100 transition-opacity", ...)}
    >
```

### Step 4: Deploy
```bash
git add .
git commit -m "feat: Add reply click-to-scroll functionality"
npx vercel --prod --yes
```

## Alternative: Quick Fix using Browser Console
നിങ്ങൾക്ക് browser console-ൽ ഇത് test ചെയ്യാം:

```javascript
document.querySelectorAll('[class*="reply"]').forEach(div => {
    div.onclick = function() {
        const replyText = this.textContent;
        // Find and scroll to original message
        console.log('Clicked reply:', replyText);
    };
});
```

## Files Modified
- `src/components/chat/ChatWindow.tsx` (3 changes needed)

## Expected Behavior
1. User clicks on reply context (purple/gray box)
2. Chat scrolls smoothly to original message
3. Original message highlights with purple ring for 2 seconds
4. Ring fades away
