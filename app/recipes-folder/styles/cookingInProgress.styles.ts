import { StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },  
  content: {
    padding: 20,
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.text,
  },
  image: {
    width: '100%',
    height: 250,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    marginBottom: 20,
    textAlign: 'center',
  },
  ingredientsContainer: {
    backgroundColor: Colors.card,
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    marginBottom: 10,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ingredientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingredientName: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  ingredientQuantity: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 10,
  },
  instructionsContainer: {
    backgroundColor: Colors.card,
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  instruction: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 12,
  },
  completeButton: {
    backgroundColor: Colors.owned,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  completeButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  conflictingItem: {
    backgroundColor: Colors.palepink,
  },
  conflictingText: {
    color: Colors.error,
    textDecorationLine: 'underline',
  },
  conflictIcon: {
    marginLeft: 8,
    padding: 4,
  },
}); 

export default styles;