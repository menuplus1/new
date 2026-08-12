/** آراء أصحاب مطاعم عراقيين — تستخدم في جدار الآراء بصفحة التسجيل. */
export type Testimonial = {
  name: string;
  handle: string;
  city: string;
  body: string;
  img: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "أبو علي الحمداني",
    handle: "abu_ali_grill",
    city: "بغداد — مطعم مشاوي",
    body: "صارلي شهرين وياهم، الزبون يمسح الـQR ويطلب بروحه. خفّت علينا الشغلة هواي.",
    img: "https://randomuser.me/api/portraits/men/12.jpg",
  },
  {
    name: "حيدر الموسوي",
    handle: "haidar_broasted",
    city: "البصرة — بروستد",
    body: "أغيّر السعر من الموبايل ويطلع بالمنيو نفس اللحظة. ما عدت أطبع منيوات كل شهر.",
    img: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "شيلان أحمد",
    handle: "shilan_cafe",
    city: "أربيل — كافيه",
    body: "الطلبات توصل للوحة على طول، ما عاد يضيع علينا طلب بوقت الزحمة.",
    img: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "عمار النعيمي",
    handle: "furn_alnaimi",
    city: "الموصل — مخبز وحلويات",
    body: "رفعت صور الصمون والكيك بنص ساعة، والمنيو طلع أنظف من اللي كان عدنا.",
    img: "https://randomuser.me/api/portraits/men/22.jpg",
  },
  {
    name: "زينب الغانم",
    handle: "zainab_juice",
    city: "كربلاء — عصائر",
    body: "بالزيارة كل شي ينباع عصير ليمون، وأعرف هذا من الإحصائيات مو من التخمين.",
    img: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    name: "مصطفى الجبوري",
    handle: "mustafa_lounge",
    city: "السليمانية — لاونج",
    body: "شكل المنيو يجي على لون المحل، الزبون يفتحه ويحسبه تطبيق مالتنا.",
    img: "https://randomuser.me/api/portraits/men/54.jpg",
  },
  {
    name: "أبو مريم الجاف",
    handle: "kirkuk_kabab",
    city: "كركوك — كباب",
    body: "شلت الأسعار من الورق وحطيتها بالمنيو، وبيوم واحد كلشي صار محدّث.",
    img: "https://randomuser.me/api/portraits/men/76.jpg",
  },
  {
    name: "سجاد الركابي",
    handle: "sajjad_pizza",
    city: "الحلة — بيتزا",
    body: "الزبون يشوف الصورة قبل ما يطلب، صار الطلب أسرع والغلط أقل.",
    img: "https://randomuser.me/api/portraits/men/8.jpg",
  },
  {
    name: "هدى العبودي",
    handle: "huda_cafe",
    city: "الناصرية — كافيه",
    body: "أشتغل من التلفون بالكامل. أطفّي صنف خلص وأرجّعه بضغطة وحدة.",
    img: "https://randomuser.me/api/portraits/women/26.jpg",
  },
  {
    name: "علي الفتلاوي",
    handle: "najaf_masgouf",
    city: "النجف — مطعم شعبي",
    body: "السعر بالدينار وواضح، ما عاد أحد يسأل الگارسون بيش الوجبة.",
    img: "https://randomuser.me/api/portraits/men/60.jpg",
  },
  {
    name: "ثامر الدليمي",
    handle: "thamer_fish",
    city: "الرمادي — مسكوف وأسماك",
    body: "حطينا الـQR على الطاولات، أول أسبوع الزبائن تعوّدوا عليه بدون شرح.",
    img: "https://randomuser.me/api/portraits/men/41.jpg",
  },
  {
    name: "دلوفان مراد",
    handle: "duhok_breakfast",
    city: "دهوك — فطور",
    body: "المنيو بلغتين، الزبون السائح يفتحه إنكليزي وينطي طلبه بلا لخبطة.",
    img: "https://randomuser.me/api/portraits/women/12.jpg",
  },
  {
    name: "أبو حسين الخزرجي",
    handle: "baquba_sweets",
    city: "بعقوبة — حلويات",
    body: "بالأعياد الطلب يزيد، وبالمنيو ننظّم الشغلة بدون ما نلخبط بالتلفونات.",
    img: "https://randomuser.me/api/portraits/men/85.jpg",
  },
  {
    name: "رشا العماري",
    handle: "rasha_family",
    city: "العمارة — مطعم عوائل",
    body: "جرّبتها أسبوع تجربة وخلّصت الاشتراك بدون تردد. السعر بسيط والفايدة أكبر.",
    img: "https://randomuser.me/api/portraits/women/50.jpg",
  },
];
