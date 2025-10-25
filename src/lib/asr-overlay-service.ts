import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { logger } from '@/lib/logger';

export interface AsrOverlayContent {
  en: string;
  ar: string;
  updatedAt?: Date;
}

const DEFAULT_CONTENT: AsrOverlayContent = {
  en: [
    'Asr is the afternoon obligatory prayer prayed when shadows lengthen well after midday.',
    'Time Window: Begins when an object\'s shadow equals its length (Hanafi: twice its length) and ends at Maghrib.',
    'Virtue: Guarding Asr in its time is strongly emphasized; delaying without excuse is discouraged.',
    'Congregation: Praying in congregation is encouraged; avoid delaying close to sunset.',
    'Note: Refrain from praying right at sunset; Maghrib starts immediately after.'
  ].join('\n'),
  ar: [
    'صلاة العصر هي الصلاة المفروضة في وقت ما بعد الزوال حين يطول الظل.',
    'وقت الصلاة: يبدأ عندما يصبح طول ظل الشيء مساوياً لطوله (وعند الحنفية: ضعف طوله) وينتهي بدخول وقت المغرب.',
    'الفضل: المحافظة على صلاة العصر في وقتها مؤكدة؛ وتأخيرها بلا عذر مكروه.',
    'الجماعة: يُستحب أداؤها جماعةً؛ ويُكره تأخيرها إلى قُبيل الغروب.',
    'تنبيه: يُنهى عن الصلاة عند الغروب؛ ويبدأ وقت المغرب مباشرة بعده.'
  ].join('\n')
};

export async function getAsrOverlayContent(): Promise<AsrOverlayContent> {
  try {
    const ref = doc(db, 'app_content', 'asr_overlay');
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return DEFAULT_CONTENT;
    }
    const data = snap.data() as Partial<AsrOverlayContent>;
    return {
      en: typeof data.en === 'string' ? data.en : DEFAULT_CONTENT.en,
      ar: typeof data.ar === 'string' ? data.ar : DEFAULT_CONTENT.ar,
      updatedAt: (snap.get('updatedAt') && typeof snap.get('updatedAt').toDate === 'function')
        ? snap.get('updatedAt').toDate()
        : undefined,
    };
  } catch (error) {
    logger.warn('Failed to load Asr overlay content from Firestore:', error as Error);
    return DEFAULT_CONTENT;
  }
}