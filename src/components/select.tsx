"use client";
import {
  Children,
  isValidElement,
  useId,
  useRef,
  useState,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import { Icon } from "./ui";

type Option = { value: string; label: ReactNode; disabled?: boolean };
export function Select({
  children,
  value,
  defaultValue,
  onChange,
  name,
  id,
  disabled,
  required,
  "aria-label": label,
}: {
  children: ReactNode;
  value?: string;
  defaultValue?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  "aria-label"?: string;
  onChange?: (event: { target: { value: string } }) => void;
}) {
  const options = Children.toArray(children)
    .filter(isValidElement)
    .map((child) => {
      const props = child.props as { value?: string; children: ReactNode; disabled?: boolean };
      return {
        value: props.value ?? String(props.children),
        label: props.children,
        disabled: props.disabled,
      } as Option;
    });
  const [internal, setInternal] = useState(defaultValue ?? options[0]?.value ?? "");
  const selected = value ?? internal;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 0, maxHeight: 260 });
  const popup = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const search = useRef({ text: "", time: 0 });
  function show() {
    if (disabled || !trigger.current || !popup.current) return;
    const rect = trigger.current.getBoundingClientRect();
    const height = Math.min(260, options.length * 42 + 12);
    const below = window.innerHeight - rect.bottom - 10;
    const above = rect.top - 10;
    const down = below >= height || below >= above;
    const maxHeight = Math.max(50, Math.min(height, down ? below : above));
    setPosition({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
      top: down ? rect.bottom + 5 : Math.max(8, rect.top - maxHeight - 5),
      width: rect.width,
      maxHeight,
    });
    setActive(
      Math.max(
        0,
        options.findIndex((o) => o.value === selected),
      ),
    );
    popup.current.showPopover();
  }
  function choose(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;
    setInternal(option.value);
    onChange?.({ target: { value: option.value } });
    popup.current?.hidePopover();
    trigger.current?.focus();
  }
  function keydown(event: KeyboardEvent<HTMLButtonElement>) {
    if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      if (!open) {
        show();
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        choose(active);
        return;
      }
      const delta = event.key === "ArrowUp" ? -1 : 1;
      let index =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? options.length - 1
            : (active + delta + options.length) % options.length;
      for (let i = 0; i < options.length && options[index]?.disabled; i++)
        index = (index + delta + options.length) % options.length;
      setActive(index);
      popup.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Tab") popup.current?.hidePopover();
    else if (event.key.length === 1) {
      const now = event.timeStamp;
      search.current = {
        text:
          (now - search.current.time < 700 ? search.current.text : "") +
          event.key.toLocaleLowerCase("tr-TR"),
        time: now,
      };
      const index = options.findIndex(
        (o) =>
          !o.disabled && String(o.label).toLocaleLowerCase("tr-TR").startsWith(search.current.text),
      );
      if (index >= 0) {
        if (open) setActive(index);
        else choose(index);
      }
    }
  }
  return (
    <div className="themed-select">
      {name && <input type="hidden" name={name} value={selected} />}
      <button
        ref={trigger}
        type="button"
        id={id}
        role="combobox"
        aria-label={label}
        aria-required={required || undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        disabled={disabled}
        onKeyDown={keydown}
        onClick={() => (open ? popup.current?.hidePopover() : show())}
      >
        <span>{options.find((o) => o.value === selected)?.label ?? "Seçin"}</span>
        <Icon name="chevron" size={16} />
      </button>
      <div
        ref={popup}
        popover="auto"
        id={listId}
        role="listbox"
        aria-label={label}
        className="select-options"
        style={position}
        onToggle={(event) => setOpen(event.newState === "open")}
      >
        {options.map((option, index) => (
          <div
            key={option.value}
            role="option"
            id={`${listId}-${index}`}
            data-index={index}
            aria-selected={option.value === selected}
            aria-disabled={option.disabled || undefined}
            className={`select-option ${active === index ? "is-active" : ""}`}
            onPointerMove={() => !option.disabled && setActive(index)}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              choose(index);
            }}
          >
            <span>{option.label}</span>
            {option.value === selected && <Icon name="check" size={16} />}
          </div>
        ))}
      </div>
    </div>
  );
}
