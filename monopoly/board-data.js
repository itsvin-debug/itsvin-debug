/**
 * Digital Monopoly Board Game - Board Data & Card Definitions
 * Official 40-Tile Classic Standard Monopoly Configuration
 */

const BOARD_DATA = [
  // BOTTOM ROW: 0 to 10 (Right to Left: GO -> Jail)
  {
    id: 0,
    name: "GO (Mulai)",
    shortName: "GO",
    type: "special",
    group: "special",
    subtext: "Ambil $200 setiap lewat",
    corner: true,
    action: "go"
  },
  {
    id: 1,
    name: "Mediterranean Ave",
    shortName: "Medit. Ave",
    type: "property",
    group: "brown",
    price: 60,
    rent: [2, 10, 30, 90, 160, 250],
    houseCost: 50,
    mortgage: 30
  },
  {
    id: 2,
    name: "Community Chest",
    shortName: "Comm. Chest",
    type: "chest",
    group: "special",
    subtext: "Ambil Kartu Dana Umum"
  },
  {
    id: 3,
    name: "Baltic Avenue",
    shortName: "Baltic Ave",
    type: "property",
    group: "brown",
    price: 60,
    rent: [4, 20, 60, 180, 320, 450],
    houseCost: 50,
    mortgage: 30
  },
  {
    id: 4,
    name: "Income Tax",
    shortName: "Pajak Pendapatan",
    type: "tax",
    group: "special",
    price: 200,
    subtext: "Bayar $200"
  },
  {
    id: 5,
    name: "Reading Railroad",
    shortName: "Reading RR",
    type: "railroad",
    group: "railroad",
    price: 200,
    rent: [25, 50, 100, 200],
    mortgage: 100
  },
  {
    id: 6,
    name: "Oriental Avenue",
    shortName: "Oriental Ave",
    type: "property",
    group: "light-blue",
    price: 100,
    rent: [6, 30, 90, 270, 400, 550],
    houseCost: 50,
    mortgage: 50
  },
  {
    id: 7,
    name: "Chance",
    shortName: "Kesempatan",
    type: "chance",
    group: "special",
    subtext: "Ambil Kartu Kesempatan"
  },
  {
    id: 8,
    name: "Vermont Avenue",
    shortName: "Vermont Ave",
    type: "property",
    group: "light-blue",
    price: 100,
    rent: [6, 30, 90, 270, 400, 550],
    houseCost: 50,
    mortgage: 50
  },
  {
    id: 9,
    name: "Connecticut Avenue",
    shortName: "Conn. Ave",
    type: "property",
    group: "light-blue",
    price: 120,
    rent: [8, 40, 100, 300, 450, 600],
    houseCost: 50,
    mortgage: 60
  },
  {
    id: 10,
    name: "Jail / Just Visiting",
    shortName: "Penjara",
    type: "jail",
    group: "special",
    subtext: "Hanya Singgah / Masuk Penjara",
    corner: true
  },

  // LEFT COLUMN: 11 to 19 (Bottom to Top)
  {
    id: 11,
    name: "St. Charles Place",
    shortName: "St. Charles",
    type: "property",
    group: "pink",
    price: 140,
    rent: [10, 50, 150, 450, 625, 750],
    houseCost: 100,
    mortgage: 70
  },
  {
    id: 12,
    name: "Electric Company",
    shortName: "Perusahaan Listrik",
    type: "utility",
    group: "utility",
    price: 150,
    mortgage: 75,
    subtext: "Dadu x4 atau x10"
  },
  {
    id: 13,
    name: "States Avenue",
    shortName: "States Ave",
    type: "property",
    group: "pink",
    price: 140,
    rent: [10, 50, 150, 450, 625, 750],
    houseCost: 100,
    mortgage: 70
  },
  {
    id: 14,
    name: "Virginia Avenue",
    shortName: "Virginia Ave",
    type: "property",
    group: "pink",
    price: 160,
    rent: [12, 60, 180, 500, 700, 900],
    houseCost: 100,
    mortgage: 80
  },
  {
    id: 15,
    name: "Pennsylvania Railroad",
    shortName: "Penn. RR",
    type: "railroad",
    group: "railroad",
    price: 200,
    rent: [25, 50, 100, 200],
    mortgage: 100
  },
  {
    id: 16,
    name: "St. James Place",
    shortName: "St. James",
    type: "property",
    group: "orange",
    price: 180,
    rent: [14, 70, 200, 550, 750, 950],
    houseCost: 100,
    mortgage: 90
  },
  {
    id: 17,
    name: "Community Chest",
    shortName: "Comm. Chest",
    type: "chest",
    group: "special",
    subtext: "Ambil Kartu Dana Umum"
  },
  {
    id: 18,
    name: "Tennessee Avenue",
    shortName: "Tennessee Ave",
    type: "property",
    group: "orange",
    price: 180,
    rent: [14, 70, 200, 550, 750, 950],
    houseCost: 100,
    mortgage: 90
  },
  {
    id: 19,
    name: "New York Avenue",
    shortName: "New York Ave",
    type: "property",
    group: "orange",
    price: 200,
    rent: [16, 80, 220, 600, 800, 1000],
    houseCost: 100,
    mortgage: 100
  },
  {
    id: 20,
    name: "Free Parking",
    shortName: "Parkir Bebas",
    type: "parking",
    group: "special",
    subtext: "Istirahat Santai",
    corner: true
  },

  // TOP ROW: 21 to 29 (Left to Right)
  {
    id: 21,
    name: "Kentucky Avenue",
    shortName: "Kentucky Ave",
    type: "property",
    group: "red",
    price: 220,
    rent: [18, 90, 250, 700, 875, 1050],
    houseCost: 150,
    mortgage: 110
  },
  {
    id: 22,
    name: "Chance",
    shortName: "Kesempatan",
    type: "chance",
    group: "special",
    subtext: "Ambil Kartu Kesempatan"
  },
  {
    id: 23,
    name: "Indiana Avenue",
    shortName: "Indiana Ave",
    type: "property",
    group: "red",
    price: 220,
    rent: [18, 90, 250, 700, 875, 1050],
    houseCost: 150,
    mortgage: 110
  },
  {
    id: 24,
    name: "Illinois Avenue",
    shortName: "Illinois Ave",
    type: "property",
    group: "red",
    price: 240,
    rent: [20, 100, 300, 750, 925, 1100],
    houseCost: 150,
    mortgage: 120
  },
  {
    id: 25,
    name: "B. & O. Railroad",
    shortName: "B. & O. RR",
    type: "railroad",
    group: "railroad",
    price: 200,
    rent: [25, 50, 100, 200],
    mortgage: 100
  },
  {
    id: 26,
    name: "Atlantic Avenue",
    shortName: "Atlantic Ave",
    type: "property",
    group: "yellow",
    price: 260,
    rent: [22, 110, 330, 800, 975, 1150],
    houseCost: 150,
    mortgage: 130
  },
  {
    id: 27,
    name: "Ventnor Avenue",
    shortName: "Ventnor Ave",
    type: "property",
    group: "yellow",
    price: 260,
    rent: [22, 110, 330, 800, 975, 1150],
    houseCost: 150,
    mortgage: 130
  },
  {
    id: 28,
    name: "Water Works",
    shortName: "Perusahaan Air",
    type: "utility",
    group: "utility",
    price: 150,
    mortgage: 75,
    subtext: "Dadu x4 atau x10"
  },
  {
    id: 29,
    name: "Marvin Gardens",
    shortName: "Marvin Gard.",
    type: "property",
    group: "yellow",
    price: 280,
    rent: [24, 120, 360, 850, 1025, 1200],
    houseCost: 150,
    mortgage: 140
  },
  {
    id: 30,
    name: "Go to Jail",
    shortName: "Masuk Penjara",
    type: "go-to-jail",
    group: "special",
    subtext: "Langsung ke Penjara!",
    corner: true
  },

  // RIGHT COLUMN: 31 to 39 (Top to Bottom)
  {
    id: 31,
    name: "Pacific Avenue",
    shortName: "Pacific Ave",
    type: "property",
    group: "green",
    price: 300,
    rent: [26, 130, 390, 900, 1100, 1275],
    houseCost: 200,
    mortgage: 150
  },
  {
    id: 32,
    name: "North Carolina Avenue",
    shortName: "N. Carolina",
    type: "property",
    group: "green",
    price: 300,
    rent: [26, 130, 390, 900, 1100, 1275],
    houseCost: 200,
    mortgage: 150
  },
  {
    id: 33,
    name: "Community Chest",
    shortName: "Comm. Chest",
    type: "chest",
    group: "special",
    subtext: "Ambil Kartu Dana Umum"
  },
  {
    id: 34,
    name: "Pennsylvania Avenue",
    shortName: "Penn. Ave",
    type: "property",
    group: "green",
    price: 320,
    rent: [28, 150, 450, 1000, 1200, 1400],
    houseCost: 200,
    mortgage: 160
  },
  {
    id: 35,
    name: "Short Line Railroad",
    shortName: "Short Line RR",
    type: "railroad",
    group: "railroad",
    price: 200,
    rent: [25, 50, 100, 200],
    mortgage: 100
  },
  {
    id: 36,
    name: "Chance",
    shortName: "Kesempatan",
    type: "chance",
    group: "special",
    subtext: "Ambil Kartu Kesempatan"
  },
  {
    id: 37,
    name: "Park Place",
    shortName: "Park Place",
    type: "property",
    group: "dark-blue",
    price: 350,
    rent: [35, 175, 500, 1100, 1300, 1500],
    houseCost: 200,
    mortgage: 175
  },
  {
    id: 38,
    name: "Luxury Tax",
    shortName: "Pajak Mewah",
    type: "tax",
    group: "special",
    price: 100,
    subtext: "Bayar $100"
  },
  {
    id: 39,
    name: "Boardwalk",
    shortName: "Boardwalk",
    type: "property",
    group: "dark-blue",
    price: 400,
    rent: [50, 200, 600, 1400, 1700, 2000],
    houseCost: 200,
    mortgage: 200
  }
];

