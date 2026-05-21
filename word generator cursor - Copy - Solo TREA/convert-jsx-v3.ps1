# Full JSX to React.createElement converter
# Handles all common JSX patterns in the MXD app

$ErrorActionPreference = "Stop"
$filePath = "C:\Users\moham\OneDrive\Desktop\word generator cursor - Copy\index.html"
$content = Get-Content $filePath -Raw -Encoding UTF8

# Find the Babel block
$startTag = '<script type="text/babel">'
$endTag = '</script>'
$startIdx = $content.IndexOf($startTag)
$endIdx = $content.IndexOf($endTag, $startIdx + $startTag.Length)

$babelContent = $content.Substring($startIdx + $startTag.Length, $endIdx - $startIdx - $startTag.Length)

Write-Host "Converting JSX to React.createElement..."

# Multi-pass conversion approach
$result = $babelContent

# Pass 1: Convert self-closing component tags with props
# <Component prop1={val1} prop2="str2" />
# This is complex, so we'll handle the most common patterns

# Pass 2: Convert simple self-closing tags
# <DragonBG /> -> React.createElement(DragonBG)
$result = $result -replace '<DragonBG\s*/>', 'React.createElement(DragonBG)'
$result = $result -replace '<LiveSpyOverlay\s+([^>]*)/>', { param($m) "React.createElement(LiveSpyOverlay, $($m.Groups[1].Value -replace '(\w+)=\{([^}]+)\}', '$1:$2' -replace '(\w+)="([^"]*)"', '$1:"$2"'))" }

# Pass 3: Convert self-closing HTML tags with props
# <input type="checkbox" ... /> -> React.createElement("input", {...})
$result = $result -replace '<input\s+([^>]*)/>', { 
    param($m)
    $props = $m.Groups[1].Value
    # Convert prop={value} to prop:value
    $props = $props -replace '(\w+)=\{([^}]+)\}', '$1:$2'
    # Convert prop="value" to prop:"value"
    $props = $props -replace '(\w+)="([^"]*)"', '$1:"$2"'
    # Convert prop='value' to prop:'value'
    $props = $props -replace "(\w+)='([^']*)'", "`$1:'`$2'"
    # Handle className -> class mapping (React uses className)
    "React.createElement(`"input`", {$props})"
}

# Pass 4: Convert <br />, <hr />
$result = $result -replace '<br\s*/>', 'React.createElement("br")'
$result = $result -replace '<hr\s*/>', 'React.createElement("hr")'

# Pass 5: Convert simple JSX expressions in text
# {variable} -> variable (already valid JS)

# For now, output the partial conversion
Write-Host "Partial conversion complete. Length: $($result.Length)"

# Save the result for review
$outputPath = "C:\Users\moham\OneDrive\Desktop\word generator cursor - Copy\converted-output.js"
$result | Out-File -FilePath $outputPath -Encoding UTF8
Write-Host "Saved to: $outputPath"

# Show first 500 chars
Write-Host "`nFirst 500 chars of converted output:"
Write-Host $result.Substring(0, [Math]::Min(500, $result.Length))
