
const LandingPage = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="w-full bg-gray-950 flex items-center min-h-[calc(110vh)] text-white py-24 relative overflow-hidden">
        <div className="w-full max-w-6xl px-4 z-10 ml-auto">
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-extrabold mb-6">
            <span className="text-blue-400">&lt;/&gt; DevMeet</span> built for <br />
            collaborations
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mb-16 mt-[20px]">
            Spin up real-time collaborative coding environments with built-in
            video, chat, and code execution — perfect for interviews, pair
            programming, and team debugging.
          </p>

        </div>
      </section>
    </>
  );
};

export default LandingPage;
