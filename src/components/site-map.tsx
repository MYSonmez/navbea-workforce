"use client";
import { useEffect, useRef, useState } from "react";
import type { Task } from "@/lib/types";
import { useSite } from "@/lib/sites";
import { demoBlocks } from "@/lib/site-blocks";
import { Icon } from "./ui";

function project(lat: number, lng: number, zoom: number) {
  const scale = 256 * 2 ** zoom;
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}
export function SiteMap(props: {
  tasks: Task[];
  onSelect: (task: Task) => void;
  focusTask?: Task;
}) {
  const { site } = useSite();
  return <SatelliteMap key={`${site.id}-${props.focusTask?.id || "all"}`} site={site} {...props} />;
}
function SatelliteMap({
  site,
  tasks,
  onSelect,
  focusTask,
}: {
  site: ReturnType<typeof useSite>["site"];
  tasks: Task[];
  onSelect: (task: Task) => void;
  focusTask?: Task;
}) {
  const { center, blocks } = demoBlocks(site.id);
  const [selected, setSelected] = useState(
    blocks.find((block) => focusTask?.zone.startsWith(block.name))?.id || "",
  );
  const [camera, setCamera] = useState({ ...center, zoom: 16 });
  const frame = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 480, height: 320 });
  useEffect(() => {
    const node = frame.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const query = encodeURIComponent(`${camera.lat},${camera.lng}`);
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const src = key
    ? `https://www.google.com/maps/embed/v1/view?key=${encodeURIComponent(key)}&center=${query}&language=tr&zoom=${camera.zoom}&maptype=satellite`
    : `https://maps.google.com/maps?q=${query}&ll=${query}&z=${camera.zoom}&t=k&hl=tr&output=embed`;
  const current = blocks.find((block) => block.id === selected);
  const blockTasks = current ? tasks.filter((task) => task.zone.startsWith(current.name)) : [];
  const origin = project(camera.lat, camera.lng, camera.zoom);
  function focus(block: (typeof blocks)[number]) {
    setSelected(block.id);
    setCamera({ lat: block.lat, lng: block.lng, zoom: 18 });
  }
  function reset() {
    setSelected("");
    setCamera({ ...center, zoom: 16 });
  }
  return (
    <div className="site-map google-site-map satellite-map">
      <div className="satellite-viewport" ref={frame}>
        <iframe
          title={`${site.name} Google Maps`}
          src={src}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          tabIndex={-1}
        />
        <div className="map-tools">
          <button onClick={reset} aria-label="Tüm blokları göster">
            <Icon name="pin" size={14} />
            Tümü
          </button>
          <span>Örnek bloklar</span>
        </div>
        <div className="map-zoom">
          <button
            aria-label="Haritayı yakınlaştır"
            disabled={camera.zoom >= 20}
            onClick={() => setCamera({ ...camera, zoom: camera.zoom + 1 })}
          >
            +
          </button>
          <button
            aria-label="Haritayı uzaklaştır"
            disabled={camera.zoom <= 15}
            onClick={() => setCamera({ ...camera, zoom: camera.zoom - 1 })}
          >
            −
          </button>
        </div>
        {blocks.map((block) => {
          const point = project(block.lat, block.lng, camera.zoom);
          const x = size.width / 2 + point.x - origin.x;
          const y = size.height / 2 + point.y - origin.y;
          if (x < 25 || x > size.width - 25 || y < 38 || y > size.height - 25) return null;
          return (
            <button
              key={block.id}
              className={`block-pin ${selected === block.id ? "is-selected" : ""}`}
              style={{ left: x, top: y }}
              aria-label={`${block.name} konumuna git`}
              aria-pressed={selected === block.id}
              onClick={() => focus(block)}
            >
              <Icon name="building" size={16} />
              <strong>{block.name}</strong>
            </button>
          );
        })}
      </div>
      <div className="block-switches" aria-label="Harita blokları">
        {blocks.map((block) => (
          <button key={block.id} aria-pressed={selected === block.id} onClick={() => focus(block)}>
            {block.name}
          </button>
        ))}
      </div>
      <div className="google-map-caption">
        <span>{current ? `${current.name} · ${blockTasks.length} görev` : "Uydu görünümü"}</span>
        <a
          href={`https://www.google.com/maps/@${camera.lat},${camera.lng},${camera.zoom}z/data=!3m1!1e3`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Maps’te aç <Icon name="right" size={13} />
        </a>
      </div>
      {current && blockTasks.length > 0 && (
        <button className="map-task-link" onClick={() => onSelect(blockTasks[0])}>
          {blockTasks[0].title}
          <Icon name="right" size={14} />
        </button>
      )}
    </div>
  );
}
