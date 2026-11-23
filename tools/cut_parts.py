"""Tách nền trắng thành trong suốt và cắt từng mảnh theo vùng liên thông.

Cách dùng:
  python tools/cut_parts.py <ảnh-bảng> <thư-mục-ra> <tiền-tố> [merge_px] [min_area]
Kết quả: <tiền-tố>-NN.png cho mỗi mảnh + <tiền-tố>-_index.png (ảnh đánh số để đặt tên).
"""
import sys, os, json
import cv2
import numpy as np


def remove_white_bg(rgb):
    h, w = rgb.shape[:2]
    mn = rgb.min(axis=2).astype(int)
    mx = rgb.max(axis=2).astype(int)
    near_white = ((mn > 228) & (mx - mn < 22)).astype(np.uint8)
    # chỉ xóa vùng trắng nối với viền ảnh -> giữ lông trắng bên trong nét viền
    n, lab = cv2.connectedComponents(near_white, connectivity=4)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    border.discard(0)
    bg = np.isin(lab, list(border)).astype(np.uint8)
    # viền mềm: alpha theo độ trắng ở dải 2px quanh mép
    edge = cv2.dilate(bg, np.ones((3, 3), np.uint8), iterations=2) & (1 - bg)
    whiteness = np.clip((mn - 150) / (255 - 150), 0, 1)
    alpha = np.where(bg == 1, 0, 255).astype(np.float32)
    alpha = np.where(edge == 1, 255 * (1 - whiteness * 0.85), alpha)
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0)
    alpha[bg == 1] = 0
    return alpha.astype(np.uint8)


def main():
    src, out, prefix = sys.argv[1], sys.argv[2], sys.argv[3]
    merge = int(sys.argv[4]) if len(sys.argv) > 4 else 10
    min_area = int(sys.argv[5]) if len(sys.argv) > 5 else 300
    os.makedirs(out, exist_ok=True)
    bgr = cv2.imread(src, cv2.IMREAD_COLOR)
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    a = remove_white_bg(rgb)
    solid = (a > 40).astype(np.uint8)
    grouped = cv2.dilate(solid, np.ones((merge, merge), np.uint8)) if merge > 1 else solid
    n, lab, stats, _ = cv2.connectedComponentsWithStats(grouped, connectivity=8)
    items = []
    for i in range(1, n):
        x, y, w, h, area = stats[i]
        if area < min_area:
            continue
        items.append((y // 80, x, i, x, y, w, h))
    items.sort()
    rgba = np.dstack([bgr, a])
    preview = bgr.copy()
    meta = []
    for k, (_, _, i, x, y, w, h) in enumerate(items):
        m = (lab[y:y + h, x:x + w] == i)
        crop = rgba[y:y + h, x:x + w].copy()
        crop[..., 3] = np.where(m, crop[..., 3], 0)
        p = 4
        crop = cv2.copyMakeBorder(crop, p, p, p, p, cv2.BORDER_CONSTANT, value=(0, 0, 0, 0))
        name = f"{prefix}-{k:02d}.png"
        cv2.imwrite(os.path.join(out, name), crop)
        meta.append({"file": name, "x": int(x), "y": int(y), "w": int(w), "h": int(h)})
        cv2.rectangle(preview, (x, y), (x + w, y + h), (255, 0, 0), 2)
        cv2.putText(preview, str(k), (x + 4, y + 30), cv2.FONT_HERSHEY_SIMPLEX, 1.1, (0, 0, 255), 3)
    cv2.imwrite(os.path.join(out, f"{prefix}-_index.png"), cv2.resize(preview, None, fx=0.6, fy=0.6))
    with open(os.path.join(out, f"{prefix}-_meta.json"), "w") as f:
        json.dump(meta, f, indent=1)
    print(prefix, len(meta))


if __name__ == "__main__":
    main()
