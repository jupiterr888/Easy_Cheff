import { StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';
import { commonStyles } from '../../../constants/Styles';

export const styles = StyleSheet.create({
    content: {
      flex: 1,
      padding: 20,
    },
    profileImageContainer: {
      position: 'relative',
    },
    editImageButton: {
      position: 'absolute',
      right: 0,
      bottom: 15,
      backgroundColor: Colors.primary,
      borderRadius: 15,
      width: 30,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: Colors.background,
    },
    nameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
      position: 'relative',
    },
    editNameButton: {
      position: 'absolute',
      right: -40,
      backgroundColor: Colors.primary,
      borderRadius: 15,
      width: 30,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: Colors.background,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: Colors.background,
      borderRadius: 20,
      padding: 20,
      width: '80%',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colors.primaryDark,
      marginBottom: 20,
    },
    nameInput: {
      backgroundColor: Colors.card,
      padding: 15,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors.border,
      color: Colors.primaryDark,
      fontSize: 16,
      width: '100%',
      marginBottom: 20,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    modalButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 10,
      minWidth: 100,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: Colors.card,
    },
    saveButton: {
      backgroundColor: Colors.primary,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    cancelButtonText: {
      color: Colors.error,
      fontSize: 16,
      fontWeight: 'bold',
    },
    saveButtonText: {
      color: Colors.background,
      fontSize: 16,
      fontWeight: 'bold',
    },
    imageOptions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginBottom: 20,
    },
    imageOption: {
      alignItems: 'center',
      padding: 10,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: Colors.border,
    },
    selectedImage: {
      borderColor: Colors.primary,
      backgroundColor: Colors.card,
    },
    optionImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginBottom: 10,
    },
    optionText: {
      fontSize: 16,
      color: Colors.text,
    },
}); 

// Add default export
export default function ProfileStyles() {
    return null;
}

