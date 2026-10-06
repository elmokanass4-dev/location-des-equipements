import { GoogleGenAI } from '@google/genai';

// Initialize SDK safely
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || (typeof window !== 'undefined' && (window as unknown as { GEMINI_API_KEY?: string }).GEMINI_API_KEY);
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export interface DamageAnalysisResult {
  severity: 'low' | 'moderate' | 'severe';
  suggestedAction: string;
  estimatedCostRangeMAD: string;
  routeToMaintenanceRecommended: boolean;
  notes: string;
}

/**
 * Analyzes equipment return condition notes or damage report to help staff
 * determine appropriate maintenance actions and deposit deduction estimates.
 */
export async function analyzeConditionAndDamage(
  equipmentName: string,
  issueDescription: string,
  replacementValueMAD: number
): Promise<DamageAnalysisResult> {
  const ai = getAiClient();

  if (!ai) {
    // Intelligent fallback heuristic when Gemini API key is not configured
    const isSevere = /moteur|cassé|fissuré|brûlé|inutilisable|grillé|écrasé|fracturé/i.test(issueDescription);
    const estimatedDeduction = isSevere
      ? Math.round(replacementValueMAD * 0.25)
      : Math.round(Math.min(replacementValueMAD * 0.1, 500));

    return {
      severity: isSevere ? 'severe' : 'moderate',
      suggestedAction: isSevere
        ? 'Immobilisation immédiate en atelier SAV agréé et rétention de caution proportionnelle.'
        : 'Nettoyage technique approfondi ou remplacement d’accessoire consommable.',
      estimatedCostRangeMAD: `${Math.round(estimatedDeduction * 0.8)} - ${Math.round(estimatedDeduction * 1.3)} MAD`,
      routeToMaintenanceRecommended: isSevere,
      notes: 'Évaluation indicative standard Kriya basée sur la valeur à neuf de l’équipement.',
    };
  }

  try {
    const prompt = `
En tant qu'expert en gestion de parc de matériel de location au Maroc :
Équipement: "${equipmentName}" (Valeur à neuf: ${replacementValueMAD} MAD)
Constat lors de la restitution: "${issueDescription}"

Fournis une analyse technique concise au format JSON respectant strictement cette structure:
{
  "severity": "low" | "moderate" | "severe",
  "suggestedAction": "phrase courte sur l'intervention recommandée",
  "estimatedCostRangeMAD": "ex: 400 - 800 MAD",
  "routeToMaintenanceRecommended": true | false,
  "notes": "explication technique courte pour le gestionnaire"
}
Ne renvoie que le JSON valide sans balises markdown markdown.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    return JSON.parse(text) as DamageAnalysisResult;
  } catch (err) {
    console.warn('Gemini condition analysis fallback:', err);
    return {
      severity: 'moderate',
      suggestedAction: 'Contrôle physique approfondi par le responsable d’atelier.',
      estimatedCostRangeMAD: '300 - 900 MAD',
      routeToMaintenanceRecommended: true,
      notes: 'Évaluation locale en attente d’expertise atelier.',
    };
  }
}

/**
 * Generates or refines specialized contractual clauses for Moroccan rental agreements
 */
export async function generateRentalClause(
  equipmentName: string,
  specialCondition: string,
  language: 'fr' | 'ar'
): Promise<string> {
  const ai = getAiClient();

  if (!ai) {
    if (language === 'ar') {
      return `يلتزم المستأجر بالمحافظة التامة على ${equipmentName} والتقيد الصارم بشروط السلامة. يتحمل المستأجر المسؤولية المالية عن أي تلفيات ناتجة عن الاستعمال غير المطابق.`;
    }
    return `Le locataire s'engage à utiliser le matériel ${equipmentName} conformément aux préconisations du constructeur et sous sa responsabilité exclusive. Tout dommage résultant d'une utilisation non conforme fera l'objet d'une retenue sur caution.`;
  }

  try {
    const prompt = `
Génère une clause contractuelle concise et juridiquement claire pour un contrat de location de matériel au Maroc.
Équipement: ${equipmentName}
Condition spécifique demandée: ${specialCondition}
Langue cible: ${language === 'ar' ? 'Arabe classique' : 'Français'}

Réponds directement par le texte de la clause sans aucun commentaire introductif.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return response.text?.trim() || '';
  } catch (err) {
    console.warn('Gemini clause generation error:', err);
    return `Clause standard de garantie et d'entretien pour ${equipmentName}.`;
  }
}
