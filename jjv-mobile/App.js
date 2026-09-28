import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
  Platform,
  BackHandler
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { fetchAnimals, createAnimal, updateAnimal, deleteAnimal, subscribeToAnimals, onCloudSyncStatus } from './src/lib/api';
import { isFirebaseConfigured } from './src/lib/firebaseConfig';

const MOBILE_USERS = [
  { id: 'usr-worker-nikhil', name: 'Nikhil (निखिल)', role: 'worker', title: 'Staff Member', short: 'निखिल' },
  { id: 'usr-admin-rashmi', name: 'Rashmi Vyas (रश्मि व्यास)', role: 'admin', title: 'Host / Director', short: 'रश्मि व्यास' }
];

function MobileApp() {
  const [lang, setLang] = useState('hi'); // 'hi' or 'en'
  const [currentUser, setCurrentUser] = useState(MOBILE_USERS[0]); // Default to Nikhil (staff on mobile)
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'dogs', 'cows', 'add'
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  // New Rescue & Edit Form State
  const [editingAnimalId, setEditingAnimalId] = useState(null);
  const [animalType, setAnimalType] = useState('dog');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [condition, setCondition] = useState('Moderate');
  const [treatment, setTreatment] = useState('');
  const [recoveryTime, setRecoveryTime] = useState('');
  const [status, setStatus] = useState('Under Treatment');
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);

  const [syncStatus, setSyncStatus] = useState({
    type: isFirebaseConfigured ? 'connected' : 'offline',
    text: isFirebaseConfigured ? 'Firebase Connected' : 'Offline Storage'
  });

  // Sync state with shared dual-mode Firebase Firestore adapter
  const loadAnimals = async () => {
    try {
      setLoading(true);
      const data = await fetchAnimals();
      setAnimals(data || []);
    } catch (err) {
      console.error('Error synchronizing animals in mobile companion:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnimals();

    const unsubSnapshot = subscribeToAnimals((liveData) => {
      if (liveData && Array.isArray(liveData)) {
        setAnimals(liveData);
      }
    });

    const unsubSync = onCloudSyncStatus((status) => {
      if (status.type === 'success') {
        setSyncStatus({ type: 'connected', text: status.message || 'Firebase Synced' });
      } else if (status.type === 'warning' || status.type === 'error') {
        setSyncStatus({ type: 'offline', text: 'Offline Mode' });
      }
    });

    return () => {
      if (typeof unsubSnapshot === 'function') unsubSnapshot();
      if (typeof unsubSync === 'function') unsubSync();
    };
  }, []);

  const dogs = animals.filter(a => a.animal_type === 'dog');
  const cows = animals.filter(a => a.animal_type === 'cow');

  // Search & Filter state for Dogs and Cows lists
  const [dogSearch, setDogSearch] = useState('');
  const [dogStatusFilter, setDogStatusFilter] = useState('All');
  const [cowSearch, setCowSearch] = useState('');
  const [cowStatusFilter, setCowStatusFilter] = useState('All');

  const filterAnimalList = (list, query, status) => {
    return list.filter((item) => {
      if (status !== 'All' && item.status !== status) {
        return false;
      }
      if (query && query.trim()) {
        const q = query.trim().toLowerCase();
        const matchesName = item.name?.toLowerCase().includes(q);
        const matchesId = item.animal_id?.toLowerCase().includes(q);
        const matchesLocation = (item.location_of_rescue || item.location)?.toLowerCase().includes(q);
        const matchesCondition = (item.condition_at_rescue || item.condition)?.toLowerCase().includes(q);
        const matchesTreatment = (item.treatment_details || item.treatment)?.toLowerCase().includes(q);
        const matchesBreed = item.breed?.toLowerCase().includes(q);
        return Boolean(matchesName || matchesId || matchesLocation || matchesCondition || matchesTreatment || matchesBreed);
      }
      return true;
    });
  };

  const filteredDogs = filterAnimalList(dogs, dogSearch, dogStatusFilter);
  const filteredCows = filterAnimalList(cows, cowSearch, cowStatusFilter);

  const dogCounts = {
    all: dogs.length,
    underTreatment: dogs.filter(d => d.status === 'Under Treatment').length,
    critical: dogs.filter(d => d.status === 'Critical').length,
    recovered: dogs.filter(d => d.status === 'Recovered').length,
  };

  const cowCounts = {
    all: cows.length,
    underTreatment: cows.filter(c => c.status === 'Under Treatment').length,
    critical: cows.filter(c => c.status === 'Critical').length,
    recovered: cows.filter(c => c.status === 'Recovered').length,
  };

  const STATUS_CHIPS = [
    { key: 'All', labelEn: 'All', labelHi: 'सभी', color: '#6b94b8' },
    { key: 'Under Treatment', labelEn: 'Under Treatment', labelHi: 'उपचाराधीन', color: '#c9a355' },
    { key: 'Critical', labelEn: 'Critical', labelHi: 'गंभीर', color: '#b55e5e' },
    { key: 'Recovered', labelEn: 'Recovered', labelHi: 'स्वस्थ', color: '#c27a66' }
  ];

  const getStatusLabel = (st, l = lang) => {
    if (l === 'hi') {
      switch (st) {
        case 'Under Treatment': return 'उपचाराधीन';
        case 'Critical': return 'गंभीर';
        case 'Recovered': return 'स्वस्थ';
        default: return st;
      }
    }
    return st;
  };

  const getConditionLabel = (c, l = lang) => {
    if (l === 'hi') {
      switch (c) {
        case 'Critical': return 'गंभीर';
        case 'Severe': return 'अत्यधिक';
        case 'Moderate': return 'मध्यम';
        case 'Mild': return 'हल्का';
        default: return c;
      }
    }
    return c;
  };

  // Handle Android physical/gesture back button navigation
  useEffect(() => {
    const handleBackPress = () => {
      // 1. Close Animal Detail Modal if open
      if (selectedAnimal) {
        setSelectedAnimal(null);
        return true;
      }

      // 2. Navigate back to Home from secondary tabs (dogs, cows, add)
      if (activeTab !== 'home') {
        setActiveTab('home');
        return true;
      }

      // 3. Confirm before exiting app from Home screen
      Alert.alert(
        lang === 'hi' ? 'ऐप बंद करें' : 'Exit App',
        lang === 'hi'
          ? 'क्या आप जीव जंतु विहार ऐप से बाहर निकलना चाहते हैं?'
          : 'Do you want to exit the Jeev Jantu Vihar companion app?',
        [
          { text: lang === 'hi' ? 'रद्द करें' : 'Cancel', style: 'cancel' },
          { text: lang === 'hi' ? 'बाहर निकलें' : 'Exit', onPress: () => BackHandler.exitApp() }
        ]
      );
      return true;
    };

    const backSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => {
      if (backSubscription && typeof backSubscription.remove === 'function') {
        backSubscription.remove();
      } else {
        BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
      }
    };
  }, [selectedAnimal, activeTab, lang]);

  // Request camera/gallery permissions
  const pickImage = async (type) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        lang === 'hi' ? 'अनुमति अस्वीकृत' : 'Permission Denied',
        lang === 'hi'
          ? 'फोटो अपलोड करने के लिए गैलरी एक्सेस की अनुमति आवश्यक है।'
          : 'Camera roll permissions are required to upload rescue photos.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      if (type === 'before') {
        setBeforeImage(result.assets[0].uri);
      } else {
        setAfterImage(result.assets[0].uri);
      }
    }
  };

  // Direct device camera capture
  const takeCameraPhoto = async (type) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        lang === 'hi' ? 'कैमरा अनुमति आवश्यक' : 'Camera Permission Required',
        lang === 'hi' ? 'फोटो खींचने के लिए कृपया कैमरा एक्सेस की अनुमति दें।' : 'Camera permission is required to capture rescue photos.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      if (type === 'before') {
        setBeforeImage(result.assets[0].uri);
      } else {
        setAfterImage(result.assets[0].uri);
      }
    }
  };

  // Action prompt allowing user to choose Camera or Gallery
  const handlePhotoAction = (type) => {
    Alert.alert(
      type === 'before'
        ? (lang === 'hi' ? 'बचाव पूर्व फोटो' : 'Before Photo (Rescue Time)')
        : (lang === 'hi' ? 'स्वास्थ्य लाभ फोटो' : 'After Photo (Recovery)'),
      lang === 'hi' ? 'फोटो लेने का माध्यम चुनें:' : 'Select Photo Source:',
      [
        {
          text: lang === 'hi' ? '📷 कैमरा से फोटो खींचें' : '📷 Take Photo with Camera',
          onPress: () => takeCameraPhoto(type)
        },
        {
          text: lang === 'hi' ? '🖼️ गैलरी से चुनें' : '🖼️ Choose from Gallery',
          onPress: () => pickImage(type)
        },
        {
          text: lang === 'hi' ? 'रद्द करें' : 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const resetForm = () => {
    setEditingAnimalId(null);
    setAnimalType('dog');
    setName('');
    setLocation('');
    setCondition('Moderate');
    setTreatment('');
    setRecoveryTime('');
    setStatus('Under Treatment');
    setBeforeImage(null);
    setAfterImage(null);
  };

  const handleStartEdit = (animal) => {
    setEditingAnimalId(animal.id);
    setAnimalType(animal.animal_type || 'dog');
    setName(animal.name || '');
    setLocation(animal.location_of_rescue || animal.location || '');
    setCondition(animal.condition_at_rescue || animal.condition || 'Moderate');
    setTreatment(animal.treatment_details || animal.treatment || '');
    setRecoveryTime(animal.recovery_time || animal.recovery || '');
    setStatus(animal.status || 'Under Treatment');
    setBeforeImage(animal.before_image_url || animal.beforeImage || null);
    setAfterImage(animal.after_image_url || animal.afterImage || null);
    setSelectedAnimal(null);
    setActiveTab('add');
  };

  const handleQuickStatusUpdate = async (id, newStatus) => {
    try {
      await updateAnimal(id, { status: newStatus });
      await loadAnimals();
      setSelectedAnimal((prev) => (prev && prev.id === id ? { ...prev, status: newStatus } : prev));
      Alert.alert(
        lang === 'hi' ? 'स्थिति अपडेट' : 'Status Updated',
        lang === 'hi'
          ? `स्थिति बदलकर "${getStatusLabel(newStatus, 'hi')}" कर दी गई।`
          : `Status updated to "${newStatus}".`
      );
    } catch (err) {
      console.error('Failed to update animal status:', err);
      Alert.alert(
        lang === 'hi' ? 'त्रुटि' : 'Error',
        err.message || (lang === 'hi' ? 'स्थिति अपडेट करने में विफल।' : 'Failed to update status.')
      );
    }
  };

  const handleModalPhotoUpdate = (photoType) => {
    if (!selectedAnimal) return;
    Alert.alert(
      photoType === 'before'
        ? (lang === 'hi' ? 'बचाव पूर्व फोटो अपडेट' : 'Update Before Photo')
        : (lang === 'hi' ? 'स्वास्थ्य लाभ फोटो अपडेट' : 'Update After Photo'),
      lang === 'hi' ? 'फोटो लेने का माध्यम चुनें:' : 'Select Photo Source:',
      [
        {
          text: lang === 'hi' ? '📷 कैमरा से फोटो खींचें' : '📷 Take Photo with Camera',
          onPress: async () => {
            const { status: perm } = await ImagePicker.requestCameraPermissionsAsync();
            if (perm !== 'granted') {
              Alert.alert(
                lang === 'hi' ? 'अनुमति अस्वीकृत' : 'Permission Denied',
                lang === 'hi' ? 'कैमरा अनुमति आवश्यक है।' : 'Camera permission required.'
              );
              return;
            }
            const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.7 });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              const photoUri = result.assets[0].uri;
              const updates = photoType === 'before' ? { before_image_url: photoUri } : { after_image_url: photoUri };
              await updateAnimal(selectedAnimal.id, updates);
              await loadAnimals();
              setSelectedAnimal((prev) => ({ ...prev, ...updates }));
            }
          }
        },
        {
          text: lang === 'hi' ? '🖼️ गैलरी से चुनें' : '🖼️ Choose from Gallery',
          onPress: async () => {
            const { status: perm } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (perm !== 'granted') {
              Alert.alert(
                lang === 'hi' ? 'अनुमति अस्वीकृत' : 'Permission Denied',
                lang === 'hi' ? 'गैलरी अनुमति आवश्यक है।' : 'Gallery permission required.'
              );
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.7 });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              const photoUri = result.assets[0].uri;
              const updates = photoType === 'before' ? { before_image_url: photoUri } : { after_image_url: photoUri };
              await updateAnimal(selectedAnimal.id, updates);
              await loadAnimals();
              setSelectedAnimal((prev) => ({ ...prev, ...updates }));
            }
          }
        },
        { text: lang === 'hi' ? 'रद्द करें' : 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleSave = async () => {
    if (!name.trim() || !location.trim()) {
      Alert.alert(
        lang === 'hi' ? 'आवश्यक जानकारी भरें' : 'Required Information',
        lang === 'hi' ? 'कृपया जानवर का नाम और बचाव का स्थान दर्ज करें।' : 'Please enter animal name and rescue location.'
      );
      return;
    }

    try {
      const payload = {
        animal_type: animalType,
        name: name.trim(),
        location_of_rescue: location.trim(),
        condition_at_rescue: condition,
        treatment_details: treatment.trim(),
        recovery_time: recoveryTime.trim() || 'Ongoing',
        status: status || 'Under Treatment',
        before_image_url: beforeImage,
        after_image_url: afterImage
      };

      if (editingAnimalId) {
        // Wire up updateAnimal for editing existing record!
        await updateAnimal(editingAnimalId, payload);
        await loadAnimals();
        Alert.alert(
          lang === 'hi' ? 'सफलतापूर्वक अपडेट' : 'Update Successful',
          lang === 'hi' ? `${name} का प्रोफ़ाइल सफलतापूर्वक अपडेट हो गया।` : `${name}'s profile was updated successfully.`
        );
      } else {
        await createAnimal({
          ...payload,
          date_of_rescue: new Date().toISOString().split('T')[0]
        }, currentUser);
        await loadAnimals();
        Alert.alert(
          lang === 'hi' ? 'सफलतापूर्वक दर्ज' : 'Rescue Logged',
          lang === 'hi' ? `${name} का प्रोफ़ाइल सफलतापूर्वक सुरक्षित कर लिया गया है।` : `${name}'s profile was saved successfully.`
        );
      }

      resetForm();
      setActiveTab('home');
    } catch (err) {
      console.error('Mobile save/update error:', err);
      Alert.alert(
        lang === 'hi' ? 'त्रुटि' : 'Error',
        err.message || (lang === 'hi' ? 'प्रोफ़ाइल सुरक्षित करने में समस्या आई।' : 'Failed to save animal profile.')
      );
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Critical': return '#b55e5e';
      case 'Under Treatment': return '#c9a355';
      case 'Recovered': return '#c27a66';
      default: return '#6b94b8';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#1a1714"
        translucent={Platform.OS === 'android'}
      />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logoIcon}>🐾</Text>
          <View>
            <Text style={styles.headerTitle}>Jeev Jantu Vihar</Text>
            <Text style={styles.headerSubtitle}>
              {lang === 'hi' ? 'भोपाल शेल्टर साथी ऐप' : 'Bhopal Shelter Companion'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
              <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: syncStatus.type === 'connected' ? '#38a169' : '#dd6b20', marginRight: 5 }} />
              <Text style={{ fontSize: 10, color: syncStatus.type === 'connected' ? '#9ae6b4' : '#fbd38d', fontWeight: '600' }}>
                {syncStatus.type === 'connected' 
                  ? (lang === 'hi' ? '🔥 फायरबेस कनेक्टेड' : '🔥 Firebase Connected')
                  : (lang === 'hi' ? '💾 ऑफलाइन स्टोरेज' : '💾 Offline Storage')}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.langButton}
          onPress={() => setLang(lang === 'hi' ? 'en' : 'hi')}
        >
          <Text style={styles.langText}>{lang === 'hi' ? 'English' : 'हिन्दी'}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Body */}
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 90 }}>
        
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <View>
            {/* Status Card */}
            <View style={styles.welcomeCard}>
              <View style={styles.welcomeTop}>
                <Text style={styles.welcomeTag}>
                  {lang === 'hi' ? 'आज का स्टेटस (Today)' : "Today's Status"}
                </Text>
                <View style={styles.fedBadge}>
                  <Text style={styles.fedBadgeText}>
                    {lang === 'hi' ? 'भोजन तैयार ✓' : 'Feed Ready ✓'}
                  </Text>
                </View>
              </View>

              <Text style={styles.totalAnimals}>
                {animals.length} {lang === 'hi' ? 'जानवर परिसर में' : 'Animals in Care'}
              </Text>

              <View style={styles.countsRow}>
                <TouchableOpacity
                  style={styles.countBox}
                  onPress={() => setActiveTab('dogs')}
                >
                  <Text style={styles.countLabel}>🐕 {lang === 'hi' ? 'कुत्ते' : 'Dogs'}</Text>
                  <Text style={[styles.countValue, { color: '#c27a66' }]}>{dogs.length}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.countBox}
                  onPress={() => setActiveTab('cows')}
                >
                  <Text style={styles.countLabel}>🐄 {lang === 'hi' ? 'गायें' : 'Cows'}</Text>
                  <Text style={[styles.countValue, { color: '#6b94b8' }]}>{cows.length}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Action Button */}
            <TouchableOpacity
              style={styles.addActionButton}
              onPress={() => setActiveTab('add')}
            >
              <Text style={{ fontSize: 24 }}>➕</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.actionBtnTitle}>
                  {lang === 'hi' ? 'नया रेस्क्यू दर्ज करें' : 'Log New Rescue'}
                </Text>
                <Text style={styles.actionBtnSub}>
                  {lang === 'hi' ? 'फोटो एवं उपचार विवरण जोड़ें' : 'Add photos & treatment details'}
                </Text>
              </View>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>→</Text>
            </TouchableOpacity>

            {/* Two Category Buttons */}
            <View style={styles.categoryGrid}>
              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => setActiveTab('dogs')}
              >
                <Text style={{ fontSize: 28, marginBottom: 4 }}>🐕</Text>
                <Text style={styles.catTitle}>{lang === 'hi' ? 'कुत्तों की सूची' : 'Dog Profiles'}</Text>
                <Text style={styles.catSub}>{dogs.length} {lang === 'hi' ? 'पंजीकृत' : 'Registered'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => setActiveTab('cows')}
              >
                <Text style={{ fontSize: 28, marginBottom: 4 }}>🐄</Text>
                <Text style={styles.catTitle}>{lang === 'hi' ? 'गौशाला सूची' : 'Cow Profiles'}</Text>
                <Text style={styles.catSub}>{cows.length} {lang === 'hi' ? 'पंजीकृत' : 'Registered'}</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Rescues Header */}
            <Text style={styles.sectionHeader}>
              {lang === 'hi' ? 'हाल ही के रेस्क्यू (भोपाल)' : 'Recent Bhopal Rescues'}
            </Text>

            {animals.slice(0, 4).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.rescueCard}
                onPress={() => setSelectedAnimal(item)}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, marginRight: 8 }}>
                      {item.animal_type === 'dog' ? '🐕' : '🐄'}
                    </Text>
                    <View>
                      <Text style={styles.cardName}>{item.name}</Text>
                      <Text style={styles.cardLocation}>{item.location_of_rescue || item.location}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { borderColor: getStatusColor(item.status) + '50' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                      {getStatusLabel(item.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardTreatment} numberOfLines={2}>
                  {item.treatment_details || item.treatment || (lang === 'hi' ? 'कोई विशेष उपचार दर्ज नहीं है' : 'No specific treatment logged')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* TAB 2: DOGS */}
        {activeTab === 'dogs' && (
          <View>
            <View style={styles.subHeader}>
              <Text style={styles.subTitle}>
                🐕 {lang === 'hi' ? 'कुत्तों की सूची' : 'Dog Profiles'} ({filteredDogs.length}{filteredDogs.length !== dogs.length ? ` / ${dogs.length}` : ''})
              </Text>
              <TouchableOpacity
                style={styles.miniAddBtn}
                onPress={() => {
                  setAnimalType('dog');
                  setActiveTab('add');
                }}
              >
                <Text style={styles.miniAddText}>{lang === 'hi' ? '+ नया' : '+ Add'}</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input Bar */}
            <View style={styles.searchBarContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                value={dogSearch}
                onChangeText={setDogSearch}
                placeholder={lang === 'hi' ? 'नाम, ID, नस्ल या स्थान खोजें...' : 'Search by name, ID, breed, location...'}
                placeholderTextColor="#5e5752"
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
              {dogSearch.length > 0 && (
                <TouchableOpacity onPress={() => setDogSearch('')} style={styles.clearSearchBtn}>
                  <Text style={styles.clearSearchText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Status Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipsRow}
              style={styles.filterChipsContainer}
            >
              {STATUS_CHIPS.map((chip) => {
                const isActive = dogStatusFilter === chip.key;
                const count =
                  chip.key === 'All'
                    ? dogCounts.all
                    : chip.key === 'Under Treatment'
                    ? dogCounts.underTreatment
                    : chip.key === 'Critical'
                    ? dogCounts.critical
                    : dogCounts.recovered;

                return (
                  <TouchableOpacity
                    key={chip.key}
                    style={[
                      styles.chipBtn,
                      isActive && { backgroundColor: chip.color, borderColor: chip.color }
                    ]}
                    onPress={() => setDogStatusFilter(chip.key)}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {lang === 'hi' ? chip.labelHi : chip.labelEn} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {dogs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>🐕</Text>
                <Text style={styles.emptyTitle}>
                  {lang === 'hi' ? 'कोई कुत्ता पंजीकृत नहीं है' : 'No Dogs Registered'}
                </Text>
                <Text style={styles.emptySub}>
                  {lang === 'hi' ? 'नया रेस्क्यू जोड़ने के लिए + Add पर टैप करें' : 'Tap + Add above to log first dog'}
                </Text>
              </View>
            ) : filteredDogs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={{ fontSize: 28, marginBottom: 6 }}>🔍</Text>
                <Text style={styles.emptyTitle}>
                  {lang === 'hi' ? 'कोई मेल खाने वाला कुत्ता नहीं मिला' : 'No Matching Dogs Found'}
                </Text>
                <Text style={styles.emptySub}>
                  {lang === 'hi' ? 'कृपया अपनी खोज या फ़िल्टर बदलें' : 'Try adjusting your search query or status filter'}
                </Text>
                <TouchableOpacity
                  style={styles.resetFiltersBtn}
                  onPress={() => {
                    setDogSearch('');
                    setDogStatusFilter('All');
                  }}
                >
                  <Text style={styles.resetFiltersText}>
                    {lang === 'hi' ? 'फ़िल्टर हटाएं (Reset)' : 'Reset Filters'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredDogs.map((dog) => (
                <TouchableOpacity
                  key={dog.id}
                  style={styles.rescueCard}
                  onPress={() => setSelectedAnimal(dog)}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardName}>{dog.name}</Text>
                    <Text style={[styles.statusText, { color: getStatusColor(dog.status) }]}>
                      {getStatusLabel(dog.status)}
                    </Text>
                  </View>
                  <Text style={styles.cardLocation}>📍 {dog.location_of_rescue || dog.location}</Text>
                  <Text style={styles.cardTreatment}>
                    {dog.treatment_details || dog.treatment || (lang === 'hi' ? 'कोई विशेष उपचार दर्ज नहीं है' : 'No specific treatment logged')}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* TAB 3: COWS */}
        {activeTab === 'cows' && (
          <View>
            <View style={styles.subHeader}>
              <Text style={styles.subTitle}>
                🐄 {lang === 'hi' ? 'गौशाला सूची' : 'Cow Profiles'} ({filteredCows.length}{filteredCows.length !== cows.length ? ` / ${cows.length}` : ''})
              </Text>
              <TouchableOpacity
                style={styles.miniAddBtn}
                onPress={() => {
                  setAnimalType('cow');
                  setActiveTab('add');
                }}
              >
                <Text style={styles.miniAddText}>{lang === 'hi' ? '+ नया' : '+ Add'}</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input Bar */}
            <View style={styles.searchBarContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                value={cowSearch}
                onChangeText={setCowSearch}
                placeholder={lang === 'hi' ? 'नाम, ID, नस्ल या स्थान खोजें...' : 'Search by name, ID, breed, location...'}
                placeholderTextColor="#5e5752"
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
              {cowSearch.length > 0 && (
                <TouchableOpacity onPress={() => setCowSearch('')} style={styles.clearSearchBtn}>
                  <Text style={styles.clearSearchText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Status Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipsRow}
              style={styles.filterChipsContainer}
            >
              {STATUS_CHIPS.map((chip) => {
                const isActive = cowStatusFilter === chip.key;
                const count =
                  chip.key === 'All'
                    ? cowCounts.all
                    : chip.key === 'Under Treatment'
                    ? cowCounts.underTreatment
                    : chip.key === 'Critical'
                    ? cowCounts.critical
                    : cowCounts.recovered;

                return (
                  <TouchableOpacity
                    key={chip.key}
                    style={[
                      styles.chipBtn,
                      isActive && { backgroundColor: chip.color, borderColor: chip.color }
                    ]}
                    onPress={() => setCowStatusFilter(chip.key)}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {lang === 'hi' ? chip.labelHi : chip.labelEn} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {cows.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>🐄</Text>
                <Text style={styles.emptyTitle}>
                  {lang === 'hi' ? 'कोई गाय पंजीकृत नहीं है' : 'No Cows Registered'}
                </Text>
                <Text style={styles.emptySub}>
                  {lang === 'hi' ? 'नया रेस्क्यू जोड़ने के लिए + Add पर टैप करें' : 'Tap + Add above to log first cow'}
                </Text>
              </View>
            ) : filteredCows.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={{ fontSize: 28, marginBottom: 6 }}>🔍</Text>
                <Text style={styles.emptyTitle}>
                  {lang === 'hi' ? 'कोई मेल खाने वाली गाय नहीं मिली' : 'No Matching Cows Found'}
                </Text>
                <Text style={styles.emptySub}>
                  {lang === 'hi' ? 'कृपया अपनी खोज या फ़िल्टर बदलें' : 'Try adjusting your search query or status filter'}
                </Text>
                <TouchableOpacity
                  style={styles.resetFiltersBtn}
                  onPress={() => {
                    setCowSearch('');
                    setCowStatusFilter('All');
                  }}
                >
                  <Text style={styles.resetFiltersText}>
                    {lang === 'hi' ? 'फ़िल्टर हटाएं (Reset)' : 'Reset Filters'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredCows.map((cow) => (
                <TouchableOpacity
                  key={cow.id}
                  style={styles.rescueCard}
                  onPress={() => setSelectedAnimal(cow)}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardName}>{cow.name}</Text>
                    <Text style={[styles.statusText, { color: getStatusColor(cow.status) }]}>
                      {getStatusLabel(cow.status)}
                    </Text>
                  </View>
                  <Text style={styles.cardLocation}>📍 {cow.location_of_rescue || cow.location}</Text>
                  <Text style={styles.cardTreatment}>
                    {cow.treatment_details || cow.treatment || (lang === 'hi' ? 'कोई विशेष उपचार दर्ज नहीं है' : 'No specific treatment logged')}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* TAB 4: ADD / EDIT RESCUE FORM */}
        {activeTab === 'add' && (
          <View style={styles.formContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.formTitle}>
                {editingAnimalId
                  ? (lang === 'hi' ? `${name || 'जानवर'} का विवरण संपादित करें` : `Edit ${name || 'Animal'} Profile`)
                  : (lang === 'hi' ? 'नया रेस्क्यू दर्ज करें' : 'Log New Animal Rescue')}
              </Text>
              {editingAnimalId && (
                <TouchableOpacity
                  onPress={() => {
                    resetForm();
                    setActiveTab('home');
                  }}
                  style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#262220' }}
                >
                  <Text style={{ color: '#8f8580', fontSize: 11, fontWeight: 'bold' }}>
                    ✕ {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Type Switcher */}
            <View style={styles.typeToggleRow}>
              <TouchableOpacity
                style={[styles.typeBtn, animalType === 'dog' && styles.typeBtnActive]}
                onPress={() => setAnimalType('dog')}
              >
                <Text style={[styles.typeBtnText, animalType === 'dog' && styles.typeBtnTextActive]}>
                  🐕 {lang === 'hi' ? 'कुत्ता (Dog)' : 'Dog'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeBtn, animalType === 'cow' && styles.typeBtnActive]}
                onPress={() => setAnimalType('cow')}
              >
                <Text style={[styles.typeBtnText, animalType === 'cow' && styles.typeBtnTextActive]}>
                  🐄 {lang === 'hi' ? 'गाय (Cow)' : 'Cow'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <Text style={styles.label}>{lang === 'hi' ? 'नाम *' : 'Name *'}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={animalType === 'dog' ? (lang === 'hi' ? 'उदा. ब्रूनो' : 'e.g. Bruno') : (lang === 'hi' ? 'उदा. लक्ष्मी' : 'e.g. Lakshmi')}
              placeholderTextColor="#5e5752"
            />

            <Text style={styles.label}>
              {lang === 'hi' ? 'बचाव का स्थान (भोपाल) *' : 'Rescue Location (Bhopal) *'}
            </Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder={lang === 'hi' ? 'उदा. करोंद मंडी, एमपी नगर' : 'e.g. Karond Mandi, MP Nagar'}
              placeholderTextColor="#5e5752"
            />

            <Text style={styles.label}>
              {lang === 'hi' ? 'बचाव के समय स्थिति *' : 'Condition at Rescue *'}
            </Text>
            <View style={styles.conditionRow}>
              {[
                { key: 'Critical', label: lang === 'hi' ? 'गंभीर' : 'Critical', color: '#b55e5e' },
                { key: 'Severe', label: lang === 'hi' ? 'अत्यधिक' : 'Severe', color: '#c9a355' },
                { key: 'Moderate', label: lang === 'hi' ? 'मध्यम' : 'Moderate', color: '#6b94b8' },
                { key: 'Mild', label: lang === 'hi' ? 'हल्का' : 'Mild', color: '#7ea172' }
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.conditionBtn,
                    condition === item.key && { backgroundColor: item.color, borderColor: item.color }
                  ]}
                  onPress={() => setCondition(item.key)}
                >
                  <Text
                    style={[
                      styles.conditionBtnText,
                      condition === item.key && styles.conditionBtnTextActive
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>
              {lang === 'hi' ? 'अनुमानित रिकवरी समय (Recovery Time)' : 'Estimated Recovery Time'}
            </Text>
            <TextInput
              style={styles.input}
              value={recoveryTime}
              onChangeText={setRecoveryTime}
              placeholder={lang === 'hi' ? 'उदा. 15 दिन, 3 सप्ताह, Ongoing' : 'e.g. 15 Days, 3 Weeks, Ongoing'}
              placeholderTextColor="#5e5752"
            />

            <Text style={styles.label}>
              {lang === 'hi' ? 'उपचार / दवाइयाँ' : 'Treatment / Medications'}
            </Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              multiline
              value={treatment}
              onChangeText={setTreatment}
              placeholder={lang === 'hi' ? 'उदा. पट्टी, दवाइयाँ, ड्रेसिंग...' : 'Dressing, medicines, fractures...'}
              placeholderTextColor="#5e5752"
            />

            {/* Photo Pickers */}
            <View style={styles.photoRow}>
              <TouchableOpacity
                style={styles.photoBox}
                onPress={() => handlePhotoAction('before')}
              >
                {beforeImage ? (
                  <Image source={{ uri: beforeImage }} style={styles.photoPreview} />
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 24 }}>📸</Text>
                    <Text style={styles.photoBoxText}>
                      {lang === 'hi' ? 'बचाव पूर्व फोटो' : 'Before Photo (Camera)'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoBox}
                onPress={() => handlePhotoAction('after')}
              >
                {afterImage ? (
                  <Image source={{ uri: afterImage }} style={styles.photoPreview} />
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 24 }}>✨</Text>
                    <Text style={styles.photoBoxText}>
                      {lang === 'hi' ? 'स्वास्थ्य लाभ फोटो' : 'After Photo (Camera)'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Status Selection (editable when editing profile) */}
            {editingAnimalId && (
              <View style={{ marginBottom: 6 }}>
                <Text style={styles.label}>
                  {lang === 'hi' ? 'स्थिति (Status) *' : 'Current Status *'}
                </Text>
                <View style={styles.conditionRow}>
                  {['Under Treatment', 'Critical', 'Recovered'].map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.conditionBtn,
                        status === st && { backgroundColor: getStatusColor(st), borderColor: getStatusColor(st) }
                      ]}
                      onPress={() => setStatus(st)}
                    >
                      <Text
                        style={[
                          styles.conditionBtnText,
                          status === st && styles.conditionBtnTextActive
                        ]}
                      >
                        {getStatusLabel(st)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
              <Text style={styles.submitBtnText}>
                {editingAnimalId
                  ? (lang === 'hi' ? 'परिवर्तन सुरक्षित करें (Update) ✓' : 'Update Animal Profile ✓')
                  : (lang === 'hi' ? 'प्रोफ़ाइल सुरक्षित करें ✓' : 'Save Animal Profile ✓')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* Bottom Nav Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('home')}
        >
          <Text style={{ fontSize: 18 }}>🏠</Text>
          <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>
            {lang === 'hi' ? 'होम' : 'Home'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('dogs')}
        >
          <Text style={{ fontSize: 18 }}>🐕</Text>
          <Text style={[styles.navText, activeTab === 'dogs' && styles.navTextActive]}>
            {lang === 'hi' ? 'कुत्ते' : 'Dogs'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('cows')}
        >
          <Text style={{ fontSize: 18 }}>🐄</Text>
          <Text style={[styles.navText, activeTab === 'cows' && styles.navTextActive]}>
            {lang === 'hi' ? 'गायें' : 'Cows'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            resetForm();
            setActiveTab('add');
          }}
        >
          <Text style={{ fontSize: 18 }}>➕</Text>
          <Text style={[styles.navText, activeTab === 'add' && styles.navTextActive]}>
            {lang === 'hi' ? 'दर्ज करें' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Animal Detail Modal */}
      {selectedAnimal && (
        <Modal
          visible={Boolean(selectedAnimal)}
          animationType="slide"
          transparent
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 16 }}>{selectedAnimal.animal_type === 'dog' ? '🐕' : '🐄'}</Text>
                  <Text style={styles.modalTitle}>{selectedAnimal.name}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedAnimal(null)}>
                  <Text style={{ color: '#8f8580', fontSize: 18, fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: 16 }}>
                {/* Photo Section with Direct Update Action */}
                <View style={styles.photoRow}>
                  <TouchableOpacity
                    style={styles.photoBox}
                    onPress={() => handleModalPhotoUpdate('before')}
                  >
                    <Text style={styles.photoBoxText}>
                      {lang === 'hi' ? 'बचाव पूर्व फोटो (बदलने हेतु टैप करें)' : 'Before Photo (Tap to edit)'}
                    </Text>
                    {(selectedAnimal.before_image_url || selectedAnimal.beforeImage) ? (
                      <Image source={{ uri: selectedAnimal.before_image_url || selectedAnimal.beforeImage }} style={styles.photoPreview} />
                    ) : (
                      <Text style={{ color: '#8f8580', fontSize: 10 }}>📷 {lang === 'hi' ? 'फोटो जोड़ें' : 'Add Photo'}</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.photoBox}
                    onPress={() => handleModalPhotoUpdate('after')}
                  >
                    <Text style={styles.photoBoxText}>
                      {lang === 'hi' ? 'स्वास्थ्य लाभ फोटो (बदलने हेतु टैप करें)' : 'After Photo (Tap to edit)'}
                    </Text>
                    {(selectedAnimal.after_image_url || selectedAnimal.afterImage) ? (
                      <Image source={{ uri: selectedAnimal.after_image_url || selectedAnimal.afterImage }} style={styles.photoPreview} />
                    ) : (
                      <Text style={{ color: '#8f8580', fontSize: 10 }}>✨ {lang === 'hi' ? 'फोटो जोड़ें' : 'Add Photo'}</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Quick Status Update Section (wired to updateAnimal) */}
                <Text style={[styles.label, { marginTop: 10 }]}>
                  {lang === 'hi' ? 'स्थिति अपडेट करें (Quick Status):' : 'Update Status:'}
                </Text>
                <View style={styles.conditionRow}>
                  {['Under Treatment', 'Critical', 'Recovered'].map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.conditionBtn,
                        selectedAnimal.status === st && { backgroundColor: getStatusColor(st), borderColor: getStatusColor(st) }
                      ]}
                      onPress={() => handleQuickStatusUpdate(selectedAnimal.id, st)}
                    >
                      <Text
                        style={[
                          styles.conditionBtnText,
                          selectedAnimal.status === st && styles.conditionBtnTextActive
                        ]}
                      >
                        {getStatusLabel(st)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.detailBox}>
                  <Text style={styles.detailLine}>ID: <Text style={{ color: '#c9a355' }}>{selectedAnimal.animal_id}</Text></Text>
                  <Text style={styles.detailLine}>
                    {lang === 'hi' ? 'स्थान' : 'Location'}: {selectedAnimal.location_of_rescue || selectedAnimal.location}
                  </Text>
                  <Text style={styles.detailLine}>
                    {lang === 'hi' ? 'तारीख' : 'Date'}: {selectedAnimal.date_of_rescue || selectedAnimal.date}
                  </Text>
                  <Text style={styles.detailLine}>
                    {lang === 'hi' ? 'स्थिति' : 'Condition'}: {getConditionLabel(selectedAnimal.condition_at_rescue || selectedAnimal.condition)}
                  </Text>
                  <Text style={styles.detailLine}>
                    {lang === 'hi' ? 'उपचार' : 'Treatment'}: {selectedAnimal.treatment_details || selectedAnimal.treatment || (lang === 'hi' ? 'कोई नहीं' : 'None')}
                  </Text>
                  <Text style={styles.detailLine}>
                    {lang === 'hi' ? 'रिकवरी समय' : 'Recovery Time'}: {selectedAnimal.recovery_time || selectedAnimal.recovery || (lang === 'hi' ? 'जारी है' : 'Ongoing')}
                  </Text>
                </View>

                {/* Edit Full Profile Button (wires into updateAnimal) */}
                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: '#4a7194', marginTop: 14 }]}
                  onPress={() => handleStartEdit(selectedAnimal)}
                >
                  <Text style={styles.submitBtnText}>
                    ✏️ {lang === 'hi' ? 'प्रोफ़ाइल संपादित करें' : 'Edit Profile Details'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1714',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1714',
    borderBottomWidth: 1,
    borderBottomColor: '#332e2b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  headerTitle: {
    color: '#ede8e3',
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerSubtitle: {
    color: '#c27a66',
    fontSize: 10,
  },
  langButton: {
    backgroundColor: '#262220',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#332e2b',
  },
  langText: {
    color: '#6b94b8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 14,
    backgroundColor: '#141110',
  },
  welcomeCard: {
    backgroundColor: '#1e1b19',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#332e2b',
    marginBottom: 12,
  },
  welcomeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeTag: {
    color: '#6b94b8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  fedBadge: {
    backgroundColor: '#c27a6625',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  fedBadgeText: {
    color: '#c27a66',
    fontSize: 9,
    fontWeight: 'bold',
  },
  totalAnimals: {
    color: '#ede8e3',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 6,
  },
  countsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  countBox: {
    flex: 1,
    backgroundColor: '#141110',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#332e2b',
  },
  countLabel: {
    color: '#8f8580',
    fontSize: 11,
  },
  countValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  addActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a7194',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  actionBtnTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  actionBtnSub: {
    color: '#ede8e3',
    fontSize: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: '#1a1714',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#332e2b',
  },
  catTitle: {
    color: '#ede8e3',
    fontWeight: 'bold',
    fontSize: 12,
  },
  catSub: {
    color: '#8f8580',
    fontSize: 10,
    marginTop: 2,
  },
  sectionHeader: {
    color: '#8f8580',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  rescueCard: {
    backgroundColor: '#1a1714',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#332e2b',
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    color: '#ede8e3',
    fontWeight: 'bold',
    fontSize: 13,
  },
  cardLocation: {
    color: '#8f8580',
    fontSize: 10,
    marginTop: 1,
  },
  cardTreatment: {
    color: '#b5aea8',
    fontSize: 11,
    marginTop: 6,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#1a1714',
    borderTopWidth: 1,
    borderTopColor: '#332e2b',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    color: '#8f8580',
    fontSize: 10,
    marginTop: 2,
  },
  navTextActive: {
    color: '#6b94b8',
    fontWeight: 'bold',
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subTitle: {
    color: '#ede8e3',
    fontSize: 14,
    fontWeight: 'bold',
  },
  miniAddBtn: {
    backgroundColor: '#6b94b8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniAddText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  formContainer: {
    backgroundColor: '#1a1714',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#332e2b',
  },
  formTitle: {
    color: '#ede8e3',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 12,
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#141110',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#332e2b',
  },
  typeBtnActive: {
    backgroundColor: '#c27a66',
    borderColor: '#c27a66',
  },
  typeBtnText: {
    color: '#8f8580',
    fontSize: 11,
    fontWeight: 'bold',
  },
  typeBtnTextActive: {
    color: '#fff',
  },
  conditionRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  conditionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#141110',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#332e2b',
  },
  conditionBtnText: {
    color: '#8f8580',
    fontSize: 10,
    fontWeight: 'bold',
  },
  conditionBtnTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  label: {
    color: '#b5aea8',
    fontSize: 11,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#141110',
    borderWidth: 1,
    borderColor: '#332e2b',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#ede8e3',
    fontSize: 12,
    marginBottom: 10,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 10,
  },
  photoBox: {
    flex: 1,
    height: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#332e2b',
    borderStyle: 'dashed',
    backgroundColor: '#141110',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photoBoxText: {
    color: '#8f8580',
    fontSize: 10,
    marginTop: 4,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  submitBtn: {
    backgroundColor: '#8f5c48',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#1e1b19',
    borderRadius: 16,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#332e2b',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#332e2b',
    backgroundColor: '#1a1714',
  },
  modalTitle: {
    color: '#ede8e3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailBox: {
    backgroundColor: '#141110',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#332e2b',
  },
  detailLine: {
    color: '#ede8e3',
    fontSize: 11,
    marginBottom: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#1a1714',
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#332e2b',
    marginVertical: 10,
  },
  emptyTitle: {
    color: '#ede8e3',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptySub: {
    color: '#8f8580',
    fontSize: 11,
    textAlign: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1714',
    borderWidth: 1,
    borderColor: '#332e2b',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: '#ede8e3',
    fontSize: 12,
    paddingVertical: 7,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    color: '#8f8580',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterChipsContainer: {
    marginBottom: 10,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: 8,
  },
  chipBtn: {
    backgroundColor: '#1a1714',
    borderWidth: 1,
    borderColor: '#332e2b',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    color: '#8f8580',
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  resetFiltersBtn: {
    marginTop: 10,
    backgroundColor: '#262220',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6b94b8',
  },
  resetFiltersText: {
    color: '#6b94b8',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[JJV Mobile ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#141110', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>⚠️</Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#f5f0eb', textAlign: 'center', marginBottom: 8 }}>
            Something went wrong / कुछ गलत हो गया
          </Text>
          <Text style={{ fontSize: 13, color: '#8f8580', textAlign: 'center', marginBottom: 20 }}>
            An unexpected error occurred in the mobile app. Your local rescue data is safe.
            {"\n"}
            मोबाइल ऐप में एक अप्रत्याशित त्रुटि आई। आपका स्थानीय रेस्क्यू डेटा सुरक्षित है।
          </Text>
          <TouchableOpacity
            onPress={this.handleReset}
            style={{ backgroundColor: '#6b94b8', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}
          >
            <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>Try Again (पुनः प्रयास करें)</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <MobileApp />
    </ErrorBoundary>
  );
}
