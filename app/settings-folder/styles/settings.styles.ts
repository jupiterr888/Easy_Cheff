import { StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    marginBottom: 15,
  },
  button: {
    backgroundColor: Colors.card,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    width: 38,
    height: 38,
    marginRight: 15,
    resizeMode: 'contain',
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonText: {
    fontSize: 16,
    color: Colors.primaryDark,
    fontWeight: '500',
  },
  buttonSubtext: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
  },
  buttonArrow: {
    marginLeft: 10,
  },
  deleteButton: {
    borderColor: Colors.error,
    marginTop: 20,
  },
  deleteButtonText: {
    color: Colors.error,
  },
  deleteButtonSubtext: {
    color: Colors.error,
    opacity: 0.7,
  },
}); 

export default styles;