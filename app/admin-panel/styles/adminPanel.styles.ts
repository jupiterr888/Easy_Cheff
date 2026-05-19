import { StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';

export const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 12,
  },
  
  // TABS - COMPACT
  tabsContainer: {
    backgroundColor: Colors.background,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    paddingVertical: 6,
    marginBottom: 12,
    marginHorizontal: -12,
    paddingHorizontal: 8,
  },
  tab: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginHorizontal: 3,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 11,
    color: Colors.muted,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.background,
    fontWeight: '600',
  },

  // LISTS
  itemsList: {
    gap: 10,
    paddingVertical: 4,
  },
  itemCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 6,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginBottom: 3,
  },
  itemSubtitle: {
    fontSize: 11,
    color: Colors.muted,
    marginBottom: 8,
  },

  // ACTION BUTTONS
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  approveButton: {
    backgroundColor: Colors.success,
  },
  rejectButton: {
    backgroundColor: Colors.error,
  },
  buttonText: {
    color: Colors.background,
    fontSize: 11,
    fontWeight: '600',
  },

  // EMPTY STATE
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    minHeight: 300,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.muted,
    marginTop: 6,
    textAlign: 'center',
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 16,
    width: '85%',
    maxWidth: 380,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.muted,
    marginBottom: 14,
  },
  reasonInput: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: 13,
    marginBottom: 14,
    maxHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmButton: {
    backgroundColor: Colors.error,
  },
  cancelButtonText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: Colors.background,
    fontSize: 13,
    fontWeight: '600',
  },

  // ADMIN BADGE
  adminBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginTop: 6,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.background,
  },

  // STATS
  statsUsersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  userStatCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 10,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  userStatCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.muted,
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
  },

  // LEGACY (KEPT FOR COMPATIBILITY)
  requestsList: {
    gap: 10,
  },
  requestCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginBottom: 3,
  },
  userEmail: {
    fontSize: 11,
    color: Colors.muted,
  },
  statusBadge: {
    backgroundColor: Colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.background,
  },
  requestDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 11,
    color: Colors.muted,
  },
  header: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    marginBottom: 3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.muted,
  },
});

export default styles;

