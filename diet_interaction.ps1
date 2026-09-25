
# Add a task to task.md
$taskFile = "C:\Users\DELL\.gemini\antigravity\brain\4ca67331-953a-46c2-a77f-a1a6435da081\task.md"
$taskContent = [System.IO.File]::ReadAllText($taskFile)
$taskContent += "`n- [x] Make Diet tabs interactive and dynamically update Recommended Foods based on preference."
[System.IO.File]::WriteAllText($taskFile, $taskContent)

$file = "d:\FitForge\body-scan.html"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# 1. Add id="ai-recommended-foods" to the container
$foodContainerTarget = '<div class="flex flex-wrap gap-2 text-xs font-semibold">'
$foodContainerReplace = '<div id="ai-recommended-foods" class="flex flex-wrap gap-2 text-xs font-semibold">'
$content = $content.Replace($foodContainerTarget, $foodContainerReplace)

# 2. Add JavaScript logic to handle the clicking and dynamic foods.
# We will inject it right before the closing </body> tag.
$scriptToInject = @"
<script>
document.addEventListener('DOMContentLoaded', () => {
    const tabs = {
        'nonveg': document.getElementById('diet-tab-nonveg'),
        'veg': document.getElementById('diet-tab-veg'),
        'vegan': document.getElementById('diet-tab-vegan')
    };
    const foodsContainer = document.getElementById('ai-recommended-foods');

    const foodData = {
        'nonveg': [
            '🥚 Eggs (Missing Choline)', '🥛 Greek yogurt', '🍗 Chicken Breast (Needed Protein)', 
            '🐟 Salmon (Omega-3s)', '🫘 Dal & legumes', '🥦 Green vegetables', '🍌 Fruits'
        ],
        'veg': [
            '🥛 Greek yogurt (Needed Protein)', '🧀 Paneer', '🥬 Spinach (Missing Iron)', 
            '🫘 Dal & legumes', '🥦 Green vegetables', '🍌 Fruits', '🌾 Quinoa'
        ],
        'vegan': [
            '🥬 Tofu (Needed Protein)', '🥜 Tempeh', '🌱 Lentils', 
            '🌻 Chia Seeds (Omega-3s)', '🥦 Green vegetables', '🍌 Fruits', '🌾 Quinoa'
        ]
    };

    function setActiveTab(selected) {
        // Reset all tabs
        Object.values(tabs).forEach(tab => {
            if (tab) {
                tab.className = 'px-4 py-1.5 rounded-full text-xs font-bold text-secondary hover:text-white transition-all cursor-pointer';
            }
        });
        
        // Set selected tab
        if (tabs[selected]) {
            tabs[selected].className = 'px-4 py-1.5 rounded-full text-xs font-bold bg-primary text-on-primary transition-all cursor-pointer';
        }

        // Update foods
        if (foodsContainer) {
            foodsContainer.innerHTML = '';
            foodData[selected].forEach(food => {
                const sp = document.createElement('span');
                sp.className = 'px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-white';
                sp.innerText = food;
                foodsContainer.appendChild(sp);
            });
        }
    }

    // Attach listeners
    if (tabs['nonveg']) tabs['nonveg'].addEventListener('click', () => setActiveTab('nonveg'));
    if (tabs['veg']) tabs['veg'].addEventListener('click', () => setActiveTab('veg'));
    if (tabs['vegan']) tabs['vegan'].addEventListener('click', () => setActiveTab('vegan'));
});
</script>
</body>
"@

$content = $content.Replace('</body>', $scriptToInject)
[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)

Write-Output "Successfully updated diet tabs click logic and dynamic food list."
