"use client";

import { useRef, useEffect } from "react";

interface Node {
  x: number;
  y: number;
  layer: number;
  activation: number;
  baseX: number;
  baseY: number;
}

interface Connection {
  from: number;
  to: number;
  weight: number;
}

export function HeroVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const layers = [3, 5, 5, 3];
    const nodes: Node[] = [];
    const connections: Connection[] = [];

    const buildNetwork = (w: number, h: number) => {
      nodes.length = 0;
      connections.length = 0;
      const layerSpacing = w / (layers.length + 1);

      layers.forEach((count, li) => {
        const x = layerSpacing * (li + 1);
        const nodeSpacing = h / (count + 1);
        for (let ni = 0; ni < count; ni++) {
          const y = nodeSpacing * (ni + 1);
          nodes.push({
            x,
            y,
            layer: li,
            activation: Math.random(),
            baseX: x,
            baseY: y,
          });
        }
      });

      let offset = 0;
      for (let li = 0; li < layers.length - 1; li++) {
        const currentCount = layers[li];
        const nextCount = layers[li + 1];
        const nextOffset = offset + currentCount;
        for (let i = 0; i < currentCount; i++) {
          for (let j = 0; j < nextCount; j++) {
            connections.push({
              from: offset + i,
              to: nextOffset + j,
              weight: (Math.random() - 0.5) * 2,
            });
          }
        }
        offset += currentCount;
      }
    };

    let animId: number;
    const draw = (t: number) => {
      timeRef.current = t;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;

      if (nodes.length === 0) buildNetwork(w, h);

      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      nodes.forEach((node, i) => {
        const pulse = Math.sin(t * 0.002 + i * 0.5) * 0.15 + 0.85;
        node.activation = pulse;
        const dx = mx - node.x;
        const dy = my - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - dist / 200);
        node.x = node.baseX + dx * influence * 0.05;
        node.y = node.baseY + dy * influence * 0.05;
      });

      connections.forEach((conn) => {
        const from = nodes[conn.from];
        const to = nodes[conn.to];
        if (!from || !to) return;

        const signal = Math.sin(t * 0.003 + conn.from * 0.3) * 0.5 + 0.5;
        const alpha = 0.1 + signal * 0.3;
        const color = conn.weight > 0 ? `rgba(99, 102, 241, ${alpha})` : `rgba(239, 68, 68, ${alpha})`;

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.abs(conn.weight) * 1.5 + 0.5;
        ctx.stroke();
      });

      nodes.forEach((node, i) => {
        const radius = 6 + node.activation * 4;
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius);
        gradient.addColorStop(0, `rgba(99, 102, 241, ${0.6 + node.activation * 0.4})`);
        gradient.addColorStop(1, `rgba(16, 185, 129, ${0.2 + node.activation * 0.3})`);

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(99, 102, 241, ${0.3 + node.activation * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      animId = requestAnimationFrame(draw);
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onResize = () => {
      nodes.length = 0;
    };

    canvas.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);
    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      aria-label="Interactive neural network visualization"
    />
  );
}
