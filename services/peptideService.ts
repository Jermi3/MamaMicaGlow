import { supabase } from '@/lib/supabase';

// Types matching the database schema
export interface DosingInfo {
    vialSize: string;
    frequency: string;
    subcutaneous: string;
    reconstitution: string;
    notes?: string;
}

export interface Peptide {
    id: string;
    name: string;
    strength: string;
    vendor: string;
    category: string;
    created_at: string;
    description: string;
    mechanism: string;
    half_life: string | null;
    storage: string;
    benefits: string[];
    side_effects: string[];
    contraindications: string[];
    dosing: DosingInfo[];
    stacking: string[];
    icon: string;
    is_active: boolean;
    vials_per_box: number;
    specifications: Record<string, any> | null;
    price_per_vial: number;
    price_per_box: number;
}

// Mock Data for Beta Testing/Development
const MOCK_PEPTIDES: Peptide[] = [
    {
        id: 'mock-1',
        name: 'Semaglutide',
        strength: '5mg',
        vendor: 'ResearchChem',
        category: 'Weight Management',
        created_at: new Date().toISOString(),
        description: 'GLP-1 agonist used for weight management and blood sugar control.',
        mechanism: 'Mimics the GLP-1 hormone, increasing insulin secretion, suppressing glucagon, and slowing gastric emptying.',
        half_life: '7 days',
        storage: 'Refrigerated (2-8°C)',
        benefits: ['Weight Loss', 'Appetite Suppression', 'Improved Blood Sugar'],
        side_effects: ['Nausea', 'Gastrointestinal discomfort', 'Fatigue'],
        contraindications: ['History of thyroid medullary cancer', 'Pregnancy'],
        dosing: [{
            vialSize: '5mg',
            frequency: 'Weekly',
            subcutaneous: '0.25mg (startup)',
            reconstitution: '2ml Bacteriostatic Water',
            notes: 'Start low and titrate up every 4 weeks.'
        }],
        stacking: ['BPC-157', 'Cagrilintide'],
        icon: 'Droplets',
        is_active: true,
        vials_per_box: 1,
        specifications: null,
        price_per_vial: 0,
        price_per_box: 0
    },
    {
        id: 'mock-2',
        name: 'Tirzepatide',
        strength: '10mg',
        vendor: 'PeptideScience',
        category: 'Weight Management',
        created_at: new Date().toISOString(),
        description: 'Dual GIP and GLP-1 receptor agonist.',
        mechanism: 'Activates both GIP and GLP-1 receptors for enhanced metabolic regulation.',
        half_life: '5 days',
        storage: 'Refrigerated',
        benefits: ['Significant Weight Loss', 'Glycemic Control'],
        side_effects: ['Nausea', 'Diarrhea'],
        contraindications: ['Pregnancy', 'Pancreatitis history'],
        dosing: [{
            vialSize: '10mg',
            frequency: 'Weekly',
            subcutaneous: '2.5mg',
            reconstitution: '1ml Bacteriostatic Water'
        }],
        stacking: ['AOD-9604'],
        icon: 'Sparkles',
        is_active: true,
        vials_per_box: 1,
        specifications: null,
        price_per_vial: 0,
        price_per_box: 0
    },
    {
        id: 'mock-3',
        name: 'BPC-157',
        strength: '5mg',
        vendor: 'HealingLabs',
        category: 'Healing & Recovery',
        created_at: new Date().toISOString(),
        description: 'Body Protection Compound 157, promoting healing of tendons and gut.',
        mechanism: 'Accelerates angiogenic repair and healing of soft tissues.',
        half_life: '4 hours',
        storage: 'Refrigerated',
        benefits: ['Tendon Repair', 'Gut Health', 'Reduced Inflammation'],
        side_effects: ['Rare mild headaches'],
        contraindications: ['None known'],
        dosing: [{
            vialSize: '5mg',
            frequency: 'Daily',
            subcutaneous: '250mcg twice daily',
            reconstitution: '2ml Bac Water'
        }],
        stacking: ['TB-500'],
        icon: 'Heart',
        is_active: true,
        vials_per_box: 1,
        specifications: null,
        price_per_vial: 0,
        price_per_box: 0
    },
    {
        id: 'mock-4',
        name: 'TB-500',
        strength: '5mg',
        vendor: 'RecoveryPeptides',
        category: 'Healing & Recovery',
        created_at: new Date().toISOString(),
        description: 'Synthetic fraction of Thymosin Beta-4.',
        mechanism: 'Promotes cell migration and actin polymerization.',
        half_life: '2-3 days',
        storage: 'Refrigerated',
        benefits: ['Muscle Recovery', 'Flexibility', 'Reduced Scar Tissue'],
        side_effects: ['Fatigue (rare)'],
        contraindications: [],
        dosing: [{
            vialSize: '5mg',
            frequency: '2x Weekly',
            subcutaneous: '2.5mg',
            reconstitution: '2ml Bac Water'
        }],
        stacking: ['BPC-157'],
        icon: 'Activity',
        is_active: true,
        vials_per_box: 1,
        specifications: null,
        price_per_vial: 0,
        price_per_box: 0
    },
    {
        id: 'mock-5',
        name: 'Retatrutide',
        strength: '10mg',
        vendor: 'TriAgonist',
        category: 'Retatrutide',
        created_at: new Date().toISOString(),
        description: 'Triple agonist (GLP-1, GIP, Glucagon).',
        mechanism: 'Targets three hunger and metabolism pathways.',
        half_life: '6 days',
        storage: 'Refrigerated',
        benefits: ['Rapid Fat Loss', 'Metabolic Boost'],
        side_effects: ['Increased Heart Rate', 'Nausea'],
        contraindications: [],
        dosing: [{
            vialSize: '10mg',
            frequency: 'Weekly',
            subcutaneous: '2mg',
            reconstitution: '2ml Bac Water'
        }],
        stacking: [],
        icon: 'Zap',
        is_active: true,
        vials_per_box: 1,
        specifications: null,
        price_per_vial: 0,
        price_per_box: 0
    },
    {
        id: 'mock-6',
        name: 'Ipamorelin',
        strength: '2mg',
        vendor: 'GrowthPlus',
        category: 'Growth Hormone',
        created_at: new Date().toISOString(),
        description: 'Growth hormone secretagogue.',
        mechanism: 'Stimulates pituitary to release growth hormone without increasing hunger.',
        half_life: '2 hours',
        storage: 'Refrigerated',
        benefits: ['Better Sleep', 'Muscle Tone', 'Anti-Aging'],
        side_effects: ['Water Retention (rare)'],
        contraindications: [],
        dosing: [{
            vialSize: '2mg',
            frequency: 'Daily (Night)',
            subcutaneous: '200mcg',
            reconstitution: '2ml Bac Water'
        }],
        stacking: ['CJC-1295'],
        icon: 'Zap',
        is_active: true,
        vials_per_box: 1,
        specifications: null,
        price_per_vial: 0,
        price_per_box: 0
    },
    {
        id: 'mock-7',
        name: 'CJC-1295 (No DAC)',
        strength: '2mg',
        vendor: 'GrowthPlus',
        category: 'Growth Hormone',
        created_at: new Date().toISOString(),
        description: 'GHRH analogue.',
        mechanism: 'Amplifies GH pulses.',
        half_life: '30 mins',
        storage: 'Refrigerated',
        benefits: ['Lean Muscle', 'Fat Loss'],
        side_effects: ['Flushing', 'Headache'],
        contraindications: [],
        dosing: [{
            vialSize: '2mg',
            frequency: 'Daily',
            subcutaneous: '100mcg',
            reconstitution: '2ml Bac Water'
        }],
        stacking: ['Ipamorelin'],
        icon: 'Zap',
        is_active: true,
        vials_per_box: 1,
        specifications: null,
        price_per_vial: 0,
        price_per_box: 0
    },
    {
        id: 'mock-8',
        name: 'Bac Water',
        strength: '30ml',
        vendor: 'Supplies',
        category: 'Accessories & Supplies',
        created_at: new Date().toISOString(),
        description: 'Bacteriostatic Water for Injection.',
        mechanism: 'Solvent for peptides.',
        half_life: null,
        storage: 'Room Temp',
        benefits: ['Sterile', 'Multi-use'],
        side_effects: [],
        contraindications: [],
        dosing: [{
            vialSize: '30ml',
            frequency: 'As needed',
            subcutaneous: 'N/A',
            reconstitution: 'N/A'
        }],
        stacking: [],
        icon: 'Package',
        is_active: true,
        vials_per_box: 1,
        specifications: null,
        price_per_vial: 0,
        price_per_box: 0
    }
];

