import { StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';
import { commonStyles } from '../../../constants/Styles';



export const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f9fbfd',
    },
    content: {
      flex: 1,
      padding: 20,
      paddingTop: 50,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: Colors.primaryDark,
      marginBottom: 20,
      marginTop: -20,
      textAlign: 'center',
    },
    searchAndSortContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
      gap: 10,
    },
    searchBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors.border,
      paddingHorizontal: 15,
      flex: 1,
    },
    searchIcon: {
      width: 36,
      height: 36,
      marginRight: 10,
    },
    searchBar: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 16,
      color: Colors.text,
    },
    listContainer: {
      paddingBottom: 30,
    },
    ingredientItem: {
      backgroundColor: Colors.surface,
      padding: 15,
      borderRadius: 12,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
    },
    selectedItem: {
      backgroundColor: Colors.success,
      borderColor: Colors.success,
      borderWidth: 1,
    },
    ingredientName: {
      fontSize: 16,
      color: Colors.primaryDark,
    },
    selectedText: {
      color: Colors.rating,
      fontWeight: 'bold',
    },
    quantityText: {
      color: Colors.primary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: Colors.primary,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: Colors.surface,
      borderRadius: 12,
      padding: 20,
      width: '80%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colors.primaryDark,
      marginBottom: 15,
      textAlign: 'center',
    },
    quantityInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    quantityInput: {
      backgroundColor: Colors.surface,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    unitText: {
      fontSize: 16,
      color: Colors.primaryDark,
      fontWeight: '500',
      marginLeft: 8,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    modalButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      marginHorizontal: 5,
    },
    cancelButton: {
      backgroundColor: Colors.surface,
    },
    confirmButton: {
      backgroundColor: Colors.primary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
      color: Colors.primaryDark,
    },
    confirmButtonText: {
      color: Colors.textLight,
    },
    measurementTypeContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 15,
    },
    measurementTypeButton: {
      backgroundColor: Colors.surface,
      padding: 8,
      borderRadius: 8,
      marginBottom: 8,
      width: '48%',
      alignItems: 'center',
    },
    selectedMeasurementType: {
      backgroundColor: Colors.primary,
    },
    measurementTypeText: {
      fontSize: 14,
      color: Colors.primaryDark,
    },
    selectedMeasurementTypeText: {
      color: Colors.textLight,
      fontWeight: 'bold',
    },
    weightText: {
      color: Colors.primary,
    },
    otherText: {
      color: Colors.text,
      fontStyle: 'italic',
    },
    inPantryItem: {
      backgroundColor: Colors.background,
      borderColor: Colors.border,
      borderWidth: 1,
    },
    inPantryText: {
      color: Colors.textDark,
      fontWeight: 'bold',
    },
    notInPantryText: {
      color: Colors.text,
    },
    ingredientInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    conflictingItem: {
      borderColor: Colors.error,
      borderWidth: 1,
    },
    conflictingText: {
      color: Colors.error,
      textDecorationLine: 'underline',
    },
    conflictBadge: {
      backgroundColor: Colors.palepink,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: Colors.error,
      borderRadius: 4,
      marginLeft: 8,
    },
    conflictBadgeText: {
      color: Colors.error,
      fontSize: 12,
      fontWeight: '500',
    },
    sortButton: {
      width: 45,
      height: 45,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 12,
      backgroundColor: Colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    sortIconContainer: {
      width: 45,
      height: 45,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    sortIconZoomed: {
      width: 36,
      height: 36,
      resizeMode: 'contain',
    },
  });

  export default styles;