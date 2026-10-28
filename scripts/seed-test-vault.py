"""Add synthetic UI fixtures through a local daemon. Requires Pillow and FFmpeg.

Only the dedicated trove-test-ui/vault is accepted, and /api/mediaroot must
match before any file or API write. Existing records and files are skipped.
No remote media, cookies, queue operations, SQL writes or daemon restarts.
"""

import argparse
import datetime as dt
import json
import shutil
import subprocess
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

from PIL import Image, ImageDraw, ImageFont

NAMES = [
    "Alex Vale",
    "Blair Rowan",
    "Casey Moon",
    "Drew Rivers",
    "Emery Lane",
    "Finley Hart",
    "Gray Ellis",
    "Harper Quinn",
    "Indigo West",
    "Jordan Reed",
    "Kai Morgan",
    "Logan Sky",
    "Marley Stone",
    "Noel Avery",
    "Oakley Sage",
    "Parker Rose",
    "Quinn Ash",
    "Remy North",
    "Sasha Lake",
    "Taylor Wynn",
    "Uma Dawn",
    "Val Arden",
    "Winter Cole",
    "Xan Brooks",
    "Yael Fern",
    "Zion Ray",
    "Avery & Robin",
    "Morgan with a Longer Display Name",
    "Cameron Blue",
    "Dakota Moss",
    "Eden Sol",
    "Frankie Ocean",
]
TAGS = [
    "After hours",
    "Amber light",
    "Architecture",
    "Behind the scenes",
    "Blue hour",
    "City lights",
    "Close-up",
    "Coastal",
    "Color study",
    "Daylight",
    "Desert",
    "Editorial",
    "Evening",
    "Film grain",
    "Forest",
    "Golden hour",
    "Indoors",
    "Landscape",
    "Minimal",
    "Monochrome",
    "Motion",
    "Neon",
    "Night drive",
    "Ocean",
    "Outdoors",
    "Portrait",
    "Quiet moments",
    "Rain",
    "Reflections",
    "Retro",
    "Soft focus",
    "Studio",
    "Sunrise",
    "Travel",
    "Warm tones",
    "Weekend",
]
PALETTE = [
    (173, 126, 207),
    (209, 126, 155),
    (112, 165, 212),
    (218, 166, 91),
    (109, 182, 158),
    (187, 140, 108),
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", required=True, type=Path)
    parser.add_argument("--server", default="http://127.0.0.1:8899")
    parser.add_argument("--ffmpeg", required=True, type=Path)
    args = parser.parse_args()
    root = args.root.resolve(strict=True)
    assert root.name == "vault" and root.parent.name == "trove-test-ui", (
        "Dedicated test vault only"
    )
    assert urlparse(args.server).hostname in ("127.0.0.1", "localhost"), "Loopback only"

    def api(route, data=None):
        request = urllib.request.Request(
            args.server.rstrip("/") + "/api/" + route,
            data=None if data is None else json.dumps(data).encode(),
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)

    assert Path(api("mediaroot")).resolve() == root, (
        "Daemon vault mismatch; no writes made"
    )
    folder = root / "media" / "ui-synthetic-v1"
    assert folder.resolve().is_relative_to(root), "Fixture directory escapes test vault"
    folder.mkdir(exist_ok=True)
    people = {row["name"] for row in api("models")}
    videos = {(row["site"], row["id"]) for row in api("videos?limit=10000")}
    photos = {row["id"] for row in api("photos/all")}
    font = ImageFont.load_default(size=24)

    def artwork(path, index, size, portrait=False):
        if path.exists():
            return
        w, h = size
        color = PALETTE[index % len(PALETTE)]
        image = Image.new("RGB", size)
        draw = ImageDraw.Draw(image)
        for y in range(h):
            fade = 0.16 + 0.42 * (1 - y / h)
            draw.line((0, y, w, y), fill=tuple(int(c * fade) for c in color))
        if portrait:
            draw.ellipse((w * 0.31, h * 0.15, w * 0.69, h * 0.46), fill=color)
            draw.rounded_rectangle(
                (w * 0.14, h * 0.49, w * 0.86, h * 1.08),
                radius=int(w * 0.30),
                fill=tuple(int(c * 0.7) for c in color),
            )
        else:
            draw.ellipse(
                (w * 0.50, h * 0.10, w * 0.86, h * 0.10 + w * 0.36), fill=color
            )
            for n in range(4):
                y = h * (0.48 + n * 0.12)
                draw.polygon(
                    [
                        (0, y + h * 0.13),
                        (w * 0.28, y),
                        (w * 0.60, y + h * 0.18),
                        (w, y - h * 0.08),
                        (w, h),
                        (0, h),
                    ],
                    fill=tuple(int(c * (0.45 - n * 0.075)) for c in color),
                )
        draw.text(
            (24, h - 48), f"SYNTHETIC / {index + 1:03}", fill=(242, 235, 225), font=font
        )
        image.save(path, quality=90)

    names = ["Demo " + name for name in NAMES]
    for i, name in enumerate(names):
        cover = folder / f"person-{i:02}.jpg"
        artwork(cover, i, (600, 750), True)
        if name not in people:
            api("people/create", {"name": name})
            api(
                "savemodelinfo",
                {
                    "name": name,
                    "nickname": NAMES[i] if i % 4 == 0 else "",
                    "bio": f"Fictional UI test profile. {TAGS[i]} and {TAGS[(i + 7) % 36].lower()} studies. All media is generated locally.",
                    "links": [
                        {"label": "Example portfolio", "url": "https://example.com"}
                    ]
                    if i % 3 == 0
                    else [],
                },
            )
            if i % 7 != 0:
                api("setmodelcover", {"name": name, "cover": str(cover)})

    templates = []
    for i, (w, h) in enumerate([(640, 360), (360, 640), (480, 480)]):
        path = folder / f"animation-{i}.mp4"
        if not path.exists():
            subprocess.run(
                [
                    str(args.ffmpeg),
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-f",
                    "lavfi",
                    "-i",
                    f"testsrc2=size={w}x{h}:rate=24",
                    "-t",
                    "8",
                    "-an",
                    "-c:v",
                    "libx264",
                    "-preset",
                    "ultrafast",
                    "-crf",
                    "28",
                    "-pix_fmt",
                    "yuv420p",
                    "-movflags",
                    "+faststart",
                    str(path),
                ],
                check=True,
            )
        templates.append((path, w, h))

    for i in range(96):
        identifier = f"ui-synthetic-v1-{i:03}"
        stamp = (
            dt.datetime(2026, 10, 1) - dt.timedelta(days=i, hours=i % 12)
        ).isoformat()
        person = names[i % 28]  # Four empty profiles exercise coverage filters.
        site = ["Synthetic Studio", "Synthetic Travel", "Synthetic Motion"][i % 3]
        thumb = folder / f"still-{i:03}.jpg"
        artwork(thumb, i, (640, 800) if i % 3 == 1 else (960, 540))
        if (site, identifier) not in videos:
            template, w, h = templates[i % 3]
            clip = folder / f"clip-{i:03}.mp4"
            if not clip.exists():
                shutil.copyfile(template, clip)
            api(
                "ingest/video",
                {
                    "site": site,
                    "id": identifier,
                    "title": f"{TAGS[i % 36]} / Study {i + 1:02}",
                    "filepath": str(clip),
                    "filename": clip.name,
                    "thumbnail": str(thumb),
                    "duration": 8,
                    "width": w,
                    "height": h,
                    "ext": "mp4",
                    "filesize": clip.stat().st_size,
                    "added": stamp,
                    "favorite": i % 7 == 0,
                    "models": [] if i % 13 == 0 else [person],
                    "labels": []
                    if i % 11 == 0
                    else [TAGS[i % 36], TAGS[(i + 5) % 36], TAGS[(i + 17) % 36]],
                },
            )
            if i % 4 == 1:
                api(
                    "position",
                    {"site": site, "id": identifier, "position": 3, "duration": 8},
                )
        if identifier not in photos:
            photo = folder / f"photo-{i:03}.jpg"
            artwork(photo, i + 9, [(600, 800), (960, 540), (720, 720)][i % 3])
            api(
                "ingest/photo",
                {
                    "id": identifier,
                    "model": "" if i % 17 == 0 else person,
                    "album": [
                        "Color studies",
                        "Coastal light",
                        "Studio sketches",
                        "Night scenes",
                    ][i % 4],
                    "filepath": str(photo),
                    "filename": photo.name,
                    "added": stamp,
                },
            )
    report = {
        "people": len(names),
        "tags": len(TAGS),
        "videos": 96,
        "photos": 96,
        "note": "Synthetic fixtures only. Existing records were skipped; no media deleted.",
    }
    (folder / "fixture-manifest.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )
    print(json.dumps(report))


if __name__ == "__main__":
    main()