// Color group definitions & member tile indices
const COLOR_GROUPS = {
  "brown": { name: "Cokelat", tiles: [1, 3], colorHex: "#7b3f00", houseCost: 50 },
  "light-blue": { name: "Biru Muda", tiles: [6, 8, 9], colorHex: "#5dc5e8", houseCost: 50 },
  "pink": { name: "Merah Muda", tiles: [11, 13, 14], colorHex: "#d83a81", houseCost: 100 },
  "orange": { name: "Oranye", tiles: [16, 18, 19], colorHex: "#f07f28", houseCost: 100 },
  "red": { name: "Merah", tiles: [21, 23, 24], colorHex: "#e32f2f", houseCost: 150 },
  "yellow": { name: "Kuning", tiles: [26, 27, 29], colorHex: "#efc92a", houseCost: 150 },
  "green": { name: "Hijau", tiles: [31, 32, 34], colorHex: "#288e4e", houseCost: 200 },
  "dark-blue": { name: "Biru Tua", tiles: [37, 39], colorHex: "#1d4ed8", houseCost: 200 },
  "railroad": { name: "Stasiun Kereta", tiles: [5, 15, 25, 35], colorHex: "#374151" },
  "utility": { name: "Fasilitas Umum", tiles: [12, 28], colorHex: "#6b7280" }
};

