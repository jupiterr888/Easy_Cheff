import { StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';
import { commonStyles } from '../../../constants/Styles';

export const styles = StyleSheet.create({
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      paddingHorizontal: 10,
    },
    logo: {
      width: 130,
      height: 130,
      marginTop: 0,
      marginBottom: -10,
      resizeMode: 'contain',
      borderColor: Colors.primaryDark,
      borderWidth: 3,
      borderRadius: 70,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'left',
      marginLeft: 15,
      marginBottom: 0,
    },
    scenarioContainer: {
      width: '100%',
      gap: 20,
      marginBottom: 30,
    },
    cardContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    iconContainer: {
      marginRight: 15,
      marginTop: 3,
    },
    textContainer: {
      flex: 1,
    },
    scenarioIcon: {
      width: 60,
      height: 60,
      resizeMode: 'contain',
      borderRadius: 60,
      borderWidth: 2,
      borderColor: Colors.primaryDark,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colors.primaryDark,
      marginBottom: 8,
    },
  });

export default function IndexStyles() {
    return null;
}
  
  