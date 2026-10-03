"use client";
import type { Task } from "@/lib/types";

const blocks = [
  { name: "A Blok", x: 70, y: 85, w: 140, h: 100, lift: 42, left: "26%", top: "34%" },
  { name: "B Blok", x: 330, y: 80, w: 160, h: 105, lift: 52, left: "72%", top: "35%" },
  { name: "C Blok", x: 205, y: 225, w: 150, h: 82, lift: 32, left: "46%", top: "75%" },
];

export function SiteMap({
  tasks,
  onSelect,
  focusTask,
}: {
  tasks: Task[];
  onSelect: (task: Task) => void;
  focusTask?: Task;
}) {
  return (
    <div className={`site-map ${focusTask ? "site-map-focused" : ""}`}>
      <div className="map-canvas">
        <svg viewBox="0 0 600 370" role="img" aria-label="Merkez Şantiye şematik bölge planı">
          <defs>
            <pattern id="paving" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M28 0H0V28" fill="none" stroke="#cdd5df" strokeWidth=".5" />
            </pattern>
            <linearGradient id="roof" x2="1" y2="1">
              <stop stopColor="#fafcff" />
              <stop offset="1" stopColor="#d7e1ed" />
            </linearGradient>
            <linearGradient id="wall" x2="0" y2="1">
              <stop stopColor="#d6e0eb" />
              <stop offset="1" stopColor="#aebdd1" />
            </linearGradient>
          </defs>
          <rect width="600" height="370" fill="#eef2f6" />
          <rect width="600" height="370" fill="url(#paving)" />
          <path d="M-20 160L620 255M260-30L145 400" stroke="#d1d9e3" strokeWidth="43" />
          <path
            d="M-20 160L620 255M260-30L145 400"
            stroke="#f8fafc"
            strokeWidth="2"
            strokeDasharray="13 9"
          />
          <path d="M10 8L167 8L147 42L5 22M443 290L588 300L595 366L426 349" fill="#d8e5dc" />
          <path d="M30 260L70 270L45 350L9 339" fill="#d8e5dc" />
          {[25, 55, 85, 500, 535, 570].map((x, i) => (
            <g key={x}>
              <circle cx={x} cy={i < 3 ? 24 : 332} r="10" fill="#bed3c5" />
              <circle cx={x - 2} cy={i < 3 ? 21 : 328} r="7" fill="#cadcd0" />
            </g>
          ))}
          {blocks.map((b) => {
            const highlighted = focusTask?.zone.startsWith(b.name);
            return (
              <g key={b.name}>
                <polygon
                  points={`${b.x + 15},${b.y + b.h + 14} ${b.x + b.w + 50},${b.y + b.h + 30} ${b.x + b.w + 70},${b.y + 30} ${b.x + 42},${b.y + 3}`}
                  fill="#a6b4c5"
                  opacity=".2"
                />
                <polygon
                  points={`${b.x},${b.y} ${b.x + b.w},${b.y + 22} ${b.x + b.w},${b.y + b.h + 22} ${b.x},${b.y + b.h}`}
                  fill="url(#wall)"
                  stroke="#a7b6c9"
                />
                <polygon
                  points={`${b.x + b.w},${b.y + 22} ${b.x + b.w + 34},${b.y + 5} ${b.x + b.w + 34},${b.y + b.h + 5} ${b.x + b.w},${b.y + b.h + 22}`}
                  fill="#b3c0d0"
                  stroke="#a7b6c9"
                />
                <polygon
                  points={`${b.x},${b.y - b.lift} ${b.x + b.w},${b.y + 22 - b.lift} ${b.x + b.w + 34},${b.y + 5 - b.lift} ${b.x + 34},${b.y - 17 - b.lift}`}
                  fill={highlighted ? "#ffd59c" : "url(#roof)"}
                  stroke={highlighted ? "#e4a250" : "#b7c4d4"}
                />
                <polygon
                  points={`${b.x},${b.y - b.lift} ${b.x + b.w},${b.y + 22 - b.lift} ${b.x + b.w},${b.y + b.h + 22} ${b.x},${b.y + b.h}`}
                  fill={highlighted ? "#edc99c" : "url(#wall)"}
                  stroke="#afbdd0"
                />
                {[0, 1, 2, 3].map((floor) => (
                  <g key={floor}>
                    {[0, 1, 2, 3, 4].map((win) => (
                      <polygon
                        key={win}
                        points={`${b.x + 12 + win * 25},${b.y - b.lift + 16 + floor * 23 + win * 3.8} ${b.x + 25 + win * 25},${b.y - b.lift + 18 + floor * 23 + win * 3.8} ${b.x + 25 + win * 25},${b.y - b.lift + 30 + floor * 23 + win * 3.8} ${b.x + 12 + win * 25},${b.y - b.lift + 28 + floor * 23 + win * 3.8}`}
                        fill="#91a4bb"
                        opacity=".6"
                      />
                    ))}
                  </g>
                ))}
                <path
                  d={`M${b.x + 42} ${b.y - b.lift - 6}l${b.w - 34} 14m-${b.w - 45} -1l${b.w - 34} 14`}
                  stroke="#b4c1d0"
                  strokeWidth="2"
                />
              </g>
            );
          })}
          <g stroke="#e4b35a" strokeWidth="4" fill="none">
            <path d="M540 135V48m-60 15h96M540 48l36 15M500 63l40-15M525 135h30" />
            <path d="M486 64v40" strokeWidth="1.5" />
          </g>
          <text x="554" y="29" fontSize="10" fill="#7b8ba1">
            K ↑
          </text>
          <text x="32" y="215" fontSize="9" fill="#8a9bb0" transform="rotate(9 32 215)">
            SAHA YOLU
          </text>
        </svg>
        <div className="map-markers">
          {blocks
            .filter((b) => !focusTask || focusTask.zone.startsWith(b.name))
            .map((block) => {
              const related = tasks.filter((t) => t.zone.startsWith(block.name));
              const task = focusTask || related.find((t) => t.status === "blocked") || related[0];
              const count = new Set(related.flatMap((t) => t.workerIds)).size;
              return (
                <button
                  key={block.name}
                  style={{ left: block.left, top: block.top }}
                  className={`map-marker ${task?.status === "blocked" ? "marker-warning" : ""}`}
                  disabled={!task}
                  onClick={() => task && onSelect(task)}
                  aria-label={`${block.name}, görev detaylarını aç`}
                >
                  <span />
                  <strong>{block.name}</strong>
                  <small>{focusTask ? "Çalışma alanı" : `${count} çalışan`}</small>
                </button>
              );
            })}
        </div>
      </div>
      <span className="map-watermark">Şematik plan</span>
    </div>
  );
}
