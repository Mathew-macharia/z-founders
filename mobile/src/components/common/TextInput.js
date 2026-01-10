import React, { useState } from 'react';
import {
    View,
    TextInput as RNTextInput,
    Text,
    StyleSheet,
    TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, borderRadius, spacing, components } from '../../theme';

const TextInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    error,
    helperText,
    secureTextEntry,
    multiline,
    numberOfLines = 1,
    maxLength,
    keyboardType = 'default',
    autoCapitalize = 'none',
    leftIcon,
    rightIcon,
    onRightIconPress,
    disabled = false,
    style,
    inputStyle,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handlePasswordToggle = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const getBorderColor = () => {
        if (error) return colors.error.main;
        if (isFocused) return colors.primary[500];
        return colors.border.light;
    };

    return (
        <View style={[styles.container, style]}>
            {label && (
                <Text style={styles.label}>{label}</Text>
            )}

            <View
                style={[
                    styles.inputContainer,
                    { borderColor: getBorderColor() },
                    multiline && styles.multilineContainer,
                    disabled && styles.disabled,
                ]}
            >
                {leftIcon && (
                    <View style={styles.leftIcon}>
                        {leftIcon}
                    </View>
                )}

                <RNTextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.text.tertiary}
                    secureTextEntry={secureTextEntry && !isPasswordVisible}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    maxLength={maxLength}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    editable={!disabled}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    style={[
                        styles.input,
                        leftIcon && styles.inputWithLeftIcon,
                        (rightIcon || secureTextEntry) && styles.inputWithRightIcon,
                        multiline && styles.multilineInput,
                        inputStyle,
                    ]}
                    {...props}
                />

                {secureTextEntry && (
                    <TouchableOpacity
                        style={styles.rightIcon}
                        onPress={handlePasswordToggle}
                    >
                        <Ionicons
                            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={colors.text.tertiary}
                        />
                    </TouchableOpacity>
                )}

                {rightIcon && !secureTextEntry && (
                    <TouchableOpacity
                        style={styles.rightIcon}
                        onPress={onRightIconPress}
                        disabled={!onRightIconPress}
                    >
                        {rightIcon}
                    </TouchableOpacity>
                )}
            </View>

            {(error || helperText) && (
                <Text style={[styles.helperText, error && styles.errorText]}>
                    {error || helperText}
                </Text>
            )}

            {maxLength && (
                <Text style={styles.charCount}>
                    {value?.length || 0}/{maxLength}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing[4],
    },
    label: {
        ...typography.styles.small,
        fontFamily: typography.fontFamily.medium,
        color: colors.text.secondary,
        marginBottom: spacing[2],
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.tertiary,
        borderWidth: 1,
        borderRadius: borderRadius.lg,
        height: components.input.height,
    },
    multilineContainer: {
        height: 'auto',
        minHeight: components.input.height,
        paddingVertical: spacing[3],
    },
    input: {
        flex: 1,
        ...typography.styles.body,
        color: colors.text.primary,
        paddingHorizontal: components.input.paddingHorizontal,
        height: '100%',
    },
    inputWithLeftIcon: {
        paddingLeft: spacing[1],
    },
    inputWithRightIcon: {
        paddingRight: spacing[1],
    },
    multilineInput: {
        height: 'auto',
        textAlignVertical: 'top',
    },
    leftIcon: {
        paddingLeft: spacing[4],
    },
    rightIcon: {
        paddingRight: spacing[4],
    },
    helperText: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        marginTop: spacing[1],
    },
    errorText: {
        color: colors.error.main,
    },
    charCount: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        textAlign: 'right',
        marginTop: spacing[1],
    },
    disabled: {
        opacity: 0.5,
    },
});

export default TextInput;
