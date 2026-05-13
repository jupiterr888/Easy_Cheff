import { StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: Colors.primaryDark,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: Colors.card,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.primaryDark,
    fontSize: 16,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '500',
  },
  historyContainer: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginBottom: 15,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  historyContent: {
    flex: 1,
    marginRight: 10,
  },
  historyName: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: Colors.half,
  },
  deleteIcon: {
    marginRight: 10,
  },
}); 

export default styles;