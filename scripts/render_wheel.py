import math
import base64
import subprocess
import os

center = 360
rOuter = 330
rInner = 115
rMid = 226

def polarToCartesian(centerX, centerY, radius, angleInDegrees):
    angleInRadians = (angleInDegrees * math.pi) / 180.0
    return centerX + radius * math.cos(angleInRadians), centerY + radius * math.sin(angleInRadians)

def describeDonutSegment(x, y, rInner, rOuter, startAngle, endAngle):
    outerStart = polarToCartesian(x, y, rOuter, startAngle)
    outerEnd = polarToCartesian(x, y, rOuter, endAngle)
    innerStart = polarToCartesian(x, y, rInner, startAngle)
    innerEnd = polarToCartesian(x, y, rInner, endAngle)
    largeArcFlag = '0' if (endAngle - startAngle <= 180) else '1'
    return f'M {outerStart[0]:.2f} {outerStart[1]:.2f} A {rOuter} {rOuter} 0 {largeArcFlag} 1 {outerEnd[0]:.2f} {outerEnd[1]:.2f} L {innerEnd[0]:.2f} {innerEnd[1]:.2f} A {rInner} {rInner} 0 {largeArcFlag} 0 {innerStart[0]:.2f} {innerStart[1]:.2f} Z'

with open('assets/images/app_logo_emblem.png', 'rb') as f:
    emblem_b64 = base64.b64encode(f.read()).decode('utf-8')

