import os
import subprocess
import sys

def main():
    print("Setting up extension icons...")
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("Pillow not installed. Installing Pillow...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
        from PIL import Image, ImageDraw

    icon_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'extension', 'icons')
    os.makedirs(icon_dir, exist_ok=True)

    sizes = [16, 48, 128]
    for size in sizes:
        img = Image.new('RGBA', (size, size), color=(15, 23, 42, 255))
        draw = ImageDraw.Draw(img)
        
        # Draw a simple green shield shape
        pad = max(1, size // 8)
        # Shield coordinates
        top = pad
        bottom = size - pad
        left = pad
        right = size - pad
        mid_x = size // 2
        
        points = [
            (mid_x, top),          # Top middle
            (right, top + pad),    # Top right
            (right, size // 2),    # Mid right
            (mid_x, bottom),       # Bottom point
            (left, size // 2),     # Mid left
            (left, top + pad)      # Top left
        ]
        
        draw.polygon(points, fill=(16, 185, 129, 255))
        # Draw a smaller inner polygon for shield details (e.g. white or light green checkmark)
        inner_points = [
            (mid_x, top + pad*2),
            (right - pad, top + pad*2.5),
            (right - pad, size // 2),
            (mid_x, bottom - pad),
            (left + pad, size // 2),
            (left + pad, top + pad*2.5)
        ]
        draw.polygon(inner_points, fill=(5, 150, 105, 255))
        
        out_path = os.path.join(icon_dir, f"icon-{size}.png")
        img.save(out_path)
        print(f"Generated: {out_path}")

if __name__ == "__main__":
    main()
