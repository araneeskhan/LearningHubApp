import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  TextInput,
  ActivityIndicator,
  Text,
  Switch,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';
import Toast from 'react-native-toast-message';

export default function ProfileScreen() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut, updateUserProfile } = useAuth();
  const colors = Colors[theme];
  const router = useRouter();
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    // Check subscription status (mock for now)
    setHasActiveSubscription(false);
  }, []);

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
  };

  const handleUpdateProfile = async () => {
    if (!newName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Name cannot be empty',
      });
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile({ name: newName.trim() });
      setEditModalVisible(false);
      Toast.show({
        type: 'success',
        text1: 'Profile updated successfully',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to update profile',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const showToast = {
    info: (message: string) => {
      Toast.show({
        type: 'info',
        text1: message,
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 15 }}
          style={[styles.profileHeader, { backgroundColor: colors.primary }]}
        >
          <LinearGradient
            colors={theme === 'light' 
              ? ['#4F6EF7', '#5A7BFF'] 
              : ['#2A2D3A', '#1F2232']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.profileImageContainer}>
              <View style={[styles.profileImage, { backgroundColor: colors.card }]}>
                <IconSymbol name="person.fill" size={40} color={colors.primary} />
              </View>
            </View>
            
            <ThemedText style={styles.profileName}>
              {user?.name || user?.email?.split('@')[0] || 'User'}
            </ThemedText>
            <ThemedText style={styles.profileEmail}>{user?.email}</ThemedText>
            
            <TouchableOpacity 
              style={[styles.editButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEditModalVisible(true);
              }}
            >
              <IconSymbol name="pencil" size={16} color="#FFFFFF" />
              <ThemedText style={styles.editButtonText}>Edit Profile</ThemedText>
            </TouchableOpacity>
          </LinearGradient>
        </MotiView>
        
        {/* Settings Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 15, delay: 100 }}
          style={[styles.settingsSection, { backgroundColor: colors.card }]}
        >
          <ThemedText style={styles.sectionTitle}>Settings</ThemedText>
          
          <ProfileMenuItem 
            icon="moon.fill" 
            title="Dark Mode" 
            onPress={toggleTheme}
            rightElement={
              <View style={styles.toggleContainer}>
                <View 
                  style={[
                    styles.toggleOption, 
                    theme === 'light' && styles.toggleActive,
                    theme === 'light' && { backgroundColor: colors.primary }
                  ]}
                >
                  <ThemedText style={[
                    styles.toggleText,
                    theme === 'light' && { color: '#FFFFFF' }
                  ]}>Light</ThemedText>
                </View>
                <View 
                  style={[
                    styles.toggleOption, 
                    theme === 'dark' && styles.toggleActive,
                    theme === 'dark' && { backgroundColor: colors.primary }
                  ]}
                >
                  <ThemedText style={[
                    styles.toggleText,
                    theme === 'dark' && { color: '#FFFFFF' }
                  ]}>Dark</ThemedText>
                </View>
              </View>
            }
          />
          
          <ProfileMenuItem 
            icon="bell.fill" 
            title="Notifications" 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              showToast.info('Notifications settings coming soon');
            }}
          />
          
          <ProfileMenuItem 
            icon="lock.fill" 
            title="Privacy" 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              showToast.info('Privacy settings coming soon');
            }}
          />
        </MotiView>
        
        {/* Subscription Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 15, delay: 200 }}
          style={[styles.settingsSection, { backgroundColor: colors.card }]}
        >
          <ThemedText style={styles.sectionTitle}>Subscription</ThemedText>
          
          <TouchableOpacity 
            style={styles.subscriptionCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/subscription');
            }}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.subscriptionGradient}
            >
              <View style={styles.subscriptionContent}>
                <View>
                  <Text style={styles.subscriptionTitle}>Premium Plan</Text>
                  <Text style={styles.subscriptionDescription}>
                    Unlock all premium courses and features
                  </Text>
                </View>
                <IconSymbol name="crown.fill" size={30} color="#FFFFFF" />
              </View>
              
              <TouchableOpacity 
                style={styles.subscribeButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/subscription');
                }}
              >
                <Text style={styles.subscribeButtonText}>
                  {hasActiveSubscription ? 'Manage Subscription' : 'Subscribe Now'}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </TouchableOpacity>
        </MotiView>
        
        {/* Account Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 15, delay: 300 }}
          style={[styles.settingsSection, { backgroundColor: colors.card }]}
        >
          <ThemedText style={styles.sectionTitle}>Account</ThemedText>
          
          <ProfileMenuItem
            icon="envelope.fill"
            title="Contact Support"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              showToast.info('Support contact coming soon');
            }}
          />
          
          <ProfileMenuItem
            icon="doc.text.fill"
            title="Terms of Service"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              showToast.info('Terms of Service coming soon');
            }}
          />
          
          <ProfileMenuItem
            icon="arrow.right.square.fill"
            title="Sign Out"
            onPress={handleSignOut}
          />
        </MotiView>
      </ScrollView>
      
      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Edit Profile</ThemedText>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <IconSymbol name="xmark.circle.fill" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Name</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border
                  }
                ]}
                value={newName}
                onChangeText={setNewName}
                placeholder="Enter your name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleUpdateProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
              )}
            </TouchableOpacity>
          </ThemedView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ProfileMenuItem({ 
  icon, 
  title, 
  onPress,
  rightElement
}: { 
  icon: string; 
  title: string; 
  onPress: () => void;
  rightElement?: React.ReactNode;
}) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  return (
    <TouchableOpacity 
      style={[styles.menuItem]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <IconSymbol name={icon} size={18} color={colors.primary} />
        </View>
        <ThemedText style={styles.menuItemTitle}>{title}</ThemedText>
      </View>
      
      {rightElement ? (
        rightElement
      ) : (
        <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  profileHeader: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  settingsSection: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 20,
    padding: 2,
  },
  toggleOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  toggleActive: {
    backgroundColor: '#4F6EF7',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  subscriptionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  subscriptionGradient: {
    padding: 20,
  },
  subscriptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  subscriptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subscriptionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  subscribeButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#FF8A00',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  }
});