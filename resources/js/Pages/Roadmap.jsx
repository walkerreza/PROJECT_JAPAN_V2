import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import GuestNavbar from '@/Components/Layout/GuestNavbar';
import Footer from '@/Components/Layout/GuestFooter';
import Button from '@/Components/UI/Button';
import Badge from '@/Components/UI/Badge';
import theme from '@/Components/theme/themes';
import FallEffect from '@/Components/theme/FallEffect';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import TranslateIcon from '@mui/icons-material/Translate';
import DirectionsTransitIcon from '@mui/icons-material/DirectionsTransit';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import MenuBookIcon from '@mui/icons-material/MenuBook';


const units = [
  {
    id: 1,
    title: 'Pola Kalimat Dasar',
    subtitle: 'Mulai belajarmu di sini',
    status: 'done',
    icon: <TranslateIcon sx={{ fontSize: 32, color: '#fff' }} />,
  },
  {
    id: 2,
    title: 'Kanji Transportasi',
    subtitle: 'Review materi',
    status: 'active',
    icon: <DirectionsTransitIcon sx={{ fontSize: 32, color: '#fff' }} />,
  },
  {
    id: 3,
    title: 'Partikel N3',
    subtitle: 'Terkunci',
    status: 'locked',
    icon: <AutoStoriesIcon sx={{ fontSize: 32, color: '#afafaf' }} />,
  },
  {
    id: 4,
    title: 'Kehormatan (Keigo)',
    subtitle: 'Terkunci',
    status: 'locked',
    icon: <RecordVoiceOverIcon sx={{ fontSize: 32, color: '#afafaf' }} />,
  },
  {
    id: 5,
    title: 'Dokkai (Membaca)',
    subtitle: 'Terkunci',
    status: 'locked',
    icon: <MenuBookIcon sx={{ fontSize: 32, color: '#afafaf' }} />,
  },
  {
    id: 6,
    title: 'Choukai (Menyimak)',
    subtitle: 'Terkunci',
    status: 'locked',
    icon: <HeadphonesIcon sx={{ fontSize: 32, color: '#afafaf' }} />,
  },
  {
    id: 7,
    title: 'Ujian Akhir N3',
    subtitle: 'Tantangan Terakhir',
    status: 'locked',
    icon: <EmojiEventsIcon sx={{ fontSize: 36, color: '#afafaf' }} />,
    isFinal: true,
  },
];

const features = [
  {
    title: 'Kanji Interaktif',
    icon: <TranslateIcon sx={{ fontSize: 28 }} />,
    desc: 'Belajar menulis dengan urutan coretan yang benar melalui simulasi layar sentuh yang presisi.',
  },
  {
    title: 'Tata Bahasa',
    icon: <AutoStoriesIcon sx={{ fontSize: 28 }} />,
    desc: 'Penjelasan pola kalimat yang dikemas dengan konteks kehidupan sehari-hari di Jepang.',
  },
  {
    title: 'Latihan Menyimak',
    icon: <HeadphonesIcon sx={{ fontSize: 28 }} />,
    desc: 'Audio kristal jernih dari penutur asli Tokyo untuk melatih pendengaran dan aksen Anda.',
  },
];

