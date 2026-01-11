import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { colors, typography, spacing, borderRadius } from '../../theme';

const HelpArticleScreen = ({ navigation, route }) => {
    const { article } = route.params;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{article.label}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.articleHeader}>
                    <View style={styles.iconContainer}>
                        <Ionicons name={article.icon} size={32} color={colors.primary[500]} />
                    </View>
                    <Text style={styles.title}>{article.label}</Text>
                    <Text style={styles.subtitle}>{article.description}</Text>
                </View>

                <View style={styles.markdownContainer}>
                    <Markdown style={markdownStyles}>
                        {article.content}
                    </Markdown>
                </View>
            </ScrollView>
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
        flex: 1,
    },
    content: {
        padding: spacing[5],
    },
    articleHeader: {
        alignItems: 'center',
        marginBottom: spacing[6],
        padding: spacing[5],
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.xl,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.primary[500] + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[4],
    },
    title: {
        ...typography.styles.h2,
        color: colors.text.primary,
        marginBottom: spacing[2],
        textAlign: 'center',
    },
    subtitle: {
        ...typography.styles.body,
        color: colors.text.secondary,
        textAlign: 'center',
    },
    markdownContainer: {
        marginBottom: spacing[8],
    },
});

const markdownStyles = {
    body: {
        color: colors.text.secondary,
        fontSize: 16,
        lineHeight: 24,
        fontFamily: 'Inter-Regular',
    },
    heading1: {
        color: colors.text.primary,
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        marginTop: 20,
        marginBottom: 10,
    },
    heading2: {
        color: colors.text.primary,
        fontSize: 20,
        fontFamily: 'Inter-SemiBold',
        marginTop: 20,
        marginBottom: 10,
    },
    heading3: {
        color: colors.text.primary,
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        marginTop: 15,
        marginBottom: 8,
    },
    strong: {
        color: colors.text.primary,
        fontFamily: 'Inter-SemiBold',
    },
    list_item: {
        color: colors.text.secondary,
        marginVertical: 4,
    },
};

export default HelpArticleScreen;
