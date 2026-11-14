export function formatDateTime(value) {
  if (!value) return 'Not specified';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not specified';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function fromDateTimeLocal(value) {
  if (!value) return '';
  return new Date(value).toISOString();
}

export function formatStatus(status) {
  if (!status) return 'Unknown';
  return status
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getErrorMessage(error) {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}
