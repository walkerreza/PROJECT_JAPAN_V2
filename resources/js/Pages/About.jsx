import React from 'react';
import { Head } from '@inertiajs/react';
import Button from '@/Components/UI/Button';
import Badge from '@/Components/UI/Badge';
import Card from '@/Components/UI/Card';
import Avatar from '@/Components/UI/Avatar';
import GuestNavbar from '@/Components/Layout/GuestNavbar';
import Footer from '@/Components/Layout/GuestFooter';
import studentImg from '@/../Images/japannese_student.jpg';
import guru1 from '@/../Images/bahasa-jepang-guru-1.jpg';
import guru2 from '@/../Images/bahasa-jepangnya-guru.jpg';

import BoltIcon from '@mui/icons-material/Bolt';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PsychologyIcon from '@mui/icons-material/Psychology';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';

const stats = [
  { value: '12k+', label: 'Pembelajar Aktif' },
  { value: '94%', label: 'Tingkat Kelulusan JLPT' },
  { value: 'N5-N3', label: 'Tingkat Materi' },
];

const gamified = [
  { icon: <BoltIcon className="text-red-600" />, title: 'Streak Harian', desc: 'Pertahankan streak harian untuk meningkatkan pengali retensi belajar Anda.' },
  { icon: <StarIcon className="text-red-600" />, title: 'Dapatkan XP', desc: 'Dapatkan XP untuk membuka bab cerita baru dan catatan budaya.' },
  { icon: <EmojiEventsIcon className="text-red-600" />, title: 'Papan Peringkat', desc: 'Bersaing secara sehat dalam liga bersama sesama calon lulusan N3.' },
];

const curriculum = [
  { icon: <MenuBookIcon className="text-gray-900" />, title: '1.800 Kosakata', desc: 'Cakupan lengkap untuk seluruh 1.800 kosakata JLPT N3.' },
  { icon: <PsychologyIcon className="text-gray-900" />, title: 'Kanji Berbasis SRS', desc: 'Sistem Repetisi Spasi (SRS) untuk mempermudah penguasaan Kanji.' },
  { icon: <HeadphonesIcon className="text-gray-900" />, title: 'Audio Penutur Asli', desc: 'Latihan mendengarkan dengan audio penutur asli untuk pemahaman alami.' },
];

const teamMembers = [
  { name: 'Sarah Tanaka', role: 'Pendiri & Ahli Linguistik Utama', image: guru1 },
  { name: 'Kenji Sato', role: 'Kepala Gamifikasi', image: guru2 },
  { name: 'Elena Rodriguez', role: 'Developer Senior', image: guru1 },
  { name: 'David Kim', role: 'Manajer Komunitas', image: guru2 },
];

