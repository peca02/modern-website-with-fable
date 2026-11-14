import { PiWarningLight } from "react-icons/pi";

type FormFieldProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  optionalTag?: string;
  type?: "text" | "email";
  inputMode?: "text" | "email";
  autoComplete: string;
  required?: boolean;
  readOnly?: boolean;
  ref?: React.Ref<HTMLInputElement>;
  className?: string;
};

/** One line of the form: a label that never leaves, large type, a hairline underneath. */
export function FormField({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  optionalTag,
  type = "text",
  inputMode = "text",
  autoComplete,
  required = false,
  readOnly = false,
  ref,
  className = "",
}: FormFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div data-form-row className={`group flex flex-col ${className}`}>
      <label
        htmlFor={id}
        className="type-micro flex items-baseline justify-between gap-4 text-ash transition-colors duration-300 group-focus-within:text-bone"
      >
        <span>{label}</span>
        {optionalTag ? <span>{optionalTag}</span> : null}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          name={name}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          autoCapitalize={type === "email" ? "none" : undefined}
          spellCheck={false}
          required={required}
          readOnly={readOnly}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className="type-lead peer block min-h-12 w-full rounded-none bg-transparent py-2 text-bone caret-plasma outline-none autofill:[transition:background-color_9999s,color_9999s]"
        />
        <span data-form-rule aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-rule-strong" />
        <span
          aria-hidden="true"
          className={`absolute inset-x-0 bottom-0 h-px origin-left bg-plasma transition-transform duration-500 ease-reveal ${
            error ? "scale-x-100" : "scale-x-0 peer-focus:scale-x-100"
          }`}
        />
      </div>
      <p id={errorId} aria-live="polite" className="type-micro flex min-h-8 items-center gap-2 text-plasma">
        {error ? (
          <>
            <PiWarningLight aria-hidden="true" className="size-4 shrink-0" />
            <span className="text-bone">{error}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}
