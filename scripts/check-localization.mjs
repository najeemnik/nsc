import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, 'src');
const sourceFiles = [];
const sourceSuffixes = new Set(['.ts', '.tsx', '.js', '.jsx']);
const localizedCallNames = new Set(['tx', 't', 'localizeText']);
const userFacingCallNames = new Set([
  'setError',
  'setErrorMessage',
  'setFormError',
  'setLegacyExportMessage',
  'setMessage',
  'setSuccessMessage',
  'setWarningMessage',
  'alert',
  'confirm',
  'prompt',
]);
const languageVariableNames = new Set(['language', 'currentLanguage', 'lang']);
const errors = [];
const arabicLetters = /[\u0620-\u064A\u066E-\u06D3\u06FA-\u06FC\u0750-\u077F\u08A0-\u08FF]/u;
const latinLetters = /[A-Za-z]/u;
const meaningfulLatinWord = /[A-Za-z]{3,}/u;
const userFacingJsxAttributes = new Set(['alt', 'aria-description', 'aria-label', 'label', 'placeholder', 'title']);
const clickableInputTypes = new Set(['button', 'reset', 'submit']);
const nonUserFacingJsxAttributes = new Set([
  'className', 'style', 'id', 'key', 'type', 'role', 'name', 'htmlFor', 'href', 'src', 'target', 'rel',
  'tabIndex', 'width', 'height', 'colSpan', 'rowSpan', 'download', 'autoComplete', 'inputMode',
]);
const internalObjectProperties = new Set([
  'action', 'actionId', 'amount', 'background', 'backgroundColor', 'borderColor', 'categoryId', 'categoryKey', 'status', 'paymentStatus',
  'chip', 'className', 'code', 'color', 'currency', 'dataKey', 'day', 'event', 'feature', 'featureId', 'field', 'fieldName',
  'format', 'from', 'grad', 'height', 'hour', 'hour12', 'href', 'icon', 'id', 'key', 'kind', 'locale', 'method', 'minute', 'mode', 'month', 'nameKey', 'permission',
  'path', 'route', 'second', 'sectionId', 'slug', 'source', 'src', 'style', 'tabId', 'target', 'tone', 'to', 'type',
  'unit', 'value', 'variant', 'weekday', 'width', 'year',
]);
const invariantUiLabels = new Set([
  'a4', 'afn', 'ai', 'api', 'c25', 'c30', 'c35', 'c40', 'csv', 'dab', 'gif', 'jpg', 'jpeg',
  'en', 'fa', 'ps', 'auto', 'light', 'dark', 'esc', 'nik', 'an', 'niksmartcountcom', 'shahhostnvmessdsilver', 'glassmorphism', 'googledrive', 'json', 'kb', 'kg', 'm2', 'm3', 'mm', 'nsc', 'niksmartcount', 'office7', 'pdf', 'png',
  'psi', 'qr', 'p&l', 'pv', 'rv', 'pcv', 'svg', 'tin', 'usd', 'wip', 'cogs', 'xml',
  '3000psi', '4000psi', '4500psi',
]);
const localeNames = ['en', 'fa', 'ps'];
const localeCatalogKeys = loadLocaleCatalogKeys();

function listSourceFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      listSourceFiles(entryPath);
    } else if (sourceSuffixes.has(path.extname(entry.name))) {
      sourceFiles.push(entryPath);
    }
  }
}

function parseSource(file, code) {
  try {
    return parse(code, {
      sourceType: 'unambiguous',
      plugins: ['typescript', 'jsx', 'decorators-legacy'],
      errorRecovery: false,
    });
  } catch (error) {
    errors.push(`${path.relative(projectRoot, file)}: parse error: ${error.message}`);
    return null;
  }
}

function getPropertyName(node) {
  if (node?.type !== 'ObjectProperty') return null;
  if (node.key?.type === 'Identifier') return node.key.name;
  if (node.key?.type === 'StringLiteral') return node.key.value;
  return null;
}