export default function About() {
  return (
    <>
      <Head title="Tentang Kami - Japanlingo" />
      <GuestNavbar />

      {/* Hero */}
      <section className="px-6 lg:px-20 py-16 lg:pt-24 lg:pb-32 bg-gradient-to-br from-white via-white to-red-50 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Badge color="red" className="mb-4">MISI KAMI</Badge>
          <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-5 tracking-tight">
            Kuasai <span className="text-red-600 relative">N3<span className="absolute bottom-1 left-0 w-full h-1 bg-red-100 -z-10"></span></span> tanpa rasa bosan.
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            Kami menjembatani kaku nya buku teks dengan kefasihan dunia nyata. Japanlingo menggabungkan mekanik RPG dengan kurikulum resmi JLPT agar Anda tetap termotivasi.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mb-16">
            <Button size="lg" href="/register">Mulai Belajar</Button>
            <Button size="lg" variant="outline" href="#method">Cara kerja</Button>
          </div>
        </div>

        {/* Stats Image Container - Now Wider and Larger */}
        <div className="relative max-w-6xl mx-auto px-4 mt-6 rounded-[2.5rem] overflow-hidden shadow-2xl group z-10">
          <div className="aspect-[16/7] md:aspect-[21/8] w-full relative">
            <img
              src={studentImg}
              className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-all duration-1000 scale-100 group-hover:scale-105"
              alt="Pelajar Bahasa Jepang"
            />
            {/* Fade Overlays */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white via-white/40 to-transparent opacity-90" />
            <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-white/30 via-transparent to-transparent" />
          </div>

          {/* Stats Floating Card */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] md:bottom-10 md:w-[85%] max-w-4xl">
            <div className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-[1.5rem] p-4 sm:p-6 md:p-10 flex items-center justify-around">
              {stats.map((s, i) => (
                <React.Fragment key={i}>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-black text-red-600 tracking-tight">{s.value}</div>
                    <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 font-extrabold uppercase tracking-[0.08em] sm:tracking-[0.2em] mt-1.5 sm:mt-2">{s.label}</div>
                  </div>
                  {i < stats.length - 1 && <div className="h-9 sm:h-12 w-px bg-gray-100" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="px-6 lg:px-20 py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            {/* Left Column: Stylized Quote */}
            <div className="relative">
              {/* Decorative Quote Mark */}
              <div className="absolute -top-10 -left-6 text-[120px] font-serif text-red-500/10 leading-none select-none">“</div>
              <div className="relative z-10">
                <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-[1.3] mb-8 font-serif italic">
                  Belajar bahasa seharusnya tidak terasa seperti beban. Kami percaya pada kekuatan <span className="relative inline-block px-2">
                    <span className="relative z-10 text-red-600">desain pembentuk kebiasaan</span>
                    <span className="absolute inset-0 bg-red-50 rounded-lg -rotate-1"></span>
                  </span> untuk membuat konsistensi menjadi mudah.
                </h2>

                <div className="flex items-center gap-4">
                  <div className="h-px w-12 bg-gray-200"></div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Visi Kami</span>
                </div>
              </div>
              {/* Decorative Quote Mark Bottom */}
              <div className="absolute -bottom-16 right-0 text-[120px] font-serif text-red-500/10 leading-none select-none rotate-180">“</div>
            </div>

            {/* Right Column: Content */}
            <div className="space-y-6 text-gray-500 leading-relaxed text-lg">
              <p>
                Buku teks tradisional sangat bagus untuk referensi, tetapi buruk untuk retensi. Anda menghafal pola tata bahasa pada hari Selasa dan melupakannya pada hari Jumat.
              </p>
              <p>
                Di Japanlingo, kami melihat bagaimana video game membuat pemain tetap terlibat selama ratusan jam dan menerapkan prinsip yang sama pada kurikulum JLPT N3. Dengan mengubah latihan tata bahasa menjadi quest dan kosakata menjadi konten yang bisa dibuka, kami menciptakan loop umpan balik yang membangun kefasihan nyata.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Scientific Method */}
      <section id="method" className="px-6 lg:px-20 py-16 lg:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Bagaimana kami membuat pembelajaran melekat.</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Metode kognitif terbukti yang dipadukan dengan game loop yang imersif.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Gamified Card */}
            <Card className="!p-0 overflow-hidden border-0 shadow-xl">
              <div className="bg-red-600 px-6 py-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <VideogameAssetIcon sx={{ fontSize: 20 }} /> Progres Tergamifikasi
                </h3>
              </div>
              <div className="p-6 space-y-5">
                {gamified.map((g, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 text-xl group-hover:scale-110 transition-transform">{g.icon}</div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-0.5">{g.title}</h4>
                      <p className="text-sm text-gray-500">{g.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Structured Card */}
            <Card className="!p-0 overflow-hidden border-0 shadow-xl">
              <div className="bg-gray-900 px-6 py-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MenuBookIcon sx={{ fontSize: 20 }} /> Kurikulum Terstruktur
                </h3>
              </div>
              <div className="p-6 space-y-5">
                {curriculum.map((c, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 text-xl group-hover:scale-110 transition-transform">{c.icon}</div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-0.5">{c.title}</h4>
                      <p className="text-sm text-gray-500">{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section - Updated to meet Screenshot style */}
      <section className="px-6 lg:px-20 py-20 lg:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-2">Temui Para Sensei & Pembuat</h2>
            <p className="text-gray-500">Tim yang berdedikasi untuk kefasihan Anda.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-10">
            {teamMembers.map((member, i) => (
              <div key={i} className="text-center group">
                <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-lg mb-6 relative">
                  <img
                    src={member.image}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    alt={member.name}
                  />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">{member.name}</h4>
                <p className="text-sm text-red-600 font-bold tracking-tight">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 lg:px-20 py-16 lg:py-20 bg-gray-50">
        <div className="bg-gray-900 rounded-3xl px-6 lg:px-16 py-14 text-center text-white max-w-4xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-extrabold mb-3">Siap untuk menaklukkan JLPT?</h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-8">
            Bergabunglah dengan 10.000+ pembelajar yang telah beralih dari buku teks membosankan ke metode Japanlingo.
          </p>
          <Button href="/register" className="!bg-red-600 !text-white hover:!bg-red-700" size="lg">
            Mulai Belajar Gratis →
          </Button>
        </div>
      </section>

      <Footer />
    </>
  );
}
