
$file = "d:\FitForge\body-scan.html"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# 1. Change 4-col grid to 3-col in the nutrition macro section
$content = $content -replace '(<!--\s*Macro Target Bento Dashboard Grid\s*-->[\s\S]*?)(grid-cols-1 md:grid-cols-4 gap-4)', '$1grid-cols-1 md:grid-cols-3 gap-4'

# 2. Remove the Protein Target card div (between the calorie card and carbs card)
#    It contains id="nutri-protein" and "Protein Target" 
$proteinPattern = '(?s)<div class="bg-white/5 border border-white/5 p-5 rounded-2xl text-center space-y-1">\s*<span[^>]*class="[^"]*emerald-400[^"]*"[^>]*>Protein[\s\S]*?Target</span>\s*<span id="nutri-protein"[\s\S]*?</div>\s*</div>'
$removed = [regex]::Replace($content, $proteinPattern, '')
if ($removed.Length -lt $content.Length) {
    $content = $removed
    Write-Output "Protein card removed"
} else {
    Write-Output "WARNING: Protein card pattern not matched"
}

# 3. Remove Goal Strategy banner, Meal Suggestions, Hydration/Workout, Safety Notice
#    These all come AFTER the closing </div> of the grid and before the </div> closing the glass-card space-y-8
#    Find the landmark: after the 3-col grid closing div (</div>) and before the outer section close (</div>)

# Remove Goal Strategy Banner
$goalPattern = '(?s)<!--\s*Goal-Based Strategy Banner\s*-->[\s\S]*?</div>\s*</div>'
$removed2 = [regex]::Replace($content, $goalPattern, '', [System.Text.RegularExpressions.RegexOptions]::Singleline)
if ($removed2.Length -lt $content.Length) {
    $content = $removed2
    Write-Output "Goal Strategy banner removed"
} else {
    Write-Output "WARNING: Goal Strategy banner not matched"
}

# Remove Personalized Meal Suggestions
$mealPattern = '(?s)<!--\s*Personalized Meal Suggestions Breakdown\s*-->[\s\S]*?</div>\s*</div>'
$removed3 = [regex]::Replace($content, $mealPattern, '', [System.Text.RegularExpressions.RegexOptions]::Singleline)
if ($removed3.Length -lt $content.Length) {
    $content = $removed3
    Write-Output "Meal Suggestions removed"
} else {
    Write-Output "WARNING: Meal Suggestions not matched"
}

# Remove Hydration block
$hydrationPattern = '(?s)<!--\s*Hydration,\s*Pre\s*[&amp;]*\s*Post Workout Fuel\s*-->[\s\S]*?</div>\s*</div>'
$removed4 = [regex]::Replace($content, $hydrationPattern, '', [System.Text.RegularExpressions.RegexOptions]::Singleline)
if ($removed4.Length -lt $content.Length) {
    $content = $removed4
    Write-Output "Hydration section removed"
} else {
    Write-Output "WARNING: Hydration section not matched"
}

# Remove Safety Notice
$safetyPattern = '(?s)<!--\s*Important Safety Notice Card\s*-->[\s\S]*?</div>\s*</div>'
$removed5 = [regex]::Replace($content, $safetyPattern, '', [System.Text.RegularExpressions.RegexOptions]::Singleline)
if ($removed5.Length -lt $content.Length) {
    $content = $removed5
    Write-Output "Safety Notice removed"
} else {
    Write-Output "WARNING: Safety Notice not matched"
}

# Save
[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Output "File saved. New length: $($content.Length)"
