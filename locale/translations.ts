import { en } from './en';
import { id } from './id';
import { jp } from './jp';

export type Language = 'en' | 'id' | 'jp';
export type TranslationKeys = keyof typeof en;

export const translations: Record<Language, typeof en> = {
  en,
  id,
  jp
};
