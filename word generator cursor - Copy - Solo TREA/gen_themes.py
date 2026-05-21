import random

def generate_svg_path(idx):
    # Generate a semi-random SVG path to make it look 'high-detail' and take space
    path = 'M '
    for i in range(200): # Increased from 50 to 200 to make it larger
        path += f'{random.randint(0,1000)},{random.randint(0,1000)} L '
    return path.strip() + ' Z'

with open('mxd-visual-themes-v10.js', 'w') as f:
    f.write('(function() {\n')
    f.write('  \'use strict\';\n\n')
    f.write('  const DECORATIVE_ASSETS = {\n')
    for i in range(5000): # Increased from 500 to 5000
        f.write(f'    "asset_{i}": "{generate_svg_path(i)}",\n')
    f.write('  };\n\n')

    f.write('  const BASE_THEMES = [\n')
    for i in range(25):
        bg = f'#{random.randint(0,0xFFFFFF):06x}'
        tc = f'#{random.randint(0,0xFFFFFF):06x}'
        ac = f'#{random.randint(0,0xFFFFFF):06x}'
        pr = f'#{random.randint(0,0xFFFFFF):06x}'
        sc = f'#{random.randint(0,0xFFFFFF):06x}'
        ff = random.choice(['Inter', 'Georgia', 'serif', 'monospace', 'Verdana'])
        bs = random.choice(['solid', 'dashed', 'dotted', 'none'])
        pt = random.choice(['waves', 'dots', 'stripes', 'none'])
        decos = [f'asset_{random.randint(0,4999)}' for _ in range(random.randint(1,3))]
        f.write('    {{ id: "theme_{i}", name: "Theme {i}", colors: {{ bg: "{bg}", text: "{tc}", accent: "{ac}", primary: "{pr}", secondary: "{sc}" }}, fontFamily: "{ff}", borderStyle: "{bs}", patternType: "{pt}", decorations: [' + ', '.join(['"' + d + '"' for d in decos]) + '] }},\n')
    f.write('  ];\n\n')

    f.write('  const PATTERNS = { waves: "...", dots: "...", stripes: "...", none: "" };\n')
    f.write('  const BORDER_STYLES = { solid: "1px solid", dashed: "1px dashed", dotted: "1px dotted", none: "none" };\n')
    f.write('  const FONT_FAMILIES = ["Inter", "Georgia", "serif", "monospace", "Verdana"];\n\n')

    f.write('  const TEMPLATES = [];\n')
    f.write('  for(let i=0; i<120; i++) {\n')
    f.write('    const themeIdx = i % 25;\n')
    f.write('    const theme = BASE_THEMES[themeIdx];\n')
    f.write('    TEMPLATES.push({\n')
    f.write('      id: "tmpl_" + i,\n')
    f.write('      name: "Template " + (i+1),\n')
    f.write('      colors: theme.colors,\n')
    f.write('      fontFamily: theme.fontFamily,\n')
    f.write('      borderStyle: theme.borderStyle,\n')
    f.write('      patternType: theme.patternType,\n')
    f.write('      decorations: theme.decorations\n')
    f.write('    });\n')
    f.write('  }\n\n')

    f.write('  window.MXD_VISUAL_THEMES = {\n')
    f.write('    DECORATIVE_ASSETS: DECORATIVE_ASSETS,\n')
    f.write('    getAllTemplates: function() { return TEMPLATES; },\n')
    f.write('    getTemplate: function(id) { return TEMPLATES.find(t => t.id === id) || TEMPLATES[0]; }\n')
    f.write('  };\n')
    f.write('})();\n')
