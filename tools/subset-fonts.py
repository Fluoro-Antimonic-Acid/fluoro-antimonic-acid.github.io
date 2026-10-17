"""Subset the site's web fonts to the characters the site actually uses.

Usage (from C:\\Workspace\\pi-web):
    node build.mjs                                   # writes tools/serif-chars.needed.txt
    .venv-fonts\\Scripts\\python tools\\subset-fonts.py  # writes assets/fonts/*.woff2
    node build.mjs                                   # copies the fonts into dist/

Source fonts (SIL OFL 1.1) live in fonts-src/:
    NotoSerifSC-SemiBold.otf   https://github.com/notofonts/noto-cjk
    JetBrainsMono-Regular.ttf  https://github.com/JetBrains/JetBrainsMono
"""
from pathlib import Path
import shutil

from fontTools import subset

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "fonts-src"
OUT = ROOT / "assets" / "fonts"
TOOLS = ROOT / "tools"

ASCII = "".join(chr(c) for c in range(0x20, 0x7F))
CJK_PUNCT = "，。、：；！？「」『』（）《》—…·“”‘’　"
MONO_EXTRA = "→←↑↓↗◆·×—–…°±μΩ²³≈≤≥"


def build(src: Path, dst: Path, text: str) -> list[str]:
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.name_languages = ["*"]
    opts.notdef_outline = True
    font = subset.load_font(str(src), opts)
    sub = subset.Subsetter(options=opts)
    sub.populate(text=text)
    sub.subset(font)
    subset.save_font(font, str(dst), opts)
    cmap = font.getBestCmap()
    return sorted({c for c in text if not c.isspace() and ord(c) not in cmap})


def main() -> None:
    needed_file = TOOLS / "serif-chars.needed.txt"
    if not needed_file.exists():
        raise SystemExit("run `node build.mjs` first (tools/serif-chars.needed.txt missing)")
    serif_chars = needed_file.read_text(encoding="utf-8")
    serif_text = "".join(sorted(set(serif_chars + ASCII + CJK_PUNCT)))

    OUT.mkdir(parents=True, exist_ok=True)
    missing = build(SRC / "NotoSerifSC-SemiBold.otf", OUT / "serif-sc-600.woff2", serif_text)
    if missing:
        print("serif: not in source font (will fall back):", "".join(missing))
    missing = build(SRC / "JetBrainsMono-Regular.ttf", OUT / "mono-400.woff2", ASCII + MONO_EXTRA)
    if missing:
        print("mono: not in source font (will fall back):", "".join(missing))

    # licences must travel with the fonts (OFL 1.1, section 2)
    shutil.copyfile(SRC / "LICENSE-NotoSerifCJK.txt", OUT / "OFL-NotoSerifSC.txt")
    shutil.copyfile(SRC / "OFL-JetBrainsMono.txt", OUT / "OFL-JetBrainsMono.txt")

    # record of what the serif subset covers; build.mjs warns when new characters appear
    (TOOLS / "serif-chars.txt").write_text(serif_chars, encoding="utf-8")

    for f in sorted(OUT.glob("*.woff2")):
        print(f"{f.name}: {f.stat().st_size / 1024:.1f} KB")
    print(f"serif subset: {len(serif_text)} characters")


if __name__ == "__main__":
    main()
