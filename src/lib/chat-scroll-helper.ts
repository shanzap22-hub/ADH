// Add this script to enable reply click-to-scroll functionality
// This can be added to ChatWindow.tsx useEffect or as a separate script

export function enableReplyClickToScroll() {
    // Wait for DOM to be ready
    if (typeof window === 'undefined') return;

    // Add click handlers to all reply contexts
    const addClickHandlers = () => {
        const replyDivs = document.querySelectorAll('[data-reply-to-id]');

        replyDivs.forEach((div) => {
            const replyToId = div.getAttribute('data-reply-to-id');
            if (!replyToId) return;

            div.style.cursor = 'pointer';
            div.addEventListener('click', () => {
                const targetMsg = document.getElementById(`msg-${replyToId}`);
                if (targetMsg) {
                    targetMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Highlight
                    targetMsg.classList.add('ring-2', 'ring-purple-500', 'transition-all');
                    setTimeout(() => {
                        targetMsg.classList.remove('ring-2', 'ring-purple-500');
                    }, 2000);
                }
            });
        });
    };

    // Run on mount and when messages change
    addClickHandlers();

    // Observer for dynamic content
    const observer = new MutationObserver(addClickHandlers);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
}

// INSTRUCTIONS:
// 1. In ChatWindow.tsx, add this to useEffect:
//    useEffect(() => {
//        const cleanup = enableReplyClickToScroll();
//        return cleanup;
//    }, [messages]);
//
// 2. In the JSX where messages are rendered, add:
//    - To message container: id={`msg-${msg.id}`}
//    - To reply div: data-reply-to-id={msg.reply_to?.id}
