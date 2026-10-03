"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./ui";

export function PagedList<T>({
  items,
  renderItem,
  rowHeight = 72,
  minColumnWidth = 0,
  gap = 0,
  className = "",
  empty,
  label = "Kayıtlar",
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  rowHeight?: number;
  minColumnWidth?: number;
  gap?: number;
  className?: string;
  empty?: ReactNode;
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ rows: 1, columns: 1 });
  const [page, setPage] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const columns = minColumnWidth
        ? Math.max(1, Math.floor((entry.contentRect.width + gap) / (minColumnWidth + gap)))
        : 1;
      const rows = Math.max(1, Math.floor((entry.contentRect.height + gap) / (rowHeight + gap)));
      setSize((previous) =>
        previous.rows === rows && previous.columns === columns ? previous : { rows, columns },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [rowHeight, minColumnWidth, gap]);
  const capacity = size.rows * size.columns;
  const pages = Math.max(1, Math.ceil(items.length / capacity));
  const current = Math.min(page, pages - 1);
  const offset = current * capacity;
  return (
    <div className="paged-list">
      <div
        ref={ref}
        className={`paged-items ${className}`}
        style={
          minColumnWidth
            ? {
                gridTemplateColumns: `repeat(${size.columns}, minmax(0, 1fr))`,
                gap,
                gridAutoRows: rowHeight,
              }
            : undefined
        }
      >
        {items.length
          ? items
              .slice(offset, offset + capacity)
              .map((item, index) => renderItem(item, index + offset))
          : empty}
      </div>
      <div className="pagination" aria-label={`${label} sayfalama`}>
        <span>
          {items.length
            ? `${offset + 1}–${Math.min(offset + capacity, items.length)} / ${items.length}`
            : "0 kayıt"}
        </span>
        <div>
          <button
            className="icon-button"
            aria-label="Önceki sayfa"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            <Icon name="left" size={16} />
          </button>
          <span>
            {current + 1} / {pages}
          </span>
          <button
            className="icon-button"
            aria-label="Sonraki sayfa"
            disabled={current === pages - 1}
            onClick={() => setPage(current + 1)}
          >
            <Icon name="right" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Tabs<T extends string>({
  value,
  onChange,
  items,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  items: { value: T; label: string; count?: number }[];
  label: string;
}) {
  return (
    <div className="segment-tabs" role="group" aria-label={label}>
      {items.map((item) => (
        <button
          type="button"
          key={item.value}
          aria-pressed={value === item.value}
          className={value === item.value ? "is-active" : ""}
          onClick={() => onChange(item.value)}
        >
          {item.label}
          {item.count !== undefined && <span>{item.count}</span>}
        </button>
      ))}
    </div>
  );
}
