function Hero() {
  return (
    <section id="home" className="font-display relative h-screen w-full overflow-hidden">

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
      <div className="relative z-10 flex h-full items-center justify-center px-6 text-center">
        <div className="max-w-6xl">

          {/* Title */}
          <h1 className="text-4xl font-extrabold text-white drop-shadow-lg md:text-6xl lg:text-7xl">
            คณะเทคโนโลยีอุตสาหกรรม
          </h1>

          {/* Subtitle */}
          <h2 className="mt-4 text-2xl font-semibold text-white drop-shadow-md md:text-3xl">
            INDUSTRIAL TECHNOLOGY
          </h2>

          {/* Description */}
          <p className="mx-auto mt-8 max-w-4xl text-lg font-medium leading-relaxed text-white drop-shadow-md md:text-2xl">
            มุ่งผลิตบัณฑิตที่มีความรู้ความสามารถด้านวิศวกรรมคอมพิวเตอร์
            <br />
            พร้อมสร้างสรรค์นวัตกรรมและเทคโนโลยี
            <br />
            เพื่อพัฒนาสังคมและประเทศอย่างยั่งยืน
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
