
$file = "d:\FitForge\body-scan.html"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# Show context around nutri-protein occurrence at 63471
$idx1 = $content.IndexOf("nutri-protein")
"=== nutri-protein at $idx1 ===" | Out-File -FilePath "d:\FitForge\debug_context.txt" -Encoding UTF8
$content.Substring([Math]::Max(0, $idx1 - 300), 700) | Out-File -FilePath "d:\FitForge\debug_context.txt" -Encoding UTF8 -Append

# Show context around meal-breakfast
$idx2 = $content.IndexOf("meal-breakfast")
"`n=== meal-breakfast at $idx2 ===" | Out-File -FilePath "d:\FitForge\debug_context.txt" -Encoding UTF8 -Append
$content.Substring([Math]::Max(0, $idx2 - 100), 500) | Out-File -FilePath "d:\FitForge\debug_context.txt" -Encoding UTF8 -Append
