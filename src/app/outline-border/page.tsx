export default function OutlineBorderPage() {
  return (
    <div className="flex h-screen w-screen justify-center items-center gap-8">
      <div className="w-30 h-30 bg-gray-100 rounded-4xl border-8"></div>
      <div className="w-30 h-30 bg-gray-100 rounded-4xl outline-8"></div>
    </div>
  );
}
