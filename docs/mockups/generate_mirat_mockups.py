from __future__ import annotations

import math
import os
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


@dataclass(frozen=True)
class Theme:
    key: str
    name: str
    bg: tuple[int, int, int]
    panel: tuple[int, int, int]
    card: tuple[int, int, int]
    border: tuple[int, int, int]
    text: tuple[int, int, int]
    text_muted: tuple[int, int, int]
    accent: tuple[int, int, int]
    accent_2: tuple[int, int, int]
    overlay: tuple[int, int, int, int]


def _hex(hex_color: str) -> tuple[int, int, int]:
    hex_color = hex_color.strip().lstrip("#")
    return (int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16))


def _load_font(path: str | None, size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    if path and os.path.exists(path):
        try:
            return ImageFont.truetype(path, size=size)
        except Exception:
            pass
    return ImageFont.load_default()


def _wrap_text(text: str, font: ImageFont.ImageFont, max_width: int, draw: ImageDraw.ImageDraw) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current: list[str] = []

    def width_of(s: str) -> int:
        bbox = draw.textbbox((0, 0), s, font=font)
        return bbox[2] - bbox[0]

    for w in words:
        trial = " ".join([*current, w]).strip()
        if not trial:
            continue
        if width_of(trial) <= max_width:
            current.append(w)
            continue
        if current:
            lines.append(" ".join(current))
            current = [w]
        else:
            lines.append(w)
    if current:
        lines.append(" ".join(current))
    return lines


def _text(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    font: ImageFont.ImageFont,
    fill: tuple[int, int, int],
    max_width: int | None = None,
    line_height: int | None = None,
) -> tuple[int, int]:
    x, y = xy
    if max_width is None:
        draw.text((x, y), text, font=font, fill=fill)
        bbox = draw.textbbox((x, y), text, font=font)
        return (bbox[2], bbox[3])

    lh = line_height
    if lh is None:
        bbox = draw.textbbox((0, 0), "Ag", font=font)
        lh = int((bbox[3] - bbox[1]) * 1.35)

    lines = _wrap_text(text, font=font, max_width=max_width, draw=draw)
    for i, line in enumerate(lines):
        draw.text((x, y + i * lh), line, font=font, fill=fill)
    end_y = y + len(lines) * lh
    return (x + max_width, end_y)


def _rounded_rect(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int, int, int],
    radius: int,
    fill: tuple[int, int, int] | None = None,
    outline: tuple[int, int, int] | None = None,
    width: int = 2,
) -> None:
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def _button(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    text: str,
    font: ImageFont.ImageFont,
    fill: tuple[int, int, int],
    text_color: tuple[int, int, int],
    outline: tuple[int, int, int] | None = None,
) -> None:
    _rounded_rect(draw, box, radius=22, fill=fill, outline=outline, width=2)
    x1, y1, x2, y2 = box
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text(((x1 + x2 - tw) // 2, (y1 + y2 - th) // 2 - 2), text, font=font, fill=text_color)


def _pill(
    draw: ImageDraw.ImageDraw,
    x: int,
    y: int,
    label: str,
    font: ImageFont.ImageFont,
    bg: tuple[int, int, int],
    fg: tuple[int, int, int],
    border: tuple[int, int, int],
) -> int:
    bbox = draw.textbbox((0, 0), label, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    pad_x, pad_y = 18, 12
    w = tw + pad_x * 2
    h = th + pad_y * 2
    _rounded_rect(draw, (x, y, x + w, y + h), radius=999, fill=bg, outline=border, width=2)
    draw.text((x + pad_x, y + pad_y - 2), label, font=font, fill=fg)
    return w


def _sparkline(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int, color: tuple[int, int, int]) -> None:
    pts = []
    for i in range(10):
        t = i / 9
        yy = y + h * (0.55 + 0.25 * math.sin(t * math.pi * 2.3) + 0.08 * math.sin(t * math.pi * 7.1))
        xx = x + int(w * t)
        pts.append((xx, int(yy)))
    draw.line(pts, fill=color, width=4, joint="curve")


def _infinity_mark(draw: ImageDraw.ImageDraw, cx: int, cy: int, size: int, color: tuple[int, int, int]) -> None:
    w = size
    h = int(size * 0.6)
    r = h // 2
    left = (cx - w // 2, cy - h // 2, cx - w // 2 + h, cy + h // 2)
    right = (cx + w // 2 - h, cy - h // 2, cx + w // 2, cy + h // 2)
    draw.arc(left, start=40, end=320, fill=color, width=10)
    draw.arc(right, start=220, end=140, fill=color, width=10)
    draw.line([(cx - r, cy), (cx + r, cy)], fill=color, width=10)


def _base_canvas(width: int, height: int, theme: Theme) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    im = Image.new("RGB", (width, height), theme.bg)
    return im, ImageDraw.Draw(im)


def _common_fonts() -> dict[str, ImageFont.ImageFont]:
    font_title = "/System/Library/Fonts/NewYork.ttf"
    font_body = "/System/Library/Fonts/SFCompact.ttf"
    font_mono = "/System/Library/Fonts/SFNSMono.ttf"

    return {
        "title_64": _load_font(font_title, 64),
        "title_48": _load_font(font_title, 48),
        "body_36": _load_font(font_body, 36),
        "body_32": _load_font(font_body, 32),
        "body_28": _load_font(font_body, 28),
        "body_24": _load_font(font_body, 24),
        "mono_24": _load_font(font_mono, 24),
    }


def screen_onboarding(width: int, height: int, theme: Theme, fonts: dict[str, ImageFont.ImageFont]) -> Image.Image:
    im, draw = _base_canvas(width, height, theme)
    margin = 64

    _text(draw, (margin, 130), "CONZIA", font=fonts["title_64"], fill=theme.text)
    _text(
        draw,
        (margin, 240),
        "Una sala silenciosa. Sin juicio. Sin anestesia.",
        font=fonts["body_32"],
        fill=theme.text_muted,
        max_width=width - margin * 2,
    )

    _infinity_mark(draw, width // 2, height // 2 - 40, size=300, color=theme.accent)

    _text(
        draw,
        (margin, height // 2 + 160),
        "Lo que no se nombra, se repite.",
        font=fonts["title_48"],
        fill=theme.text,
        max_width=width - margin * 2,
        line_height=66,
    )

    _button(
        draw,
        (margin, height - 210, width - margin, height - 120),
        "ENTRAR",
        font=fonts["body_32"],
        fill=theme.accent,
        text_color=(255, 255, 255),
    )
    _text(
        draw,
        (margin, height - 95),
        "Datos en tu dispositivo. Sin espectáculo.",
        font=fonts["body_24"],
        fill=theme.text_muted,
        max_width=width - margin * 2,
    )
    return im


def screen_contrato(width: int, height: int, theme: Theme, fonts: dict[str, ImageFont.ImageFont]) -> Image.Image:
    im, draw = _base_canvas(width, height, theme)
    margin = 64

    _text(draw, (margin, 120), "Antes de empezar", font=fonts["title_48"], fill=theme.text)
    _text(
        draw,
        (margin, 200),
        "CONZIA no es un asistente. No está para hacerte sentir cómodo. Está para ayudarte a mirar lo que evitas.",
        font=fonts["body_32"],
        fill=theme.text_muted,
        max_width=width - margin * 2,
        line_height=48,
    )

    _rounded_rect(
        draw,
        (margin, 420, width - margin, 840),
        radius=26,
        fill=theme.card,
        outline=theme.border,
        width=2,
    )
    _text(
        draw,
        (margin + 36, 460),
        "Reglas:",
        font=fonts["body_32"],
        fill=theme.text,
    )
    rules = [
        "• No diagnóstico. No promesas clínicas.",
        "• Una pregunta por vez.",
        "• Tú decides cuándo pedir lectura.",
        "• La Bóveda está fuera del sistema.",
    ]
    y = 520
    for r in rules:
        _text(
            draw,
            (margin + 36, y),
            r,
            font=fonts["body_28"],
            fill=theme.text_muted,
            max_width=width - margin * 2 - 72,
            line_height=42,
        )
        y += 64

    _button(
        draw,
        (margin, height - 260, width - margin, height - 170),
        "ACEPTO",
        font=fonts["body_32"],
        fill=theme.accent,
        text_color=(255, 255, 255),
    )
    _button(
        draw,
        (margin, height - 150, width - margin, height - 60),
        "NO AHORA",
        font=fonts["body_32"],
        fill=theme.bg,
        text_color=theme.text,
        outline=theme.border,
    )
    return im


def screen_acceso(width: int, height: int, theme: Theme, fonts: dict[str, ImageFont.ImageFont]) -> Image.Image:
    im, draw = _base_canvas(width, height, theme)
    margin = 64

    _text(draw, (margin, 120), "Acceso", font=fonts["title_48"], fill=theme.text)
    _text(
        draw,
        (margin, 200),
        "Puedes entrar sin cuenta. Si creas cuenta, es solo para sincronizar (opt‑in).",
        font=fonts["body_28"],
        fill=theme.text_muted,
        max_width=width - margin * 2,
        line_height=42,
    )

    _rounded_rect(draw, (margin, 330, width - margin, 430), radius=18, fill=theme.card, outline=theme.border)
    _text(draw, (margin + 24, 360), "Correo", font=fonts["body_28"], fill=theme.text_muted)

    _rounded_rect(draw, (margin, 470, width - margin, 570), radius=18, fill=theme.card, outline=theme.border)
    _text(draw, (margin + 24, 500), "Contraseña", font=fonts["body_28"], fill=theme.text_muted)

    _button(
        draw,
        (margin, 640, width - margin, 730),
        "CONTINUAR",
        font=fonts["body_32"],
        fill=theme.accent,
        text_color=(255, 255, 255),
    )
    _button(
        draw,
        (margin, 760, width - margin, 850),
        "ENTRAR SIN CUENTA",
        font=fonts["body_32"],
        fill=theme.bg,
        text_color=theme.text,
        outline=theme.border,
    )

    _text(
        draw,
        (margin, height - 130),
        "Privacidad: CONZIA funciona local. Sync es opcional.",
        font=fonts["body_24"],
        fill=theme.text_muted,
        max_width=width - margin * 2,
    )
    return im


def screen_sesion(width: int, height: int, theme: Theme, fonts: dict[str, ImageFont.ImageFont]) -> Image.Image:
    im, draw = _base_canvas(width, height, theme)
    margin = 56

    _text(draw, (margin, 110), "Hola, [Nombre].", font=fonts["title_48"], fill=theme.text)
    _text(
        draw,
        (margin, 180),
        "Hoy no necesitas explicarte. Solo nombra el hecho.",
        font=fonts["body_28"],
        fill=theme.text_muted,
        max_width=width - margin * 2,
    )

    _rounded_rect(
        draw,
        (margin, 270, width - margin, 690),
        radius=30,
        fill=theme.panel,
        outline=theme.border,
        width=2,
    )
    _text(draw, (margin + 36, 310), "Tu próximo paso", font=fonts["body_32"], fill=theme.accent_2)
    _text(
        draw,
        (margin + 36, 370),
        "Habla 60s sobre esto:\n“¿Dónde cediste hoy para evitar incomodidad?”",
        font=fonts["body_32"],
        fill=theme.text,
        max_width=width - margin * 2 - 72,
        line_height=50,
    )

    _button(
        draw,
        (margin + 36, 560, width - margin - 36, 650),
        "HABLAR",
        font=fonts["body_32"],
        fill=theme.accent,
        text_color=(255, 255, 255),
    )

    _text(draw, (margin, 745), "Mapa · Bóveda · Refugio", font=fonts["body_24"], fill=theme.text_muted)

    # Mini gráfica colapsada
    _rounded_rect(
        draw,
        (margin, 820, width - margin, 980),
        radius=26,
        fill=theme.card,
        outline=theme.border,
        width=2,
    )
    _text(draw, (margin + 28, 852), "Densidad (7 días)", font=fonts["body_28"], fill=theme.text_muted)
    _sparkline(draw, margin + 28, 905, width - margin * 2 - 56, 55, theme.accent_2)

    return im


def screen_menu(width: int, height: int, theme: Theme, fonts: dict[str, ImageFont.ImageFont]) -> Image.Image:
    # Base: sesión de fondo
    base = screen_sesion(width, height, theme, fonts).convert("RGBA")
    overlay = Image.new("RGBA", (width, height), theme.overlay)
    base.alpha_composite(overlay)

    draw = ImageDraw.Draw(base)

    panel_w = int(width * 0.78)
    _rounded_rect(draw, (0, 0, panel_w, height), radius=0, fill=theme.panel, outline=theme.border, width=2)

    x = 48
    y = 120
    _text(draw, (x, y), "CONZIA", font=fonts["title_48"], fill=theme.text)
    y += 86
    _text(draw, (x, y), "Menú", font=fonts["body_28"], fill=theme.text_muted)
    y += 64

    items = ["Mapa", "Caja", "Lecturas", "Integración", "Arquetipos", "Bóveda", "Tests", "Ajustes"]
    for it in items:
        _rounded_rect(draw, (x - 14, y - 10, panel_w - 32, y + 54), radius=18, fill=theme.card, outline=theme.border)
        _text(draw, (x + 18, y + 4), it, font=fonts["body_32"], fill=theme.text)
        y += 84

    return base.convert("RGB")


def screen_espejo_negro(width: int, height: int, theme: Theme, fonts: dict[str, ImageFont.ImageFont]) -> Image.Image:
    im, draw = _base_canvas(width, height, theme)
    margin = 56

    _text(draw, (margin, 110), "Espejo Negro", font=fonts["title_48"], fill=theme.text)
    _text(
        draw,
        (margin, 190),
        "Háblame de la última vez que te traicionaste un poco.",
        font=fonts["body_32"],
        fill=theme.text_muted,
        max_width=width - margin * 2,
        line_height=48,
    )

    _rounded_rect(draw, (margin, 330, width - margin, 640), radius=30, fill=theme.card, outline=theme.border, width=2)
    _text(draw, (margin + 28, 360), "00:45", font=fonts["mono_24"], fill=theme.text_muted)
    _sparkline(draw, margin + 28, 430, width - margin * 2 - 56, 120, theme.accent_2)
    _text(
        draw,
        (margin + 28, 575),
        "Mantén presionado para hablar.",
        font=fonts["body_24"],
        fill=theme.text_muted,
    )

    # Record button
    cx, cy = width // 2, height - 210
    r = 88
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=theme.accent, outline=theme.border, width=2)
    draw.ellipse((cx - 32, cy - 32, cx + 32, cy + 32), fill=(255, 255, 255))
    _text(draw, (margin, height - 92), "Guardar sin lectura · Pedir espejo", font=fonts["body_24"], fill=theme.text_muted)
    return im


def screen_caja(width: int, height: int, theme: Theme, fonts: dict[str, ImageFont.ImageFont]) -> Image.Image:
    im, draw = _base_canvas(width, height, theme)
    margin = 56

    _text(draw, (margin, 110), "Caja", font=fonts["title_48"], fill=theme.text)
    _text(draw, (margin, 190), "Evidencia → Patrón → Historia espejo", font=fonts["body_28"], fill=theme.text_muted)

    # Evidencia
    _rounded_rect(draw, (margin, 270, width - margin, 520), radius=30, fill=theme.card, outline=theme.border, width=2)
    _text(draw, (margin + 28, 300), "Lo que pasó (3 evidencias)", font=fonts["body_28"], fill=theme.text_muted)
    evidence = [
        "• Lun 05 · Cediste tu tiempo para evitar tensión.",
        "• Mié 07 · Pediste perdón por poner un límite.",
        "• Vie 09 · Callaste para que “todo esté bien”.",
    ]
    y = 346
    for e in evidence:
        _text(draw, (margin + 28, y), e, font=fonts["body_28"], fill=theme.text, max_width=width - margin * 2 - 56)
        y += 56

    # Patrón
    _rounded_rect(draw, (margin, 560, width - margin, 720), radius=30, fill=theme.panel, outline=theme.border, width=2)
    _text(draw, (margin + 28, 590), "Patrón", font=fonts["body_28"], fill=theme.text_muted)
    _text(draw, (margin + 28, 628), "Negociación de dignidad", font=fonts["body_36"], fill=theme.text)

    # Historia espejo
    _rounded_rect(draw, (margin, 760, width - margin, 1100), radius=30, fill=theme.card, outline=theme.border, width=2)
    _text(draw, (margin + 28, 790), "Historia espejo", font=fonts["body_28"], fill=theme.text_muted)
    _text(
        draw,
        (margin + 28, 840),
        "Claudia siempre cede un poco para no perder a nadie. "
        "Se vuelve flexible hasta desaparecer. Luego llama a eso “amor”.",
        font=fonts["body_28"],
        fill=theme.text,
        max_width=width - margin * 2 - 56,
        line_height=42,
    )

    _button(
        draw,
        (margin, height - 260, width - margin, height - 170),
        "RUTA A · ACCIÓN MÍNIMA",
        font=fonts["body_28"],
        fill=theme.accent,
        text_color=(255, 255, 255),
    )
    _button(
        draw,
        (margin, height - 150, width - margin, height - 60),
        "RUTA B · PREGUNTA PROFUNDA",
        font=fonts["body_28"],
        fill=theme.bg,
        text_color=theme.text,
        outline=theme.border,
    )
    return im


def main() -> None:
    width, height = 780, 1688
    out_dir = Path(__file__).resolve().parent
    out_dir.mkdir(parents=True, exist_ok=True)

    fonts = _common_fonts()

    themes = [
        Theme(
            key="light",
            name="Light (Sala silenciosa)",
            bg=_hex("#EAE6DF"),
            panel=_hex("#F4F1EB"),
            card=_hex("#FEFDFC"),
            border=_hex("#D7CEC3"),
            text=_hex("#542919"),
            text_muted=_hex("#7E6F62"),
            accent=_hex("#7D5C6B"),
            accent_2=_hex("#A39483"),
            overlay=(0, 0, 0, 90),
        ),
        Theme(
            key="dark",
            name="Dark (Claroscuro)",
            bg=_hex("#2C3E50"),
            panel=_hex("#243241"),
            card=_hex("#34495E"),
            border=_hex("#3E566C"),
            text=_hex("#FDF6E3"),
            text_muted=_hex("#B8C1C7"),
            accent=_hex("#E67E22"),
            accent_2=_hex("#F1C40F"),
            overlay=(0, 0, 0, 120),
        ),
    ]

    builders = {
        "onboarding": screen_onboarding,
        "contrato": screen_contrato,
        "acceso": screen_acceso,
        "sesion": screen_sesion,
        "menu": screen_menu,
        "espejo_negro": screen_espejo_negro,
        "caja": screen_caja,
    }

    for theme in themes:
        for key, builder in builders.items():
            im = builder(width, height, theme, fonts)
            path = out_dir / f"mirat_{theme.key}_{key}.png"
            im.save(path, format="PNG", optimize=True)
            print("wrote", path)


if __name__ == "__main__":
    main()
