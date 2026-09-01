import { useEffect, useMemo, useRef, useState } from 'react';
import './DateTimePicker.css';

/**
 * Calendar + clock controls that replace the native `datetime-local` widget.
 *
 * The browser's own picker can't be themed at all - it renders as system chrome
 * in the middle of an otherwise dark UI. These render as ordinary DOM, so they
 * follow the theme tokens, and they speak the same string formats the native
 * inputs did (`YYYY-MM-DDTHH:mm`, `YYYY-MM-DD`, `HH:mm`) - drop-in replacements.
 */

const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
/** Slots a multiplex actually programmes - two clicks instead of six. */
const QUICK_TIMES = ['10:00', '13:00', '16:00', '19:00', '22:00'];

const pad2 = (n) => String(n).padStart(2, '0');

function toKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function todayKey() {
  return toKey(new Date());
}

/** '2026-09-04T19:30' -> { dateKey, time }. Tolerates seconds and a missing time. */
function splitValue(value) {
  if (!value) return { dateKey: '', time: '' };
  const [dateKey, rest = ''] = value.split('T');
  return { dateKey, time: rest.slice(0, 5) };
}

function formatDateLabel(dateKey, compact = false) {
  const date = fromKey(dateKey);
  // In a half-column trigger the weekday goes first, then the year - but only
  // when it is the current one, so a run crossing New Year still reads right.
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString([], {
    ...(compact ? {} : { weekday: 'short' }),
    day: 'numeric',
    month: 'short',
    ...(compact && sameYear ? {} : { year: 'numeric' }),
  });
}

