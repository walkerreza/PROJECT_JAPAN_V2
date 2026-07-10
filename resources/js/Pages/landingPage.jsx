import React from 'react';
import { Head } from '@inertiajs/react';
import Button from '@/Components/UI/Button';
import Badge from '@/Components/UI/Badge';
import Card from '@/Components/UI/Card';
import Avatar from '@/Components/UI/Avatar';
import GuestNavbar from '@/Components/Layout/GuestNavbar';
import Footer from '@/Components/Layout/GuestFooter';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BoltIcon from '@mui/icons-material/Bolt';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import HeadsetIcon from '@mui/icons-material/Headset';
import StarIcon from '@mui/icons-material/Star';
import CheckIcon from '@mui/icons-material/Check';
import rawTheme from '@/Components/theme/themes';
import FallEffect from '@/Components/theme/FallEffect';
import heroStaticImage from '@/../Images/Mount-Fuji-New.jpg';

// Map theme keys ke format yang dipakai landingPage
const theme = {
  heroBg: rawTheme.landingHeroBg,
  heroGradText: rawTheme.landingGradText,
  heroBadgeBg: rawTheme.landingBadgeBg,
  heroBadgeDot: rawTheme.landingBadgeDot,
  heroBadgeText: rawTheme.landingBadgeText,
  heroGlow: rawTheme.landingGlow,
  featureCardGlow: rawTheme.landingCardGlow,
  highlightBorder: rawTheme.landingHighlightBorder,
  highlightBadgeBg: rawTheme.landingHighlightBadge,
  highlightBtnBg: rawTheme.landingHighlightBtn,
  highlightLevel: rawTheme.landingHighlightLevel,
  leagueBg: rawTheme.landingLeagueBg,
  ctaBg: rawTheme.landingCtaBg,
  ctaProBg: rawTheme.landingProBg,
};


const steps = [
  { icon: <AssignmentIcon />, title: 'Tes Penempatan', desc: 'Ikuti tes cepat 5 menit untuk mengetahui level Anda, atau mulai dari awal di level N5.' },
  { icon: <BoltIcon />, title: 'Misi Harian', desc: 'Selesaikan materi singkat, kuis, dan latihan berbicara untuk mendapatkan XP serta menjaga streak Anda.' },
  { icon: <EmojiEventsIcon />, title: 'Raih Sertifikat', desc: 'Lulus evaluasi tingkat untuk membuka sertifikat resmi Japanlingo dan lanjut ke jenjang JLPT berikutnya.' },
];

const testimonials = [
  { quote: 'Saya akhirnya lulus N3 setelah bertahun-tahun kesulitan dengan buku teks. Pendekatan gamifikasi ini membuat belajar jadi adiktif!', name: 'Sarah Jenkins', role: 'Lulus N3' },
  { quote: 'Kualitas audionya luar biasa. Mendengar penutur asli sangat membantu pelafalan saya.', name: 'Michael Chen', role: 'Siswa N4' },
  { quote: 'Investasi terbaik untuk belajar bahasa Jepang. Jalur terstruktur membuat saya tidak merasa kewalahan.', name: 'Jessica Lee', role: 'Peserta N2' },
];

