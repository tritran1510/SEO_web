import type { ChangeEvent, HTMLInputTypeAttribute } from "react";

type BaseFieldProps = {
  id?: string;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  helperText?: string;
  issues?: string[];
  tone?: "default" | "attention";
};

type InputFieldProps = BaseFieldProps & {
  as?: "input";
  type?: HTMLInputTypeAttribute;
};

type TextareaFieldProps = BaseFieldProps & {
  as: "textarea";
  type?: never;
};

type FieldProps = InputFieldProps | TextareaFieldProps;

export function Field({
  id,
  as = "input",
  label,
  value,
  onChange,
  placeholder,
  rows,
  helperText,
  issues = [],
  tone = "default",
  type = "text",
}: FieldProps) {
  const controlClassName =
    tone === "attention" ? "field__control field__control--attention" : "field__control";
  const helperId = id ? `${id}-helper` : undefined;
  const issuesId = id ? `${id}-issues` : undefined;
  const describedBy = [helperText ? helperId : undefined, issues.length > 0 ? issuesId : undefined]
    .filter(Boolean)
    .join(" ");

  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {as === "textarea" ? (
        <textarea
          id={id}
          className={controlClassName}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          aria-invalid={issues.length > 0}
          aria-describedby={describedBy || undefined}
        />
      ) : (
        <input
          id={id}
          className={controlClassName}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          type={type}
          aria-invalid={issues.length > 0}
          aria-describedby={describedBy || undefined}
        />
      )}
      {helperText ? (
        <span id={helperId} className="field__helper">
          {helperText}
        </span>
      ) : null}
      {issues.length > 0 ? (
        <ul id={issuesId} className="field__issues">
          {issues.slice(0, 2).map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      ) : null}
    </label>
  );
}
