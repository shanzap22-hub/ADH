// Helper function to add reply click-to-scroll functionality
// Add this to ChatWindow.tsx

// Add this function inside the ChatWindow component:
const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight briefly
        element.classList.add('ring-2', 'ring-purple-500', 'transition-all');
        setTimeout(() => {
            element.classList.remove('ring-2', 'ring-purple-500');
        }, 2000);
    }
};

// Then in the JSX where you render messages, add:
// 1. Add id to each message container:
//    <div key={msg.id} id={`msg-${msg.id}`} className={...}>

// 2. Add onClick to reply context div:
//    {msg.reply_to && (
//        <div 
//            onClick={() => scrollToMessage(msg.reply_to.id)}
//            className="...cursor-pointer hover:opacity-100..."
//        >
//            ...reply content...
//        </div>
//    )}