spokes = [
    {
        'id': 'mantra', 'number': '1', 'name': 'MANTRA', 'sanskrit': 'मन्त्र', 'direction': 'N',
        'mantra': 'ॐ ह्रीं श्रीं क्लीं चामुण्डायै विच्चे ॥', 'angle': -90,
        'startColor': '#5C111A', 'endColor': '#36060C', 'accentColor': '#FBD38D',
        'icon': '''<g transform="scale(1.35)">
          <ellipse cx="0" cy="1" rx="13" ry="9" fill="none" stroke="#F6AD55" stroke-width="1.8" stroke-dasharray="3.2 3.2" />
          <circle cx="0" cy="10" r="2" fill="#ECC94B" stroke="#742A2A" stroke-width="0.8" />
          <path d="M0,12 L-2,18 L2,18 Z" fill="#E53E3E" />
          <text x="0" y="4.5" font-size="11" font-weight="900" text-anchor="middle" fill="#FFFFFF" font-family="serif">ॐ</text>
        </g>'''
    },
    {
        'id': 'yantra', 'number': '2', 'name': 'YANTRA', 'sanskrit': 'यन्त्र', 'direction': 'NE',
        'mantra': 'ॐ श्रीं ह्रीं क्लीं नमः ॥', 'angle': -45,
        'startColor': '#6B3014', 'endColor': '#3D1706', 'accentColor': '#FEEBC8',
        'icon': '''<g transform="scale(1.35)">
          <rect x="-12" y="-12" width="24" height="24" rx="2" fill="none" stroke="#F6E05E" stroke-width="1.4" />
          <circle cx="0" cy="0" r="10" fill="none" stroke="#F6E05E" stroke-width="1" />
          <polygon points="0,-9 8,5 -8,5" fill="none" stroke="#ECC94B" stroke-width="1.2" />
          <polygon points="0,9 8,-5 -8,-5" fill="none" stroke="#ECC94B" stroke-width="1.2" />
          <circle cx="0" cy="0" r="2" fill="#F6AD55" />
        </g>'''
    },
    {
        'id': 'homa', 'number': '3', 'name': 'HOMA', 'sanskrit': 'होम', 'direction': 'E',
        'mantra': 'ॐ अग्नये स्वाहा ॥', 'angle': 0,
        'startColor': '#8C4810', 'endColor': '#542805', 'accentColor': '#FAF089',
        'icon': '''<g transform="scale(1.35)">
          <polygon points="-12,6 12,6 9,11 -9,11" fill="#C05621" stroke="#D69E2E" stroke-width="0.8" />
          <polygon points="-9,2 9,2 12,6 -12,6" fill="#DD6B20" stroke="#ECC94B" stroke-width="0.8" />
          <polygon points="-6,-1 6,-1 9,2 -9,2" fill="#ED8936" />
          <path d="M-3,-1 C-5,-6 -1,-11 0,-14 C1,-11 5,-6 3,-1 Z" fill="#ECC94B" />
          <path d="M-1.5,-1 C-2.5,-4 -0.5,-8 0,-10 C0.5,-8 2.5,-4 1.5,-1 Z" fill="#F56565" />
        </g>'''
    },
    {
        'id': 'devata', 'number': '4', 'name': 'DEVATA UPASANA', 'sanskrit': 'देवता उपासना', 'direction': 'SE',
        'mantra': 'ॐ नमः शिवाय ॥', 'angle': 45,
        'startColor': '#1B4D2E', 'endColor': '#0C2B18', 'accentColor': '#9AE6B4',
        'icon': '''<g transform="scale(1.35)">
          <line x1="0" y1="-14" x2="0" y2="12" stroke="#ECC94B" stroke-width="1.6" stroke-linecap="round" />
          <path d="M-7,-7 C-7,-1 0,1 0,1 C0,1 7,-1 7,-7" fill="none" stroke="#ECC94B" stroke-width="1.5" stroke-linecap="round" />
          <line x1="-7" y1="-12" x2="-7" y2="-7" stroke="#ECC94B" stroke-width="1.5" />
          <line x1="7" y1="-12" x2="7" y2="-7" stroke="#ECC94B" stroke-width="1.5" />
          <polygon points="-4,-2 4,-2 0,2" fill="#ED8936" />
          <polygon points="-4,6 4,6 0,2" fill="#ED8936" />
        </g>'''
    },
    {
        'id': 'gemstone', 'number': '5', 'name': 'RATNA', 'sanskrit': 'रत्न', 'direction': 'S',
        'mantra': 'ॐ ग्रहाय नमः ॥', 'angle': 90,
        'startColor': '#7C5814', 'endColor': '#4A3205', 'accentColor': '#FEEBC8',
        'icon': '''<g transform="scale(1.35)">
          <polygon points="0,-11 4.5,-7 4.5,-3 -4.5,-3 -4.5,-7" fill="#E53E3E" stroke="#FFF" stroke-width="0.6" />
          <circle cx="9" cy="-5" r="3.6" fill="#3182CE" stroke="#FFF" stroke-width="0.6" />
          <circle cx="-9" cy="-5" r="3.6" fill="#ECC94B" stroke="#FFF" stroke-width="0.6" />
          <circle cx="-8" cy="4" r="3.6" fill="#38A169" stroke="#FFF" stroke-width="0.6" />
          <polygon points="0,-1 4,3 0,7 -4,3" fill="#EDF2F7" stroke="#CBD5E0" stroke-width="0.7" />
          <circle cx="8" cy="4" r="3.6" fill="#ED8936" stroke="#FFF" stroke-width="0.6" />
        </g>'''
    },
    {
        'id': 'rudraksha', 'number': '6', 'name': 'RUDRĀKṢA', 'sanskrit': 'रुद्राक्ष', 'direction': 'SW',
        'mantra': 'ॐ नमः शिवाय ॥', 'angle': 135,
        'startColor': '#122E5C', 'endColor': '#07152D', 'accentColor': '#90CDF4',
        'icon': '''<g transform="scale(1.35)">
          <circle cx="0" cy="0" r="10.5" fill="#9C4221" stroke="#DD6B20" stroke-width="1.2" />
          <path d="M0,-10.5 C-3,-4 -3,4 0,10.5" fill="none" stroke="#4A1E0D" stroke-width="1.4" />
          <path d="M0,-10.5 C3,-4 3,4 0,10.5" fill="none" stroke="#4A1E0D" stroke-width="1.4" />
          <path d="M-8,-4 C-3,0 -3,0 -8,4" fill="none" stroke="#4A1E0D" stroke-width="1.2" />
          <path d="M8,-4 C3,0 3,0 8,4" fill="none" stroke="#4A1E0D" stroke-width="1.2" />
          <circle cx="0" cy="0" r="1.6" fill="#ECC94B" />
        </g>'''
    },
    {
        'id': 'vastu', 'number': '7', 'name': 'VĀSTU', 'sanskrit': 'वास्तु', 'direction': 'W',
        'mantra': 'ॐ वास्तुपुरुषाय नमः ॥', 'angle': 180,
        'startColor': '#0E535C', 'endColor': '#042C32', 'accentColor': '#81E6D9',
        'icon': '''<g transform="scale(1.35)">
          <rect x="-11" y="-11" width="22" height="22" rx="1.5" fill="none" stroke="#81E6D9" stroke-width="1.4" />
          <line x1="-11" y1="0" x2="11" y2="0" stroke="#81E6D9" stroke-width="1" />
          <line x1="0" y1="-11" x2="0" y2="11" stroke="#81E6D9" stroke-width="1" />
          <circle cx="0" cy="0" r="7" fill="none" stroke="#ECC94B" stroke-width="1" />
          <circle cx="0" cy="0" r="2.2" fill="#ECC94B" />
        </g>'''
    },
    {
        'id': 'dana', 'number': '8', 'name': 'DĀNA & SEVA', 'sanskrit': 'दान एवं सेवा', 'direction': 'NW',
        'mantra': 'ॐ परोपकाराय नमः ॥', 'angle': 225,
        'startColor': '#401A4F', 'endColor': '#200929', 'accentColor': '#D6BCFA',
        'icon': '''<g transform="scale(1.35)">
          <ellipse cx="0" cy="-3" rx="8" ry="4.5" fill="#ECC94B" stroke="#D69E2E" stroke-width="0.8" />
          <ellipse cx="0" cy="-4.5" rx="5.5" ry="2.5" fill="#FAF089" />
          <circle cx="-3" cy="-4.5" r="0.8" fill="#D69E2E" />
          <circle cx="0" cy="-5" r="0.9" fill="#B7791F" />
          <circle cx="3" cy="-4.5" r="0.8" fill="#D69E2E" />
          <path d="M-13,5 C-11,2 -7,-1 -1,-1 L-1,1 C-6,1 -9,4 -11,7 Z" fill="#E2E8F0" stroke="#CBD5E0" stroke-width="0.5" />
          <path d="M13,5 C11,2 7,-1 1,-1 L1,1 C6,1 9,4 11,7 Z" fill="#E2E8F0" stroke="#CBD5E0" stroke-width="0.5" />
          <path d="M0,4 C-1.8,2 -5,3.2 -5,5.5 C-5,8 0,11 0,11 C0,11 5,8 5,5.5 C5,3.2 1.8,2 0,4 Z" fill="#F56565" stroke="#E53E3E" stroke-width="0.5" />
        </g>'''
    }
]

