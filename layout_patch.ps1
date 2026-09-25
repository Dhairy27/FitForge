
$file = "d:\FitForge\body-scan.html"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# Locate the Detailed Posture Analysis div
$pattern1 = 'col-span-12 lg:col-span-7( glass-card[^>]*>\s*<h3[^>]*>Detailed Posture Analysis</h3>)'
$content = [regex]::Replace($content, $pattern1, 'col-span-12 lg:col-span-6$1', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

# Locate the Recommended Focus div
$pattern2 = 'col-span-12 lg:col-span-5( glass-card[^>]*>\s*<h3[^>]*>Recommended Focus</h3>)'
$content = [regex]::Replace($content, $pattern2, 'col-span-12 lg:col-span-6$1', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Output "Layout updated. Target classes altered to lg:col-span-6."
