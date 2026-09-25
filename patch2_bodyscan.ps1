
$file = "d:\FitForge\body-scan.html"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# Check if HTML nutri-protein div is gone (it had emerald color and Protein Target label)
$htmlProtein = $content.IndexOf('nutri-protein" class="font-headline')
"HTML nutri-protein div check: $htmlProtein" | Out-File "d:\FitForge\debug2.txt" -Encoding UTF8

# Remove the JS line: document.getElementById('nutri-protein').innerText = prot + ' g';
$content = $content -replace "document\.getElementById\('nutri-protein'\)\.innerText = [^;]+;`r?`n", ""

# Remove JS line: document.getElementById('nutri-strategy-title').innerText = strategyTitle;
$content = $content -replace "document\.getElementById\('nutri-strategy-title'\)\.innerText = [^;]+;`r?`n", ""

# Remove JS line: document.getElementById('nutri-strategy-desc').innerText = strategyDesc;
$content = $content -replace "document\.getElementById\('nutri-strategy-desc'\)\.innerText = [^;]+;`r?`n", ""

# Remove JS lines for meals
$content = $content -replace "document\.getElementById\('meal-breakfast'\)\.innerText = [^;]+;`r?`n", ""
$content = $content -replace "document\.getElementById\('meal-lunch'\)\.innerText = [^;]+;`r?`n", ""
$content = $content -replace "document\.getElementById\('meal-snack'\)\.innerText = [^;]+;`r?`n", ""
$content = $content -replace "document\.getElementById\('meal-dinner'\)\.innerText = [^;]+;`r?`n", ""

# Verify state
$checks = @("nutri-protein", "meal-breakfast", "nutri-strategy-title", "nutri-strategy-desc", "meal-lunch")
foreach ($c in $checks) {
    $idx = $content.IndexOf($c)
    "$c => $(if ($idx -ge 0) { "FOUND at $idx" } else { 'NOT FOUND' })" | Out-File "d:\FitForge\debug2.txt" -Encoding UTF8 -Append
}

# Save
[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
"File saved. New length: $($content.Length)" | Out-File "d:\FitForge\debug2.txt" -Encoding UTF8 -Append
