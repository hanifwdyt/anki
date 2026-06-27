/* JLPT N5 Kosakata — kata umum. Tiap entri: w(ord), r(eading kana), m(eaning ID). */
const N5_VOCAB = [
  // Orang & sekolah
  { w: '学生', r: 'がくせい', m: 'pelajar' },
  { w: '先生', r: 'せんせい', m: 'guru' },
  { w: '学校', r: 'がっこう', m: 'sekolah' },
  { w: '大学', r: 'だいがく', m: 'universitas' },
  { w: '会社', r: 'かいしゃ', m: 'perusahaan' },
  { w: '友達', r: 'ともだち', m: 'teman' },
  { w: '家族', r: 'かぞく', m: 'keluarga' },
  { w: '父', r: 'ちち', m: 'ayah (saya)' },
  { w: '母', r: 'はは', m: 'ibu (saya)' },
  { w: '兄', r: 'あに', m: 'kakak laki-laki' },
  { w: '姉', r: 'あね', m: 'kakak perempuan' },
  { w: '名前', r: 'なまえ', m: 'nama' },

  // Waktu
  { w: '時間', r: 'じかん', m: 'waktu' },
  { w: '今日', r: 'きょう', m: 'hari ini' },
  { w: '明日', r: 'あした', m: 'besok' },
  { w: '昨日', r: 'きのう', m: 'kemarin' },
  { w: '毎日', r: 'まいにち', m: 'setiap hari' },
  { w: '今', r: 'いま', m: 'sekarang' },
  { w: '朝', r: 'あさ', m: 'pagi' },
  { w: '昼', r: 'ひる', m: 'siang' },
  { w: '夜', r: 'よる', m: 'malam' },
  { w: '午前', r: 'ごぜん', m: 'pagi (a.m.)' },
  { w: '午後', r: 'ごご', m: 'siang (p.m.)' },

  // Bahasa & negara
  { w: '日本', r: 'にほん', m: 'Jepang' },
  { w: '日本語', r: 'にほんご', m: 'bahasa Jepang' },
  { w: '英語', r: 'えいご', m: 'bahasa Inggris' },
  { w: '国', r: 'くに', m: 'negara' },

  // Makanan & minuman
  { w: '水', r: 'みず', m: 'air' },
  { w: 'お茶', r: 'おちゃ', m: 'teh' },
  { w: 'ご飯', r: 'ごはん', m: 'nasi, makanan' },
  { w: '肉', r: 'にく', m: 'daging' },
  { w: '魚', r: 'さかな', m: 'ikan' },
  { w: '野菜', r: 'やさい', m: 'sayur' },
  { w: '果物', r: 'くだもの', m: 'buah' },
  { w: 'お金', r: 'おかね', m: 'uang' },

  // Benda & tempat
  { w: '本', r: 'ほん', m: 'buku' },
  { w: '新聞', r: 'しんぶん', m: 'koran' },
  { w: '電話', r: 'でんわ', m: 'telepon' },
  { w: '電車', r: 'でんしゃ', m: 'kereta listrik' },
  { w: '車', r: 'くるま', m: 'mobil' },
  { w: '家', r: 'いえ', m: 'rumah' },
  { w: '部屋', r: 'へや', m: 'kamar' },
  { w: '店', r: 'みせ', m: 'toko' },
  { w: '駅', r: 'えき', m: 'stasiun' },
  { w: '町', r: 'まち', m: 'kota' },

  // Alam
  { w: '山', r: 'やま', m: 'gunung' },
  { w: '川', r: 'かわ', m: 'sungai' },
  { w: '海', r: 'うみ', m: 'laut' },
  { w: '空', r: 'そら', m: 'langit' },
  { w: '天気', r: 'てんき', m: 'cuaca' },
  { w: '雨', r: 'あめ', m: 'hujan' },
  { w: '雪', r: 'ゆき', m: 'salju' },
  { w: '花', r: 'はな', m: 'bunga' },
  { w: '木', r: 'き', m: 'pohon' },
  { w: '犬', r: 'いぬ', m: 'anjing' },
  { w: '猫', r: 'ねこ', m: 'kucing' },

  // Tubuh
  { w: '手', r: 'て', m: 'tangan' },
  { w: '目', r: 'め', m: 'mata' },
  { w: '口', r: 'くち', m: 'mulut' },
  { w: '耳', r: 'みみ', m: 'telinga' },
  { w: '足', r: 'あし', m: 'kaki' },
  { w: '頭', r: 'あたま', m: 'kepala' },

  // Kata kerja
  { w: '食べる', r: 'たべる', m: 'makan' },
  { w: '飲む', r: 'のむ', m: 'minum' },
  { w: '行く', r: 'いく', m: 'pergi' },
  { w: '来る', r: 'くる', m: 'datang' },
  { w: '見る', r: 'みる', m: 'melihat' },
  { w: '聞く', r: 'きく', m: 'mendengar' },
  { w: '読む', r: 'よむ', m: 'membaca' },
  { w: '書く', r: 'かく', m: 'menulis' },
  { w: '話す', r: 'はなす', m: 'berbicara' },
  { w: '買う', r: 'かう', m: 'membeli' },
  { w: '寝る', r: 'ねる', m: 'tidur' },
  { w: '起きる', r: 'おきる', m: 'bangun' },

  // Kata sifat
  { w: '大きい', r: 'おおきい', m: 'besar' },
  { w: '小さい', r: 'ちいさい', m: 'kecil' },
  { w: '新しい', r: 'あたらしい', m: 'baru' },
  { w: '古い', r: 'ふるい', m: 'lama, tua' },
  { w: '高い', r: 'たかい', m: 'tinggi, mahal' },
  { w: '安い', r: 'やすい', m: 'murah' },
  { w: '暑い', r: 'あつい', m: 'panas (cuaca)' },
  { w: '寒い', r: 'さむい', m: 'dingin (cuaca)' },
  { w: '面白い', r: 'おもしろい', m: 'menarik, lucu' },
  { w: '楽しい', r: 'たのしい', m: 'menyenangkan' },
];

if (typeof window !== 'undefined') window.N5_VOCAB = N5_VOCAB;
