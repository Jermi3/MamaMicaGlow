/**
 * Expected Results - Emotionally resonant, peptide-specific messaging
 * Centralized data to avoid redundancy across screens
 */

export interface PeptideExpectation {
    /** Short description for peptide cards */
    cardMessage: string;
    /** Timeline for first noticeable effects */
    firstEffects: string;
    /** What users commonly feel/notice first */
    firstSigns: string;
}

export interface JourneyMilestone {
    week: string;
    title: string;
    desc: string;
}

// Peptide-specific expectations with emotionally resonant language
const PEPTIDE_EXPECTATIONS: Record<string, PeptideExpectation> = {
    // GLP-1 Agonists
    tirzepatide: {
        cardMessage: 'Food noise quiets, cravings fade',
        firstEffects: '1-2 weeks',
        firstSigns: 'Reduced appetite, feeling satisfied with less',
    },
    semaglutide: {
        cardMessage: 'Appetite naturally decreases',
        firstEffects: '2-3 weeks',
        firstSigns: 'Less interest in snacking, smaller portions feel enough',
    },

    // Healing & Recovery
    bpc: {
        cardMessage: 'Nagging aches begin to fade',
        firstEffects: '1-2 weeks',
        firstSigns: 'Reduced inflammation, faster recovery from workouts',
    },
    tb500: {
        cardMessage: 'Flexibility returns, stiffness eases',
        firstEffects: '2-3 weeks',
        firstSigns: 'Improved mobility, less morning stiffness',
    },

    // Anti-Aging & Skin
    ghk: {
        cardMessage: 'Skin feels firmer, sleep deepens',
        firstEffects: '4-6 weeks',
        firstSigns: 'Better sleep quality, skin appears more hydrated',
    },

    // Growth Hormone
    cjc: {
        cardMessage: 'Energy stabilizes, recovery improves',
        firstEffects: '2-4 weeks',
        firstSigns: 'Deeper sleep, feeling more rested upon waking',
    },
    ipamorelin: {
        cardMessage: 'Sleep quality improves noticeably',
        firstEffects: '1-2 weeks',
        firstSigns: 'Falling asleep easier, more vivid dreams',
    },

    // Fat Loss
    aod: {
        cardMessage: 'Stubborn areas respond to exercise',
        firstEffects: '4-6 weeks',
        firstSigns: 'Enhanced fat burning during workouts',
    },

    // Default fallback
    default: {
        cardMessage: 'Your body adapts and responds',
        firstEffects: '2-4 weeks',
        firstSigns: 'Subtle improvements that compound over time',
    },
};

/**
 * Get expected results for a peptide based on its name
 */
export function getExpectedResult(peptideName: string): PeptideExpectation {
    const name = peptideName.toLowerCase();

    // Check for matching peptide type
    for (const [key, expectation] of Object.entries(PEPTIDE_EXPECTATIONS)) {
        if (key !== 'default' && name.includes(key)) {
            return expectation;
        }
    }

    return PEPTIDE_EXPECTATIONS.default;
}

/**
 * Get journey milestones - emotionally resonant timeline
 */
export function getJourneyMilestones(): JourneyMilestone[] {
    return [
        {
            week: '1-2',
            title: 'Settling In',
            desc: 'Your body adjusts — some feel it right away'
        },
        {
            week: '3-4',
            title: 'First Wins',
            desc: 'Small changes you can feel, even if others don\'t see'
        },
        {
            week: '5-8',
            title: 'Visible Progress',
            desc: 'Others start noticing what you\'ve been feeling'
        },
        {
            week: '8+',
            title: 'New Normal',
            desc: 'Results compound, habits feel effortless'
        },
    ];
}

/**
 * Get a short hint for the home screen journey card
 */
export function getJourneyHint(peptideNames: string[]): string {
    if (peptideNames.length === 0) {
        return 'Add peptides to see your personalized timeline';
    }

    // Check for weight management peptides first
    const hasWeightPeptide = peptideNames.some(name =>
        name.toLowerCase().includes('tirze') ||
        name.toLowerCase().includes('sema')
    );

    if (hasWeightPeptide) {
        return 'Most users notice appetite changes within 2 weeks';
    }

    // Check for healing peptides
    const hasHealingPeptide = peptideNames.some(name =>
        name.toLowerCase().includes('bpc') ||
        name.toLowerCase().includes('tb')
    );

    if (hasHealingPeptide) {
        return 'Recovery improvements often felt within 1-2 weeks';
    }

    return 'First results expected in 2-4 weeks';
}
