type Classification = { category?: string; stage?: string };

const RULES: Array<{ match: RegExp; category: string; stage?: string }> = [
  { match: /contrato|contract/i, category: "contrato", stage: "Fechado" },
  { match: /proposta|proposal|orcamento|orçamento/i, category: "proposta", stage: "Proposta" },
  { match: /nota\s*fiscal|nf-e|nfe|invoice/i, category: "nota_fiscal", stage: "Fechado" },
  { match: /curr[ií]culo|cv|resume/i, category: "curriculo", stage: "Descoberta" },
];

export const classify = (file: { name: string; mimeType?: string; parents?: string[] }): Classification => {
  for (const rule of RULES) {
    if (rule.match.test(file.name)) return { category: rule.category, stage: rule.stage };
  }

  if (file.mimeType?.includes("pdf")) return { category: "pdf" };
  if (file.mimeType?.startsWith("image/")) return { category: "imagem" };

  return {};
};

