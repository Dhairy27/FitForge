
$file = "d:\FitForge\body-scan.html"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# The block to move starts with "<!-- 4. Body Composition Insight -->"
# and ends before "<!-- 5. AI-Recommended Foods -->"

$startPattern = "<!-- 4. Body Composition Insight -->"
$endPattern = "<!-- 5. AI-Recommended Foods -->"
$insertPattern = "<!-- 7. AI Recommendation Message -->"

$startIdx = $content.IndexOf($startPattern)
$endIdx = $content.IndexOf($endPattern)

if ($startIdx -ge 0 -and $endIdx -gt $startIdx) {
    # Extract the block
    $blockToMove = $content.Substring($startIdx, $endIdx - $startIdx)
    
    # Remove the block from its current location
    $content = $content.Remove($startIdx, $endIdx - $startIdx)
    
    # Find the new insertion point (which might have shifted because we removed text)
    $insertIdx = $content.IndexOf($insertPattern)
    
    if ($insertIdx -ge 0) {
        # Insert the block right before the AI Recommendation Message
        $content = $content.Insert($insertIdx, $blockToMove)
        [System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
        Write-Output "Successfully moved Body Composition Insight before AI Recommendation."
    } else {
        Write-Output "Could not find insertion point."
    }
} else {
    Write-Output "Could not find the block to move."
}
