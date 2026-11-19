"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

const SIZES = [256, 512, 1024, 2048];

/** Bitly-style QR code generator. Codes point at `?qr=1` so scans are tracked separately from clicks. */
export function QrPanel({ url, filename }: { url: string; filename: string }) {
  const [fg, setFg] = useState("#000000");
  const [bg, setBg] = useState("#ffffff");
  const [size, setSize] = useState(1024);
  const [preview, setPreview] = useState("");
  const qrUrl = `${url}?qr=1`;

  useEffect(() => {
    QRCode.toDataURL(qrUrl, { width: 320, margin: 2, errorCorrectionLevel: "M", color: { dark: fg, light: bg } })
      .then(setPreview)
      .catch(() => setPreview(""));
  }, [qrUrl, fg, bg]);

  function download(href: string, ext: string) {
    const a = document.createElement("a");
    a.href = href;
    a.download = `${filename}.${ext}`;
    a.click();
  }

  async function downloadPng() {
    download(
      await QRCode.toDataURL(qrUrl, { width: size, margin: 2, errorCorrectionLevel: "M", color: { dark: fg, light: bg } }),
      "png",
    );
  }

  async function downloadSvg() {
    const svg = await QRCode.toString(qrUrl, { type: "svg", margin: 2, errorCorrectionLevel: "M", color: { dark: fg, light: bg } });
    const href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    download(href, "svg");
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }

  return (
    <div className="flex flex-col gap-5 sm:flex-row">
      <div className="shrink-0 self-start rounded-lg border border-border p-2" style={{ background: bg }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview ? <img src={preview} alt={`QR code for ${url}`} width={160} height={160} /> : <div className="h-40 w-40" />}
      </div>
      <div className="flex-1 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label htmlFor="qr-fg" className="label">
              Code color
            </label>
            <input id="qr-fg" type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-9 w-16 cursor-pointer rounded border border-border bg-card" />
          </div>
          <div>
            <label htmlFor="qr-bg" className="label">
              Background
            </label>
            <input id="qr-bg" type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-9 w-16 cursor-pointer rounded border border-border bg-card" />
          </div>
          <div>
            <label htmlFor="qr-size" className="label">
              PNG size
            </label>
            <select id="qr-size" value={size} onChange={(e) => setSize(Number(e.target.value))} className="input w-28">
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}px
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={downloadPng}>
            Download PNG
          </button>
          <button type="button" className="btn-secondary" onClick={downloadSvg}>
            Download SVG
          </button>
        </div>
        <p className="hint">Scans are counted separately from clicks in this link&apos;s analytics.</p>
      </div>
    </div>
  );
}
