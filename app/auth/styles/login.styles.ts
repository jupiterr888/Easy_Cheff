import { StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';
import { commonStyles } from '../../../constants/Styles';

export const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    scrollContent: {
      flexGrow: 1,
    },
    logoContainer: {
      alignItems: 'center',
      marginTop: 40,
      marginBottom: 30,
    },
    logo: {
      width: 120,
      height: 120,
      marginTop: -20,
      marginBottom: 20,
      resizeMode: 'contain',
      borderColor: Colors.primaryDark,
      borderWidth: 3,
      borderRadius: 60,
    },
    formContainer: {
      paddingHorizontal: 24,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: Colors.primaryDark,
      marginTop: -20,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: Colors.text,
      marginBottom: 32,
    },
    input: {
      backgroundColor: Colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      fontSize: 16,
      color: Colors.text,
      shadowColor: Colors.textDark,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    passwordContainer: {
      marginBottom: 16,
    },
    forgotPasswordLink: {
      alignSelf: 'flex-end',
      marginTop: 8,
    },
    forgotPasswordText: {
      color: Colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    keepLoggedInContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: Colors.primary,
      borderRadius: 4,
      marginRight: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxInner: {
      width: 12,
      height: 12,
      borderRadius: 2,
    },
    checkboxChecked: {
      backgroundColor: Colors.primary,
    },
    keepLoggedInText: {
      fontSize: 14,
      color: Colors.text,
    },
    loginButton: {
      backgroundColor: Colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 16,
      shadowColor: Colors.textDark,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    loginButtonText: {
      color: Colors.textLight,
      fontSize: 16,
      fontWeight: 'bold',
    },
    registerButton: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    registerButtonText: {
      color: Colors.primary,
      fontSize: 14,
    },
  }); 

  export default styles;