"""
Draw the Obvis logo (Activity/heartbeat icon + text) as PNG, then embed it in the medical report PDF.
"""
import os, io, math
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sample_reports")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Colors matching logo.tsx: sky-500 = #0ea5e9, sky-400 = #38bdf8
SKY_400 = "#38bdf8"
SKY_500 = "#0ea5e9"
SKY_10_BG = "#0ea5e9"  # used for circle border tint at low opacity
WHITE = "#ffffff"
DARK_BG = "#0f172a"      # dark background for report header
GRAY_TEXT = "#94a3b8"


def draw_heartbeat(draw, cx, cy, amplitude, width, color="white", line_width=2):
    """Draw a heartbeat/ECG pulse line (Activity icon from lucide-react).
    Goes left→right with peaks and valleys."""
    points = []
    half = width / 2
    # Segment positions (0..1 mapped to -half..+half)
    # Heartbeat pattern: flat - spike up - spike down (dip) - spike up - flat
    steps = 60
    for i in range(steps + 1):
        t = i / steps
        x = cx - half + t * width

        if t < 0.20:
            y = cy
        elif t < 0.25:
            y = cy - amplitude * 0.3
        elif t < 0.30:
            y = cy
        elif t < 0.38:
            y = cy - amplitude  # big spike up
        elif t < 0.45:
            y = cy + amplitude * 0.9  # deep dip down
        elif t < 0.55:
            y = cy - amplitude * 0.7  # smaller spike up
        elif t < 0.62:
            y = cy
        elif t < 0.80:
            y = cy
        else:
            y = cy
        points.append((x, y))

    draw.line(points, fill=color, width=line_width)


def make_logo(scale=1):
    """Create Obvis logo as RGBA PIL Image, matching logo.tsx design."""
    # Size: circle ~50px + text ~80px
    canvas_w = int(160 * scale)
    canvas_h = int(60 * scale)
    img = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    circle_size = int(50 * scale)
    circle_pad = int(4 * scale)
    cx_icon = circle_size // 2 + circle_pad
    cy_icon = canvas_h // 2

    # Circular border: rounded-full bg-sky-500/10 border border-sky-500/20
    # Draw outer circle with sky-500/20 border
    border_w = int(2 * scale)
    for w_off in range(border_w, 0, -1):
        draw.ellipse(
            [circle_pad, circle_pad, circle_size + circle_pad, circle_size + circle_pad],
            fill=None,
            outline=(14, 165, 233, 50),  # sky-500/20
            width=w_off
        )

    # Inner fill: sky-500/10
    bg = Image.new("RGBA", (canvas_w, canvas_h), (14, 165, 233, 30))  # sky-500/10
    mask_circle = Image.new("L", (canvas_w, canvas_h), 0)
    md = ImageDraw.Draw(mask_circle)
    md.ellipse(
        [circle_pad, circle_pad, circle_size + circle_pad, circle_size + circle_pad],
        fill=255
    )
    img.paste(bg, (0, 0), mask_circle)

    # Redraw border on top
    draw = ImageDraw.Draw(img)
    draw.ellipse(
        [circle_pad, circle_pad, circle_size + circle_pad, circle_size + circle_pad],
        fill=None,
        outline=(14, 165, 233, 51),
        width=border_w
    )

    # Heartbeat icon inside circle
    draw_heartbeat(draw, cx_icon, cy_icon,
                   amplitude=int(12 * scale), width=int(24 * scale),
                   color=SKY_400, line_width=int(2.5 * scale))

    # "Obvis." text
    try:
        font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", int(28 * scale))
    except:
        font = ImageFont.load_default()
        font = ImageFont.load_default()

    text_x = int(62 * scale)
    text_y = int(12 * scale)
    draw.text((text_x, text_y), "Obvis", fill=WHITE, font=font)
    # The dot in sky-400
    dot_x = text_x + int(2 * scale * 18)  # rough position, will improve
    # Better: measure text width
    bbox = font.getbbox("Obvis")
    text_w = bbox[2] - bbox[0]
    dot_x = text_x + text_w + int(1 * scale)
    draw.text((dot_x, text_y), ".", fill=SKY_400, font=font)

    return img


def save_logo_as_png():
    logo = make_logo(scale=2)
    # For PNG embed: convert to RGB on a transparent/dark bg
    # Actually for the PDF, let's save as RGBA then embed
    png_path = os.path.join(OUTPUT_DIR, "obvis_logo.png")

    # Also make a dark version that matches the report header bg
    img = Image.new("RGB", logo.size, DARK_BG)
    img.paste(logo, (0, 0), logo)
    img.save(png_path, "PNG")
    print(f"Logo saved: {png_path} ({logo.size[0]}x{logo.size[1]}px)")
    return png_path


if __name__ == "__main__":
    save_logo_as_png()
