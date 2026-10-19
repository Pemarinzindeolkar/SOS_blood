export function FormMessage({ state }: { state: { error?: string; success?: string } }) {
  if (state.error) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
        {state.success}
      </p>
    );
  }
  return null;
}
