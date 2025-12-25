import { GlowCard } from '@/components/GlowCard';
import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';
import { SoundButton } from '@/components/SoundButton';
import { StyledText } from '@/components/StyledText';
import { Colors, Layout } from '@/constants/Colors';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useRouter } from 'expo-router';
import {
    AlertTriangle,
    ChevronDown,
    ChevronLeft,
    ChevronUp,
    CreditCard,
    ExternalLink,
    FlaskConical,
    HelpCircle,
    Link2,
    LucideIcon,
    Package,
    Shield,
    Sparkles,
    Syringe,
    Truck,
    User,
    Users
} from 'lucide-react-native';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FAQCitation {
    title: string;
    source: string;
    pmid?: string;
    url?: string;
}

interface FAQItem {
    question: string;
    answer: string;
    citation?: FAQCitation;
}

interface FAQCategory {
    name: string;
    icon: LucideIcon;
    questions: FAQItem[];
}

const FAQ_DATA: FAQCategory[] = [
    {
        name: 'General Questions',
        icon: HelpCircle,
        questions: [
            {
                question: 'What are peptides, and how are they used in research?',
                answer: 'Peptides are short chains of amino acids researched for their potential effects on metabolism, tissue repair, anti-aging, neuroprotection, and more. The information provided is for laboratory and educational purposes only, compiled from clinical trials and research protocols as of September 25, 2025.',
                citation: { title: 'Therapeutic peptides: Historical perspectives', source: 'Drug Discov Today 2015', pmid: '25440903', url: 'https://pubmed.ncbi.nlm.nih.gov/25440903/' }
            },
            { question: 'Is this guide intended for human or veterinary use?', answer: 'No, this guide is not intended for human or veterinary use unless prescribed by a licensed medical professional. It is for research purposes only.' },
            { question: 'Where can I find instructions for preparing and injecting peptides?', answer: 'Refer to the Prep & Injection Guide linked in the peptide dosing guide for proper reconstitution, syringe sizing, and injection protocols.' },
            { question: 'Do you have a minimum order?', answer: 'No. There is no minimum order for individual or group buys.' },
            {
                question: 'What is Tirzepatide and where does it come from?',
                answer: 'U.S. FDA-approved Tirzepatide brands are Mounjaro and Zepbound. Other sources are typically from China.',
                citation: { title: 'FDA approves Mounjaro (tirzepatide)', source: 'FDA Press Release 2022', url: 'https://www.fda.gov/drugs/news-events-human-drugs/fda-approves-novel-dual-targeted-treatment-type-2-diabetes' }
            },
        ]
    },
    {
        name: 'Dosing and Administration',
        icon: Syringe,
        questions: [
            {
                question: 'How should I dose Semaglutide for weight loss research?',
                answer: 'For Semaglutide (3MG), mix with 0.6mL BAC water and dose once weekly subcutaneously, starting at 4 units (0.25mg) and increasing up to 40 units (2.5mg) over 4-week intervals.',
                citation: { title: 'Once-Weekly Semaglutide in Adults with Overweight or Obesity', source: 'N Engl J Med 2021', pmid: '33567185', url: 'https://pubmed.ncbi.nlm.nih.gov/33567185/' }
            },
            {
                question: 'What is the typical dosing schedule for BPC-157 in tissue repair studies?',
                answer: 'For BPC-157 (5MG), mix with 2mL BAC water and dose 250-500mcg (25-50 units) daily subcutaneously.',
                citation: { title: 'Stable gastric pentadecapeptide BPC 157', source: 'Curr Pharm Des 2018', pmid: '30426902', url: 'https://pubmed.ncbi.nlm.nih.gov/30426902/' }
            },
            {
                question: 'How often should Retatrutide be administered?',
                answer: 'Retatrutide (6MG) should be mixed with 1.2mL BAC water and dosed weekly subcutaneously, titrating from 20 units (1mg) over 4 weeks up to 120 units (6mg).',
                citation: { title: 'Triple-Hormone-Receptor Agonist Retatrutide for Obesity', source: 'N Engl J Med 2023', pmid: '37366315', url: 'https://pubmed.ncbi.nlm.nih.gov/37366315/' }
            },
        ]
    },
    {
        name: 'Benefits and Effects',
        icon: Sparkles,
        questions: [
            {
                question: 'What are the benefits of using Ipamorelin in research?',
                answer: 'Ipamorelin increases growth hormone for muscle growth, improves sleep, metabolism, and energy, based on research data.',
                citation: { title: 'Ipamorelin, the first selective growth hormone secretagogue', source: 'Eur J Endocrinol 1998', pmid: '9892541', url: 'https://pubmed.ncbi.nlm.nih.gov/9892541/' }
            },
            {
                question: 'Can Melanotan 2 help with tanning?',
                answer: 'Yes, Melanotan 2 promotes skin pigmentation for UV protection, as shown in research models.',
                citation: { title: 'Melanotan II: an investigation of tanning effects', source: 'Pigment Cell Res 2000', pmid: '10714573', url: 'https://pubmed.ncbi.nlm.nih.gov/10714573/' }
            },
            {
                question: 'What does NAD+ do in anti-aging studies?',
                answer: 'NAD+ enhances energy, DNA repair, and supports anti-aging and metabolic functions by boosting sirtuins and mitochondrial activity.',
                citation: { title: 'NAD+ in aging, metabolism, and neurodegeneration', source: 'Science 2015', pmid: '26785480', url: 'https://pubmed.ncbi.nlm.nih.gov/26785480/' }
            },
        ]
    },
    {
        name: 'Side Effects and Contraindications',
        icon: AlertTriangle,
        questions: [
            {
                question: 'What are common side effects of Tirzepatide?',
                answer: 'Common side effects include nausea, vomiting, diarrhea, and injection site reactions, with rare risks like pancreatitis or thyroid tumors.',
                citation: { title: 'Tirzepatide Once Weekly for the Treatment of Obesity', source: 'N Engl J Med 2022', pmid: '35658024', url: 'https://pubmed.ncbi.nlm.nih.gov/35658024/' }
            },
            {
                question: 'Who should avoid using HGH Fragment 176-191?',
                answer: 'Avoid use if hypersensitive, as it may cause mild head rush or injection pain.',
                citation: { title: 'Metabolic effects of the C-terminal part of human growth hormone', source: 'Mol Cell Endocrinol 1993', pmid: '8258310', url: 'https://pubmed.ncbi.nlm.nih.gov/8258310/' }
            },
            {
                question: 'Are there contraindications for Thymosin Alpha-1?',
                answer: 'Yes, avoid in cases of autoimmune disease due to its immune-enhancing effects.',
                citation: { title: 'Thymosin alpha 1 in the treatment of viral infections', source: 'Int Immunopharmacol 2007', pmid: '17291602', url: 'https://pubmed.ncbi.nlm.nih.gov/17291602/' }
            },
        ]
    },
    {
        name: 'Stacking and Combinations',
        icon: Link2,
        questions: [
            {
                question: 'Can I stack Semaglutide with other peptides?',
                answer: 'Yes, it can be stacked with Tirzepatide for enhanced weight loss, Cagrilintide for satiety, AOD-9604 for lipolysis, or BPC-157 to mitigate GI side effects.',
                citation: { title: 'Cagrilintide plus semaglutide for weight management', source: 'Lancet 2021', pmid: '34358471', url: 'https://pubmed.ncbi.nlm.nih.gov/34358471/' }
            },
            {
                question: 'What peptides pair well with BPC-157 for repair?',
                answer: 'BPC-157 stacks well with TB-500 for comprehensive healing and GHK-Cu for skin and connective tissue support.',
                citation: { title: 'Thymosin beta4 and wound healing', source: 'Ann N Y Acad Sci 2012', pmid: '22823395', url: 'https://pubmed.ncbi.nlm.nih.gov/22823395/' }
            },
            {
                question: 'Is stacking Ipamorelin and CJC-1295 effective?',
                answer: 'Yes, combining Ipamorelin with CJC-1295 (NO dac or With dac) provides synergistic growth hormone release.',
                citation: { title: 'Prolonged stimulation of growth hormone and IGF-1', source: 'J Clin Endocrinol Metab 2006', pmid: '16352683', url: 'https://pubmed.ncbi.nlm.nih.gov/16352683/' }
            },
        ]
    },
    {
        name: 'Safety and Precautions',
        icon: Shield,
        questions: [
            {
                question: 'What should I do if I experience side effects?',
                answer: 'Discontinue use and consult research protocols or a professional, as side effects vary (e.g., nausea with Tirzepatide, flushing with NAD+).',
                citation: { title: 'Side effects of incretin-based therapies', source: 'Diabetes Care 2017', pmid: '28404659', url: 'https://pubmed.ncbi.nlm.nih.gov/28404659/' }
            },
            { question: 'Are there peptides to avoid with certain conditions?', answer: 'Yes, avoid EPO if you have cancer or cardiovascular disease, and avoid Dermorphin if sensitive to opioids due to respiratory depression risks.' },
            {
                question: 'How often should I cycle peptides like Epitalon?',
                answer: 'Epitalon (10MG) is dosed 5-10mg daily for 10-20 days, cycled twice a year.',
                citation: { title: 'Peptide bioregulators and aging', source: 'Adv Gerontol 2010', pmid: '21510038', url: 'https://pubmed.ncbi.nlm.nih.gov/21510038/' }
            },
        ]
    },
    {
        name: 'Ordering and Shipping',
        icon: Package,
        questions: [
            { question: 'What is the individual buy minimum order?', answer: '1 full box (10 vials). Order ships straight to your door with its own tracking number. Can be purchased anytime (no need to wait for others).' },
            { question: 'What are the individual buy shipping tiers?', answer: '$45 = up to 3 peptides + 1 BAC water. $60 = up to 5 peptides + 2 BAC waters or 3 peptides + 3 BAC waters. $70 = 9–13 peptides.' },
            { question: 'What are the group buy details?', answer: 'Order any number of vials (up to 15 boxes total/person/batch). Shipping is cheaper (cost split). Can buy per vial. Ships to seller first, then sent locally.' },
            { question: 'Can I mix peptides in one box?', answer: 'No. Boxes are pre-packed with 10 vials of the same peptide directly from the factory.' },
            { question: 'How long does delivery take?', answer: 'Turnaround from the factory to the Philippines is usually 2–3 weeks (or 7–10 days). Wait time is ~2 weeks for individual and ~3 weeks for group buy.' },
            { question: 'How do I track my order?', answer: "Tracking number and link to the third-party freight forwarder's page will be sent. Tracking updates take 24–48 hours. Public carriers (LBC, DHL, UPS) are not used." },
            { question: 'What if my package is held by customs?', answer: 'The seller will re-ship it if it gets held by customs.' },
            { question: 'Can I order from overseas?', answer: 'Group buy overseas shipping is not allowed. You must have a local PH address. Items confiscated/held overseas will not be reshipped or replaced.' },
        ]
    },
    {
        name: 'Payment and Process',
        icon: CreditCard,
        questions: [
            { question: 'How do I place an order? (Step 1: Collect Orders)', answer: 'Send your final order with the name, milligrams, and quantity of each item.' },
            { question: 'How do I place an order? (Step 2: Get Total)', answer: 'Receive the total amount in pesos (with conversion and shipping fee).' },
            { question: 'How do I place an order? (Step 3: Make Payment)', answer: 'Make payment via Union Bank, ChinaBank, GoTyme, SeaBank (MariBank), GCash, BPI, or PayMaya. Avoid Bitcoin/PayPal (5–10% handling fees).' },
            { question: 'How do I place an order? (Step 4: Shipping Details)', answer: 'Send: Full name, complete address with ZIP code, and phone number.' },
            { question: 'When is payment due?', answer: 'Payment must be made the same day the invoice is sent, or the order will be forfeited. Orders placed through DM will not be counted.' },
            { question: 'What happens after I pay?', answer: 'Upon making payment, you will be added to a private group exclusively for verified buyers.' },
        ]
    },
    {
        name: 'Product Information',
        icon: FlaskConical,
        questions: [
            { question: 'Do you have stock on hand?', answer: 'No. Orders are placed directly with the source. Stock is only for personal use (weight loss, longevity, etc.).' },
            {
                question: 'What is the peptide shelf life?',
                answer: 'Lyophilized (freeze-dried) peptides last 18–24 months (sealed/refrigerated/frozen). Reconstituted peptides last up to 28 days in the fridge.',
                citation: { title: 'Stability of peptide pharmaceuticals', source: 'Pharm Res 2010', pmid: '20499141', url: 'https://pubmed.ncbi.nlm.nih.gov/20499141/' }
            },
            { question: 'Is Bacteriostatic Water (BAC Water) included?', answer: 'No. Must be bought separately. 10 ml (10 vials) costs $35 (now ₱10); 3 ml (10 vials) costs $30 (now ₱8).' },
            {
                question: 'Can I use sterile water instead of BAC water?',
                answer: 'No. Use bacteriostatic water for multi-use vials (like peptides, Tirzepatide, HCG); sterile water is for single-use only.',
                citation: { title: 'Bacteriostatic water for injection specifications', source: 'USP Pharmacopeia 2023', url: 'https://www.usp.org/chemical-medicines/bacteriostatic-water' }
            },
            { question: 'Are supplies (dosing guide, syringe, label, pads) included?', answer: 'No. Supplies are not included as the order is direct from the factory. Resellers usually add these extras.' },
            { question: 'What are the recommended syringe brands?', answer: 'Embesta BD Ultra-fine insulin syringe 6mm and Sure Guard Insulin syringe.' },
            { question: 'Do you have a COA (Certificate of Analysis)?', answer: 'Digital COA is available upon request (COA 7/2025 & 8/2025). Tirzepatide COA is already in the works (shipped to a US lab).' },
        ]
    },
    {
        name: 'Group Buy vs Individual',
        icon: Users,
        questions: [
            { question: 'What is the difference between individual and group buy?', answer: 'Individual: 1 full box (10 vials) minimum, ships to your door. Group buy: Any number of vials (up to 15 boxes total/person/batch), cheaper shipping (cost split), ships to seller first then locally.' },
        ]
    },
    {
        name: 'Shipping Costs and Local Delivery',
        icon: Truck,
        questions: [
            { question: 'What is the standard international shipping fee?', answer: 'Standard rate is $45 (around ₱2,622.15 at ₱58.21 = $1, or ₱2,542.25 at ₱56.50 = $1). Covers up to four (4) boxes only/up to 3 peptides + 1 BAC water.' },
            { question: 'Why is the standard shipping rate $45?', answer: 'In the grey market, most vendors start shipping fees around $45. The vendor uses a freight forwarder who bases the cost on size and weight, not per batch.' },
            { question: 'What are the group buy shipping fee updates?', answer: 'International shipping cost is split (approx. ₱550 per person). Local shipping is now FREE (was ₱500 per address).' },
            { question: 'What is the local delivery cost?', answer: 'Once items arrive, local delivery (via Lalamove) is a separate cost (usually ₱100–₱230). LBC shipping is a standard ₱250 fee.' },
        ]
    },
    {
        name: 'About the Seller',
        icon: User,
        questions: [
            { question: "What is Mica's current peptide stack (Weekly)?", answer: 'Mondays: Tirzepatide (AM or mid-day). Thursdays/Sundays: Thymosin Alpha-1.' },
            { question: "What is Mica's current peptide stack (Mon-Fri)?", answer: 'Mornings: NAD+ (25–50 mg), Semax, Selank, GHK-Cu topical. Evenings: Tesamorelin, DSIP, GLOW.' },
            { question: 'How does the vendor partnership and compensation work?', answer: 'Seller works with a trusted grey market vendor and receives peptides (not cash) to help manage ADHD. For transparency, they do not earn money.' },
            { question: 'Is this 100% safe from scams?', answer: '100% guaranteed safe from scams. Two types of scammers: those who take money and send nothing, and those who send inert peptides (salt).' },
            { question: 'Are there support groups available?', answer: 'There is one support group open to everyone and an exclusive one for verified buyers.' },
            { question: 'How do I contact for orders (Luzon & Visayas)?', answer: 'DM @Phoebe for individual purchases and updates.' },
            { question: 'How do I contact for orders (Mindanao)?', answer: 'DM @Gilia for individual buys and ALL orders and updates.' },
        ]
    },
];

