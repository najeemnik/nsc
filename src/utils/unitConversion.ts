import type { Language } from '../types';
import { intlLocaleFor, localizeText } from '../i18n/localize';

export interface UnitDefinition {
  id: string;
  symbol: string;
  nameFa: string;
  namePs: string;
  nameEn: string;
  category: 'weight' | 'volume' | 'area' | 'length' | 'count' | 'time' | 'variable';
  hasStandardConversion: boolean;
  standardTargetUnit?: string;
  standardMultiplier?: number;
  description?: string;
}

export const AVAILABLE_UNITS: UnitDefinition[] = [
  // Weight Units (Standard)
  {
    id: 'Ton',
    symbol: 'Ton',
    nameFa: 'تن (Ton)',
    namePs: 'ټن',
    nameEn: 'Ton',
    category: 'weight',
    hasStandardConversion: true,
    standardTargetUnit: 'kg',
    standardMultiplier: 1000,
    description: '1 Ton = 1,000 kg',
  },
  {
    id: 'kg',
    symbol: 'kg',
    nameFa: 'کیلوگرام (kg)',
    namePs: 'کیلوګرام',
    nameEn: 'Kilogram',
    category: 'weight',
    hasStandardConversion: true,
    standardTargetUnit: 'Ton',
    standardMultiplier: 0.001,
    description: '1,000 kg = 1 Ton',
  },
  {
    id: 'seer',
    symbol: 'سیر',
    nameFa: 'سیر کابل (Seer - 7kg)',
    namePs: 'کابل سیر',
    nameEn: 'Seer (7 kg)',
    category: 'weight',
    hasStandardConversion: true,
    standardTargetUnit: 'kg',
    standardMultiplier: 7,
    description: '1 سیر = 7 kg',
  },
  {
    id: 'kharwar',
    symbol: 'خروار',
    nameFa: 'خروار (Kharwar - 560kg)',
    namePs: 'خروار',
    nameEn: 'Kharwar (560 kg)',
    category: 'weight',
    hasStandardConversion: true,
    standardTargetUnit: 'kg',
    standardMultiplier: 560,
    description: '1 خروار = 80 سیر = 560 kg',
  },
  // Volume Units
  {
    id: 'm3',
    symbol: 'm³',
    nameFa: 'متر مکعب (m³)',
    namePs: 'مکعب متر',
    nameEn: 'Cubic Meter (m³)',
    category: 'volume',
    hasStandardConversion: false,
    description: 'واحد حجم کانکریت و خاک',
  },
  {
    id: 'liter',
    symbol: 'L',
    nameFa: 'لیتر (L)',
    namePs: 'لیتر',
    nameEn: 'Liter',
    category: 'volume',
    hasStandardConversion: false,
    description: 'مایعات، تیل و افزودنی',
  },
  // Area Units
  {
    id: 'm2',
    symbol: 'm²',
    nameFa: 'متر مربع (m²)',
    namePs: 'مربع متر',
    nameEn: 'Square Meter (m²)',
    category: 'area',
    hasStandardConversion: false,
    description: 'مساحت آپارتمان و کارگری',
  },
  // Length Units
  {
    id: 'meter',
    symbol: 'm',
    nameFa: 'متر طول (Meter)',
    namePs: 'متر',
    nameEn: 'Meter (m)',
    category: 'length',
    hasStandardConversion: true,
    standardTargetUnit: 'cm',
    standardMultiplier: 100,
    description: '1 meter = 100 cm',
  },
  // Count / Discrete Units
  {
    id: 'bag',
    symbol: 'bag',
    nameFa: 'خریطه / پاکت (Bag)',
    namePs: 'بوجۍ',
    nameEn: 'Bag (Cement / Gypsum)',
    category: 'variable',
    hasStandardConversion: false,
    description: 'سمنت و گچ (معمولاً ۵۰ کیلوگرام)',
  },
  {
    id: 'piece',
    symbol: 'pcs',
    nameFa: 'دانه / عدد (Piece)',
    namePs: 'دانې',
    nameEn: 'Piece / Count',
    category: 'count',
    hasStandardConversion: false,
    description: 'خشت، بلاک، چوب و لوازم برقی',
  },
  {
    id: 'truck',
    symbol: 'Truck',
    nameFa: 'موتر / لارۍ (Truck)',
    namePs: 'موټر',
    nameEn: 'Truck Load',
    category: 'variable',
    hasStandardConversion: false,
    description: 'موتر ریگ، جغله یا خاکبرداری',
  },
  {
    id: 'carton',
    symbol: 'box',
    nameFa: 'کارتن / کارتن (Carton / Box)',
    namePs: 'کارتن',
    nameEn: 'Carton / Box',
    category: 'count',
    hasStandardConversion: false,
  },
  // Time / Labour Units
  {
    id: 'day',
    symbol: 'day',
    nameFa: 'روزکار (روز)',
    namePs: 'ورځ',
    nameEn: 'Day / Shift',
    category: 'time',
    hasStandardConversion: false,
  },
  {
    id: 'hour',
    symbol: 'hr',
    nameFa: 'ساعتکار (ساعت)',
    namePs: 'ساعت',
    nameEn: 'Hour',
    category: 'time',
    hasStandardConversion: false,
  },
  {
    id: 'other',
    symbol: 'other',
    nameFa: 'واحد دیگر',
    namePs: 'بل واحد',
    nameEn: 'Other Custom Unit',
    category: 'count',
    hasStandardConversion: false,
  },
];

