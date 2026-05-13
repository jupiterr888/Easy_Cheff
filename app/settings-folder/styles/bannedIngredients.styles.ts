import { StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.text,
    marginTop: 20,
    marginBottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 10,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: Colors.card,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bannedIngredientItem: {
    backgroundColor: '#FFF0F0',
    borderColor: Colors.border,
  },
  ingredientContent: {
    flex: 1,
    marginRight: 10,
  },
  ingredientName: {
    fontSize: 16,
    color: Colors.text,
  },
  bannedIngredientName: {
    color: Colors.pinkicon,
    fontWeight: '500',
  },
  bannedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  bannedText: {
    color: Colors.pinkicon,
    fontSize: 12,
    marginLeft: 4,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 15,
    marginBottom: -5,
  },
  searchIcon: {
    width: 36,
    height: 36,
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  seeBannedButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    flex: 1,
  },
  deleteAllButton: {
    backgroundColor: Colors.error,
    borderRadius: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAllButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
  seeBannedButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 24,
    width: 320,
    alignItems: 'stretch',
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: Colors.primaryDark,
    textAlign: 'center',
  },
  modalIngredient: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  closeModalButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginVertical: 20,
  },
}); 

export default styles;