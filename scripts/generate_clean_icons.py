import os
import math
import numpy as np
from PIL import Image

def generate():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    source_path = os.path.join(project_root, 'assets', 'images', 'app_logo_emblem.png')
    
    # Also check if backup exists or use Downloads original as source if needed
    alt_source = r'C:\Users\PC\Downloads\Astroparihar (1)\Astroparihar\1024x1024.png'
    if os.path.exists(alt_source):
        src_img = Image.open(alt_source).convert('RGBA')
    else:
        src_img = Image.open(source_path).convert('RGBA')
        
    w, h = src_img.size
    print(f'Loaded source image: {w}x{h}')
    
    # Exact center and radius fitted to the golden ornamental circular boundary
    xc, yc = 510.86, 502.19
    r_cut = 431.5
    
    Y, X = np.ogrid[:h, :w]
    dist = np.sqrt((X - xc)**2 + (Y - yc)**2)
    
    # Smooth anti-aliasing across 1.2 pixels
    mask = np.clip((r_cut + 0.6 - dist) / 1.2, 0.0, 1.0)
    
    arr = np.array(src_img).astype(float)
    r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]
    brightness = (r + g + b) / 3.0
    colorfulness = np.sqrt((r - g)**2 + (g - b)**2 + (b - r)**2)
    
    # Suppress near-white compression artifacts at the perimeter (d > 427)
    is_white_fringe = (dist > 427) & (brightness > 240) & (colorfulness < 18)
    mask[is_white_fringe] = 0.0
    
    # Apply alpha mask
    arr[:, :, 3] = (a * mask).astype(np.uint8)
    
    # Crop precisely to bounding box of the circular emblem
    crop_box = (
        int(round(xc - r_cut)),
        int(round(yc - r_cut)),
        int(round(xc + r_cut)),
        int(round(yc + r_cut))
    )
    clean_emblem = Image.fromarray(arr.astype(np.uint8)).crop(crop_box)
    emblem_w, emblem_h = clean_emblem.size
    print(f'Cropped clean emblem: {emblem_w}x{emblem_h}')
    
    # 1. Generate master 1024x1024 asset for Expo / assets/images/app_logo_emblem.png
    master_1024 = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    emblem_1016 = clean_emblem.resize((1016, 1016), Image.Resampling.LANCZOS)
    master_1024.paste(emblem_1016, (4, 4), emblem_1016)
    
    dest_emblem = os.path.join(project_root, 'assets', 'images', 'app_logo_emblem.png')
    master_1024.save(dest_emblem, 'PNG')
    print(f'Updated master asset: {dest_emblem}')
    
    # 2. Generate Android mipmap icons
    res_dir = os.path.join(project_root, 'android', 'app', 'src', 'main', 'res')
    sizes = [
        ('mipmap-mdpi', 48),
        ('mipmap-hdpi', 72),
        ('mipmap-xhdpi', 96),
        ('mipmap-xxhdpi', 144),
        ('mipmap-xxxhdpi', 192)
    ]
    
    for folder, dim in sizes:
        target_dir = os.path.join(res_dir, folder)
        if not os.path.exists(target_dir):
            os.makedirs(target_dir, exist_ok=True)
            
        # Target icon with 1px margin for perfect anti-aliasing
        pad = 1 if dim <= 96 else 2
        emblem_dim = dim - (pad * 2)
        
        resized_emblem = clean_emblem.resize((emblem_dim, emblem_dim), Image.Resampling.LANCZOS)
        
        icon = Image.new('RGBA', (dim, dim), (0, 0, 0, 0))
        icon.paste(resized_emblem, (pad, pad), resized_emblem)
        
        ic_launcher_path = os.path.join(target_dir, 'ic_launcher.png')
        ic_round_path = os.path.join(target_dir, 'ic_launcher_round.png')
        
        icon.save(ic_launcher_path, 'PNG')
        icon.save(ic_round_path, 'PNG')
        print(f'Generated: {folder}/ic_launcher.png & ic_launcher_round.png ({dim}x{dim})')
        
    print('\nAll icons successfully generated with NO white background!')

if __name__ == '__main__':
    generate()
