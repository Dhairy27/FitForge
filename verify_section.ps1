
$file = "d:\FitForge\body-scan.html"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# Extract just the AI Nutrition Recommendation section
$start = $content.IndexOf("AI NUTRITION RECOMMENDATION")
$end = $content.IndexOf("STEP 5:", $start)
if ($start -ge 0 -and $end -ge 0) {
    $section = $content.Substring($start, $end - $start)
    $section | Out-File "d:\FitForge\nutrition_section_verify.txt" -Encoding UTF8
} else {
    "Could not find section markers. Searching alternative..." | Out-File "d:\FitForge\nutrition_section_verify.txt" -Encoding UTF8
    $idx = $content.IndexOf("AI Nutrition Recommendation")
    $content.Substring([Math]::Max(0, $idx - 50), 3000) | Out-File "d:\FitForge\nutrition_section_verify.txt" -Encoding UTF8 -Append
}
