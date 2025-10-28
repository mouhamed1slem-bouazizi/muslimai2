export type IslamicStory = {
  id: string;
  title_en: string;
  title_ar: string;
  content_en: string;
  content_ar: string;
  source: { citation: string; url?: string };
};

// Curated, concise stories from well-known historical sources.
// These texts are educational summaries intended for general audiences.
export const ISLAMIC_STORIES: IslamicStory[] = [
  {
    id: 'hijrah',
    title_en: 'The Hijrah: Migration to Medina (622 CE)',
    title_ar: 'الهجرة إلى المدينة (622م)',
    content_en:
      'Under persecution in Makkah, the Prophet Muhammad ﷺ and his companions migrated to Yathrib (Medina). The community established there laid the foundation for Muslim communal life and ethics. The Hijrah marks the beginning of the Hijri calendar and symbolizes trust in God, planning, and perseverance.',
    content_ar:
      'تحت الاضطهاد في مكة، هاجر النبي محمد ﷺ وصحبه إلى يثرب (المدينة). المجتمع الذي تأسس هناك وضع أساس الحياة والأخلاق الإسلامية. تُعد الهجرة بداية التقويم الهجري وترمز إلى الثقة بالله وحسن التخطيط والصبر.',
    source: {
      citation: 'Sīrah: Ibn Hishām; Al-Bukhārī, Hadith references to migration events',
      url: 'https://en.wikipedia.org/wiki/Hijrah'
    }
  },
  {
    id: 'badr',
    title_en: 'The Battle of Badr (624 CE)',
    title_ar: 'غزوة بدر (624م)',
    content_en:
      'A pivotal early battle where a small Muslim force triumphed despite being outnumbered. Badr strengthened the faith of believers and is referenced in the Qur’an (3:123). It is remembered for courage, discipline, and reliance upon God.',
    content_ar:
      'معركة مفصلية انتصر فيها المسلمون رغم قلة العدد. عززت بدر إيمان المؤمنين وتُذكر في القرآن (آل عمران: 123). وتُخلّد للشجاعة والانضباط والاعتماد على الله.',
    source: {
      citation: 'Qur’an 3:123; Sīrah literature',
      url: 'https://en.wikipedia.org/wiki/Battle_of_Badr'
    }
  },
  {
    id: 'hudaybiyyah',
    title_en: 'Treaty of Hudaybiyyah (628 CE)',
    title_ar: 'صلح الحديبية (628م)',
    content_en:
      'A truce between the Muslims and Quraysh that, though seemingly unfavorable at first, brought significant peace and growth. The treaty demonstrated strategic patience, wisdom, and foresight in pursuing long-term benefit.',
    content_ar:
      'هدنة بين المسلمين وقريش بدت في ظاهرها غير مؤاتية، لكنها جلبت السلام والنمو. أظهر الصلح الصبر الاستراتيجي والحكمة وبعد النظر لتحقيق المصلحة البعيدة.',
    source: {
      citation: 'Sahih al-Bukhārī, Book of Conditions; Sīrah accounts',
      url: 'https://en.wikipedia.org/wiki/Treaty_of_Hudaybiyyah'
    }
  },
  {
    id: 'black-stone',
    title_en: 'The Black Stone Arbitration (pre-Prophethood)',
    title_ar: 'تحكيم الحجر الأسود (قبل البعثة)',
    content_en:
      'When tribes disputed who would place the Black Stone during Kaaba rebuilding, Muhammad ﷺ proposed putting the stone on a cloth and having leaders lift it together, then he positioned it. The wise solution prevented conflict and earned trust.',
    content_ar:
      'عندما اختلفت القبائل في وضع الحجر الأسود أثناء إعادة بناء الكعبة، اقترح محمد ﷺ وضع الحجر على ثوب ليرفعه زعماء القبائل معًا، ثم وضعه بيده. هذه الحكمة منعت النزاع وكسبت الثقة.',
    source: {
      citation: 'Sīrah: Ibn Ishāq/Ibn Hishām accounts',
      url: 'https://en.wikipedia.org/wiki/Black_Stone#Placement_in_the_Kaaba'
    }
  },
  {
    id: 'constitution-medina',
    title_en: 'The Constitution of Medina',
    title_ar: 'وثيقة المدينة',
    content_en:
      'An early charter defined rights and responsibilities among Muslim and Jewish communities in Medina, emphasizing justice, mutual protection, and freedom of religion. It established a cohesive civic framework for diverse residents.',
    content_ar:
      'وثيقة مبكرة حدّدت الحقوق والواجبات بين المسلمين واليهود في المدينة، مؤكدة العدالة والحماية المتبادلة وحرية الدين. أرست إطارًا مدنيًا متماسكًا لسكان متنوعين.',
    source: {
      citation: 'Sīrah sources; early Islamic historical records',
      url: 'https://en.wikipedia.org/wiki/Constitution_of_Medina'
    }
  },
  {
    id: 'farewell-sermon',
    title_en: 'The Farewell Sermon (632 CE)',
    title_ar: 'خطبة الوداع (632م)',
    content_en:
      'Delivered during the Farewell Pilgrimage, the Prophet ﷺ emphasized sanctity of life and property, equality of all people, rights of women, and adherence to Qur’an and Sunnah. It is a foundational ethical message for Muslims.',
    content_ar:
      'أُلقيت في حجة الوداع، وأكّد فيها النبي ﷺ على حرمة الدماء والأموال، ومساواة الناس، وحقوق المرأة، والتمسك بالقرآن والسنة. وهي رسالة أخلاقية تأسيسية للمسلمين.',
    source: {
      citation: 'Hadith collections; Sīrah narratives',
      url: 'https://en.wikipedia.org/wiki/Farewell_Sermon'
    }
  },
  {
    id: 'bilal',
    title_en: 'Bilal ibn Rabah: Steadfast Faith',
    title_ar: 'بلال بن رباح: ثبات الإيمان',
    content_en:
      'Bilal, a former slave, became one of the earliest Muslims and bore persecution with unshakable faith. Later appointed the first mu’adhin, his story teaches dignity, perseverance, and the honor of devotion.',
    content_ar:
      'كان بلال عبدًا سابقًا ومن أول المسلمين، وتحمل التعذيب بإيمان راسخ. عُيّن لاحقًا أول مؤذّن، وتُعلّم قصته الكرامة والصبر وشرف العبادة.',
    source: {
      citation: 'Sīrah biographies of Companions; early Islamic histories',
      url: 'https://en.wikipedia.org/wiki/Bilal_ibn_Rabah'
    }
  },
  {
    id: 'salahuddin',
    title_en: 'Salahuddin and Jerusalem (1187 CE)',
    title_ar: 'صلاح الدين والقدس (1187م)',
    content_en:
      'Salahuddin al-Ayyubi reclaimed Jerusalem after the Battle of Hattin, known for magnanimity and protection of civilians. His conduct is praised for chivalry and justice in medieval chronicles.',
    content_ar:
      'استعاد صلاح الدين الأيوبي القدس بعد معركة حطّين، واشتهر بالسماحة وحماية المدنيين. يُشاد بسلوكه للفروسية والعدالة في المصادر الوسيطة.',
    source: {
      citation: 'Medieval chronicles and modern histories',
      url: 'https://en.wikipedia.org/wiki/Siege_of_Jerusalem_(1187)'
    }
  },
  {
    id: 'umar-justice',
    title_en: 'Justice of Umar ibn al-Khattab',
    title_ar: 'عدالة عمر بن الخطاب',
    content_en:
      'As the second Caliph, Umar was noted for simplicity, accountability, and social welfare. His leadership emphasized equitable governance, consultation, and care for the needy, shaping public administration in the early caliphate.',
    content_ar:
      'كان عمر بن الخطاب ثاني الخلفاء الراشدين، واشتهر بالبساطة والمحاسبة والرعاية الاجتماعية. ركزت قيادته على الحكم العادل والشورى ورعاية المحتاجين، مما أثّر في الإدارة العامة المبكرة.',
    source: {
      citation: 'Early Islamic histories and biographies',
      url: 'https://en.wikipedia.org/wiki/Umar'
    }
  },
  {
    id: 'zakat-institution',
    title_en: 'Institution of Zakat',
    title_ar: 'تشريع الزكاة',
    content_en:
      'Zakat, a pillar of Islam, institutionalizes charity and social solidarity. Its organized collection and distribution supported the poor, travelers, and those in need, reinforcing ethical responsibility in society.',
    content_ar:
      'الزكاة ركن من أركان الإسلام تُنظّم العطاء والتكافل الاجتماعي. جمعها وتوزيعها المنظم دعم الفقراء وابن السبيل وذوي الحاجة، معززًا المسؤولية الأخلاقية في المجتمع.',
    source: {
      citation: 'Qur’an 9:60; legal traditions and early practice',
      url: 'https://en.wikipedia.org/wiki/Zakat'
    }
  }
];

export const STORY_IDS = ISLAMIC_STORIES.map(s => s.id);