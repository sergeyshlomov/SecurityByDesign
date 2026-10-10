const english = {
  language: 'Language', hotspotLabels: ['SECURITY', 'STRATEGY', 'RESILIENCE'], threat: 'THREAT',
  leadership: ['CISO ADVISORY', 'CIO STRATEGY', 'CTO LEADERSHIP'],
  stamp: ['BUILT ON EXPERIENCE.', 'DRIVEN BY RESPONSIBILITY.'], labCaption: 'SECURITY LAB / WORKSTATIONS',
  threatScenario: 'THREAT SCENARIO', protectionSteps: 'IDENTIFY → PRIORITIZE → PROTECT',
  worldwide: 'ISRAEL / WORLDWIDE', imageCredits: 'Image credits',
};
export const uiCopy = {
  en: english,
  ru: { ...english, language: 'Язык', imageCredits: 'Источники изображений' },
  he: {
    language: 'שפה', hotspotLabels: ['אבטחת מידע', 'אסטרטגיה', 'מוכנות'], threat: 'איום',
    leadership: ['ייעוץ / CISO', 'ניהול / CIO', 'הובלה / CTO'],
    stamp: ['ניסיון שמנחה את הדרך.', 'אחריות שמלווה את הביצוע.'], labCaption: 'סביבת אבטחת מידע / תחנות עבודה',
    threatScenario: 'תרחיש איום', protectionSteps: 'זיהוי ← תעדוף ← הגנה',
    worldwide: 'ישראל / פעילות בינלאומית', imageCredits: 'מקורות התמונות',
  },
};
