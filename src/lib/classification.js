/**
 * Regra de classificação automática de veículos pela legenda do Instagram.
 * Portado 1:1 de base44/shared/classification.js — mesma lógica exata,
 * reaproveitada tanto no frontend (reprocessar) quanto no backend (sync).
 *
 * Regras:
 * - normalizar legenda (caixa alta, sem acento)
 * - is_blindado = contém BLINDADO / BLINDADA / BLINDAGEM
 * - is_vendido = contém VENDIDO / VENDIDA / VENDIDOS / VENDIDAS
 * - categoria = "vendido" se is_vendido, senão "blindado" se is_blindado, senão "portfolio"
 */

export function normalizeCaption(caption) {
  if (!caption) return '';
  return caption
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/[^A-Z0-9\s]/g, ' '); // mantém alfanuméricos e espaços
}

export function classifyVehicle(caption) {
  const norm = normalizeCaption(caption);
  const is_blindado = norm.includes('BLINDAD') || norm.includes('BLINDAGEM');
  const is_vendido = norm.includes('VENDID');

  let category;
  if (is_vendido) category = 'vendido';
  else if (is_blindado) category = 'blindado';
  else category = 'portfolio';

  return { is_blindado, is_vendido, category };
}

/**
 * Constrói o objeto de update com os campos de classificação.
 * Se is_vendido e sem data_venda, preenche com a data atual.
 */
export function buildClassificationUpdate(caption, existingDataVenda) {
  const { is_blindado, is_vendido, category } = classifyVehicle(caption);
  const update = { is_blindado, is_vendido, category };
  if (is_vendido && !existingDataVenda) {
    update.data_venda = new Date().toISOString().split('T')[0];
  }
  return update;
}

/**
 * NOVO (não existia no Base44): extrai título/ano/preço/km da legenda sem
 * depender de LLM — o Base44 usava Core.InvokeLLM (pago, só funciona dentro
 * do Base44). Aqui é tudo regex/heurística, roda de graça.
 *
 * Não é tão esperto quanto uma LLM pra legendas muito "criativas", mas cobre
 * o padrão real das legendas do @cadu.motors (MARCA MODELO VERSÃO, ano,
 * "R$ 00.000", "00.000 km"). Dá pra sempre editar na mão em Admin → Editar.
 */
export function parseCaption(caption) {
  const text = caption || '';

  // Título = primeira linha não vazia da legenda, sem emojis/hashtags
  const firstLine = text
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0) || '';
  const title = firstLine
    .replace(/#[^\s#]+/g, '') // remove hashtags
    .replace(/[^\p{L}\p{N}\s./-]/gu, '') // remove emojis/símbolos, mantém letras/números/./-
    .trim()
    .slice(0, 120);

  // Ano: primeiro número de 4 dígitos entre 1990 e o ano atual+1
  const maxYear = new Date().getFullYear() + 1;
  const yearMatch = text.match(/\b(19[9]\d|20[0-4]\d)\b/);
  const year = yearMatch && Number(yearMatch[1]) <= maxYear ? Number(yearMatch[1]) : null;

  // Preço: "R$ 69.900", "R$69900", "69.900,00"
  const priceMatch = text.match(/R\$\s*([\d.,]+)/i);
  let price = null;
  if (priceMatch) {
    const digits = priceMatch[1].replace(/\./g, '').replace(/,\d+$/, '');
    const n = parseInt(digits, 10);
    if (!isNaN(n)) price = n;
  }

  // Km: "45.000 km", "45000km"
  const kmMatch = text.match(/([\d.]{2,10})\s*km\b/i);
  let km = null;
  if (kmMatch) {
    const n = parseInt(kmMatch[1].replace(/\./g, ''), 10);
    if (!isNaN(n)) km = n;
  }

  // Descrição = legenda inteira, sem hashtags, pronta pra exibir
  const description = text.replace(/#[^\s#]+/g, '').trim();

  return { title, year, price, km, description };
}
