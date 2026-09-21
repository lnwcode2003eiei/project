function Hero() {
  return (
    <section id="home" className="relative min-h-svh w-full overflow-hidden">

      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/video/campus.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Content */}
      <div className="relative z-10 flex min-h-svh items-center justify-center px-6 pb-28 pt-32 text-center">
        <div className="max-w-6xl">

          {/* Title */}
          <h1 className="text-3xl font-bold leading-snug text-white drop-shadow-lg md:text-5xl lg:text-6xl">
            คณะเทคโนโลยีอุตสาหกรรม
          </h1>

          {/* Subtitle */}
          <h2 className="mt-4 text-2xl font-semibold text-white drop-shadow-md md:text-3xl">
            INDUSTRIAL TECHNOLOGY
          </h2>

          {/* Description */}
          <h3 className="mx-auto mt-8 max-w-4xl text-xl font-bold leading-relaxed text-white drop-shadow-md md:text-3xl">
            มุ่งเน้นนวัตกรรม เทคโนโลยี และการปฏิบัติจริง
          </h3>
          <p className="mx-auto mt-4 max-w-4xl text-base font-medium leading-relaxed text-white drop-shadow-md md:text-xl">
            เรามุ่งสร้างบัณฑิตนักปฏิบัติสายวิศวกรรมและเทคโนโลยีที่มีทักษะตรงความต้องการของอุตสาหกรรมยุคใหม่ พร้อมขับเคลื่อนผู้ประกอบการในอนาคต
          </p>

        </div>
      </div>

      {/* Scroll Down */}
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bounce text-center text-white">
        <p className="text-sm">Scroll Down</p>
        <div className="text-2xl">⌄</div>
      </div>

    </section>
  );
}

export default Hero;
