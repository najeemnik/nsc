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
  allProjects: Array<{ name: string; floors: number; units: number; city: string }>
): string {
  const q = question.toLowerCase().trim();

  // Steel / Rebar question
  if (q.includes('سیخ') || q.includes('فولاد') || q.includes('steel') || q.includes('rebar') || q.includes('آهن')) {
    return `📊 در پروژه "${summary.projectName}" تا اکنون مجموعاً ${summary.totalSteelTons.toLocaleString()} تن سیخ‌گول به ارزش $${summary.steelCostUSD.toLocaleString()} دالر خریداری و ثبت گردیده است.`;
  }

  // Concrete question
  if (q.includes('کانکریت') || q.includes('کانکریت‌ریزی') || q.includes('concrete') || q.includes('پمپ') || q.includes('متر مکعب')) {
    return `🏗️ حجم مجموعی کانکریت ثبت شده برای "${summary.projectName}" بالغ بر ${summary.totalConcreteM3.toLocaleString()} متر مکعب با هزینه مجموعی $${summary.concreteCostUSD.toLocaleString()} دالر می‌باشد.`;
  }

  // Apartments & Sales question
  if (
    q.includes('آپارتمان') || 
    q.includes('فروش') || 
    q.includes('باقی') || 
    q.includes('قسط') || 
    q.includes('مشتری') || 
    q.includes('apartment') || 
    q.includes('sold')
  ) {
    return `🏢 وضعیت آپارتمان‌های پروژه "${summary.projectName}":
• تعداد کل واحدها: ${summary.apartmentsTotal} واحد
• فروخته شده: ${summary.apartmentsSold} واحد
• واحد‌های باقیمانده (خالی): ${summary.apartmentsAvailable} واحد
• ارزش کل فروش: $${summary.totalSalesValueUSD.toLocaleString()}
• مبلغ وصول شده: $${summary.salesReceivedUSD.toLocaleString()}
• باقی‌داری از خریداران: $${summary.salesDueUSD.toLocaleString()}`;
  }

  // Expenses & Costs
  if (q.includes('مصرف') || q.includes('هزینه') || q.includes('خرچ') || q.includes('expense') || q.includes('cost')) {
    return `💰 مصارف و خروجی مالی پروژه "${summary.projectName}":
• کل مصارف و خریدهای ثبت شده: $${summary.totalExpensesUSD.toLocaleString()}
• مجموع پرداختی‌ها: $${summary.totalPaidUSD.toLocaleString()}
• کل قرضداری‌های باقیمانده (طلبکاران): $${summary.totalDebtUSD.toLocaleString()}`;
  }

  // Debts & Balances
  if (q.includes('قرض') || q.includes('طلب') || q.includes('باقیداری') || q.includes('debt') || q.includes('balance')) {
    return `⚖️ وضعیت بدهی و طلبکاری پروژه "${summary.projectName}":
• بدهی پروژه به تأمین‌کنندگان و قراردادی‌ها: $${summary.totalDebtUSD.toLocaleString()}
• طلب پروژه از خریداران آپارتمان (اقساط معوق): $${summary.salesDueUSD.toLocaleString()}`;
  }

  // All Projects summary
  if (q.includes('پروژه') || q.includes('ساختمان') || q.includes('project') || q.includes('تعمیر')) {
    const list = allProjects.map(p => `• ${p.name} (${p.city}): ${p.floors} منزل، ${p.units} واحد`).join('\n');
    return `🏢 فهرست پروژه‌های ساختمانی شما:\n${list}`;
  }

  // Default response summarizing current active project stats
  return `📋 خلاصه وضعیت فعلی پروژه "${summary.projectName}":
• سیخ مصرفی: ${summary.totalSteelTons.toLocaleString()} تن ($${summary.steelCostUSD.toLocaleString()})
• کانکریت‌ریزی: ${summary.totalConcreteM3.toLocaleString()} متر مکعب ($${summary.concreteCostUSD.toLocaleString()})
• کل هزینه‌های عمرانی: $${summary.totalExpensesUSD.toLocaleString()}
• وضعیت فروشات: ${summary.apartmentsSold} از ${summary.apartmentsTotal} واحد فروخته شده (${summary.apartmentsAvailable} واحد آزاد)
• اقساط باقیمانده از مشتریان: $${summary.salesDueUSD.toLocaleString()}`;
}
