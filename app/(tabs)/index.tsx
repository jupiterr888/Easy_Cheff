import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import { commonStyles } from '../../constants/Styles';
import { styles } from '../styles/tabs/index.styles';
// importam icons folosite pe home
import cookBookIcon from '../../assets/images/cook-book-ok.png';
import cutleryIcon from '../../assets/images/cutlery-ok.png';
import calendarIcon from '../../assets/images/calendar-ok.png';

export default function HomeScreen() {
  const router = useRouter(); // hook pt navigare

  return (
    <ScrollView contentContainerStyle={commonStyles.screenContainer}>
      <View style={commonStyles.contentContainer}>
        <View style={styles.headerContainer}>
          <Image source={require('@/assets/images/logo-ok.png')} style={styles.logo} />
          <Text style={[commonStyles.title, styles.headerTitle]}>Welcome to EasyChef!</Text>
        </View>
        <Text style={[commonStyles.subtitle, { marginBottom: 15}]}> 
            Pick a path to deliciousness:
        </Text>

        <View style={styles.scenarioContainer}>
          {/* card pentru navigare la lista retete */}
          <TouchableOpacity 
            style={commonStyles.card}
            onPress={() => router.push('/(tabs)/recipes')}
          >
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <Image source={cookBookIcon} style={styles.scenarioIcon} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>Browse Recipes</Text>
                <Text style={commonStyles.cardDescription}>
                  Explore tasty recipes and see what ingredients you will need
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* card pentru navigare la retete pe baza ingredientelor */}
          <TouchableOpacity 
            style={commonStyles.card}
            onPress={() => router.push('/recipes-folder/ingredientBasedRecipes')}
          >
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <Image source={cutleryIcon} style={styles.scenarioIcon} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>Use My Ingredients</Text>
                <Text style={commonStyles.cardDescription}>
                  Tell us what is in your pantry and we will do the rest
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* planificatorul saptamanii */}
          <TouchableOpacity 
            style={commonStyles.card}
            onPress={() => router.push('../meal-planner/MealPlanner')}
          >
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <Image source={calendarIcon} style={styles.scenarioIcon} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>Organize My Week</Text>
                <Text style={commonStyles.cardDescription}>
                  Plan your meals and simplify your week
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* buton acces rapid la camara */}
        <TouchableOpacity 
          style={[commonStyles.primaryButton, { marginTop: -20 }]}
          onPress={() => router.push('/(tabs)/pantry')}
        >
          <Text style={commonStyles.primaryButtonText}>Manage My Pantry</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

