"use client";

export function exportCanvasAsPNG(canvas: HTMLCanvasElement, filename: string = "sagestudio-visualization.png") {
  try {
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Failed to export canvas as PNG", err);
  }
}

export function exportSVGAsPNG(svgElement: SVGSVGElement, filename: string = "sagestudio-diagram.png") {
  try {
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const bbox = svgElement.getBoundingClientRect();
      const scale = window.devicePixelRatio || 2;
      canvas.width = (bbox.width || 600) * scale;
      canvas.height = (bbox.height || 400) * scale;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(scale, scale);
        ctx.drawImage(image, 0, 0, bbox.width || 600, bbox.height || 400);
        exportCanvasAsPNG(canvas, filename);
      }
      URL.revokeObjectURL(blobURL);
    };

    image.src = blobURL;
  } catch (err) {
    console.error("Failed to export SVG as PNG", err);
  }
}

export function exportDataAsJSON(data: unknown, filename: string = "sagestudio-data.json") {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const link = document.createElement("a");
    link.download = filename;
    link.href = window.URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Failed to export data as JSON", err);
  }
}

export function exportDataAsCSV(rows: (string | number)[][], headers: string[], filename: string = "sagestudio-data.csv") {
  try {
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.download = filename;
    link.href = window.URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Failed to export data as CSV", err);
  }
}
