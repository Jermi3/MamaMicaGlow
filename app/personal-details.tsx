import { GlowCard } from '@/components/GlowCard';
import { SoundButton } from '@/components/SoundButton';
import { StyledText } from '@/components/StyledText';
import { Colors, Layout } from '@/constants/Colors';
import { saveWeight } from '@/constants/storage';
import { usePreferences } from '@/contexts/PreferencesContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Activity, ArrowLeft, Check, ChevronDown, Ruler, User } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Generate picker options
const AGE_OPTIONS = Array.from({ length: 83 }, (_, i) => i + 18); // 18-100
const WEIGHT_OPTIONS = Array.from({ length: 301 }, (_, i) => i + 50); // 50-350 lbs
const FEET_OPTIONS = Array.from({ length: 5 }, (_, i) => i + 4); // 4-8 feet
const INCHES_OPTIONS = Array.from({ length: 12 }, (_, i) => i); // 0-11 inches

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

export default function PersonalDetailsScreen() {
    const router = useRouter();
    const { preferences } = usePreferences();
    const isDark = preferences.darkMode;

    const bgColor = isDark ? Colors.dark.background : Colors.soft.background;
    const cardBg = isDark ? Colors.gray[800] : Colors.white;
    const textColor = isDark ? Colors.dark.text : Colors.gray[900];
    const subtitleColor = isDark ? Colors.gray[400] : Colors.gray[500];
    const inputBg = isDark ? Colors.gray[700] : Colors.gray[100];

    const [name, setName] = useState('');
    const [age, setAge] = useState(34);
    const [weight, setWeight] = useState(165);
    const [heightFeet, setHeightFeet] = useState(5);
    const [heightInches, setHeightInches] = useState(7);
    const [gender, setGender] = useState('Female');
    const [goal, setGoal] = useState('Health');

    const [saved, setSaved] = useState(false);

    // Picker modal states
    const [showAgePicker, setShowAgePicker] = useState(false);
    const [showWeightPicker, setShowWeightPicker] = useState(false);
    const [showHeightPicker, setShowHeightPicker] = useState(false);

    // Temporary values for pickers
    const [tempAge, setTempAge] = useState(age);
    const [tempWeight, setTempWeight] = useState(weight);
    const [tempFeet, setTempFeet] = useState(heightFeet);
    const [tempInches, setTempInches] = useState(heightInches);

    const ageListRef = useRef<FlatList>(null);
    const weightListRef = useRef<FlatList>(null);
    const feetListRef = useRef<FlatList>(null);
    const inchesListRef = useRef<FlatList>(null);

    // Initial Load
    useEffect(() => {
        const loadData = async () => {
            try {
                const jsonValue = await AsyncStorage.getItem('user_personal_details');

                if (jsonValue != null) {
                    const data = JSON.parse(jsonValue);
                    if (data.name) setName(data.name);
                    if (data.age) setAge(typeof data.age === 'number' ? data.age : parseInt(data.age) || 34);
                    if (data.weight) setWeight(typeof data.weight === 'number' ? data.weight : parseInt(data.weight) || 165);
                    if (data.heightFeet) setHeightFeet(data.heightFeet);
                    if (data.heightInches !== undefined) setHeightInches(data.heightInches);
                    // Support legacy height format like "5'7""
                    if (data.height && typeof data.height === 'string') {
                        const match = data.height.match(/(\d+)'(\d+)/);
                        if (match) {
                            setHeightFeet(parseInt(match[1]) || 5);
                            setHeightInches(parseInt(match[2]) || 7);
                        }
                    }
                    if (data.gender) setGender(data.gender);
                    if (data.goal) setGoal(data.goal);
                }
            } catch (e) {
                // error reading value
            }
        };
        loadData();
    }, []);

    const handleSave = async () => {
        try {
            const height = `${heightFeet}'${heightInches}"`;
            const data = { name, age, weight, height, heightFeet, heightInches, gender, goal };
            await AsyncStorage.setItem('user_personal_details', JSON.stringify(data));

            // Save weight to history if valid
            if (!isNaN(weight)) {
                await saveWeight(weight);
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) {
            // saving error
        }
    };

    const openAgePicker = () => {
        setTempAge(age);
        setShowAgePicker(true);
        setTimeout(() => {
            const index = AGE_OPTIONS.indexOf(age);
            if (index >= 0 && ageListRef.current) {
                ageListRef.current.scrollToIndex({ index, animated: false, viewPosition: 0.5 });
            }
        }, 300);
    };

    const openWeightPicker = () => {
        setTempWeight(weight);
        setShowWeightPicker(true);
        setTimeout(() => {
            const index = WEIGHT_OPTIONS.indexOf(weight);
            if (index >= 0 && weightListRef.current) {
                weightListRef.current.scrollToIndex({ index, animated: false, viewPosition: 0.5 });
            }
        }, 300);
    };

    const openHeightPicker = () => {
        setTempFeet(heightFeet);
        setTempInches(heightInches);
        setShowHeightPicker(true);
        setTimeout(() => {
            const feetIndex = FEET_OPTIONS.indexOf(heightFeet);
            const inchesIndex = INCHES_OPTIONS.indexOf(heightInches);
            if (feetIndex >= 0 && feetListRef.current) {
                feetListRef.current.scrollToIndex({ index: feetIndex, animated: false, viewPosition: 0.5 });
            }
            if (inchesIndex >= 0 && inchesListRef.current) {
                inchesListRef.current.scrollToIndex({ index: inchesIndex, animated: false, viewPosition: 0.5 });
            }
        }, 300);
    };

    const confirmAge = () => {
        setAge(tempAge);
        setShowAgePicker(false);
    };

    const confirmWeight = () => {
        setWeight(tempWeight);
        setShowWeightPicker(false);
    };

    const confirmHeight = () => {
        setHeightFeet(tempFeet);
        setHeightInches(tempInches);
        setShowHeightPicker(false);
    };

    const SoftBlob = ({ color, style }: { color: string, style: any }) => (
        <View style={[styles.blob, { backgroundColor: color }, style]} />
    );

    const SelectionPill = ({ label, selected, onSelect }: { label: string, selected: boolean, onSelect: () => void }) => (
        <SoundButton
            onPress={onSelect}
            style={[
                styles.pill,
                { backgroundColor: isDark ? Colors.gray[700] : Colors.white, borderColor: isDark ? Colors.gray[600] : Colors.gray[200] },
                selected && styles.pillSelected
            ]}
        >
            <StyledText variant={selected ? "bold" : "medium"} style={[
                styles.pillText,
                { color: isDark ? Colors.gray[300] : Colors.gray[600] },
                selected && styles.pillTextSelected
            ]}>{label}</StyledText>
        </SoundButton>
    );

    // Picker item with opacity based on distance from selection
    const PickerItem = ({
        value,
        label,
        isSelected,
        onSelect,
        index,
        selectedIndex
    }: {
        value: number;
        label: string;
        isSelected: boolean;
        onSelect: () => void;
        index: number;
        selectedIndex: number;
    }) => {
        // Calculate opacity based on distance from selected item
        const distance = Math.abs(index - selectedIndex);
        let opacity = 1;
        if (distance === 1) opacity = 0.6;
        else if (distance === 2) opacity = 0.35;
        else if (distance >= 3) opacity = 0.15;

        return (
            <TouchableOpacity
                style={styles.pickerItem}
                onPress={onSelect}
                activeOpacity={0.7}
            >
                <StyledText
                    variant={isSelected ? "bold" : "regular"}
                    style={[
                        styles.pickerItemText,
                        {
                            color: isDark ? Colors.gray[100] : Colors.gray[900],
                            opacity: isSelected ? 1 : opacity,
                        },
                        isSelected && styles.pickerItemTextSelected
                    ]}
                >
                    {label}
                </StyledText>
            </TouchableOpacity>
        );
    };

    const renderPickerModal = (
        visible: boolean,
        onClose: () => void,
        onConfirm: () => void,
        title: string,
        children: React.ReactNode
    ) => (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onConfirm}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={onConfirm}
            >
                <View
                    style={[styles.modalContent, { backgroundColor: isDark ? Colors.gray[800] : Colors.white }]}
                    onStartShouldSetResponder={() => true}
                >
                    <StyledText variant="bold" style={[styles.modalTitle, { color: textColor, textAlign: 'center', marginBottom: 16 }]}>
                        {title}
                    </StyledText>

                    <View style={styles.pickerWrapper}>
                        {/* Selection band indicator - positioned in middle */}
                        <View style={styles.selectionBand} pointerEvents="none">
                            <View style={[styles.selectionBandFill, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[100] }]} />
                        </View>
                        <View style={styles.pickerContainer}>
                            {children}
                        </View>
                    </View>

                    <StyledText variant="regular" style={[styles.tapHint, { color: subtitleColor }]}>
                        Tap outside to close
                    </StyledText>
                </View>
            </TouchableOpacity>
        </Modal>
    );

    return (
        <View style={[styles.mainContainer, { backgroundColor: bgColor }]}>
            {/* Background blobs - dark mode uses muted violet tones */}
            <SoftBlob color={isDark ? "#1E1B4B" : "#EDE9FE"} style={{ top: -100, right: -100, width: 350, height: 350 }} />
            <SoftBlob color={isDark ? "#312E81" : "#DDD6FE"} style={{ bottom: 0, left: -50, width: 300, height: 300 }} />

            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <SoundButton onPress={() => router.back()} style={[styles.backButton, { backgroundColor: cardBg }]}>
                        <ArrowLeft size={24} color={textColor} />
                    </SoundButton>
                    <StyledText variant="bold" style={[styles.title, { color: textColor }]}>Personal Details</StyledText>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <GlowCard variant="surface" style={[styles.formCard, isDark && { backgroundColor: cardBg }]}>
                        {/* Name */}
                        <View style={styles.inputGroup}>
                            <StyledText variant="medium" style={[styles.label, { color: subtitleColor }]}>Display Name</StyledText>
                            <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
                                <User size={20} color={subtitleColor} />
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Enter your name"
                                    placeholderTextColor={subtitleColor}
                                />
                            </View>
                        </View>

                        {/* Age & Gender Row */}
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <StyledText variant="medium" style={[styles.label, { color: subtitleColor }]}>Age</StyledText>
                                <TouchableOpacity
                                    style={[styles.pickerTrigger, { backgroundColor: inputBg }]}
                                    onPress={openAgePicker}
                                    activeOpacity={0.7}
                                >
                                    <StyledText variant="medium" style={[styles.pickerTriggerText, { color: textColor }]}>
                                        {age}
                                    </StyledText>
                                    <ChevronDown size={18} color={subtitleColor} />
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.inputGroup, { flex: 2 }]}>
                                <StyledText variant="medium" style={[styles.label, { color: subtitleColor }]}>Biological Sex</StyledText>
                                <View style={styles.pillContainer}>
                                    {['Female', 'Male'].map((g) => (
                                        <SelectionPill key={g} label={g} selected={gender === g} onSelect={() => setGender(g)} />
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* Weight & Height Row */}
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <StyledText variant="medium" style={[styles.label, { color: subtitleColor }]}>Weight (lbs)</StyledText>
                                <TouchableOpacity
                                    style={[styles.pickerTrigger, { backgroundColor: inputBg }]}
                                    onPress={openWeightPicker}
                                    activeOpacity={0.7}
                                >
                                    <Activity size={20} color={subtitleColor} />
                                    <StyledText variant="medium" style={[styles.pickerTriggerText, { color: textColor, flex: 1 }]}>
                                        {weight}
                                    </StyledText>
                                    <ChevronDown size={18} color={subtitleColor} />
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <StyledText variant="medium" style={[styles.label, { color: subtitleColor }]}>Height</StyledText>
                                <TouchableOpacity
                                    style={[styles.pickerTrigger, { backgroundColor: inputBg }]}
                                    onPress={openHeightPicker}
                                    activeOpacity={0.7}
                                >
                                    <Ruler size={20} color={subtitleColor} />
                                    <StyledText variant="medium" style={[styles.pickerTriggerText, { color: textColor, flex: 1 }]}>
                                        {heightFeet}'{heightInches}"
                                    </StyledText>
                                    <ChevronDown size={18} color={subtitleColor} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Primary Goal */}
                        <View style={styles.inputGroup}>
                            <StyledText variant="medium" style={[styles.label, { color: subtitleColor }]}>Primary Goal</StyledText>
                            <View style={styles.pillContainerWrap}>
                                {['Weight Loss', 'Anti-Aging', 'Recovery', 'Muscle', 'Cognitive'].map((g) => (
                                    <SelectionPill key={g} label={g} selected={goal === g} onSelect={() => setGoal(g)} />
                                ))}
                            </View>
                        </View>

                    </GlowCard>

                    <SoundButton style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
                        {saved ? (
                            <View style={styles.savedContent}>
                                <Check size={20} color={Colors.white} />
                                <StyledText variant="bold" style={styles.saveButtonText}>Saved!</StyledText>
                            </View>
                        ) : (
                            <StyledText variant="bold" style={styles.saveButtonText}>Save Changes</StyledText>
                        )}
                    </SoundButton>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>

            {/* Age Picker Modal */}
            {renderPickerModal(
                showAgePicker,
                () => setShowAgePicker(false),
                confirmAge,
                'Select Age',
                <FlatList
                    ref={ageListRef}
                    data={AGE_OPTIONS}
                    keyExtractor={(item) => item.toString()}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
                    getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
                    onMomentumScrollEnd={(e) => {
                        const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                        if (AGE_OPTIONS[index]) setTempAge(AGE_OPTIONS[index]);
                    }}
                    renderItem={({ item, index }) => (
                        <PickerItem
                            value={item}
                            label={`${item} years`}
                            isSelected={item === tempAge}
                            index={index}
                            selectedIndex={AGE_OPTIONS.indexOf(tempAge)}
                            onSelect={() => {
                                setTempAge(item);
                                const idx = AGE_OPTIONS.indexOf(item);
                                ageListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
                            }}
                        />
                    )}
                />
            )}

            {/* Weight Picker Modal */}
            {renderPickerModal(
                showWeightPicker,
                () => setShowWeightPicker(false),
                confirmWeight,
                'Select Weight',
                <FlatList
                    ref={weightListRef}
                    data={WEIGHT_OPTIONS}
                    keyExtractor={(item) => item.toString()}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
                    getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
                    onMomentumScrollEnd={(e) => {
                        const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                        if (WEIGHT_OPTIONS[index]) setTempWeight(WEIGHT_OPTIONS[index]);
                    }}
                    renderItem={({ item, index }) => (
                        <PickerItem
                            value={item}
                            label={`${item} lbs`}
                            isSelected={item === tempWeight}
                            index={index}
                            selectedIndex={WEIGHT_OPTIONS.indexOf(tempWeight)}
                            onSelect={() => {
                                setTempWeight(item);
                                const idx = WEIGHT_OPTIONS.indexOf(item);
                                weightListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
                            }}
                        />
                    )}
                />
            )}

            {/* Height Picker Modal */}
            {renderPickerModal(
                showHeightPicker,
                () => setShowHeightPicker(false),
                confirmHeight,
                'Select Height',
                <View style={styles.heightPickerRow}>
                    <View style={styles.heightPickerColumn}>
                        <FlatList
                            ref={feetListRef}
                            data={FEET_OPTIONS}
                            keyExtractor={(item) => item.toString()}
                            showsVerticalScrollIndicator={false}
                            snapToInterval={ITEM_HEIGHT}
                            decelerationRate="fast"
                            contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
                            getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
                            onMomentumScrollEnd={(e) => {
                                const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                                if (FEET_OPTIONS[index]) setTempFeet(FEET_OPTIONS[index]);
                            }}
                            renderItem={({ item, index }) => (
                                <PickerItem
                                    value={item}
                                    label={`${item}'`}
                                    isSelected={item === tempFeet}
                                    index={index}
                                    selectedIndex={FEET_OPTIONS.indexOf(tempFeet)}
                                    onSelect={() => {
                                        setTempFeet(item);
                                        const idx = FEET_OPTIONS.indexOf(item);
                                        feetListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
                                    }}
                                />
                            )}
                        />
                    </View>
                    <View style={styles.heightPickerColumn}>
                        <FlatList
                            ref={inchesListRef}
                            data={INCHES_OPTIONS}
                            keyExtractor={(item) => item.toString()}
                            showsVerticalScrollIndicator={false}
                            snapToInterval={ITEM_HEIGHT}
                            decelerationRate="fast"
                            contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
                            getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
                            onMomentumScrollEnd={(e) => {
                                const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                                if (INCHES_OPTIONS[index] !== undefined) setTempInches(INCHES_OPTIONS[index]);
                            }}
                            renderItem={({ item, index }) => (
                                <PickerItem
                                    value={item}
                                    label={`${item}"`}
                                    isSelected={item === tempInches}
                                    index={index}
                                    selectedIndex={INCHES_OPTIONS.indexOf(tempInches)}
                                    onSelect={() => {
                                        setTempInches(item);
                                        const idx = INCHES_OPTIONS.indexOf(item);
                                        inchesListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
                                    }}
                                />
                            )}
                        />
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: Colors.soft.background,
    },
    blob: {
        position: 'absolute',
        borderRadius: 999,
        opacity: 0.5,
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Layout.spacing.lg,
        paddingVertical: Layout.spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...Layout.shadows.small,
    },
    title: {
        fontSize: 20,
        color: Colors.gray[800],
    },
    content: {
        padding: Layout.spacing.lg,
        gap: Layout.spacing.xl,
    },
    formCard: {
        padding: Layout.spacing.lg,
        gap: Layout.spacing.lg,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        color: Colors.gray[500],
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.gray[100],
        borderRadius: Layout.radius.lg,
        paddingHorizontal: 12,
        paddingVertical: 4,
        gap: 10,
    },
    input: {
        flex: 1,
        fontFamily: 'Outfit_500Medium',
        fontSize: 16,
        color: Colors.gray[900],
        paddingVertical: 12,
    },
    pickerTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.gray[100],
        borderRadius: Layout.radius.lg,
        paddingHorizontal: 12,
        paddingVertical: 14,
        gap: 10,
    },
    pickerTriggerText: {
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        ...Layout.shadows.medium,
        shadowColor: Colors.primary,
    },
    savedContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    saveButtonText: {
        color: Colors.white,
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
        gap: Layout.spacing.lg,
    },
    pillContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
    },
    pillContainerWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.gray[200],
        backgroundColor: Colors.white,
    },
    pillSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    pillText: {
        fontSize: 14,
    },
    pillTextSelected: {
        color: Colors.white,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: Dimensions.get('window').width - 48,
        borderRadius: 24,
        padding: 20,
        maxHeight: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
    },
    modalCloseBtn: {
        padding: 8,
    },
    modalConfirmBtn: {
        padding: 8,
    },
    pickerWrapper: {
        position: 'relative',
        height: PICKER_HEIGHT,
    },
    pickerContainer: {
        height: PICKER_HEIGHT,
        overflow: 'hidden',
    },
    pickerItem: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    pickerItemSelected: {
        // Selected item styling handled by text
    },
    pickerItemText: {
        fontSize: 18,
    },
    pickerItemTextSelected: {
        fontSize: 22,
    },
    selectionIndicator: {
        position: 'absolute',
        left: 20,
        right: 20,
        top: 56 + ITEM_HEIGHT * 2,
        height: ITEM_HEIGHT,
        justifyContent: 'space-between',
        pointerEvents: 'none',
    },
    selectionLine: {
        height: 1,
        backgroundColor: Colors.gray[200],
    },
    heightPickerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    heightPickerColumn: {
        flex: 1,
        alignItems: 'center',
    },
    heightPickerLabel: {
        textAlign: 'center',
        marginBottom: 8,
        fontSize: 14,
        fontWeight: '500',
    },
    selectionBand: {
        position: 'absolute',
        left: 12,
        right: 12,
        top: ITEM_HEIGHT * 2,
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 0,
    },
    selectionBandFill: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    tapHint: {
        textAlign: 'center',
        marginTop: 12,
        fontSize: 12,
    },
});
