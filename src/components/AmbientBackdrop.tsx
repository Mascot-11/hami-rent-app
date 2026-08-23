export function AmbientBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
      <div className="absolute -top-44 right-[-10%] h-[560px] w-[560px] rounded-full bg-primary/20 hr-orb" />
      <div
        className="absolute top-[32%] left-[-12%] h-[480px] w-[480px] rounded-full bg-info/10 hr-orb"
        style={{ animationDelay: "-3s" }}
      />
      <div
        className="absolute bottom-[-18%] right-[12%] h-[460px] w-[460px] rounded-full bg-accent/70 hr-orb"
        style={{ animationDelay: "-6s" }}
      />
      <div className="absolute inset-0 hr-dots opacity-50 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_28%,black,transparent)]" />
    </div>
  );
}
