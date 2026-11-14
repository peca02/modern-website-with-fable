import { PiWarningLight } from "react-icons/pi";

type InterestChoiceProps = {
  id: string;
  name: string;
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  firstOptionRef?: React.Ref<HTMLInputElement>;
  className?: string;
};

/** A native radio group drawn as underlined words: the chosen one gets the plasma thread. */
export function InterestChoice({
  id,
  name,
  label,
  options,
  value,
  onChange,
  error,
  disabled = false,
  firstOptionRef,
  className = "",
}: InterestChoiceProps) {
  const errorId = `${id}-error`;

  return (
    <fieldset
      data-form-row
      role="radiogroup"
      aria-required="true"
      aria-invalid={error ? true : undefined}
      aria-describedby={errorId}
      className={`flex min-w-0 flex-col ${className}`}
    >
      <legend className="type-micro text-ash">{label}</legend>
      <div className="grid grid-cols-2 gap-x-6">
        {options.map((option, index) => (
          <label
            key={option}
            className="group relative flex min-h-12 cursor-pointer items-center gap-3 has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-plasma"
          >
            <input
              ref={index === 0 ? firstOptionRef : undefined}
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              disabled={disabled}
              onChange={() => onChange(option)}
              className="peer sr-only"
            />
            <span aria-hidden="true" className="type-micro text-ash transition-colors duration-300 peer-checked:text-plasma">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="type-body text-ash transition-colors duration-300 group-hover:text-bone peer-checked:text-bone">
              {option}
            </span>
            <span data-form-rule aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-rule" />
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-plasma transition-transform duration-500 ease-reveal peer-checked:scale-x-100"
            />
          </label>
        ))}
      </div>
      <p id={errorId} aria-live="polite" className="type-micro flex min-h-8 items-center gap-2 text-plasma">
        {error ? (
          <>
            <PiWarningLight aria-hidden="true" className="size-4 shrink-0" />
            <span className="text-bone">{error}</span>
          </>
        ) : null}
      </p>
    </fieldset>
  );
}
