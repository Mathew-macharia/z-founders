import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import { useAuthStore } from '../../store/authStore';

const DefaultVisibilityScreen = ({ navigation }) => {
    const { user } = useAuthStore();
    const [isPrivate, setIsPrivate] = useState(false); // Default to public

    const toggleSwitch = () => {
        setIsPrivate(!isPrivate);
        // TODO: Persist this setting to backend 'founderProfile'
        Alert.alert('Updated', 'Default video visibility updated');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Video Visibility</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.settingItem}>
                    <View style={styles.textContainer}>
                        <Text style={styles.settingTitle}>Private by Default</Text>
                        <Text style={styles.settingDescription}>
                            New videos will be visible only to your connections unless changed manually.
                        </Text>
                    </View>
                    <Switch
                        trackColor={{ false: colors.background.tertiary, true: colors.primary[500] }}
                        thumbColor={isPrivate ? '#FFF' : '#f4f3f4'}
                        onValueChange={toggleSwitch}
                        value={isPrivate}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[5],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    backButton: {
        marginRight: spacing[4],
    },
    headerTitle: {
        ...typography.styles.h4,
        color: colors.text.primary,
    },
    content: {
        padding: spacing[5],
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    textContainer: {
        flex: 1,
        paddingRight: spacing[4],
    },
    settingTitle: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
        marginBottom: spacing[1],
    },
    settingDescription: {
        ...typography.styles.caption,
        color: colors.text.secondary,
        lineHeight: 20,
    },
});

export default DefaultVisibilityScreen;
