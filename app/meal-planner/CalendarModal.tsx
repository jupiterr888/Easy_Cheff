import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { styles } from './styles/CalendarModal.styles';

const calendarTheme = {
  backgroundColor: Colors.card,
  calendarBackground: Colors.card,
  textSectionTitleColor: Colors.primary,
  dayTextColor: Colors.text,
  textDisabledColor: Colors.border,
  arrowColor: Colors.primary,
  monthTextColor: Colors.primary,
  indicatorColor: Colors.primary,
  textDayFontWeight: '300',
  textMonthFontWeight: '800',
  textDayHeaderFontWeight: '500',
  textDayFontSize: 16,
  textMonthFontSize: 18,
  textDayHeaderFontSize: 14,
  todayTextColor: Colors.text,
  todayBackgroundColor: 'transparent',
  selectedDayTextColor: Colors.text,
  selectedDayBackgroundColor: Colors.muted,
  textDayStyle: {
    color: Colors.text
  },
  'stylesheet.calendar.main': {
    dayContainer: {
      borderRadius: 0,
      alignItems: 'center',
      justifyContent: 'center',
      width: 32,
      height: 32,
      alignSelf: 'stretch'
    }
  },
  'stylesheet.day.basic': {
    base: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center'
    },
    text: {
      marginTop: 4,
      fontSize: 16,
      fontWeight: '300',
      color: Colors.text
    },
    alignedText: {
      marginTop: 4,
      fontSize: 16,
      fontWeight: '300',
      color: 'rgba(128, 128, 128, 0.4)'
    }
  }
} as const;

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  onDateSelect: (date: string) => void;
  markedDates?: { [date: string]: { marked: boolean; dotColor: string } };
  currentWeekStart?: string;
}

// modalul pentru selectarea unei date din calendar, cu marcarea saptamanii si zilelor planificate
const CalendarModal: React.FC<CalendarModalProps> = ({
  visible,
  onClose,
  onDateSelect,
  markedDates = {},
  currentWeekStart,
}) => {
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const maxDate = new Date(today);
  maxDate.setFullYear(today.getFullYear() + 2);

  // obtine toate datele saptamanii pentru o data data (luni-duminica)
  const getWeekDates = (date: string) => {
    const result: { [date: string]: { selected: boolean; selectedColor: string } } = {};
    const currentDate = new Date(date);
    const dayOfWeek = currentDate.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // ajusteaza pentru inceputul de luni
    
    // obtine luni din saptamana
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() + diff);
    
    // adauga toate zilele saptamanii
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(monday);
      weekDate.setDate(monday.getDate() + i);
      const dateString = weekDate.toISOString().split('T')[0];
      if (dateString !== todayString) {  // nu stilizeaza data de azi aici
        result[dateString] = { 
          selected: true,
          selectedColor: Colors.muted
        };
      }
    }
    
    return result;
  };

  // combina datele marcate cu saptamana curenta si stilizarea pentru azi
  const combinedMarkedDates = {
    ...getWeekDates(currentWeekStart || todayString),
    ...Object.entries(markedDates).reduce((acc: { [key: string]: any }, [date, value]) => ({
      ...acc,
      [date]: {
        ...getWeekDates(currentWeekStart || todayString)[date], // pastreaza selectia saptamanii daca e prezenta
        marked: value.marked,
        dotColor: value.dotColor,
      }
    }), {}),
    [todayString]: {
      selected: true,
      selectedColor: Colors.primary,
      marked: true,
      dotColor: Colors.textLight
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <Calendar
            maxDate={maxDate.toISOString().split('T')[0]}
            markedDates={combinedMarkedDates}
            onDayPress={(day) => {
              onDateSelect(day.dateString);
              onClose();
            }}
            firstDay={1}
            monthFormat="MMMM yyyy"
            theme={calendarTheme}
          />
        </View>
      </View>
    </Modal>
  );
};

export default CalendarModal; 