const LandingPage = () => {
  return (
    <>
      <FallEffect />
      <Head title="Japanlingo - Belajar Bahasa Jepang Interaktif" />
      <GuestNavbar />

      {/* Hero */}
      <section className={`relative flex flex-col lg:flex-row items-center justify-between px-6 lg:px-24 py-16 lg:py-32 ${theme.heroBg} gap-12 lg:gap-16 overflow-hidden`}>
        <img
          src={heroStaticImage}
          alt="Gunung Fuji Japanlingo"
          className="absolute inset-0 h-full w-full object-cover opacity-65"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/88 via-white/62 to-white/25" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/45 via-transparent to-white/78" />
        <div className="absolute inset-x-0 top-0 h-full w-full opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
        </div>

        <div className="max-w-xl lg:max-w-xl relative z-10">
          <div className={`inline-flex items-center gap-2 px-3 py-1 ${theme.heroBadgeBg} rounded-full mb-6 border`}>
            <span className={`w-2 h-2 rounded-full ${theme.heroBadgeDot} animate-pulse`}></span>
            <span className={`text-xs font-bold ${theme.heroBadgeText} uppercase tracking-wider`}>Platform #1 Belajar JLPT N3</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] mb-6 text-[#1A1A1A] tracking-tight">
            Belajar Bahasa <br />
            <span className={`bg-gradient-to-r ${theme.heroGradText} bg-clip-text text-transparent`}>
              Jepang Terstruktur &amp; Gamified
            </span>
          </h1>

          <p className="text-lg lg:text-xl text-gray-500 mb-10 leading-relaxed max-w-lg">
            Kuasai bahasa Jepang dari N5 hingga N1 dengan kurikulum terstruktur yang dirancang untuk orang sibuk. Menyenangkan, efektif, dan gratis untuk dicoba.
          </p>

          <div className="flex flex-wrap gap-4 mb-10">
            <Button size="lg" href="/register" className="!rounded-full !px-8 !py-4 shadow-lg">
              Mulai Belajar Gratis ➔
            </Button>
            <Button size="lg" variant="outline" className="!rounded-full !px-8 !py-4 !bg-white">
              <PlayCircleIcon className="mr-2" sx={{ fontSize: 24 }} />
              Lihat Demo
            </Button>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                  <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="user" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <span>Bergabunglah dengan <strong className="text-gray-900 font-bold">komunitas pembelajar</strong> Japanlingo</span>
          </div>
        </div>

        {/* Floating Card UI */}
        <div className="w-full max-w-lg relative lg:mr-10">
          <div className={`absolute -inset-4 bg-gradient-to-tr ${theme.heroGlow} blur-3xl rounded-full opacity-50`}></div>

          <div className="relative animate-float">
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-gray-100 overflow-hidden">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h4 className="text-lg font-bold text-gray-900 leading-none flex items-center gap-2">
                    <VideogameAssetIcon className="text-red-600" sx={{ fontSize: 20 }} />
                    Target Harian
                  </h4>
                  <p className="text-sm text-gray-400 mt-1.5 font-medium">Jaga streak Anda tetap aktif!</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-lg">
                  <LocalFireDepartmentIcon className="text-orange-500" />
                </div>
              </div>

              <div className="space-y-6 mb-8">
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
                        <span className="font-bold">あ</span>
                      </div>
                      <span className="font-bold text-gray-800">Latihan Kanji</span>
                    </div>
                    <span className="font-bold text-red-600">80%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-600 rounded-full w-[80%]"></div>
                  </div>
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
                        <HeadsetIcon sx={{ fontSize: 18 }} />
                      </div>
                      <span className="font-bold text-gray-800">Mendengar N3</span>
                    </div>
                    <span className="font-bold text-red-600">45%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full w-[45%]"></div>
                  </div>
                </div>
              </div>

              <Button className="w-full !rounded-2xl !py-5 !bg-[#1A1A1A] !text-white !font-bold text-lg hover:!bg-black transition-colors" href="/register">
                Lanjutkan Belajar
              </Button>
            </div>

            <div className="absolute -left-12 -bottom-6 animate-float-delayed">
              <div className="bg-[#E4E2D5] rounded-3xl p-4 shadow-xl border border-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/50 border border-white flex items-center justify-center overflow-hidden">
                  <div className="w-6 h-6 bg-[#C4C1B1] rounded-sm"></div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-tighter text-gray-500 font-bold">Tingkat Saat Ini</div>
                  <div className="text-sm font-black text-red-700">JLPT N3</div>
                </div>
              </div>
            </div>

            <div className="absolute -right-8 -top-8 animate-float-fast">
              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                  <CheckIcon sx={{ fontSize: 16 }} />
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Akurasi</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="px-6 lg:px-20 py-24 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <Badge color="red" className="mb-4">PETA PERJALANAN</Badge>
          <h2 className="text-4xl font-black text-gray-900 mb-4">Pilih Titik Awal Anda</h2>
          <p className="text-gray-500 max-w-2xl mx-auto mb-16">
            Dari pemula absolut hingga fasih tingkat lanjut. Kurikulum kami diselaraskan dengan standar resmi JLPT.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { level: 'N5', title: 'Pemula', desc: 'Salam dasar, hiragana, katakana, dan struktur kalimat sederhana.', color: 'bg-green-500', label: 'Dasar Sekali' },
              { level: 'N4', title: 'Dasar', desc: 'Percakapan harian, kanji dasar, dan membaca bacaan sederhana.', color: 'bg-red-500', label: 'Fondasi' },
              { level: 'N3', title: 'Menengah', desc: 'Jembatan menuju kefasihan. Tata bahasa kompleks dan percakapan santai.', color: 'bg-red-600', label: 'Paling Populer', highlight: true },
              { level: 'N2', title: 'Pra-Lanjut', desc: 'Bahasa Jepang bisnis, pemahaman berita, dan topik abstrak.', color: 'bg-purple-500', label: 'Tingkat Bisnis' },
              { level: 'N1', title: 'Mahir', desc: 'Kefasihan setara penutur asli. Tulisan kompleks dan diskusi akademis.', color: 'bg-gray-800', label: 'Kemahiran' },
            ].map((item, i) => (
              <div
                key={i}
                className={`relative p-6 rounded-[2rem] text-left transition-all duration-300 flex flex-col h-full ${item.highlight
                  ? theme.highlightBorder
                  : 'bg-gray-50/50 border border-gray-100 hover:border-gray-200'
                  }`}
              >
                {item.highlight && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 ${theme.highlightBadgeBg} text-[10px] font-black text-white rounded-full whitespace-nowrap tracking-wider`}>
                    PALING POPULER
                  </div>
                )}

                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black mb-4 ${item.highlight ? theme.highlightLevel : 'bg-gray-100 text-gray-400'}`}>
                  {item.level}
                </div>

                <h3 className="text-lg font-black text-gray-900 mb-2">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-6 flex-grow">{item.desc}</p>

                <div className="mt-auto">
                  <div className={`h-1.5 w-full rounded-full mb-4 ${item.color} opacity-80`}></div>
                  {item.highlight ? (
                    <Button className={`w-full !rounded-xl !py-2 ${theme.highlightBtnBg} !text-white !text-xs !font-bold`} href="/register">
                      Mulai {item.level}
                    </Button>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Japanlingo Section */}
      <section className="px-6 lg:px-20 py-24 bg-gray-50/50 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <Badge color="red" className="mb-4">MENGAPA JAPANLINGO?</Badge>
              <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 leading-[1.2]">
                Belajar bahasa Jepang tidak harus terasa melelahkan.
              </h2>
              <p className="text-gray-500 mb-10 leading-relaxed italic">
                Kami memadukan metode pembelajaran yang terbukti secara ilmiah dengan mekanika game agar Anda tetap termotivasi setiap hari.
              </p>

              <div className="space-y-8">
                {[
                  { icon: <VideogameAssetIcon />, title: 'Kuis Tergamifikasi', desc: 'Dapatkan XP, buka lencana, dan bersaing di papan peringkat sembari menguasai tata bahasa dan kosakata.', color: 'bg-red-100 text-red-600' },
                  { icon: <AutoAwesomeIcon />, title: 'Audio Penutur Asli', desc: 'Dengarkan lebih dari 10.000 frasa yang direkam oleh pengisi suara profesional Jepang, bukan robot.', color: 'bg-orange-100 text-orange-600' },
                  { icon: <ListAltIcon />, title: 'Kurikulum Terstruktur', desc: 'Tidak ada lagi belajar acak. Ikuti jalur jelas yang dirancang untuk membantu Anda lulus JLPT.', color: 'bg-red-100 text-red-600' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-5 group">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-110 ${item.color}`}>
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full ${theme.featureCardGlow} blur-[120px] rounded-full`}></div>

              <div className="grid grid-cols-2 gap-4">
                <div className="animate-float">
                  <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 translate-y-10">
                    <div className="text-red-500 mb-2">
                      <AutoAwesomeIcon sx={{ fontSize: 24 }} />
                    </div>
                    <div className="text-sm font-bold text-gray-900">Streak: 42 Hari</div>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-0.5">
                      Anda luar biasa! <LocalFireDepartmentIcon sx={{ fontSize: 14 }} className="text-orange-500" />
                    </div>
                  </div>
                </div>

                <div className="animate-float-fast">
                  <div className={`${theme.leagueBg} rounded-3xl p-6 shadow-2xl text-white relative h-full`}>
                    <div className="absolute top-4 right-4 text-[8px] font-bold bg-black/20 px-2 py-0.5 rounded-full">TOP 1%</div>
                    <div className="text-2xl mb-8">
                      <EmojiEventsIcon sx={{ fontSize: 32 }} />
                    </div>
                    <div className="text-lg font-black">Liga Emas</div>
                    <div className="text-xs opacity-80 mt-1">Terus belajar untuk tetap memimpin peringkat.</div>
                  </div>
                </div>

                <div className="col-span-1 animate-float-delayed">
                  <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100">
                    <img src="https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400&h=300&fit=crop" className="w-full h-24 object-cover" alt="Konteks" />
                    <div className="p-4">
                      <div className="text-xs font-bold text-gray-900">Konteks Dunia Nyata</div>
                    </div>
                  </div>
                </div>

                <div className="animate-float">
                  <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 shadow-xl flex flex-col gap-3 -translate-y-10 border border-white">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 overflow-hidden">
                        <img src="https://i.pravatar.cc/100?u=ken" className="w-full h-full object-cover" alt="Ken" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold leading-none">Sensei Ken</div>
                        <div className="text-[8px] text-green-500">Sedang Online</div>
                      </div>
                    </div>
                    <div className="bg-gray-100 rounded-2xl p-3 text-[9px] text-gray-600 leading-relaxed">
                      Jangan lupa, partikel 'wa' menandai topik pembicaraan!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 lg:px-20 py-16 lg:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900">Apa Kata Mereka?</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <Card key={i} hover>
              <div className="text-amber-400 flex gap-0.5 mb-4">
                {[...Array(5)].map((_, idx) => (
                  <StarIcon key={idx} sx={{ fontSize: 16 }} />
                ))}
              </div>
              <blockquote className="text-sm text-gray-700 leading-relaxed mb-5 italic">"{t.quote}"</blockquote>
              <div className="flex items-center gap-3">
                <Avatar name={t.name} size="md" />
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-gray-400">{t.role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA + Pricing */}
      <section className="px-6 lg:px-20 py-16 lg:py-20">
        <div className={`${theme.ctaBg} rounded-3xl px-6 lg:px-16 py-14 text-center text-white`}>
          <h2 className="text-3xl lg:text-4xl font-extrabold mb-3">Siap memulai perjalanan Anda?</h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-10">Bergabunglah secara gratis hari ini. Dapatkan akses ke materi, kuis, dan review kosakata terstruktur.</p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-gray-800/50 border border-white/10 rounded-2xl p-8 text-left">
              <h3 className="text-lg font-bold text-white mb-2">Dasar Gratis</h3>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-4xl font-black text-white">Gratis</span>
              </div>
              <ul className="space-y-3 mb-6 list-none p-0">
                <li className="flex items-center gap-2 text-sm text-white/80"><CheckIcon sx={{ fontSize: 16 }} className="text-green-400" /> Preview materi Week 1</li>
                <li className="flex items-center gap-2 text-sm text-white/80"><CheckIcon sx={{ fontSize: 16 }} className="text-green-400" /> Kuis Dasar Week 1</li>
                <li className="flex items-center gap-2 text-sm text-white/80"><CheckIcon sx={{ fontSize: 16 }} className="text-green-400" /> Progress Belajar</li>
              </ul>
              <Button variant="outline" href="/register" className="w-full !border-white/20 !text-white hover:!bg-black/20 hover:!text-white">
                Mulai Preview Gratis
              </Button>
            </div>
            <div className={`${theme.ctaProBg} rounded-2xl p-8 text-left relative`}>
              <Badge color="yellow" className="absolute -top-3 right-5">PREMIUM</Badge>
              <h3 className="text-lg font-bold text-white mb-2">Akses Premium</h3>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-4xl font-black text-white">Berlangganan</span>
              </div>
              <ul className="space-y-3 mb-6 list-none p-0">
                <li className="flex items-center gap-2 text-sm text-white/90"><CheckIcon sx={{ fontSize: 16 }} className="text-white" /> Akses materi premium</li>
                <li className="flex items-center gap-2 text-sm text-white/90"><CheckIcon sx={{ fontSize: 16 }} className="text-white" /> Kuis premium &amp; XP</li>
                <li className="flex items-center gap-2 text-sm text-white/90"><CheckIcon sx={{ fontSize: 16 }} className="text-white" /> Flashcard &amp; Kosakata</li>
                <li className="flex items-center gap-2 text-sm text-white/90"><CheckIcon sx={{ fontSize: 16 }} className="text-white" /> Leaderboard &amp; Gamifikasi</li>
              </ul>
              <Button href="/pricing" className="w-full !bg-white !text-gray-900 hover:!bg-gray-100">
                Lihat Paket Harga
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default LandingPage;
