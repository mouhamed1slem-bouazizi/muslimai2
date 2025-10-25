import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { logger } from '@/lib/logger';

export interface SunriseOverlayContent {
  en: string;
  ar: string;
  updatedAt?: Date;
}

const DEFAULT_CONTENT: SunriseOverlayContent = {
  en: [
    'Sunrise marks the end of the Fajr time and the moment the sun appears above the horizon.',
    'Prohibition: It is discouraged to pray at the exact time of sunrise.',
    'Ishraq: Two short Rak\'ahs prayed after the sun rises sufficiently (about 10–20 minutes). Many scholars consider it part of the Duha prayer.',
    'Duha Time: Begins after the sun has risen and extends until shortly before Dhuhr (zenith).',
    'Note: Avoid praying during the exact sunrise and at true zenith (midday) when the sun is at its highest.'
  ].join('\n'),
  ar: [
    'وقت الشروق هو حين تظهر الشمس فوق الأفق وينتهي به وقت الفجر.',
    'النهي: يُكره أداء الصلاة في وقت الشروق نفسه.',
    'الإشراق: ركعتان خفيفتان بعد ارتفاع الشمس قدر رمح (قرابة 10–20 دقيقة)، ويُعدّها كثير من العلماء من صلاة الضحى.',
    'وقت الضحى: يبدأ بعد ارتفاع الشمس وينتهي قبيل الزوال.',
    'تنبيه: يُنهى عن الصلاة وقت الشروق ووقت الزوال عندما تكون الشمس في كبد السماء.'
  ].join('\n')
};

export async function getSunriseOverlayContent(): Promise<SunriseOverlayContent> {
  try {
    const ref = doc(db, 'app_content', 'sunrise_overlay');
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return DEFAULT_CONTENT;
    }
    const data = snap.data() as Partial<SunriseOverlayContent>;
    return {
      en: typeof data.en === 'string' ? data.en : DEFAULT_CONTENT.en,
      ar: typeof data.ar === 'string' ? data.ar : DEFAULT_CONTENT.ar,
      updatedAt: (snap.get('updatedAt') && typeof snap.get('updatedAt').toDate === 'function')
        ? snap.get('updatedAt').toDate()
        : undefined,
    };
  } catch (error) {
    logger.warn('Failed to load Sunrise overlay content from Firestore:', error as Error);
    return DEFAULT_CONTENT;
  }
}