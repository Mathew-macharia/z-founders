import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../../theme';
import TextInput from '../../components/common/TextInput';
import { searchAPI } from '../../services/api';

const SEARCH_TYPES = [
    { id: 'all', label: 'All' },
    { id: 'founders', label: 'Founders' },
    { id: 'builders', label: 'Builders' },
    { id: 'investors', label: 'Investors' },
];

const SearchScreen = ({ navigation }) => {
    const [query, setQuery] = useState('');
    const [activeType, setActiveType] = useState('all');
    const [results, setResults] = useState({ people: [], videos: [], tags: [] });
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (text) => {
        setQuery(text);

        if (text.length < 2) {
            setResults({ people: [], videos: [], tags: [] });
            return;
        }

        setIsSearching(true);
        try {
            const response = await searchAPI.quick({ q: text, type: activeType });
            setResults(response.data);
        } catch (error) {
            console.error('Search failed:', error);
        }
        setIsSearching(false);
    };

    const renderPerson = ({ item }) => (
        <TouchableOpacity
            style={styles.personItem}
            onPress={() => navigation.navigate('Profile', { userId: item.id })}
        >
            {item.profile?.avatar ? (
                <Image source={{ uri: item.profile.avatar }} style={styles.avatar} />
            ) : (
                <LinearGradient
                    colors={[colors.primary[500], colors.primary[600]]}
                    style={styles.avatar}
                >
                    <Text style={styles.avatarText}>{item.email?.[0]?.toUpperCase()}</Text>
                </LinearGradient>
            )}
            <View style={styles.personInfo}>
                <Text style={styles.personName} numberOfLines={1}>
                    {item.profile?.bio?.split('\n')[0] || item.email?.split('@')[0]}
                </Text>
                <Text style={styles.personType}>
                    {item.accountType?.charAt(0) + item.accountType?.slice(1).toLowerCase()}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
        </TouchableOpacity>
    );

    const renderTag = ({ item }) => (
        <TouchableOpacity style={styles.tagItem}>
            <Text style={styles.tagText}>#{item.tag}</Text>
            <Text style={styles.tagCount}>{item.count} videos</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Search</Text>
                </View>

                <View style={styles.searchContainer}>
                    <TextInput
                        value={query}
                        onChangeText={handleSearch}
                        placeholder="Search founders, ideas, tags..."
                        leftIcon={<Ionicons name="search" size={20} color={colors.text.tertiary} />}
                        rightIcon={query ? (
                            <TouchableOpacity onPress={() => handleSearch('')}>
                                <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
                            </TouchableOpacity>
                        ) : null}
                        style={styles.searchInput}
                    />
                </View>

                {/* Type filters */}
                <View style={styles.typesContainer}>
                    {SEARCH_TYPES.map((type) => (
                        <TouchableOpacity
                            key={type.id}
                            style={[styles.typeChip, activeType === type.id && styles.typeChipActive]}
                            onPress={() => setActiveType(type.id)}
                        >
                            <Text style={[styles.typeText, activeType === type.id && styles.typeTextActive]}>
                                {type.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Results */}
                {query.length >= 2 ? (
                    <View style={styles.resultsContainer}>
                        {results.people?.length > 0 && (
                            <View style={styles.resultSection}>
                                <Text style={styles.sectionTitle}>People</Text>
                                <FlatList
                                    data={results.people}
                                    keyExtractor={(item) => item.id}
                                    renderItem={renderPerson}
                                    scrollEnabled={false}
                                />
                            </View>
                        )}

                        {results.tags?.length > 0 && (
                            <View style={styles.resultSection}>
                                <Text style={styles.sectionTitle}>Tags</Text>
                                <View style={styles.tagsGrid}>
                                    {results.tags.map((tag, index) => (
                                        <TouchableOpacity key={index} style={styles.tagItem}>
                                            <Text style={styles.tagText}>#{tag.tag}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {results.people?.length === 0 && results.tags?.length === 0 && !isSearching && (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="search-outline" size={48} color={colors.text.tertiary} />
                                <Text style={styles.emptyTitle}>No results found</Text>
                                <Text style={styles.emptySubtitle}>Try a different search term</Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.suggestionsContainer}>
                        <Text style={styles.sectionTitle}>Trending Tags</Text>
                        <View style={styles.tagsGrid}>
                            {['fintech', 'ai', 'healthtech', 'saas', 'climate', 'web3'].map((tag) => (
                                <TouchableOpacity
                                    key={tag}
                                    style={styles.suggestTag}
                                    onPress={() => handleSearch(tag)}
                                >
                                    <Text style={styles.suggestTagText}>#{tag}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
    },
    headerTitle: {
        ...typography.styles.h3,
        color: colors.text.primary,
    },
    searchContainer: {
        paddingHorizontal: spacing[4],
    },
    searchInput: {
        marginBottom: 0,
    },
    typesContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        gap: spacing[2],
    },
    typeChip: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        borderRadius: borderRadius.full,
        backgroundColor: colors.background.tertiary,
    },
    typeChipActive: {
        backgroundColor: colors.primary[500],
    },
    typeText: {
        ...typography.styles.small,
        color: colors.text.secondary,
    },
    typeTextActive: {
        color: colors.white,
        fontFamily: typography.fontFamily.semiBold,
    },
    resultsContainer: {
        flex: 1,
        paddingHorizontal: spacing[4],
    },
    resultSection: {
        marginBottom: spacing[6],
    },
    sectionTitle: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
        marginBottom: spacing[3],
    },
    personItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    avatarText: {
        ...typography.styles.bodyMedium,
        color: colors.white,
    },
    personInfo: {
        flex: 1,
    },
    personName: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
    },
    personType: {
        ...typography.styles.small,
        color: colors.text.secondary,
        marginTop: spacing[1],
    },
    tagsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing[2],
    },
    tagItem: {
        backgroundColor: colors.primary[500] + '20',
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        borderRadius: borderRadius.full,
    },
    tagText: {
        ...typography.styles.small,
        color: colors.primary[400],
    },
    suggestionsContainer: {
        paddingHorizontal: spacing[4],
        paddingTop: spacing[4],
    },
    suggestTag: {
        backgroundColor: colors.background.tertiary,
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        borderRadius: borderRadius.lg,
        marginRight: spacing[2],
        marginBottom: spacing[2],
    },
    suggestTagText: {
        ...typography.styles.body,
        color: colors.text.primary,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: spacing[10],
    },
    emptyTitle: {
        ...typography.styles.h4,
        color: colors.text.primary,
        marginTop: spacing[3],
    },
    emptySubtitle: {
        ...typography.styles.body,
        color: colors.text.secondary,
        marginTop: spacing[1],
    },
});

export default SearchScreen;
