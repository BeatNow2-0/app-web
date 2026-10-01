import React from 'react';
import Select, { MultiValue, SingleValue } from 'react-select';

export interface Option { value: string; label: string }
interface GlobalSelectProps {
  options: Option[]; isSearchable?: boolean; isMulti?: boolean; placeholder?: string;
  onChange?: (selected: Option | Option[] | null) => void; value?: Option | Option[] | null | string;
}

export default function GlobalSelect({ options, isSearchable = true, isMulti = false, placeholder, onChange, value }: GlobalSelectProps) {
  const normalizedValue = typeof value === 'string' ? options.find((option) => option.value === value) ?? null : value ?? (isMulti ? [] : null);
  return <Select<Option, boolean>
    options={options} isSearchable={isSearchable} isMulti={isMulti} placeholder={placeholder} value={normalizedValue}
    onChange={(selected: MultiValue<Option> | SingleValue<Option>) => onChange?.(Array.isArray(selected) ? [...selected] : selected as Option | null)}
    classNamePrefix="bn-select"
    styles={{
      control: (base, state) => ({ ...base, minHeight: 48, background: 'var(--color-surface-1)', borderColor: state.isFocused ? 'var(--color-accent)' : 'var(--color-border-strong)', borderRadius: 12, boxShadow: state.isFocused ? '0 0 0 3px var(--color-accent-muted)' : 'none', ':hover': { borderColor: 'var(--color-border-strong)' } }),
      menu: (base) => ({ ...base, zIndex: 3000, padding: 5, background: 'var(--color-surface-2)', border: '1px solid var(--color-border-strong)', borderRadius: 12, boxShadow: 'var(--shadow-lg)' }),
      option: (base, state) => ({ ...base, borderRadius: 8, background: state.isSelected ? 'var(--color-accent)' : state.isFocused ? 'var(--color-surface-hover)' : 'transparent', color: 'var(--color-text)' }),
      singleValue: (base) => ({ ...base, color: 'var(--color-text)' }), input: (base) => ({ ...base, color: 'var(--color-text)' }), placeholder: (base) => ({ ...base, color: 'var(--color-text-subtle)' }),
      multiValue: (base) => ({ ...base, background: 'var(--color-accent-muted)', borderRadius: 999 }), multiValueLabel: (base) => ({ ...base, color: 'var(--color-text)' }), multiValueRemove: (base) => ({ ...base, borderRadius: 999, ':hover': { background: 'rgba(251,113,133,.2)', color: 'var(--color-danger)' } }),
    }}
  />;
}
