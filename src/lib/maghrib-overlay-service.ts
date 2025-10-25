import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { logger } from '@/lib/logger';

export interface MaghribOverlayContent {
  en: string;
  ar: string;
  updatedAt?: Date;
}

const DEFAULT_CONTENT: MaghribOverlayContent = {
  en: [
    'Maghrib is the sunset obligatory prayer performed immediately after the sun fully sets.',
    'Time Window: Starts at sunset and extends until Isha time begins.',
    'Virtue: Hastening Maghrib at its time is Sunnah; avoid unnecessary delays.',
    'Congregation: Praying in congregation is encouraged; break the fast before or after with dates and water.',
    'Note: Maghrib consists of three obligatory rak\'ahs followed by Sunnah prayers.'
  ].join('\n'),
  ar: [
    'صلاة المغرب هي الصلاة المفروضة بعد غروب الشمس مباشرةً.',
    'وقت الصلاة: يبدأ عند الغروب ويمتد حتى دخول وقت العشاء.',
    'الفضل: يُستحب تعجيل صلاة المغرب في وقتها وعدم التأخير بلا حاجة.',
    'الجماعة: يُستحب أداؤها جماعةً؛ ويُسن الإفطار على تمر أو ماء قبل أو بعد الصلاة بحسب الحال.',
    'تنبيه: صلاة المغرب ثلاث ركعات مفروضة، تُتبع بسنةٍ راتبة.'
  ].join('\n')
};

export async function getMaghribOverlayContent(): Promise<MaghribOverlayContent> {
  try {
    const ref = doc(db, 'app_content', 'maghrib_overlay');
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return DEFAULT_CONTENT;
    }
    const data = snap.data() as Partial<MaghribOverlayContent>;
    return {
      en: typeof data.en === 'string' ? data.en : DEFAULT_CONTENT.en,
      ar: typeof data.ar === 'string' ? data.ar : DEFAULT_CONTENT.ar,
      updatedAt: (snap.get('updatedAt') && typeof snap.get('updatedAt').toDate === 'function')
        ? snap.get('updatedAt').toDate()
        : undefined,
    };
  } catch (error) {
    logger.warn('Failed to load Maghrib overlay content from Firestore:', error as Error);
    return DEFAULT_CONTENT;
  }
}