import { StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';
import { commonStyles } from '../../../constants/Styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  menuIconImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    borderRadius: 60,
    borderWidth: 2,
    borderColor: Colors.primaryDark,
    marginRight: 20,
  },
  menuText: {
    flex: 1,
    paddingVertical: 6,
  },
  shoppingListContent: {
    flexDirection: 'column',
  },
  shoppingListPreviewContainer: {
    marginBottom: 8,
  },
  viewListButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.primaryDark,
    alignItems: 'center',
  },
  viewListButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    gap: 10,
    paddingHorizontal: 4,
  },
  shoppingItemCard: {
    flex: 1,
    minHeight: 32,
    padding: 5,
    margin: 6,
    justifyContent: 'flex-start',
    maxWidth: '47%',
  },
  shoppingItemText: {
    fontSize: 14,
    lineHeight: 20,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
});

export default function PantryStyles() {
    return null;
} 

