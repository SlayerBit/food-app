export const ErrorState = ({ message }: { message: string }) => (
  <div className="card mx-auto max-w-lg p-8 text-center">
    <p className="text-lg font-semibold text-slate-800">We couldn&apos;t load this</p>
    <p className="mt-2 text-sm text-red-600">{message}</p>
  </div>
);
