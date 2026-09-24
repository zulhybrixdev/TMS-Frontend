import type { ModuleKey } from "./types";
import type { Lang } from "../i18n";

// Help & FAQ content, in English and Bahasa Malaysia. Plain data on purpose -
// no backend or database: editing an answer is a code change, which keeps it
// versioned with the feature it describes. An answer is a list of blocks;
// a string is a paragraph, a string[] is a bullet list.

export type Block = string | string[];
export type CategoryId = "start" | "balances" | "payments" | "collections" | "transfers" | "ba" | "quotas" | "forecast" | "desk" | "reports" | "trouble";

export interface FaqItem {
  id: string;
  category: CategoryId;
  /** Plan-gated feature this answer is about - drives the Pro / Pro+ badge. */
  module?: ModuleKey;
  q: Record<Lang, string>;
  a: Record<Lang, Block[]>;
}

export const CATEGORIES: { id: CategoryId; title: Record<Lang, string> }[] = [
  { id: "start", title: { en: "Getting started", ms: "Bermula" } },
  { id: "balances", title: { en: "Balances & accounts", ms: "Baki & akaun" } },
  { id: "payments", title: { en: "Payments (AP)", ms: "Pembayaran (AP)" } },
  { id: "collections", title: { en: "Collections (AR)", ms: "Kutipan (AR)" } },
  { id: "transfers", title: { en: "Transfers between banks", ms: "Pindahan antara bank" } },
  { id: "ba", title: { en: "Banker acceptances", ms: "Penerimaan bank (BA)" } },
  { id: "quotas", title: { en: "Cheque & bank draft quotas", ms: "Kuota cek & draf bank" } },
  { id: "forecast", title: { en: "Cash forecast", ms: "Ramalan tunai" } },
  { id: "desk", title: { en: "Daily Cash Desk", ms: "Daily Cash Desk" } },
  { id: "reports", title: { en: "Reports", ms: "Laporan" } },
  { id: "trouble", title: { en: "Troubleshooting", ms: "Penyelesaian masalah" } },
];

