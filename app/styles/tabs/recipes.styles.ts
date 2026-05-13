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
    swiper: {
      marginBottom: 20,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: Colors.primary,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 9,
    },
    refreshButton: {
      backgroundColor: Colors.card,
      marginLeft: 15,
      padding: 5,
      borderWidth: 1.5,
      borderColor: Colors.primaryDark,
      borderRadius: 25,
      marginTop: -20,
    },
  });

export default function RecipesStyles() {
    return null;
}

