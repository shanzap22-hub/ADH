import re

# Read the file
with open(r'c:\Users\mrck2\Downloads\atcess\ATCESS DIGITAL HUB\ADH\LMS\ADH LMS\src\components\chat\ChatWindow.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Step 1: Add scrollToMessage function after scrollToBottom
scroll_function = '''
    const scrollToMessage = (messageId: string) => {
        const element = document.getElementById(`msg-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-purple-500', 'transition-all');
            setTimeout(() => element.classList.remove('ring-2', 'ring-purple-500'), 2000);
        }
    };
'''

# Insert after scrollToBottom function
content = content.replace(
    '    const scrollToBottom = () => {\n        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });\n    };',
    '    const scrollToBottom = () => {\n        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });\n    };' + scroll_function
)

# Step 2: Add id to message container
# Find pattern: <div key={msg.id} className={cn("flex
# Replace with: <div key={msg.id} id={`msg-${msg.id}`} className={cn("flex

content = re.sub(
    r'(<div\s+key=\{msg\.id\}\s+className=\{cn\()',
    r'<div key={msg.id} id={`msg-${msg.id}`} className={cn(',
    content
)

# Step 3: Add onClick to reply context
# Find: {msg.reply_to && (\n                                    <div className={cn(
# Add onClick before className

content = re.sub(
    r'(\{msg\.reply_to && \(\s+<div\s+)(className=\{cn\(\s+"mb-2 p-2 rounded text-xs border-l-2 cursor-pointer)',
    r'\1onClick={() => scrollToMessage(msg.reply_to.id)}\n                                        \2 hover:opacity-100 transition-opacity',
    content
)

# Write the modified content
with open(r'c:\Users\mrck2\Downloads\atcess\ATCESS DIGITAL HUB\ADH\LMS\ADH LMS\src\components\chat\ChatWindow.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ ChatWindow.tsx updated successfully!")
print("Changes made:")
print("1. Added scrollToMessage function")
print("2. Added id attribute to message containers")
print("3. Added onClick handler to reply contexts")
