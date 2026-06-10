"use client"

import { useRef, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

const TOGETHER_SINCE = new Date("2025-05-02T20:30:00")

function getTimeTogether() {
  const now = new Date()
  const diff = now.getTime() - TOGETHER_SINCE.getTime()
  const totalSeconds = Math.floor(diff / 1000)
  const totalMinutes = Math.floor(diff / (1000 * 60))
  const totalHours = Math.floor(diff / (1000 * 60 * 60))
  const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24))
  const totalMonths = Math.floor(totalDays / 30.44)
  const years = Math.floor(totalDays / 365.25)
  const remainingMonths = Math.floor((totalDays % 365.25) / 30.44)
  const remainingDays = totalDays % 30
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return { years, remainingMonths, remainingDays, hours, minutes, seconds, totalSeconds, totalMinutes, totalHours, totalDays, totalMonths }
}

const FULL_MESSAGE = `Oi, minha princesa... 💕

Se você chegou até aqui, é porque ou eu te contei esse segredinho com o coração cheio de amor, ou você é incrível demais e descobriu sozinha, e honestamente, não me surpreenderia, porque você sempre me surpreende.

Eu queria usar esse espacinho escondido pra te dizer o que às vezes no dia a dia, não consigo transmitir direito:

Eu tenho tanto orgulho de você. Da pessoa que você é, da forma como você enfrenta as coisas, do seu sorriso maravilhoso. Ser seu namorado é uma das coisas que mais me enchem de felicidade nessa vida.

Você é minha pessoa favorita no mundo. Não tem comparação, não tem segundo lugar. É você, sempre você, e sempre será.

Eu não sei direito como o futuro vai ser, mas sei que quero cada parte dele do seu lado. Cada viagem, cada meta, cada caixinha que a gente for preenchendo juntos, tudo faz mais sentido quando é com você.

Te amo de um jeito que ainda não sei explicar completamente. É um sentimento que cresce todos os dias, nos detalhes, nos momentos simples, e que me faz ter cada vez mais certeza de que você é a melhor parte da minha vida.

Com todo meu amor,
Ruan ❤️`

const PHOTOS = Array.from({ length: 11 }, (_, i) => `/photos/${i + 1}.jpeg`)

function Heart({ style }: { style: React.CSSProperties }) {
  return (
    <div className="absolute text-pink-400 animate-bounce select-none pointer-events-none" style={style}>♥</div>
  )
}

function Envelope({ onOpen }: { onOpen: () => void }) {
  const [opening, setOpening] = useState(false)

  function handleClick() {
    if (opening) return
    setOpening(true)
    setTimeout(onOpen, 1200)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-pink-300 text-sm opacity-70 animate-pulse">uma cartinha te esperava aqui...</p>
      <div onClick={handleClick} className="cursor-pointer select-none" style={{ width: 220, height: 160, position: "relative" }}>
        <div className="absolute inset-0 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #831843 0%, #500724 100%)", boxShadow: "0 8px 32px rgba(236,72,153,0.3)" }}>
          <div className="absolute bottom-0 left-0 w-0 h-0"
            style={{ borderStyle: "solid", borderWidth: "0 0 70px 110px", borderColor: "transparent transparent #9d174d transparent" }} />
          <div className="absolute bottom-0 right-0 w-0 h-0"
            style={{ borderStyle: "solid", borderWidth: "0 110px 70px 0", borderColor: "transparent #9d174d transparent transparent" }} />
          <div className="absolute top-0 left-0 right-0"
            style={{
              height: 80,
              transformOrigin: "top center",
              transform: opening ? "rotateX(180deg)" : "rotateX(0deg)",
              transition: "transform 0.8s ease-in-out",
            }}>
            <div className="w-0 h-0 mx-auto"
              style={{ borderStyle: "solid", borderWidth: "80px 110px 0 110px", borderColor: "#a21c5a transparent transparent transparent" }} />
          </div>
          <span className="text-4xl z-10 relative" style={{
            filter: "drop-shadow(0 0 8px rgba(236,72,153,0.8))",
            transform: opening ? "scale(1.3)" : "scale(1)",
            transition: "transform 0.5s ease",
          }}>
            {opening ? "💌" : "❤️"}
          </span>
        </div>
      </div>
      {!opening && <p className="text-pink-400/50 text-xs">toque para abrir</p>}
      {opening && <p className="text-pink-300 text-xs animate-pulse">abrindo com amor... 💕</p>}
    </div>
  )
}

