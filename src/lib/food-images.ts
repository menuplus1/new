/** Verified stock photos (Unsplash license — free for commercial use).
 *  Every URL below was fetched and eyeballed before being mapped to a dish, so
 *  the picture actually shows what the item says. Used by the starter menus and
 *  the demo tenants — a menu with real photos is the whole product demo. */

const u = (id: string, w = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMG = {
  // مشاوي وأطباق
  kebab: u("photo-1603360946369-dc9bb6258143"),
  mixedGrill: u("photo-1555939594-58d7cb561ad1"),
  tikka: u("photo-1550367363-ea12860cc124"),
  grilledPlate: u("photo-1476224203421-9ac39bcb3327"),
  grilledChicken: u("photo-1610057099431-d73a1c9d2f2f"),
  ribs: u("photo-1544025162-d76694265947"),
  shawarma: u("photo-1529006557810-274b9b2fc783"),
  tashreeb: u("photo-1546833999-b9f581a1996d"),
  shrimpRice: u("photo-1559847844-5315695dadae"), // ربيان بالرز — البصرة
  // مقبلات وفطور
  mezze: u("photo-1541014741259-de529411b96a"),
  samosa: u("photo-1601050690597-df0568f70950"),
  salad: u("photo-1540189549336-e6e99c3679fe"),
  breakfast: u("photo-1590301157890-4810ed352733"),
  eggToast: u("photo-1533089860892-a7c6f0a88666"),
  // وجبات سريعة
  burger: u("photo-1571091718767-18b5b1457add"),
  doubleBurger: u("photo-1550547660-d9450f859349"),
  burgerBrioche: u("photo-1568901346375-23c9450c58cd"),
  broasted: u("photo-1626074353765-517a681e40be"),
  sandwich: u("photo-1592415486689-125cbbfcbee2"),
  pizza: u("photo-1513104890138-7c749659a591"),
  pizzaWhole: u("photo-1565299624946-b28f40a0ae38"),
  pizzaGreens: u("photo-1593560708920-61dd98c46a4e"),
  pasta: u("photo-1621996346565-e3dbc646d9a9"),
  // قهوة ومشروبات
  latte: u("photo-1509042239860-f550ce710b93"),
  cappuccino: u("photo-1497636577773-f1231844b336"),
  icedLatte: u("photo-1517701550927-30cf4ba1dba5"),
  coldBrew: u("photo-1461023058943-07fcbe16d735"),
  tea: u("photo-1564890369478-c89ca6d9cde9"),
  coffeeCookies: u("photo-1544787219-7f47ccb76574"),
  orangeJuice: u("photo-1600271886742-f049cd451bba"),
  lemonMint: u("photo-1621263764928-df1444c5e859"),
  smoothie: u("photo-1502741224143-90386d7f8c82"),
  strawberryDrink: u("photo-1497534446932-c925b458314e"),
  // حلويات ومخبوزات
  pannaCotta: u("photo-1488477181946-6428a0291777"),
  chocolateDessert: u("photo-1551024506-0bccd828d307"),
  chocolateCake: u("photo-1578985545062-69928b1d9587"),
  tiramisu: u("photo-1571877227200-a0d98ea607e9"),
  cookies: u("photo-1558961363-fa8fdf82db35"),
  croissant: u("photo-1555507036-ab1f4038808a"),
  bread: u("photo-1509440159596-0249088772ff"),
  muffin: u("photo-1607958996333-41aef7caefaa"),
  crepe: u("photo-1584278860047-22db9ff82bed"),
  frenchToast: u("photo-1484723091739-30a097e8f929"),
  // أغلفة
  coverRestaurant: u("photo-1517248135467-4c7edcad34c4", 1400),
  coverCafe: u("photo-1495474472287-4d71bcdd2085", 1400),
  coverBakery: u("photo-1587241321921-91a834d6d191", 1400),
  coverGrill: u("photo-1555939594-58d7cb561ad1", 1400),
} as const;
