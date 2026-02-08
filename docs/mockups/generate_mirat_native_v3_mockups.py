from __future__ import annotations

import math
import os
import random
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont


@dataclass(frozen=True)
class Theme:
    accent: tuple[int, int, int]
    accent_text: tuple[int, int, int]
    text: tuple[int, int, int]
    text_muted: tuple[int, int, int]
    sheet_fill: tuple[int, int, int, int]
    sheet_border: tuple[int, int, int, int]
    nav_fill: tuple[int, int, int, int]
    nav_border: tuple[int, int, int, int]


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
    avenir_next = "/System/Library/Fonts/Avenir Next.ttc"
    sf = "/System/Library/Fonts/SFNS.ttf"
    sf_compact = "/System/Library/Fonts/SFCompact.ttf"
    return {
        "title": _font(avenir_next, 62, index=0),
        "title2": _font(avenir_next, 48, index=0),
        "h": _font(avenir_next, 38, index=0),
        "b": _font(sf_compact, 28, index=0),
        "b2": _font(sf, 24, index=0),
        "cap": _font(sf, 20, index=0),
        "cap2": _font(sf, 18, index=0),
    }


def _rounded(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], r: int, fill=None, outline=None, w: int = 2) -> None:
    draw.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=w)


def _status_bar(draw: ImageDraw.ImageDraw, w: int, fonts: dict[str, ImageFont.ImageFont], color: tuple[int, int, int]) -> None:
    draw.text((46, 34), "9:41", font=fonts["cap"], fill=color)
    bx = w - 180
    by = 36
    draw.rounded_rectangle((bx, by, bx + 54, by + 26), radius=6, outline=color, width=2)
    draw.rectangle((bx + 56, by + 7, bx + 60, by + 19), fill=color)
    draw.arc((w - 108, 34, w - 56, 82), start=200, end=340, fill=color, width=3)
    draw.arc((w - 102, 40, w - 62, 80), start=205, end=335, fill=color, width=3)
    draw.ellipse((w - 82, 62, w - 76, 68), fill=color)


def _wrap(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, max_w: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current: list[str] = []

    def width(s: str) -> int:
        b = draw.textbbox((0, 0), s, font=font)
        return b[2] - b[0]

    for w in words:
        trial = " ".join([*current, w]).strip()
        if not trial:
            continue
        if width(trial) <= max_w:
            current.append(w)
            continue
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


def _noise_layer(size: tuple[int, int], amount: int, blur: float) -> Image.Image:
    w, h = size
    noise = Image.effect_noise((w, h), amount).convert("L")
    noise = noise.filter(ImageFilter.GaussianBlur(blur))
    return noise


def _radial_light(size: tuple[int, int], center: tuple[int, int], radius: int, color: tuple[int, int, int, int]) -> Image.Image:
    w, h = size
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    cx, cy = center
    for i in range(12):
        t = i / 11
        r = int(radius * (1 - t))
        a = int(color[3] * (1 - t) ** 2)
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(color[0], color[1], color[2], a))
    return layer.filter(ImageFilter.GaussianBlur(28))


