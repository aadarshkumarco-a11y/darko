#!/usr/bin/env python3
"""Analyze the Indian flag wave shape across 3 consecutive frames."""
from PIL import Image
import numpy as np

FILES = [
    "/home/z/my-project/download/flag-frame-1.png",
    "/home/z/my-project/download/flag-frame-2.png",
    "/home/z/my-project/download/flag-frame-3.png",
]

# Indian flag colors
# Saffron  ~ (255, 153, 51)
# Green    ~ (19, 136, 8)
SAFFRON = np.array([255, 153, 51], dtype=np.float32)
GREEN   = np.array([19, 136, 8],   dtype=np.float32)

def color_mask(arr, target, tol=40):
    """Return boolean mask where pixel is close to target color."""
    diff = arr[..., :3].astype(np.float32) - target
    dist = np.sqrt((diff ** 2).sum(axis=-1))
    return dist < tol

def bottom_edge_profile(mask):
    """For each column, return the row index of the lowest True pixel (or None)."""
    h, w = mask.shape
    profile = np.full(w, -1, dtype=np.int32)
    cols_with_flag = np.where(mask.any(axis=0))[0]
    if len(cols_with_flag) == 0:
        return profile, (0, 0)
    for c in cols_with_flag:
        rows = np.where(mask[:, c])[0]
        if len(rows):
            profile[c] = rows.max()  # bottom-most flag pixel in this column
    x0, x1 = cols_with_flag.min(), cols_with_flag.max()
    return profile, (x0, x1)

def summarize_profile(profile, x0, x1):
    """Describe the shape of the bottom edge between x0..x1."""
    seg = profile[x0:x1+1]
    seg = seg[seg >= 0]
    if len(seg) == 0:
        return "no flag pixels"
    # Fit a line; residual tells us how non-flat / wavy.
    xs = np.arange(len(seg))
    y_mean = seg.mean()
    y_min, y_max = seg.min(), seg.max()
    # Linear trend
    slope = np.polyfit(xs, seg, 1)[0] if len(seg) > 1 else 0.0
    # Waviness: std-dev of (seg - linear fit)
    if len(seg) > 2:
        fit = np.polyval(np.polyfit(xs, seg, 1), xs)
        resid_std = float(np.std(seg - fit))
    else:
        resid_std = 0.0
    # Count sign changes in second derivative -> peaks/valleys
    if len(seg) > 4:
        d2 = np.diff(seg, n=2)
        sign_changes = int(np.sum(np.diff(np.sign(d2)) != 0))
    else:
        sign_changes = 0
    return {
        "x_range": (int(x0), int(x1)),
        "width": int(x1 - x0),
        "y_mean": float(y_mean),
        "y_min": int(y_min),
        "y_max": int(y_max),
        "amplitude_px": int(y_max - y_min),
        "slope_px_per_col": float(slope),
        "waviness_std_px": resid_std,
        "num_inflections": sign_changes,
    }

results = []
for path in FILES:
    img = Image.open(path).convert("RGB")
    arr = np.array(img)
    h, w, _ = arr.shape
    # Build a combined "flag-colored pixel" mask (saffron OR green OR white-between)
    saff_mask = color_mask(arr, SAFFRON, tol=45)
    green_mask = color_mask(arr, GREEN, tol=45)
    flag_mask = saff_mask | green_mask
    n_flag = int(flag_mask.sum())
    profile, (x0, x1) = bottom_edge_profile(flag_mask)
    stats = summarize_profile(profile, x0, x1)
    results.append({
        "file": path,
        "image_size": (w, h),
        "flag_pixels": n_flag,
        "saffron_pixels": int(saff_mask.sum()),
        "green_pixels": int(green_mask.sum()),
        **stats,
    })

# Print per-frame report
print("=" * 70)
for r in results:
    print(f"\nFrame: {r['file']}")
    print(f"  Image size:        {r['image_size']}")
    print(f"  Flag pixels total: {r['flag_pixels']:,}  "
          f"(saffron={r['saffron_pixels']:,}, green={r['green_pixels']:,})")
    print(f"  Flag x-range:      cols {r['x_range']}  (width={r['width']}px)")
    print(f"  Bottom edge y:     min={r['y_min']}, max={r['y_max']}, "
          f"mean={r['y_mean']:.1f}")
    print(f"  Vertical amplitude of bottom edge: {r['amplitude_px']} px")
    print(f"  Linear slope:      {r['slope_px_per_col']:+.4f} px/col")
    print(f"  Waviness (resid std): {r['waviness_std_px']:.3f} px")
    print(f"  Inflection points (peaks+valleys): {r['num_inflections']}")

# Compare bottom-edge profiles across frames
print("\n" + "=" * 70)
print("FRAME-TO-FRAME COMPARISON OF BOTTOM EDGE")
print("=" * 70)

profiles = []
for path in FILES:
    img = Image.open(path).convert("RGB")
    arr = np.array(img)
    flag_mask = color_mask(arr, SAFFRON, tol=45) | color_mask(arr, GREEN, tol=45)
    profile, (x0, x1) = bottom_edge_profile(flag_mask)
    profiles.append((profile, x0, x1))

# Use common x-range across all three frames
all_x0 = min(p[1] for p in profiles)
all_x1 = max(p[2] for p in profiles)

# Compute frame-to-frame per-column displacement of the bottom edge
for i in range(len(profiles) - 1):
    p1, _, _ = profiles[i]
    p2, _, _ = profiles[i + 1]
    diffs = []
    for c in range(all_x0, all_x1 + 1):
        if p1[c] >= 0 and p2[c] >= 0:
            diffs.append(int(p2[c] - p1[c]))  # +ve = edge moved DOWN, -ve = moved UP
    if not diffs:
        print(f"  Frame {i+1} -> {i+2}: no overlapping columns")
        continue
    diffs = np.array(diffs)
    print(f"\n  Frame {i+1} -> Frame {i+2}:")
    print(f"    Columns compared:      {len(diffs)}")
    print(f"    Mean edge displacement: {diffs.mean():+.2f} px  "
          f"({'down' if diffs.mean() > 0 else 'up' if diffs.mean() < 0 else 'flat'})")
    print(f"    Max upward shift:      {diffs.min():+d} px")
    print(f"    Max downward shift:    {diffs.max():+d} px")
    print(f"    Std-dev of shift:      {diffs.std():.2f} px")
    print(f"    Columns where edge moved >2px: "
          f"{int((np.abs(diffs) > 2).sum())}/{len(diffs)} "
          f"({100*(np.abs(diffs) > 2).mean():.1f}%)")

# Overall verdict
print("\n" + "=" * 70)
print("VERDICT")
print("=" * 70)
all_diffs = []
for i in range(len(profiles) - 1):
    p1, _, _ = profiles[i]
    p2, _, _ = profiles[i + 1]
    for c in range(all_x0, all_x1 + 1):
        if p1[c] >= 0 and p2[c] >= 0:
            all_diffs.append(int(p2[c] - p1[c]))
all_diffs = np.array(all_diffs)
moving_frac = float((np.abs(all_diffs) > 1).mean())
print(f"Across all transitions, fraction of columns where the bottom edge")
print(f"of the flag shifted by more than 1px: {moving_frac*100:.1f}%")
print(f"Max edge shift observed: {int(np.abs(all_diffs).max())} px")
if moving_frac > 0.1 or np.abs(all_diffs).max() >= 3:
    print("=> The flag shape IS changing between frames. WAVE ANIMATION CONFIRMED.")
else:
    print("=> The flag shape is essentially static. No wave animation detected.")
