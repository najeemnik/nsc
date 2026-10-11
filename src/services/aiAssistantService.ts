import type { Language } from '../types';
import { intlLocaleFor, localizeText } from '../i18n/localize';

export interface ProjectContextSummary {
  projectName: string;
  totalSteelTons: number;
  steelCostUSD: number;
  totalConcreteM3: number;
  concreteCostUSD: number;
  totalExpensesUSD: number;
  totalPaidUSD: number;
  totalDebtUSD: number;
  apartmentsTotal: number;
  apartmentsSold: number;
  apartmentsAvailable: number;
  totalSalesValueUSD: number;
  salesReceivedUSD: number;
  salesDueUSD: number;
}

export function answerProjectQuestionLocally(
  question: string,
  summary: ProjectContextSummary,
  allProjects: Array<{ name: string; floors: number; units: number; city: string }>,
  language: Language = 'en'
): string {
  const q = question.toLowerCase().trim();
  const fmt = (value: number) => value.toLocaleString(intlLocaleFor(language));
  const projectName = summary.projectName;

  if (['سیخ', 'فولاد', 'آهن', 'steel', 'rebar', 'سیخ‌ګول'].some(term => q.includes(term))) {
    return localizeText(language, {
      en: `📊 Project "${projectName}" has ${fmt(summary.totalSteelTons)} tons of rebar recorded, valued at $${fmt(summary.steelCostUSD)} USD.`,
      fa: `📊 در پروژهٔ «${projectName}» تا اکنون ${fmt(summary.totalSteelTons)} تن سیخ‌گول به ارزش $${fmt(summary.steelCostUSD)} دالر ثبت شده است.`,
      ps: `📊 په «${projectName}» پروژه کې تر اوسه ${fmt(summary.totalSteelTons)} ټنه سیخ‌ګول د $${fmt(summary.steelCostUSD)} ډالرو په ارزښت ثبت شوي دي.`,
    });
  }

  if (['کانکریت', 'کانکریت‌ریزی', 'concrete', 'pump', 'متر مکعب', 'کانکریټ', 'پمپ'].some(term => q.includes(term))) {
    return localizeText(language, {
      en: `🏗️ Project "${projectName}" has ${fmt(summary.totalConcreteM3)} m³ of concrete recorded, costing $${fmt(summary.concreteCostUSD)} USD.`,
      fa: `🏗️ حجم کانکریت ثبت‌شده در پروژهٔ «${projectName}» ${fmt(summary.totalConcreteM3)} متر مکعب با هزینهٔ $${fmt(summary.concreteCostUSD)} دالر است.`,
      ps: `🏗️ په «${projectName}» پروژه کې ${fmt(summary.totalConcreteM3)} مکعب متر کانکریټ د $${fmt(summary.concreteCostUSD)} ډالرو په لګښت ثبت شوی دی.`,
    });
  }

  if (['آپارتمان', 'فروش', 'باقی', 'قسط', 'مشتری', 'apartment', 'sold', 'اپارتمان', 'پلور', 'پېرودونکی'].some(term => q.includes(term))) {
    return localizeText(language, {
      en: `🏢 Apartment sales in "${projectName}":\n• Total units: ${summary.apartmentsTotal}\n• Sold: ${summary.apartmentsSold}\n• Available: ${summary.apartmentsAvailable}\n• Total sale value: $${fmt(summary.totalSalesValueUSD)}\n• Received: $${fmt(summary.salesReceivedUSD)}\n• Outstanding from buyers: $${fmt(summary.salesDueUSD)}`,
      fa: `🏢 وضعیت فروش آپارتمان‌های پروژهٔ «${projectName}»:\n• مجموع واحدها: ${summary.apartmentsTotal}\n• فروخته‌شده: ${summary.apartmentsSold}\n• موجود: ${summary.apartmentsAvailable}\n• ارزش کل فروش: $${fmt(summary.totalSalesValueUSD)}\n• دریافت‌شده: $${fmt(summary.salesReceivedUSD)}\n• طلب از خریداران: $${fmt(summary.salesDueUSD)}`,
      ps: `🏢 د «${projectName}» پروژې د اپارتمانونو پلور:\n• ټول واحدونه: ${summary.apartmentsTotal}\n• پلورل شوي: ${summary.apartmentsSold}\n• شته: ${summary.apartmentsAvailable}\n• د پلور ټول ارزښت: $${fmt(summary.totalSalesValueUSD)}\n• ترلاسه شوي: $${fmt(summary.salesReceivedUSD)}\n• له پېرودونکو پاتې: $${fmt(summary.salesDueUSD)}`,
    });
  }

  if (['مصرف', 'هزینه', 'خرچ', 'expense', 'cost', 'لګښت'].some(term => q.includes(term))) {
    return localizeText(language, {
      en: `💰 Expenses and payments for "${projectName}":\n• Recorded expenses and purchases: $${fmt(summary.totalExpensesUSD)}\n• Paid: $${fmt(summary.totalPaidUSD)}\n• Outstanding payables: $${fmt(summary.totalDebtUSD)}`,
      fa: `💰 مصارف و پرداخت‌های پروژهٔ «${projectName}»:\n• مجموع مصارف و خریدهای ثبت‌شده: $${fmt(summary.totalExpensesUSD)}\n• پرداخت‌شده: $${fmt(summary.totalPaidUSD)}\n• بدهی باقی‌مانده: $${fmt(summary.totalDebtUSD)}`,
      ps: `💰 د «${projectName}» پروژې لګښتونه او تادیې:\n• ثبت شوي لګښتونه او پېرودونه: $${fmt(summary.totalExpensesUSD)}\n• ورکړل شوي: $${fmt(summary.totalPaidUSD)}\n• پاتې پورونه: $${fmt(summary.totalDebtUSD)}`,
    });
  }

  if (['قرض', 'طلب', 'باقیداری', 'debt', 'balance', 'پور', 'بیلانس'].some(term => q.includes(term))) {
    return localizeText(language, {
      en: `⚖️ Balances for "${projectName}":\n• Payables to suppliers and contractors: $${fmt(summary.totalDebtUSD)}\n• Receivables from apartment buyers: $${fmt(summary.salesDueUSD)}`,
      fa: `⚖️ وضعیت بدهی و طلب پروژهٔ «${projectName}»:\n• بدهی به عرضه‌کنندگان و قراردادیان: $${fmt(summary.totalDebtUSD)}\n• طلب از خریداران آپارتمان: $${fmt(summary.salesDueUSD)}`,
      ps: `⚖️ د «${projectName}» پروژې بیلانسونه:\n• عرضه‌کوونکو او قراردادیانو ته پور: $${fmt(summary.totalDebtUSD)}\n• د اپارتمان له پېرودونکو پاتې پیسې: $${fmt(summary.salesDueUSD)}`,
    });
  }

  if (['پروژه', 'ساختمان', 'project', 'تعمیر', 'پروژې', 'ودانۍ'].some(term => q.includes(term))) {
    const list = allProjects.map(project => `${project.name} (${project.city}): ${project.floors} floors, ${project.units} units`).join('\n');
    return localizeText(language, {
      en: `🏢 Your construction projects:\n${list}`,
      fa: `🏢 فهرست پروژه‌های ساختمانی شما:\n${allProjects.map(project => `${project.name} (${project.city}): ${project.floors} منزل، ${project.units} واحد`).join('\n')}`,
      ps: `🏢 ستاسو د ودانیزو پروژو لېست:\n${allProjects.map(project => `${project.name} (${project.city}): ${project.floors} پوړه، ${project.units} واحدونه`).join('\n')}`,
    });
  }

  return localizeText(language, {
    en: `📋 Current status of "${projectName}":\n• Rebar: ${fmt(summary.totalSteelTons)} tons ($${fmt(summary.steelCostUSD)})\n• Concrete: ${fmt(summary.totalConcreteM3)} m³ ($${fmt(summary.concreteCostUSD)})\n• Construction expenses: $${fmt(summary.totalExpensesUSD)}\n• Apartments sold: ${summary.apartmentsSold} of ${summary.apartmentsTotal} (${summary.apartmentsAvailable} available)\n• Buyer balances due: $${fmt(summary.salesDueUSD)}`,
    fa: `📋 خلاصهٔ وضعیت فعلی پروژهٔ «${projectName}»:\n• سیخ‌گول مصرف‌شده: ${fmt(summary.totalSteelTons)} تن ($${fmt(summary.steelCostUSD)})\n• کانکریت‌ریزی: ${fmt(summary.totalConcreteM3)} متر مکعب ($${fmt(summary.concreteCostUSD)})\n• مصارف ساختمانی: $${fmt(summary.totalExpensesUSD)}\n• آپارتمان‌های فروخته‌شده: ${summary.apartmentsSold} از ${summary.apartmentsTotal} (${summary.apartmentsAvailable} موجود)\n• طلب باقی‌مانده از خریداران: $${fmt(summary.salesDueUSD)}`,
    ps: `📋 د «${projectName}» پروژې اوسنی لنډیز:\n• سیخ‌ګول: ${fmt(summary.totalSteelTons)} ټنه ($${fmt(summary.steelCostUSD)})\n• کانکریټ: ${fmt(summary.totalConcreteM3)} مکعب متره ($${fmt(summary.concreteCostUSD)})\n• د ودانیزو چارو لګښتونه: $${fmt(summary.totalExpensesUSD)}\n• پلورل شوي اپارتمانونه: له ${summary.apartmentsTotal} څخه ${summary.apartmentsSold} (${summary.apartmentsAvailable} شته)\n• له پېرودونکو پاتې پیسې: $${fmt(summary.salesDueUSD)}`,
  });
}
