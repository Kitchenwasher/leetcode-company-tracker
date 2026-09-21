import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

import './GlideSelect.css';

export interface GlideSelectOption {
  value: string;
  label: ReactNode;
  tag?: string;
  searchText?: string;
}

export interface GlideSelectProps {
  options?: (string | GlideSelectOption)[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, option: GlideSelectOption) => void;
  placeholder?: string;
  showTags?: boolean;
  accentColor?: string;
  surfaceColor?: string;
  highlightColor?: string;
  textColor?: string;
  size?: 'sm' | 'md' | 'lg';
  radius?: number;
  menuWidth?: number;
  placement?: 'top' | 'bottom';
  align?: 'left' | 'right';
  popDuration?: number;
  glideDuration?: number;
  rememberPosition?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  icon?: ReactNode;
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

const SIZES = {
  sm: { chip: 32, row: 28, font: 12 },
  md: { chip: 36, row: 32, font: 12.5 },
  lg: { chip: 44, row: 40, font: 14 }
};
const GAP = 1;
const MENU_GAP = 6;
const DEFAULT_OPTIONS: string[] = ['One', 'Two', 'Three'];

const norm = (o: string | GlideSelectOption): GlideSelectOption =>
  typeof o === 'string' ? { value: o, label: o, searchText: o } : o;

const textOf = (it: GlideSelectOption): string =>
  it.searchText ?? (typeof it.label === 'string' ? it.label : it.value);

const typeaheadIndex = (items: GlideSelectOption[], from: number, ch: string): number => {
  const c = ch.toLowerCase();
  const n = items.length;
  for (let k = 1; k <= n; k++) {
    const i = (from + k) % n;
    if (textOf(items[i]).toLowerCase().startsWith(c)) return i;
  }
  return from;
};

export default function GlideSelect({
  options = DEFAULT_OPTIONS,
  value,
  defaultValue,
  onChange,
  placeholder = 'Select…',
  showTags = true,
  accentColor = 'var(--theme-accent, #A855F7)',
  surfaceColor = '#11141A',
  highlightColor = '#1F2430',
  textColor = '#F3F4F6',
  size = 'md',
  radius = 10,
  menuWidth = 176,
  placement = 'bottom',
  align = 'left',
  popDuration = 180,
  glideDuration = 220,
  rememberPosition = true,
  disabled = false,
  ariaLabel = 'Select',
  icon,
  className = '',
  searchable = false,
  searchPlaceholder = 'Search...'
}: GlideSelectProps) {
  const items = useMemo(() => options.map(norm), [options]);
  const [filterQuery, setFilterQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredItems = useMemo(() => {
    if (!searchable || !filterQuery.trim()) return items;
    const q = filterQuery.toLowerCase().trim();
    return items.filter(it => textOf(it).toLowerCase().includes(q));
  }, [items, searchable, filterQuery]);

  const [inner, setInner] = useState(defaultValue ?? '');
  const current = value !== undefined ? value : inner;
  const selected = filteredItems.findIndex(it => it.value === current);
  const [phase, setPhase] = useState<'closed' | 'open' | 'closing'>('closed');
  const [active, setActive] = useState<number | null>(null);
  const [side, setSide] = useState<'top' | 'bottom'>(placement);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const instant = useRef(false);
  const closeTimer = useRef<NodeJS.Timeout | number | undefined>(undefined);
  const scrub = useRef<{ id: number; top: number } | null>(null);
  const id = useId();
  const S = SIZES[size] ?? SIZES.md;
  const step = S.row + GAP;
  const popOut = Math.round((popDuration * 2) / 3);

  useEffect(() => {
    if (phase === 'open' && searchable) {
      setFilterQuery('');
      const timer = setTimeout(() => searchInputRef.current?.focus(), 40);
      return () => clearTimeout(timer);
    }
  }, [phase, searchable]);

  useLayoutEffect(() => {
    if (phase !== 'open') return;
    const el = menuRef.current;
    const root = rootRef.current;
    if (!el || !root) return;
    const r = root.getBoundingClientRect();
    const need = el.offsetHeight + MENU_GAP;
    setSide(
      placement === 'bottom' && r.bottom + need > window.innerHeight
        ? 'top'
        : placement === 'top' && r.top - need < 0
          ? 'bottom'
          : placement
    );
    el.style.transitionDuration = instant.current ? '0ms' : '';
    el.dataset.state = 'closed';
    void el.offsetHeight;
    el.dataset.state = 'open';
    const p = pillRef.current;
    if (p) {
      p.style.transition = 'none';
      p.style.transform = `translateY(${Math.max(0, selected) * step}px)`;
      p.style.opacity = '0';
      void p.offsetHeight;
      p.style.transition = '';
    }
    const listEl = el.querySelector('.glide-select__list');
    if (listEl && selected >= 0) {
      const targetTop = selected * step;
      if (targetTop < listEl.scrollTop || targetTop > listEl.scrollTop + listEl.clientHeight - step) {
        listEl.scrollTop = Math.max(0, targetTop - step * 2);
      }
    }
  }, [phase, placement, selected, step]);

  useLayoutEffect(() => {
    const p = pillRef.current;
    if (!p || phase !== 'open') return;
    if (active === null || active < 0 || active >= filteredItems.length) {
      p.style.opacity = '0';
      return;
    }
    const jump = instant.current || p.style.opacity !== '1';
    p.style.transitionDuration = jump ? '0ms, 150ms' : '';
    p.style.transform = `translateY(${active * step}px)`;
    p.style.opacity = '1';
    instant.current = false;
  }, [active, phase, step, filteredItems.length]);

  const open = (viaKey: boolean) => {
    if (disabled) return;
    clearTimeout(closeTimer.current as number);
    instant.current = true;
    setActive(selected >= 0 ? selected : viaKey ? 0 : null);
    setPhase('open');
  };

  const close = (mode: 'instant' | 'pop') => {
    setActive(null);
    clearTimeout(closeTimer.current as number);
    const el = menuRef.current;
    if (mode === 'instant' || !el) {
      setPhase('closed');
      return;
    }
    el.style.transitionDuration = '';
    el.dataset.state = 'closed';
    setPhase('closing');
    closeTimer.current = setTimeout(() => setPhase('closed'), popOut + 20);
  };

  const pick = (i: number, viaKey: boolean) => {
    const it = filteredItems[i];
    if (!it) {
      close('instant');
      return;
    }
    if (it.value !== current) {
      if (value === undefined) setInner(it.value);
      onChange?.(it.value, it);
      if (!viaKey && rootRef.current) rootRef.current.dataset.swap = '';
    }
    close('instant');
    triggerRef.current?.focus({ preventScroll: true });
  };

  const onTriggerKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const k = e.key;
    const n = filteredItems.length;
    const cur = active ?? Math.max(0, selected);
    if (phase !== 'open') {
      if (k === 'Enter' || k === ' ' || k === 'ArrowDown' || k === 'ArrowUp') {
        e.preventDefault();
        open(true);
      }
      return;
    }
    const go = (i: number) => {
      e.preventDefault();
      instant.current = true;
      setActive(Math.min(n - 1, Math.max(0, i)));
    };
    if (k === 'ArrowDown' || k === 'ArrowUp') go(active === null ? cur : cur + (k === 'ArrowDown' ? 1 : -1));
    else if (k === 'Home' || k === 'End') go(k === 'Home' ? 0 : n - 1);
    else if (k === 'Enter' || k === ' ') {
      e.preventDefault();
      pick(cur, true);
    } else if (k === 'Escape' || k === 'Tab') {
      if (k === 'Escape') e.preventDefault();
      close('instant');
    } else if (k.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey && !searchable) {
      go(typeaheadIndex(filteredItems, cur, k));
    }
  };

  useEffect(() => {
    if (phase === 'closed') return undefined;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close('pop');
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [phase]);

  useEffect(() => {
    if (disabled && phase !== 'closed') close('instant');
  }, [disabled, phase]);

  useEffect(() => () => clearTimeout(closeTimer.current as number), []);

  const rowAt = (y: number) => {
    const s = scrub.current;
    if (!s) return null;
    const listEl = menuRef.current?.querySelector('.glide-select__list');
    const scrollTop = listEl ? listEl.scrollTop : 0;
    const i = Math.floor((y - s.top + scrollTop) / step);
    return i >= 0 && i < filteredItems.length ? i : null;
  };

  const onListDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (scrub.current) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    scrub.current = { id: e.pointerId, top: e.currentTarget.getBoundingClientRect().top };
    instant.current = true;
    const row = (e.target as HTMLElement).closest('[data-index]') as HTMLElement | null;
    if (row && row.dataset.index !== undefined) {
      const idx = Number(row.dataset.index);
      if (!isNaN(idx)) setActive(idx);
    } else {
      setActive(rowAt(e.clientY));
    }
  };

  const onListMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrub.current || scrub.current.id !== e.pointerId) return;
    const i = rowAt(e.clientY);
    if (i !== null && i !== active) setActive(i);
  };

  const onListUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrub.current || scrub.current.id !== e.pointerId) return;
    const row = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-index]') as HTMLElement | null;
    const i = row && row.dataset.index !== undefined ? Number(row.dataset.index) : rowAt(e.clientY);
    scrub.current = null;
    if (i !== null && i >= 0 && i < filteredItems.length) pick(i, false);
    else if (!rememberPosition) setActive(null);
  };

  const onListOver = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' || scrub.current) return;
    const row = (e.target as HTMLElement).closest('[data-index]') as HTMLElement | null;
    if (!row) return;
    const i = Number(row.dataset.index);
    if (!isNaN(i) && i !== active) setActive(i);
  };

  const origin = `${side === 'bottom' ? 'top' : 'bottom'} ${align}`;
  const activeItem = items.find(it => it.value === current);

  return (
    <div
      ref={rootRef}
      className={`glide-select${className ? ` ${className}` : ''}`}
      data-size={size}
      data-state={phase !== 'closed' ? 'open' : 'closed'}
      data-disabled={disabled ? '' : undefined}
      style={{
        '--gs-accent': accentColor,
        '--gs-surface': surfaceColor,
        '--gs-highlight': highlightColor,
        '--gs-text': textColor,
        '--gs-radius': `${radius}px`,
        '--gs-inner-radius': `${Math.max(3, radius - 4)}px`,
        '--gs-chip': `${S.chip}px`,
        '--gs-row': `${S.row}px`,
        '--gs-font': `${S.font}px`,
        '--gs-menu-w': `${menuWidth}px`,
        '--gs-label-w': `${Math.max(120, menuWidth - 48)}px`,
        '--gs-pop': `${popDuration}ms`,
        '--gs-pop-out': `${popOut}ms`,
        '--gs-glide': `${glideDuration}ms`,
        '--gs-origin': origin
      } as React.CSSProperties}
      onAnimationEnd={e => {
        if (e.animationName === 'gs-swap' && rootRef.current) delete rootRef.current.dataset.swap;
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={phase === 'open'}
        aria-controls={`${id}-list`}
        aria-activedescendant={active !== null ? `${id}-${active}` : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        className="glide-select__trigger"
        onPointerDown={e => {
          if (e.button !== 0 || disabled) return;
          e.currentTarget.focus({ preventScroll: true });
          if (phase === 'open') close('pop');
          else open(false);
        }}
        onKeyDown={onTriggerKey}
      >
        {icon && (
          <span className="glide-select__icon flex items-center shrink-0 opacity-80" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="glide-select__label" key={current} data-empty={!activeItem ? '' : undefined}>
          {activeItem ? activeItem.label : placeholder}
        </span>
        <span className="glide-select__chevron" aria-hidden="true">
          <ChevronDown size={12} strokeWidth={2.5} />
        </span>
      </button>
      {phase !== 'closed' ? (
        <div ref={menuRef} className="glide-select__menu" data-state="open" data-side={side} data-align={align}>
          {searchable && (
            <div className="p-1 pb-1.5 border-b border-white/[0.08] mb-1" onPointerDown={e => e.stopPropagation()}>
              <div className="relative">
                <Search size={13} className="text-zinc-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={filterQuery}
                  onChange={e => {
                    setFilterQuery(e.target.value);
                    instant.current = true;
                    setActive(0);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full pl-6 pr-2 py-1 text-xs bg-[#161B22] border border-white/[0.08] focus:border-purple-500/60 rounded text-white placeholder-zinc-500 focus:outline-none"
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => {
                    e.stopPropagation();
                    if (e.key === 'Escape') close('instant');
                    else if (e.key === 'Enter') {
                      e.preventDefault();
                      const targetIdx = active !== null && active >= 0 ? active : 0;
                      if (filteredItems[targetIdx]) {
                        pick(targetIdx, true);
                      }
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setActive(prev => Math.min(filteredItems.length - 1, (prev ?? -1) + 1));
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setActive(prev => Math.max(0, (prev ?? 1) - 1));
                    }
                  }}
                />
              </div>
            </div>
          )}
          <div
            id={`${id}-list`}
            role="listbox"
            aria-label={ariaLabel}
            className="glide-select__list"
            data-live={active !== null ? '' : undefined}
            onPointerOver={onListOver}
            onPointerLeave={() => {
              if (!scrub.current && !rememberPosition) setActive(null);
            }}
            onPointerDown={onListDown}
            onPointerMove={onListMove}
            onPointerUp={onListUp}
            onPointerCancel={onListUp}
            onLostPointerCapture={onListUp}
          >
            <span ref={pillRef} className="glide-select__pill" aria-hidden="true" />
            {filteredItems.map((it, i) => (
              <div
                key={it.value}
                id={`${id}-${i}`}
                role="option"
                aria-selected={it.value === current}
                data-active={i === active ? 'true' : undefined}
                data-index={i}
                className="glide-select__option"
              >
                <span className="glide-select__name">{it.label}</span>
                {showTags && it.tag ? <span className="glide-select__tag">{it.tag}</span> : null}
                <span className="glide-select__check" data-on={it.value === current ? '' : undefined} aria-hidden="true">
                  <Check size={13} strokeWidth={2.5} />
                </span>
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className="py-3 px-2 text-center text-xs text-zinc-500">
                No matching options
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
