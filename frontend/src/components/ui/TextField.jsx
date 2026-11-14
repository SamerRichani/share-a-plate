function TextField({ error, hint, id, label, className = '', ...props }) {
  const descriptionIds = [
    hint ? `${id}-hint` : null,
    error ? `${id}-error` : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`field ${className}`.trim()}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <input
        className={`field__input${error ? ' field__input--error' : ''}`}
        id={id}
        aria-describedby={descriptionIds || undefined}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {hint && (
        <span className="field__hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
      {error && (
        <span className="field__error" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}

export default TextField;
