import type { Lang } from "../i18n";

// Terms & Conditions and Privacy Policy shown at /terms and /privacy and linked
// from registration. English and Bahasa Malaysia (a PDPA privacy notice is
// expected in both).
//
// IMPORTANT: this is a working draft written for the product as it is built,
// NOT reviewed by a lawyer. Before real customers rely on it: (1) fill in
// LEGAL_ENTITY below, (2) have counsel review both documents, (3) bump the
// version date when the text changes - registration records which version each
// person accepted, and the backend refuses a stale one.

// Must match TMS-Backend/src/common/legal.ts (the server refuses a mismatch).
export const LEGAL_VERSIONS = { terms: "2026-09-24", privacy: "2026-09-24" } as const;

// The operator of the service. Leave a value empty and the page shows a visible
// [placeholder] plus a "draft" banner, so nothing unfinished goes out unnoticed.
export const LEGAL_ENTITY = {
  name: "", // e.g. "Acme Technologies Sdn Bhd (Registration No. 202301012345)"
  address: "", // registered address
  contactEmail: "", // privacy / legal contact (also the PDPA data-protection contact)
};

export const isLegalDraft = () => !LEGAL_ENTITY.name || !LEGAL_ENTITY.contactEmail;
export const legalVars = () => ({
  company: LEGAL_ENTITY.name || "[Company Name]",
  address: LEGAL_ENTITY.address || "[Registered Address]",
  email: LEGAL_ENTITY.contactEmail || "[Contact Email]",
});

export type LegalBlock = string | string[];
export interface LegalSection {
  id: string;
  heading: Record<Lang, string>;
  body: Record<Lang, LegalBlock[]>;
}

