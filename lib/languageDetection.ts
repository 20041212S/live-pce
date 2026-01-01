/**
 * Language detection utility
 * Detects the language of user input and returns language code
 */

// Common language patterns and keywords
const LANGUAGE_PATTERNS: { [key: string]: { patterns: RegExp[]; code: string; name: string } } = {
  malayalam: {
    patterns: [
      /[\u0D00-\u0D7F]/, // Malayalam Unicode range
      /നമസ്കാരം|ഹലോ|എന്താണ്|എങ്ങനെ|എവിടെ|എപ്പോൾ|എന്ത്|ആര്|എങ്ങനെയാണ്|എവിടെയാണ്/i,
      /സ്ഥലം|സമയം|ഫീസ്|ഫാക്കൽറ്റി|സ്റ്റാഫ്|റൂം|ക്ലാസ്|പരീക്ഷ|ടൈംടേബിൾ/i,
    ],
    code: 'ml',
    name: 'Malayalam',
  },
  english: {
    patterns: [
      /^[a-zA-Z0-9\s.,!?'"()-]+$/, // Only English characters
      /hello|hi|hey|what|where|when|how|who|why|which/i,
      /fee|faculty|staff|room|class|exam|timetable|location|directions/i,
    ],
    code: 'en',
    name: 'English',
  },
  hindi: {
    patterns: [
      /[\u0900-\u097F]/, // Devanagari Unicode range
      /नमस्ते|हैलो|क्या|कहाँ|कब|कैसे|कौन|क्यों|कौन सा/i,
      /स्थान|समय|शुल्क|संकाय|कर्मचारी|कमरा|कक्षा|परीक्षा|समय सारिणी/i,
    ],
    code: 'hi',
    name: 'Hindi',
  },
  tamil: {
    patterns: [
      /[\u0B80-\u0BFF]/, // Tamil Unicode range
      /வணக்கம்|ஹலோ|என்ன|எங்கே|எப்போது|எப்படி|யார்|ஏன்|எந்த/i,
      /இடம்|நேரம்|கட்டணம்|ஆசிரியர்|ஊழியர்|அறை|வகுப்பு|தேர்வு|நேர அட்டவணை/i,
    ],
    code: 'ta',
    name: 'Tamil',
  },
};

/**
 * Detect the language of the input text
 * Returns language code (en, ml, hi, ta, etc.)
 */
export function detectLanguage(text: string): string {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return 'en'; // Default to English
  }

  const trimmedText = text.trim();
  
  // Check for Unicode ranges first (most reliable)
  for (const [lang, config] of Object.entries(LANGUAGE_PATTERNS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(trimmedText)) {
        // If it matches a Unicode range, it's definitely that language
        if (pattern.source.includes('\\u')) {
          return config.code;
        }
      }
    }
  }

  // Count matches for each language
  const scores: { [key: string]: number } = {};
  
  for (const [lang, config] of Object.entries(LANGUAGE_PATTERNS)) {
    let score = 0;
    for (const pattern of config.patterns) {
      const matches = trimmedText.match(pattern);
      if (matches) {
        score += matches.length;
      }
    }
    scores[lang] = score;
  }

  // Find language with highest score
  let maxScore = 0;
  let detectedLang = 'en'; // Default to English

  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedLang = LANGUAGE_PATTERNS[lang].code;
    }
  }

  // If no strong match, check if text contains only English characters
  if (maxScore === 0) {
    const onlyEnglish = /^[a-zA-Z0-9\s.,!?'"()-]+$/.test(trimmedText);
    return onlyEnglish ? 'en' : 'en'; // Default to English if uncertain
  }

  return detectedLang;
}

/**
 * Get browser-supported language code for TTS
 * Maps our language codes to browser-compatible codes
 */
export function getTTSLanguageCode(languageCode: string): string {
  const ttsLanguageMap: { [key: string]: string } = {
    'en': 'en-IN', // English - Indian variant
    'ml': 'ml-IN', // Malayalam - Indian variant  
    'hi': 'hi-IN', // Hindi - Indian variant
    'ta': 'ta-IN', // Tamil - Indian variant
  };
  
  return ttsLanguageMap[languageCode] || languageCode + '-IN' || 'en-IN';
}

/**
 * Get language name from code
 */
export function getLanguageName(code: string): string {
  for (const config of Object.values(LANGUAGE_PATTERNS)) {
    if (config.code === code) {
      return config.name;
    }
  }
  return 'English';
}

/**
 * Get language instruction for LLM based on detected language
 */
export function getLanguageInstruction(languageCode: string): string {
  const instructions: { [key: string]: string } = {
    ml: 'IMPORTANT: The user is communicating in Malayalam. You MUST respond entirely in Malayalam. Use proper Malayalam script and grammar. Do not mix English words unless they are technical terms that are commonly used in Malayalam (like "computer", "email", etc.).',
    hi: 'IMPORTANT: The user is communicating in Hindi. You MUST respond entirely in Hindi. Use proper Devanagari script and grammar.',
    ta: 'IMPORTANT: The user is communicating in Tamil. You MUST respond entirely in Tamil. Use proper Tamil script and grammar.',
    en: 'Respond in English.',
  };

  return instructions[languageCode] || instructions.en;
}

