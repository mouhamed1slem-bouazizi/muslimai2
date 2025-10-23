/**
 * AI Chat Service for Islamic Q&A functionality
 * Uses Pollinations API for text generation with Islamic content filtering
 */

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export interface AIResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Islamic keywords for content validation
 */
const ISLAMIC_KEYWORDS = {
  english: [
    'islam', 'muslim', 'allah', 'prophet', 'muhammad', 'quran', 'hadith', 'prayer', 'salah', 'hajj', 'umrah',
    'ramadan', 'fasting', 'zakat', 'mosque', 'imam', 'islamic', 'sunnah', 'sharia', 'jihad', 'ummah',
    'bismillah', 'inshallah', 'mashallah', 'subhanallah', 'alhamdulillah', 'astaghfirullah', 'dua', 'dhikr',
    'tawhid', 'shirk', 'halal', 'haram', 'makruh', 'mustahab', 'wudu', 'ghusl', 'tayammum', 'qibla',
    'eid', 'mecca', 'medina', 'kaaba', 'caliph', 'sahaba', 'tabi', 'fiqh', 'tafsir', 'seerah',
    'angel', 'jinn', 'paradise', 'hell', 'judgment', 'resurrection', 'afterlife', 'destiny', 'qadar'
  ],
  arabic: [
    'إسلام', 'مسلم', 'الله', 'النبي', 'محمد', 'قرآن', 'حديث', 'صلاة', 'حج', 'عمرة',
    'رمضان', 'صيام', 'زكاة', 'مسجد', 'إمام', 'إسلامي', 'سنة', 'شريعة', 'جهاد', 'أمة',
    'بسم الله', 'إن شاء الله', 'ما شاء الله', 'سبحان الله', 'الحمد لله', 'أستغفر الله',
    'دعاء', 'ذكر', 'توحيد', 'شرك', 'حلال', 'حرام', 'مكروه', 'مستحب', 'وضوء', 'غسل',
    'تيمم', 'قبلة', 'عيد', 'مكة', 'المدينة', 'الكعبة', 'خليفة', 'صحابة', 'تابعي',
    'فقه', 'تفسير', 'سيرة', 'ملك', 'جن', 'جنة', 'نار', 'يوم الدين', 'بعث', 'آخرة', 'قدر'
  ]
};

/**
 * Non-Islamic topics that should be rejected
 */
const NON_ISLAMIC_KEYWORDS = [
  'politics', 'politician', 'election', 'government', 'president', 'minister', 'party',
  'war', 'conflict', 'military', 'weapon', 'violence', 'terrorism',
  'entertainment', 'movie', 'music', 'celebrity', 'actor', 'singer',
  'sports', 'football', 'basketball', 'soccer', 'game', 'match',
  'technology', 'computer', 'software', 'programming', 'coding',
  'business', 'money', 'investment', 'stock', 'finance', 'economy',
  'science', 'physics', 'chemistry', 'biology', 'mathematics',
  'history', 'ancient', 'civilization', 'empire', 'kingdom'
];

/**
 * Check if the message contains Islamic content
 */
export function isIslamicContent(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  // Check for Islamic keywords
  const hasIslamicKeywords = [
    ...ISLAMIC_KEYWORDS.english,
    ...ISLAMIC_KEYWORDS.arabic
  ].some(keyword => lowerMessage.includes(keyword.toLowerCase()));

  // Check for non-Islamic keywords that should be rejected
  const hasNonIslamicKeywords = NON_ISLAMIC_KEYWORDS.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase())
  );

  // If it has non-Islamic keywords and no Islamic keywords, reject it
  if (hasNonIslamicKeywords && !hasIslamicKeywords) {
    return false;
  }

  // If it has Islamic keywords, accept it
  if (hasIslamicKeywords) {
    return true;
  }

  // For ambiguous cases, we can be more permissive and let the AI handle it
  // but add Islamic context to the prompt
  return true;
}