function Carousel() {
  const [current, setCurrent] = useState(0)
  const [transitioning, setTransitioning] = useState(false)

  function goTo(index: number) {
    if (transitioning) return
    setTransitioning(true)
    setTimeout(() => {
      setCurrent(index)
      setTransitioning(false)
    }, 300)
  }

  function prev() {
    goTo(current === 0 ? PHOTOS.length - 1 : current - 1)
  }

  function next() {
    goTo(current === PHOTOS.length - 1 ? 0 : current + 1)
  }

  // Auto avança a cada 4 segundos
  useEffect(() => {
    const interval = setInterval(next, 4000)
    return () => clearInterval(interval)
  }, [current])

  return (
    <div className="w-full space-y-3">
      <p className="text-center text-pink-300/60 text-xs uppercase tracking-wider">nossos momentos 📸</p>

      <div className="relative w-full aspect-square rounded-3xl overflow-hidden border border-pink-800/30"
        style={{ boxShadow: "0 0 40px rgba(236,72,153,0.15)" }}>

        {/* Foto atual */}
        <img
          src={PHOTOS[current]}
          alt={`Foto ${current + 1}`}
          className="w-full h-full object-cover transition-opacity duration-300"
          style={{ opacity: transitioning ? 0 : 1 }}
        />

        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-pink-950/60 via-transparent to-transparent pointer-events-none" />

        {/* Botões prev/next */}
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-pink-900/60 border border-pink-700/40 rounded-full w-9 h-9 flex items-center justify-center text-white backdrop-blur-sm hover:bg-pink-800/60 transition-colors"
        >
          ‹
        </button>
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-pink-900/60 border border-pink-700/40 rounded-full w-9 h-9 flex items-center justify-center text-white backdrop-blur-sm hover:bg-pink-800/60 transition-colors"
        >
          ›
        </button>

        {/* Contador de foto */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-pink-900/60 backdrop-blur-sm rounded-full px-3 py-1">
          <p className="text-xs text-pink-200">{current + 1} / {PHOTOS.length}</p>
        </div>
      </div>

      {/* Bolinhas */}
      <div className="flex justify-center gap-1.5">
        {PHOTOS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="rounded-full transition-all"
            style={{
              width: i === current ? 20 : 6,
              height: 6,
              backgroundColor: i === current ? "#f9a8d4" : "#831843",
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function LovePage() {
  const router = useRouter()
  const [displayed, setDisplayed] = useState("")
  const [msgIndex, setMsgIndex] = useState(0)
  const [showCounter, setShowCounter] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [envelopeOpened, setEnvelopeOpened] = useState(false)
  const [hearts, setHearts] = useState<React.CSSProperties[]>([])
  const [stars, setStars] = useState<{ x: number; y: number; size: number; delay: number }[]>([])
  const [time, setTime] = useState(getTimeTogether())
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeTogether()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setStars(Array.from({ length: 60 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3,
    })))
    setHearts(Array.from({ length: 18 }, () => ({
      left: `${Math.random() * 90 + 5}%`,
      top: `${Math.random() * 80 + 10}%`,
      fontSize: `${Math.random() * 18 + 10}px`,
      opacity: Math.random() * 0.4 + 0.1,
      animationDelay: `${Math.random() * 2}s`,
      animationDuration: `${Math.random() * 1.5 + 1.5}s`,
    })))
    const t1 = setTimeout(() => setShowCounter(true), 400)
    return () => clearTimeout(t1)
  }, [])

  function handleEnvelopeOpen() {
    setEnvelopeOpened(true)
    setTimeout(() => setShowMessage(true), 300)
    if (audioRef.current) {
      audioRef.current.volume = 0.4
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {})
    }
  }

  useEffect(() => {
    if (!showMessage) return
    if (msgIndex >= FULL_MESSAGE.length) return
    const timeout = setTimeout(() => {
      setDisplayed(FULL_MESSAGE.slice(0, msgIndex + 1))
      setMsgIndex((i) => i + 1)
    }, msgIndex < 3 ? 80 : 18)
    return () => clearTimeout(timeout)
  }, [showMessage, msgIndex])

  return (
    <div className="min-h-screen bg-[#1a0010] text-white overflow-hidden relative flex flex-col items-center px-4 py-12">

      {/* Estrelas */}
      {stars.map((s, i) => (
        <div key={i} className="absolute rounded-full bg-white pointer-events-none"
          style={{
            left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size,
            opacity: 0.3,
            animation: `pulse ${1.5 + s.delay}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
          }} />
      ))}

      {/* Corações */}
      {hearts.map((h, i) => <Heart key={i} style={h} />)}

      <audio ref={audioRef} src="/music.mp3" loop />

      {/* Botão música */}
      <button
        onClick={() => {
          if (!audioRef.current) return
          if (playing) {
            audioRef.current.pause()
            setPlaying(false)
          } else {
            audioRef.current.play()
            setPlaying(true)
          }
        }}
        className="fixed bottom-6 right-6 z-50 bg-pink-900/60 border border-pink-700/40 rounded-full w-11 h-11 flex items-center justify-center text-lg backdrop-blur-sm hover:bg-pink-800/60 transition-colors"
      >
        {playing ? "🔇" : "🎵"}
      </button>

      <div className="relative z-10 w-full max-w-lg flex flex-col items-center gap-8">

        {/* Título */}
        <div className="text-center">
          <p className="text-pink-300 text-sm tracking-widest uppercase mb-2 opacity-80">um segredinho para</p>
          <h1 className="text-5xl font-bold text-white mb-1"
            style={{ fontFamily: "Georgia, serif", textShadow: "0 0 30px rgba(236,72,153,0.5)" }}>
            Lívia
          </h1>
          <p className="text-pink-200 text-sm opacity-60">de Ruan, com todo amor do mundo 🧡</p>
        </div>

        {/* Contador */}
        {showCounter && (
          <div className="w-full space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: time.years, label: time.years === 1 ? "ano" : "anos" },
                { value: time.remainingMonths, label: time.remainingMonths === 1 ? "mês" : "meses" },
                { value: time.remainingDays, label: time.remainingDays === 1 ? "dia" : "dias" },
              ].map((item, i) => (
                <div key={i} className="bg-pink-900/30 border border-pink-700/30 rounded-2xl p-4 text-center backdrop-blur-sm">
                  <p className="text-3xl font-bold text-pink-200">{item.value}</p>
                  <p className="text-xs text-pink-400 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: String(time.hours).padStart(2, "0"), label: "horas" },
                { value: String(time.minutes).padStart(2, "0"), label: "minutos" },
                { value: String(time.seconds).padStart(2, "0"), label: "segundos" },
              ].map((item, i) => (
                <div key={i} className="bg-pink-900/20 border border-pink-700/20 rounded-2xl p-3 text-center backdrop-blur-sm">
                  <p className="text-2xl font-bold text-pink-300 tabular-nums">{item.value}</p>
                  <p className="text-xs text-pink-500 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-pink-900/10 border border-pink-800/20 rounded-2xl p-4 space-y-2 backdrop-blur-sm">
              <p className="text-xs text-pink-400/60 text-center mb-3 uppercase tracking-wider">em números</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: time.totalMonths.toLocaleString("pt-BR"), label: "meses no total" },
                  { value: time.totalDays.toLocaleString("pt-BR"), label: "dias no total" },
                  { value: time.totalHours.toLocaleString("pt-BR"), label: "horas no total" },
                  { value: time.totalMinutes.toLocaleString("pt-BR"), label: "minutos no total" },
                ].map((item, i) => (
                  <div key={i} className="text-center py-2">
                    <p className="text-lg font-bold text-pink-200 tabular-nums">{item.value}</p>
                    <p className="text-xs text-pink-500">{item.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-center text-pink-400/40 text-xs tabular-nums pt-1 border-t border-pink-800/20">
                {time.totalSeconds.toLocaleString("pt-BR")} segundos de amor ♥
              </p>
            </div>
            <p className="text-center text-pink-400/40 text-xs">juntos desde 02 de maio de 2025 às 20h30 ♥</p>
          </div>
        )}

        {/* Carrossel — aparece junto com o contador */}
        {showCounter && <Carousel />}

        {/* Envelope */}
        {showCounter && !envelopeOpened && (
          <Envelope onOpen={handleEnvelopeOpen} />
        )}

        {/* Mensagem */}
        {showMessage && (
          <div className="bg-pink-950/50 border border-pink-800/30 rounded-3xl p-6 backdrop-blur-sm w-full">
            <p className="text-pink-100 text-sm leading-relaxed whitespace-pre-wrap">
              {displayed}
              {msgIndex < FULL_MESSAGE.length && (
                <span className="inline-block w-0.5 h-4 bg-pink-400 ml-0.5 animate-pulse" />
              )}
            </p>
          </div>
        )}

        {msgIndex >= FULL_MESSAGE.length && (
          <button
            onClick={() => router.push("/dashboard")}
            className="text-pink-400/50 text-xs hover:text-pink-300 transition-colors mt-4"
          >
            ← voltar para as caixinhas
          </button>
        )}
      </div>
    </div>
  )
}