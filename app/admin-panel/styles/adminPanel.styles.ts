import { StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';

export const styles = StyleSheet.create({
  // HEADER
  headerContainer: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  menuButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.background,
  },
  dropdownMenu: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  activeMenuItem: {
    backgroundColor: Colors.primary + '10',
  },
  menuItemText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
  },
  activeMenuItemText: {
    color: Colors.primary,
    fontWeight: '600',
  },

  content: {
    flex: 1,
    padding: 10,
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
    gap: 6,
    paddingVertical: 2,
  },
  itemCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 9,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginBottom: 1,
  },
  itemSubtitle: {
    fontSize: 10,
    color: Colors.muted,
    marginBottom: 7,
  },

  // ACTION BUTTONS
  actionButtons: {
    flexDirection: 'row',
    gap: 5,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 7,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  approveButton: {
    backgroundColor: Colors.success,
  },
  rejectButton: {
    backgroundColor: Colors.error,
  },
  buttonText: {
    color: Colors.background,
    fontSize: 9,
    fontWeight: '600',
  },

  // EMPTY STATE
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    minHeight: 200,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginTop: 10,
  },
  emptyText: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 4,
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
    padding: 13,
    width: '88%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statsModalContent: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 13,
    width: '88%',
    maxWidth: 350,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statsModalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 3,
  },
  modalSubtitle: {
    fontSize: 11,
    color: Colors.muted,
    marginBottom: 10,
  },
  reasonInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 9,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: 11,
    marginBottom: 10,
    maxHeight: 65,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 8,
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
    fontSize: 11,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: Colors.background,
    fontSize: 11,
    fontWeight: '600',
  },

  // ADMIN BADGE
  adminBadge: {
    backgroundColor: Colors.primary + '18',
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRadius: 6,
    marginTop: 0,
    borderWidth: 0.5,
    borderColor: Colors.primary + '40',
  },
  adminBadgeText: {
    fontSize: 8,
    fontWeight: '600',
    color: Colors.primary,
  },

  // STATS
  statsUsersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  userStatCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 7,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userStatCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
    borderWidth: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 7,
    marginVertical: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 7,
    marginVertical: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 9,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statLabel: {
    fontSize: 9,
    color: Colors.muted,
    marginBottom: 3,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
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
  headerSubtitle: {
    fontSize: 13,
    color: Colors.muted,
  },
});

export default styles;

