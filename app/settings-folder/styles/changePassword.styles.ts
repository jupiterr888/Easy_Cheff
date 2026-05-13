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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: Colors.primaryDark,
    marginBottom: 8,
    fontWeight: '500',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  passwordInput: {
    flex: 1,
    borderWidth: 0,
    paddingRight: 40,
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
  eyeIcon: {
    position: 'absolute',
    right: 10,
    padding: 5,
  },
  passwordRequirements: {
    fontSize: 12,
    color: Colors.half,
    marginTop: 4,
    marginLeft: 4,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '500',
  },
  forgotPasswordLink: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
}); 

export default styles;