svg_parts = []
svg_parts.append('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720" width="1200" height="1200">
  <defs>
    <clipPath id="centerHubClip">
      <circle cx="360" cy="360" r="115" />
    </clipPath>
    <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3.5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>''')

for s in spokes:
    svg_parts.append(f'''    <radialGradient id="grad-{s['id']}" cx="50%" cy="50%" r="65%">
      <stop offset="0%" stop-color="{s['startColor']}" />
      <stop offset="100%" stop-color="{s['endColor']}" />
    </radialGradient>''')

svg_parts.append('''  </defs>

  <circle cx="360" cy="360" r="340" fill="none" stroke="#C9952B" stroke-width="1.8" stroke-dasharray="5 5" opacity="0.8" />
  <circle cx="360" cy="360" r="330" fill="none" stroke="#D69E2E" stroke-width="4" opacity="0.95" />''')

for s in spokes:
    startAngle = s['angle'] - 22.5
    endAngle = s['angle'] + 22.5
    pathData = describeDonutSegment(center, center, rInner, rOuter, startAngle, endAngle)
    pos = polarToCartesian(center, center, rMid, s['angle'])
    badgePos = polarToCartesian(center, center, rOuter + 2, s['angle'])
    startPt = polarToCartesian(center, center, rInner, startAngle)
    endPt = polarToCartesian(center, center, rOuter, startAngle)

    name_font_size = 11.5 if len(s['name']) > 13 else 13
    mantra_font_size = 9.5 if len(s['mantra']) > 20 else 11

    svg_parts.append(f'''
  <g>
    <path d="{pathData}" fill="url(#grad-{s['id']})" stroke="#ECC94B" stroke-width="2" />
    <line x1="{startPt[0]:.2f}" y1="{startPt[1]:.2f}" x2="{endPt[0]:.2f}" y2="{endPt[1]:.2f}" stroke="#ECC94B" stroke-width="2" opacity="0.85" />
    <g transform="translate({pos[0]:.2f}, {pos[1]:.2f})">
      <text x="0" y="-48" text-anchor="middle" font-size="{name_font_size}" font-weight="900" letter-spacing="0.4" fill="#FFFFFF" font-family="'Segoe UI', Roboto, sans-serif" style="filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.95));">{s['number']}. {s['name']}</text>
      <text x="0" y="-30" text-anchor="middle" font-size="12" font-weight="800" fill="{s['accentColor']}" font-family="'Segoe UI', 'Nirmala UI', sans-serif" style="filter: drop-shadow(0px 1px 3px rgba(0,0,0,0.95));">{s['sanskrit']}</text>
      <g transform="translate(0, 2)">{s['icon']}</g>
      <text x="0" y="36" text-anchor="middle" font-size="{mantra_font_size}" font-weight="800" fill="#FFFFFF" font-family="'Segoe UI', 'Nirmala UI', sans-serif" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.95));">{s['mantra']}</text>
    </g>
    <g transform="translate({badgePos[0]:.2f}, {badgePos[1]:.2f})">
      <circle cx="0" cy="0" r="17" fill="{s['startColor']}" stroke="#ECC94B" stroke-width="2.5" filter="url(#goldGlow)" />
      <text x="0" y="4.5" text-anchor="middle" font-size="12" font-weight="900" fill="#FFFFFF" font-family="'Segoe UI', Roboto, sans-serif" style="filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.8));">{s['direction']}</text>
    </g>
  </g>''')

svg_parts.append(f'''
  <g>
    <circle cx="360" cy="360" r="118" fill="none" stroke="#ECC94B" stroke-width="3.5" filter="url(#goldGlow)" />
    <image href="data:image/png;base64,{emblem_b64}" x="{center - rInner}" y="{center - rInner}" width="{rInner * 2}" height="{rInner * 2}" preserveAspectRatio="xMidYMid meet" clip-path="url(#centerHubClip)" />
    <circle cx="360" cy="360" r="115" fill="none" stroke="#C9952B" stroke-width="2" />
  </g>
</svg>''')

svg_content = '\n'.join(svg_parts)

html_content = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  html, body {{
    background: transparent !important;
    width: 1200px;
    height: 1200px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }}
  svg {{
    width: 1200px;
    height: 1200px;
  }}
</style>
</head>
<body>
{svg_content}
</body>
</html>'''

with open('scripts/temp_wheel.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print('Generated scripts/temp_wheel.html successfully!')

# Call Chrome headless to render transparent PNG
chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
output_png = os.path.abspath('assets/images/ashta_parihar_wheel.png')
html_path = os.path.abspath('scripts/temp_wheel.html')

cmd = [
    chrome_path,
    '--headless=new',
    '--disable-gpu',
    '--default-background-color=00000000',
    '--window-size=1200,1200',
    f'--screenshot={output_png}',
    f'file:///{html_path.replace(os.sep, "/")}'
]

print('Running Chrome screenshot...')
result = subprocess.run(cmd, capture_output=True, text=True)
print('Chrome returncode:', result.returncode)

if os.path.exists(output_png):
    print(f'SUCCESS! Created {output_png} of size {os.path.getsize(output_png)} bytes')
else:
    print('Failed to generate PNG!')
