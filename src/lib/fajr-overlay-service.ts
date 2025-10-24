import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { logger } from '@/lib/logger';

export interface FajrOverlayContent {
  en: string;
  ar: string;
  updatedAt?: Date;
}

const DEFAULT_CONTENT: FajrOverlayContent = {
  en: [
    'The primary and most emphasized voluntary prayer is the Sunnah of Fajr, also known as the Ratibah (confirmed sunnah) or the Raghībah of Fajr.',
    'Type: Two Rak\'ahs (cycles of prayer).',
    'Ruling: It is the most emphasized of all the confirmed sunnah prayers (Al-Sunan al-Rawātib). The Prophet (PBUH) never left them, whether traveling or resident.',
    'Time: They are performed after the true dawn appears (i.e., after the Fajr Adhan) and before the obligatory Fajr prayer is established (Iqamah).',
    'Virtue: The Prophet (PBUH) said: "The two Rak\'ahs before the Fajr prayer are better than the world and all that it contains." (Narrated by Muslim).',
    'Recommended Action: It is a Sunnah to make them short and light, and to recite Surah Al-Kafirun in the first Rak\'ah and Surah Al-Ikhlas in the second, or similar short surahs.',
    'Optional Action: It is also a Sunnah to lie down (Idtiba\') briefly on one\'s right side after performing these two Sunnah Rak\'ahs, provided they were prayed at home.'
  ].join('\n'),
  ar: [
    'النافلة الوحيدة المؤكدة قبل صلاة الفجر هي ركعتا سنة الفجر، وتُسمى أيضًا الراتبة القبلية لصلاة الفجر أو رغيبة الفجر.',
    'الحكم: هي آكد السنن الرواتب وأفضلها، وسنة مؤكدة باتفاق الجمهور.',
    'الوقت: تُصلى بعد دخول وقت الفجر الصادق (الأذان الثاني) وقبل إقامة صلاة الفجر.',
    'العدد: ركعتان خفيفتان.',
    'الفضل: قال عنها النبي صلى الله عليه وسلم: "ركعتا الفجر خير من الدنيا وما فيها" (رواه مسلم).',
    'الاضطجاع: يُسنُّ الاضطجاع بعد ركعتي الفجر على الشق الأيمن لمن صلاهما في بيته، وهذا مذهب الشافعية والحنابلة.'
  ].join('\n')
};

export async function getFajrOverlayContent(): Promise<FajrOverlayContent> {
  try {
    const ref = doc(db, 'app_content', 'fajr_overlay');
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return DEFAULT_CONTENT;
    }
    const data = snap.data() as Partial<FajrOverlayContent>;
    return {
      en: typeof data.en === 'string' ? data.en : DEFAULT_CONTENT.en,
      ar: typeof data.ar === 'string' ? data.ar : DEFAULT_CONTENT.ar,
      updatedAt: (snap.get('updatedAt') && typeof snap.get('updatedAt').toDate === 'function')
        ? snap.get('updatedAt').toDate()
        : undefined,
    };
  } catch (error) {
    logger.warn('Failed to load Fajr overlay content from Firestore:', error as Error);
    return DEFAULT_CONTENT;
  }
}