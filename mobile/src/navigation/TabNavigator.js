import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, spacing } from '../theme';
import { useAuthStore } from '../store/authStore';

// Tab screens
import HomeScreen from '../screens/main/HomeScreen';
import PitchesScreen from '../screens/main/PitchesScreen';
import InboxScreen from '../screens/messages/InboxScreen';
import SearchScreen from '../screens/search/SearchScreen';
import MyProfileScreen from '../screens/profile/MyProfileScreen';

const Tab = createBottomTabNavigator();

const TabBarIcon = ({ name, focused, color }) => (
    <View style={styles.iconContainer}>
        <Ionicons
            name={focused ? name : `${name}-outline`}
            size={24}
            color={color}
        />
        {focused && (
            <View style={styles.activeIndicator} />
        )}
    </View>
);

const CreateButton = ({ onPress }) => (
    <View style={styles.createButtonContainer}>
        <LinearGradient
            colors={[colors.primary[500], colors.primary[600]]}
            style={styles.createButton}
        >
            <Ionicons name="add" size={32} color={colors.white} />
        </LinearGradient>
    </View>
);

const TabNavigator = () => {
    const { user } = useAuthStore();
    const isInvestor = user?.accountType === 'INVESTOR';

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: colors.primary[500],
                tabBarInactiveTintColor: colors.text.tertiary,
                tabBarShowLabel: true,
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <TabBarIcon name="home" focused={focused} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Pitches"
                component={PitchesScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <TabBarIcon name="rocket" focused={focused} color={color} />
                    ),
                    tabBarLabel: isInvestor ? 'For You' : 'Pitches',
                }}
            />
            <Tab.Screen
                name="Search"
                component={SearchScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <TabBarIcon name="search" focused={focused} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Inbox"
                component={InboxScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <TabBarIcon name="chatbubble" focused={focused} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="MyProfile"
                component={MyProfileScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <TabBarIcon name="person" focused={focused} color={color} />
                    ),
                    tabBarLabel: 'Profile',
                }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: colors.background.secondary,
        borderTopColor: colors.border.light,
        borderTopWidth: 1,
        height: Platform.OS === 'ios' ? 88 : 60,
        paddingTop: spacing[2],
        paddingBottom: Platform.OS === 'ios' ? spacing[6] : spacing[2],
    },
    tabLabel: {
        fontSize: 10,
        fontFamily: 'Inter-Medium',
        marginTop: 2,
    },
    iconContainer: {
        alignItems: 'center',
    },
    activeIndicator: {
        position: 'absolute',
        bottom: -8,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.primary[500],
    },
    createButtonContainer: {
        position: 'absolute',
        top: -20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary[500],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});

export default TabNavigator;
