"""Generate smaller WebP assets; keep the original PNG unchanged."""
from pathlib import Path
from PIL import Image

folder = Path(__file__).resolve().parents[1] / "public" / "image"
with Image.open(folder / "faculty-home-hero-v2.png") as source:
    for width in (960, 1280, 1672):
        height = round(source.height * width / source.width)
        image = source.convert("RGB").resize((width, height), Image.Resampling.LANCZOS)
        target = folder / f"faculty-home-hero-v3-{width}.webp"
        image.save(target, "WEBP", quality=82, method=6)
        print(f"{target.name}: {width}x{height}, {target.stat().st_size:,} bytes")
