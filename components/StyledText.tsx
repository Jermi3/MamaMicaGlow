import { Colors } from '@/constants/Colors';
import { Text, TextProps } from 'react-native';

interface StyledTextProps extends TextProps {
    variant?: 'regular' | 'medium' | 'semibold' | 'bold' | 'extraBold';
}

export function StyledText(props: StyledTextProps) {
    const { style, variant = 'regular', ...otherProps } = props;

    let fontFamily = 'Outfit_400Regular';
    switch (variant) {
        case 'medium': fontFamily = 'Outfit_500Medium'; break;
        case 'semibold': fontFamily = 'Outfit_700Bold'; break;
        case 'bold': fontFamily = 'Outfit_700Bold'; break;
        case 'extraBold': fontFamily = 'Outfit_800ExtraBold'; break;
        default: fontFamily = 'Outfit_400Regular';
    }

    return <Text style={[{ fontFamily, color: Colors.light.text }, style]} {...otherProps} />;
}
