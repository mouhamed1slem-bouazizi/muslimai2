import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { logger } from '@/lib/logger';

export interface DhuhrOverlayContent {
  en: string;
  ar: string;
  updatedAt?: Date;
}

const DEFAULT_CONTENT: DhuhrOverlayContent = {
  en: [
    'Dhuhr is the midday obligatory prayer performed after the sun passes its zenith.',
    'Time Window: Starts just after zenith and extends until Asr time begins.',
    'Virtue: Dhuhr is one of the five daily prayers and holds great merit when prayed at its earliest time.',
    'Congregation: Praying in congregation (Jama’ah) is highly encouraged for men.',
    'Note: Avoid praying exactly at true zenith; the time opens moments after the sun tilts westward.'
  ].join('\n'),
  ar: [
    'صلاة الظهر هي الصلاة المفروضة في منتصف النهار بعد زوال الشمس عن كبد السماء.',
    'وقت الصلاة: يبدأ بعد الزوال مباشرةً ويمتد حتى دخول وقت العصر.',
    'الفضل: الظهر من الصلوات الخمس، ويُستحب أداؤها في أول وقتها لمن استطاع.',
    'الجماعة: يُستحب أداء الصلاة جماعةً للرجال.',
    'تنبيه: يُنهى عن الصلاة وقت الزوال الدقيق، ويبدأ وقت الظهر بعد ميل الشمس قليلًا نحو الغرب.'
  ].join('\n')
};

export async function getDhuhrOverlayContent(): Promise<DhuhrOverlayContent> {
  try {
    const ref = doc(db, 'app_content', 'dhuhr_overlay');
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return DEFAULT_CONTENT;
    }
    const data = snap.data() as Partial<DhuhrOverlayContent>;
    return {
      en: typeof data.en === 'string' ? data.en : DEFAULT_CONTENT.en,
      ar: typeof data.ar === 'string' ? data.ar : DEFAULT_CONTENT.ar,
      updatedAt: (snap.get('updatedAt') && typeof snap.get('updatedAt').toDate === 'function')
        ? snap.get('updatedAt').toDate()
        : undefined,
    };
  } catch (error) {
    logger.warn('Failed to load Dhuhr overlay content from Firestore:', error as Error);
    return DEFAULT_CONTENT;
  }
}