// Fetch all active peptides
export const fetchPeptides = async (): Promise<Peptide[]> => {
    const { data, error } = await supabase
        .from('peptides')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

    if (error) {
        console.warn('Error fetching peptides, falling back to mock data:', error);
        return MOCK_PEPTIDES;
    }

    if (!data || data.length === 0) {
        console.log('No peptides in DB, using mock data.');
        return MOCK_PEPTIDES;
    }

    return data;
};

// Fetch peptides by category
export const fetchPeptidesByCategory = async (category: string): Promise<Peptide[]> => {
    const { data, error } = await supabase
        .from('peptides')
        .select('*')
        .eq('is_active', true)
        .eq('category', category)
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching peptides by category:', error);
        throw error;
    }

    return data || [];
};

// Fetch a single peptide by ID
export const fetchPeptideById = async (id: string): Promise<Peptide | null> => {
    const { data, error } = await supabase
        .from('peptides')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching peptide:', error);
        throw error;
    }

    return data;
};

// Get unique categories from peptides
export const fetchCategories = async (): Promise<string[]> => {
    const { data, error } = await supabase
        .from('peptides')
        .select('category')
        .eq('is_active', true);

    if (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }

    // Get unique categories
    const categories = [...new Set(data?.map(p => p.category) || [])];
    return categories.sort();
};

// Search peptides by name
export const searchPeptides = async (query: string): Promise<Peptide[]> => {
    const { data, error } = await supabase
        .from('peptides')
        .select('*')
        .eq('is_active', true)
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true });

    if (error) {
        console.error('Error searching peptides:', error);
        throw error;
    }

    return data || [];
};
