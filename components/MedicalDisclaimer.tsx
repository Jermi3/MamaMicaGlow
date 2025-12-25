import { Citation } from '@/services/peptideService';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MedicalDisclaimerProps {
    variant?: 'compact' | 'full';
    showCitations?: boolean;
    citations?: Citation[];
}

/**
 * Medical Disclaimer Component
 * Required for App Store compliance when displaying health/medical information.
 */
export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({
    variant = 'compact',
    showCitations = false,
    citations = []
}) => {
    const openPubMed = (citation: Citation) => {
        const url = citation.url || (citation.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${citation.pmid}/` : null);
        if (url) {
            Linking.openURL(url);
        }
    };

    if (variant === 'compact') {
        return (
            <View style={styles.compactContainer}>
                <Ionicons name="information-circle-outline" size={14} color="#B8860B" />
                <Text style={styles.compactText}>
                    For educational purposes only. Not medical advice.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Ionicons name="alert-circle" size={20} color="#B8860B" />
                <Text style={styles.headerText}>Medical Disclaimer</Text>
            </View>

            <Text style={styles.disclaimerText}>
                This information is for educational purposes only and is not intended as medical advice.
                Consult a licensed healthcare provider before using any peptide or supplement.
                Individual results may vary.
            </Text>

            {showCitations && citations.length > 0 && (
                <View style={styles.citationsSection}>
                    <Text style={styles.citationsHeader}>
                        <Ionicons name="document-text-outline" size={14} color="#8B7355" /> References
                    </Text>
                    {citations.map((citation, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.citationItem}
                            onPress={() => openPubMed(citation)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.citationNumber}>[{index + 1}]</Text>
                            <View style={styles.citationContent}>
                                <Text style={styles.citationTitle}>{citation.title}</Text>
                                <Text style={styles.citationDetails}>
                                    {citation.authors} • {citation.journal} ({citation.year})
                                </Text>
                                {citation.pmid && (
                                    <Text style={styles.citationPmid}>
                                        PMID: {citation.pmid} <Ionicons name="open-outline" size={10} color="#6B8E23" />
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <View style={styles.footerRow}>
                <Text style={styles.footerText}>
                    References are from peer-reviewed sources and do not constitute endorsement.
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    // Compact variant styles
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(184, 134, 11, 0.08)',
        borderRadius: 8,
        marginTop: 8,
    },
    compactText: {
        fontSize: 11,
        color: '#8B7355',
        fontStyle: 'italic',
    },

    // Full variant styles
    container: {
        backgroundColor: 'rgba(184, 134, 11, 0.06)',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: 'rgba(184, 134, 11, 0.15)',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    headerText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#B8860B',
    },
    disclaimerText: {
        fontSize: 12,
        color: '#666',
        lineHeight: 18,
    },

    // Citations section styles
    citationsSection: {
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(184, 134, 11, 0.15)',
    },
    citationsHeader: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8B7355',
        marginBottom: 10,
    },
    citationItem: {
        flexDirection: 'row',
        marginBottom: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    citationNumber: {
        fontSize: 11,
        color: '#6B8E23',
        fontWeight: '600',
        width: 24,
        marginTop: 2,
    },
    citationContent: {
        flex: 1,
    },
    citationTitle: {
        fontSize: 12,
        fontWeight: '500',
        color: '#333',
        marginBottom: 2,
    },
    citationDetails: {
        fontSize: 10,
        color: '#777',
    },
    citationPmid: {
        fontSize: 10,
        color: '#6B8E23',
        marginTop: 2,
    },

    // Footer styles
    footerRow: {
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(184, 134, 11, 0.15)',
    },
    footerText: {
        fontSize: 10,
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
    },
});

export default MedicalDisclaimer;