export const FAQ: FaqItem[] = [
  // ───────────────────────── Getting started ─────────────────────────
  {
    id: "what-is-this",
    category: "start",
    q: { en: "What is this system for?", ms: "Sistem ini untuk apa?" },
    a: {
      en: [
        "It gives your finance team one place to see the cash in every bank account, record payments you owe (AP) and money you expect to receive (AR), move funds between banks, and see how your cash will look in the coming days.",
        "It does not connect to your banks. Balances come from what you record here (for example from a bank statement) and from the payments, collections and transfers processed in the system.",
      ],
      ms: [
        "Sistem ini menyediakan satu tempat untuk pasukan kewangan anda melihat tunai dalam setiap akaun bank, merekod pembayaran yang perlu dibayar (AP) dan wang yang dijangka diterima (AR), memindahkan dana antara bank, dan melihat keadaan tunai anda pada hari-hari akan datang.",
        "Sistem ini tidak bersambung terus dengan bank anda. Baki datang daripada apa yang anda rekodkan di sini (contohnya daripada penyata bank) dan daripada pembayaran, kutipan dan pindahan yang diproses dalam sistem.",
      ],
    },
  },
  {
    id: "roles",
    category: "start",
    q: { en: "What can each role do?", ms: "Apakah yang boleh dilakukan oleh setiap peranan?" },
    a: {
      en: [
        "What you see in the menu depends on your role:",
        [
          "Finance Maker - creates payments, transfers and collections, and submits them for approval.",
          "Finance Checker - approves or rejects requests (first level).",
          "Finance Manager - approves (including the second level), and manages bank accounts, banks, quotas, banker acceptances and settings.",
          "Admin - full access, including users and roles.",
          "Viewer - can look but not change anything.",
        ],
        "A person can never approve their own request.",
      ],
      ms: [
        "Menu yang anda nampak bergantung pada peranan anda:",
        [
          "Finance Maker (Pembuat) - mencipta pembayaran, pindahan dan kutipan, kemudian menghantarnya untuk kelulusan.",
          "Finance Checker (Penyemak) - meluluskan atau menolak permintaan (peringkat pertama).",
          "Finance Manager (Pengurus) - meluluskan (termasuk peringkat kedua), dan mengurus akaun bank, bank, kuota, penerimaan bank dan tetapan.",
          "Admin - akses penuh, termasuk pengguna dan peranan.",
          "Viewer (Pemerhati) - boleh melihat tetapi tidak boleh mengubah apa-apa.",
        ],
        "Seseorang tidak boleh meluluskan permintaannya sendiri.",
      ],
    },
  },
  {
    id: "plans",
    category: "start",
    q: { en: "Why can't I see, or use, some pages?", ms: "Mengapa saya tidak nampak, atau tidak boleh guna, sesetengah halaman?" },
    a: {
      en: [
        "There are two reasons a page can be missing:",
        [
          "Your role does not include it. Ask your Admin to change your role.",
          "Your organisation's plan does not include it. The page then shows an upgrade message instead of its content. Each answer in this Help page is labelled Pro or Pro+ when it needs a higher plan.",
        ],
        "Your organisation's current plan is shown at the top of the left menu, under the organisation name.",
      ],
      ms: [
        "Terdapat dua sebab sesuatu halaman tidak kelihatan:",
        [
          "Peranan anda tidak merangkumi halaman itu. Minta Admin anda menukar peranan anda.",
          "Pelan organisasi anda tidak merangkumi halaman itu. Halaman akan memaparkan mesej naik taraf sebagai ganti kandungan. Setiap jawapan dalam halaman Bantuan ini dilabel Pro atau Pro+ jika ia memerlukan pelan yang lebih tinggi.",
        ],
        "Pelan semasa organisasi anda dipaparkan di bahagian atas menu kiri, di bawah nama organisasi.",
      ],
    },
  },
  {
    id: "2fa",
    category: "start",
    q: { en: "How do I turn on two-factor authentication?", ms: "Bagaimana saya mengaktifkan pengesahan dua faktor?" },
    a: {
      en: [
        "Open your name at the top right, choose My Account, and follow the steps to scan the QR code with an authenticator app. Save the recovery codes it gives you - each works once if you lose your phone.",
        "Your Admin can also require two-factor authentication for everyone in the organisation.",
      ],
      ms: [
        "Klik nama anda di penjuru kanan atas, pilih My Account, dan ikut langkah untuk mengimbas kod QR dengan aplikasi pengesah. Simpan kod pemulihan yang diberikan - setiap kod boleh digunakan sekali sahaja jika anda kehilangan telefon.",
        "Admin anda juga boleh mewajibkan pengesahan dua faktor untuk semua orang dalam organisasi.",
      ],
    },
  },

  {
    id: "language",
    category: "start",
    q: { en: "How do I change the language?", ms: "Bagaimana saya menukar bahasa?" },
    a: {
      en: [
        "Use the EN / BM switch at the top of any page (on the sign-in and registration pages it is in the top corner). The whole system changes between English and Bahasa Malaysia straight away, and your choice is remembered on that device. English is the default.",
        "A few things come from the server or from your own data - for example names, roles you created, and some system messages - and may stay in English.",
      ],
      ms: [
        "Gunakan suis EN / BM di bahagian atas mana-mana halaman (pada halaman log masuk dan pendaftaran, ia berada di penjuru atas). Seluruh sistem bertukar antara Bahasa Inggeris dan Bahasa Malaysia serta-merta, dan pilihan anda diingati pada peranti itu. Bahasa Inggeris ialah pilihan lalai.",
        "Beberapa perkara datang daripada pelayan atau data anda sendiri - contohnya nama, peranan yang anda cipta, dan sesetengah mesej sistem - dan mungkin kekal dalam Bahasa Inggeris.",
      ],
    },
  },
  {
    id: "legal",
    category: "start",
    q: { en: "Where can I read the Terms and Conditions and Privacy Policy?", ms: "Di mana saya boleh membaca Terma dan Syarat serta Dasar Privasi?" },
    a: {
      en: [
        "They are linked at the bottom of the sign-in and registration pages, and are available in English and Bahasa Malaysia at /terms and /privacy. When you register, you are asked to tick that you have read and agree to both; the version you accepted and the date are recorded against your account.",
      ],
      ms: [
        "Ia dipautkan di bahagian bawah halaman log masuk dan pendaftaran, dan tersedia dalam Bahasa Inggeris dan Bahasa Malaysia di /terms dan /privacy. Semasa mendaftar, anda diminta menanda bahawa anda telah membaca dan bersetuju dengan kedua-duanya; versi yang anda terima dan tarikhnya direkodkan pada akaun anda.",
      ],
    },
  },

  {
    id: "announcement-banner",
    category: "start",
    q: { en: "What is the coloured banner at the top of the page?", ms: "Apakah sepanduk berwarna di bahagian atas halaman?" },
    a: {
      en: [
        "It is an announcement from the platform team - for example scheduled maintenance, planned downtime or news. The colour shows how important it is (blue for information, amber for maintenance, red for downtime), and it usually states the exact time that is affected.",
        "You can close information notices with the X. Downtime notices stay on screen until they end so nobody misses them. It goes away by itself once the notice period is over.",
        "For a major outage or upgrade the whole screen may be replaced by a \"Maintenance in progress\" notice while the system is unavailable. You do not need to reload: it disappears by itself as soon as the system is back, and you can carry on where you were.",
      ],
      ms: [
        "Ia ialah pengumuman daripada pasukan platform - contohnya penyelenggaraan berjadual, masa henti berjadual atau berita. Warna menunjukkan tahap kepentingannya (biru untuk maklumat, kuning untuk penyelenggaraan, merah untuk masa henti), dan ia biasanya menyatakan masa tepat yang terjejas.",
        "Anda boleh menutup notis maklumat dengan X. Notis masa henti kekal di skrin sehingga ia tamat supaya tiada sesiapa terlepas. Ia hilang sendiri apabila tempoh notis tamat.",
        "Untuk gangguan atau naik taraf besar, seluruh skrin mungkin diganti dengan notis \"Penyelenggaraan sedang dijalankan\" semasa sistem tidak tersedia. Anda tidak perlu memuat semula: ia hilang sendiri sebaik sahaja sistem kembali, dan anda boleh meneruskan di tempat anda berhenti.",
      ],
    },
  },
  // ───────────────────────── Balances & accounts ─────────────────────────
  {
    id: "balance-vs-available",
    category: "balances",
    q: { en: "What is the difference between balance and available cash?", ms: "Apakah perbezaan antara baki dan tunai tersedia?" },
    a: {
      en: [
        "Balance is what the account holds on the books. Available cash is what you can actually use today:",
        "Available cash = Balance - Reserved amount - Float not yet cleared",
        "If the account has an overdraft, \"Available incl. overdraft\" adds the overdraft limit on top.",
      ],
      ms: [
        "Baki ialah jumlah yang dipegang akaun dalam rekod. Tunai tersedia ialah jumlah yang benar-benar boleh anda guna hari ini:",
        "Tunai tersedia = Baki - Jumlah ditetapkan (reserved) - Float yang belum dijelaskan",
        "Jika akaun mempunyai overdraf, \"Available incl. overdraft\" menambah had overdraf di atasnya.",
      ],
    },
  },
  {
    id: "overdraft",
    category: "balances",
    q: { en: "How does overdraft work?", ms: "Bagaimana overdraf berfungsi?" },
    a: {
      en: [
        "Set an overdraft limit on the bank account (Bank Accounts > open the account > Settings). The balance is then allowed to go negative, down to that limit.",
        [
          "Overdraft used = how far below zero the balance is.",
          "Overdraft left = the limit minus what is used.",
          "Available incl. overdraft = available cash plus the whole limit, so it shows what you can still spend.",
        ],
        "A transfer out of an account can use its overdraft, as long as it stays within the limit and the account's minimum balance rule.",
      ],
      ms: [
        "Tetapkan had overdraf pada akaun bank (Bank Accounts > buka akaun > Settings). Baki kemudian dibenarkan menjadi negatif sehingga had tersebut.",
        [
          "Overdraf digunakan = sejauh mana baki berada di bawah sifar.",
          "Overdraf berbaki = had tolak jumlah yang telah digunakan.",
          "Available incl. overdraft = tunai tersedia campur keseluruhan had, jadi ia menunjukkan jumlah yang masih boleh dibelanjakan.",
        ],
        "Pindahan keluar daripada sesebuah akaun boleh menggunakan overdrafnya, selagi berada dalam had dan mematuhi peraturan baki minimum akaun itu.",
      ],
    },
  },
  {
    id: "float",
    category: "balances",
    q: { en: "What are Day 1 and Day 2 float?", ms: "Apakah float Hari 1 dan Hari 2?" },
    a: {
      en: [
        "When a cheque is deposited, the bank adds it to your balance straight away but only lets you use the money after it clears. Money in that waiting period is called float.",
        [
          "Day 1 float clears by the next business day.",
          "Day 2 float clears the business day after that.",
        ],
        "Float is included in your balance but kept out of available cash until it clears, so your available cash can be lower than your balance. Business days are Monday to Friday; public holidays are not taken into account, so you can set the exact clearing date when you mark a collection as received.",
      ],
      ms: [
        "Apabila cek dimasukkan ke bank, bank menambahnya ke baki anda serta-merta tetapi hanya membenarkan anda menggunakan wang itu selepas cek dijelaskan. Wang dalam tempoh menunggu itu dipanggil float.",
        [
          "Float Hari 1 dijelaskan menjelang hari bekerja berikutnya.",
          "Float Hari 2 dijelaskan pada hari bekerja selepas itu.",
        ],
        "Float termasuk dalam baki anda tetapi tidak dikira dalam tunai tersedia sehingga ia dijelaskan, jadi tunai tersedia anda boleh lebih rendah daripada baki. Hari bekerja ialah Isnin hingga Jumaat; cuti umum tidak diambil kira, jadi anda boleh menetapkan tarikh penjelasan yang tepat semasa menanda kutipan sebagai diterima.",
      ],
    },
  },
  {
    id: "min-target",
    category: "balances",
    q: { en: "What are minimum balance, target balance and shortfall?", ms: "Apakah baki minimum, baki sasaran dan kekurangan (shortfall)?" },
    a: {
      en: [
        [
          "Minimum balance - the least you want to keep in the account.",
          "Target balance - the level you would like it to sit at.",
          "Shortfall - how far available cash is below the minimum.",
          "Excess - how far available cash is above the target.",
        ],
        "The system uses these to warn you about accounts running low and to suggest transfers from accounts with excess cash.",
      ],
      ms: [
        [
          "Baki minimum - jumlah paling rendah yang anda mahu kekalkan dalam akaun.",
          "Baki sasaran - paras yang anda mahu akaun berada.",
          "Kekurangan (shortfall) - sejauh mana tunai tersedia berada di bawah baki minimum.",
          "Lebihan (excess) - sejauh mana tunai tersedia melebihi baki sasaran.",
        ],
        "Sistem menggunakan ini untuk memberi amaran tentang akaun yang hampir kehabisan dan mencadangkan pindahan daripada akaun yang mempunyai lebihan tunai.",
      ],
    },
  },
  {
    id: "record-balance",
    category: "balances",
    q: { en: "How do I record a balance from my bank statement?", ms: "Bagaimana saya merekod baki daripada penyata bank?" },
    a: {
      en: [
        "Bank Accounts > open the account > Record Balance. Pick the date and enter the closing balance (it can be negative for an account in overdraft).",
        [
          "Today's date updates the account's current balance straight away.",
          "An earlier date only corrects that day in the balance history. The current balance is left alone.",
          "A future date is not allowed.",
        ],
      ],
      ms: [
        "Bank Accounts > buka akaun > Record Balance. Pilih tarikh dan masukkan baki penutup (boleh negatif untuk akaun yang berada dalam overdraf).",
        [
          "Tarikh hari ini mengemas kini baki semasa akaun serta-merta.",
          "Tarikh yang lebih awal hanya membetulkan hari itu dalam sejarah baki. Baki semasa tidak berubah.",
          "Tarikh akan datang tidak dibenarkan.",
        ],
      ],
    },
  },
  {
    id: "multi-currency",
    category: "balances",
    module: "advanced_insights",
    q: { en: "How are MYR and USD accounts added together?", ms: "Bagaimana akaun MYR dan USD dicampurkan?" },
    a: {
      en: [
        "Balances in different currencies are never added together as if they were the same money. Every account and every currency is always shown in its own currency.",
        [
          "Pro+: the headline totals are converted into your base currency (normally MYR) using daily exchange rates. If no rate is available for a currency, it is left out of the total and a notice tells you.",
          "Free and Pro: the headline totals cover your base-currency accounts only. Other currencies are still shown per account and per currency.",
        ],
      ],
      ms: [
        "Baki dalam mata wang berbeza tidak pernah dicampurkan seolah-olah wang yang sama. Setiap akaun dan setiap mata wang sentiasa dipaparkan dalam mata wangnya sendiri.",
        [
          "Pro+: jumlah utama ditukar kepada mata wang asas anda (biasanya MYR) menggunakan kadar pertukaran harian. Jika tiada kadar untuk sesuatu mata wang, ia dikecualikan daripada jumlah dan satu notis akan memberitahu anda.",
          "Free dan Pro: jumlah utama hanya merangkumi akaun mata wang asas anda. Mata wang lain masih dipaparkan mengikut akaun dan mengikut mata wang.",
        ],
      ],
    },
  },
  {
    id: "site-reserve",
    category: "balances",
    q: { en: "What is the Site / Entity field on a bank account?", ms: "Apakah medan Site / Entity pada akaun bank?" },
    a: {
      en: [
        "It groups accounts by site, for example PJRM or Bukit Raja. Type the name when you create or edit an account; names already used are suggested so the same site is not spelled two ways.",
        "It is used for the Cash Reserve by Site panel on the Daily Cash Desk (Pro+).",
      ],
      ms: [
        "Ia mengumpulkan akaun mengikut tapak (site), contohnya PJRM atau Bukit Raja. Taip nama semasa mencipta atau mengedit akaun; nama yang sudah digunakan akan dicadangkan supaya tapak yang sama tidak dieja dengan dua cara.",
        "Ia digunakan untuk panel Cash Reserve by Site pada Daily Cash Desk (Pro+).",
      ],
    },
  },

  // ───────────────────────── Payments ─────────────────────────
  {
    id: "create-payment",
    category: "payments",
    q: { en: "How do I record a payment I owe (AP)?", ms: "Bagaimana saya merekod pembayaran yang perlu dibayar (AP)?" },
    a: {
      en: [
        "Payments > New Payment. Choose the source account, the method (bank transfer, cheque or bank draft), the payee, amount, invoice number and the due date.",
        [
          "The payment starts as a Draft. Open it and choose Submit for Approval when it is ready.",
          "A bank transfer needs the beneficiary's bank and account number. A cheque or bank draft does not.",
          "The amount's currency is taken from the source account. A USD invoice must be paid from a USD account.",
        ],
        "Several people can add payments at the same time.",
      ],
      ms: [
        "Payments > New Payment. Pilih akaun sumber, kaedah (pindahan bank, cek atau draf bank), penerima, jumlah, nombor invois dan tarikh akhir bayaran.",
        [
          "Pembayaran bermula sebagai Draft. Buka pembayaran dan pilih Submit for Approval apabila ia sedia.",
          "Pindahan bank memerlukan bank dan nombor akaun penerima. Cek atau draf bank tidak memerlukannya.",
          "Mata wang jumlah diambil daripada akaun sumber. Invois USD mesti dibayar daripada akaun USD.",
        ],
        "Beberapa orang boleh menambah pembayaran pada masa yang sama.",
      ],
    },
  },
  {
    id: "adjust-due-date",
    category: "payments",
    q: { en: "How do I change a payment's due date?", ms: "Bagaimana saya menukar tarikh akhir bayaran?" },
    a: {
      en: [
        "Open the payment and choose Adjust Due Date, pick the new date and, if you like, add a reason. Anyone who can create payments can do this - not only the person who raised it.",
        "You can change the date while the payment is Draft, Pending approval or Approved. Once it is Processed (posted), the date can no longer be changed. Every change is recorded in the audit trail.",
        "The forecast and the Daily Cash Desk follow the new date straight away.",
      ],
      ms: [
        "Buka pembayaran dan pilih Adjust Due Date, pilih tarikh baharu dan, jika mahu, tambah sebab. Sesiapa yang boleh mencipta pembayaran boleh berbuat demikian - bukan hanya orang yang mencipta pembayaran itu.",
        "Anda boleh menukar tarikh semasa pembayaran berstatus Draft, Pending approval atau Approved. Selepas ia Processed (dikeluarkan), tarikh tidak boleh diubah lagi. Setiap perubahan direkodkan dalam jejak audit.",
        "Ramalan dan Daily Cash Desk mengikut tarikh baharu itu serta-merta.",
      ],
    },
  },
  {
    id: "approval-flow",
    category: "payments",
    q: { en: "What happens after I submit a payment for approval?", ms: "Apa yang berlaku selepas saya menghantar pembayaran untuk kelulusan?" },
    a: {
      en: [
        "It goes to the approver(s) set up for that amount. Common statuses:",
        [
          "Pending approval - waiting for an approver.",
          "Approved - fully approved.",
          "Rejected - an approver turned it down; the reason is shown.",
          "Processed - the money has left the account and the balance is updated.",
          "Cancelled - withdrawn before it was posted.",
        ],
        "Comments and the approval history are on the payment's page.",
      ],
      ms: [
        "Ia dihantar kepada pelulus yang ditetapkan untuk jumlah tersebut. Status yang biasa:",
        [
          "Pending approval - menunggu pelulus.",
          "Approved - telah diluluskan sepenuhnya.",
          "Rejected - pelulus menolaknya; sebab dipaparkan.",
          "Processed - wang telah keluar daripada akaun dan baki telah dikemas kini.",
          "Cancelled - ditarik balik sebelum dikeluarkan.",
        ],
        "Komen dan sejarah kelulusan terdapat pada halaman pembayaran.",
      ],
    },
  },
  {
    id: "approved-not-paid",
    category: "payments",
    q: { en: "My payment is Approved but the balance has not changed. Why?", ms: "Pembayaran saya Approved tetapi baki tidak berubah. Mengapa?" },
    a: {
      en: [
        "Cash leaves the account on the payment's due date, not on the day it is approved. If the due date is in the future the payment stays Approved and is posted automatically on that day (the system checks every 15 minutes).",
        "If the due date is today or already past, it is posted as soon as it is fully approved.",
        "Until then you can still adjust the due date or cancel it, and nothing has left the account.",
      ],
      ms: [
        "Tunai keluar daripada akaun pada tarikh akhir bayaran, bukan pada hari ia diluluskan. Jika tarikh akhir ialah pada masa hadapan, pembayaran kekal Approved dan dikeluarkan secara automatik pada hari itu (sistem menyemak setiap 15 minit).",
        "Jika tarikh akhir ialah hari ini atau sudah berlalu, ia dikeluarkan sebaik sahaja diluluskan sepenuhnya.",
        "Sehingga itu anda masih boleh melaraskan tarikh akhir atau membatalkannya, dan tiada wang yang keluar daripada akaun.",
      ],
    },
  },
  {
    id: "cancel-payment",
    category: "payments",
    q: { en: "Can I cancel a payment?", ms: "Bolehkah saya membatalkan pembayaran?" },
    a: {
      en: [
        "Yes, while it is Draft, Pending approval, or Approved but not yet posted. Open the payment and choose Cancel. A Processed payment has already moved money and cannot be cancelled.",
      ],
      ms: [
        "Boleh, semasa ia berstatus Draft, Pending approval, atau Approved tetapi belum dikeluarkan. Buka pembayaran dan pilih Cancel. Pembayaran Processed telah menggerakkan wang dan tidak boleh dibatalkan.",
      ],
    },
  },
  {
    id: "bulk-templates",
    category: "payments",
    module: "beneficiaries",
    q: { en: "Can I upload many payments at once or repeat a payment every month?", ms: "Bolehkah saya memuat naik banyak pembayaran sekali gus atau mengulang pembayaran setiap bulan?" },
    a: {
      en: [
        [
          "Bulk upload: upload a CSV or Excel file of payments. Each row is checked on its own, so one bad row does not stop the others.",
          "Beneficiaries: keep a saved list of payees so you do not retype bank details.",
          "Payment templates: save a payment (for example rent) and reuse it with one click. A template can also create a Draft weekly or monthly automatically.",
        ],
        "Payments created from a template are still Drafts and still go through approval.",
      ],
      ms: [
        [
          "Muat naik pukal: muat naik fail CSV atau Excel yang mengandungi pembayaran. Setiap baris disemak secara berasingan, jadi satu baris yang salah tidak menghentikan baris lain.",
          "Penerima (Beneficiaries): simpan senarai penerima supaya anda tidak perlu menaip semula butiran bank.",
          "Templat pembayaran: simpan pembayaran (contohnya sewa) dan guna semula dengan satu klik. Templat juga boleh mencipta Draft mingguan atau bulanan secara automatik.",
        ],
        "Pembayaran yang dicipta daripada templat masih berstatus Draft dan masih melalui kelulusan.",
      ],
    },
  },
  {
    id: "unusual-amount",
    category: "payments",
    q: { en: "What is the \"Unusual payment amount\" warning?", ms: "Apakah amaran \"Unusual payment amount\"?" },
    a: {
      en: [
        "The system compares the amount with your past payments and flags one that is much larger than usual. It is only a size check to prompt a second look - it is not fraud detection and can be wrong, so use your own judgement.",
      ],
      ms: [
        "Sistem membandingkan jumlah dengan pembayaran lalu anda dan menanda jumlah yang jauh lebih besar daripada biasa. Ia hanya semakan saiz untuk mendorong semakan kedua - ia bukan pengesanan penipuan dan boleh tersilap, jadi gunakan pertimbangan anda sendiri.",
      ],
    },
  },

  // ───────────────────────── Collections ─────────────────────────
  {
    id: "record-collection",
    category: "collections",
    module: "incoming",
    q: { en: "How do I record money I expect to receive (AR)?", ms: "Bagaimana saya merekod wang yang dijangka diterima (AR)?" },
    a: {
      en: [
        "Incoming Transactions > Record Incoming. Enter who is paying, the amount, the account it will go into, the due date, the invoice number and how it clears (immediately, or Day 1 / Day 2 float for a cheque).",
        "It is saved as Expected. It only changes your balance once you mark it as received.",
      ],
      ms: [
        "Incoming Transactions > Record Incoming. Masukkan pembayar, jumlah, akaun tempat ia akan masuk, tarikh akhir, nombor invois dan cara ia dijelaskan (serta-merta, atau float Hari 1 / Hari 2 untuk cek).",
        "Ia disimpan sebagai Expected. Ia hanya mengubah baki anda selepas anda menandanya sebagai diterima.",
      ],
    },
  },
  {
    id: "receive-collection",
    category: "collections",
    module: "incoming",
    q: { en: "What happens when I mark a collection as received?", ms: "Apa yang berlaku apabila saya menanda kutipan sebagai diterima?" },
    a: {
      en: [
        "Choose Receive on the row. The account's balance goes up immediately. If you pick Day 1 or Day 2 float, the amount is shown as float and kept out of available cash until its clearing date.",
        "Afterwards, choose Reconcile once you have matched it against the bank statement.",
      ],
      ms: [
        "Pilih Receive pada baris tersebut. Baki akaun meningkat serta-merta. Jika anda memilih float Hari 1 atau Hari 2, jumlah dipaparkan sebagai float dan tidak dikira dalam tunai tersedia sehingga tarikh penjelasannya.",
        "Selepas itu, pilih Reconcile apabila anda telah memadankannya dengan penyata bank.",
      ],
    },
  },
  {
    id: "collection-late",
    category: "collections",
    module: "incoming",
    q: { en: "A customer will pay late. What should I do?", ms: "Pelanggan akan membayar lewat. Apa yang perlu saya buat?" },
    a: {
      en: [
        "Use the calendar button on the row to change its due date. Collections that are past their date and still not received are not counted in the forecast (to stay on the cautious side), so move the date or mark them received to bring them back in.",
      ],
      ms: [
        "Guna butang kalendar pada baris untuk menukar tarikh akhirnya. Kutipan yang telah melepasi tarikh dan masih belum diterima tidak dikira dalam ramalan (untuk kekal berhati-hati), jadi tukar tarikh atau tanda sebagai diterima untuk memasukkannya semula.",
      ],
    },
  },

  // ───────────────────────── Transfers ─────────────────────────
  {
    id: "make-transfer",
    category: "transfers",
    module: "transfers",
    q: { en: "How do I move money between our own bank accounts?", ms: "Bagaimana saya memindahkan wang antara akaun bank kami sendiri?" },
    a: {
      en: [
        "Inter-Bank Transfers > New Transfer. Pick the source and destination accounts, the amount and the date, then submit it for approval. The system may also suggest transfers from accounts with excess cash to accounts that are short.",
        [
          "Both accounts must be in the same currency.",
          "A transfer cannot take the source account below its minimum balance. Available overdraft counts as spendable.",
          "Like payments, an approved transfer dated in the future is posted on its date.",
        ],
      ],
      ms: [
        "Inter-Bank Transfers > New Transfer. Pilih akaun sumber dan destinasi, jumlah dan tarikh, kemudian hantar untuk kelulusan. Sistem juga boleh mencadangkan pindahan daripada akaun yang mempunyai lebihan tunai kepada akaun yang kekurangan.",
        [
          "Kedua-dua akaun mesti dalam mata wang yang sama.",
          "Pindahan tidak boleh membawa akaun sumber di bawah baki minimumnya. Overdraf yang ada dikira sebagai boleh dibelanjakan.",
          "Seperti pembayaran, pindahan yang diluluskan dan bertarikh pada masa hadapan akan dikeluarkan pada tarikh itu.",
        ],
      ],
    },
  },

  // ───────────────────────── Banker acceptances ─────────────────────────
  {
    id: "ba-drawdown",
    category: "ba",
    module: "treasury_desk",
    q: { en: "How do I record a banker acceptance drawdown?", ms: "Bagaimana saya merekod pengeluaran (drawdown) penerimaan bank?" },
    a: {
      en: [
        "Banker Acceptances > Draw Down BA. Enter the bank's BA reference, the account the bank credited, the face amount, the proceeds actually credited, and the drawdown and maturity dates.",
        [
          "Face amount - what you must repay at maturity.",
          "Proceeds - the cash the bank actually credited to you.",
          "Discount / cost - face minus proceeds, and the effective rate per year, are calculated for you as you type.",
        ],
        "The proceeds are added to the account's balance straight away. You need permission to manage bank accounts to do this.",
      ],
      ms: [
        "Banker Acceptances > Draw Down BA. Masukkan rujukan BA daripada bank, akaun yang dikreditkan bank, amaun muka (face), hasil (proceeds) yang sebenarnya dikreditkan, serta tarikh drawdown dan tarikh matang.",
        [
          "Amaun muka (face) - jumlah yang mesti anda bayar balik pada tarikh matang.",
          "Hasil (proceeds) - tunai yang sebenarnya dikreditkan bank kepada anda.",
          "Diskaun / kos - amaun muka tolak hasil, dan kadar efektif setahun, dikira untuk anda semasa anda menaip.",
        ],
        "Hasil ditambah ke baki akaun serta-merta. Anda memerlukan kebenaran mengurus akaun bank untuk melakukan ini.",
      ],
    },
  },
  {
    id: "ba-settle",
    category: "ba",
    module: "treasury_desk",
    q: { en: "How do I settle a banker acceptance at maturity?", ms: "Bagaimana saya menyelesaikan penerimaan bank pada tarikh matang?" },
    a: {
      en: [
        "On the Banker Acceptances page choose Settle on the row, confirm the date and the amount the bank debited (it defaults to the face amount). The amount is deducted from the settlement account.",
        "Until it is settled, an outstanding BA appears in the forecast as money going out on its maturity date, and rows due within 7 days or overdue are highlighted.",
      ],
      ms: [
        "Pada halaman Banker Acceptances pilih Settle pada baris, sahkan tarikh dan jumlah yang didebit bank (lalai ialah amaun muka). Jumlah itu ditolak daripada akaun penyelesaian.",
        "Sehingga diselesaikan, BA yang belum selesai muncul dalam ramalan sebagai wang keluar pada tarikh matangnya, dan baris yang matang dalam masa 7 hari atau tertunggak akan diserlahkan.",
      ],
    },
  },

  // ───────────────────────── Quotas ─────────────────────────
  {
    id: "quota-what",
    category: "quotas",
    module: "treasury_desk",
    q: { en: "What is the cheque / bank draft released quota?", ms: "Apakah kuota cek / draf bank yang dikeluarkan?" },
    a: {
      en: [
        "A quota is a daily ceiling on how much (an amount, a number of items, or both) can be released by cheque or by bank draft - for all banks together or for one bank, for example the MBSB bank draft quota. It is measured by the payment's due date.",
        [
          "Released - payments already posted for that day.",
          "Pending - payments for that day still in Draft, awaiting approval, or approved but not yet posted.",
          "Remaining - the quota minus released and pending.",
        ],
        "You can see it on the Daily Cash Desk.",
      ],
      ms: [
        "Kuota ialah had harian bagi jumlah (amaun, bilangan item, atau kedua-duanya) yang boleh dikeluarkan melalui cek atau draf bank - untuk semua bank bersama atau untuk satu bank, contohnya kuota draf bank MBSB. Ia diukur mengikut tarikh akhir bayaran.",
        [
          "Released (dikeluarkan) - pembayaran yang sudah dikeluarkan untuk hari itu.",
          "Pending (menunggu) - pembayaran untuk hari itu yang masih Draft, menunggu kelulusan, atau diluluskan tetapi belum dikeluarkan.",
          "Remaining (baki) - kuota tolak yang dikeluarkan dan yang menunggu.",
        ],
        "Anda boleh melihatnya pada Daily Cash Desk.",
      ],
    },
  },
  {
    id: "quota-set",
    category: "quotas",
    module: "treasury_desk",
    q: { en: "How do I set or change a quota, and what happens if I go over?", ms: "Bagaimana saya menetapkan atau menukar kuota, dan apa berlaku jika saya melebihinya?" },
    a: {
      en: [
        "On the Daily Cash Desk choose Set quotas (you need permission to manage bank accounts). Pick cheque or bank draft, all banks or one bank, and the daily amount and/or count limit.",
        "If a payment would take that day over the quota, you see a warning on the payment. It is a warning only - it does not stop the payment. Choose another due date or reduce the amount if you need to stay within the quota.",
      ],
      ms: [
        "Pada Daily Cash Desk pilih Set quotas (anda memerlukan kebenaran mengurus akaun bank). Pilih cek atau draf bank, semua bank atau satu bank, dan had amaun dan/atau bilangan harian.",
        "Jika sesuatu pembayaran menyebabkan hari itu melebihi kuota, anda akan melihat amaran pada pembayaran tersebut. Ia hanyalah amaran - ia tidak menghalang pembayaran. Pilih tarikh akhir lain atau kurangkan jumlah jika anda perlu kekal dalam kuota.",
      ],
    },
  },

  // ───────────────────────── Forecast ─────────────────────────
  {
    id: "forecast-how",
    category: "forecast",
    module: "forecast",
    q: { en: "How is the cash forecast calculated?", ms: "Bagaimana ramalan tunai dikira?" },
    a: {
      en: [
        "It starts from today's balances and moves forward one day at a time:",
        [
          "Payments (AP) reduce the balance on their due date.",
          "Expected collections (AR) increase it on their due date; if they carry float, they only become available once they clear.",
          "Transfers move cash between accounts on their date.",
          "Outstanding banker acceptances reduce it on their maturity date.",
          "Manual forecast entries you add are included.",
        ],
        "You can choose 10, 14, 30, 60 or 90 days, and look at one currency or all.",
      ],
      ms: [
        "Ia bermula daripada baki hari ini dan bergerak ke hadapan satu hari pada satu masa:",
        [
          "Pembayaran (AP) mengurangkan baki pada tarikh akhir bayarannya.",
          "Kutipan yang dijangka (AR) menambah baki pada tarikh akhirnya; jika ada float, ia hanya tersedia selepas dijelaskan.",
          "Pindahan menggerakkan tunai antara akaun pada tarikh pindahan.",
          "Penerimaan bank yang belum selesai mengurangkan baki pada tarikh matangnya.",
          "Anda juga boleh menambah entri ramalan manual, dan ia turut dimasukkan.",
        ],
        "Anda boleh memilih 10, 14, 30, 60 atau 90 hari, dan melihat satu mata wang atau semua.",
      ],
    },
  },
  {
    id: "forecast-views",
    category: "forecast",
    module: "forecast",
    q: { en: "What do Available, Available incl. overdraft and Book balance mean in the forecast?", ms: "Apakah maksud Available, Available incl. overdraft dan Book balance dalam ramalan?" },
    a: {
      en: [
        [
          "Book balance - the balance on the books.",
          "Available - book balance less reserved amounts and float that has not cleared yet. This is the default.",
          "Available incl. overdraft - available plus your overdraft limits.",
        ],
        "The table \"By Bank & Account\" shows each account day by day, with a total per currency. A red banner warns you if an account would fall below its minimum balance, or start drawing on overdraft.",
      ],
      ms: [
        [
          "Book balance - baki dalam rekod.",
          "Available - baki rekod tolak jumlah ditetapkan dan float yang belum dijelaskan. Ini ialah pilihan lalai.",
          "Available incl. overdraft - available campur had overdraf anda.",
        ],
        "Jadual \"By Bank & Account\" menunjukkan setiap akaun hari demi hari, dengan jumlah bagi setiap mata wang. Sepanduk merah memberi amaran jika sesebuah akaun akan jatuh di bawah baki minimumnya, atau mula menggunakan overdraf.",
      ],
    },
  },
  {
    id: "forecast-overdue",
    category: "forecast",
    module: "forecast",
    q: { en: "How does the forecast treat overdue items?", ms: "Bagaimana ramalan menangani item yang tertunggak?" },
    a: {
      en: [
        [
          "Overdue payments you still owe (and banker acceptances past maturity) are counted as going out today.",
          "Overdue collections not yet received are not counted as coming in.",
          "Drafts older than 30 days that were never submitted are treated as stale and ignored.",
        ],
        "A notice on the forecast page tells you when overdue items are affecting the figures.",
      ],
      ms: [
        [
          "Pembayaran tertunggak yang masih perlu dibayar (dan penerimaan bank yang telah melepasi tarikh matang) dikira sebagai keluar hari ini.",
          "Kutipan tertunggak yang belum diterima tidak dikira sebagai masuk.",
          "Draft yang berumur lebih 30 hari dan tidak pernah dihantar dianggap lapuk dan diabaikan.",
        ],
        "Satu notis pada halaman ramalan memberitahu anda apabila item tertunggak menjejaskan angka.",
      ],
    },
  },

  // ───────────────────────── Daily Cash Desk ─────────────────────────
  {
    id: "desk-what",
    category: "desk",
    module: "treasury_desk",
    q: { en: "What does the Daily Cash Desk show?", ms: "Apakah yang dipaparkan oleh Daily Cash Desk?" },
    a: {
      en: [
        "One page for the day's cash position, bank by bank:",
        [
          "Balances, overdraft used / limit, Day 1 and Day 2 float, reserved amount, available cash and available incl. overdraft.",
          "Movement of funds: opening balance, collections, banker acceptance drawdown and settlement, payments, transfers in and out, and the closing balance.",
          "Cheque and bank draft released quotas, cash reserve by site, and banker acceptances maturing soon.",
          "A bank-by-date grid of the last 5 days and the next 10 (projected days are shaded).",
        ],
        "Use the date box at the top to look at a previous day. Float and available figures are live, so they are shown for today only.",
      ],
      ms: [
        "Satu halaman untuk kedudukan tunai hari ini, bank demi bank:",
        [
          "Baki, overdraf digunakan / had, float Hari 1 dan Hari 2, jumlah ditetapkan, tunai tersedia dan available incl. overdraft.",
          "Pergerakan dana: baki pembukaan, kutipan, drawdown dan penyelesaian penerimaan bank, pembayaran, pindahan masuk dan keluar, dan baki penutup.",
          "Kuota cek dan draf bank yang dikeluarkan, rizab tunai mengikut tapak, dan penerimaan bank yang akan matang tidak lama lagi.",
          "Grid bank mengikut tarikh untuk 5 hari lepas dan 10 hari akan datang (hari unjuran berlorek).",
        ],
        "Guna kotak tarikh di bahagian atas untuk melihat hari sebelumnya. Angka float dan tunai tersedia adalah secara langsung, jadi ia hanya dipaparkan untuk hari ini.",
      ],
    },
  },
  {
    id: "desk-other",
    category: "desk",
    module: "treasury_desk",
    q: { en: "What is the \"Other\" column in Movement of Funds?", ms: "Apakah lajur \"Other\" dalam Movement of Funds?" },
    a: {
      en: [
        "It is any change in an account's balance that has no matching payment, collection or transfer - most often a manual correction you typed in from a bank statement. It makes every row add up: opening + movements + other = closing.",
      ],
      ms: [
        "Ia ialah sebarang perubahan pada baki akaun yang tiada pembayaran, kutipan atau pindahan yang sepadan - selalunya pembetulan manual yang anda taip daripada penyata bank. Ia memastikan setiap baris tepat: pembukaan + pergerakan + other = penutup.",
      ],
    },
  },
  {
    id: "desk-reserve",
    category: "desk",
    module: "treasury_desk",
    q: { en: "How is the cash reserve by site calculated?", ms: "Bagaimana rizab tunai mengikut tapak dikira?" },
    a: {
      en: [
        "For each site (for example PJRM or Bukit Raja) and currency: the reserved amounts set on its ordinary accounts, plus the full balance of its accounts of type Reserve. A site is set on each bank account. Accounts with no site are grouped as Unassigned.",
      ],
      ms: [
        "Bagi setiap tapak (contohnya PJRM atau Bukit Raja) dan mata wang: jumlah ditetapkan (reserved) pada akaun biasanya, campur baki penuh akaunnya yang berjenis Reserve. Tapak ditetapkan pada setiap akaun bank. Akaun tanpa tapak dikumpulkan sebagai Unassigned.",
      ],
    },
  },

  // ───────────────────────── Reports ─────────────────────────
  {
    id: "reports-export",
    category: "reports",
    module: "reports_export",
    q: { en: "How do I download a report?", ms: "Bagaimana saya memuat turun laporan?" },
    a: {
      en: [
        "Reports > choose the report, set the dates if it has them, then pick CSV or Excel. You need the permission to export reports; if you do not see the download buttons, ask your Admin.",
        "Two reports need Pro+: Daily Bank Movements & Balances (every account, every day, up to about 3 months) and the Banker Acceptance register.",
      ],
      ms: [
        "Reports > pilih laporan, tetapkan tarikh jika ada, kemudian pilih CSV atau Excel. Anda memerlukan kebenaran untuk mengeksport laporan; jika butang muat turun tidak kelihatan, tanya Admin anda.",
        "Dua laporan memerlukan Pro+: Daily Bank Movements & Balances (setiap akaun, setiap hari, sehingga kira-kira 3 bulan) dan daftar Banker Acceptance.",
      ],
    },
  },

  // ───────────────────────── Troubleshooting ─────────────────────────
  {
    id: "t-payment-rejected",
    category: "trouble",
    q: { en: "It says the payment currency must match the account. What should I do?", ms: "Ia menyatakan mata wang pembayaran mesti sepadan dengan akaun. Apa yang perlu saya buat?" },
    a: {
      en: [
        "A payment is paid out of one account in one currency. Pick a source account in the same currency as the invoice (for example a USD invoice from a USD account).",
      ],
      ms: [
        "Pembayaran dibayar daripada satu akaun dalam satu mata wang. Pilih akaun sumber dalam mata wang yang sama dengan invois (contohnya invois USD daripada akaun USD).",
      ],
    },
  },
  {
    id: "t-transfer-rejected",
    category: "trouble",
    q: { en: "My transfer was refused because of the minimum balance. What can I do?", ms: "Pindahan saya ditolak kerana baki minimum. Apa yang boleh saya buat?" },
    a: {
      en: [
        "The transfer would leave the source account below its minimum balance. Lower the amount (the message shows the most you can move), transfer from another account, or ask a Finance Manager to change the account's minimum balance.",
      ],
      ms: [
        "Pindahan itu akan meninggalkan akaun sumber di bawah baki minimumnya. Kurangkan jumlah (mesej menunjukkan jumlah maksimum yang boleh dipindahkan), pindahkan daripada akaun lain, atau minta Finance Manager menukar baki minimum akaun.",
      ],
    },
  },
  {
    id: "t-close-account",
    category: "trouble",
    q: { en: "I cannot close a bank account. Why?", ms: "Saya tidak boleh menutup akaun bank. Mengapa?" },
    a: {
      en: [
        "An account cannot be closed while it still has an outstanding banker acceptance, cheque float that has not cleared, or payments and transfers waiting for approval or release. The message says which. Settle, cancel or wait for those, then try again.",
      ],
      ms: [
        "Akaun tidak boleh ditutup selagi ia masih mempunyai penerimaan bank yang belum selesai, float cek yang belum dijelaskan, atau pembayaran dan pindahan yang menunggu kelulusan atau pengeluaran. Mesej akan menyatakan yang mana satu. Selesaikan, batalkan atau tunggu perkara tersebut, kemudian cuba lagi.",
      ],
    },
  },
  {
    id: "t-forecast-total",
    category: "trouble",
    q: { en: "My totals do not include my USD account. Why?", ms: "Jumlah saya tidak termasuk akaun USD saya. Mengapa?" },
    a: {
      en: [
        "Either your plan shows headline totals for base-currency accounts only (converted totals are Pro+), or no exchange rate was available at that moment. A notice on the page says which one. The USD account is still listed on its own line, and you can pick a single currency on the Forecast page to see it separately.",
      ],
      ms: [
        "Sama ada pelan anda memaparkan jumlah utama untuk akaun mata wang asas sahaja (jumlah yang ditukar ialah Pro+), atau tiada kadar pertukaran pada ketika itu. Satu notis pada halaman menyatakan yang mana satu. Akaun USD masih disenaraikan pada barisnya sendiri, dan anda boleh memilih satu mata wang pada halaman Forecast untuk melihatnya secara berasingan.",
      ],
    },
  },
  {
    id: "t-session",
    category: "trouble",
    q: { en: "I keep being asked to sign in again.", ms: "Saya terus diminta log masuk semula." },
    a: {
      en: [
        "Sessions expire after a period of time for security. Sign in again and you will return to where you were. If it happens straight after signing in, check that your computer's date and time are correct, and tell your Admin.",
      ],
      ms: [
        "Sesi tamat selepas satu tempoh masa untuk keselamatan. Log masuk semula dan anda akan kembali ke tempat anda berada. Jika ia berlaku sebaik sahaja selepas log masuk, semak bahawa tarikh dan masa komputer anda betul, dan maklumkan kepada Admin anda.",
      ],
    },
  },
  {
    id: "t-more-help",
    category: "trouble",
    q: { en: "I still cannot find the answer.", ms: "Saya masih tidak menjumpai jawapan." },
    a: {
      en: ["Ask your organisation's Admin, or the person in your finance team who looks after this system. When you ask, tell them the page you were on and the message you saw - it helps them find the cause quickly."],
      ms: ["Tanya Admin organisasi anda, atau orang dalam pasukan kewangan anda yang menjaga sistem ini. Semasa bertanya, beritahu mereka halaman yang anda berada dan mesej yang anda lihat - ia membantu mereka mencari punca dengan cepat."],
    },
  },
];

