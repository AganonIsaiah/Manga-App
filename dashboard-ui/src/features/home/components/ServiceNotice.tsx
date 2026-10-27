export default function ServiceNotice({
  error,
  retry,
  label = "Loading…",
}: {
  error: Error | null;
  retry: () => void;
  label?: string;
}) {
  if (!error)
    return (
      <p className="p-6 text-sm text-slate-400" role="status">
        {label}
      </p>
    );
  return (
    <div className="empty-state">
      <p role="alert">{error.message}</p>
      <button type="button" className="action-secondary mt-4" onClick={retry}>
        Try again
      </button>
    </div>
  );
}
