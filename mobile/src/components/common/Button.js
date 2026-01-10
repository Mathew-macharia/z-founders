import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, borderRadius, components, shadows } from '../../theme';

const Button = ({
    title,
    onPress,
    variant = 'primary', // primary, secondary, outline, ghost
    size = 'md', // sm, md, lg
    disabled = false,
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    style,
    textStyle,
}) => {
    const isDisabled = disabled || loading;

    const getButtonStyles = () => {
        let buttonStyles = [styles.base, styles[size]];

        if (fullWidth) {
            buttonStyles.push(styles.fullWidth);
        }

        switch (variant) {
            case 'primary':
                break; // Uses gradient
            case 'secondary':
                buttonStyles.push(styles.secondary);
                break;
            case 'outline':
                buttonStyles.push(styles.outline);
                break;
            case 'ghost':
                buttonStyles.push(styles.ghost);
                break;
        }

        if (isDisabled) {
            buttonStyles.push(styles.disabled);
        }

        return buttonStyles;
    };

    const getTextStyles = () => {
        let textStyles = [styles.text, styles[`text_${size}`]];

        switch (variant) {
            case 'primary':
                textStyles.push(styles.textPrimary);
                break;
            case 'secondary':
                textStyles.push(styles.textSecondary);
                break;
            case 'outline':
                textStyles.push(styles.textOutline);
                break;
            case 'ghost':
                textStyles.push(styles.textGhost);
                break;
        }

        if (isDisabled) {
            textStyles.push(styles.textDisabled);
        }

        return textStyles;
    };

    const content = (
        <View style={styles.content}>
            {loading ? (
                <ActivityIndicator
                    color={variant === 'primary' ? colors.white : colors.primary[500]}
                    size="small"
                />
            ) : (
                <>
                    {icon && iconPosition === 'left' && (
                        <View style={styles.iconLeft}>{icon}</View>
                    )}
                    <Text style={[getTextStyles(), textStyle]}>{title}</Text>
                    {icon && iconPosition === 'right' && (
                        <View style={styles.iconRight}>{icon}</View>
                    )}
                </>
            )}
        </View>
    );

    if (variant === 'primary') {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={isDisabled}
                activeOpacity={0.8}
                style={[fullWidth && styles.fullWidth, style]}
            >
                <LinearGradient
                    colors={isDisabled
                        ? [colors.secondary[600], colors.secondary[700]]
                        : [colors.primary[500], colors.primary[600]]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.base, styles[size], styles.gradient]}
                >
                    {content}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.7}
            style={[getButtonStyles(), style]}
        >
            {content}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.lg,
        ...shadows.sm,
    },
    gradient: {
        borderRadius: borderRadius.lg,
    },
    sm: {
        height: components.button.height.sm,
        paddingHorizontal: components.button.paddingHorizontal.sm,
    },
    md: {
        height: components.button.height.md,
        paddingHorizontal: components.button.paddingHorizontal.md,
    },
    lg: {
        height: components.button.height.lg,
        paddingHorizontal: components.button.paddingHorizontal.lg,
    },
    fullWidth: {
        width: '100%',
    },
    secondary: {
        backgroundColor: colors.secondary[700],
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.primary[500],
    },
    ghost: {
        backgroundColor: 'transparent',
        shadowOpacity: 0,
        elevation: 0,
    },
    disabled: {
        opacity: 0.5,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        ...typography.styles.button,
    },
    text_sm: {
        fontSize: 14,
    },
    text_md: {
        fontSize: 16,
    },
    text_lg: {
        fontSize: 18,
    },
    textPrimary: {
        color: colors.white,
    },
    textSecondary: {
        color: colors.text.primary,
    },
    textOutline: {
        color: colors.primary[500],
    },
    textGhost: {
        color: colors.primary[500],
    },
    textDisabled: {
        color: colors.text.disabled,
    },
    iconLeft: {
        marginRight: 8,
    },
    iconRight: {
        marginLeft: 8,
    },
});

export default Button;