def _photo_background(w: int, h: int, seed: int = 7) -> Image.Image:
    random.seed(seed)
    base = Image.new("RGB", (w, h), (10, 16, 26))
    draw = ImageDraw.Draw(base)

    # Sky gradient
    top = _hex("#B9E6FF")
    mid = _hex("#7FB7D9")
    bot = _hex("#23374B")
    for y in range(h):
        t = y / max(1, h - 1)
        if t < 0.55:
            tt = t / 0.55
            r = int(top[0] * (1 - tt) + mid[0] * tt)
            g = int(top[1] * (1 - tt) + mid[1] * tt)
            b = int(top[2] * (1 - tt) + mid[2] * tt)
        else:
            tt = (t - 0.55) / 0.45
            r = int(mid[0] * (1 - tt) + bot[0] * tt)
            g = int(mid[1] * (1 - tt) + bot[1] * tt)
            b = int(mid[2] * (1 - tt) + bot[2] * tt)
        draw.line((0, y, w, y), fill=(r, g, b))

    im = base.convert("RGBA")

    # Clouds: soft noise masked near top
    clouds = _noise_layer((w, h), amount=90, blur=10)
    clouds = ImageEnhance.Contrast(clouds).enhance(1.35)
    clouds = ImageEnhance.Brightness(clouds).enhance(1.15)
    clouds_rgba = Image.new("RGBA", (w, h), (255, 255, 255, 0))
    clouds_px = clouds.load()
    cr_px = clouds_rgba.load()
    for y in range(int(h * 0.55)):
        fade = 1 - (y / (h * 0.55)) * 0.9
        for x in range(w):
            v = clouds_px[x, y]
            a = int((v / 255) * 110 * fade)
            cr_px[x, y] = (255, 255, 255, a)
    clouds_rgba = clouds_rgba.filter(ImageFilter.GaussianBlur(2))
    im.alpha_composite(clouds_rgba)

    # Mountains: two layers with texture
    def ridge(y_base: float, amp: float, col: tuple[int, int, int, int], blur: float, grain: int) -> None:
        ridge_im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        rdraw = ImageDraw.Draw(ridge_im)
        pts = []
        for i in range(0, 18):
            t = i / 17
            x = int(w * t)
            y = int(
                h
                * (
                    y_base
                    + amp * math.sin(t * math.pi * (1.2 + random.random() * 0.4) + random.random())
                    + 0.03 * math.sin(t * math.pi * 5.1 + 0.7)
                )
            )
            pts.append((x, y))
        pts += [(w, h), (0, h)]
        rdraw.polygon(pts, fill=col)

        # texture
        tex = _noise_layer((w, h), amount=grain, blur=6)
        tex = ImageEnhance.Contrast(tex).enhance(1.5)
        tex_rgba = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        tpx = tex.load()
        tr = tex_rgba.load()
        for y in range(h):
            for x in range(w):
                v = tpx[x, y]
                a = int((v / 255) * 55)
                tr[x, y] = (255, 255, 255, a)
        ridge_im = ImageChops.overlay(ridge_im, tex_rgba)
        ridge_im = ridge_im.filter(ImageFilter.GaussianBlur(blur))
        im.alpha_composite(ridge_im)

    ridge(0.48, 0.06, (30, 54, 78, 175), blur=1.6, grain=70)
    ridge(0.57, 0.06, (12, 26, 38, 230), blur=0.8, grain=85)

    # Haze near horizon
    haze = Image.new("RGBA", (w, h), (255, 255, 255, 0))
    hdraw = ImageDraw.Draw(haze)
    for i in range(10):
        a = int(28 * (1 - i / 9))
        y1 = int(h * (0.44 + i * 0.02))
        hdraw.rectangle((0, y1, w, y1 + int(h * 0.08)), fill=(255, 255, 255, a))
    haze = haze.filter(ImageFilter.GaussianBlur(18))
    im.alpha_composite(haze)

    # Sun glow
    im.alpha_composite(_radial_light((w, h), center=(int(w * 0.22), int(h * 0.22)), radius=320, color=(255, 255, 255, 120)))

    # Film grain
    grain = _noise_layer((w, h), amount=60, blur=0.6)
    grain = ImageEnhance.Contrast(grain).enhance(1.8)
    g = grain.convert("RGBA")
    gp = g.load()
    for y in range(h):
        for x in range(w):
            v = gp[x, y][0]
            a = int((v / 255) * 28)
            gp[x, y] = (255, 255, 255, a)
    im.alpha_composite(g)

    # Vignette
    vignette = Image.new("L", (w, h), 0)
    vdraw = ImageDraw.Draw(vignette)
    for i in range(18):
        inset = int(i * 20)
        a = int(10 + i * 7)
        vdraw.rounded_rectangle((inset, inset, w - inset, h - inset), radius=120, outline=a, width=6)
    vignette = vignette.filter(ImageFilter.GaussianBlur(24))
    v_rgba = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    vp = vignette.load()
    vr = v_rgba.load()
    for y in range(h):
        for x in range(w):
            vr[x, y] = (0, 0, 0, vp[x, y])
    im.alpha_composite(v_rgba)

    return im


def _glass_sheet(im: Image.Image, theme: Theme, top_y: int, radius: int = 54) -> Image.Image:
    w, h = im.size
    sheet_box = (24, top_y, w - 24, h - 24)

    # Blur only the region under the sheet
    bg = im.copy()
    region = bg.crop(sheet_box).filter(ImageFilter.GaussianBlur(18))
    bg.paste(region, sheet_box)

    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    _rounded(draw, sheet_box, r=radius, fill=theme.sheet_fill, outline=theme.sheet_border, w=2)
    # Handle
    hx1 = w // 2 - 70
    hx2 = w // 2 + 70
    hy = top_y + 18
    _rounded(draw, (hx1, hy, hx2, hy + 10), r=999, fill=(255, 255, 255, 70), outline=None, w=0)

    bg.alpha_composite(overlay)
    return bg