/**
 * Generate rejection message for non-Islamic topics
 */
export function getRejectionMessage(language: string): string {
  return language === 'ar'
    ? 'عذراً، أنا متخصص في الأسئلة الإسلامية فقط. يرجى طرح سؤال متعلق بالإسلام والدين الإسلامي.'
    : 'Sorry, I can only answer questions related to Islam and Islamic topics. Please ask a question about Islamic religion and teachings.';
}

/**
 * Enhance prompt with Islamic context
 */
function enhancePromptWithIslamicContext(prompt: string, language: string): string {
  const islamicContext = language === 'ar'
    ? `أنت مساعد ذكي متخصص في الإسلام. أجب على هذا السؤال الإسلامي باللغة العربية بطريقة علمية ودقيقة مع الاستشهاد بالقرآن الكريم والسنة النبوية الشريفة عند الإمكان. إذا كان السؤال غير متعلق بالإسلام، فأجب بأنك متخصص في الأسئلة الإسلامية فقط. السؤال: ${prompt}`
    : `You are an AI assistant specialized in Islam. Answer this Islamic question in English with scholarly accuracy, citing the Holy Quran and authentic Sunnah when possible. If the question is not related to Islam, respond that you only specialize in Islamic questions. Question: ${prompt}`;

  return islamicContext;
}

/**
 * Generate AI response using Pollinations API
 */
export async function generateAIResponse(prompt: string, language: string): Promise<AIResponse> {
  try {
    // Check if content is Islamic
    if (!isIslamicContent(prompt)) {
      return {
        success: false,
        message: getRejectionMessage(language),
        error: 'Non-Islamic content detected'
      };
    }

    // Enhance prompt with Islamic context
    const enhancedPrompt = enhancePromptWithIslamicContext(prompt, language);
    
    // Make API call to Pollinations
    const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(enhancedPrompt)}`, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
        'User-Agent': 'MuslimAI/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const aiResponse = await response.text();
    
    // Basic validation of the response
    if (!aiResponse || aiResponse.trim().length === 0) {
      throw new Error('Empty response from AI');
    }

    // Check if the AI response contains rejection patterns
    const rejectionPatterns = [
      'i cannot', 'i can\'t', 'unable to', 'not able to',
      'لا أستطيع', 'لا يمكنني', 'غير قادر'
    ];

    const containsRejection = rejectionPatterns.some(pattern => 
      aiResponse.toLowerCase().includes(pattern)
    );

    if (containsRejection) {
      return {
        success: false,
        message: getRejectionMessage(language),
        error: 'AI rejected the question'
      };
    }

    return {
      success: true,
      message: aiResponse.trim()
    };

  } catch (error) {
    console.error('Error generating AI response:', error);
    
    const errorMessage = language === 'ar'
      ? 'عذراً، حدث خطأ في الاتصال بالخدمة. يرجى المحاولة مرة أخرى لاحقاً.'
      : 'Sorry, there was a connection error. Please try again later.';

    return {
      success: false,
      message: errorMessage,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create a new chat message
 */
export function createMessage(content: string, isUser: boolean): ChatMessage {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    content,
    isUser,
    timestamp: new Date()
  };
}

/**
 * Get welcome message based on language
 */
export function getWelcomeMessage(language: string): ChatMessage {
  const content = language === 'ar'
    ? 'السلام عليكم ورحمة الله وبركاته! أنا مساعد ذكي متخصص في الأسئلة الإسلامية. يمكنني مساعدتك في أمور الدين والفقه والعقيدة. كيف يمكنني خدمتك اليوم؟'
    : 'Assalamu Alaikum wa Rahmatullahi wa Barakatuh! I am an AI assistant specialized in Islamic questions. I can help you with matters of religion, jurisprudence, and faith. How may I assist you today?';

  return createMessage(content, false);
}

/**
 * Format time for message display
 */
export function formatMessageTime(date: Date, language: string): string {
  return date.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}