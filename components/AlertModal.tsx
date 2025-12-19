import { GlowCard } from '@/components/GlowCard';
import { SoundButton } from '@/components/SoundButton';
import { StyledText } from '@/components/StyledText';
import { Colors, Layout } from '@/constants/Colors';
import { usePreferences } from '@/contexts/PreferencesContext';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react-native';
import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

export interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

interface AlertModalProps {
    visible: boolean;
    title: string;
    message: string;
    type?: AlertType;
    buttons?: AlertButton[];
    onClose: () => void;
}

const ALERT_CONFIG: Record<AlertType, { color: string; Icon: typeof Info }> = {
    info: { color: Colors.primary, Icon: Info },
    success: { color: '#10B981', Icon: CheckCircle },
    warning: { color: '#F59E0B', Icon: AlertCircle },
    error: { color: '#EF4444', Icon: XCircle },
};

export function AlertModal({
    visible,
    title,
    message,
    type = 'info',
    buttons = [{ text: 'OK', style: 'default' }],
    onClose,
}: AlertModalProps) {
    const { preferences } = usePreferences();
    const isDark = preferences.darkMode;

    const config = ALERT_CONFIG[type];
    const IconComponent = config.Icon;

    const textColor = isDark ? Colors.dark.text : Colors.gray[900];
    const subtitleColor = isDark ? Colors.gray[400] : Colors.gray[500];
    const cardBg = isDark ? Colors.gray[900] : Colors.white;

    const handleButtonPress = (button: AlertButton) => {
        button.onPress?.();
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <GlowCard
                    variant="surface"
                    style={[
                        styles.card,
                        { backgroundColor: cardBg },
                        isDark && { borderColor: Colors.gray[800] }
                    ]}
                >
                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
                        <IconComponent size={32} color={config.color} />
                    </View>

                    {/* Title */}
                    <StyledText variant="bold" style={[styles.title, { color: textColor }]}>
                        {title}
                    </StyledText>

                    {/* Message */}
                    <StyledText variant="regular" style={[styles.message, { color: subtitleColor }]}>
                        {message}
                    </StyledText>

                    {/* Buttons */}
                    <View style={[styles.buttonContainer, buttons.length > 1 && styles.buttonRow]}>
                        {buttons.map((button, index) => {
                            const isDestructive = button.style === 'destructive';
                            const isCancel = button.style === 'cancel';

                            return (
                                <SoundButton
                                    key={index}
                                    style={[
                                        styles.button,
                                        buttons.length > 1 && { flex: 1 },
                                        isDestructive && styles.destructiveButton,
                                        isCancel && [styles.cancelButton, isDark && { backgroundColor: Colors.gray[800] }],
                                        !isDestructive && !isCancel && [styles.primaryButton, { backgroundColor: config.color }],
                                    ]}
                                    onPress={() => handleButtonPress(button)}
                                >
                                    <StyledText
                                        variant="semibold"
                                        style={[
                                            styles.buttonText,
                                            isCancel && { color: isDark ? Colors.gray[300] : Colors.gray[600] },
                                            (isDestructive || (!isDestructive && !isCancel)) && { color: Colors.white },
                                        ]}
                                    >
                                        {button.text}
                                    </StyledText>
                                </SoundButton>
                            );
                        })}
                    </View>
                </GlowCard>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 340,
        padding: 24,
        borderRadius: Layout.radius.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.gray[200],
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    buttonRow: {
        flexDirection: 'row',
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: Layout.radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButton: {
        backgroundColor: Colors.primary,
    },
    cancelButton: {
        backgroundColor: Colors.gray[100],
    },
    destructiveButton: {
        backgroundColor: '#EF4444',
    },
    buttonText: {
        fontSize: 16,
    },
});
