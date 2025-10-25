import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { logger } from '@/lib/logger';

export interface IshaOverlayContent {
  en: string;
  ar: string;
  updatedAt?: Date;
}

const DEFAULT_CONTENT: IshaOverlayContent = {
  en: [
    'Isha is the night obligatory prayer performed after twilight disappears.',
    'Time Window: Begins after Maghrib and lasts until Fajr; praying earlier in the night is recommended.',
    'Virtue: Delaying Isha slightly is permissible; keep balance and avoid excessive delay.',
    'Congregation: Praying Isha in congregation carries great reward, completing daily obligatory prayers.',
    'Note: Isha consists of four obligatory rak\'ahs, followed by Sunnah and Witr optionally.'
  ].join('\n'),
  ar: [
    'صلاة العشاء هي الصلاة المفروضة بعد زوال الشفق.',
    'وقت الصلاة: يبدأ بعد المغرب ويمتد إلى الفجر؛ ويُستحب أداؤها في أول الليل مع جواز التأخير بلا مشقة.',
    'الفضل: يجوز تأخير العشاء قليلاً مع مراعاة الاعتدال وعدم الإفراط في التأخير.',
    'الجماعة: أداء صلاة العشاء جماعةً ذو أجرٍ عظيم، وهي ختام الصلوات المفروضة اليومية.',
    'تنبيه: صلاة العشاء أربع ركعات مفروضة، تُتبع بسنةٍ ووترٍ لمن شاء.'
  ].join('\n')
};

export async function getIshaOverlayContent(): Promise<IshaOverlayContent> {
  try {
    const ref = doc(db, 'app_content', 'isha_overlay');
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return DEFAULT_CONTENT;
    }
    const data = snap.data() as Partial<IshaOverlayContent>;
    return {
      en: typeof data.en === 'string' ? data.en : DEFAULT_CONTENT.en,
      ar: typeof data.ar === 'string' ? data.ar : DEFAULT_CONTENT.ar,
      updatedAt: (snap.get('updatedAt') && typeof snap.get('updatedAt').toDate === 'function')
        ? snap.get('updatedAt').toDate()
        : undefined,
    };
  } catch (error) {
    logger.warn('Failed to load Isha overlay content from Firestore:', error as Error);
    return DEFAULT_CONTENT;
  }
}