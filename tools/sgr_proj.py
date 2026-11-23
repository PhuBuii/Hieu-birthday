"""Chiếu gnomonic các sao Nhân Mã (J2000, Wikipedia: List of stars in Sagittarius) vào khung 100 x 100 của màn 2 (src/main.js > STARS, index.html > .con-sky).
Phía đông bên trái (như nhìn lên trời), bắc ở trên."""
import math

def ra(h, m, s): return (h + m / 60 + s / 3600) * 15
def dec(d, m, s): return -(abs(d) + m / 60 + s / 3600)

S = {
    'gamma': (ra(18, 5, 48.52), dec(-30, 25, 25.1), 2.98),
    'delta': (ra(18, 20, 59.62), dec(-29, 49, 40.9), 2.72),
    'lambda': (ra(18, 27, 58.27), dec(-25, 25, 16.5), 2.82),
    'phi': (ra(18, 45, 39.35), dec(-26, 59, 26.8), 3.17),
    'sigma': (ra(18, 55, 15.93), dec(-26, 17, 48.2), 2.05),
    'tau': (ra(19, 6, 56.44), dec(-27, 40, 11.3), 3.32),
    'zeta': (ra(19, 2, 36.72), dec(-29, 52, 48.4), 2.60),
    'epsilon': (ra(18, 24, 10.32), dec(-34, 23, 0.46), 1.85),
    # sao nền (không chạm)
    'mu': (ra(18, 13, 45.81), dec(-21, 3, 31.8), 3.84),
    'eta': (ra(18, 17, 37.73), dec(-36, 45, 40.6), 3.10),
    'pi': (ra(19, 9, 45.83), dec(-21, 1, 24.7), 2.88),
    'xi2': (ra(18, 57, 43.78), dec(-21, 6, 23.8), 3.52),
    'omicron': (ra(19, 4, 40.93), dec(-21, 44, 28.9), 3.76),
    'rho1': (ra(19, 21, 40.38), dec(-17, 50, 50.1), 3.92),
    'alpha': (ra(19, 23, 53.15), dec(-40, 36, 56.3), 3.96),
    'beta1': (ra(19, 22, 38.29), dec(-44, 27, 32.1), 3.96),
}
# tâm Ngân Hà Sgr A* và mặt phẳng thiên hà (l = -10..20, b = 0)
SGRA = (ra(17, 45, 40.04), dec(-29, 0, 28.2))

def gal_to_eq(l, b):
    # J2000: cực bắc thiên hà RA 192.85948, Dec 27.12825, l của cực thiên cầu bắc 122.93192
    ap, dp, l0 = math.radians(192.85948), math.radians(27.12825), math.radians(122.93192)
    l, b = math.radians(l), math.radians(b)
    sd = math.sin(dp) * math.sin(b) + math.cos(dp) * math.cos(b) * math.cos(l0 - l)
    d = math.asin(sd)
    y = math.cos(b) * math.sin(l0 - l)
    x = math.cos(dp) * math.sin(b) - math.sin(dp) * math.cos(b) * math.cos(l0 - l)
    a = ap + math.atan2(y, x)
    return math.degrees(a) % 360, math.degrees(d)

A0, D0 = ra(18, 37, 0), -30.0

def proj(a, d):
    a, d, a0, d0 = map(math.radians, (a, d, A0, D0))
    c = math.sin(d0) * math.sin(d) + math.cos(d0) * math.cos(d) * math.cos(a - a0)
    x = math.cos(d) * math.sin(a - a0) / c
    y = (math.cos(d0) * math.sin(d) - math.sin(d0) * math.cos(d) * math.cos(a - a0)) / c
    return -math.degrees(x), math.degrees(y)  # đông bên trái

P = {k: proj(v[0], v[1]) for k, v in S.items()}
teapot = ['gamma', 'delta', 'lambda', 'phi', 'sigma', 'tau', 'zeta', 'epsilon']
xs = [P[k][0] for k in teapot]; ys = [P[k][1] for k in teapot]
cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
K = 5.6  # đơn vị khung / độ
OX, OY = 50, 54.5  # khung 100 x 100: chừa chỗ cho μ, π, ξ², ο phía trên và η phía dưới
def to_frame(x, y): return round(OX + (x - cx) * K, 1), round(OY - (y - cy) * K, 1)
print('span deg', max(xs) - min(xs), max(ys) - min(ys))
for k in S:
    fx, fy = to_frame(*P[k])
    print(f"{k:8s} {fx:6.1f} {fy:6.1f}  mag {S[k][2]}")
print('sgrA', to_frame(*proj(*SGRA)))
for l in range(-12, 24, 4):
    a, d = gal_to_eq(l, 0)
    print('gal l', l, to_frame(*proj(a, d)))
ant = proj(ra(16, 29, 24.46), dec(-26, 25, 55.2))
print('antares', to_frame(*ant))

