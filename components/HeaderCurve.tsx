import { usePreferences } from '@/contexts/PreferencesContext';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, ViewProps } from 'react-native';

interface HeaderCurveProps extends ViewProps {
    height?: number;
}

export function HeaderCurve({ height = 180, style, children, ...props }: HeaderCurveProps) {
    const { preferences } = usePreferences();
    const isDark = preferences.darkMode;

    return (
        <View style={[styles.container, { height }, style]} {...props}>
            <LinearGradient
                colors={isDark
                    ? ['#1E1B4B', '#312E81'] // Deep Indigo to Indigo 800
                    : ['#DDD6FE', '#F3E8FF'] // Violet 200 to Purple 100
                }
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            {/* The content container (Safe Area usually handles padding, but we pass children here for layering if needed) */}
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        overflow: 'hidden',
        zIndex: 0, // Behind content by default if not wrapped
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        flex: 1,
    }
});
