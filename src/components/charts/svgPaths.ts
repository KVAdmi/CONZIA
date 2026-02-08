export type XY = { x: number; y: number };

function fmt(n: number): string {
  return n.toFixed(2);
}

function line(a: XY, b: XY): { length: number; angle: number } {
  const lengthX = b.x - a.x;
  const lengthY = b.y - a.y;
  return {
    length: Math.hypot(lengthX, lengthY),
    angle: Math.atan2(lengthY, lengthX),
  };
}

function controlPoint(params: {
  current: XY;
  previous?: XY;
  next?: XY;
  reverse?: boolean;
  smoothing: number;
}): XY {
  const { current, smoothing } = params;
  const previous = params.previous ?? current;
  const next = params.next ?? current;
  const { length, angle } = line(previous, next);
  const adjustedAngle = angle + (params.reverse ? Math.PI : 0);
  const adjustedLength = length * smoothing;
  return {
    x: current.x + Math.cos(adjustedAngle) * adjustedLength,
    y: current.y + Math.sin(adjustedAngle) * adjustedLength,
  };
}

function bezierCommand(point: XY, i: number, a: XY[], smoothing: number): string {
  const cps = controlPoint({
    current: a[i - 1]!,
    previous: a[i - 2],
    next: point,
    smoothing,
  });
  const cpe = controlPoint({
    current: point,
    previous: a[i - 1],
    next: a[i + 1],
    reverse: true,
    smoothing,
  });

  return `C ${fmt(cps.x)} ${fmt(cps.y)} ${fmt(cpe.x)} ${fmt(cpe.y)} ${fmt(point.x)} ${fmt(point.y)}`;
}

export function pointsFromValues(params: {
  values: number[];
  width: number;
  height: number;
  padding: number;
  domain?: { min: number; max: number };
}): XY[] {
  const safe = params.values.length ? params.values : [0];
  const domainMin = params.domain?.min ?? Math.min(...safe);
  const domainMax = params.domain?.max ?? Math.max(...safe);
  const span = Math.max(0.0001, domainMax - domainMin);

  const w = params.width - params.padding * 2;
  const h = params.height - params.padding * 2;
  const stepX = safe.length <= 1 ? 0 : w / (safe.length - 1);

  return safe.map((v, idx) => {
    const x = params.padding + idx * stepX;
    const t = (v - domainMin) / span;
    const y = params.padding + (1 - t) * h;
    return { x, y };
  });
}

export function smoothPath(points: XY[], smoothing = 0.22): string {
  if (!points.length) return "";
  if (points.length === 1) return `M ${fmt(points[0]!.x)} ${fmt(points[0]!.y)}`;

  return points.reduce((acc, point, i, a) => {
    if (i === 0) return `M ${fmt(point.x)} ${fmt(point.y)}`;
    return `${acc} ${bezierCommand(point, i, a, smoothing)}`;
  }, "");
}

export function areaFromLine(params: { linePath: string; points: XY[]; baselineY: number }): string {
  if (!params.points.length) return "";
  const first = params.points[0]!;
  const last = params.points[params.points.length - 1]!;
  return `${params.linePath} L ${fmt(last.x)} ${fmt(params.baselineY)} L ${fmt(first.x)} ${fmt(params.baselineY)} Z`;
}