function objectProperty(object, name) {
  if (object?.type !== 'ObjectExpression') return null;
  return object.properties.find(property => getPropertyName(property) === name) ?? null;
}

function loadLocaleCatalogKeys() {
  const catalogPath = path.join(sourceRoot, 'i18n', 'translations.ts');
  const code = fs.readFileSync(catalogPath, 'utf8');
  const ast = parseSource(catalogPath, code);
  if (!ast) return new Map(localeNames.map(locale => [locale, new Set()]));

  let translationsObject = null;
  walkAst(ast, [], node => {
    if (node.type === 'VariableDeclarator' && node.id?.type === 'Identifier' && node.id.name === 'translations') {
      translationsObject = node.init;
    }
  });

  const keySets = new Map();
  for (const locale of localeNames) {
    const localeProperty = objectProperty(translationsObject, locale);
    const localeObject = localeProperty?.value;
    const keys = localeObject?.type === 'ObjectExpression'
      ? new Set(localeObject.properties.map(getPropertyName).filter(Boolean))
      : new Set();
    keySets.set(locale, keys);
  }

  const baseKeys = keySets.get('en');
  for (const locale of ['fa', 'ps']) {
    for (const key of baseKeys) {
      if (!keySets.get(locale).has(key)) {
        errors.push(`src/i18n/translations.ts: translation key "${key}" is missing its ${locale} value.`);
      }
    }
    for (const key of keySets.get(locale)) {
      if (!baseKeys.has(key)) {
        errors.push(`src/i18n/translations.ts: translation key "${key}" has no matching English value.`);
      }
    }
  }

  return keySets;
}

function walkAst(node, ancestors, visit) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const child of node) walkAst(child, ancestors, visit);
    return;
  }
  if (typeof node.type !== 'string') return;

  visit(node, ancestors);
  const nextAncestors = [...ancestors, node];
  for (const [key, value] of Object.entries(node)) {
    if (key === 'loc' || key === 'start' || key === 'end' || key === 'extra' || key === 'leadingComments' || key === 'innerComments' || key === 'trailingComments') continue;
    if (Array.isArray(value)) {
      for (const child of value) walkAst(child, nextAncestors, visit);
    } else if (value && typeof value === 'object' && typeof value.type === 'string') {
      walkAst(value, nextAncestors, visit);
    }
  }
}

function calleeIdentifier(node) {
  if (node?.type === 'Identifier') return node.name;
  if (node?.type === 'MemberExpression' && !node.computed && node.property?.type === 'Identifier') {
    return node.property.name;
  }
  return null;
}

function nodeText(node) {
  if (node?.type === 'StringLiteral') return node.value;
  if (node?.type === 'TemplateLiteral') return node.quasis.map(part => part.value.cooked ?? part.value.raw).join(' ');
  if (node?.type === 'JSXText') return node.value;
  return '';
}

function normalizedToken(text) {
  return text.toLowerCase().replace(/[^a-z0-9&]/gu, '');
}

function isInvariantUiLabel(text) {
  const normalized = normalizedToken(text);
  const isEmailAddress = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/iu.test(text);
  const isPhonePattern = /^\+?\d[\d\s().-]*(?:\.{2,3})?$/u.test(text);
  const isConcreteStrengthGrade = /^\d+\s*psi\s*\(c\d+\)$/iu.test(text);
  const isRebarSizeExample = /^\d+(?:\.\d+)?\s*mm\s*\/\s*\d+(?:\.\d+)?\s*mm$/iu.test(text);
  const isSerialNumberExample = /^sn-[a-z0-9-]+\.{2,3}$/iu.test(text);
  const isVoucherPrefix = /^#[a-z]+-$/iu.test(text);
  return isEmailAddress || isPhonePattern || isConcreteStrengthGrade || isRebarSizeExample || isSerialNumberExample || isVoucherPrefix || invariantUiLabels.has(normalized) || /^\d+(?:\.\d+)?(?:%|psi|afn|usd|kg|mm|m2|m3)$/u.test(normalized);
}

