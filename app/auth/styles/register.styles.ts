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
    content: {
      flex: 1,
      padding: 24,
      justifyContent: 'center',
    },
    logo: {
      width: 120,
      height: 120,
      alignSelf: 'center',
      
      marginBottom: 20,
      resizeMode: 'contain',
      borderColor: Colors.primaryDark,
      borderWidth: 3,
      borderRadius: 60,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: Colors.primaryDark,
      textAlign: 'center',
      
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: Colors.text,
      textAlign: 'center',
      marginBottom: 10,
    },
    form: {
      gap: 10,
    },
    inputContainer: {
      gap: 8,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.primaryDark,
    },
    input: {
      backgroundColor: Colors.card,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: Colors.text,
      shadowColor: Colors.textDark,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    registerButton: {
      backgroundColor: Colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 10,
      shadowColor: Colors.textDark,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    registerButtonDisabled: {
      opacity: 0.7,
    },
    registerButtonText: {
      color: Colors.textLight,
      fontSize: 16,
      fontWeight: 'bold',
    },
    loginContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
    },
    loginText: {
      fontSize: 14,
      color: Colors.text,
    },
    loginLink: {
      fontSize: 14,
      color: Colors.primary,
      fontWeight: '600',
    },
    passwordRequirements: {
      fontSize: 12,
      color: Colors.muted,
      marginTop: 4,
      marginLeft: 4,
    },
  }); 

  export default styles;