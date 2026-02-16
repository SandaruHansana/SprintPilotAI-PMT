export function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {title && <h2 className="mb-3 text-lg font-semibold text-slate-800">{title}</h2>}
      {children}
    </div>
  );
}

export function Button({ children, ...props }) {
  return (
    <button
      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ label, ...props }) {
  return (
    <label className="block">
      {label && <div className="mb-1 text-sm font-medium text-slate-700">{label}</div>}
      <input
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
        {...props}
      />
    </label>
  );
}

export function Textarea({ label, ...props }) {
  return (
    <label className="block">
      {label && <div className="mb-1 text-sm font-medium text-slate-700">{label}</div>}
      <textarea
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
        {...props}
      />
    </label>
  );
}