// Starting Money Breakdown (Sum = $1500 exactly)
const INITIAL_CURRENCY_BREAKDOWN = [
  { bill: 500, count: 2, total: 1000 },
  { bill: 100, count: 2, total: 200 },
  { bill: 50,  count: 2, total: 100 },
  { bill: 20,  count: 6, total: 120 },
  { bill: 10,  count: 5, total: 50 },
  { bill: 5,   count: 5, total: 25 },
  { bill: 1,   count: 5, total: 5 }
];

// Token options with classic physical die-cast names and icons
const TOKEN_OPTIONS = [
  { id: "hat", name: "Top Hat (Topi Tinggi)", icon: "🎩", metal: "pewter" },
  { id: "car", name: "Classic Roadster (Mobil Antik)", icon: "🚗", metal: "brass" },
  { id: "ship", name: "Battleship (Kapal Tempur)", icon: "🚢", metal: "silver" },
  { id: "boot", name: "Vintage Boot (Sepatu Bot)", icon: "👞", metal: "bronze" },
  { id: "dog", name: "Scottie Dog (Anjing Terrier)", icon: "🐕", metal: "pewter" },
  { id: "cat", name: "Lucky Cat (Kucing Klasik)", icon: "🐈", metal: "brass" }
];

// CHANCE CARDS (Kartu Kesempatan)
const CHANCE_CARDS = [
  {
    id: "ch_go",
    title: "Maju ke GO",
    desc: "Maju langsung ke petak GO. Ambil $200 dari Bank.",
    action: "move_to",
    target: 0,
    collectPassGo: true
  },
  {
    id: "ch_illinois",
    title: "Maju ke Illinois Avenue",
    desc: "Maju ke Illinois Avenue. Jika melewati GO, ambil $200.",
    action: "move_to",
    target: 24,
    collectPassGo: true
  },
  {
    id: "ch_stcharles",
    title: "Maju ke St. Charles Place",
    desc: "Maju ke St. Charles Place. Jika melewati GO, ambil $200.",
    action: "move_to",
    target: 11,
    collectPassGo: true
  },
  {
    id: "ch_railroad",
    title: "Maju ke Stasiun Kereta Terdekat",
    desc: "Maju ke stasiun terdekat. Jika sudah berpemilik, bayar pemilik 2x sewa standar!",
    action: "nearest_railroad"
  },
  {
    id: "ch_utility",
    title: "Maju ke Fasilitas Umum Terdekat",
    desc: "Maju ke utilitas terdekat. Jika berpemilik, lempar dadu dan bayar 10x jumlah dadu.",
    action: "nearest_utility"
  },
  {
    id: "ch_dividend",
    title: "Dividen Bank",
    desc: "Bank membayarkan dividen investasi Anda sebesar $50.",
    action: "earn_bank",
    amount: 50
  },
  {
    id: "ch_get_out_jail",
    title: "Kartu Bebas Penjara",
    desc: "Kartu ini dapat disimpan sampai diperlukan atau diperdagangkan ke pemain lain.",
    action: "jail_free"
  },
  {
    id: "ch_back_3",
    title: "Mundur 3 Langkah",
    desc: "Mundur 3 petak dari posisi Anda sekarang.",
    action: "move_steps",
    steps: -3
  },
  {
    id: "ch_jail",
    title: "Langsung ke Penjara!",
    desc: "Masuk langsung ke penjara. Jangan melewati GO, jangan ambil $200.",
    action: "go_to_jail"
  },
  {
    id: "ch_repairs",
    title: "Perbaikan Umum Properti",
    desc: "Bayar biaya renovasi ke Bank: $25 per rumah, $100 per hotel yang Anda miliki.",
    action: "repairs",
    perHouse: 25,
    perHotel: 100
  },
  {
    id: "ch_speeding",
    title: "Denda Tilang Kecepatan",
    desc: "Anda melanggar batas kecepatan di jalan raya. Bayar denda $15.",
    action: "pay_bank",
    amount: 15
  },
  {
    id: "ch_chairman",
    title: "Terpilih Sebagai Ketua Dewan",
    desc: "Anda terpilih sebagai ketua dewan! Bayar setiap pemain lain $50.",
    action: "pay_all_players",
    amount: 50
  },
  {
    id: "ch_loan_mature",
    title: "Pinjaman Properti Lunas",
    desc: "Kredit bangunan Anda telah jatuh tempo. Ambil $150 dari Bank.",
    action: "earn_bank",
    amount: 150
  }
];

