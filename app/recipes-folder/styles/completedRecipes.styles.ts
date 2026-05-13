import { StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';
import { commonStyles } from '../../../constants/Styles';

export const styles = StyleSheet.create({
  container: {  
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    ...commonStyles.loadingContainer,
  },
  loadingText: {
    ...commonStyles.loadingText,
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
  emptyContainer: {
    ...commonStyles.emptyContainer,
  },
  emptyTitle: {
    ...commonStyles.title,
    fontSize: 24,
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    ...commonStyles.emptyText,
  },
  header: {
    padding: 10,
    paddingTop: 20,
    marginBottom: 0,
    backgroundColor: Colors.background, 
  },
  title: {
    ...commonStyles.title,
    fontSize: 24,
    marginBottom: 8,
  },
  subtitle: {
    ...commonStyles.subtitle,
    fontSize: 14,
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
    position: 'relative',
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
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 4,
  },
  ingredientsPreview: {
    marginTop: 4,
  },
  ingredientsText: {
    fontSize: 14,
    color: Colors.text,
    fontStyle: 'italic',
  },
  retryButton: {
    ...commonStyles.primaryButton,
    marginTop: 16,
  },
  retryButtonText: {
    ...commonStyles.primaryButtonText,
  },
  findRecipesButton: {
    ...commonStyles.primaryButton,
  },
  findRecipesButtonText: {
    ...commonStyles.primaryButtonText,
  },
  searchSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    marginBottom: 0,
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10, 
    backgroundColor: Colors.background, 
  },
  searchBarContainer: {
    ...commonStyles.searchBarContainer,
    flex: 1,
    marginTop: 10,
    height: 48,
    paddingVertical: 0,
    justifyContent: 'center',
  },
  searchIcon: {
    ...commonStyles.searchIcon,
  },
  searchBar: {
    ...commonStyles.searchInput,
    paddingTop: 0,
    paddingBottom: 0,
    height: '100%',
  },
  sortButton: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    width: 48,
    height: 48,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  sortIconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sortIconZoomed: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  ratingContainer: {
    marginTop: 8,
  },
  mentionText: {
    marginTop: 4,
    fontSize: 16,
    color: Colors.text,
  },
  bottomDeleteContainer: {
    padding: -10, //aici
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAllButton: {
    ...commonStyles.resetButton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAllButtonText: {
    ...commonStyles.resetButtonText,
    marginLeft: 8,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    position: 'relative',
  },
  modalCloseButtonTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: Colors.card,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalRecipeImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  modalRecipeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    marginTop: 15,
    marginBottom: 8,
  },
  modalIngredientText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 4,
  },
  modalInstructionsText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  modalRatingContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  modalMentionText: {
    fontSize: 16,
    color: Colors.text,
    fontStyle: 'italic',
  },
  modalScrollContent: {
    paddingBottom: 40,
    paddingTop: 20,
  },
  deleteButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: Colors.card,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sortingInfoContainer: {
    backgroundColor: Colors.background,
    padding: 8,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 0,
    borderColor: Colors.border,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  sortingInfoText: {
    fontSize: 15,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
}); 

export default styles;