export default function Roadmap() {
  const [tooltip, setTooltip] = useState(null);

  return (
    <>
      <FallEffect />
      <Head title="Roadmap - Japanlingo" />
      <GuestNavbar />

      {/* Hero */}
      <section className="px-6 lg:px-40 py-16 lg:py-24 bg-gradient-to-b from-red-600/5 to-transparent">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex flex-col gap-6 flex-1 text-center lg:text-left">
            <div className="inline-flex items-center self-center lg:self-start px-3 py-1 rounded-full bg-red-600/10 text-red-600 text-xs font-bold uppercase tracking-wider">
              Kurikulum JLPT N3
            </div>
            <h1 className="text-slate-900 dark:text-slate-100 text-4xl lg:text-6xl font-black leading-tight tracking-tight">
              Taklukkan <span className="text-red-600">JLPT N3</span> dengan<br />Metode Interaktif
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg lg:text-xl font-normal leading-relaxed max-w-2xl">
              Kurikulum khusus N3 yang dirancang seperti permainan. Pelajari pola kalimat, kanji, dan percakapan bisnis dalam langkah-langkah kecil yang menyenangkan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
              <Button href="/register" className="flex items-center justify-center rounded-xl h-14 px-8 !bg-red-600 !text-white text-lg font-bold shadow-xl shadow-red-600/30 hover:-translate-y-1 transition-all w-full sm:w-auto">
                Mulai Gratis →
              </Button>
              <Button href="/pricing" variant="outline" className="flex items-center justify-center rounded-xl h-14 px-8 !bg-white dark:bg-slate-800 border-2 !border-red-600/20 !text-slate-700 dark:!text-slate-200 text-lg font-bold hover:!bg-slate-50 transition-all w-full sm:w-auto">
                Lihat Paket
              </Button>
            </div>
          </div>
          <div className="flex-1 w-full max-w-md hidden lg:block">
            <div className="relative aspect-square rounded-3xl bg-gradient-to-tr from-red-600 to-rose-400 p-1 shadow-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all"></div>
              <img className="w-full h-full object-cover rounded-[calc(1.5rem-4px)]" alt="Japanlingo Landing Page" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBy4j71o0cBeApBo0ViK6wMpX6RnWOR3Vu3F3gqK59NFiV87D7Ek2JKd6En_jjcDGxQMEd8cMMOCcas1J9IR-r9grma47CmN36IKmidGpXdHUXRVzbHgK-o476wNAzMkM7kfgOAZuyUfsbWfHjWoS53OAXOcHS7SbdJItFYPqG_RYMjCGur7AutbaPFdqhy8e7gOoqBREm69FayGuiQMfolPw0fiEX6XzStfgxYTlz2vPuwh4k7VrsmhD1p4C8mxAZ_9pn7eaQL4eA" />
            </div>
          </div>
        </div>
      </section>

      {/* Duolingo-style Path */}
      <section className={`px-6 py-20 ${theme.sectionBg}`}>
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-14">
            <Badge color="red" className="mb-4">Peta Perjalanan</Badge>
            <h2 className="text-3xl font-black text-gray-900 mb-3">Peta Perjalanan N3</h2>
            <p className="text-gray-500 text-sm">Selesaikan setiap unit untuk membuka materi selanjutnya</p>
          </div>

          <div className="relative" style={{ minHeight: `${units.length * 120}px` }}>
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 400 ${units.length * 120}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="pathGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.pathGrad[0]} />
                  <stop offset="40%" stopColor={theme.pathGrad[1]} />
                  <stop offset="100%" stopColor={theme.pathGrad[2]} />
                </linearGradient>
              </defs>
              {units.slice(0, -1).map((_, i) => {
                const positions = [200, 120, 60, 120, 200, 260, 200];
                const x1 = positions[i] ?? 200;
                const x2 = positions[i + 1] ?? 200;
                const y1 = i * 120 + 60;
                const y2 = (i + 1) * 120 + 60;
                return (
                  <line
                    key={i}
                    x1={x1} y1={y1}
                    x2={x2} y2={y2}
                    stroke="url(#pathGrad)"
                    strokeWidth="6"
                    strokeDasharray="10 6"
                    strokeLinecap="round"
                    opacity="0.5"
                  />
                );
              })}
            </svg>

            {units.map((unit, i) => {
              const positions = ['50%', '30%', '15%', '30%', '50%', '65%', '50%'];
              const left = positions[i] ?? '50%';
              const isDone = unit.status === 'done';
              const isActive = unit.status === 'active';
              const nodeColor = isDone ? theme.doneColor : isActive ? theme.activeColor : '#E5E5E5';
              const nodeShadow = isDone ? theme.doneShadow : isActive ? theme.activeShadow : '#C4C4C4';

              return (
                <div
                  key={unit.id}
                  className="absolute"
                  style={{ left, top: `${i * 120}px`, transform: 'translateX(-50%)' }}
                >
                  {tooltip === i && (
                    <div
                      className="absolute z-20 bottom-full mb-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-xl px-4 py-2.5 whitespace-nowrap shadow-xl text-center"
                      style={{ minWidth: '140px' }}
                    >
                      <p className="font-bold">{unit.title}</p>
                      <p className="text-gray-400 mt-0.5">{unit.subtitle}</p>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-4 border-transparent border-t-gray-900" />
                    </div>
                  )}

                  {isActive && (
                    <div
                      className="absolute inset-0 rounded-full animate-ping opacity-30"
                      style={{ backgroundColor: nodeColor, margin: '-6px' }}
                    />
                  )}

                  <button
                    onMouseEnter={() => setTooltip(i)}
                    onMouseLeave={() => setTooltip(null)}
                    className="relative flex flex-col items-center gap-2 group focus:outline-none"
                    disabled={unit.status === 'locked'}
                  >
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-active:scale-95"
                      style={{
                        backgroundColor: nodeColor,
                        boxShadow: `0 6px 0 ${nodeShadow}`,
                        border: isActive ? `4px solid #fff` : 'none',
                        outline: isActive ? `3px solid ${nodeColor}` : 'none',
                      }}
                    >
                      {isDone ? (
                        <CheckCircleIcon sx={{ fontSize: 40, color: '#fff' }} />
                      ) : unit.status === 'locked' ? (
                        <LockIcon sx={{ fontSize: 32, color: '#afafaf' }} />
                      ) : (
                        unit.icon
                      )}
                    </div>

                    {isDone && (
                      <div className="flex gap-0.5">
                        {[0, 1, 2].map(s => (
                          <StarIcon key={s} sx={{ fontSize: 14, color: '#FFD700' }} />
                        ))}
                      </div>
                    )}

                    {isActive && (
                      <span
                        className="text-white text-xs font-black px-4 py-1.5 rounded-full shadow-md animate-bounce"
                        style={{ backgroundColor: nodeColor }}
                      >
                        MULAI
                      </span>
                    )}

                    {unit.status === 'locked' && !unit.isFinal && (
                      <span className="text-gray-400 text-[10px] font-semibold">Terkunci</span>
                    )}

                    {unit.isFinal && (
                      <span className="text-amber-500 text-[10px] font-black uppercase tracking-wide">Ujian Akhir</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-20 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge color="red" className="mb-4">Fitur Unggulan</Badge>
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3">
              Belajar Lebih <span className={theme.heroAccent}>Efektif &amp; Menyenangkan</span>
            </h2>
            <p className="text-gray-500">Setiap materi dirancang untuk memaksimalkan hasil belajar Anda</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className={`rounded-3xl p-8 border hover:-translate-y-2 hover:shadow-xl transition-all duration-300 ${theme.featureBgs[i]}`}
              >
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-5 shadow-sm">
                  {f.icon}
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 lg:px-20 py-16 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { val: 'JLPT N3', label: 'Level Kurikulum' },
            { val: '6 Unit', label: 'Materi Tersedia' },
            { val: '4 Skill', label: 'Flashcard, Kuis, Kanji, Kosakata' },
            { val: '100%', label: 'Berbasis Gamifikasi', icon: <StarIcon sx={{ fontSize: 18, color: '#FFD700' }} /> },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-3xl font-black text-red-500 mb-1 flex items-center justify-center gap-1">
                {s.val}{s.icon}
              </p>
              <p className="text-white/60 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 lg:px-40 py-20 bg-red-600 text-white text-center rounded-t-[3rem] lg:rounded-t-[5rem]">
        <h2 className="text-3xl lg:text-5xl font-black mb-6">Siap Memulai Perjalananmu?</h2>
        <p className="text-white/80 text-lg lg:text-xl mb-10 max-w-2xl mx-auto">
          Bergabunglah dengan ribuan siswa lainnya dan kuasai Bahasa Jepang dengan cara yang lebih modern.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button href="/register" className="px-10 py-4 !bg-white !text-red-600 rounded-xl text-xl font-bold hover:scale-105 transition-all shadow-xl">
            Daftar Sekarang
          </Button>
          <a
            href="https://wa.me/6283892614774"
            target="_blank"
            rel="noopener noreferrer"
            className="px-10 py-4 bg-red-600 border-2 border-white text-white rounded-xl text-xl font-bold hover:bg-white/10 transition-all no-underline inline-block"
          >
            Hubungi via WhatsApp
          </a>
        </div>
      </section>


      <Footer />
    </>
  );
}