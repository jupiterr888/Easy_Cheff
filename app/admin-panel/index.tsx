import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';
import { commonStyles } from '../../constants/Styles';
import { useAuth } from '../../app/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { 
  getPendingAdminRequests, 
  approveAdminRequest, 
  rejectAdminRequest, 
  AdminRequest,
  getUnapprovedRecipes,
  approveRecipe,
  rejectRecipe,
  RecipeForApproval,
  getAllUsers,
  getAllAdmins,
  getUserStatistics,
  UserInfo
} from '../../services/adminService';
import { styles } from './styles/adminPanel.styles';

type TabType = 'requests' | 'recipes' | 'users' | 'admins' | 'stats';

const TAB_OPTIONS: { label: string; value: TabType; icon: string }[] = [
  { label: 'Admin Requests', value: 'requests', icon: 'person-add' },
  { label: 'Recipe Approval', value: 'recipes', icon: 'checkmark-done' },
  { label: 'All Users', value: 'users', icon: 'people' },
  { label: 'All Admins', value: 'admins', icon: 'shield' },
  { label: 'User Statistics', value: 'stats', icon: 'bar-chart' },
];

export default function AdminPanelScreen() {
  const router = useRouter();
  const { isAdmin, user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('requests');
  const [showMenu, setShowMenu] = useState(false);
  
  // Requests state
  const [pendingRequests, setPendingRequests] = useState<AdminRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  // Recipes state
  const [unapprovedRecipes, setUnapprovedRecipes] = useState<RecipeForApproval[]>([]);
  
  // Users state
  const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
  const [allAdmins, setAllAdmins] = useState<UserInfo[]>([]);
  
  // Stats state
  const [selectedUserForStats, setSelectedUserForStats] = useState<UserInfo | null>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Redirecționează dacă utilizatorul nu este admin
  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'You do not have permission to access the admin panel.');
      router.back();
    }
  }, [isAdmin]);

  // Load data based on active tab
  const loadTabData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'requests') {
        const requests = await getPendingAdminRequests();
        setPendingRequests(requests);
      } else if (activeTab === 'recipes') {
        const recipes = await getUnapprovedRecipes();
        setUnapprovedRecipes(recipes);
      } else if (activeTab === 'users') {
        const users = await getAllUsers();
        setAllUsers(users);
      } else if (activeTab === 'admins') {
        const admins = await getAllAdmins();
        setAllAdmins(admins);
      } else if (activeTab === 'stats') {
        const users = await getAllUsers();
        setAllUsers(users);
      }
    } catch (error) {
      console.error('[AdminPanel] Error loading data:', error);
      Alert.alert('Error', 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadTabData();
    }, [activeTab])
  );

  const handleTabSelect = (tab: TabType) => {
    setActiveTab(tab);
    setShowMenu(false);
  };

  // ==================== REQUESTS HANDLERS ====================

  const handleApproveRequest = async (request: AdminRequest) => {
    if (!user?.uid) return;
    try {
      setActionLoading(true);
      await approveAdminRequest(request.userId, user.uid);
      Alert.alert('Success', `Approved for ${request.userName}`);
      loadTabData();
    } catch (error) {
      Alert.alert('Error', 'Failed to approve.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!user?.uid || !selectedRequest) return;
    try {
      setActionLoading(true);
      await rejectAdminRequest(selectedRequest.userId, user.uid, rejectionReason);
      Alert.alert('Success', `Rejected for ${selectedRequest.userName}`);
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      loadTabData();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPress = (request: AdminRequest) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  // ==================== RECIPES HANDLERS ====================

  const handleApproveRecipe = async (recipeId: string) => {
    if (!user?.uid) return;
    try {
      setActionLoading(true);
      await approveRecipe(recipeId, user.uid);
      Alert.alert('Success', 'Recipe approved!');
      loadTabData();
    } catch (error) {
      Alert.alert('Error', 'Failed to approve recipe.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRecipe = async (recipeId: string) => {
    if (!user?.uid) return;
    try {
      setActionLoading(true);
      await rejectRecipe(recipeId, user.uid);
      Alert.alert('Success', 'Recipe rejected!');
      loadTabData();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject recipe.');
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== STATS HANDLERS ====================

  const handleSelectUserForStats = async (userItem: UserInfo) => {
    setSelectedUserForStats(userItem);
    try {
      const stats = await getUserStatistics(userItem.uid);
      setUserStats(stats);
      setShowStatsModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load statistics.');
    }
  };

  // ==================== RENDER FUNCTIONS ====================

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={{ justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }

    switch (activeTab) {
      case 'requests':
        return renderRequestsTab();
      case 'recipes':
        return renderRecipesTab();
      case 'users':
        return renderUsersTab();
      case 'admins':
        return renderAdminsTab();
      case 'stats':
        return renderStatsTab();
      default:
        return null;
    }
  };

  const renderRequestsTab = () => {
    if (pendingRequests.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle" size={48} color={Colors.primary} />
          <Text style={styles.emptyTitle}>No Pending Requests</Text>
        </View>
      );
    }

    return (
      <View style={styles.itemsList}>
        {pendingRequests.map((request, index) => (
          <View key={index} style={styles.itemCard}>
            <Text style={styles.itemTitle}>{request.userName}</Text>
            <Text style={styles.itemSubtitle}>{request.userEmail}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={[styles.button, styles.approveButton]} onPress={() => handleApproveRequest(request)} disabled={actionLoading}>
                <Ionicons name="checkmark" size={14} color={Colors.background} />
                <Text style={styles.buttonText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={() => handleRejectPress(request)} disabled={actionLoading}>
                <Ionicons name="close" size={14} color={Colors.background} />
                <Text style={styles.buttonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderRecipesTab = () => {
    if (unapprovedRecipes.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle" size={48} color={Colors.primary} />
          <Text style={styles.emptyTitle}>No Pending Recipes</Text>
        </View>
      );
    }

    return (
      <View style={styles.itemsList}>
        {unapprovedRecipes.map((recipe, index) => (
          <View key={index} style={styles.itemCard}>
            <Text style={styles.itemTitle}>{recipe.title}</Text>
            <Text style={styles.itemSubtitle}>{recipe.authorName || 'Unknown'}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={[styles.button, styles.approveButton]} onPress={() => handleApproveRecipe(recipe.id)} disabled={actionLoading}>
                <Ionicons name="checkmark" size={14} color={Colors.background} />
                <Text style={styles.buttonText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={() => handleRejectRecipe(recipe.id)} disabled={actionLoading}>
                <Ionicons name="close" size={14} color={Colors.background} />
                <Text style={styles.buttonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderUsersTab = () => {
    if (allUsers.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Users</Text>
        </View>
      );
    }

    return (
      <FlatList
        scrollEnabled={false}
        data={allUsers}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <Text style={styles.itemTitle}>{item.displayName}</Text>
            <Text style={styles.itemSubtitle}>{item.email || 'No email'}</Text>
            {item.isAdmin && <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>Admin</Text></View>}
          </View>
        )}
      />
    );
  };

  const renderAdminsTab = () => {
    if (allAdmins.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Admins</Text>
        </View>
      );
    }

    return (
      <FlatList
        scrollEnabled={false}
        data={allAdmins}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
              <Text style={styles.itemTitle}>{item.displayName}</Text>
            </View>
            <Text style={styles.itemSubtitle}>{item.email || 'No email'}</Text>
          </View>
        )}
      />
    );
  };

  const renderStatsTab = () => {
    if (allUsers.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Users</Text>
        </View>
      );
    }

    return (
      <FlatList
        scrollEnabled={false}
        data={allUsers}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.itemCard} onPress={() => handleSelectUserForStats(item)}>
            <Text style={styles.itemTitle}>{item.displayName}</Text>
            <Text style={styles.itemSubtitle}>{item.email || 'No email'}</Text>
            <View style={{ marginTop: 8 }}>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        )}
      />
    );
  };

  const currentTabLabel = TAB_OPTIONS.find(t => t.value === activeTab)?.label || 'Admin Panel';

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header with Dropdown Menu */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <TouchableOpacity style={styles.menuButton} onPress={() => setShowMenu(!showMenu)}>
            <Ionicons name={showMenu ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.primary} />
            <Text style={styles.menuButtonText}>{currentTabLabel}</Text>
          </TouchableOpacity>
        </View>

        {/* Dropdown Menu */}
        {showMenu && (
          <View style={styles.dropdownMenu}>
            {TAB_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.menuItem, activeTab === option.value && styles.activeMenuItem]}
                onPress={() => handleTabSelect(option.value)}
              >
                <Ionicons name={option.icon as any} size={16} color={activeTab === option.value ? Colors.primary : Colors.text} />
                <Text style={[styles.menuItemText, activeTab === option.value && styles.activeMenuItemText]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} scrollEnabled={false}>
        {renderTabContent()}
      </ScrollView>

      {/* Reject Modal */}
      <Modal visible={showRejectModal} transparent={true} animationType="fade" onRequestClose={() => !actionLoading && setShowRejectModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Request</Text>
            <Text style={styles.modalSubtitle}>Rejecting: {selectedRequest?.userName}</Text>
            <TextInput style={styles.reasonInput} placeholder="Reason (optional)" placeholderTextColor={Colors.muted} value={rejectionReason} onChangeText={setRejectionReason} multiline numberOfLines={3} editable={!actionLoading} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => !actionLoading && setShowRejectModal(false)} disabled={actionLoading}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleRejectRequest} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator color={Colors.background} /> : <Text style={styles.confirmButtonText}>Reject</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Stats Modal */}
      <Modal visible={showStatsModal} transparent={true} animationType="fade" onRequestClose={() => setShowStatsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.statsModalContent}>
            <View style={styles.statsModalHeader}>
              <Text style={styles.statsModalTitle}>{selectedUserForStats?.displayName}</Text>
              <TouchableOpacity onPress={() => setShowStatsModal(false)}>
                <Ionicons name="close" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {userStats && (
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Total Recipes</Text>
                  <Text style={styles.statNumber}>{userStats.totalRecipes}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Approved</Text>
                  <Text style={styles.statNumber}>{userStats.approvedRecipes}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Pending</Text>
                  <Text style={styles.statNumber}>{userStats.pendingRecipes}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity style={[commonStyles.logoutButton, { marginTop: 12 }]} onPress={() => setShowStatsModal(false)}>
              <Text style={commonStyles.logoutButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
