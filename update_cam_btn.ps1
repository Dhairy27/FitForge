
$file = "d:\FitForge\body-scan.html"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# Match block strictly using the text we found
$pattern = '(?s)<div[^>]*class="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">.*?Stand 6–8 feet away.*?Proceed to Camera Scan.*?</div>'
$replacement = @"
<div class="pt-4 border-t border-white/5 flex flex-col items-center gap-3">
    <button onclick="requestCameraAccessAndStart()"
        class="w-full px-8 py-3.5 bg-primary text-on-primary font-headline font-bold text-sm uppercase tracking-wider rounded-full hover:bg-white text-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
        <span class="material-symbols-outlined text-lg">videocam</span>
        Proceed to Camera Scan
    </button>
    <p class="text-[11px] text-secondary/60 text-center">
        Stand 6–8 feet away from the camera for full-body tracking.
    </p>
</div>
"@

$content = [regex]::Replace($content, $pattern, $replacement)
[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Output "Successfully updated Camera button layout."

