import { StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';
import { commonStyles } from '../../../constants/Styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
  },
  title: {
    ...commonStyles.title,
    fontSize: 28,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  searchBarContainer: {
    ...commonStyles.searchBarContainer,
    flex: 1,
    height: 48,
    paddingVertical: 0,
    justifyContent: 'center',
    marginBottom: 2,
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
  recipeCard: {
    ...commonStyles.recipeCard,
    width: '100%',
    height: 'auto',
    marginBottom: 20,
  },
  recipeImage: {
    ...commonStyles.recipeImage,
    height: 220,
  },
  recipeContent: {
    padding: 5,
    alignItems: 'center',
  },
  recipeTitle: {
    ...commonStyles.recipeName,
    marginTop: 0,
    marginBottom: 0,
  },
  ingredientsBox: {
    backgroundColor: Colors.card,
    padding: 10,
    paddingVertical: 15,
    borderRadius: 12,
    width: '100%',
    borderColor: Colors.border,
    borderWidth: 0,
    marginTop: 10,
  },
  ingredientsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  ingredientColumn: {
    flex: 1,
    marginHorizontal: 8,
  },
  ingredientText: {
    fontSize: 15,
    textAlign: 'left',
    marginBottom: 6,
    flex: 1,
    lineHeight: 22,
  },
  ingredientAvailable: {
    color: Colors.owned,
    fontWeight: '600',
  },
  ingredientMissing: {
    color: Colors.text,
  },
  allAvailable: {
    marginTop: 10,
    marginBottom: 10,
    fontSize: 14,
    color: Colors.owned,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 30,
  },
  emptyContainer: {
    ...commonStyles.emptyContainer,
  },
  emptyText: {
    ...commonStyles.emptyText,
  },
  bannedIngredientName: {
    color: Colors.pinkicon,
    fontWeight: '500',
  },
  bannedIngredientItem: {
    backgroundColor: '#FFF0F5',
    borderColor: '#FFB6C1',
    borderRadius: 8,
  },
  bannedIngredientQuantity: {
    color: Colors.pinkicon,
  },
  bannedButtonIcon: {
    borderColor: Colors.pinkicon,
    backgroundColor: '#FFF0F5',
  },
  sortingInfoContainer: {
    backgroundColor: Colors.background,
    padding: 8,
    borderRadius: 12,
    marginBottom: 8,
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
  warningIcon: {
    marginLeft: 2,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
}); 

export default styles;