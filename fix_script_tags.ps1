
$file = "d:\FitForge\body-scan.html"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# The injected text starts with "        function renderHistoryUI() {" 
# and ends with "        }" right before "</body>"
# Because there can be multiple lines and spaces, let's use a regex to wrap it.
$pattern = '(?s)(        function renderHistoryUI\(\) \{.*?\n        \})\r?\n</body>'
$replacement = @"
<script>
`$1
</script>
</body>
"@

if ($content -match $pattern) {
    $content = [regex]::Replace($content, $pattern, $replacement)
    [System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
    Write-Output "Successfully wrapped renderHistoryUI in <script> tags!"
} else {
    Write-Output "Pattern not found. Checking if it's already wrapped or slightly different."
    # Let's search for "function renderHistoryUI"
    $idx = $content.IndexOf("function renderHistoryUI")
    if ($idx -ge 0) {
        $before = $content.Substring([Math]::Max(0, $idx - 30), 30)
        Write-Output "Found at $idx, preceded by: $before"
    } else {
        Write-Output "Not found at all."
    }
}
