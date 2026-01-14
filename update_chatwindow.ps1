# PowerShell script to add reply click-to-scroll functionality

$filePath = "c:\Users\mrck2\Downloads\atcess\ATCESS DIGITAL HUB\ADH\LMS\ADH LMS\src\components\chat\ChatWindow.tsx"

# Read file
$content = Get-Content $filePath -Raw -Encoding UTF8

# Step 1: Add scrollToMessage function
$scrollFunction = @"

    const scrollToMessage = (messageId: string) => {
        const element = document.getElementById(``msg-`${messageId}``);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-purple-500', 'transition-all');
            setTimeout(() => element.classList.remove('ring-2', 'ring-purple-500'), 2000);
        }
    };
"@

# Find and replace scrollToBottom
$pattern1 = "    const scrollToBottom = \(\) => \{`r`n        messagesEndRef.current\?.scrollIntoView\(\{ behavior: `"smooth`" \}\);`r`n    \};"
$replacement1 = $pattern1 + $scrollFunction

$content = $content -replace [regex]::Escape($pattern1), $replacement1

# Step 2: Add id to message div (simpler approach - add after key)
$content = $content -replace '(<div\s+key=\{msg\.id\})', '$1 id={`msg-${msg.id}`}'

# Step 3: Add onClick to reply div
$content = $content -replace '(\{msg\.reply_to && \(\s+<div\s+)(className=\{cn\(\s+"mb-2 p-2 rounded text-xs border-l-2 cursor-pointer opacity-90")', '$1onClick={() => scrollToMessage(msg.reply_to.id)} $2 hover:opacity-100 transition-opacity"'

# Write back
$content | Out-File -FilePath $filePath -Encoding UTF8 -NoNewline

Write-Host "✅ ChatWindow.tsx updated successfully!" -ForegroundColor Green
Write-Host "Changes made:"
Write-Host "1. Added scrollToMessage function"
Write-Host "2. Added id attribute to message containers"
Write-Host "3. Added onClick handler to reply contexts"
