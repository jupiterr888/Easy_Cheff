import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import MealPlanModal from './MealPlanModal';
import CalendarModal from './CalendarModal';
import MealPlanProvider, { useMealPlan, Recipe, DateMealPlan } from '../context/MealPlanContext';
import Colors from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../backend/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

import editIcon from '../../assets/images/edit-ok.png';
import trashIcon from '../../assets/images/trash-ok.png';
import sunIcon from '../../assets/images/morning-ok.png';
import nightIcon from '../../assets/images/night-ok.png';
import lunchIcon from '../../assets/images/burger-ok.png';
import { styles } from './styles/MealPlanner.styles';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getMealTypeIcon(mealType: string) {
  switch (mealType) {
    case 'breakfast':
      return sunIcon;
    case 'lunch':
      return lunchIcon;
    case 'dinner':
      return nightIcon;
    default:
      return '';
  }
}

function MealPlannerInner() {
  const router = useRouter();
  const {
    updateDateMealSlot,
    removeDateMealSlot,
    loading,
  } = useMealPlan();
  const [weekDates, setWeekDates] = useState<string[]>([]);
  const [dateMealPlans, setDateMealPlans] = useState<{ [date: string]: DateMealPlan | null }>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | undefined>();
  const scrollViewRef = useRef<ScrollView>(null);

  // calculeaza latimea ecranului si dimensiunile cardurilor pentru centrare
  const screenWidth = Dimensions.get('window').width;
  const CARD_WIDTH = 280;
  const CARD_MARGIN = 10;
  const TOTAL_CARD_WIDTH = CARD_WIDTH + (CARD_MARGIN * 2);

  // calculeaza datele saptamanii (luni-duminica) pentru saptamana curenta
  useEffect(() => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    // obtine ziua curenta (0 = duminica, 1 = luni, ..., 6 = sambata)
    const currentDay = today.getDay();
    // calculeaza luni (daca azi e duminica, mergi inapoi 6 zile, daca luni mergi inapoi 0 zile, etc)
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    setWeekDates(dates);
    // seteaza data de azi ca data initial selectata
    setSelectedDate(todayString);
  }, []);

  // scroll automat la ziua selectata cand aceasta se schimba
  useEffect(() => {
    if (selectedDate && weekDates.includes(selectedDate)) {
      const dayIndex = weekDates.indexOf(selectedDate);
      if (dayIndex !== -1 && scrollViewRef.current) {
        const xOffset = (dayIndex * TOTAL_CARD_WIDTH) - ((screenWidth - TOTAL_CARD_WIDTH) / 2);
        const maxScroll = (weekDates.length * TOTAL_CARD_WIDTH) - screenWidth;
        const finalOffset = Math.max(0, Math.min(xOffset, maxScroll));
        scrollViewRef.current.scrollTo({
          x: finalOffset,
          animated: true
        });
      }
    }
  }, [selectedDate, weekDates]);

  // selecteaza o data din saptamana (folosit la click pe card)
  const scrollToDate = (date: string) => {
    setSelectedDate(date);
  };

  // incarca saptamana pentru o data selectata (asigura luni-duminica)
  const loadWeekForDate = (date: string) => {
    const selectedDate = new Date(date);
    const currentDay = selectedDate.getDay();
    // calculeaza luni
    const monday = new Date(selectedDate);
    monday.setDate(selectedDate.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    setWeekDates(dates);
    // seteaza data selectata dupa setarea datelor saptamanii
    setSelectedDate(date);
  };

  // selecteaza ziua la click pe card
  const handleDayCardClick = (date: string) => {
    setSelectedDate(date);
  };

  // seteaza listeneri in timp real pentru toate planurile de masa din saptamana
  useEffect(() => {
    if (weekDates.length === 0) return;
    const user = auth.currentUser;
    if (!user) return;
    const unsubscribes: (() => void)[] = [];
    // listener pentru fiecare zi din saptamana
    weekDates.forEach((date) => {
      const mealPlanRef = doc(db, 'users', user.uid, 'dateMealPlans', date);
      const unsubscribe = onSnapshot(mealPlanRef, (mealPlanDoc) => {
        try {
          if (mealPlanDoc.exists()) {
            const plan = mealPlanDoc.data() as DateMealPlan;
            setDateMealPlans(prev => ({ ...prev, [date]: plan }));
          } else {
            setDateMealPlans(prev => ({ ...prev, [date]: null }));
          }
        } catch (error) {
          console.error('Error processing date meal plan:', error);
          setDateMealPlans(prev => ({ ...prev, [date]: null }));
        }
      }, (error) => {
        console.error('Error listening to date meal plan:', error);
        setDateMealPlans(prev => ({ ...prev, [date]: null }));
      });
      unsubscribes.push(unsubscribe);
    });
    // cleanup la demontare
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [weekDates]);

  // deschide modalul pentru adaugare masa
  const handleAddMeal = (date: string, mealType: string) => {
    setSelectedDate(date);
    setSelectedMealType(mealType);
    setSelectedRecipe(undefined);
    setModalVisible(true);
  };

  // deschide modalul pentru editare masa
  const handleEditMeal = (date: string, mealType: string) => {
    const plan = dateMealPlans[date];
    const meal = plan && plan.meals[mealType as keyof DateMealPlan['meals']];
    if (meal) {
      setSelectedDate(date);
      setSelectedMealType(mealType);
      setSelectedRecipe(meal);
      setModalVisible(true);
    }
  };

  // sterge o masa planificata cu confirmare
  const handleDeleteMeal = async (date: string, mealType: string) => {
    Alert.alert(
      'Delete Meal',
      'Are you sure you want to delete this meal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeDateMealSlot(date, mealType);
          },
        },
      ]
    );
  };

  // salveaza o masa noua sau editata in planul saptamanii
  const handleSaveMeal = async (recipe: Recipe) => {
    if (!selectedDate) return;
    const success = await updateDateMealSlot(selectedDate, selectedMealType, recipe);
    if (!success) {
      Alert.alert('Slot Occupied', 'This slot already has a planned recipe. Delete it first to add a new one.');
    }
    setModalVisible(false);
  };

  // navigheaza la detaliile retetei
  const handleRecipePress = (recipe: Recipe) => {
    router.push(`/recipes-folder/recipeMatch?id=${recipe.id}`);
  };

  // obtine eticheta zilei
  const getDayLabel = (date: string) => {
    const d = new Date(date);
    return DAYS_OF_WEEK[d.getDay() === 0 ? 6 : d.getDay() - 1]; // Monday=0, Sunday=6
  };

  // obtine data in format scurt data si luna
  const getDayDate = (date: string) => {
    const d = new Date(date);
    return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  };

  // obtine data cu an
  const getDayDateWithYear = (date: string) => {
    const d = new Date(date);
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  };

  // verifica daca o data e in trecut
  const isPastDate = (date: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  // calculeaza procentul de mese planificate pentru saptamana
  const calculatePlannedPercentage = () => {
    const totalSlots = weekDates.length * MEAL_TYPES.length; // 7 zile * 3 tipuri de masa = 21
    let occupiedSlots = 0;
    weekDates.forEach(date => {
      const plan = dateMealPlans[date];
      if (plan) {
        MEAL_TYPES.forEach(mealType => {
          if (plan.meals[mealType as keyof DateMealPlan['meals']]) {
            occupiedSlots++;
          }
        });
      }
    });
    return ((occupiedSlots / totalSlots) * 100).toFixed(2);
  };

  // randarea unui slot de masa pentru o zi si tip de masa
  const renderMealSlot = (date: string, mealType: string) => {
    const plan = dateMealPlans[date];
    const meal = plan && plan.meals[mealType as keyof DateMealPlan['meals']];
    const isPast = isPastDate(date);
    return (
      <View key={`${date}-${mealType}`} style={[
        styles.mealSlotContainer,
        isPast && styles.pastMealSlot
      ]}>
        <View style={styles.mealEmojiContainer}>
          {typeof getMealTypeIcon(mealType) === 'string' ? (
            <Text style={styles.mealEmojiSmall}>{getMealTypeIcon(mealType)}</Text>
          ) : (
            <Image source={getMealTypeIcon(mealType)} style={styles.mealEmojiImage} />
          )}
        </View>
        {meal ? (
          <TouchableOpacity 
            style={styles.mealContentRow}
            onPress={() => handleRecipePress(meal)}
            activeOpacity={0.7}
          >
            <View style={styles.mealImageRectWrapperSmall}>
              <Image 
                source={typeof meal.image === 'string' ? { uri: meal.image } : meal.image}
                style={styles.mealImageRectSmall}
                defaultSource={require('../../assets/images/default-recipe.png')}
              />
            </View>
            <View style={styles.mealTitleRectWrapperNew}>
              <Text style={[
                styles.mealTitleRectNew,
                isPast && styles.pastMealTitle
              ]} numberOfLines={2}>{meal.title}</Text>
            </View>
            <View style={styles.mealActionsRectStacked}>
              <TouchableOpacity onPress={() => handleEditMeal(date, mealType)} style={styles.actionButtonRectSmall}>
                <Image source={editIcon} style={styles.actionIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteMeal(date, mealType)} style={styles.actionButtonRectSmall}>
                <Image source={trashIcon} style={styles.actionIcon} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.addMealButtonCentered} onPress={() => handleAddMeal(date, mealType)}>
            <Ionicons name="add-circle" size={43} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Your Weekly Plan</Text>
        </View>
        <Text style={styles.subtitle}>
          Week: {weekDates.length > 0 && `${getDayDate(weekDates[0])} - ${getDayDateWithYear(weekDates[6])}`}
        </Text>
      </View>

      {/* scroll orizontal cu zilele saptamanii si sloturile de masa */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.daysScroll}
        contentContainerStyle={[
          styles.daysScrollContent,
          { paddingHorizontal: (screenWidth - TOTAL_CARD_WIDTH) / 2 }
        ]}
        snapToInterval={TOTAL_CARD_WIDTH}
        decelerationRate="fast"
        snapToAlignment="center"
      >
        {weekDates.map((date) => {
          const isToday = date === new Date().toISOString().split('T')[0];
          return (
            <TouchableOpacity
              key={date}
              style={[
                styles.dayCard,
                (selectedDate === date || isToday) && styles.selectedDayCard,
                { width: CARD_WIDTH, marginHorizontal: CARD_MARGIN }
              ]}
              onPress={() => handleDayCardClick(date)}
              activeOpacity={0.7}
            >
              <View style={styles.dayHeaderContainer}>
                <Text style={styles.dayHeader}>{getDayLabel(date)}</Text>
                <Text style={styles.dayDate}>{getDayDate(date)}</Text>
              </View>
              {MEAL_TYPES.map((mealType) => renderMealSlot(date, mealType))}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.planningSummaryContainer}>
        <Text style={styles.plannedPercentageText}>
          {calculatePlannedPercentage()}% of meals planned
        </Text>
        {/* progress bar vizual */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${parseFloat(calculatePlannedPercentage())}%` }]} />
        </View>
        {/* buton pentru deschiderea calendarului */}
        <TouchableOpacity
          style={styles.calendarButton}
          onPress={() => setCalendarModalVisible(true)}
        >
          <Text style={styles.calendarButtonText}>Calendar</Text>
        </TouchableOpacity>
      </View>

      <MealPlanModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveMeal}
        day={selectedDate || ''}
        mealType={selectedMealType}
        existingRecipe={selectedRecipe}
      />
      <CalendarModal
        visible={calendarModalVisible}
        onClose={() => setCalendarModalVisible(false)}
        onDateSelect={(date) => {
          loadWeekForDate(date);
          setCalendarModalVisible(false);
          scrollToDate(date);
        }}
        currentWeekStart={weekDates[0]}
        markedDates={
          Object.entries(dateMealPlans)
            .filter(([_, plan]) => plan && Object.values(plan.meals).some(meal => meal !== undefined))
            .reduce((acc, [date]) => ({
              ...acc,
              [date]: {
                marked: true,
                dotColor: Colors.primaryDark
              }
            }), {})
        }
      />
      {loading && (
        <View style={styles.overlayLoader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </>
  );
}

// wrapper cu provider pentru contextul de meal plan si configurare header
export default function MealPlanner() {
  const router = useRouter();
  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={["left", "right"]}>
        <MealPlanProvider>
          <Stack.Screen
            options={{
              title: 'Meal Planner',
              headerShown: true,
              headerStyle: { backgroundColor: Colors.textDark },
              headerTitleStyle: { color: Colors.background },
              headerLeft: () => (
                <TouchableOpacity onPress={() => router.back()}>
                  <Ionicons name="chevron-back" size={24} color={Colors.background} />
                </TouchableOpacity>
              ),
            }}
          />
          <MealPlannerInner />
        </MealPlanProvider>
      </SafeAreaView>
      <SafeAreaView style={{ backgroundColor: Colors.bar }} edges={["bottom"]} />
    </>
  );
}