// UI strings for the Help page itself.
export const UI: Record<Lang, Record<string, string>> = {
  en: {
    title: "Help & FAQ",
    subtitle: "Answers to common questions about using the system.",
    search: "Search questions...",
    language: "Language",
    all: "All topics",
    noResults: "No answers match your search. Try different words, or clear the search.",
    needs: "Needs {plan}",
    notInPlan: "Not in your current plan ({current}). Available on {plan}.",
    inPlan: "Included in your plan",
    results: "{n} answers",
    expandAll: "Expand all",
    collapseAll: "Collapse all",
    note: "Use the EN / BM switch at the top of the page to change the language of the whole system.",
  },
  ms: {
    title: "Bantuan & Soalan Lazim",
    subtitle: "Jawapan kepada soalan lazim tentang penggunaan sistem ini.",
    search: "Cari soalan...",
    language: "Bahasa",
    all: "Semua topik",
    noResults: "Tiada jawapan yang sepadan dengan carian anda. Cuba perkataan lain, atau kosongkan carian.",
    needs: "Perlu {plan}",
    notInPlan: "Tiada dalam pelan semasa anda ({current}). Tersedia pada {plan}.",
    inPlan: "Termasuk dalam pelan anda",
    results: "{n} jawapan",
    expandAll: "Buka semua",
    collapseAll: "Tutup semua",
    note: "Gunakan suis EN / BM di bahagian atas halaman untuk menukar bahasa seluruh sistem.",
  },
};