function QuestionItem({ item, isDark, textColor, subtitleColor }: { item: FAQItem, isDark: boolean, textColor: string, subtitleColor: string }) {
    const [expanded, setExpanded] = useState(false);

    const openCitation = () => {
        if (item.citation?.url) {
            Linking.openURL(item.citation.url);
        }
    };

    return (
        <SoundButton onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
            <View style={[styles.questionItem, { borderBottomColor: isDark ? Colors.gray[700] : Colors.gray[200] }]}>
                <View style={styles.questionHeader}>
                    <StyledText variant="regular" style={[styles.questionText, { color: textColor }, expanded && { color: isDark ? Colors.dark.tint : Colors.primary }]}>
                        {item.question}
                    </StyledText>
                    {expanded ? (
                        <ChevronUp size={16} color={isDark ? Colors.dark.tint : Colors.primary} />
                    ) : (
                        <ChevronDown size={16} color={subtitleColor} />
                    )}
                </View>
                {expanded && (
                    <View>
                        <StyledText variant="regular" style={[styles.answerText, { color: subtitleColor }]}>{item.answer}</StyledText>

                        {/* Citation Display */}
                        {item.citation && (
                            <TouchableOpacity onPress={openCitation} style={styles.citationContainer}>
                                <View style={styles.citationContent}>
                                    <StyledText variant="medium" style={styles.citationLabel}>📚 Reference:</StyledText>
                                    <StyledText variant="regular" style={styles.citationText}>
                                        {item.citation.title}
                                    </StyledText>
                                    <StyledText variant="regular" style={styles.citationSource}>
                                        {item.citation.source}{item.citation.pmid ? ` • PMID: ${item.citation.pmid}` : ''}
                                    </StyledText>
                                </View>
                                {item.citation.url && <ExternalLink size={14} color="#6B8E23" />}
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        </SoundButton>
    );
}

function CategoryItem({ category, isDark, cardBg, textColor, subtitleColor }: { category: FAQCategory, isDark: boolean, cardBg: string, textColor: string, subtitleColor: string }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <GlowCard variant="surface" style={[styles.categoryCard, isDark && { backgroundColor: cardBg }]}>
            <SoundButton onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
                <View style={styles.categoryHeader}>
                    <View style={styles.categoryTitleRow}>
                        <View style={[styles.iconContainer, { backgroundColor: isDark ? Colors.gray[700] : Colors.soft.primary }]}>
                            <category.icon size={18} color={isDark ? Colors.dark.tint : Colors.primary} />
                        </View>
                        <StyledText variant="semibold" style={[styles.categoryName, { color: textColor }, expanded && { color: isDark ? Colors.dark.tint : Colors.primary }]}>
                            {category.name}
                        </StyledText>
                    </View>
                    <View style={styles.categoryMeta}>
                        <StyledText variant="regular" style={[styles.questionCount, { color: subtitleColor }]}>
                            {category.questions.length}
                        </StyledText>
                        {expanded ? (
                            <ChevronUp size={20} color={isDark ? Colors.dark.tint : Colors.primary} />
                        ) : (
                            <ChevronDown size={20} color={subtitleColor} />
                        )}
                    </View>
                </View>
            </SoundButton>
            {expanded && (
                <View>
                    <View style={[styles.divider, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[100] }]} />
                    {category.questions.map((q, index) => (
                        <QuestionItem key={index} item={q} isDark={isDark} textColor={textColor} subtitleColor={subtitleColor} />
                    ))}
                </View>
            )}
        </GlowCard>
    );
}

export default function FAQScreen() {
    const router = useRouter();
    const { preferences } = usePreferences();
    const isDark = preferences.darkMode;

    const bgColor = isDark ? Colors.dark.background : Colors.soft.background;
    const cardBg = isDark ? Colors.gray[800] : Colors.white;
    const textColor = isDark ? Colors.dark.text : Colors.gray[900];
    const subtitleColor = isDark ? Colors.gray[400] : Colors.gray[500];

    const SoftBlob = ({ color, style }: { color: string, style: any }) => (
        <View style={[styles.blob, { backgroundColor: color }, style]} />
    );

    return (
        <View style={[styles.mainContainer, { backgroundColor: bgColor }]}>
            {/* Background blobs - dark mode uses muted violet tones */}
            <SoftBlob color={isDark ? "#1E1B4B" : "#EDE9FE"} style={{ top: -50, right: -50, width: 300, height: 300 }} />
            <SoftBlob color={isDark ? "#312E81" : "#DDD6FE"} style={{ bottom: 50, left: -50, width: 300, height: 300 }} />

            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <SoundButton onPress={() => router.back()} style={[styles.backButton, { backgroundColor: cardBg }]}>
                        <ChevronLeft size={24} color={textColor} />
                    </SoundButton>
                    <StyledText variant="bold" style={[styles.headerTitle, { color: textColor }]}>FAQ & Help</StyledText>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <StyledText variant="regular" style={[styles.subtitle, { color: subtitleColor }]}>
                        Browse through {FAQ_DATA.length} categories and {FAQ_DATA.reduce((acc, cat) => acc + cat.questions.length, 0)} questions
                    </StyledText>
                    {FAQ_DATA.map((category, index) => (
                        <CategoryItem key={index} category={category} isDark={isDark} cardBg={cardBg} textColor={textColor} subtitleColor={subtitleColor} />
                    ))}

                    {/* Medical Disclaimer (App Store Compliance) */}
                    <MedicalDisclaimer variant="compact" />

                    <View style={{ height: 20 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: Colors.soft.background,
    },
    blob: {
        position: 'absolute',
        borderRadius: 999,
        opacity: 0.5,
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Layout.spacing.lg,
        paddingVertical: Layout.spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...Layout.shadows.small,
    },
    headerTitle: {
        fontSize: 20,
        color: Colors.gray[800],
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: Layout.spacing.sm,
    },
    content: {
        paddingHorizontal: Layout.spacing.lg,
        gap: Layout.spacing.md,
        paddingBottom: Layout.spacing.xl,
    },
    categoryCard: {
        padding: 0,
        overflow: 'hidden',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Layout.spacing.sm,
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Layout.spacing.lg,
    },
    categoryTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    categoryIcon: {
        fontSize: 20,
        marginRight: Layout.spacing.sm,
    },
    categoryName: {
        fontSize: 16,
        color: Colors.gray[800],
        flex: 1,
    },
    categoryMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Layout.spacing.sm,
    },
    questionCount: {
        fontSize: 12,
        color: Colors.gray[500],
        backgroundColor: Colors.gray[100],
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        overflow: 'hidden',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.gray[100],
        marginHorizontal: Layout.spacing.lg,
    },
    questionItem: {
        paddingHorizontal: Layout.spacing.lg,
        paddingVertical: Layout.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    questionText: {
        fontSize: 14,
        color: Colors.gray[700],
        flex: 1,
        marginRight: 12,
        lineHeight: 20,
    },
    answerText: {
        fontSize: 13,
        color: Colors.gray[500],
        lineHeight: 20,
        marginTop: Layout.spacing.sm,
        paddingLeft: 4,
    },
    // Citation styles
    citationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(107, 142, 35, 0.08)',
        borderRadius: 8,
        padding: 10,
        marginTop: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#6B8E23',
    },
    citationContent: {
        flex: 1,
    },
    citationLabel: {
        fontSize: 11,
        color: '#6B8E23',
        marginBottom: 2,
    },
    citationText: {
        fontSize: 12,
        color: Colors.gray[700],
        lineHeight: 16,
    },
    citationSource: {
        fontSize: 10,
        color: Colors.gray[500],
        marginTop: 2,
    },
});