function isCssUtilityClassList(text) {
  const tokens = text.trim().split(/\s+/u);
  if (!tokens.length || tokens.some(token => !token)) return false;
  const utilityPrefix = /^(?:(?:dark|hover|focus|active|disabled|sm|md|lg|xl|2xl|group-hover):)*(?:bg|text|border|rounded|shadow|ring|font|flex|grid|w|h|p|px|py|pt|pb|ps|pe|m|mx|my|mt|mb|ms|me|gap|items|justify|outline|opacity|transition|duration|ease|cursor|whitespace|overflow|truncate|inline|block|hidden|absolute|relative|fixed|sticky|top|bottom|start|end|z|shrink|grow|leading|tracking|select|pointer-events)-/u;
  return tokens.every(token => utilityPrefix.test(token) || /^(?:dark|hover|focus|active|disabled|sm|md|lg|xl|2xl):[a-z-]+(?:\[[^\]]+\])?$/u.test(token));
}

function hasUnlocalizedUiText(node) {
  const text = nodeText(node).trim();
  if (/^#[0-9a-f]{3,8}$/iu.test(text) || /^[A-Z0-9]+(?:[-_][A-Z0-9]+)+$/iu.test(text) || isCssUtilityClassList(text)) return false;
  if (arabicLetters.test(text)) return true;
  if (!latinLetters.test(text)) return false;
  const normalized = normalizedToken(text);
  return normalized.length > 1 && !isInvariantUiLabel(text);
}

function report(file, node, message) {
  errors.push(`${path.relative(projectRoot, file)}:${node.loc?.start.line ?? '?'}:${node.loc?.start.column ?? '?'} ${message}`);
}

function isLocaleDataProperty(node, parent) {
  if (parent?.type !== 'ObjectProperty' || parent.value !== node) return false;
  return new Set([
    'en', 'fa', 'ps',
    'labelEn', 'labelFa', 'labelPs',
    'nameEn', 'nameFa', 'namePs',
    'titleEn', 'titleFa', 'titlePs',
    'descriptionEn', 'descriptionFa', 'descriptionPs',
    'placeholderEn', 'placeholderFa', 'placeholderPs',
    'badgeEn', 'badgeFa', 'badgePs',
  ]).has(getPropertyName(parent));
}

function isInsideLocalizedCall(ancestors) {
  return ancestors.some(node =>
    node.type === 'CallExpression' && localizedCallNames.has(calleeIdentifier(node.callee))
  );
}

function isInUserFacingCall(ancestors) {
  return ancestors.some(node =>
    node.type === 'CallExpression' && userFacingCallNames.has(calleeIdentifier(node.callee))
  );
}

function enclosingJsxAttribute(ancestors) {
  return [...ancestors].reverse().find(parent => parent.type === 'JSXAttribute') ?? null;
}

function isUserFacingAttribute(attribute, ancestors) {
  if (userFacingJsxAttributes.has(attribute?.name?.name)) return true;
  if (attribute?.name?.name !== 'value') return false;
  const opening = [...ancestors].reverse().find(parent => parent.type === 'JSXOpeningElement');
  if (opening?.name?.type !== 'JSXIdentifier' || opening.name.name !== 'input') return false;
  const typeAttribute = opening.attributes.find(item => item.type === 'JSXAttribute' && item.name?.name === 'type');
  return typeAttribute?.value?.type === 'StringLiteral' && clickableInputTypes.has(typeAttribute.value.value);
}

function isRenderedInJsx(node, ancestors) {
  if (node.type === 'JSXText') return true;
  const attribute = enclosingJsxAttribute(ancestors);
  if (attribute) return isUserFacingAttribute(attribute, ancestors);
  return ancestors.some(parent => parent.type === 'JSXExpressionContainer');
}

function isInternalObjectValue(node, parent) {
  return parent?.type === 'ObjectProperty' && parent.value === node && internalObjectProperties.has(getPropertyName(parent));
}

function isInternalDiscriminator(node, parent) {
  if (parent?.type === 'BinaryExpression' && ['===', '!==', '==', '!='].includes(parent.operator)) {
    return parent.left === node || parent.right === node;
  }
  if (parent?.type === 'ArrayExpression' && node.type === 'StringLiteral') {
    const internalOptions = new Set(['available', 'reserved', 'sold', 'planning', 'in_construction', 'finishing', 'completed', 'paid', 'pending', 'initial', 'additional']);
    return internalOptions.has(node.value) && parent.elements.every(element =>
      element?.type === 'StringLiteral' && internalOptions.has(element.value)
    );
  }
  return parent?.type === 'SwitchCase' && parent.test === node;
}

function isInternalStatusValue(node, ancestors) {
  return ancestors.some((parent, index) =>
    parent.type === 'ObjectProperty' &&
    ['status', 'paymentStatus'].includes(getPropertyName(parent)) &&
    ancestors.slice(index + 1).includes(parent.value)
  );
}

function isLocalizedExpression(node) {
  if (!node || node.type !== 'CallExpression') return false;
  if (localizedCallNames.has(calleeIdentifier(node.callee))) return true;
  return node.callee?.type === 'MemberExpression'
    && node.callee.property?.name === 'replace'
    && isLocalizedExpression(node.callee.object);
}

function isTranslationPlaceholder(node, ancestors) {
  const call = ancestors.at(-1);
  if (call?.type !== 'CallExpression' || call.arguments[0] !== node || call.callee?.type !== 'MemberExpression') return false;
  if (call.callee.property?.name !== 'replace') return false;
  return isLocalizedExpression(call.callee.object);
}

function isLocaleFormattingArgument(node, ancestors) {
  return ancestors.some(parent =>
    parent.type === 'CallExpression' &&
    ['toLocaleDateString', 'toLocaleTimeString', 'toLocaleString'].includes(calleeIdentifier(parent.callee)) &&
    parent.arguments[0] === node
  );
}

function containsKnownTranslationCall(node) {
  if (!node || typeof node !== 'object') return false;
  if (Array.isArray(node)) return node.some(containsKnownTranslationCall);
  if (node.type === 'CallExpression' && calleeIdentifier(node.callee) === 't') {
    const key = node.arguments[0];
    return key?.type === 'StringLiteral' && localeNames.every(locale => localeCatalogKeys.get(locale)?.has(key.value));
  }
  return Object.entries(node).some(([key, value]) => {
    if (['loc', 'start', 'end', 'extra', 'leadingComments', 'innerComments', 'trailingComments'].includes(key)) return false;
    return value && typeof value === 'object' && containsKnownTranslationCall(value);
  });
}

function isKnownTranslationFallback(node, ancestors) {
  const parent = ancestors.at(-1);
  return parent?.type === 'LogicalExpression'
    && parent.operator === '||'
    && parent.right === node
    && containsKnownTranslationCall(parent.left);
}

function validateLocaleDataObject(node, file) {
  if (node.type !== 'ObjectExpression') return;
  const properties = new Map(node.properties.map(property => [getPropertyName(property), property]));
  const localeGroups = [
    { suffixes: ['en', 'fa', 'ps'], label: 'localized object' },
    ...['label', 'name', 'title', 'description', 'placeholder', 'badge'].map(field => ({
      suffixes: localeNames.map(locale => `${field}${locale[0].toUpperCase()}${locale.slice(1)}`),
      label: `${field} locale fields`,
    })),
  ];

  for (const group of localeGroups) {
    const present = group.suffixes.filter(key => properties.has(key));
    if (present.length < 2) continue;
    for (const key of group.suffixes) {
      const property = properties.get(key);
      const locale = key === 'en' || key === 'fa' || key === 'ps' ? key : key.slice(-2).toLowerCase();
      if (!property) {
        report(file, node, `${group.label} must provide English, Afghan Dari, and Pashto copy.`);
        continue;
      }
      if (property.value.type === 'StringLiteral' || property.value.type === 'TemplateLiteral') {
        validateLocalizedLiteral(property.value, locale, file, property.value);
      }
    }
  }
}

function isOptionValueAttribute(node, parent, opening) {
  if (parent?.type !== 'JSXAttribute' || parent.value !== node || parent.name?.name !== 'value') return false;
  return opening?.type === 'JSXOpeningElement' && opening.name?.type === 'JSXIdentifier' && opening.name.name === 'option';
}

function validateLocalizedLiteral(valueNode, locale, file, callNode) {
  const text = nodeText(valueNode).trim();
  if (!text) return;
  if (locale === 'en' && arabicLetters.test(text)) {
    report(file, callNode, 'English copy contains Arabic-script text; keep locale content in its own language.');
  }
  if ((locale === 'fa' || locale === 'ps') && !arabicLetters.test(text) && !isInvariantUiLabel(text) && meaningfulLatinWord.test(text)) {
    report(file, callNode, `${locale === 'fa' ? 'Afghan Dari' : 'Pashto'} copy appears to be English or missing native-script text.`);
  }
}

function checkLocalizedCall(node, file) {
  const name = calleeIdentifier(node.callee);
  if (name === 'tx') {
    if (node.arguments.length !== 3) {
      report(file, node, 'Every tx(...) call must provide English, Afghan Dari, and Pashto copy.');
      return;
    }
    for (let i = 0; i < localeNames.length; i++) {
      const argument = node.arguments[i];
      if (argument.type === 'StringLiteral' || argument.type === 'TemplateLiteral') {
        validateLocalizedLiteral(argument, localeNames[i], file, node);
      }
    }
    return;
  }

  if (name === 'localizeText' && node.arguments[1]?.type === 'ObjectExpression') {
    const localeProperties = new Map(node.arguments[1].properties.map(property => [getPropertyName(property), property]));
    for (const locale of localeNames) {
      const property = localeProperties.get(locale);
      if (!property) {
        report(file, node, `localizeText(...) is missing its required ${locale} copy.`);
      } else if (property.value.type === 'StringLiteral' || property.value.type === 'TemplateLiteral') {
        validateLocalizedLiteral(property.value, locale, file, node);
      }
    }
    return;
  }

  if (name === 't') {
    const keyArgument = node.arguments[0];
    if (keyArgument?.type === 'StringLiteral' && !localeCatalogKeys.get('en').has(keyArgument.value)) {
      report(file, keyArgument, `Unknown translation key "${keyArgument.value}"; add the same key to English, Afghan Dari, and Pashto.`);
    }
  }
}

function validateLocaleCatalog(file, ast) {
  const translationsObjectProperty = (() => {
    let found = null;
    walkAst(ast, [], node => {
      if (node.type === 'VariableDeclarator' && node.id?.type === 'Identifier' && node.id.name === 'translations') {
        found = node.init;
      }
    });
    return found;
  })();
  if (translationsObjectProperty?.type !== 'ObjectExpression') return;

  const localeValues = new Map();
  for (const locale of localeNames) {
    const localeObject = objectProperty(translationsObjectProperty, locale)?.value;
    const values = new Map();
    if (localeObject?.type === 'ObjectExpression') {
      for (const property of localeObject.properties) {
        const key = getPropertyName(property);
        if (key && (property.value.type === 'StringLiteral' || property.value.type === 'TemplateLiteral')) {
          values.set(key, property.value);
        }
      }
    }
    localeValues.set(locale, values);
  }

  for (const locale of localeNames) {
    for (const [key, valueNode] of localeValues.get(locale)) {
      const text = nodeText(valueNode).trim();
      if (!text) {
        report(file, valueNode, `${locale} translation "${key}" is empty.`);
        continue;
      }
      if (locale === 'en' && arabicLetters.test(text)) {
        report(file, valueNode, `English translation "${key}" contains Arabic-script text.`);
      }
      if ((locale === 'fa' || locale === 'ps') && !arabicLetters.test(text) && !isInvariantUiLabel(text) && meaningfulLatinWord.test(text)) {
        report(file, valueNode, `${locale === 'fa' ? 'Afghan Dari' : 'Pashto'} translation "${key}" appears to be untranslated English.`);
      }
    }
  }
}

listSourceFiles(sourceRoot);
for (const file of sourceFiles) {
  const relative = path.relative(sourceRoot, file).split(path.sep).join('/');
  if (relative === 'i18n/localize.ts' || relative.startsWith('data/')) continue;

  const code = fs.readFileSync(file, 'utf8');
  const ast = parseSource(file, code);
  if (!ast) continue;
  if (relative === 'i18n/translations.ts') {
    validateLocaleCatalog(file, ast);
    continue;
  }

  walkAst(ast, [], (node, ancestors) => {
    const parent = ancestors.at(-1);

    if (node.type === 'BinaryExpression' && ['===', '!=='].includes(node.operator)) {
      const leftIsLanguage = node.left?.type === 'Identifier' && languageVariableNames.has(node.left.name);
      const rightIsLanguage = node.right?.type === 'Identifier' && languageVariableNames.has(node.right.name);
      const comparedValue = leftIsLanguage ? node.right : rightIsLanguage ? node.left : null;
      if (comparedValue?.type === 'StringLiteral' && localeNames.includes(comparedValue.value)) {
        report(file, node, 'Use isCurrentLanguage(...) or localizeText(...) instead of a raw locale comparison.');
      }
    }

    if (node.type === 'CallExpression') checkLocalizedCall(node, file);
    if (node.type === 'ObjectExpression') validateLocaleDataObject(node, file);

    if (node.type === 'JSXText' && hasUnlocalizedUiText(node) && !isInsideLocalizedCall(ancestors)) {
      report(file, node, 'Unlocalized JSX text; wrap user-facing copy in tx(...), t(...), or localizeText(...).');
    }

    if (
      node.type === 'JSXAttribute' &&
      isUserFacingAttribute(node, ancestors) &&
      node.value?.type === 'StringLiteral' &&
      hasUnlocalizedUiText(node.value) &&
      !isOptionValueAttribute(node.value, node, parent)
    ) {
      report(file, node.value, `Unlocalized JSX attribute "${node.name?.name ?? 'unknown'}"; use a localized expression.`);
    }

    const isJsxAttributeString = parent?.type === 'JSXAttribute' && parent.value === node;
    if ((node.type === 'StringLiteral' || node.type === 'TemplateLiteral') && hasUnlocalizedUiText(node) && !isJsxAttributeString) {
      const localized = isInsideLocalizedCall(ancestors);
      const localeData = isLocaleDataProperty(node, parent);
      const optionValue = isOptionValueAttribute(node, parent, ancestors.at(-2));
      const rendered = isRenderedInJsx(node, ancestors);
      const userFacing = isInUserFacingCall(ancestors);
      const internalValue = isInternalObjectValue(node, parent) || isInternalDiscriminator(node, parent) || isInternalStatusValue(node, ancestors) || isTranslationPlaceholder(node, ancestors) || isLocaleFormattingArgument(node, ancestors);
      const translatedFallback = isKnownTranslationFallback(node, ancestors);
      if (!localized && !localeData && !optionValue && !internalValue && !translatedFallback && (rendered || userFacing)) {
        report(file, node, 'UI and error copy must use tx(...) or localizeText(...) with English, Afghan Dari, and Pashto text.');
      }
    }
  });
}

if (errors.length > 0) {
  console.error(`Localization check failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`  ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Localization check passed (${sourceFiles.length} source files scanned).`);
}