def _primary_button(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], theme: Theme, text: str, font: ImageFont.ImageFont) -> None:
    _rounded(draw, box, r=28, fill=theme.accent + (255,), outline=None, w=0)
    b = draw.textbbox((0, 0), text, font=font)
    tw = b[2] - b[0]
    th = b[3] - b[1]
    x1, y1, x2, y2 = box
    draw.text(((x1 + x2 - tw) // 2, (y1 + y2 - th) // 2 - 2), text, font=font, fill=theme.accent_text)


def _pill(draw: ImageDraw.ImageDraw, x: int, y: int, text: str, fonts: dict[str, ImageFont.ImageFont], theme: Theme) -> int:
    b = draw.textbbox((0, 0), text, font=fonts["b2"])
    tw = b[2] - b[0]
    th = b[3] - b[1]
    pad_x, pad_y = 18, 12
    w = tw + pad_x * 2
    h = th + pad_y * 2
    _rounded(draw, (x, y, x + w, y + h), r=999, fill=(255, 255, 255, 26), outline=(255, 255, 255, 46), w=2)
    draw.text((x + pad_x, y + pad_y - 1), text, font=fonts["b2"], fill=theme.text)
    return w


def _nav(im: Image.Image, theme: Theme, active: int = 0) -> None:
    w, h = im.size
    nav_h = 124
    box = (24, h - nav_h - 24, w - 24, h - 24)

    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    _rounded(draw, box, r=44, fill=theme.nav_fill, outline=theme.nav_border, w=2)

    cx = [int((w - 48) * (i + 0.5) / 5) + 24 for i in range(5)]
    cy = h - nav_h - 24 + 52

    def col(i: int) -> tuple[int, int, int]:
        return theme.text if i == active else theme.text_muted

    for i in range(5):
        c = col(i)
        x = cx[i]
        y = cy
        if i == 0:  # home
            draw.polygon([(x - 22, y + 10), (x, y - 16), (x + 22, y + 10)], outline=c)
            draw.rectangle((x - 16, y + 10, x + 16, y + 32), outline=c, width=3)
        elif i == 1:  # pin
            draw.ellipse((x - 16, y - 16, x + 16, y + 16), outline=c, width=3)
            draw.polygon([(x, y + 38), (x - 10, y + 8), (x + 10, y + 8)], outline=c)
            draw.ellipse((x - 4, y - 4, x + 4, y + 4), fill=c)
        elif i == 2:  # mic
            draw.rounded_rectangle((x - 12, y - 18, x + 12, y + 18), radius=10, outline=c, width=3)
            draw.arc((x - 22, y - 8, x + 22, y + 34), start=200, end=-20, fill=c, width=3)
            draw.line((x, y + 34, x, y + 46), fill=c, width=3)
        elif i == 3:  # lock
            draw.rounded_rectangle((x - 18, y - 2, x + 18, y + 28), radius=10, outline=c, width=3)
            draw.arc((x - 16, y - 26, x + 16, y + 6), start=200, end=-20, fill=c, width=3)
            draw.ellipse((x - 3, y + 10, x + 3, y + 16), fill=c)
        elif i == 4:  # user
            draw.ellipse((x - 14, y - 16, x + 14, y + 12), outline=c, width=3)
            draw.arc((x - 22, y + 6, x + 22, y + 46), start=200, end=-20, fill=c, width=3)

        if i == active:
            draw.ellipse((x - 5, y + 54, x + 5, y + 64), fill=theme.accent)

    im.alpha_composite(overlay)


def screen_onboarding(w: int, h: int, theme: Theme, fonts: dict[str, ImageFont.ImageFont]) -> Image.Image:
    im = _photo_background(w, h, seed=11)
    draw = ImageDraw.Draw(im)
    _status_bar(draw, w, fonts, theme.text)

    # Title block (like ref)
    draw.text((56, 210), "CONZIA", font=fonts["title"], fill=theme.text)
    y = 290
    y = _paragraph(draw, 56, y, "Ver claro.", fonts["b"], theme.text, max_w=w - 112, lh=38)
    y += 22

    # Small meta row (right)
    draw.ellipse((w - 210, 300, w - 164, 346), outline=(255, 255, 255, 80), width=2)
    draw.text((w - 154, 304), "Local", font=fonts["cap"], fill=theme.text)

    # Bottom sheet
    sheet_top = int(h * 0.58)
    im = _glass_sheet(im, theme, top_y=sheet_top)
    draw = ImageDraw.Draw(im)

    x = 56
    y = sheet_top + 62
    draw.text((x, y), "INFORMACIÓN", font=fonts["cap2"], fill=theme.text_muted)
    y += 42
    draw.text((x, y), "Qué vas a hacer aquí", font=fonts["h"], fill=theme.text)
    y += 54
    y = _paragraph(
        draw,
        x,
        y,
        "Una pregunta por vez. Tú decides cuándo pedir lectura. "
        "La Bóveda está fuera del sistema.",
        font=fonts["b2"],
        fill=theme.text_muted,
        max_w=w - 112,
        lh=36,
    )

    # Chips row (inviting, not form)
    y += 26
    cx = x
    for label in ["Privado", "Directo", "Sin drama"]:
        cw = _pill(draw, cx, y, label, fonts, theme)
        cx += cw + 14

    # CTA
    _primary_button(draw, (56, h - 220, w - 56, h - 140), theme, "ENTRAR", fonts["b"])
    return im.convert("RGB")


def screen_login(w: int, h: int, theme: Theme, fonts: dict[str, ImageFont.ImageFont]) -> Image.Image:
    im = _photo_background(w, h, seed=12)
    draw = ImageDraw.Draw(im)
    _status_bar(draw, w, fonts, theme.text)

    draw.text((56, 190), "Acceso", font=fonts["title2"], fill=theme.text)
    _paragraph(
        draw,
        56,
        260,
        "Entra sin cuenta. Si creas cuenta, es solo para sincronizar (opt‑in).",
        font=fonts["b2"],
        fill=theme.text_muted,
        max_w=w - 112,
        lh=36,
    )

    sheet_top = int(h * 0.43)
    im = _glass_sheet(im, theme, top_y=sheet_top)
    draw = ImageDraw.Draw(im)

    # fields (soft, native)
    def field(y: int, label: str) -> None:
        _rounded(draw, (56, y, w - 56, y + 96), r=26, fill=(255, 255, 255, 28), outline=(255, 255, 255, 55), w=2)
        draw.text((84, y + 30), label, font=fonts["b2"], fill=theme.text_muted)

    y = sheet_top + 80
    field(y, "Correo")
    y += 120
    field(y, "Contraseña")
    y += 140

    _primary_button(draw, (56, y, w - 56, y + 92), theme, "CONTINUAR", fonts["b"])
    y += 112

    _rounded(draw, (56, y, w - 56, y + 92), r=28, fill=(0, 0, 0, 0), outline=(255, 255, 255, 60), w=2)
    b = draw.textbbox((0, 0), "ENTRAR SIN CUENTA", font=fonts["b"])
    tw = b[2] - b[0]
    th = b[3] - b[1]
    draw.text(((w - tw) // 2, y + (92 - th) // 2 - 2), "ENTRAR SIN CUENTA", font=fonts["b"], fill=theme.text)

    return im.convert("RGB")


def screen_dashboard(w: int, h: int, theme: Theme, fonts: dict[str, ImageFont.ImageFont]) -> Image.Image:
    im = _photo_background(w, h, seed=13).filter(ImageFilter.GaussianBlur(0.4))
    draw = ImageDraw.Draw(im)
    _status_bar(draw, w, fonts, theme.text)

    draw.text((56, 170), "Hola, [Nombre].", font=fonts["title2"], fill=theme.text)
    _paragraph(draw, 56, 240, "Hoy: nombra el hecho sin adornarlo.", fonts["b2"], theme.text_muted, max_w=w - 112, lh=36)

    sheet_top = int(h * 0.47)
    im = _glass_sheet(im, theme, top_y=sheet_top)
    draw = ImageDraw.Draw(im)

    x = 56
    y = sheet_top + 62
    draw.text((x, y), "TU PRÓXIMO PASO", font=fonts["cap2"], fill=theme.text_muted)
    y += 42
    draw.text((x, y), "Habla 60s.", font=fonts["h"], fill=theme.text)
    y += 54
    _paragraph(
        draw,
        x,
        y,
        "“¿Dónde cediste hoy para evitar incomodidad?”",
        font=fonts["b"],
        fill=theme.text,
        max_w=w - 112,
        lh=40,
    )

    _primary_button(draw, (56, sheet_top + 330, w - 56, sheet_top + 422), theme, "HABLAR", fonts["b"])

    # Quick actions row
    ay = sheet_top + 452
    ax = 56
    for label in ["Mapa", "Caja", "Bóveda"]:
        w_p = _pill(draw, ax, ay, label, fonts, theme)
        ax += w_p + 14

    _nav(im, theme, active=0)
    return im.convert("RGB")


def main() -> None:
    w, h = 780, 1688  # 390x844 @2x
    out_dir = Path(__file__).resolve().parent
    out_dir.mkdir(parents=True, exist_ok=True)
    fonts = _fonts()

    theme = Theme(
        accent=_hex("#7D5C6B"),
        accent_text=_hex("#FFFFFF"),
        text=_hex("#F4F7FB"),
        text_muted=_hex("#C7D2DC"),
        sheet_fill=(8, 12, 18, 210),
        sheet_border=(255, 255, 255, 45),
        nav_fill=(8, 12, 18, 185),
        nav_border=(255, 255, 255, 35),
    )

    screens = {
        "mirat_native_v3_onboarding": screen_onboarding,
        "mirat_native_v3_login": screen_login,
        "mirat_native_v3_dashboard": screen_dashboard,
    }

    for name, builder in screens.items():
        im = builder(w, h, theme, fonts)
        path = out_dir / f"{name}.png"
        im.save(path, format="PNG", optimize=True)
        print("wrote", path)


if __name__ == "__main__":
    main()