// COMMUNITY CHEST CARDS (Kartu Dana Umum)
const COMMUNITY_CHEST_CARDS = [
  {
    id: "cc_go",
    title: "Maju ke GO",
    desc: "Maju langsung ke petak GO. Ambil $200 dari Bank.",
    action: "move_to",
    target: 0,
    collectPassGo: true
  },
  {
    id: "cc_bank_error",
    title: "Kesalahan Pembukuan Bank",
    desc: "Terjadi kesalahan pembukuan bank yang menguntungkan Anda. Ambil $200!",
    action: "earn_bank",
    amount: 200
  },
  {
    id: "cc_doctor",
    title: "Biaya Dokter",
    desc: "Pemeriksaan medis rutin. Bayar dokter $50.",
    action: "pay_bank",
    amount: 50
  },
  {
    id: "cc_stock",
    title: "Hasil Penjualan Saham",
    desc: "Penjualan saham Anda membuahkan laba. Ambil $50 dari Bank.",
    action: "earn_bank",
    amount: 50
  },
  {
    id: "cc_get_out_jail",
    title: "Kartu Bebas Penjara",
    desc: "Kartu ini dapat disimpan sampai diperlukan atau dijual/ditukar ke pemain lain.",
    action: "jail_free"
  },
  {
    id: "cc_jail",
    title: "Langsung Masuk Penjara!",
    desc: "Pergi langsung ke penjara. Jangan melewati GO, jangan ambil $200.",
    action: "go_to_jail"
  },
  {
    id: "cc_holiday",
    title: "Tabungan Liburan Cair",
    desc: "Tabungan akhir tahun Anda telah cair. Ambil $100 dari Bank.",
    action: "earn_bank",
    amount: 100
  },
  {
    id: "cc_tax_refund",
    title: "Pengembalian Pajak Penghasilan",
    desc: "Anda menerima restitusi pajak pendapatan. Ambil $20 dari Bank.",
    action: "earn_bank",
    amount: 20
  },
  {
    id: "cc_birthday",
    title: "Selamat Ulang Tahun!",
    desc: "Hari ini adalah hari ulang tahun Anda! Ambil hadiah $10 dari SETIAP pemain lain.",
    action: "collect_from_all",
    amount: 10
  },
  {
    id: "cc_life_insurance",
    title: "Asuransi Jiwa Jatuh Tempo",
    desc: "Polis asuransi jiwa Anda telah matang. Ambil $100 dari Bank.",
    action: "earn_bank",
    amount: 100
  },
  {
    id: "cc_hospital",
    title: "Biaya Rumah Sakit",
    desc: "Perawatan darurat di rumah sakit. Bayar $100 ke Bank.",
    action: "pay_bank",
    amount: 100
  },
  {
    id: "cc_school",
    title: "Uang Sekolah",
    desc: "Pembayaran SPP dan perlengkapan sekolah. Bayar $50 ke Bank.",
    action: "pay_bank",
    amount: 50
  },
  {
    id: "cc_consulting",
    title: "Honorarium Konsultasi",
    desc: "Anda menerima imbalan jasa konsultasi bisnis sebesar $25.",
    action: "earn_bank",
    amount: 25
  },
  {
    id: "cc_street_repairs",
    title: "Perbaikan Jalan Pemda",
    desc: "Pungutan perbaikan fasilitas umum: Bayar $40 per rumah dan $115 per hotel.",
    action: "repairs",
    perHouse: 40,
    perHotel: 115
  },
  {
    id: "cc_opera",
    title: "Malam Gala Opera",
    desc: "Anda menyelenggarakan malam opera pembuka. Kumpulkan $50 dari setiap pemain untuk tiket!",
    action: "collect_from_all",
    amount: 50
  }
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    BOARD_DATA,
    COLOR_GROUPS,
    INITIAL_CURRENCY_BREAKDOWN,
    TOKEN_OPTIONS,
    CHANCE_CARDS,
    COMMUNITY_CHEST_CARDS
  };
}
