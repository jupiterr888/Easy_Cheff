import { StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';
import { commonStyles } from '../../../constants/Styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginVertical: 20,
  },
  header: {
    padding: 5,
    marginTop: 10,
    backgroundColor: Colors.background,
  },
  title: {
    ...commonStyles.title,
    fontSize: 24,
    marginBottom: 0,
    marginTop: -10,
  },
  subtitle: {
    ...commonStyles.subtitle,
    fontSize: 16,
    marginBottom: 0,
  },
  listContainer: {
    padding: 16,
  },
  recipeCard: {
    ...commonStyles.recipeCard,
    width: '100%',
    height: 'auto',
    marginBottom: 16,
  },
  recipeImage: {
    ...commonStyles.recipeImage,
    height: 200,
  },
  recipeInfo: {
    padding: 16,
  },
  recipeTitle: {
    ...commonStyles.recipeName,
    marginBottom: 8,
  },
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  missingText: {
    fontSize: 14,
    color: Colors.border,
  },
  pantryButton: {
    ...commonStyles.primaryButton,
    marginTop: 16,
  },
  pantryButtonText: {
    ...commonStyles.primaryButtonText,
  },
  reviewButton: {
    ...commonStyles.quickAccessButton,
    margin: 16,
    marginTop: 5,
    marginBottom: 15,
  },
  reviewButtonText: {
    ...commonStyles.quickAccessButtonText,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    ...commonStyles.modalContent,
    width: '85%',
    maxHeight: '70%',
  },
  modalTitle: {
    ...commonStyles.modalTitle,
  },
  modalScroll: {
    width: '100%',
    maxHeight: 220,
    marginBottom: 16,
  },
  modalScrollContent: {
    alignItems: 'flex-start',
  },
  modalIngredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
    alignSelf: 'stretch',
  },
  modalIngredientName: {
    ...commonStyles.ingredientName,
  },
  modalIngredientQtyBox: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  modalIngredientQty: {
    ...commonStyles.ingredientQuantity,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  modalOkButton: {
    ...commonStyles.primaryButton,
    flex: 1,
    marginRight: 8,
  },
  modalOkButtonText: {
    ...commonStyles.primaryButtonText,
    textAlign: 'center',
  },
  modalModifyButton: {
    ...commonStyles.secondaryButton,
    flex: 1,
    marginLeft: 8,
  },
  modalModifyButtonText: {
    ...commonStyles.secondaryButtonText,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.border,
    textAlign: 'center',
    marginVertical: 20,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
}); 

export default styles;