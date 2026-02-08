from __future__ import annotations

import math
import os
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


@dataclass(frozen=True)
class Theme:
    bg_top: tuple[int, int, int]
    bg_bottom: tuple[int, int, int]
    sheet: tuple[int, int, int, int]
    sheet_border: tuple[int, int, int, int]
    text: tuple[int, int, int]
    text_muted: tuple[int, int, int]
    accent: tuple[int, int, int]
    accent_text: tuple[int, int, int]
    nav_bg: tuple[int, int, int, int]
    nav_icon: tuple[int, int, int]
    nav_icon_active: tuple[int, int, int]


def _hex(h: str) -> tuple[int, int, int]:
    h = h.strip().lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def _font(path: str, size: int, index: int = 0) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    if os.path.exists(path):
        try:
            return ImageFont.truetype(path, size=size, index=index)
        except Exception:
            pass
    return ImageFont.load_default()


def _fonts() -> dict[str, ImageFont.ImageFont]:
    # iOS‑ish typography: Avenir Next + SF Compact (fallbacks)
    avenir_next = "/System/Library/Fonts/Avenir Next.ttc"
    sf = "/System/Library/Fonts/SFNS.ttf"
    sf_compact = "/System/Library/Fonts/SFCompact.ttf"

    return {
        "h1": _font(avenir_next, 56, index=0),
        "h2": _font(avenir_next, 44, index=0),
        "h3": _font(avenir_next, 34, index=0),
        "b1": _font(sf_compact, 30, index=0),
        "b2": _font(sf, 26, index=0),
        "b3": _font(sf, 22, index=0),
        "cap": _font(sf, 20, index=0),
    }


def _rounded_rect(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], r: int, fill=None, outline=None, w: int = 2) -> None:
    draw.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=w)


def _text(draw: ImageDraw.ImageDraw, xy: tuple[int, int], s: str, font: ImageFont.ImageFont, fill) -> tuple[int, int, int, int]:
    x, y = xy
    draw.text((x, y), s, font=font, fill=fill)
    return draw.textbbox((x, y), s, font=font)


