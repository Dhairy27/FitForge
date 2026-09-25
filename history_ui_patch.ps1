
$file = "d:\FitForge\body-scan.html"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# 1. Replace the #step-history HTML contents entirely
$historyPattern = '(?s)(<section id="step-history" class="[^"]*hidden space-y-8">)[\s\S]*?(</section>\s*<!-- END OF DEMO)'
$newHistoryHtml = @"
    <div class="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
            <h2 class="font-headline text-2xl font-bold text-white">Scan History & Progress Tracking</h2>
            <p class="text-xs text-secondary">Review your previous scan records and biometric tracking.</p>
        </div>
        <button onclick="confirmClearHistory()" class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-full text-xs font-bold cursor-pointer transition-colors">Delete Scan History</button>
    </div>
    
    <div id="history-cards-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- History Cards will be injected here via JavaScript -->
    </div>
"@

# Replace the inner section. We are replacing up to the </section> itself, so we must add </section> back if we match it.
# Actually, the file structure might not have <!-- END OF DEMO right after. Let's just find </section> after <section id="step-history".

# safer manual index replacement for HTML
$historyStartIdx = $content.IndexOf('<section id="step-history"')
$historyEndIdx = $content.IndexOf("</section>", $historyStartIdx)

if ($historyStartIdx -ge 0 -and $historyEndIdx -gt 0) {
    # Keep the <section ...> tag and </section> tag
    $sectionOpenTagEnd = $content.IndexOf(">", $historyStartIdx)
    $content = $content.Substring(0, $sectionOpenTagEnd + 1) + 
               "`r`n" + $newHistoryHtml + "`r`n            " + 
               $content.Substring($historyEndIdx)
}

# 2. Add JavaScript function renderHistoryUI() and call it in saveScanToHistory()
$jsFunc = @"
        function renderHistoryUI() {
            const container = document.getElementById('history-cards-container');
            if (!container) return;
            
            let scans = [];
            try { scans = JSON.parse(localStorage.getItem('fitforge_scans') || '[]'); } catch (e) {}
            
            if (scans.length === 0) {
                container.innerHTML = `<div class="col-span-full glass-card p-10 text-center rounded-[2rem] border-glass-border">
                    <span class="material-symbols-outlined text-4xl text-secondary mb-2">history</span>
                    <h3 class="text-white font-bold text-lg">No Scan History</h3>
                    <p class="text-secondary text-xs mt-2">Take a body scan and save it to see your progress here.</p>
                </div>`;
                return;
            }
            
            container.innerHTML = '';
            scans.forEach((scan, index) => {
                const date = new Date(scan.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                
                const card = document.createElement('div');
                card.className = "glass-card p-6 rounded-2xl border-white/5 space-y-4 hover:border-white/20 transition-colors relative overflow-hidden group";
                
                card.innerHTML = `
                    <div class="flex justify-between items-start border-b border-white/5 pb-3">
                        <div>
                            <span class="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Scan Target: ${scan.goal || 'General Fitness'}</span>
                            <h3 class="text-sm font-bold text-white mt-0.5">${date}</h3>
                        </div>
                        <span class="bg-emerald-500/10 text-emerald-400 px-2 py-1 flex items-center gap-1 rounded-full text-[10px] font-bold border border-emerald-500/20">
                            <span class="material-symbols-outlined text-[12px]">vital_signs</span> Score: ${scan.fitnessScore || 80}
                        </span>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3 text-xs">
                        <div class="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                            <span class="block text-[10px] text-secondary font-semibold uppercase tracking-wider mb-1">Body Fat</span>
                            <span class="font-bold text-white text-lg">${scan.recommendations && scan.recommendations.estimatedBodyFat ? scan.recommendations.estimatedBodyFat : 'N/A'}</span>
                        </div>
                        <div class="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                            <span class="block text-[10px] text-secondary font-semibold uppercase tracking-wider mb-1">BMI</span>
                            <span class="font-bold text-white text-lg">${scan.bmi || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div class="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2 mt-2">
                         <span class="block text-[10px] text-secondary font-semibold uppercase tracking-wider">Key Metrics & Posture</span>
                         <div class="flex justify-between items-center text-xs">
                            <span class="text-white/60">Shoulders:</span>
                            <span class="font-semibold text-white">${scan.shoulderAlignment || 'Good'}</span>
                         </div>
                         <div class="flex justify-between items-center text-xs">
                            <span class="text-white/60">Chest/Waist/Hips:</span>
                            <span class="font-semibold text-white">${scan.measurements && scan.measurements.chest ? scan.measurements.chest.split(' ')[0] : '-'} / ${scan.measurements && scan.measurements.waist ? scan.measurements.waist.split(' ')[0] : '-'} / ${scan.measurements && scan.measurements.hips ? scan.measurements.hips.split(' ')[0] : '-'}</span>
                         </div>
                    </div>
                `;
                container.appendChild(card);
            });
        }
"@

# Inject JS before closing </body>
$content = $content.Replace("</body>", $jsFunc + "`r`n</body>")

# Find saveScanToHistory() and inject a call to renderHistoryUI() right before showStep('step-history')
$content = $content.Replace("showStep('step-history');", "renderHistoryUI();`r`n            showStep('step-history');")

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Output "Dynamic history UI script applied successfully!"
