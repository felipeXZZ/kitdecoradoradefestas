export function Logo({ tamanho = "md" }: { tamanho?: "md" | "lg" }) {
  const grande = tamanho === "lg";
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className={`relative grid place-items-center rounded-xl bg-framboesa font-titulo text-white ${
          grande ? "size-12 text-2xl" : "size-8 text-base"
        }`}
      >
        K
        <span
          className={`absolute rounded-full bg-confete ring-2 ring-papel ${
            grande ? "-top-1 -right-1 size-3.5" : "-top-0.5 -right-0.5 size-2.5"
          }`}
        />
      </span>
      <span className={`font-titulo leading-none text-ameixa ${grande ? "text-2xl" : "text-lg"}`}>
        Kit da Decoradora
      </span>
    </span>
  );
}
