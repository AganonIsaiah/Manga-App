export default function Search() {
  return (
    <div className="home-height w-full flex flex-col gap-3 items-center justify-center">
      <h1 className="text-2xl font-semibold">What do you want to read?</h1>
      <p className="text-sm text-gray-400">
        Search a title/author, describe a story...
      </p>

      <div className="w-[400px] ">
        <input
        className="w-full"
          type="text"
          placeholder="A dark twisted fantasy, like that kanye album..."
        />
      </div>
    </div>
  );
}
