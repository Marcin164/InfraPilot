import api from "../lib/api";

export type EvidenceInclude = "audit" | "reports" | "tickets";

export const buildEvidencePack = async (input: {
  from: string;
  to: string;
  include: EvidenceInclude[];
  reportTypes?: string[];
}): Promise<Blob> => {
  const { data } = await api.post("/evidence/pack", input, {
    responseType: "blob",
  });
  return data;
};

export const downloadEvidencePack = async (input: {
  from: string;
  to: string;
  include: EvidenceInclude[];
  reportTypes?: string[];
}) => {
  const blob = await buildEvidencePack(input);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `evidence-${input.from}_${input.to}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
