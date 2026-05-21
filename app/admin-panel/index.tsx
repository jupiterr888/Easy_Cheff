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
          <Ionicons name="checkmark-circle" size={44} color={Colors.primary} />
          <Text style={styles.emptyTitle}>No Pending Requests</Text>
          <Text style={styles.emptyText}>All admin requests have been processed</Text>
        </View>
      );
    }

    return (
      <View style={styles.itemsList}>
        {pendingRequests.map((request, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{request.userName}</Text>
                <Text style={styles.itemSubtitle}>{request.userEmail}</Text>
              </View>
              <View style={{ backgroundColor: Colors.primary + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 9, fontWeight: '600', color: Colors.primary }}>NEW</Text>
              </View>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={[styles.button, styles.approveButton]} onPress={() => handleApproveRequest(request)} disabled={actionLoading}>
                <Ionicons name="checkmark" size={13} color={Colors.background} />
                <Text style={styles.buttonText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={() => handleRejectPress(request)} disabled={actionLoading}>
                <Ionicons name="close" size={13} color={Colors.background} />
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
          <Ionicons name="checkmark-circle" size={44} color={Colors.primary} />
          <Text style={styles.emptyTitle}>No Pending Recipes</Text>
          <Text style={styles.emptyText}>All recipe submissions are approved</Text>
        </View>
      );
    }

    return (
      <View style={styles.itemsList}>
        {unapprovedRecipes.map((recipe, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle} numberOfLines={1}>{recipe.title}</Text>
                <Text style={styles.itemSubtitle}>by {recipe.authorName || 'Unknown'}</Text>
              </View>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={[styles.button, styles.approveButton]} onPress={() => handleApproveRecipe(recipe.id)} disabled={actionLoading}>
                <Ionicons name="checkmark" size={13} color={Colors.background} />
                <Text style={styles.buttonText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={() => handleRejectRecipe(recipe.id)} disabled={actionLoading}>
                <Ionicons name="close" size={13} color={Colors.background} />
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
          <Ionicons name="people" size={44} color={Colors.primary} />
          <Text style={styles.emptyTitle}>No Users</Text>
          <Text style={styles.emptyText}>No users in the system</Text>
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.displayName}</Text>
                <Text style={styles.itemSubtitle} numberOfLines={1}>{item.email || 'No email'}</Text>
              </View>
              {item.isAdmin && (
                <View style={styles.adminBadge}>
                  <Ionicons name="shield-checkmark" size={12} color={Colors.primary} />
                </View>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Users</Text>
          </View>
        }
      />
    );
  };

  const renderAdminsTab = () => {
    if (allAdmins.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="shield" size={44} color={Colors.primary} />
          <Text style={styles.emptyTitle}>No Admins</Text>
          <Text style={styles.emptyText}>No administrator accounts</Text>
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
              <View style={{ backgroundColor: Colors.primary + '15', padding: 6, borderRadius: 6 }}>
                <Ionicons name="shield-checkmark" size={13} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.displayName}</Text>
                <Text style={styles.itemSubtitle} numberOfLines={1}>{item.email || 'No email'}</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Admins</Text>
          </View>
        }
      />
    );
  };

  const renderStatsTab = () => {
    if (allUsers.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="bar-chart" size={44} color={Colors.primary} />
          <Text style={styles.emptyTitle}>No Users</Text>
          <Text style={styles.emptyText}>No user statistics available</Text>
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.displayName}</Text>
                <Text style={styles.itemSubtitle} numberOfLines={1}>{item.email || 'No email'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Users</Text>
          </View>
        }
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
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
              <View>
                <Text style={styles.statsModalTitle}>{selectedUserForStats?.displayName}</Text>
                <Text style={styles.itemSubtitle}>{selectedUserForStats?.email}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowStatsModal(false)}>
                <Ionicons name="close" size={18} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {userStats && (
              <View>
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Ionicons name="document-text" size={16} color={Colors.primary} style={{ marginBottom: 4 }} />
                    <Text style={styles.statLabel}>Total</Text>
                    <Text style={styles.statNumber}>{userStats.totalRecipes}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} style={{ marginBottom: 4 }} />
                    <Text style={styles.statLabel}>Approved</Text>
                    <Text style={styles.statNumber}>{userStats.approvedRecipes}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Ionicons name="time" size={16} color={Colors.warning} style={{ marginBottom: 4 }} />
                    <Text style={styles.statLabel}>Pending</Text>
                    <Text style={styles.statNumber}>{userStats.pendingRecipes}</Text>
                  </View>
                </View>

                {userStats.totalRecipes > 0 && (
                  <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.muted, marginBottom: 6 }}>Approval Rate</Text>
                    <View style={{ backgroundColor: Colors.card, borderRadius: 8, overflow: 'hidden', height: 6 }}>
                      <View 
                        style={{ 
                          backgroundColor: Colors.success, 
                          height: '100%',
                          width: `${(userStats.approvedRecipes / userStats.totalRecipes) * 100}%`
                        }} 
                      />
                    </View>
                    <Text style={{ fontSize: 11, color: Colors.muted, marginTop: 4 }}>
                      {((userStats.approvedRecipes / userStats.totalRecipes) * 100).toFixed(0)}% approved
                    </Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity 
              style={[styles.modalButton, styles.confirmButton, { marginTop: 12 }]} 
              onPress={() => setShowStatsModal(false)}
            >
              <Text style={styles.confirmButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