def _wrap(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, max_w: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current: list[str] = []

    def width(s: str) -> int:
        b = draw.textbbox((0, 0), s, font=font)
        return b[2] - b[0]

    for w in words:
        trial = " ".join([*current, w]).strip()
        if width(trial) <= max_w:
            current.append(w)
        else:
            if current:
                lines.append(" ".join(current))
            current = [w]
    if current:
        lines.append(" ".join(current))
    return lines


def _paragraph(
    draw: ImageDraw.ImageDraw,
    x: int,
    y: int,
    text: str,
    font: ImageFont.ImageFont,
    fill,
    max_w: int,
    lh: int,
) -> int:
    for line in _wrap(draw, text, font, max_w):
        draw.text((x, y), line, font=font, fill=fill)
        y += lh
    return y


def _linear_gradient(w: int, h: int, top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    im = Image.new("RGB", (w, h), top)
    px = im.load()
    for y in range(h):
        t = y / max(1, h - 1)
        r = int(top[0] * (1 - t) + bottom[0] * t)
        g = int(top[1] * (1 - t) + bottom[1] * t)
        b = int(top[2] * (1 - t) + bottom[2] * t)
        for x in range(w):
            px[x, y] = (r, g, b)
    return im


def _scene(w: int, h: int, theme: Theme) -> Image.Image:
    # Simple “photo‑like” scene (sky + mountains + haze) to avoid web‑flat UI.
    base = _linear_gradient(w, h, theme.bg_top, theme.bg_bottom).convert("RGBA")
    draw = ImageDraw.Draw(base)

    # Soft clouds
    for i in range(9):
        cx = int(w * (0.1 + 0.85 * (i / 8)))
        cy = int(h * (0.15 + 0.10 * math.sin(i * 0.9)))
        rw = int(w * 0.18)
        rh = int(h * 0.06)
        color = (255, 255, 255, 55)
        draw.ellipse((cx - rw, cy - rh, cx + rw, cy + rh), fill=color)

    # Mountains (two layers)
    def mountain(y_base: float, amp: float, col: tuple[int, int, int, int]) -> None:
        pts = []
        for i in range(0, 12):
            t = i / 11
            x = int(w * t)
            y = int(h * (y_base + amp * math.sin(t * math.pi * 1.7 + 0.8) + 0.04 * math.sin(t * math.pi * 6.0)))
            pts.append((x, y))
        pts.extend([(w, h), (0, h)])
        draw.polygon(pts, fill=col)

    mountain(0.50, 0.07, (24, 44, 64, 160))
    mountain(0.58, 0.06, (14, 28, 42, 210))

    # Haze / depth
    haze = Image.new("RGBA", (w, h), (255, 255, 255, 0))
    haze_draw = ImageDraw.Draw(haze)
    haze_draw.rectangle((0, int(h * 0.48), w, h), fill=(255, 255, 255, 28))
    haze = haze.filter(ImageFilter.GaussianBlur(10))
    base.alpha_composite(haze)

    # Vignette
    vignette = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(vignette)
    vdraw.ellipse((-int(w * 0.2), -int(h * 0.1), int(w * 1.2), int(h * 1.1)), outline=None, fill=(0, 0, 0, 0))
    vdraw.rectangle((0, 0, w, h), outline=None, fill=(0, 0, 0, 0))
    # Edge darkening via alpha mask rings
    for i in range(16):
        a = int(10 + i * 6)
        inset = int(i * 18)
        vdraw.rounded_rectangle((inset, inset, w - inset, h - inset), radius=80, outline=(0, 0, 0, a), width=4)
    vignette = vignette.filter(ImageFilter.GaussianBlur(18))
    base.alpha_composite(vignette)

    return base


def _sheet(im: Image.Image, theme: Theme, top_y: int, radius: int = 44) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    w, h = im.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    _rounded_rect(draw, (24, top_y, w - 24, h - 24), r=radius, fill=theme.sheet, outline=theme.sheet_border, w=2)

    # Handle
    hx1 = w // 2 - 60
    hx2 = w // 2 + 60
    hy = top_y + 22
    _rounded_rect(draw, (hx1, hy, hx2, hy + 10), r=999, fill=(255, 255, 255, 70), outline=None, w=0)

    im.alpha_composite(overlay)
    return im, ImageDraw.Draw(im)


def _status_bar(draw: ImageDraw.ImageDraw, w: int, theme: Theme, fonts: dict[str, ImageFont.ImageFont]) -> None:
    # Minimal, not literal
    _text(draw, (46, 34), "9:41", font=fonts["cap"], fill=theme.text)
    # Right icons (fake)
    bx = w - 180
    by = 36
    draw.rounded_rectangle((bx, by, bx + 54, by + 26), radius=6, outline=theme.text, width=2)
    draw.rectangle((bx + 56, by + 7, bx + 60, by + 19), fill=theme.text)
    # wifi + signal
    draw.arc((w - 108, 34, w - 56, 82), start=200, end=340, fill=theme.text, width=3)
    draw.arc((w - 102, 40, w - 62, 80), start=205, end=335, fill=theme.text, width=3)
    draw.ellipse((w - 82, 62, w - 76, 68), fill=theme.text)


def _nav_bar(im: Image.Image, theme: Theme, active: str) -> None:
    w, h = im.size
    nav_h = 130
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    _rounded_rect(draw, (24, h - nav_h - 24, w - 24, h - 24), r=42, fill=theme.nav_bg, outline=theme.sheet_border, w=2)

    slots = ["sesion", "mapa", "caja", "boveda", "perfil"]
    labels = {
        "sesion": "Sesión",
        "mapa": "Mapa",
        "caja": "Caja",
        "boveda": "Bóveda",
        "perfil": "Yo",
    }
    cx = [int((w - 48) * (i + 0.5) / 5) + 24 for i in range(5)]
    cy = h - nav_h - 24 + 54

    def icon_color(key: str) -> tuple[int, int, int]:
        return theme.nav_icon_active if key == active else theme.nav_icon

    for i, key in enumerate(slots):
        col = icon_color(key)
        x = cx[i]
        y = cy
        # icons: simple line drawings
        if key == "sesion":  # home
            draw.polygon([(x - 22, y + 10), (x, y - 16), (x + 22, y + 10)], outline=col, fill=None)
            draw.rectangle((x - 16, y + 10, x + 16, y + 32), outline=col, width=3)
        elif key == "mapa":  # pin
            draw.ellipse((x - 16, y - 16, x + 16, y + 16), outline=col, width=3)
            draw.polygon([(x, y + 38), (x - 10, y + 8), (x + 10, y + 8)], outline=col)
            draw.ellipse((x - 4, y - 4, x + 4, y + 4), fill=col)
        elif key == "caja":  # box
            draw.rounded_rectangle((x - 18, y - 12, x + 18, y + 26), radius=8, outline=col, width=3)
            draw.line((x - 18, y + 2, x + 18, y + 2), fill=col, width=3)
        elif key == "boveda":  # lock
            draw.rounded_rectangle((x - 18, y - 2, x + 18, y + 28), radius=10, outline=col, width=3)
            draw.arc((x - 16, y - 26, x + 16, y + 6), start=200, end=-20, fill=col, width=3)
            draw.ellipse((x - 3, y + 10, x + 3, y + 16), fill=col)
        elif key == "perfil":  # user
            draw.ellipse((x - 14, y - 16, x + 14, y + 12), outline=col, width=3)
            draw.arc((x - 22, y + 6, x + 22, y + 46), start=200, end=-20, fill=col, width=3)

        # active dot
        if key == active:
            draw.ellipse((x - 5, y + 54, x + 5, y + 64), fill=theme.accent)

    im.alpha_composite(overlay)


def _primary_button(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], theme: Theme, text: str, font: ImageFont.ImageFont) -> None:
    _rounded_rect(draw, box, r=26, fill=theme.accent + (255,), outline=None, w=0)
    b = draw.textbbox((0, 0), text, font=font)
    tw = b[2] - b[0]
    th = b[3] - b[1]
    x1, y1, x2, y2 = box
    draw.text(((x1 + x2 - tw) // 2, (y1 + y2 - th) // 2 - 2), text, font=font, fill=theme.accent_text)


def _field(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, label: str, theme: Theme, fonts: dict[str, ImageFont.ImageFont]) -> None:
    _rounded_rect(draw, (x, y, x + w, y + 92), r=22, fill=(255, 255, 255, 35), outline=(255, 255, 255, 55), w=2)
    draw.text((x + 22, y + 28), label, font=fonts["b2"], fill=theme.text_muted)


def screen_onboarding(w: int, h: int, theme: Theme, fonts: dict[str, ImageFont.ImageFont]) -> Image.Image:
    im = _scene(w, h, theme)
    draw = ImageDraw.Draw(im)
    _status_bar(draw, w, theme, fonts)

    # Hero title (top-left, like reference)
    draw.text((56, 220), "Concia", font=fonts["h1"], fill=theme.text)
    _paragraph(
        draw,
        56,
        292,
        "Volver a ti.",
        font=fonts["b1"],
        fill=theme.text_muted,
        max_w=w - 112,
        lh=40,
    )

    # Bottom sheet
    im, draw = _sheet(im, theme, top_y=int(h * 0.58))
    sx = 56
    sy = int(h * 0.58) + 60
    draw.text((sx, sy), "INFORMACIÓN", font=fonts["cap"], fill=theme.text_muted)
    sy += 42
    draw.text((sx, sy), "Esto es una sala privada.", font=fonts["h3"], fill=theme.text)
    sy += 54
    sy = _paragraph(
        draw,
        sx,
        sy,
        "Una pregunta por vez. Tú decides cuándo pedir lectura. "
        "La Bóveda está fuera del sistema.",
        font=fonts["b2"],
        fill=theme.text_muted,
        max_w=w - 112,
        lh=38,
    )

    # Small meta row
    meta_y = int(h * 0.58) + 60
    meta_x = w - 56 - 160
    draw.ellipse((meta_x, meta_y, meta_x + 44, meta_y + 44), outline=(255, 255, 255, 60), width=2)
    draw.text((meta_x + 58, meta_y + 8), "Local", font=fonts["b3"], fill=theme.text)

    # CTA
    _primary_button(draw, (56, h - 210, w - 56, h - 132), theme, "ENTRAR", fonts["b1"])

    # Bottom nav hidden on onboarding (keep clean)
    return im.convert("RGB")


def screen_login(w: int, h: int, theme: Theme, fonts: dict[str, ImageFont.ImageFont]) -> Image.Image:
    im = _scene(w, h, theme)
    draw = ImageDraw.Draw(im)
    _status_bar(draw, w, theme, fonts)

    draw.text((56, 180), "Acceso", font=fonts["h2"], fill=theme.text)
    _paragraph(
        draw,
        56,
        250,
        "Puedes entrar sin cuenta. Si creas cuenta, es solo para sincronizar (opt‑in).",
        font=fonts["b2"],
        fill=theme.text_muted,
        max_w=w - 112,
        lh=38,
    )

    im, draw = _sheet(im, theme, top_y=int(h * 0.40))
    x = 56
    y = int(h * 0.40) + 70
    _field(draw, x, y, w - 112, "Correo", theme, fonts)
    y += 118
    _field(draw, x, y, w - 112, "Contraseña", theme, fonts)
    y += 138
    _primary_button(draw, (56, y, w - 56, y + 86), theme, "CONTINUAR", fonts["b1"])
    y += 106
    _rounded_rect(draw, (56, y, w - 56, y + 86), r=26, fill=(0, 0, 0, 0), outline=(255, 255, 255, 60), w=2)
    b = draw.textbbox((0, 0), "ENTRAR SIN CUENTA", font=fonts["b1"])
    tw = b[2] - b[0]
    th = b[3] - b[1]
    draw.text(((w - tw) // 2, y + (86 - th) // 2 - 2), "ENTRAR SIN CUENTA", font=fonts["b1"], fill=theme.text)

    return im.convert("RGB")


def screen_dashboard(w: int, h: int, theme: Theme, fonts: dict[str, ImageFont.ImageFont]) -> Image.Image:
    im = _scene(w, h, theme).filter(ImageFilter.GaussianBlur(0.6))
    draw = ImageDraw.Draw(im)
    _status_bar(draw, w, theme, fonts)

    # Top content stays minimal (native, not header + tabs)
    draw.text((56, 170), "Hola, [Nombre].", font=fonts["h2"], fill=theme.text)
    _paragraph(
        draw,
        56,
        240,
        "Hoy: nombra el hecho sin adornarlo.",
        font=fonts["b2"],
        fill=theme.text_muted,
        max_w=w - 112,
        lh=38,
    )

    # Bottom sheet contains the session card
    sheet_top = int(h * 0.46)
    im, draw = _sheet(im, theme, top_y=sheet_top)

    x = 56
    y = sheet_top + 58
    draw.text((x, y), "TU PRÓXIMO PASO", font=fonts["cap"], fill=theme.text_muted)
    y += 44
    draw.text((x, y), "Habla 60s.", font=fonts["h3"], fill=theme.text)
    y += 54
    y = _paragraph(
        draw,
        x,
        y,
        "“¿Dónde cediste hoy para evitar incomodidad?”",
        font=fonts["b1"],
        fill=theme.text,
        max_w=w - 112,
        lh=42,
    )
    y += 26
    _primary_button(draw, (56, y, w - 56, y + 92), theme, "HABLAR", fonts["b1"])
    y += 120

    # Secondary actions as pills (not a dashboard grid)
    pill_bg = (255, 255, 255, 28)
    pill_border = (255, 255, 255, 50)
    _rounded_rect(draw, (56, y, 246, y + 64), r=999, fill=pill_bg, outline=pill_border, w=2)
    draw.text((88, y + 18), "Mapa", font=fonts["b2"], fill=theme.text)
    _rounded_rect(draw, (270, y, 492, y + 64), r=999, fill=pill_bg, outline=pill_border, w=2)
    draw.text((302, y + 18), "Bóveda", font=fonts["b2"], fill=theme.text)
    _rounded_rect(draw, (516, y, w - 56, y + 64), r=999, fill=pill_bg, outline=pill_border, w=2)
    draw.text((548, y + 18), "Refugio", font=fonts["b2"], fill=theme.text)

    # Bottom nav (native)
    _nav_bar(im, theme, active="sesion")
    return im.convert("RGB")


def main() -> None:
    w, h = 780, 1688  # iPhone 14-ish @2x (390x844)
    out_dir = Path(__file__).resolve().parent
    out_dir.mkdir(parents=True, exist_ok=True)
    fonts = _fonts()

    theme = Theme(
        bg_top=_hex("#B7E2FF"),
        bg_bottom=_hex("#1B2C42"),
        sheet=(10, 18, 32, 215),  # deep navy, semi‑transparent
        sheet_border=(255, 255, 255, 35),
        text=_hex("#F4F7FB"),
        text_muted=_hex("#B9C6D3"),
        accent=_hex("#7D5C6B"),
        accent_text=_hex("#FFFFFF"),
        nav_bg=(10, 18, 32, 200),
        nav_icon=_hex("#B9C6D3"),
        nav_icon_active=_hex("#F4F7FB"),
    )

    screens = {
        "onboarding_native": screen_onboarding,
        "login_native": screen_login,
        "dashboard_native": screen_dashboard,
    }

    for key, builder in screens.items():
        im = builder(w, h, theme, fonts)
        path = out_dir / f"mirat_{key}.png"
        im.save(path, format="PNG", optimize=True)
        print("wrote", path)


if __name__ == "__main__":
    main()