export function formatTimeLabel(time) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const meridiem = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad2(m)} ${meridiem}`;
}

/* ============================================================
   Calendar grid
   ============================================================ */

function Calendar({ selectedKey, minKey, onPick }) {
  const initial = selectedKey ? fromKey(selectedKey) : new Date();
  const [cursor, setCursor] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const [focusKey, setFocusKey] = useState(selectedKey || todayKey());

  // Re-centre when the caller changes the value from the outside.
  useEffect(() => {
    if (!selectedKey) return;
    const d = fromKey(selectedKey);
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    setFocusKey(selectedKey);
  }, [selectedKey]);

  const days = useMemo(() => {
    // Always six rows, so switching month never resizes the popover.
    const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(1 - firstOfMonth.getDay());

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      return {
        key: toKey(date),
        day: date.getDate(),
        outside: date.getMonth() !== cursor.getMonth(),
      };
    });
  }, [cursor]);

  function shiftMonth(delta) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }

  function moveFocus(deltaDays) {
    const next = fromKey(focusKey);
    next.setDate(next.getDate() + deltaDays);
    const nextKey = toKey(next);
    setFocusKey(nextKey);
    setCursor(new Date(next.getFullYear(), next.getMonth(), 1));
  }

  function onGridKeyDown(e) {
    const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (moves[e.key] !== undefined) {
      e.preventDefault();
      moveFocus(moves[e.key]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!minKey || focusKey >= minKey) onPick(focusKey);
    }
  }

  const today = todayKey();

  return (
    <div className="dtp-calendar">
      <div className="dtp-cal-head">
        <button type="button" className="dtp-nav" onClick={() => shiftMonth(-1)} aria-label="Previous month">
          ‹
        </button>
        <div className="dtp-month">
          {MONTH_NAMES[cursor.getMonth()]} <span>{cursor.getFullYear()}</span>
        </div>
        <button type="button" className="dtp-nav" onClick={() => shiftMonth(1)} aria-label="Next month">
          ›
        </button>
      </div>

      <div className="dtp-weekdays" aria-hidden="true">
        {WEEKDAY_INITIALS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      {/* One roving tab stop for the whole grid - standard grid keyboard model. */}
      <div
        className="dtp-grid"
        role="grid"
        tabIndex={0}
        onKeyDown={onGridKeyDown}
        aria-label="Choose a date"
      >
        {days.map(({ key, day, outside }) => {
          const disabled = minKey ? key < minKey : false;
          const classes = [
            'dtp-day',
            outside && 'is-outside',
            key === selectedKey && 'is-selected',
            key === today && 'is-today',
            key === focusKey && 'is-focused',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={key}
              type="button"
              className={classes}
              disabled={disabled}
              tabIndex={-1}
              aria-selected={key === selectedKey}
              onClick={() => onPick(key)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   Time board - round clock face plus the usual showtime slots
   ============================================================ */

/** Position + rotation for index i (0 = 12 o'clock), 12 spokes, clockwise. */
const CLOCK_RADIUS = 74;
const HAND_LENGTH = 58;
function spokeAngle(i) {
  return i * 30;
}
function spokePosition(i, radius) {
  const rad = (spokeAngle(i) * Math.PI) / 180;
  return { x: radius * Math.sin(rad), y: -radius * Math.cos(rad) };
}

/**
 * A round dial, not the up/down digital stepper this replaced - tap an hour,
 * it advances to minutes automatically, the way turning to a number on a real
 * clock face would. Minutes snap to 5-minute spokes, same granularity the old
 * stepper used.
 */
function TimeBoard({ time, onChange }) {
  const [h, m] = (time || '19:00').split(':').map(Number);
  const meridiem = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const [mode, setMode] = useState('hour');

  function emit(nextHour12, nextMinute, nextMeridiem) {
    const base = nextHour12 % 12;
    const hours24 = nextMeridiem === 'PM' ? base + 12 : base;
    onChange(`${pad2(hours24)}:${pad2(nextMinute)}`);
  }

  function pickHour(hour12Value) {
    emit(hour12Value, m, meridiem);
    setMode('minute');
  }

  function pickMinute(minuteValue) {
    emit(hour12, minuteValue, meridiem);
  }

  const selectedIndex = mode === 'hour' ? (hour12 === 12 ? 0 : hour12) : m / 5;
  const handAngle = spokeAngle(selectedIndex);

  return (
    <div className="dtp-time">
      <div className="dtp-readout">
        <button type="button" className={`dtp-readout-part ${mode === 'hour' ? 'is-on' : ''}`} onClick={() => setMode('hour')}>
          {pad2(hour12)}
        </button>
        <span className="dtp-readout-colon">:</span>
        <button type="button" className={`dtp-readout-part ${mode === 'minute' ? 'is-on' : ''}`} onClick={() => setMode('minute')}>
          {pad2(m)}
        </button>

        <div className="dtp-meridiem" role="group" aria-label="AM or PM">
          {['AM', 'PM'].map((mer) => (
            <button
              key={mer}
              type="button"
              className={`dtp-mer ${meridiem === mer ? 'is-on' : ''}`}
              onClick={() => emit(hour12, m, mer)}
            >
              {mer}
            </button>
          ))}
        </div>
      </div>

      <div className="dtp-clockface" role="group" aria-label={mode === 'hour' ? 'Choose an hour' : 'Choose a minute'}>
        <div
          className="dtp-clock-hand"
          style={{ height: `${HAND_LENGTH}px`, transform: `rotate(${handAngle}deg)` }}
          aria-hidden="true"
        />
        <div className="dtp-clock-center" aria-hidden="true" />
        {Array.from({ length: 12 }, (_, i) => {
          const { x, y } = spokePosition(i, CLOCK_RADIUS);
          const value = mode === 'hour' ? (i === 0 ? 12 : i) : i * 5;
          const isSelected = i === selectedIndex;
          return (
            <button
              key={i}
              type="button"
              className={`dtp-clock-num ${isSelected ? 'is-selected' : ''}`}
              style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
              onClick={() => (mode === 'hour' ? pickHour(value) : pickMinute(value))}
            >
              {mode === 'minute' ? pad2(value) : value}
            </button>
          );
        })}
      </div>

      <div className="dtp-quick">
        {QUICK_TIMES.map((slot) => (
          <button
            key={slot}
            type="button"
            className={`dtp-slot ${time === slot ? 'is-on' : ''}`}
            onClick={() => onChange(slot)}
          >
            {formatTimeLabel(slot)}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Popover shell
   ============================================================ */

function Popover({ label, summary, placeholder, icon, invalid, children, onClose, open, onToggle }) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onDocDown(e) {
      if (!rootRef.current?.contains(e.target)) onClose();
    }
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <div className={`dtp ${open ? 'is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className={`dtp-trigger ${invalid ? 'is-invalid' : ''} ${summary ? '' : 'is-empty'}`}
        onClick={onToggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
      >
        <span className="dtp-icon" aria-hidden="true">{icon}</span>
        <span className="dtp-value">{summary || placeholder}</span>
        <span className="dtp-caret" aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="dtp-panel" role="dialog" aria-label={label}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Public components
   ============================================================ */

/** Date + time in one popover. Value: `YYYY-MM-DDTHH:mm`. */
export default function DateTimePicker({
  value,
  onChange,
  min,
  label = 'Date and time',
  placeholder = 'Pick a date and time',
  invalid = false,
}) {
  const [open, setOpen] = useState(false);
  const { dateKey, time } = splitValue(value);
  const minKey = min || todayKey();

  const commit = (nextDate, nextTime) => {
    if (!nextDate) return;
    onChange(`${nextDate}T${nextTime || '19:00'}`);
  };

  const summary = dateKey ? `${formatDateLabel(dateKey)} · ${formatTimeLabel(time || '19:00')}` : '';

  return (
    <Popover
      label={label}
      icon="🗓"
      summary={summary}
      placeholder={placeholder}
      invalid={invalid}
      open={open}
      onToggle={() => setOpen((v) => !v)}
      onClose={() => setOpen(false)}
    >
      <Calendar selectedKey={dateKey} minKey={minKey} onPick={(key) => commit(key, time)} />
      <div className="dtp-divider" />
      <TimeBoard time={time} onChange={(t) => commit(dateKey || todayKey(), t)} />
      <div className="dtp-foot">
        <span className="dtp-foot-summary">{summary || 'Nothing picked yet'}</span>
        <button type="button" className="btn btn-sm" onClick={() => setOpen(false)}>
          Done
        </button>
      </div>
    </Popover>
  );
}

/** Date only. Value: `YYYY-MM-DD`. */
export function DatePicker({
  value,
  onChange,
  min,
  label = 'Date',
  placeholder = 'Pick a date',
  compact = false,
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      label={label}
      icon="🗓"
      summary={value ? formatDateLabel(value, compact) : ''}
      placeholder={placeholder}
      open={open}
      onToggle={() => setOpen((v) => !v)}
      onClose={() => setOpen(false)}
    >
      <Calendar
        selectedKey={value}
        minKey={min || todayKey()}
        onPick={(key) => {
          onChange(key);
          setOpen(false);
        }}
      />
    </Popover>
  );
}

/** Time only. Value: `HH:mm`. */
export function TimePicker({ value, onChange, label = 'Time', placeholder = 'Pick a time' }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      label={label}
      icon="🕒"
      summary={value ? formatTimeLabel(value) : ''}
      placeholder={placeholder}
      open={open}
      onToggle={() => setOpen((v) => !v)}
      onClose={() => setOpen(false)}
    >
      <TimeBoard time={value} onChange={onChange} />
      <div className="dtp-foot">
        <span className="dtp-foot-summary">{value ? formatTimeLabel(value) : 'Nothing picked yet'}</span>
        <button type="button" className="btn btn-sm" onClick={() => setOpen(false)}>
          Done
        </button>
      </div>
    </Popover>
  );
}
