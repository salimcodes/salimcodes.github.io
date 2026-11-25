/*
 * Reference data for the AfriTaboo elicitation form.
 * Ethnic groups and languages are SUGGESTIONS only: participants can always
 * type their own answer. Lists are deliberately non-exhaustive.
 */
(function () {
  // [name, ethnic-group suggestions, language suggestions]
  const C = [
    ["Algeria", "Arab; Amazigh (Kabyle); Chaoui; Mozabite; Tuareg", "Algerian Arabic (Darja); Kabyle; Tamazight; Chaoui; French"],
    ["Angola", "Ovimbundu; Ambundu; Bakongo; Lunda-Chokwe; Nyaneka-Nkhumbi; Ovambo", "Portuguese; Umbundu; Kimbundu; Kikongo; Chokwe"],
    ["Benin", "Fon; Adja; Yoruba (Nago); Bariba; Fulani; Dendi; Gun; Ditammari", "French; Fon; Yoruba; Gun; Bariba; Fulfulde; Dendi"],
    ["Botswana", "Tswana (Batswana); Kalanga; San (Basarwa); Herero; Bayei; Mbukushu", "Setswana; English; Kalanga"],
    ["Burkina Faso", "Mossi; Fulani; Gurunsi; Bobo; Gurma; Senufo; Lobi; Bissa; Dioula; Samo", "French; Mooré; Dioula; Fulfulde; Gourmanché"],
    ["Burundi", "Barundi", "Kirundi; French; English; Swahili"],
    ["Cabo Verde", "Cape Verdean (Badiu); Cape Verdean (Sampadjudu)", "Portuguese; Cape Verdean Creole (Kabuverdianu)"],
    ["Cameroon", "Bamileke; Beti; Fang; Bulu; Duala; Fulani; Bassa; Bamum; Tikar; Kirdi; Nso; Kom", "French; English; Cameroonian Pidgin; Camfranglais; Fulfulde; Ewondo; Duala; Bassa; Ghomala'"],
    ["Central African Republic", "Gbaya; Banda; Mandja; Sara; Mbum; Ngbaka; Yakoma; Zande", "Sango; French"],
    ["Chad", "Sara; Chadian Arab; Kanembu; Zaghawa; Hadjarai; Maba; Toubou; Gorane", "Chadian Arabic; French; Sara; Kanembu"],
    ["Comoros", "Comorian (Wangazidja); Comorian (Wamwali); Comorian (Wanzuani)", "Comorian (Shikomori); Arabic; French"],
    ["Congo (Republic)", "Kongo; Teke; Mbochi; Sangha; Vili; Lari", "French; Lingala; Kituba (Munukutuba); Lari"],
    ["Congo (DRC)", "Luba; Kongo; Mongo; Lunda; Tetela; Nande; Ngbandi; Zande; Shi; Lega", "French; Lingala; Swahili; Kikongo; Tshiluba"],
    ["Côte d'Ivoire", "Baoulé; Agni; Bété; Senufo; Malinké; Dioula; Dan (Yacouba); Gouro; Attié; Abbey; Lobi", "French; Dioula; Baoulé; Bété; Senufo; Nouchi"],
    ["Djibouti", "Somali (Issa); Afar; Arab", "French; Arabic; Somali; Afar"],
    ["Egypt", "Egyptian; Nubian; Bedouin; Copt; Siwi (Amazigh)", "Egyptian Arabic; English; Nubian; Siwi"],
    ["Equatorial Guinea", "Fang; Bubi; Ndowe; Annobonese; Bujeba", "Spanish; French; Portuguese; Fang; Bube"],
    ["Eritrea", "Tigrinya; Tigre; Saho; Afar; Bilen; Kunama; Nara; Rashaida; Hedareb", "Tigrinya; Tigre; Arabic; English"],
    ["Eswatini", "Swazi", "siSwati; English"],
    ["Ethiopia", "Oromo; Amhara; Somali; Tigrayan; Sidama; Gurage; Welayta; Afar; Hadiya; Gamo; Gedeo; Silte", "Amharic; Afaan Oromo; Tigrinya; Somali; Sidaamu Afoo; Afar; Wolaytta; Gurage"],
    ["Gabon", "Fang; Punu; Nzebi; Myene; Kota; Teke; Bapounou", "French; Fang; Punu; Nzebi; Myene"],
    ["Gambia", "Mandinka; Fula; Wolof; Jola; Serahule (Soninke); Serer; Manjago", "English; Mandinka; Wolof; Fula; Jola"],
    ["Ghana", "Akan (Asante); Akan (Fante); Akan (Akuapem); Akan (other); Ewe; Ga; Dangme; Dagomba; Mamprusi; Gonja; Nzema; Frafra; Dagaaba; Kusasi", "English; Twi; Fante; Ewe; Ga; Dagbani; Dangme; Hausa; Nzema; Ghanaian Pidgin"],
    ["Guinea", "Fula (Peul); Malinké (Maninka); Susu; Kissi; Kpelle (Guerzé); Toma", "French; Pular; Maninka; Susu"],
    ["Guinea-Bissau", "Balanta; Fula; Mandinka; Manjaco; Papel; Bijagó; Mancanha", "Portuguese; Guinea-Bissau Creole (Kriol); Balanta; Pular"],
    ["Kenya", "Kikuyu; Luhya; Kalenjin; Luo; Kamba; Somali; Kisii (Abagusii); Mijikenda; Meru; Maasai; Turkana; Embu; Taita; Samburu; Pokot; Swahili", "Swahili; English; Sheng; Gikuyu; Dholuo; Luhya; Kalenjin; Kamba; Ekegusii; Kimeru; Maa"],
    ["Lesotho", "Basotho", "Sesotho; English"],
    ["Liberia", "Kpelle; Bassa; Grebo; Gio (Dan); Mano; Kru; Lorma; Kissi; Gola; Vai; Mandingo; Americo-Liberian", "English; Liberian English (Kolokwa); Kpelle; Bassa; Vai"],
    ["Libya", "Arab; Amazigh; Tuareg; Toubou", "Libyan Arabic; Tamazight"],
    ["Madagascar", "Merina; Betsimisaraka; Betsileo; Tsimihety; Sakalava; Antandroy; Antaisaka; Antanosy", "Malagasy; French"],
    ["Malawi", "Chewa; Lomwe; Yao; Ngoni; Tumbuka; Sena; Tonga; Nyanja; Ngonde", "Chichewa; English; Chiyao; Chitumbuka; Lomwe; Sena"],
    ["Mali", "Bambara; Fula (Peul); Soninke; Senufo; Dogon; Malinké; Songhai; Tuareg; Bobo; Bozo; Minianka", "Bambara; French; Fulfulde; Songhay; Soninke; Tamasheq; Dogon"],
    ["Mauritania", "Bidhan (Moor); Haratin; Halpulaar (Fula); Soninke; Wolof", "Hassaniya Arabic; French; Pulaar; Soninke; Wolof"],
    ["Mauritius", "Indo-Mauritian; Creole; Sino-Mauritian; Franco-Mauritian", "Mauritian Creole (Kreol); English; French; Bhojpuri"],
    ["Morocco", "Arab; Amazigh (Riffian); Amazigh (Shilha); Amazigh (Central Atlas); Sahrawi; Gnawa", "Moroccan Arabic (Darija); Tamazight; Tashelhit; Tarifit; French; Hassaniya"],
    ["Mozambique", "Makhuwa; Tsonga (Changana); Lomwe; Sena; Ndau; Chopi; Makonde; Yao; Chuwabu", "Portuguese; Emakhuwa; Xichangana; Elomwe; Cisena; Echuwabo"],
    ["Namibia", "Ovambo; Kavango; Herero; Himba; Damara; Nama; Lozi; Tswana; San; Afrikaner; Baster", "English; Oshiwambo; Afrikaans; Otjiherero; Khoekhoegowab; Rukwangali; Silozi"],
    ["Niger", "Hausa; Zarma-Songhai; Tuareg; Fula; Kanuri; Toubou; Arab; Gourmantché", "French; Hausa; Zarma; Tamasheq; Fulfulde; Kanuri"],
    ["Nigeria", "Yoruba; Hausa; Igbo; Fulani; Ijaw; Kanuri; Ibibio; Tiv; Edo (Bini); Nupe; Urhobo; Igala; Idoma; Efik; Annang; Isoko; Itsekiri; Ebira; Gbagyi; Berom; Esan", "English; Nigerian Pidgin; Yoruba; Hausa; Igbo; Fulfulde; Kanuri; Ijaw; Ibibio; Tiv; Edo; Efik; Urhobo; Nupe; Igala; Idoma"],
    ["Rwanda", "Banyarwanda", "Kinyarwanda; English; French; Swahili"],
    ["São Tomé and Príncipe", "Forro; Angolar; Tonga; Mestiço", "Portuguese; Forro (Santome); Angolar; Principense"],
    ["Senegal", "Wolof; Pulaar (Fula / Toucouleur); Serer; Jola; Mandinka; Soninke; Lebou; Bassari", "French; Wolof; Pulaar; Serer; Jola; Mandinka"],
    ["Seychelles", "Seychellois Creole", "Seychellois Creole; English; French"],
    ["Sierra Leone", "Temne; Mende; Limba; Kono; Krio; Fula; Kuranko; Sherbro; Susu; Loko", "English; Krio; Temne; Mende; Limba"],
    ["Somalia", "Somali; Somali Bantu; Benadiri; Bajuni", "Somali; Maay Maay; Arabic"],
    ["South Africa", "Zulu; Xhosa; Pedi (Northern Sotho); Tswana; Sotho; Tsonga; Swazi; Venda; Ndebele; Afrikaner; Coloured; Indian South African; Cape Malay; English-speaking", "isiZulu; isiXhosa; Afrikaans; English; Sepedi; Setswana; Sesotho; Xitsonga; siSwati; Tshivenda; isiNdebele"],
    ["South Sudan", "Dinka (Jieng); Nuer (Naath); Shilluk (Chollo); Zande; Bari; Murle; Acholi; Toposa; Lotuko; Moru", "English; Juba Arabic; Dinka; Nuer; Bari; Zande"],
    ["Sudan", "Sudanese Arab; Nubian; Beja; Fur; Nuba; Zaghawa; Masalit; Fallata", "Sudanese Arabic; English; Bedawi (Beja); Nobiin; Fur"],
    ["Tanzania", "Sukuma; Nyamwezi; Chagga; Haya; Hehe; Gogo; Makonde; Maasai; Nyakyusa; Zaramo; Swahili; Zanzibari; Iraqw", "Swahili; English; Sukuma; Chagga; Haya; Maa"],
    ["Togo", "Ewe; Kabye; Tem (Kotokoli); Mina; Moba; Gurma; Lamba", "French; Ewe; Kabiyè; Mina (Gen)"],
    ["Tunisia", "Arab; Amazigh", "Tunisian Arabic (Derja); French; Tamazight"],
    ["Uganda", "Baganda; Banyankole; Basoga; Bakiga; Iteso; Langi; Acholi; Bagisu; Lugbara; Banyoro; Batooro; Alur; Karamojong; Madi", "English; Luganda; Swahili; Runyankole-Rukiga; Lusoga; Acholi; Ateso; Lugbara; Lumasaba"],
    ["Western Sahara", "Sahrawi", "Hassaniya Arabic; Spanish"],
    ["Zambia", "Bemba; Tonga; Chewa; Lozi; Nsenga; Tumbuka; Ngoni; Lunda; Kaonde; Luvale; Lala; Namwanga", "English; Bemba; Nyanja; Tonga; Lozi; Kaonde; Lunda; Luvale"],
    ["Zimbabwe", "Shona (Zezuru); Shona (Karanga); Shona (Manyika); Shona (Korekore); Ndau; Ndebele; Tonga; Kalanga; Venda; Shangaan (Tsonga); Nambya", "English; Shona; isiNdebele; Tonga; Kalanga; Venda; Shangani"]
  ];

  const split = (s) => s.split(";").map((x) => x.trim()).filter(Boolean);
  const COUNTRIES = C.map(([name, eth, lang]) => ({ name, ethnic: split(eth), languages: split(lang) }));

  // Widely spoken languages offered regardless of country.
  const COMMON_LANGUAGES = ["English", "French", "Arabic", "Portuguese", "Swahili", "Hausa", "Yoruba", "Igbo", "Amharic", "Afaan Oromo", "Somali", "Lingala", "isiZulu", "Wolof", "Fulfulde / Pulaar", "Spanish"];

  /*
   * Themes. `prompt` is a memory-jogger question shown to participants.
   * It deliberately asks about a domain WITHOUT giving an example taboo,
   * so we do not prime specific answers.
   * `kw` are lowercase stems used to auto-suggest themes from the text
   * (English, French, and a few common Pidgin / loan words).
   */
  const THEMES = [
    { id: "food", en: "Food & eating", fr: "Nourriture & repas",
      pen: "Are there foods you must never eat, or ways you must not eat or serve food?",
      pfr: "Y a-t-il des aliments interdits, ou des façons de manger ou de servir à éviter ?",
      kw: ["eat", "food", "meal", "cook", "meat", "fish", "egg", "drink", "pork", "snail", "soup", "plate", "chew", "fruit", "salt", "pepper", "kola", "chop", "manger", "nourriture", "repas", "viande", "poisson", "œuf", "oeuf", "boire", "cuisin", "sel"] },
    { id: "respect", en: "Greetings, respect & elders", fr: "Salutations, respect & aînés",
      pen: "How must you greet or address elders and people of rank? What counts as disrespect?",
      pfr: "Comment faut-il saluer les aînés ou les personnes de rang ? Qu'est-ce qui est irrespectueux ?",
      kw: ["greet", "elder", "older", "respect", "bow", "kneel", "prostrat", "address", "chief", "king", "senior", "rude", "disrespect", "saluer", "salut", "aîné", "aine", "ancien", "respect", "chef", "roi", "à genoux", "genou"] },
    { id: "gesture", en: "Hands, gestures & body language", fr: "Mains, gestes & attitude",
      pen: "Which hand, gesture, posture, or kind of eye contact is unacceptable, and when?",
      pfr: "Quelle main, quel geste, quelle posture ou quel regard sont inacceptables, et quand ?",
      kw: ["left hand", "right hand", "hand", "point", "finger", "gesture", "eye contact", "look someone", "stare", "sit", "cross", "leg", "whistle", "step over", "jump over", "main gauche", "main", "doigt", "geste", "regard", "siffl", "enjamb", "jambe", "assis"] },
    { id: "pregnancy", en: "Pregnancy & childbirth", fr: "Grossesse & naissance",
      pen: "What must a pregnant woman, new mother, or the people around them avoid?",
      pfr: "Qu'est-ce qu'une femme enceinte, une jeune mère ou leur entourage doit éviter ?",
      kw: ["pregnan", "birth", "baby", "babies", "newborn", "labour", "labor", "womb", "placenta", "umbilical", "nursing", "breastfe", "deliver", "enceinte", "grossesse", "naissance", "bébé", "bebe", "accouch", "nouveau-né", "allait"] },
    { id: "death", en: "Death, burial & mourning", fr: "Mort, funérailles & deuil",
      pen: "What must not be done around a death, a funeral, a grave, or during mourning?",
      pfr: "Que ne faut-il pas faire lors d'un décès, de funérailles, près d'une tombe ou pendant le deuil ?",
      kw: ["death", "die", "dead", "dying", "funeral", "burial", "bury", "grave", "corpse", "mourn", "widow", "cemetery", "coffin", "late ", "mort", "décè", "dece", "funéra", "funera", "enterr", "deuil", "veuv", "tombe", "cimeti", "cercueil", "défunt"] },
    { id: "marriage", en: "Marriage, courtship & in-laws", fr: "Mariage, fréquentation & belle-famille",
      pen: "What is forbidden in courtship, at weddings, between spouses, or with in-laws?",
      pfr: "Qu'est-ce qui est interdit dans les fréquentations, au mariage, entre époux ou avec la belle-famille ?",
      kw: ["marr", "wedding", "bride", "groom", "dowry", "bride price", "in-law", "in law", "husband", "wife", "wives", "spouse", "courtship", "suitor", "engag", "polygam", "mariage", "marié", "marie", "dot", "belle-mère", "beau-père", "belle-famille", "époux", "epoux", "épouse", "fiancé"] },
    { id: "gender", en: "Gender roles", fr: "Rôles de genre",
      pen: "Are there things only men, or only women, are not allowed to do, see, or touch?",
      pfr: "Y a-t-il des choses que seuls les hommes, ou seules les femmes, n'ont pas le droit de faire, voir ou toucher ?",
      kw: ["woman", "women", " man ", " men ", "girl", "boy", "female", "male", "lady", "ladies", "femme", "homme", "fille", "garçon", "garcon"] },
    { id: "body", en: "Body, sexuality & menstruation", fr: "Corps, sexualité & menstruation",
      pen: "What rules surround the body, hair, nails, nakedness, menstruation, or sexuality?",
      pfr: "Quelles règles entourent le corps, les cheveux, les ongles, la nudité, les règles ou la sexualité ?",
      kw: ["menstrua", "period", "sex", "naked", "nude", "body", "hair", "nail", "virgin", "shave", "bath", "urinat", "règles", "regles", "nu ", "nue", "corps", "cheveu", "ongle", "vierge", "sexe", "rasé"] },
    { id: "dress", en: "Clothing & appearance", fr: "Vêtements & apparence",
      pen: "What clothing, colours, hairstyles, or ways of dressing are not allowed, and for whom?",
      pfr: "Quels vêtements, couleurs ou coiffures ne sont pas permis, et pour qui ?",
      kw: ["wear", "dress", "cloth", "trouser", "skirt", "head tie", "headscarf", "hat", "cap", "shoe", "sandal", "colour", "color", "red", "white", "black", "tattoo", "jewel", "porter", "vêtement", "vetement", "pagne", "chapeau", "foulard", "couleur", "rouge", "blanc", "noir", "chaussure"] },
    { id: "spirit", en: "Spirits, ancestors & the sacred", fr: "Esprits, ancêtres & sacré",
      pen: "What must not be done at shrines, sacred places, masquerades, or towards ancestors and spirits?",
      pfr: "Que ne faut-il pas faire aux sanctuaires, lieux sacrés, mascarades, ou envers les ancêtres et les esprits ?",
      kw: ["spirit", "ancestor", "deity", "gods", "shrine", "sacred", "holy", "forest", "witch", "curse", "juju", "oracle", "masquerade", "mask", "egungun", "orisa", "òrìṣà", "priest", "ritual", "sacrifice", "libation", "ancêtre", "ancetre", "esprit", "sacré", "sacre", "fétiche", "fetiche", "sorc", "masque", "génie", "vodun", "vaudou"] },
    { id: "religion", en: "Religious practice", fr: "Pratique religieuse",
      pen: "What does your religious community forbid that outsiders might not expect?",
      pfr: "Qu'est-ce que votre communauté religieuse interdit et qu'un étranger ne devinerait pas ?",
      kw: ["church", "mosque", "pray", "prayer", "fast", "ramadan", "sunday", "friday", "sabbath", "bible", "quran", "qur'an", "koran", "halal", "haram", "pastor", "imam", "église", "eglise", "mosquée", "mosquee", "prière", "priere", "jeûne", "jeune", "carême", "dimanche", "vendredi", "coran"] },
    { id: "nature", en: "Animals, plants & nature", fr: "Animaux, plantes & nature",
      pen: "Are there animals, trees, rivers, or places in nature you must not harm, eat, name, or approach?",
      pfr: "Y a-t-il des animaux, arbres, rivières ou lieux naturels qu'il ne faut pas blesser, manger, nommer ou approcher ?",
      kw: ["animal", "snake", "python", "owl", "cat", "dog", "totem", "tree", "river", "lake", "sea", "bird", "tortoise", "monkey", "lion", "leopard", "crocodile", "hunt", "kill", "rain", "rainbow", "serpent", "hibou", "chat", "chien", "arbre", "rivière", "riviere", "fleuve", "oiseau", "tortue", "singe", "chass", "pluie"] },
    { id: "time", en: "Time, night & special days", fr: "Temps, nuit & jours particuliers",
      pen: "What must not be done at night, at certain hours, on certain days, or during certain seasons?",
      pfr: "Que ne faut-il pas faire la nuit, à certaines heures, certains jours ou certaines saisons ?",
      kw: ["night", "dark", "evening", "sunset", "dusk", "midnight", "noon", "market day", "week", "moon", "season", "new year", "nuit", "soir", "crépuscule", "midi", "minuit", "jour de marché", "lune", "saison"] },
    { id: "speech", en: "Words, names & speech", fr: "Mots, noms & parole",
      pen: "Are there words, names, numbers, or topics you must never say aloud, or people you must not call by name?",
      pfr: "Y a-t-il des mots, noms, nombres ou sujets à ne jamais prononcer, ou des personnes qu'on n'appelle pas par leur nom ?",
      kw: ["say", "word", "name", "mention", "call", "speak", "swear", "insult", "count", "talk", "pronounc", "curse word", "dire", "mot", "nom", "parler", "prononc", "appeler", "insult", "compter"] },
    { id: "home", en: "Home & household", fr: "Maison & foyer",
      pen: "What must not be done inside the house, with household objects, or at certain spots like the door or kitchen?",
      pfr: "Que ne faut-il pas faire dans la maison, avec les objets du foyer, ou à certains endroits comme la porte ou la cuisine ?",
      kw: ["house", "home", "sweep", "broom", "kitchen", "door", "threshold", "roof", "bed", "mortar", "pestle", "pot", "fire", "hearth", "compound", "mirror", "umbrella", "maison", "balai", "balay", "cuisine", "porte", "seuil", "lit", "mortier", "pilon", "marmite", "feu", "miroir", "parapluie"] },
    { id: "hospitality", en: "Hospitality, guests & gifts", fr: "Hospitalité, invités & cadeaux",
      pen: "What must hosts or guests never do? Are there gifts or offers you must not refuse or give?",
      pfr: "Que ne doivent jamais faire les hôtes ou les invités ? Y a-t-il des cadeaux à ne pas refuser ou offrir ?",
      kw: ["guest", "visitor", "visit", "host", "gift", "offer", "refuse", "give", "receive", "money", "stranger", "invité", "invite", "visiteur", "hôte", "cadeau", "offrir", "refus", "donner", "recevoir", "argent", "étranger"] },
    { id: "family", en: "Family & kinship", fr: "Famille & parenté",
      pen: "What is forbidden between parents and children, siblings, twins, clan members, or relatives?",
      pfr: "Qu'est-ce qui est interdit entre parents et enfants, frères et sœurs, jumeaux, membres du clan ou proches ?",
      kw: ["father", "mother", "parent", "child", "children", "son", "daughter", "sibling", "brother", "sister", "twin", "uncle", "aunt", "grandparent", "grandmother", "grandfather", "clan", "family", "lineage", "père", "pere", "mère", "mere", "enfant", "fils", "frère", "soeur", "sœur", "jumeau", "jumelle", "oncle", "tante", "famille", "clan"] },
    { id: "health", en: "Health & illness", fr: "Santé & maladie",
      pen: "What must sick people, healers, or those caring for them avoid?",
      pfr: "Que doivent éviter les malades, les guérisseurs ou ceux qui les soignent ?",
      kw: ["sick", "ill", "disease", "medicine", "heal", "healer", "herb", "blood", "wound", "hospital", "fever", "epilep", "malade", "maladie", "médicament", "medicament", "guéri", "gueri", "sang", "blessure", "hôpital"] },
    { id: "ceremony", en: "Festivals, rites & ceremonies", fr: "Fêtes, rites & cérémonies",
      pen: "What is forbidden during festivals, initiations, naming ceremonies, or other rites of passage?",
      pfr: "Qu'est-ce qui est interdit pendant les fêtes, initiations, baptêmes traditionnels ou autres rites de passage ?",
      kw: ["festival", "ceremony", "initiation", "rite", "naming", "circumcis", "coronation", "installation", "harvest festival", "fête", "fete", "cérémonie", "ceremonie", "initiation", "baptême", "circonci", "rite"] },
    { id: "work", en: "Work, farming & livelihood", fr: "Travail, agriculture & métiers",
      pen: "Are there rules about farming, fishing, hunting, trading, or crafts that must never be broken?",
      pfr: "Y a-t-il des règles sur l'agriculture, la pêche, la chasse, le commerce ou l'artisanat à ne jamais enfreindre ?",
      kw: ["farm", "harvest", "plant", "crop", "yam", "fishing", "fisherm", "hunting", "hunter", "trade", "market", "sell", "buy", "work", "blacksmith", "travail", "champ", "récolte", "recolte", "igname", "pêche", "peche", "chasseur", "marché", "marche", "vendre", "acheter"] },
    { id: "other", en: "Something else", fr: "Autre chose", pen: "", pfr: "", kw: [] }
  ];

  const RELIGIONS = [
    { id: "christian_catholic", en: "Christianity: Catholic", fr: "Christianisme : catholique" },
    { id: "christian_protestant", en: "Christianity: Protestant (Anglican, Methodist, Baptist…)", fr: "Christianisme : protestant (anglican, méthodiste, baptiste…)" },
    { id: "christian_pentecostal", en: "Christianity: Pentecostal / Evangelical", fr: "Christianisme : pentecôtiste / évangélique" },
    { id: "christian_orthodox", en: "Christianity: Orthodox (Ethiopian, Coptic, Eritrean…)", fr: "Christianisme : orthodoxe (éthiopien, copte, érythréen…)" },
    { id: "christian_aic", en: "Christianity: African Initiated Church (Aladura, ZCC, Kimbanguist…)", fr: "Christianisme : Église d'initiative africaine (Aladura, ZCC, kimbanguiste…)" },
    { id: "christian_other", en: "Christianity: other / non-denominational", fr: "Christianisme : autre / non dénominationnel" },
    { id: "islam_sunni", en: "Islam: Sunni", fr: "Islam : sunnite" },
    { id: "islam_sufi", en: "Islam: Sufi order (Tijaniyya, Mouride, Qadiriyya…)", fr: "Islam : confrérie soufie (Tidjaniyya, mouride, Qadiriyya…)" },
    { id: "islam_shia", en: "Islam: Shia", fr: "Islam : chiite" },
    { id: "islam_ahmadiyya", en: "Islam: Ahmadiyya", fr: "Islam : Ahmadiyya" },
    { id: "islam_other", en: "Islam: other / unspecified", fr: "Islam : autre / non précisé" },
    { id: "atr", en: "African Traditional Religion (e.g. Ifá/Òrìṣà, Vodun, Odinani, ancestral religion)", fr: "Religion traditionnelle africaine (Ifá/Òrìṣà, Vodun, culte des ancêtres…)" },
    { id: "judaism", en: "Judaism", fr: "Judaïsme" },
    { id: "hinduism", en: "Hinduism", fr: "Hindouisme" },
    { id: "bahai", en: "Bahá'í", fr: "Bahá'í" },
    { id: "spiritual", en: "Spiritual, not religious", fr: "Spirituel·le, sans religion" },
    { id: "none", en: "No religion", fr: "Sans religion" },
    { id: "other", en: "Other", fr: "Autre" },
    { id: "prefer_not", en: "Prefer not to say", fr: "Je préfère ne pas répondre" }
  ];

  // Arabic: [label, memory-jogger prompt, keywords]. Keywords are written without
  // diacritics and with plain alef (ا); app.js normalises typed text the same way.
  const THEMES_AR = {
    food: ["الطعام والأكل", "هل هناك أطعمة لا يجوز أكلها أبدًا، أو طرق في الأكل أو تقديم الطعام يجب تجنبها؟", ["اكل", "ياكل", "طعام", "وجب", "طبخ", "لحم", "سمك", "بيض", "شرب", "خنزير", "حلزون", "حساء", "شوربه", "صحن", "فاكه", "ملح", "فلفل"]],
    respect: ["التحية والاحترام وكبار السن", "كيف يجب أن تحيّي كبار السن وذوي المكانة أو تخاطبهم؟ وما الذي يُعدّ قلة احترام؟", ["تحي", "سلام", "كبير", "كبار", "مسن", "احترام", "انحن", "ركوع", "يركع", "شيخ", "زعيم", "ملك", "وقاح", "قله ادب", "عيب"]],
    gesture: ["اليدان والإيماءات ولغة الجسد", "أي يد أو إيماءة أو جلسة أو نظرة غير مقبولة، ومتى؟", ["اليد اليسرى", "اليسرى", "يد", "اشار", "اصبع", "ايماء", "نظر", "تحديق", "جلس", "رجل", "ساق", "صفير", "يصفر", "تخطي", "يتخطى"]],
    pregnancy: ["الحمل والولادة", "ما الذي يجب أن تتجنبه المرأة الحامل أو الأم حديثة الولادة أو من حولهما؟", ["حامل", "حمل", "ولاد", "مولود", "رضيع", "طفل", "رحم", "مشيم", "سر", "رضاع", "نفاس", "وضع"]],
    death: ["الموت والدفن والحداد", "ما الذي لا يجوز فعله عند الوفاة أو الجنازة أو عند القبر أو أثناء الحداد؟", ["موت", "ميت", "متوفى", "وفاه", "جناز", "دفن", "قبر", "مقبر", "جثه", "جثمان", "حداد", "عزاء", "ارمل", "كفن", "نعش"]],
    marriage: ["الزواج والخطوبة والأصهار", "ما المحظور في الخطوبة أو الأعراس أو بين الزوجين أو مع الأصهار؟", ["زواج", "زوج", "عرس", "عروس", "عريس", "مهر", "صهر", "اصهار", "حماه", "حمو", "خطوب", "خطيب", "تعدد"]],
    gender: ["أدوار الجنسين", "هل هناك أمور لا يُسمح للرجال وحدهم أو للنساء وحدهن بفعلها أو رؤيتها أو لمسها؟", ["امراه", "المراه", "نساء", "رجل", "رجال", "فتاه", "بنت", "فتى", "ولد", "انثى", "ذكر"]],
    body: ["الجسد والجنس والحيض", "ما القواعد المتعلقة بالجسد أو الشعر أو الأظافر أو العري أو الحيض أو الجنس؟", ["حيض", "دوره شهري", "جنس", "عري", "عار", "جسد", "جسم", "شعر", "اظافر", "ظفر", "عذري", "حلاق", "استحمام", "غسل"]],
    dress: ["الملابس والمظهر", "ما الملابس أو الألوان أو تسريحات الشعر غير المسموح بها، ولمن؟", ["لبس", "يلبس", "ملابس", "ثوب", "سروال", "تنوره", "حجاب", "خمار", "قبعه", "حذاء", "نعال", "لون", "احمر", "ابيض", "اسود", "وشم", "حلي"]],
    spirit: ["الأرواح والأجداد والمقدّس", "ما الذي لا يجوز فعله في الأضرحة أو الأماكن المقدسة أو الاحتفالات بالأقنعة أو تجاه الأجداد والأرواح؟", ["روح", "ارواح", "جن", "اجداد", "سلف", "ضريح", "مقدس", "مزار", "ولي", "سحر", "ساحر", "لعن", "قناع", "طقس", "قربان", "ذبيح"]],
    religion: ["الممارسة الدينية", "ما الذي يحرّمه مجتمعك الديني مما قد لا يتوقعه الغرباء؟", ["كنيس", "مسجد", "صلا", "يصلي", "صوم", "صيام", "رمضان", "الاحد", "الجمعه", "انجيل", "قران", "حلال", "حرام", "امام", "قسيس", "كاهن"]],
    nature: ["الحيوانات والنباتات والطبيعة", "هل هناك حيوانات أو أشجار أو أنهار أو أماكن في الطبيعة لا يجوز إيذاؤها أو أكلها أو تسميتها أو الاقتراب منها؟", ["حيوان", "ثعبان", "افعى", "بوم", "قط", "كلب", "شجر", "نهر", "بحير", "بحر", "طائر", "طير", "سلحفا", "قرد", "اسد", "نمر", "تمساح", "صيد", "قتل", "مطر"]],
    time: ["الوقت والليل والأيام الخاصة", "ما الذي لا يجوز فعله ليلًا أو في ساعات أو أيام أو مواسم معينة؟", ["ليل", "ليلا", "ظلام", "مساء", "غروب", "منتصف الليل", "ظهر", "يوم السوق", "اسبوع", "قمر", "موسم", "راس السنه"]],
    speech: ["الكلمات والأسماء والكلام", "هل هناك كلمات أو أسماء أو أرقام أو موضوعات لا يجوز قولها بصوت عالٍ، أو أشخاص لا يجوز مناداتهم بأسمائهم؟", ["قول", "يقول", "كلم", "اسم", "ذكر", "نادى", "ينادي", "تكلم", "شتم", "سب", "عد", "نطق"]],
    home: ["البيت والأسرة المنزلية", "ما الذي لا يجوز فعله داخل البيت أو بأدوات المنزل أو في أماكن معينة كالباب أو المطبخ؟", ["بيت", "منزل", "دار", "كنس", "مكنس", "مطبخ", "باب", "عتب", "سقف", "سرير", "هاون", "مدق", "قدر", "نار", "موقد", "مراه", "مظل"]],
    hospitality: ["الضيافة والضيوف والهدايا", "ما الذي لا يجوز للمضيف أو الضيف فعله أبدًا؟ وهل هناك هدايا أو عروض لا يجوز رفضها أو تقديمها؟", ["ضيف", "ضيوف", "زائر", "زيار", "مضيف", "هدي", "عرض", "رفض", "اعطاء", "يعطي", "استلام", "مال", "نقود", "غريب"]],
    family: ["العائلة والقرابة", "ما المحظور بين الآباء والأبناء أو الإخوة أو التوائم أو أبناء العشيرة أو الأقارب؟", ["اب", "ام", "والد", "ابن", "ابناء", "بنت", "اخ", "اخت", "توام", "عم", "خال", "جد", "جده", "عشير", "قبيل", "عائل", "اسر", "نسب"]],
    health: ["الصحة والمرض", "ما الذي يجب أن يتجنبه المرضى أو المعالجون أو من يعتنون بهم؟", ["مرض", "مريض", "دواء", "علاج", "معالج", "عشب", "اعشاب", "دم", "جرح", "مستشفى", "حمى", "صرع"]],
    ceremony: ["الأعياد والطقوس والاحتفالات", "ما المحظور أثناء الأعياد أو طقوس التلقين أو حفلات التسمية أو طقوس العبور الأخرى؟", ["عيد", "احتفال", "حفل", "طقوس", "تسميه", "سبوع", "عقيقه", "ختان", "تتويج", "حصاد", "مهرجان"]],
    work: ["العمل والزراعة وكسب الرزق", "هل هناك قواعد في الزراعة أو صيد السمك أو الصيد أو التجارة أو الحرف لا يجوز خرقها أبدًا؟", ["زراع", "مزرع", "حصاد", "غرس", "محصول", "صياد", "صيد السمك", "تجار", "سوق", "بيع", "شراء", "عمل", "حداد", "حرف"]],
    other: ["شيء آخر", "", []]
  };
  THEMES.forEach((th) => {
    const a = THEMES_AR[th.id];
    if (a) { th.ar = a[0]; th.par = a[1]; th.kw = th.kw.concat(a[2]); }
  });

  const RELIGIONS_AR = {
    christian_catholic: "المسيحية: كاثوليك",
    christian_protestant: "المسيحية: بروتستانت (أنجليكان، ميثوديون، معمدانيون…)",
    christian_pentecostal: "المسيحية: خمسينيون / إنجيليون",
    christian_orthodox: "المسيحية: أرثوذكس (إثيوبيون، أقباط، إريتريون…)",
    christian_aic: "المسيحية: كنيسة أفريقية مستقلة (ألادورا، ZCC، كيمبانغية…)",
    christian_other: "المسيحية: أخرى / غير طائفية",
    islam_sunni: "الإسلام: سنّة",
    islam_sufi: "الإسلام: طريقة صوفية (التيجانية، المريدية، القادرية…)",
    islam_shia: "الإسلام: شيعة",
    islam_ahmadiyya: "الإسلام: الأحمدية",
    islam_other: "الإسلام: آخر / غير محدد",
    atr: "الديانة الأفريقية التقليدية (مثل إيفا/الأوريشا، الفودون، عبادة الأسلاف)",
    judaism: "اليهودية",
    hinduism: "الهندوسية",
    bahai: "البهائية",
    spiritual: "روحاني، بلا دين محدد",
    none: "بلا دين",
    other: "آخر",
    prefer_not: "أفضّل عدم الإجابة"
  };
  RELIGIONS.forEach((r) => { if (RELIGIONS_AR[r.id]) r.ar = RELIGIONS_AR[r.id]; });

  window.AFRITABOO_DATA = { COUNTRIES, COMMON_LANGUAGES, THEMES, RELIGIONS };
})();
