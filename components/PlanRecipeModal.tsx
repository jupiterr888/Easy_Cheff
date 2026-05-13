import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Colors from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];

interface PlanRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: string, mealType: string, replaceExisting?: boolean) => void;
  initialDate?: string; // YYYY-MM-DD
  initialMealType?: string;
  existingMealPlans?: {
    [date: string]: {
      [mealType: string]: {
        title: string;
      };
    };
  };
}

function getToday() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// functia pentru a obtine datele saptamanii pentru o data data
const getWeekDates = (date: string) => {
  const result: { [date: string]: { selected: boolean; selectedColor: string } } = {};
  const currentDate = new Date(date);
  const dayOfWeek = currentDate.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // ajusteaza pt inceputul de luni
  
  // ia ziua de luni a saptamanii
  const monday = new Date(currentDate);
  monday.setDate(currentDate.getDate() + diff);
  
  // adauga toate zilele saptamanii
  for (let i = 0; i < 7; i++) {
    const weekDate = new Date(monday);
    weekDate.setDate(monday.getDate() + i);
    const dateString = weekDate.toISOString().split('T')[0];
    result[dateString] = { 
      selected: true,
      selectedColor: Colors.muted
    };
  }
  
  return result;
};

export default function PlanRecipeModal({
  visible,
  onClose,
  onConfirm,
  initialDate = getToday(),
  initialMealType = MEAL_TYPES[0],
  existingMealPlans = {},
}: PlanRecipeModalProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedMealType, setSelectedMealType] = useState(initialMealType);
  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setFullYear(today.getFullYear() + 2);

  React.useEffect(() => {
    if (visible) {
      setSelectedDate(initialDate);
      setSelectedMealType(initialMealType);
    }
  }, [visible, initialDate, initialMealType]);

  const handleConfirm = () => {
    // verifica daca exista o masa in slotul selectat
    const existingMeal = existingMealPlans[selectedDate]?.[selectedMealType];
    
    if (existingMeal) {
      Alert.alert(
        'Slot Already Occupied',
        `There is already a meal planned for this slot: "${existingMeal.title}"\n\nWhat would you like to do?`,
        [
          {
            text: 'Keep Existing',
            style: 'cancel',
            onPress: onClose
          },
          {
            text: 'Replace with New',
            style: 'destructive',
            onPress: () => {
              onConfirm(selectedDate, selectedMealType, true);
            }
          }
        ],
        { cancelable: true }
      );
    } else {
      onConfirm(selectedDate, selectedMealType, false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <Calendar
            minDate={getToday()}
            maxDate={maxDate.toISOString().split('T')[0]}
            onDayPress={day => setSelectedDate(day.dateString)}
            markedDates={{
              ...getWeekDates(selectedDate),
              [selectedDate]: { 
                selected: true, 
                selectedColor: Colors.primary,
                marked: selectedDate === today.toISOString().split('T')[0],
                dotColor: Colors.textLight
              },
              [today.toISOString().split('T')[0]]: {
                selected: true,
                selectedColor: Colors.primary,
                marked: true,
                dotColor: Colors.textLight
              }
            }}
            firstDay={1}
            monthFormat="MMMM yyyy"
            theme={{
              backgroundColor: Colors.card,
              calendarBackground: Colors.card,
              textSectionTitleColor: Colors.primary,
              selectedDayBackgroundColor: Colors.primary,
              selectedDayTextColor: Colors.textLight,
              todayTextColor: Colors.palepink,
              dayTextColor: Colors.text,
              textDisabledColor: Colors.border,
              dotColor: Colors.warning,
              selectedDotColor: Colors.textLight,
              arrowColor: Colors.primary,
              monthTextColor: Colors.primary,
              indicatorColor: Colors.primary,
              textDayFontWeight: '300',
              textMonthFontWeight: '800',
              textDayHeaderFontWeight: '500',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14
            }}
          />

          <Text style={styles.label}>Select Meal Type:</Text>
          <View style={styles.pickerWrapper}>
            <View style={styles.mealTypeContainer}>
              {MEAL_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.mealTypeButton,
                    selectedMealType === type && styles.mealTypeButtonSelected,
                  ]}
                  onPress={() => setSelectedMealType(type)}
                >
                  <Text style={selectedMealType === type ? styles.mealTypeTextSelected : styles.mealTypeText}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              disabled={!selectedDate}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    width: Dimensions.get('window').width * 0.9,
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  closeButton: {
    padding: 5,
  },
  label: {
    fontSize: 15,
    marginTop: 16,
    marginBottom: 4,
    color: Colors.primaryDark,
    fontWeight: 'bold',
  },
  pickerWrapper: {
    borderWidth: 0,
    borderColor: Colors.surface,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
    paddingHorizontal: 0,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mealTypeButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  mealTypeButtonSelected: {
    backgroundColor: Colors.primary,
  },
  mealTypeText: {
    color: Colors.primaryDark,
    fontWeight: 'bold',
  },
  mealTypeTextSelected: {
    color: Colors.textLight,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: Colors.error,
  },
  cancelButtonText: {
    color: Colors.error,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  confirmButtonText: {
    color: Colors.textLight,
    fontWeight: 'bold',
  },
}); 