export const TERMS: LegalSection[] = [
  {
    id: "acceptance",
    heading: { en: "1. Acceptance of these Terms", ms: "1. Penerimaan Terma ini" },
    body: {
      en: [
        "These Terms and Conditions (the \"Terms\") govern your use of the Treasury System (the \"Service\"), provided by {company} (\"we\", \"us\"). By creating an account or using the Service you agree to these Terms and to our Privacy Policy.",
        "If you register on behalf of a company or other organisation, you confirm that you are authorised to bind it to these Terms, and \"you\" includes that organisation.",
      ],
      ms: [
        "Terma dan Syarat ini (\"Terma\") mengawal penggunaan anda terhadap Treasury System (\"Perkhidmatan\"), yang disediakan oleh {company} (\"kami\"). Dengan mencipta akaun atau menggunakan Perkhidmatan, anda bersetuju dengan Terma ini dan Dasar Privasi kami.",
        "Jika anda mendaftar bagi pihak sebuah syarikat atau organisasi lain, anda mengesahkan bahawa anda diberi kuasa untuk mengikat organisasi itu kepada Terma ini, dan \"anda\" merangkumi organisasi tersebut.",
      ],
    },
  },
  {
    id: "service",
    heading: { en: "2. The Service", ms: "2. Perkhidmatan" },
    body: {
      en: [
        "The Service helps finance teams record and view bank balances, payments, collections, transfers, banker acceptances and forecasts, with approval workflows and an audit trail.",
        [
          "The Service does not connect to your banks and does not move money. Balances and figures are based on what you and your users enter and on the actions taken in the Service.",
          "Forecasts and projections are estimates from the data entered. They are not a guarantee of future cash positions.",
          "The Service is a tool, not financial, accounting, tax or legal advice.",
        ],
      ],
      ms: [
        "Perkhidmatan ini membantu pasukan kewangan merekod dan melihat baki bank, pembayaran, kutipan, pindahan, penerimaan bank dan ramalan, dengan aliran kerja kelulusan dan jejak audit.",
        [
          "Perkhidmatan ini tidak bersambung dengan bank anda dan tidak memindahkan wang. Baki dan angka adalah berdasarkan apa yang anda dan pengguna anda masukkan serta tindakan yang diambil dalam Perkhidmatan.",
          "Ramalan dan unjuran ialah anggaran daripada data yang dimasukkan. Ia bukan jaminan kedudukan tunai pada masa hadapan.",
          "Perkhidmatan ini ialah alat, bukan nasihat kewangan, perakaunan, cukai atau undang-undang.",
        ],
      ],
    },
  },
  {
    id: "account",
    heading: { en: "3. Your account and security", ms: "3. Akaun dan keselamatan anda" },
    body: {
      en: [
        [
          "Give accurate information when you register and keep it up to date.",
          "Keep your password and any two-factor authentication codes confidential. You are responsible for activity under your account and under the accounts of users you add.",
          "Tell us promptly if you suspect unauthorised access.",
          "The person who registers becomes the organisation's Admin and is responsible for adding users, assigning roles and removing access when someone leaves.",
        ],
      ],
      ms: [
        [
          "Berikan maklumat yang tepat semasa mendaftar dan pastikan ia sentiasa terkini.",
          "Rahsiakan kata laluan dan sebarang kod pengesahan dua faktor anda. Anda bertanggungjawab ke atas aktiviti di bawah akaun anda dan akaun pengguna yang anda tambah.",
          "Maklumkan kepada kami dengan segera jika anda mengesyaki akses tanpa kebenaran.",
          "Orang yang mendaftar menjadi Admin organisasi dan bertanggungjawab menambah pengguna, menetapkan peranan dan membuang akses apabila seseorang berhenti.",
        ],
      ],
    },
  },
  {
    id: "data",
    heading: { en: "4. Your data", ms: "4. Data anda" },
    body: {
      en: [
        "You own the data you put into the Service (\"Your Data\"). You give us the right to store and process it only as needed to provide, secure and support the Service, as described in the Privacy Policy.",
        "You are responsible for the accuracy of Your Data and for having the right to enter it - including personal data of your employees, suppliers and customers (for example payee names and bank account numbers). You must comply with the Personal Data Protection Act 2010 and other laws that apply to that data.",
        "You are responsible for checking payments, approvals and figures before acting on them.",
      ],
      ms: [
        "Anda memiliki data yang anda masukkan ke dalam Perkhidmatan (\"Data Anda\"). Anda memberi kami hak untuk menyimpan dan memprosesnya hanya sebagaimana perlu untuk menyediakan, melindungi dan menyokong Perkhidmatan, seperti yang diterangkan dalam Dasar Privasi.",
        "Anda bertanggungjawab ke atas ketepatan Data Anda dan atas hak untuk memasukkannya - termasuk data peribadi pekerja, pembekal dan pelanggan anda (contohnya nama penerima bayaran dan nombor akaun bank). Anda mesti mematuhi Akta Perlindungan Data Peribadi 2010 dan undang-undang lain yang terpakai kepada data tersebut.",
        "Anda bertanggungjawab menyemak pembayaran, kelulusan dan angka sebelum bertindak berdasarkannya.",
      ],
    },
  },
  {
    id: "use",
    heading: { en: "5. Acceptable use", ms: "5. Penggunaan yang dibenarkan" },
    body: {
      en: [
        "You must not:",
        [
          "use the Service for anything unlawful, or to process funds you have no right to handle;",
          "try to access another organisation's data, or to bypass access controls, approval requirements or usage limits;",
          "probe, scan or test the Service's security without our written permission;",
          "overload the Service, or copy, resell or reverse-engineer it except as the law allows.",
        ],
      ],
      ms: [
        "Anda tidak boleh:",
        [
          "menggunakan Perkhidmatan untuk sebarang perkara yang menyalahi undang-undang, atau untuk memproses dana yang anda tidak berhak mengendalikannya;",
          "cuba mengakses data organisasi lain, atau memintas kawalan akses, keperluan kelulusan atau had penggunaan;",
          "menyiasat, mengimbas atau menguji keselamatan Perkhidmatan tanpa kebenaran bertulis kami;",
          "membebankan Perkhidmatan, atau menyalin, menjual semula atau menyahbina Perkhidmatan kecuali sebagaimana dibenarkan oleh undang-undang.",
        ],
      ],
    },
  },
  {
    id: "fees",
    heading: { en: "6. Plans, fees and payment", ms: "6. Pelan, yuran dan pembayaran" },
    body: {
      en: [
        [
          "The Service is offered on Free, Pro and Pro+ plans. Each plan's features and limits (such as the number of users and bank accounts) are shown on the pricing page in the Service.",
          "Paid plans are billed monthly in Malaysian Ringgit through our payment provider. We do not store your card details.",
          "You can change plans in Administration > Subscription. A downgrade may need you to reduce users or bank accounts to fit the new plan's limits first.",
          "We may change prices or plan contents by giving you reasonable notice before the change applies to you.",
          "Fees are non-refundable except where the law requires otherwise. Taxes, where applicable, are additional.",
        ],
      ],
      ms: [
        [
          "Perkhidmatan ditawarkan dalam pelan Free, Pro dan Pro+. Ciri dan had setiap pelan (seperti bilangan pengguna dan akaun bank) dipaparkan pada halaman harga dalam Perkhidmatan.",
          "Pelan berbayar dibilkan setiap bulan dalam Ringgit Malaysia melalui penyedia pembayaran kami. Kami tidak menyimpan butiran kad anda.",
          "Anda boleh menukar pelan dalam Administration > Subscription. Penurunan taraf mungkin memerlukan anda mengurangkan pengguna atau akaun bank supaya muat dengan had pelan baharu terlebih dahulu.",
          "Kami boleh menukar harga atau kandungan pelan dengan memberi notis yang munasabah sebelum perubahan itu terpakai kepada anda.",
          "Yuran tidak boleh dikembalikan kecuali jika undang-undang menghendaki sebaliknya. Cukai, jika berkenaan, adalah tambahan.",
        ],
      ],
    },
  },
  {
    id: "availability",
    heading: { en: "7. Availability and changes", ms: "7. Ketersediaan dan perubahan" },
    body: {
      en: [
        "We work to keep the Service available and secure, but we do not promise it will be uninterrupted or error-free. We may carry out maintenance, and we may add, change or remove features. If we make a change that materially reduces what your plan provides, we will tell you in advance where we reasonably can.",
      ],
      ms: [
        "Kami berusaha memastikan Perkhidmatan sentiasa tersedia dan selamat, tetapi kami tidak menjanjikan ia tidak akan terganggu atau bebas ralat. Kami boleh menjalankan penyelenggaraan, dan kami boleh menambah, menukar atau membuang ciri. Jika kami membuat perubahan yang mengurangkan dengan ketara apa yang disediakan oleh pelan anda, kami akan memberitahu anda terlebih dahulu jika munasabah.",
      ],
    },
  },
  {
    id: "disclaimer",
    heading: { en: "8. Disclaimers", ms: "8. Penafian" },
    body: {
      en: [
        "To the extent the law allows, the Service is provided \"as is\" and \"as available\". We do not warrant that it will meet your particular requirements, or that figures shown are free from error. Because the Service does not connect to your banks, you must check balances against your bank statements and verify every payment through your bank's own controls before relying on it.",
      ],
      ms: [
        "Setakat yang dibenarkan oleh undang-undang, Perkhidmatan disediakan \"seadanya\" dan \"mengikut ketersediaan\". Kami tidak menjamin bahawa ia akan memenuhi keperluan khusus anda, atau bahawa angka yang dipaparkan bebas daripada ralat. Oleh kerana Perkhidmatan tidak bersambung dengan bank anda, anda mesti menyemak baki dengan penyata bank anda dan mengesahkan setiap pembayaran melalui kawalan bank anda sendiri sebelum bergantung kepadanya.",
      ],
    },
  },
  {
    id: "liability",
    heading: { en: "9. Limitation of liability", ms: "9. Had liabiliti" },
    body: {
      en: [
        "To the extent the law allows, we are not liable for indirect or consequential loss, loss of profit, or loss arising from decisions made or payments released using figures in the Service. Our total liability to you for any claim relating to the Service is limited to the fees you paid us for the Service in the 12 months before the claim arose. Nothing in these Terms limits liability that cannot be limited by law.",
      ],
      ms: [
        "Setakat yang dibenarkan oleh undang-undang, kami tidak bertanggungjawab atas kerugian tidak langsung atau berbangkit, kehilangan keuntungan, atau kerugian yang timbul daripada keputusan yang dibuat atau pembayaran yang dikeluarkan menggunakan angka dalam Perkhidmatan. Jumlah liabiliti kami kepada anda bagi sebarang tuntutan berkaitan Perkhidmatan dihadkan kepada yuran yang anda bayar kepada kami untuk Perkhidmatan dalam tempoh 12 bulan sebelum tuntutan itu timbul. Tiada apa-apa dalam Terma ini yang menghadkan liabiliti yang tidak boleh dihadkan oleh undang-undang.",
      ],
    },
  },
  {
    id: "termination",
    heading: { en: "10. Suspension and termination", ms: "10. Penggantungan dan penamatan" },
    body: {
      en: [
        "You may stop using the Service at any time. We may suspend or end access if you seriously or repeatedly breach these Terms, if fees are unpaid after notice, or if needed to protect the Service or other users. On request after termination we will make Your Data available to you for a reasonable period, and afterwards delete or anonymise it in line with the Privacy Policy, except where we must keep it by law.",
      ],
      ms: [
        "Anda boleh berhenti menggunakan Perkhidmatan pada bila-bila masa. Kami boleh menggantung atau menamatkan akses jika anda melanggar Terma ini dengan serius atau berulang kali, jika yuran tidak dibayar selepas notis, atau jika perlu untuk melindungi Perkhidmatan atau pengguna lain. Atas permintaan selepas penamatan, kami akan menyediakan Data Anda kepada anda untuk tempoh yang munasabah, dan selepas itu memadam atau menyahkenal pastinya selaras dengan Dasar Privasi, kecuali jika kami mesti menyimpannya mengikut undang-undang.",
      ],
    },
  },
  {
    id: "changes",
    heading: { en: "11. Changes to these Terms", ms: "11. Perubahan pada Terma ini" },
    body: {
      en: [
        "We may update these Terms. When we do, we will change the version date shown on this page and, for material changes, give you reasonable notice. If you keep using the Service after a change takes effect, you accept the updated Terms.",
      ],
      ms: [
        "Kami boleh mengemas kini Terma ini. Apabila kami berbuat demikian, kami akan menukar tarikh versi yang dipaparkan pada halaman ini dan, bagi perubahan yang ketara, memberi notis yang munasabah. Jika anda terus menggunakan Perkhidmatan selepas perubahan berkuat kuasa, anda menerima Terma yang dikemas kini.",
      ],
    },
  },
  {
    id: "law",
    heading: { en: "12. Governing law", ms: "12. Undang-undang yang mentadbir" },
    body: {
      en: ["These Terms are governed by the laws of Malaysia, and the courts of Malaysia have jurisdiction over any dispute arising from them."],
      ms: ["Terma ini ditadbir oleh undang-undang Malaysia, dan mahkamah Malaysia mempunyai bidang kuasa ke atas sebarang pertikaian yang timbul daripadanya."],
    },
  },
  {
    id: "contact",
    heading: { en: "13. Contact", ms: "13. Hubungi kami" },
    body: {
      en: ["Questions about these Terms: {company}, {address}. Email: {email}."],
      ms: ["Pertanyaan tentang Terma ini: {company}, {address}. E-mel: {email}."],
    },
  },
];

