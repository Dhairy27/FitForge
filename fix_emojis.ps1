
$file = "d:\FitForge\body-scan.html"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# Since PowerShell encoding messed up the emojis, they are now garbled characters in the file.
# We will use Regex to replace the entire `const foodData = { ... };` block.
$pattern = '(?s)const foodData = \{.*?\};'
$replacement = @"
const foodData = {
        'nonveg': [
            'Eggs (Missing Choline)', 'Greek yogurt', 'Chicken Breast (Needed Protein)', 
            'Salmon (Omega-3s)', 'Dal & legumes', 'Green vegetables', 'Fruits'
        ],
        'veg': [
            'Greek yogurt (Needed Protein)', 'Paneer', 'Spinach (Missing Iron)', 
            'Dal & legumes', 'Green vegetables', 'Fruits', 'Quinoa'
        ],
        'vegan': [
            'Tofu (Needed Protein)', 'Tempeh', 'Lentils', 
            'Chia Seeds (Omega-3s)', 'Green vegetables', 'Fruits', 'Quinoa'
        ]
    };
"@

$content = [regex]::Replace($content, $pattern, $replacement)
[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Output "Successfully stripped garbled emojis and replaced with English-only text."
