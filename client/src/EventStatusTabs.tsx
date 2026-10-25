import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import type { EventFilter } from './eventPresentation';

const options: { value: EventFilter; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'upcoming', label: '開催予定' },
  { value: 'ongoing', label: '開催中' },
  { value: 'ended', label: '終了' },
];
export const eventStatusTabId = (value: EventFilter) => `event-status-${value}`;

export default function EventStatusTabs({ value, onChange, panelId }: {
  value: EventFilter;
  onChange: (value: EventFilter) => void;
  panelId: string;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    switch (event.key) {
      case 'ArrowRight': next = (index + 1) % options.length; break;
      case 'ArrowLeft': next = (index + options.length - 1) % options.length; break;
      case 'Home': next = 0; break;
      case 'End': next = options.length - 1; break;
      default: return;
    }
    event.preventDefault();
    buttons.current[next]?.focus();
    onChange(options[next].value);
  }
  return <div className="events-filters" role="tablist" aria-label="開催状況" aria-orientation="horizontal">
    {options.map((option, index) => <button key={option.value} ref={element => { buttons.current[index] = element; }} type="button" role="tab" id={eventStatusTabId(option.value)} aria-controls={panelId} aria-selected={value === option.value} tabIndex={value === option.value ? 0 : -1} className={value === option.value ? 'active' : ''} onClick={() => onChange(option.value)} onKeyDown={event => navigate(event, index)}>{option.label}</button>)}
  </div>;
}
