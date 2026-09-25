$html = [System.IO.File]::ReadAllText("d:\FitForge\body-scan.html", [System.Text.Encoding]::UTF8)
$newBlock = [System.IO.File]::ReadAllText("d:\FitForge\nutrition_block.html", [System.Text.Encoding]::UTF8)

# Find start of the AI NUTRITION RECOMMENDATION SECTION
$startMarker = "<!-- NEW: AI NUTRITION RECOMMENDATION SECTION -->"
$endMarker = "<!-- STEP 5: PROGRESS TRACKING & SCAN HISTORY -->"

$startIndex = $html.IndexOf($startMarker)
# We want to replace from $startIndex to before the </section> preceding $endMarker.
# So we just find the $endMarker index.
$endIndex = $html.IndexOf($endMarker, $startIndex)

if ($startIndex -ge 0 -and $endIndex -gt $startIndex) {
    $prefix = $html.Substring(0, $startIndex)
    $suffix = $html.Substring($endIndex)
    
    $finalHtml = $prefix + $newBlock + "`r`n`r`n            " + $suffix
    [System.IO.File]::WriteAllText("d:\FitForge\body-scan.html", $finalHtml, [System.Text.Encoding]::UTF8)
    Write-Output "Section replaced successfully!"
} else {
    Write-Output "Markers not found. Check original file."
    Write-Output "Start index: $startIndex, End index: $endIndex"
}
