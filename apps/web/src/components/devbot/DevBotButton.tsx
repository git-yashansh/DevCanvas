import { useDevBot } from "./DevBotContext";
import botLogo from "../../styles/botlogo.png";
import "./devbot.css";

export function DevBotButton() {
  const { chatOpen, openChat, closeChat } = useDevBot();

  if (chatOpen) return null;

  return (
    <button
      id="devbot-floating-btn"
      onClick={openChat}
      aria-label="Open DevBot Guide"
      className="devbot-bubble fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#0A0A0E] border border-white/10 hover:border-purple-500/40 select-none cursor-pointer outline-none active:scale-95"
    >
      {/* Pink -> Purple -> Orange radial glow border wrapper */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500/20 via-purple-600/35 to-orange-400/20 opacity-80 blur-[2px] transition-opacity duration-300 group-hover:opacity-100" />
      
      {/* Circular wrapper holding botlogo.png */}
      <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-black/40 p-0.5">
        <img
          src={botLogo}
          alt="DevBot Guide"
          className="h-full w-full object-contain"
        />
      </div>
    </button>
  );
}
