import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';

import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';

// Import screens that are outside of tabs
import VideoDetailScreen from '../screens/video/VideoDetailScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import ChatScreen from '../screens/messages/ChatScreen';
import RecordScreen from '../screens/video/RecordScreen';
import AnalyticsScreen from '../screens/video/AnalyticsScreen';
import SubscriptionScreen from '../screens/profile/SubscriptionScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ExpressInterestScreen from '../screens/messages/ExpressInterestScreen';
import NotificationSettingsScreen from '../screens/profile/NotificationSettingsScreen';
import AccountTypeScreen from '../screens/auth/AccountTypeScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import SwitchAccountScreen from '../screens/profile/SwitchAccountScreen';
import AddAccountScreen from '../screens/profile/AddAccountScreen';
import PrivacyScreen from '../screens/profile/PrivacyScreen';
import SecurityScreen from '../screens/profile/SecurityScreen';
import HelpScreen from '../screens/profile/HelpScreen';
import TermsScreen from '../screens/profile/TermsScreen';
import PrivacyPolicyScreen from '../screens/profile/PrivacyPolicyScreen';
import BlockedUsersScreen from '../screens/profile/BlockedUsersScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import DefaultVisibilityScreen from '../screens/profile/DefaultVisibilityScreen';
import HelpArticleScreen from '../screens/profile/HelpArticleScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    const { isAuthenticated, user } = useAuthStore();

    // Check if user needs onboarding
    const needsOnboarding = user && !user.onboardingProgress?.completed;

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            {!isAuthenticated ? (
                // Auth flow
                <Stack.Screen name="Auth" component={AuthNavigator} />
            ) : (
                // Main app
                <>
                    <Stack.Screen name="Main" component={TabNavigator} />

                    {/* Modal screens */}
                    <Stack.Screen
                        name="VideoDetail"
                        component={VideoDetailScreen}
                        options={{
                            presentation: 'modal',
                            animation: 'slide_from_bottom'
                        }}
                    />
                    <Stack.Screen
                        name="Record"
                        component={RecordScreen}
                        options={{
                            presentation: 'fullScreenModal',
                            animation: 'slide_from_bottom'
                        }}
                    />
                    <Stack.Screen
                        name="Profile"
                        component={ProfileScreen}
                        options={{ animation: 'slide_from_right' }}
                    />
                    <Stack.Screen
                        name="EditProfile"
                        component={EditProfileScreen}
                        options={{
                            presentation: 'modal',
                            animation: 'slide_from_bottom'
                        }}
                    />
                    <Stack.Screen
                        name="Settings"
                        component={SettingsScreen}
                    />
                    <Stack.Screen
                        name="Chat"
                        component={ChatScreen}
                    />
                    <Stack.Screen
                        name="Analytics"
                        component={AnalyticsScreen}
                    />
                    <Stack.Screen
                        name="Subscription"
                        component={SubscriptionScreen}
                        options={{ presentation: 'modal' }}
                    />
                    <Stack.Screen
                        name="Notifications"
                        component={NotificationsScreen}
                    />
                    <Stack.Screen
                        name="ExpressInterest"
                        component={ExpressInterestScreen}
                    />
                    <Stack.Screen
                        name="NotificationSettings"
                        component={NotificationSettingsScreen}
                    />
                    <Stack.Screen
                        name="AccountType"
                        component={AccountTypeScreen}
                        options={{
                            presentation: 'modal',
                            animation: 'slide_from_bottom'
                        }}
                    />
                    <Stack.Screen
                        name="SwitchAccount"
                        component={SwitchAccountScreen}
                        options={{
                            presentation: 'modal',
                            animation: 'slide_from_bottom'
                        }}
                    />
                    <Stack.Screen
                        name="Onboarding"
                        component={OnboardingScreen}
                        options={{
                            presentation: 'fullScreenModal',
                            animation: 'slide_from_bottom'
                        }}
                    />
                    <Stack.Screen
                        name="AddAccount"
                        component={AddAccountScreen}
                        options={{
                            presentation: 'modal',
                            animation: 'slide_from_bottom'
                        }}
                    />
                    <Stack.Screen
                        name="Privacy"
                        component={PrivacyScreen}
                    />
                    <Stack.Screen
                        name="Security"
                        component={SecurityScreen}
                    />
                    <Stack.Screen
                        name="Help"
                        component={HelpScreen}
                    />
                    <Stack.Screen
                        name="Terms"
                        component={TermsScreen}
                    />
                    <Stack.Screen
                        name="PrivacyPolicy"
                        component={PrivacyPolicyScreen}
                    />
                    <Stack.Screen
                        name="BlockedUsers"
                        component={BlockedUsersScreen}
                        options={{ presentation: 'modal' }}
                    />
                    <Stack.Screen
                        name="ChangePassword"
                        component={ChangePasswordScreen}
                        options={{ presentation: 'modal' }}
                    />
                    <Stack.Screen
                        name="DefaultVisibility"
                        component={DefaultVisibilityScreen}
                        options={{ presentation: 'modal' }}
                    />
                    <Stack.Screen
                        name="HelpArticle"
                        component={HelpArticleScreen}
                        options={{ presentation: 'modal' }}
                    />
                </>
            )}
        </Stack.Navigator>
    );
};

export default AppNavigator;
