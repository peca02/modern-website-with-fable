import { crisp, drawFrame, gaussian, label, line, ramp, tint, type PlateSurface } from "@/components/chapters/yield/plates/surface";

const HOMES = 4000;
const CLUSTERS = 26;
const WARM = ["glow", "plasma", "ember"] as const;

type Cluster = { x: number; y: number; spread: number; weight: number; reach: number };

/** A night map: 400,000 homes as points, lit along feeders that radiate from the plant. */
export function drawGrid(surface: PlateSurface): void {
  const { ctx, random } = surface;
  const rect = drawFrame(surface, {
    figure: "Fig. 05",
    title: "Hunterston feed",
    note: "1 point = 100 homes",
    scale: "190 MW",
  });
  const width = rect.right - rect.left;
  const height = rect.bottom - rect.top;
  const nodeX = rect.left + width * 0.36;
  const nodeY = rect.top + height * 0.6;
  const reachMax = Math.hypot(width * 0.64, height * 0.6);

  ctx.lineWidth = 1;
  for (let ring = 1; ring <= 4; ring++) {
    ctx.strokeStyle = tint("bone", 0.1);
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.arc(nodeX, nodeY, ring * reachMax * 0.24, 0, Math.PI * 2);
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.left + 8, rect.top, width - 8, height);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(nodeX, nodeY, ring * reachMax * 0.24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.setLineDash([]);

  const clusters: Cluster[] = [];
  let guard = 0;
  while (clusters.length < CLUSTERS && guard++ < 600) {
    const x = rect.left + 20 + random() * (width - 40);
    const y = rect.top + 20 + random() * (height - 40);
    const reach = Math.hypot(x - nodeX, y - nodeY) / reachMax;
    if (reach < 0.07) continue;
    if (clusters.some((other) => Math.hypot(other.x - x, other.y - y) < width * 0.11)) continue;
    const weight = 0.25 + Math.pow(random(), 2.2) * 1.6;
    clusters.push({ x, y, reach, weight, spread: width * (0.02 + 0.028 * weight) });
  }
  clusters.sort((a, b) => a.reach - b.reach);

  // Feeders: each town ties into the nearest one closer to the plant, so the net grows as a tree.
  ctx.globalCompositeOperation = "lighter";
  clusters.forEach((cluster, index) => {
    let fromX = nodeX;
    let fromY = nodeY;
    let best = Math.hypot(cluster.x - nodeX, cluster.y - nodeY) * 0.82;
    for (let i = 0; i < index; i++) {
      const distance = Math.hypot(cluster.x - clusters[i].x, cluster.y - clusters[i].y);
      if (distance < best) {
        best = distance;
        fromX = clusters[i].x;
        fromY = clusters[i].y;
      }
    }
    const lit = 1 - cluster.reach;
    ctx.strokeStyle = ramp(["ember", "plasma"], lit, 0.3 + 0.5 * lit);
    const bendX = fromX + (cluster.x - fromX) * 0.5 + (random() - 0.5) * best * 0.18;
    const bendY = fromY + (cluster.y - fromY) * 0.5 + (random() - 0.5) * best * 0.18;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(bendX, bendY);
    ctx.lineTo(cluster.x, cluster.y);
    ctx.stroke();
  });

  const totalWeight = clusters.reduce((sum, cluster) => sum + cluster.weight, 0);
  for (const cluster of clusters) {
    const count = Math.round((cluster.weight / totalWeight) * HOMES * 0.86);
    const lit = 1 - cluster.reach;
    for (let i = 0; i < count; i++) {
      const radius = Math.abs(gaussian(random)) * cluster.spread;
      const angle = random() * Math.PI * 2;
      const x = cluster.x + Math.cos(angle) * radius * 1.25;
      const y = cluster.y + Math.sin(angle) * radius;
      if (x < rect.left + 10 || x > rect.right - 2 || y < rect.top + 2 || y > rect.bottom - 2) continue;
      const core = Math.exp(-radius / cluster.spread);
      ctx.fillStyle = ramp(WARM, 1 - lit * (0.35 + 0.65 * core), 0.45 + 0.5 * core);
      const size = random() < 0.08 ? 1.6 : 1;
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    }
  }

  // Scattered farms between the towns, barely lit.
  ctx.fillStyle = tint("ember", 0.75);
  for (let i = 0; i < HOMES * 0.14; i++) {
    ctx.fillRect(rect.left + 10 + random() * (width - 12), rect.top + 2 + random() * (height - 4), 1, 1);
  }

  const halo = ctx.createRadialGradient(nodeX, nodeY, 0, nodeX, nodeY, width * 0.16);
  halo.addColorStop(0, tint("glow", 0.55));
  halo.addColorStop(0.2, tint("plasma", 0.3));
  halo.addColorStop(1, tint("ember", 0));
  ctx.fillStyle = halo;
  ctx.fillRect(nodeX - width * 0.16, nodeY - width * 0.16, width * 0.32, width * 0.32);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = tint("glow");
  ctx.fillRect(Math.round(nodeX) - 2, Math.round(nodeY) - 2, 5, 5);
  ctx.strokeStyle = tint("glow", 0.8);
  ctx.strokeRect(Math.round(nodeX) - 6.5, Math.round(nodeY) - 6.5, 14, 14);

  ctx.strokeStyle = tint("bone", 0.4);
  line(ctx, nodeX - 8, crisp(nodeY + 8), nodeX - 26, crisp(nodeY + 26));
  label(surface, "Skein Two", nodeX - 28, nodeY + 36, { align: "right", color: "bone", alpha: 0.9 });
  label(surface, "40 km", nodeX + reachMax * 0.48 * 0.7 + 6, nodeY - reachMax * 0.48 * 0.7 - 6, { size: 8 });
}