export const PRIVACY: LegalSection[] = [
  {
    id: "who",
    heading: { en: "1. Who we are and what this notice covers", ms: "1. Siapa kami dan apa yang dilindungi oleh notis ini" },
    body: {
      en: [
        "{company} (\"we\", \"us\") provides the Treasury System (the \"Service\"). This notice explains how we handle personal data under the Personal Data Protection Act 2010 (\"PDPA\"). It is provided in English and Bahasa Malaysia.",
        "For personal data that you or your organisation enter about other people (such as payees, colleagues or customers), your organisation decides why and how it is used and we process it on your organisation's behalf to provide the Service. For data about the users of the Service (account and sign-in data), we are the data user.",
      ],
      ms: [
        "{company} (\"kami\") menyediakan Treasury System (\"Perkhidmatan\"). Notis ini menerangkan bagaimana kami mengendalikan data peribadi di bawah Akta Perlindungan Data Peribadi 2010 (\"PDPA\"). Notis ini disediakan dalam Bahasa Malaysia dan Bahasa Inggeris.",
        "Bagi data peribadi yang anda atau organisasi anda masukkan tentang orang lain (seperti penerima bayaran, rakan sekerja atau pelanggan), organisasi anda menentukan mengapa dan bagaimana ia digunakan dan kami memprosesnya bagi pihak organisasi anda untuk menyediakan Perkhidmatan. Bagi data tentang pengguna Perkhidmatan (data akaun dan log masuk), kami ialah pengguna data.",
      ],
    },
  },
  {
    id: "collect",
    heading: { en: "2. Personal data we collect", ms: "2. Data peribadi yang kami kumpul" },
    body: {
      en: [
        [
          "Account data: your name, work email, job title, department, role, and a securely hashed password. If you turn on two-factor authentication, an encrypted authenticator secret and recovery codes.",
          "Acceptance records: when you register, that you accepted the Terms and Privacy Policy, which version, and when.",
          "Activity data: sign-in times, the IP address of requests, and an audit trail of actions taken in the Service (for example who approved a payment, and when).",
          "Data you enter: bank account details, balances, payments and collections, which may include names and bank account numbers of payees, suppliers and customers.",
          "Billing data: for paid plans, your payment provider processes your payment details. We receive confirmation of payment, not your card number.",
        ],
        "You are not required to give us this data, but we cannot provide the Service without the account data.",
      ],
      ms: [
        [
          "Data akaun: nama anda, e-mel kerja, jawatan, jabatan, peranan, dan kata laluan yang di-hash dengan selamat. Jika anda mengaktifkan pengesahan dua faktor, rahsia pengesah yang disulitkan dan kod pemulihan.",
          "Rekod penerimaan: semasa anda mendaftar, bahawa anda menerima Terma dan Dasar Privasi, versi yang mana, dan bila.",
          "Data aktiviti: masa log masuk, alamat IP permintaan, dan jejak audit tindakan yang diambil dalam Perkhidmatan (contohnya siapa yang meluluskan pembayaran, dan bila).",
          "Data yang anda masukkan: butiran akaun bank, baki, pembayaran dan kutipan, yang mungkin merangkumi nama dan nombor akaun bank penerima bayaran, pembekal dan pelanggan.",
          "Data pengebilan: bagi pelan berbayar, penyedia pembayaran anda memproses butiran pembayaran anda. Kami menerima pengesahan pembayaran, bukan nombor kad anda.",
        ],
        "Anda tidak diwajibkan memberi data ini kepada kami, tetapi kami tidak dapat menyediakan Perkhidmatan tanpa data akaun.",
      ],
    },
  },
  {
    id: "use",
    heading: { en: "3. How we use personal data", ms: "3. Bagaimana kami menggunakan data peribadi" },
    body: {
      en: [
        [
          "To create and run your account and provide the Service.",
          "To keep the Service secure: authentication, access control, fraud and abuse prevention, and the audit trail.",
          "To bill paid plans and respond to support requests.",
          "To send service messages, such as approval notifications and security notices.",
          "To meet legal obligations and to handle disputes.",
        ],
        "We do not sell personal data, and we do not use the financial data you enter for advertising.",
      ],
      ms: [
        [
          "Untuk mencipta dan menjalankan akaun anda serta menyediakan Perkhidmatan.",
          "Untuk memastikan Perkhidmatan selamat: pengesahan, kawalan akses, pencegahan penipuan dan penyalahgunaan, dan jejak audit.",
          "Untuk membilkan pelan berbayar dan menjawab permintaan sokongan.",
          "Untuk menghantar mesej perkhidmatan, seperti notifikasi kelulusan dan notis keselamatan.",
          "Untuk memenuhi kewajipan undang-undang dan menangani pertikaian.",
        ],
        "Kami tidak menjual data peribadi, dan kami tidak menggunakan data kewangan yang anda masukkan untuk pengiklanan.",
      ],
    },
  },
  {
    id: "share",
    heading: { en: "4. Who we share it with", ms: "4. Dengan siapa kami berkongsi" },
    body: {
      en: [
        "We share personal data only where needed, with:",
        [
          "infrastructure and hosting providers that run the Service for us;",
          "our payment provider, for paid plans;",
          "your organisation's identity provider, if your organisation uses single sign-on;",
          "professional advisers, and authorities or courts where the law requires it.",
        ],
        "Exchange-rate providers we use receive currency codes only, never personal data. Providers are required to protect the data and use it only for the service they provide to us.",
      ],
      ms: [
        "Kami berkongsi data peribadi hanya jika perlu, dengan:",
        [
          "penyedia infrastruktur dan pengehosan yang menjalankan Perkhidmatan untuk kami;",
          "penyedia pembayaran kami, bagi pelan berbayar;",
          "penyedia identiti organisasi anda, jika organisasi anda menggunakan log masuk tunggal;",
          "penasihat profesional, dan pihak berkuasa atau mahkamah jika undang-undang menghendakinya.",
        ],
        "Penyedia kadar pertukaran yang kami gunakan hanya menerima kod mata wang, tidak pernah data peribadi. Penyedia dikehendaki melindungi data dan menggunakannya hanya untuk perkhidmatan yang mereka sediakan kepada kami.",
      ],
    },
  },
  {
    id: "overseas",
    heading: { en: "5. Processing outside Malaysia", ms: "5. Pemprosesan di luar Malaysia" },
    body: {
      en: ["Some of our providers may store or process data outside Malaysia. Where that happens we take reasonable steps so that the data remains protected to a standard consistent with the PDPA."],
      ms: ["Sesetengah penyedia kami mungkin menyimpan atau memproses data di luar Malaysia. Jika ini berlaku, kami mengambil langkah yang munasabah supaya data kekal dilindungi mengikut standard yang selaras dengan PDPA."],
    },
  },
  {
    id: "retention",
    heading: { en: "6. How long we keep it", ms: "6. Berapa lama kami menyimpannya" },
    body: {
      en: ["We keep account and activity data while your account is active and for as long afterwards as needed for the purposes above, including audit, security and legal requirements. Financial records and audit trails may be kept for longer where the law or your organisation's own obligations require. When data is no longer needed, we delete or anonymise it."],
      ms: ["Kami menyimpan data akaun dan aktiviti selagi akaun anda aktif dan selepas itu selama yang perlu untuk tujuan di atas, termasuk keperluan audit, keselamatan dan undang-undang. Rekod kewangan dan jejak audit mungkin disimpan lebih lama jika undang-undang atau kewajipan organisasi anda sendiri menghendakinya. Apabila data tidak lagi diperlukan, kami memadam atau menyahkenal pastinya."],
    },
  },
  {
    id: "security",
    heading: { en: "7. How we protect it", ms: "7. Bagaimana kami melindunginya" },
    body: {
      en: [
        [
          "Each organisation's data is kept separate from every other organisation's.",
          "Passwords are stored only as hashes; two-factor secrets are encrypted.",
          "Access is controlled by roles, and payments and transfers can require approval by a second person.",
          "Actions are recorded in an audit trail.",
        ],
        "No system is perfectly secure. If we become aware of a breach that affects your personal data, we will act to contain it and tell those affected as the law requires.",
      ],
      ms: [
        [
          "Data setiap organisasi diasingkan daripada data organisasi lain.",
          "Kata laluan disimpan hanya sebagai hash; rahsia dua faktor disulitkan.",
          "Akses dikawal melalui peranan, dan pembayaran serta pindahan boleh memerlukan kelulusan orang kedua.",
          "Tindakan direkodkan dalam jejak audit.",
        ],
        "Tiada sistem yang selamat sepenuhnya. Jika kami mengetahui berlakunya pelanggaran yang menjejaskan data peribadi anda, kami akan bertindak untuk membendungnya dan memaklumkan pihak yang terjejas sebagaimana dikehendaki oleh undang-undang.",
      ],
    },
  },
  {
    id: "rights",
    heading: { en: "8. Your rights", ms: "8. Hak anda" },
    body: {
      en: [
        "Under the PDPA you may ask to access the personal data we hold about you, ask us to correct it, and ask us to limit how it is processed. You can withdraw consent to processing that depends on consent, although we may then be unable to provide the Service.",
        "To make a request, contact us at {email}. We may ask you to confirm your identity first, and may charge a reasonable fee where the law allows. If the data was entered by your organisation, we may direct you to your organisation's Admin.",
      ],
      ms: [
        "Di bawah PDPA anda boleh meminta akses kepada data peribadi yang kami simpan tentang anda, meminta kami membetulkannya, dan meminta kami menghadkan cara ia diproses. Anda boleh menarik balik persetujuan bagi pemprosesan yang bergantung kepada persetujuan, walaupun kami mungkin tidak dapat menyediakan Perkhidmatan selepas itu.",
        "Untuk membuat permintaan, hubungi kami di {email}. Kami mungkin meminta anda mengesahkan identiti anda terlebih dahulu, dan mungkin mengenakan bayaran yang munasabah jika undang-undang membenarkan. Jika data itu dimasukkan oleh organisasi anda, kami mungkin merujuk anda kepada Admin organisasi anda.",
      ],
    },
  },
  {
    id: "storage",
    heading: { en: "9. Cookies and browser storage", ms: "9. Kuki dan storan pelayar" },
    body: {
      en: ["The Service keeps your sign-in session token and preferences (such as your language choice) in your browser's local storage so it works as you use it. It does not use advertising or cross-site tracking cookies."],
      ms: ["Perkhidmatan menyimpan token sesi log masuk dan pilihan anda (seperti pilihan bahasa) dalam storan setempat pelayar anda supaya ia berfungsi semasa anda menggunakannya. Ia tidak menggunakan kuki pengiklanan atau penjejakan merentas laman."],
    },
  },
  {
    id: "children",
    heading: { en: "10. Children", ms: "10. Kanak-kanak" },
    body: {
      en: ["The Service is for business use and is not directed at people under 18."],
      ms: ["Perkhidmatan ini untuk kegunaan perniagaan dan tidak ditujukan kepada orang yang berumur di bawah 18 tahun."],
    },
  },
  {
    id: "changes",
    heading: { en: "11. Changes to this notice", ms: "11. Perubahan pada notis ini" },
    body: {
      en: ["We may update this notice. We will change the version date on this page and, for material changes, give you reasonable notice."],
      ms: ["Kami boleh mengemas kini notis ini. Kami akan menukar tarikh versi pada halaman ini dan, bagi perubahan yang ketara, memberi notis yang munasabah."],
    },
  },
  {
    id: "contact",
    heading: { en: "12. Contact", ms: "12. Hubungi kami" },
    body: {
      en: ["Questions or requests about personal data: {company}, {address}. Email: {email}."],
      ms: ["Pertanyaan atau permintaan tentang data peribadi: {company}, {address}. E-mel: {email}."],
    },
  },
];

export const LEGAL_UI: Record<Lang, Record<string, string>> = {
  en: {
    termsTitle: "Terms and Conditions",
    privacyTitle: "Privacy Policy",
    version: "Version {date}",
    draft: "Draft - company details and legal review are still pending. This text must not be relied on until they are complete.",
    back: "Back",
    otherTerms: "Read the Terms and Conditions",
    otherPrivacy: "Read the Privacy Policy",
  },
  ms: {
    termsTitle: "Terma dan Syarat",
    privacyTitle: "Dasar Privasi",
    version: "Versi {date}",
    draft: "Draf - butiran syarikat dan semakan undang-undang masih belum selesai. Teks ini tidak boleh dijadikan pegangan sehingga ia lengkap.",
    back: "Kembali",
    otherTerms: "Baca Terma dan Syarat",
    otherPrivacy: "Baca Dasar Privasi",
  },
};