export interface ConversionResult {
  convertedQuantity: number;
  targetUnit: string;
  explanation: string;
  isStandard: boolean;
}

export function calculateUnitConversion(
  quantity: number,
  unitId: string,
  customCapacity?: {
    truckCapacity?: number;
    truckTargetUnit?: string;
    bagWeightKg?: number;
  },
  language: Language = 'en'
): ConversionResult | null {
  if (isNaN(quantity) || quantity <= 0) return null;
  const formatNumber = (value: number) => value.toLocaleString(intlLocaleFor(language));

  // 1. Standard: Ton -> kg
  if (unitId === 'Ton') {
    const kg = quantity * 1000;
    return {
      convertedQuantity: kg,
      targetUnit: 'kg',
      explanation: localizeText(language, {
        en: `${formatNumber(quantity)} tons = ${formatNumber(kg)} kg (1 ton = 1,000 kg)`,
        fa: `${formatNumber(quantity)} تن = ${formatNumber(kg)} کیلوگرام (هر تن = ۱٬۰۰۰ کیلوگرام)`,
        ps: `${formatNumber(quantity)} ټنه = ${formatNumber(kg)} کیلوګرام (۱ ټن = ۱٬۰۰۰ کیلوګرام)`,
      }),
      isStandard: true,
    };
  }

  // 2. Standard: kg -> Ton
  if (unitId === 'kg' && quantity >= 1000) {
    const tons = parseFloat((quantity / 1000).toFixed(3));
    return {
      convertedQuantity: tons,
      targetUnit: 'Ton',
      explanation: localizeText(language, {
        en: `${formatNumber(quantity)} kg = ${formatNumber(tons)} tons`,
        fa: `${formatNumber(quantity)} کیلوگرام = ${formatNumber(tons)} تن`,
        ps: `${formatNumber(quantity)} کیلوګرام = ${formatNumber(tons)} ټنه`,
      }),
      isStandard: true,
    };
  }

  // 3. Standard: Seer -> kg
  if (unitId === 'seer') {
    const kg = quantity * 7;
    return {
      convertedQuantity: kg,
      targetUnit: 'kg',
      explanation: localizeText(language, {
        en: `${formatNumber(quantity)} seer = ${formatNumber(kg)} kg (1 seer = 7 kg)`,
        fa: `${formatNumber(quantity)} سیر = ${formatNumber(kg)} کیلوگرام (هر سیر = ۷ کیلوگرام)`,
        ps: `${formatNumber(quantity)} سیر = ${formatNumber(kg)} کیلوګرام (۱ سیر = ۷ کیلوګرام)`,
      }),
      isStandard: true,
    };
  }

  // 4. Standard: Kharwar -> kg
  if (unitId === 'kharwar') {
    const kg = quantity * 560;
    return {
      convertedQuantity: kg,
      targetUnit: 'kg',
      explanation: localizeText(language, {
        en: `${formatNumber(quantity)} kharwar = ${formatNumber(kg)} kg (1 kharwar = 80 seer = 560 kg)`,
        fa: `${formatNumber(quantity)} خروار = ${formatNumber(kg)} کیلوگرام (۱ خروار = ۸۰ سیر = ۵۶۰ کیلوگرام)`,
        ps: `${formatNumber(quantity)} خروار = ${formatNumber(kg)} کیلوګرام (۱ خروار = ۸۰ سیر = ۵۶۰ کیلوګرام)`,
      }),
      isStandard: true,
    };
  }

  // 5. Standard: Meter -> cm
  if (unitId === 'meter' && quantity < 10) {
    const cm = quantity * 100;
    return {
      convertedQuantity: cm,
      targetUnit: 'cm',
      explanation: `${formatNumber(quantity)} m = ${formatNumber(cm)} cm`,
      isStandard: true,
    };
  }

  // 6. Variable: Cement Bag (requires capacity, default 50kg)
  if (unitId === 'bag') {
    const bagKg = customCapacity?.bagWeightKg || 50;
    const totalKg = quantity * bagKg;
    const totalTons = parseFloat((totalKg / 1000).toFixed(3));
    return {
      convertedQuantity: totalKg,
      targetUnit: 'kg',
      explanation: localizeText(language, {
        en: `${formatNumber(quantity)} bags = ${formatNumber(totalKg)} kg (${totalTons} tons), assuming ${formatNumber(bagKg)} kg per bag`,
        fa: `${formatNumber(quantity)} بوجی = ${formatNumber(totalKg)} کیلوگرام (${totalTons} تن)، با فرض ${formatNumber(bagKg)} کیلوگرام برای هر بوجی`,
        ps: `${formatNumber(quantity)} بوجۍ = ${formatNumber(totalKg)} کیلوګرام (${totalTons} ټنه)، د هرې بوجۍ وزن ${formatNumber(bagKg)} کیلوګرام فرض شوی`,
      }),
      isStandard: false,
    };
  }

  // 7. Variable: Truck (requires configured capacity, user rule)
  if (unitId === 'truck') {
    if (customCapacity?.truckCapacity && customCapacity.truckCapacity > 0) {
      const targetUnit = customCapacity.truckTargetUnit || 'Ton';
      const totalCapacity = quantity * customCapacity.truckCapacity;
      return {
        convertedQuantity: totalCapacity,
        targetUnit,
        explanation: localizeText(language, {
          en: `${formatNumber(quantity)} truckloads = ${formatNumber(totalCapacity)} ${targetUnit} (capacity per truck: ${formatNumber(customCapacity.truckCapacity)} ${targetUnit})`,
          fa: `${formatNumber(quantity)} موتر = ${formatNumber(totalCapacity)} ${targetUnit} (ظرفیت هر موتر: ${formatNumber(customCapacity.truckCapacity)} ${targetUnit})`,
          ps: `${formatNumber(quantity)} لارۍ = ${formatNumber(totalCapacity)} ${targetUnit} (د هرې لارۍ ظرفیت: ${formatNumber(customCapacity.truckCapacity)} ${targetUnit})`,
        }),
        isStandard: false,
      };
    }
  }

  return null;
}
