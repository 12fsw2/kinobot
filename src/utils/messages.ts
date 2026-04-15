export const MESSAGES = {
  // Start
  welcome: (firstName: string) =>
    `🎬 *Xush kelibsiz, ${firstName}!*\n\n` +
    `🤖 Bu bot orqali siz barcha filmlarni tomosha qilishingiz mumkin.\n\n` +
    `📖 *Qanday foydalanish kerak:*\n` +
    `• Film kodini yuboring (masalan: \`FILM001\`)\n` +
    `• Bot sizga film haqida barcha ma'lumotlarni beradi\n` +
    `• Film faylini yoki havolasini olasiz\n\n` +
    `🎯 *Buyruqlar:*\n` +
    `/start - Boshlash\n` +
    `/genres - Barcha janrlar\n` +
    `/help - Yordam\n\n` +
    `🎥 Film kodini yuboring va tomosha qiling!`,

  help:
    `📚 *Yordam*\n\n` +
    `🎬 *Film qidirish:*\n` +
    `Film kodini yuboring (masalan: \`FILM001\`)\n\n` +
    `📋 *Buyruqlar:*\n` +
    `/start - Bosh sahifa\n` +
    `/genres - Janrlar bo'yicha filtrlash\n` +
    `/help - Ushbu yordam\n\n` +
    `❓ Muammo bo'lsa admin bilan bog'laning.`,

  // Movie
  movieNotFound: (code: string) =>
    `❌ *"${code}"* kodi bilan film topilmadi.\n\n` +
    `📝 Kodni to'g'ri kiritganingizni tekshiring va qayta urinib ko'ring.`,

  movieInfo: (movie: {
    title: string;
    description: string;
    genre: string;
    rating?: number;
    code: string;
    views_count: number;
  }) =>
    `🎬 *${movie.title}*\n\n` +
    `📝 *Tavsif:* ${movie.description}\n\n` +
    `🎭 *Janr:* ${movie.genre}\n` +
    (movie.rating ? `⭐ *Reyting:* ${movie.rating}/10\n` : '') +
    `👁 *Ko'rishlar:* ${movie.views_count}\n` +
    `🔑 *Kod:* \`${movie.code}\``,

  movieFile: '🎥 *Mana sizning filmingiz:*',
  movieLink: (url: string) => `🔗 *Film havolasi:* [Bu yerga bosing](${url})`,

  // Genres
  genresList: (genres: string[]) =>
    `🎭 *Mavjud janrlar:*\n\n` + genres.map((g) => `• ${g}`).join('\n') +
    `\n\n📝 Janr nomini yuboring yoki /genres [janr] deb yozing`,

  genreMovies: (genre: string, count: number) =>
    `🎭 *"${genre}" janridagi filmlar:* (${count} ta)`,

  noMoviesInGenre: (genre: string) =>
    `😔 *"${genre}"* janrida hozircha filmlar yo'q.`,

  // Admin
  adminWelcome:
    `👨‍💼 *Admin Panel*\n\n` +
    `🛠 *Mavjud buyruqlar:*\n` +
    `/addmovie - Film qo'shish\n` +
    `/deletemovie - Film o'chirish\n` +
    `/updatemovie - Film tahrirlash\n` +
    `/listmovies - Filmlar ro'yxati\n` +
    `/stats - Statistika\n` +
    `/genres - Janrlar`,

  notAdmin: '🚫 Bu buyruq faqat adminlar uchun.',

  // Add movie flow
  addMovie: {
    start: '🎬 *Film qo\'shish*\n\nFilm kodini kiriting (masalan: FILM001):',
    code: '✅ Kod qabul qilindi.\n\n📝 Film nomini kiriting:',
    title: '✅ Nom qabul qilindi.\n\n📄 Film tavsifini kiriting:',
    description: '✅ Tavsif qabul qilindi.\n\n🎭 Janrni kiriting (masalan: Drama, Comedy, Action):',
    genre: '✅ Janr qabul qilindi.\n\n⭐ Reytingni kiriting (1-10) yoki o\'tkazib yuborish uchun /skip yozing:',
    rating: '✅ Reyting qabul qilindi.\n\n🖼 Poster URL manzilini kiriting yoki /skip yozing:',
    poster: '✅ Poster qabul qilindi.\n\n🎥 Film faylini yuboring yoki URL manzilini kiriting:',
    codeExists: (code: string) => `❌ *"${code}"* kodi allaqachon mavjud. Boshqa kod kiriting:`,
    success: (title: string) => `✅ *"${title}"* filmi muvaffaqiyatli qo'shildi!`,
    cancel: '❌ Film qo\'shish bekor qilindi.',
  },

  // Delete movie
  deleteMovie: {
    prompt: '🗑 *Film o\'chirish*\n\nO\'chirmoqchi bo\'lgan film kodini kiriting:',
    confirm: (title: string, code: string) =>
      `⚠️ *"${title}"* (kod: \`${code}\`) filmini o'chirishni tasdiqlaysizmi?`,
    success: (title: string) => `✅ *"${title}"* filmi o'chirildi.`,
    notFound: (code: string) => `❌ *"${code}"* kodi bilan film topilmadi.`,
    cancel: '❌ O\'chirish bekor qilindi.',
  },

  // Update movie
  updateMovie: {
    promptCode: '✏️ *Film tahrirlash*\n\nTahrirlamoqchi bo\'lgan film kodini kiriting:',
    selectField: (title: string) =>
      `✏️ *"${title}"* filmini tahrirlash\n\nQaysi maydonni o\'zgartirmoqchisiz?`,
    promptValue: (field: string) => `✏️ *${field}* uchun yangi qiymatni kiriting:`,
    success: (title: string) => `✅ *"${title}"* filmi muvaffaqiyatli yangilandi!`,
    notFound: (code: string) => `❌ *"${code}"* kodi bilan film topilmadi.`,
  },

  // Stats
  stats: (data: {
    totalUsers: number;
    totalMovies: number;
    topMovies: Array<{ title: string; code: string; views_count: number }>;
    topGenres: Array<{ genre: string; count: number }>;
  }) => {
    const topMoviesStr = data.topMovies.length
      ? data.topMovies
          .map((m, i) => `${i + 1}. *${m.title}* (\`${m.code}\`) - ${m.views_count} ko'rish`)
          .join('\n')
      : 'Ma\'lumot yo\'q';

    const topGenresStr = data.topGenres.length
      ? data.topGenres.map((g, i) => `${i + 1}. ${g.genre} - ${g.count} ta`).join('\n')
      : 'Ma\'lumot yo\'q';

    return (
      `📊 *Bot Statistikasi*\n\n` +
      `👥 *Jami foydalanuvchilar:* ${data.totalUsers}\n` +
      `🎬 *Jami filmlar:* ${data.totalMovies}\n\n` +
      `🏆 *Eng ko'p ko'rilgan filmlar:*\n${topMoviesStr}\n\n` +
      `🎭 *Eng mashhur janrlar:*\n${topGenresStr}`
    );
  },

  // List movies
  listMovies: {
    header: (total: number, page: number, totalPages: number) =>
      `📋 *Filmlar ro'yxati* (${total} ta) | Sahifa ${page}/${totalPages}`,
    item: (movie: { code: string; title: string; genre: string; views_count: number }) =>
      `🎬 *${movie.title}*\n🔑 \`${movie.code}\` | 🎭 ${movie.genre} | 👁 ${movie.views_count}`,
    empty: '📭 Hozircha filmlar yo\'q.',
  },

  // General
  error: '❌ Xatolik yuz berdi. Iltimos qayta urinib ko\'ring.',
  cancelled: '❌ Bekor qilindi.',
  invalidRating: '❌ Reyting 1 dan 10 gacha bo\'lishi kerak. Qayta kiriting:',
  invalidCode: '❌ Kod faqat harf va raqamlardan iborat bo\'lishi kerak. Qayta kiriting:',
  skipped: '⏭ O\'tkazib yuborildi.',
};

export const BUTTONS = {
  confirm: '✅ Tasdiqlash',
  cancel: '❌ Bekor qilish',
  next: '▶️ Keyingi',
  prev: '◀️ Oldingi',
  delete: '🗑 O\'chirish',
  edit: '✏️ Tahrirlash',
  back: '🔙 Ortga',
  updateFields: {
    title: '📝 Nomi',
    description: '📄 Tavsif',
    genre: '🎭 Janr',
    rating: '⭐ Reyting',
    poster_url: '🖼 Poster',
    movie_url: '🔗 URL',
  },
};
