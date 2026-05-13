import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

interface RecipeCompletionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (rating: number, mention: string) => void;
}

export default function RecipeCompletionModal({ visible, onClose, onSave }: RecipeCompletionModalProps) {
  const [rating, setRating] = useState(0);
  const [mention, setMention] = useState('');

  const handleStarPress = (star: number) => {
    setRating(star);
  };

  const handleSave = () => {
    onSave(rating, mention);
    setRating(0);
    setMention('');
  };

  const handleCancel = () => {
    onClose();
    setRating(0);
    setMention('');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Rate & Note</Text>
          <Text style={styles.label}>How would you rate this recipe?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => handleStarPress(star)}>
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={32}
                  color={star <= rating ? Colors.rating : Colors.border}
                  style={styles.starIcon}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Mentions For Yourself:</Text>
          <TextInput
            style={styles.input}
            value={mention}
            onChangeText={text => text.length <= 50 ? setMention(text) : null}
            maxLength={50}
            placeholder="Write a note..."
          />
          <Text style={styles.charCount}>{mention.length}/50</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    width: 320,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 15,
    marginTop: 12,
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  starIcon: {
    marginHorizontal: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.surface,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 4,
  },
  charCount: {
    fontSize: 12,
    color: Colors.border,
    textAlign: 'right',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    color: Colors.text,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  saveButtonText: {
    color: Colors.textLight,
    fontWeight: 'bold',
  },
}); 