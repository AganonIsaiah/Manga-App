import { ArrowLeft } from "lucide-react";
import { View2ListMangasProps } from "./search.types";

export default function View2ListMangas({
  query,
  onBack,
}: View2ListMangasProps) {
  return (
    <section
      className="flex w-full flex-col gap-6 items-center justify-center"
      aria-labelledby="results-title"
    >
      <button
        type="button"
        onClick={onBack}
        className="btn-transitions flex w-fit items-center gap-2 text-sm text-gray-400 hover:text-white"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        New search
      </button>

      <div>
        <h1 id="results-title" className="text-3xl font-semibold">
          Search results
        </h1>
        <p className="mt-2 text-gray-400">
          Results for <span className="text-white">“{query}”</span>
        </p>
      </div>

      <div
        aria-live="polite"
        className="primary-border rounded-md p-6 text-gray-400"
      >
        Manga results will appear here.
      </div>
    </section>
  );
}
