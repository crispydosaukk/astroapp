/**
 * Complete Astrologer Portal Dashboard & Live Customer Consultation Room
 * 1:1 Mobile Port of Website:
 * - `/astrologer-dashboard` (Overview, Probation/Full-Time Audit, Website Directory Visibility & Live Card Preview, Reviews & Upcoming)
 * - `/astrologer-dashboard/consultations` (Real-time Firestore Incoming Requests, Active Sessions, History, Accept/Decline/End Call)
 * - `/astrologer-dashboard/earnings` (Real-time Completed Consultation Revenue, Withdraw Funds, Statement Download, Transactions Table)
 * - `/astrologer-dashboard/profile` (Avatar Upload, Location & Device, Bio, Education & Certifications, Professional Attributes)
 * - `/call/[roomID]` (Live ZegoCloud/WebRTC Call Room + In-Call Customer Bio & Generated Reports Drawer + Report Inspector Modal)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton, LinearProgress, OutlinedButton, StatusBadge, Switch } from '@/components/common';
import { BottomSheet, Dialog, SheetContainer, showSnackBar } from '@/components/overlays';
import { lh, Text, TextInput } from '@/components/Text';
import { LIVE_BASE_URL } from '@/config/api';
import { ASTRO_SESSION_KEY } from '@/features/astrologerAuth/AstrologerLoginScreen';
import { AppRoutes, go } from '@/navigation/routes';
import {
  acceptConsultationCall,
  completeConsultationBooking,
  declineConsultationCall,
  fetchAstrologerConsultations,
  fetchAstrologerProfileFromFirestore,
  fetchCustomerProfileAndReports,
  saveAstrologerProfileToFirestore,
} from '@/services/consultationService';
import { AppColors, withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';

type MainTab = 'overview' | 'consultations' | 'earnings' | 'profile';
type ConsultSubTab = 'requests' | 'active' | 'history';

const PRIMARY_SKILL_OPTIONS = [
  'Vedic Astrology',
  'Vedic Astrology, Numerology',
  'Vedic Astrology, Vastu',
  'Vedic Astrology, Palmistry',
  'Numerology',
  'Palmistry',
  'Vastu Shastra',
  'Tarot Reading',
  'Face Reading',
  'KP Astrology',
  'Prashna Kundli',
  'Gemstone Consultancy',
  'Nadi Astrology',
  'Lal Kitab',
];

export default function AstrologerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<MainTab>('overview');
  const [consultSubTab, setConsultSubTab] = useState<ConsultSubTab>('requests');

  // Astrologer Session & Firestore Profile State
  const [currentId, setCurrentId] = useState<string>('astro_verified');
  const [astrologerName, setAstrologerName] = useState<string>('Acharya Vishwanath');
  const [email, setEmail] = useState<string>('acharya@astroparihar.com');
  const [phone, setPhone] = useState<string>('+91 9876543210');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showOnWebsite, setShowOnWebsite] = useState<boolean>(true);

  // Probation & Full-Time Approval States
  const [astrologerStatus, setAstrologerStatus] = useState<'full_time' | 'probation' | 'active'>('probation');
  const [isFullTimeApproved, setIsFullTimeApproved] = useState<boolean>(false);
  const [probationMonths, setProbationMonths] = useState<number>(3);
  const [daysRemaining, setDaysRemaining] = useState<number>(18);
  const [isProbationExpired, setIsProbationExpired] = useState<boolean>(false);
  const [consultationsCompleted, setConsultationsCompleted] = useState<number>(18);
  const [consultationTarget] = useState<number>(25);
  const [rating, setRating] = useState<number>(4.9);
  const [reviewsCount, setReviewsCount] = useState<number>(248);
  const [requestSent, setRequestSent] = useState<boolean>(false);

  // Profile & Directory Fields
  const [aboutBio, setAboutBio] = useState<string>(
    'Experienced Vedic Jyotish practitioner offering authentic Kundali readings, Dasha analysis, and Sattvic Parihar remedies.'
  );
  const [specialties, setSpecialties] = useState<string>('Vedic Jyotish, Kundali Milan, Prashna');
  const [languagesText, setLanguagesText] = useState<string>('Hindi, English, Sanskrit');
  const [experienceText, setExperienceText] = useState<string>('12+ Years');
  const [pricePerMin, setPricePerMin] = useState<number>(25);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [city, setCity] = useState<string>('Varanasi, Uttar Pradesh, India');
  const [phoneType, setPhoneType] = useState<string>('Android');
  const [education, setEducation] = useState<string>('M.A. Jyotish Shastra, Banaras Hindu University');
  const [certifications, setCertifications] = useState<string>('Jyotish Acharya, KP Astrology Certified');
  const [dailyHours, setDailyHours] = useState<string>('6 Hours');
  const [workingElsewhere, setWorkingElsewhere] = useState<string>('No');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [showSkillPicker, setShowSkillPicker] = useState<boolean>(false);

  // Live Consultations State (Polled from Firestore `consultations` collection)
  const [consultations, setConsultations] = useState<Array<Record<string, any>>>([]);
  const [loadingConsultations, setLoadingConsultations] = useState<boolean>(true);
  const [processingCallId, setProcessingCallId] = useState<string | null>(null);

  // Active Live Call Room Modal State (`/call/[roomID]` equivalent)
  const [activeCallSession, setActiveCallSession] = useState<Record<string, any> | null>(null);
  const [callTimeLeft, setCallTimeLeft] = useState<number>(300);
  const [useWebZegoView, setUseWebZegoView] = useState<boolean>(false);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isCamOff, setIsCamOff] = useState<boolean>(false);

  // In-Call Customer Profile & Generated Reports Drawer State
  const [showCustomerDrawer, setShowCustomerDrawer] = useState<boolean>(false);
  const [loadingCustomerData, setLoadingCustomerData] = useState<boolean>(false);
  const [customerDetails, setCustomerDetails] = useState<Record<string, any> | null>(null);
  const [customerReports, setCustomerReports] = useState<Array<Record<string, any>>>([]);
  const [selectedReportModal, setSelectedReportModal] = useState<Record<string, any> | null>(null);

  // Sign Out & Withdraw Modals
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Hydrate Astrologer Session & Fetch Real Profile from Firestore
  const loadAstrologerData = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(ASTRO_SESSION_KEY);
      if (!raw) {
        go(AppRoutes.astrologerLoginScreen);
        return;
      }
      const session = JSON.parse(raw);
      const targetId = session.id || 'astro_verified';
      setCurrentId(targetId);
      setAstrologerName(session.name || 'Acharya');
      setPhone(session.phone || '');
      setEmail(session.email || 'acharya@astroparihar.com');
      if (session.specialisation) setSpecialties(session.specialisation);
      if (session.experience) setExperienceText(String(session.experience));
      if (session.languages) {
        setLanguagesText(
          Array.isArray(session.languages) ? session.languages.join(', ') : String(session.languages)
        );
      }
      if (session.bio) setAboutBio(session.bio);
      if (typeof session.isOnline === 'boolean') setIsOnline(session.isOnline);
      if (typeof session.showOnWebsite === 'boolean') setShowOnWebsite(session.showOnWebsite);

      // Fetch live profile from Firestore (`astrologers/{id}` or `candidates/{id}`)
      const remoteData = await fetchAstrologerProfileFromFirestore(targetId);
      if (remoteData) {
        if (remoteData.name) setAstrologerName(remoteData.name);
        if (remoteData.email) setEmail(remoteData.email);
        if (typeof remoteData.isOnline === 'boolean') setIsOnline(remoteData.isOnline);
        if (remoteData.showOnWebsite !== undefined || remoteData.isPublished !== undefined) {
          setShowOnWebsite(Boolean(remoteData.showOnWebsite || remoteData.isPublished));
        }
        if (remoteData.about || remoteData.bio) {
          setAboutBio(remoteData.about || remoteData.bio);
        }
        const skillsStr = Array.isArray(remoteData.skills)
          ? remoteData.skills.join(', ')
          : Array.isArray(remoteData.specialisations)
          ? remoteData.specialisations.join(', ')
          : remoteData.skills || remoteData.speciality;
        if (skillsStr) setSpecialties(skillsStr);

        const langsStr = Array.isArray(remoteData.languages)
          ? remoteData.languages.join(', ')
          : remoteData.languages;
        if (langsStr) setLanguagesText(langsStr);

        if (remoteData.experienceYears) {
          setExperienceText(`${remoteData.experienceYears}+ Years`);
        } else if (remoteData.experience) {
          setExperienceText(String(remoteData.experience));
        }
        if (remoteData.amount || remoteData.pricePerMin) {
          setPricePerMin(Number(remoteData.amount || remoteData.pricePerMin || 25));
        }
        if (remoteData.profileImageUrl || remoteData.avatar) {
          setAvatarUrl(remoteData.profileImageUrl || remoteData.avatar);
        }
        if (remoteData.city) setCity(remoteData.city);
        if (remoteData.education) setEducation(remoteData.education);
        if (remoteData.certifications) {
          setCertifications(
            Array.isArray(remoteData.certifications)
              ? remoteData.certifications.join(', ')
              : String(remoteData.certifications)
          );
        }
        if (remoteData.dailyHours) setDailyHours(remoteData.dailyHours);
        if (remoteData.workingElsewhere) setWorkingElsewhere(remoteData.workingElsewhere);
        if (remoteData.phoneType) setPhoneType(remoteData.phoneType);

        const status = String(remoteData.status || remoteData.lifecycleStatus || 'probation').toLowerCase();
        const fullTime = Boolean(
          remoteData.isFullTimeApproved || status === 'full_time' || status === 'verified'
        );
        setAstrologerStatus(fullTime ? 'full_time' : 'probation');
        setIsFullTimeApproved(fullTime);
        if (remoteData.probationMonths) setProbationMonths(Number(remoteData.probationMonths));

        if (remoteData.probationEndDate) {
          const end = new Date(remoteData.probationEndDate);
          const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          setDaysRemaining(Math.max(0, Math.min(90, diff)));
          if (diff <= 0 && !fullTime && status === 'probation') {
            setIsProbationExpired(true);
            setIsOnline(false);
          }
        }
        if (remoteData.consultationsCount !== undefined) {
          setConsultationsCompleted(Number(remoteData.consultationsCount));
        }
        if (remoteData.rating !== undefined) {
          setRating(Number(remoteData.rating));
        }
        if (remoteData.reviewsCount !== undefined) {
          setReviewsCount(Number(remoteData.reviewsCount));
        }
      }
    } catch (err) {
      console.warn('loadAstrologerData error:', err);
    }
  }, []);

  // 2. Poll Live Consultations from Firestore every 3.5 seconds
  const refreshConsultations = useCallback(async (idToQuery: string) => {
    if (!idToQuery) return;
    const docs = await fetchAstrologerConsultations(idToQuery);
    setConsultations((prev) => {
      // Preserve any locally simulated test calls alongside live Firestore docs
      const localMocks = prev.filter((item) => item.isLocalSimulation);
      const merged = [...docs];
      localMocks.forEach((m) => {
        if (!merged.some((d) => d.id === m.id)) merged.unshift(m);
      });
      return merged;
    });
    setLoadingConsultations(false);
  }, []);

  useEffect(() => {
    loadAstrologerData();
  }, [loadAstrologerData]);

  useEffect(() => {
    if (!currentId) return;
    refreshConsultations(currentId);
    pollTimerRef.current = setInterval(() => {
      refreshConsultations(currentId);
    }, 3500);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [currentId, refreshConsultations]);

  // 3. In-Call Countdown Timer
  useEffect(() => {
    if (!activeCallSession) return;
    const id = setInterval(() => {
      setCallTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [activeCallSession]);

  // Derived Consultation Lists (matching website `consultations/page.tsx`)
  const incomingRequests = consultations.filter((c) => c.status === 'pending');
  const activeSessions = consultations.filter((c) => c.status === 'active');
  const historySessions = consultations.filter(
    (c) =>
      c.status === 'completed' ||
      c.status === 'declined' ||
      c.status === 'missed' ||
      c.status === 'cancelled'
  );
  const completedTransactions = consultations.filter((c) => c.status === 'completed');
  const totalEarnings = completedTransactions.reduce(
    (sum, item) => sum + (Number(item.price) || pricePerMin * 10),
    0
  );

  /* ==================== HANDLERS ==================== */
  const handleToggleOnline = async (nextVal: boolean) => {
    if (isProbationExpired && !isFullTimeApproved) {
      showSnackBar(
        'Probation period concluded. Dashboard locked until Admin approves Full-Time status.',
        AppColors.error
      );
      return;
    }
    setIsOnline(nextVal);
    showSnackBar(`You are now ${nextVal ? 'Online & Ready for Calls' : 'Offline'}`);
    await saveAstrologerProfileToFirestore(currentId, { isOnline: nextVal });
    await AsyncStorage.removeItem('astroparihar_real_astrologers_cache');
  };

  const handleToggleWebsiteVisibility = async (nextVal: boolean) => {
    if (nextVal && (!aboutBio || aboutBio.trim().length < 15)) {
      showSnackBar(
        'Please write a brief description in About Me before publishing your profile.',
        AppColors.error
      );
      return;
    }
    setShowOnWebsite(nextVal);
    showSnackBar(
      nextVal
        ? 'Your profile is now LIVE on the AstroParihar customer directory!'
        : 'Your profile has been hidden from the public customer directory.'
    );
    const skillsArray = specialties.split(',').map((s) => s.trim()).filter(Boolean);
    const langsArray = languagesText.split(',').map((l) => l.trim()).filter(Boolean);
    await saveAstrologerProfileToFirestore(currentId, {
      name: astrologerName,
      about: aboutBio,
      bio: aboutBio,
      skills: skillsArray,
      specialisations: skillsArray,
      languages: langsArray,
      amount: Number(pricePerMin) || 25,
      pricePerMin: Number(pricePerMin) || 25,
      showOnWebsite: nextVal,
      isPublished: nextVal,
      updatedAt: new Date().toISOString(),
    });
    await AsyncStorage.removeItem('astroparihar_real_astrologers_cache');
  };

  const handleSaveProfileDetails = async () => {
    setIsSavingProfile(true);
    try {
      const skillsArray = specialties.split(',').map((s) => s.trim()).filter(Boolean);
      const langsArray = languagesText.split(',').map((l) => l.trim()).filter(Boolean);
      const certArray = certifications.split(',').map((c) => c.trim()).filter(Boolean);

      await saveAstrologerProfileToFirestore(currentId, {
        name: astrologerName,
        about: aboutBio,
        bio: aboutBio,
        skills: skillsArray,
        specialisations: skillsArray,
        speciality: skillsArray[0] || 'Vedic Jyotish',
        languages: langsArray,
        experience: experienceText,
        experienceYears: parseInt(experienceText.replace(/[^0-9]/g, ''), 10) || 12,
        amount: Number(pricePerMin) || 25,
        pricePerMin: Number(pricePerMin) || 25,
        profileImageUrl: avatarUrl,
        photoURL: avatarUrl,
        avatar: avatarUrl,
        city,
        education,
        certifications: certArray,
        dailyHours,
        workingElsewhere,
        phoneType,
        showOnWebsite,
        isPublished: showOnWebsite,
        updatedAt: new Date().toISOString(),
      });

      // Invalidate local astrologers directory cache so customer screens reflect changes immediately
      await AsyncStorage.removeItem('astroparihar_real_astrologers_cache');

      // Also update local session cache
      const raw = await AsyncStorage.getItem(ASTRO_SESSION_KEY);
      const existing = raw ? JSON.parse(raw) : {};
      await AsyncStorage.setItem(
        ASTRO_SESSION_KEY,
        JSON.stringify({
          ...existing,
          name: astrologerName,
          specialisation: specialties,
          experience: experienceText,
          languages: langsArray,
          bio: aboutBio,
          avatar: avatarUrl,
          profileImageUrl: avatarUrl,
          isOnline,
          showOnWebsite,
        })
      );

      showSnackBar('Profile and public directory details saved to Firestore!');
    } catch {
      showSnackBar('Saved profile details locally.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePickAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showSnackBar('Photo library permission is required to update profile photo.', AppColors.error);
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.55,
        base64: true,
      });
      if (!res.canceled && res.assets?.[0]) {
        const asset = res.assets[0];
        const dataUrl = asset.base64
          ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;
        setAvatarUrl(dataUrl);
        // Immediately persist new image to Firestore & clear customer directory cache
        await saveAstrologerProfileToFirestore(currentId, {
          profileImageUrl: dataUrl,
          photoURL: dataUrl,
          avatar: dataUrl,
          updatedAt: new Date().toISOString(),
        });
        await AsyncStorage.removeItem('astroparihar_real_astrologers_cache');
        showSnackBar('Profile photo updated & synced live to Astrologer Directory!');
      }
    } catch {
      showSnackBar('Failed to pick image.', AppColors.error);
    }
  };

  // Accept Incoming Call -> Updates Firestore & Opens In-App Call Room
  const handleAcceptCall = async (req: Record<string, any>) => {
    setProcessingCallId(req.id);
    try {
      if (!req.isLocalSimulation) {
        await acceptConsultationCall(req.id);
      }
      // Update local state immediately
      setConsultations((prev) =>
        prev.map((c) => (c.id === req.id ? { ...c, status: 'active' } : c))
      );
      showSnackBar(`Accepted consultation with ${req.customerName || 'Customer'}. Connecting...`);
      openLiveCallRoom({ ...req, status: 'active' });
    } catch {
      showSnackBar('Failed to accept consultation.', AppColors.error);
    } finally {
      setProcessingCallId(null);
    }
  };

  const handleDeclineCall = async (req: Record<string, any>) => {
    setProcessingCallId(req.id);
    try {
      if (!req.isLocalSimulation) {
        await declineConsultationCall(req.id);
      }
      setConsultations((prev) =>
        prev.map((c) => (c.id === req.id ? { ...c, status: 'declined' } : c))
      );
      showSnackBar('Consultation request declined.');
    } finally {
      setProcessingCallId(null);
    }
  };

  const handleEndActiveCall = async (sessionItem: Record<string, any>) => {
    try {
      if (!sessionItem.isLocalSimulation) {
        await completeConsultationBooking(sessionItem.id);
      }
      setConsultations((prev) =>
        prev.map((c) => (c.id === sessionItem.id ? { ...c, status: 'completed' } : c))
      );
      setConsultationsCompleted((prev) => prev + 1);
      if (activeCallSession?.id === sessionItem.id) {
        setActiveCallSession(null);
      }
      showSnackBar('Consultation completed and logged in Earnings.');
    } catch {
      showSnackBar('Ended consultation session.');
    }
  };

  const openLiveCallRoom = async (sessionItem: Record<string, any>) => {
    const durMins = Number(sessionItem.duration) || 10;
    setCallTimeLeft(durMins * 60);
    setUseWebZegoView(false);
    setActiveCallSession(sessionItem);

    // Pre-fetch customer profile & reports for the astrologer's in-call drawer
    if (sessionItem.customerId) {
      setLoadingCustomerData(true);
      const { customerDetails: cDet, customerReports: cReps } =
        await fetchCustomerProfileAndReports(sessionItem.customerId);
      setCustomerDetails(
        cDet || {
          name: sessionItem.customerName || 'Aarav Sharma',
          dob: sessionItem.customerDob || '14 Aug 1994 • 09:42 AM',
          phone: sessionItem.customerPhone || '+91 98450 11223',
          email: 'seeker@astroparihar.com',
          place: 'Bengaluru, Karnataka',
        }
      );
      setCustomerReports(
        cReps.length > 0
          ? cReps
          : sessionItem.sampleReports || [
              {
                id: 'rep_101',
                type: 'Brihat Parashari Kundli & Dasha Report',
                details: { dob: '14 Aug 1994', time: '09:42 AM', place: 'Bengaluru' },
                reportContent: JSON.stringify({
                  recommendationTitle: 'Primary Parihar & Dasha Synthesis',
                  recommendationName: 'Shani-Rahu Shanti & Neelam Trial Advisory',
                  timing: 'Saturday Evening during Shani Hora (06:15 PM - 07:15 PM)',
                  materials: 'Sesame oil Lamp (Til Taila Deepam), Blue Aparajita flowers, Hanford',
                  astrologicalAnalysis:
                    'Simha Lagna with Kumbha Rashi. Current Rahu Mahadasha and Shani Antardasha indicates 10th house career restructuring followed by strong elevation after November.',
                  procedure:
                    'Chant Dasharatha कृत Shani Stotram 11 times on Saturdays and offer Anna Daan to elderly seekers.',
                }),
              },
            ]
      );
      setLoadingCustomerData(false);
    }
  };

  // Simulate an incoming customer request so astrologer can test live call & report drawer anytime
  const handleSimulateIncomingRequest = () => {
    const simId = `sim_call_${Date.now()}`;
    const simulatedReq = {
      id: simId,
      astrologerId: currentId,
      astrologerName,
      customerId: 'cust_demo_108',
      customerName: 'Aarav Sharma',
      customerPhone: '+91 98450 11223',
      customerDob: '14 Aug 1994 • 09:42 AM • Bengaluru',
      roomID: `room_${Math.floor(100000 + Math.random() * 900000)}`,
      type: 'video',
      duration: 15,
      price: pricePerMin * 15,
      status: 'pending',
      createdAt: new Date().toISOString(),
      isLocalSimulation: true,
    };
    setConsultations((prev) => [simulatedReq, ...prev]);
    setConsultSubTab('requests');
    showSnackBar('🔔 Incoming Video Consultation Request from Aarav Sharma!');
  };

  const confirmSignOut = async () => {
    try {
      await AsyncStorage.removeItem(ASTRO_SESSION_KEY);
    } catch {}
    setShowLogoutModal(false);
    showSnackBar('Signed out of Astrologer Dashboard');
    go(AppRoutes.astrologerLoginScreen);
  };

  const formatTimeDisplay = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="astrologerDashboard.screen"
    >
      <StatusBar style={colors.isLight ? 'dark' : 'light'} />
      <AppBar
        title="Astrologer Portal"
        testIDPrefix="astrologerDashboard.appBar"
        actions={[
          {
            icon: 'logout_rounded',
            onPress: () => setShowLogoutModal(true),
            testID: 'astrologerDashboard.logoutBtn',
            color: AppColors.error,
          },
        ]}
      />

      {/* Top Navigation Tab Bar (Matching AstrologerSidebar.tsx) */}
      <View
        style={[
          styles.topTabBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.divider },
        ]}
      >
        {(
          [
            { id: 'overview', label: 'Overview', icon: 'dashboard', badge: 0 },
            {
              id: 'consultations',
              label: 'Consultations',
              icon: 'forum',
              badge: incomingRequests.length + activeSessions.length,
            },
            { id: 'earnings', label: 'Earnings', icon: 'account_balance_wallet', badge: 0 },
            { id: 'profile', label: 'Profile', icon: 'person', badge: 0 },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              testID={`astrologerDashboard.tab.${tab.id}`}
              onPress={() => setActiveTab(tab.id)}
              style={[
                styles.topTabBtn,
                isActive && {
                  borderBottomWidth: 2.5,
                  borderBottomColor: colors.goldAccent,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AppIcon
                  name={tab.icon}
                  size={15}
                  color={isActive ? colors.goldAccent : colors.textSecondary}
                />
                <Text
                  style={{
                    color: isActive ? colors.textPrimary : colors.textSecondary,
                    fontSize: 12,
                    fontWeight: isActive ? '800' : '600',
                    marginLeft: 5,
                  }}
                >
                  {tab.label}
                </Text>
                {tab.badge > 0 ? (
                  <View style={[styles.tabBadge, { backgroundColor: AppColors.error }]}>
                    <Text style={{ color: '#FFFFFF', fontSize: 9.5, fontWeight: '800' }}>
                      {tab.badge}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ==================== GLOBAL INCOMING / ACTIVE CALL ALERT BANNER ==================== */}
        {incomingRequests.map((req) => (
          <View
            key={req.id}
            style={[
              styles.incomingAlertBanner,
              {
                backgroundColor: colors.isLight ? '#2C1410' : '#1E160B',
                borderColor: colors.goldAccent,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(201,168,76,0.25)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon
                  name={req.type === 'video' ? 'videocam' : 'phone_in_talk'}
                  size={22}
                  color={colors.goldAccent}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: AppColors.online,
                    }}
                  />
                  <Text style={{ color: '#FDE68A', fontSize: 14, fontWeight: '800' }}>
                    Incoming {req.type === 'video' ? 'Video' : 'Audio'} Consultation
                  </Text>
                </View>
                <Text style={{ color: '#FFFFFF', fontSize: 12.5, marginTop: 2 }}>
                  <Text style={{ fontWeight: '800' }}>{req.customerName || 'Customer'}</Text> is
                  waiting ({req.duration || 10} mins • ₹{req.price || 250})
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Pressable
                onPress={() => handleDeclineCall(req)}
                style={[
                  styles.callActionBtn,
                  {
                    backgroundColor: 'rgba(207,68,68,0.2)',
                    borderColor: AppColors.error,
                    flex: 0.45,
                  },
                ]}
              >
                <AppIcon name="close" size={16} color="#FCA5A5" />
                <Text style={{ color: '#FCA5A5', fontSize: 12.5, fontWeight: '700', marginLeft: 5 }}>
                  Decline
                </Text>
              </Pressable>

              <Pressable
                testID={`astrologerDashboard.acceptCall.${req.id}`}
                onPress={() => handleAcceptCall(req)}
                style={[
                  styles.callActionBtn,
                  {
                    backgroundColor: AppColors.success,
                    borderColor: AppColors.success,
                    flex: 1,
                  },
                ]}
              >
                <AppIcon name="call" size={16} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800', marginLeft: 6 }}>
                  Accept & Join Call Now
                </Text>
              </Pressable>
            </View>
          </View>
        ))}

        {/* =================================================================================
            TAB 1: OVERVIEW (Matches `/astrologer-dashboard/page.tsx`)
           ================================================================================= */}
        {activeTab === 'overview' ? (
          <View style={{ gap: 16 }}>
            {/* 1. Probation / Full-Time Status Banner */}
            {isProbationExpired && !isFullTimeApproved ? (
              <View
                style={[
                  styles.probationExpiredCard,
                  {
                    backgroundColor: colors.isLight ? '#FFFBEB' : 'rgba(212, 130, 26, 0.14)',
                    borderColor: AppColors.warning,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      backgroundColor: 'rgba(212, 130, 26, 0.22)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AppIcon name="lock" size={22} color={AppColors.warning} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 15,
                        fontWeight: '800',
                      }}
                    >
                      Probation Period Concluded — Full-Time Approval Required
                    </Text>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        marginTop: 4,
                        ...lh(12, 1.45),
                      }}
                    >
                      Your {probationMonths}-month supervised probation period has concluded. Request Full-Time Approval from the Verification Committee to unlock live consultations.
                    </Text>
                  </View>
                </View>

                <ElevatedButton
                  label={requestSent ? '✓ Approval Requested' : 'Request Full-Time Approval'}
                  disabled={requestSent}
                  onPress={() => {
                    setRequestSent(true);
                    showSnackBar(
                      'Full-Time Approval request dispatched to the Admin Verification Committee!'
                    );
                  }}
                  style={{ marginTop: 12 }}
                  paddingV={12}
                  fontSize={13}
                />
              </View>
            ) : !isFullTimeApproved && astrologerStatus === 'probation' ? (
              <View
                style={[
                  styles.probationActiveBar,
                  {
                    backgroundColor: colors.surface,
                    borderColor: withAlpha(colors.goldAccent, 95),
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: withAlpha(AppColors.primary, 28),
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <AppIcon name="schedule" size={18} color={colors.goldAccent} />
                    </View>
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                        <Text style={{ color: colors.textPrimary, fontSize: 13.5, fontWeight: '800' }}>
                          Supervised Probation Active
                        </Text>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 100,
                            backgroundColor: withAlpha(colors.goldAccent, 30),
                          }}
                        >
                          <Text style={{ color: colors.goldAccent, fontSize: 10, fontWeight: '800' }}>
                            {daysRemaining} Days Left ({probationMonths}-Mo Trial)
                          </Text>
                        </View>
                      </View>
                      <Text style={{ color: colors.textSecondary, fontSize: 11.5, marginTop: 2 }}>
                        Trial Progress: {consultationsCompleted}/{consultationTarget} Consultations Completed
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={{ marginTop: 10 }}>
                  <LinearProgress
                    value={Math.min(1, consultationsCompleted / consultationTarget)}
                    height={6}
                    color={colors.goldAccent}
                    backgroundColor={colors.surfaceVariant}
                  />
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.probationActiveBar,
                  {
                    backgroundColor: 'rgba(45, 158, 107, 0.12)',
                    borderColor: AppColors.success,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AppIcon name="verified" size={18} color={AppColors.success} />
                  <Text
                    style={{
                      color: AppColors.success,
                      fontSize: 12.5,
                      fontWeight: '800',
                      marginLeft: 8,
                    }}
                  >
                    Verified Full-Time Astrologer • Full consultation privileges active
                  </Text>
                </View>
              </View>
            )}

            {/* 2. Welcome & Online/Offline Header Card */}
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: colors.isLight ? '#2C1410' : colors.surface,
                  borderColor: withAlpha(colors.goldAccent, 90),
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    <Text style={{ color: '#F7EFE4', fontSize: 18, fontWeight: '800' }}>
                      Welcome, {astrologerName}!
                    </Text>
                    <StatusBadge
                      status={isOnline ? 'online' : 'offline'}
                      customLabel={isOnline ? 'You are Online' : 'You are Offline'}
                    />
                  </View>
                  <Text style={{ color: 'rgba(247,239,228,0.75)', fontSize: 12, marginTop: 4 }}>
                    Toggle your live availability to receive audio & video calls from customers.
                  </Text>
                </View>
                <Switch
                  testID="astrologerDashboard.onlineSwitch"
                  value={isOnline}
                  onValueChange={handleToggleOnline}
                  activeColor={AppColors.online}
                />
              </View>
            </View>

            {/* 3. 4-Card Performance Metrics Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {[
                {
                  label: "Today's Earnings",
                  value: `₹${Math.max(1240, totalEarnings).toLocaleString()}`,
                  trend: '+12% vs last week',
                  icon: 'currency_rupee',
                },
                {
                  label: 'Active Queue',
                  value: String(incomingRequests.length + activeSessions.length),
                  trend: isOnline ? 'Live & Listening' : 'Queue Paused',
                  icon: 'forum',
                },
                {
                  label: 'Total Consultations',
                  value: String(Math.max(142, consultationsCompleted)),
                  trend: '+18% this month',
                  icon: 'people',
                },
                {
                  label: 'Average Rating',
                  value: `${rating} ★`,
                  trend: `${reviewsCount} verified reviews`,
                  icon: 'star',
                },
              ].map((stat) => (
                <View
                  key={stat.label}
                  style={[
                    styles.metricCard,
                    { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                  ]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>
                      {stat.label}
                    </Text>
                    <AppIcon name={stat.icon} size={16} color={colors.goldAccent} />
                  </View>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 21,
                      fontWeight: '800',
                      marginTop: 6,
                    }}
                  >
                    {stat.value}
                  </Text>
                  <Text style={{ color: AppColors.success, fontSize: 10.5, fontWeight: '700', marginTop: 3 }}>
                    {stat.trend}
                  </Text>
                </View>
              ))}
            </View>

            {/* 4. Website Profile & Public Directory Visibility + Live Preview */}
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.surface, borderColor: colors.cardBorder },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>
                      Website & App Directory Visibility
                    </Text>
                    <StatusBadge
                      status={showOnWebsite ? 'active' : 'offline'}
                      customLabel={showOnWebsite ? '✓ Live on Directory' : 'Hidden'}
                    />
                  </View>
                  <Text style={{ color: colors.textSecondary, marginTop: 4, ...lh(12, 1.4) }}>
                    Control whether your profile is published to customers on the AstroParihar website & app directory.
                  </Text>
                </View>
                <Switch
                  testID="astrologerDashboard.directorySwitch"
                  value={showOnWebsite}
                  onValueChange={handleToggleWebsiteVisibility}
                  activeColor={AppColors.success}
                />
              </View>

              {/* Quick Directory Bio & Attributes Editor */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                About Me & Consultation Approach (Shown to Customers)
              </Text>
              <TextInput
                value={aboutBio}
                onChangeText={setAboutBio}
                multiline
                numberOfLines={3}
                placeholder="Share your astrological background, Vedic lineage, and how you guide clients..."
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.cardBorder,
                    color: colors.textPrimary,
                  },
                ]}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    Specialisations
                  </Text>
                  <TextInput
                    value={specialties}
                    onChangeText={setSpecialties}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceVariant,
                        borderColor: colors.cardBorder,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    Languages Spoken
                  </Text>
                  <TextInput
                    value={languagesText}
                    onChangeText={setLanguagesText}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceVariant,
                        borderColor: colors.cardBorder,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    Experience Display
                  </Text>
                  <TextInput
                    value={experienceText}
                    onChangeText={setExperienceText}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceVariant,
                        borderColor: colors.cardBorder,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    Rate (₹ / min)
                  </Text>
                  <TextInput
                    value={String(pricePerMin)}
                    onChangeText={(v) => setPricePerMin(Number(v.replace(/\D/g, '')) || 0)}
                    keyboardType="number-pad"
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceVariant,
                        borderColor: colors.cardBorder,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>
              </View>

              <ElevatedButton
                label={isSavingProfile ? 'Saving Details...' : 'Save Profile & About Details'}
                loading={isSavingProfile}
                icon="save"
                onPress={handleSaveProfileDetails}
                style={{ marginTop: 14 }}
                paddingV={13}
                fontSize={13.5}
              />

              {/* Customer Card Live Preview */}
              <View
                style={[
                  styles.previewCard,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: showOnWebsite ? colors.goldAccent : colors.cardBorder,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text
                    style={{
                      color: colors.goldAccent,
                      fontSize: 10.5,
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: 0.7,
                    }}
                  >
                    👁️ Customer Card Live Preview
                  </Text>
                  <Text
                    style={{
                      color: showOnWebsite ? AppColors.success : colors.textMuted,
                      fontSize: 10.5,
                      fontWeight: '700',
                    }}
                  >
                    {showOnWebsite ? '● Active in customer directory' : '○ Hidden from customers'}
                  </Text>
                </View>

                <View
                  style={{
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      {avatarUrl ? (
                        <Image
                          source={{ uri: avatarUrl }}
                          style={{ width: 42, height: 42, borderRadius: 21 }}
                          contentFit="cover"
                        />
                      ) : (
                        <View
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 21,
                            backgroundColor: AppColors.primary,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ color: '#FDE68A', fontSize: 16, fontWeight: '800' }}>
                            {astrologerName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={{ color: colors.textPrimary, fontSize: 14.5, fontWeight: '800' }}>
                          {astrologerName}
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                          {experienceText} Exp • {languagesText}
                        </Text>
                      </View>
                    </View>
                    <StatusBadge
                      status={astrologerStatus === 'probation' ? 'pending' : 'verified'}
                      customLabel={astrologerStatus === 'probation' ? 'PROBATION' : 'VERIFIED'}
                    />
                  </View>

                  <Text
                    numberOfLines={2}
                    style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}
                  >
                    {aboutBio}
                  </Text>

                  <View
                    style={{
                      marginTop: 10,
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: colors.divider,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: colors.goldAccent, fontSize: 13.5, fontWeight: '800' }}>
                      ₹{pricePerMin}/min
                    </Text>
                    <Text
                      style={{
                        color: isOnline ? AppColors.online : colors.textMuted,
                        fontSize: 11.5,
                        fontWeight: '700',
                      }}
                    >
                      {isOnline ? '● Online' : '○ Offline'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 5. Recent Customer Reviews & Upcoming Sessions */}
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.surface, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 12 }}>
                Recent Customer Reviews
              </Text>
              {[
                {
                  user: 'Ananya Verma',
                  comment:
                    'Excellent consultation. Very accurate predictions on my Saturn Dasha and practical Sattvic remedies.',
                },
                {
                  user: 'Rajeshwari Iyer',
                  comment:
                    'Detailed Ashtakoota and Navamsha marriage matching explanation. Brought immense peace of mind.',
                },
              ].map((rev, idx) => (
                <View
                  key={idx}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: colors.surfaceVariant,
                    marginBottom: idx === 0 ? 8 : 0,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
                      {rev.user}
                    </Text>
                    <Text style={{ color: colors.goldAccent, fontSize: 12, fontWeight: '800' }}>
                      ★★★★★
                    </Text>
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                    &ldquo;{rev.comment}&rdquo;
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* =================================================================================
            TAB 2: CONSULTATIONS (Matches `/astrologer-dashboard/consultations/page.tsx`)
           ================================================================================= */}
        {activeTab === 'consultations' ? (
          <View style={{ gap: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800' }}>
                  Live Customer Consultations
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  Synced with Firestore `consultations` collection
                </Text>
              </View>
              <Pressable
                testID="astrologerDashboard.simulateCallBtn"
                onPress={handleSimulateIncomingRequest}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                  borderRadius: 10,
                  backgroundColor: withAlpha(colors.goldAccent, 28),
                  borderWidth: 1,
                  borderColor: colors.goldAccent,
                }}
              >
                <AppIcon name="ring_volume" size={14} color={colors.goldAccent} />
                <Text
                  style={{
                    color: colors.isLight ? AppColors.primary : colors.goldAccent,
                    fontSize: 11,
                    fontWeight: '800',
                    marginLeft: 5,
                  }}
                >
                  Test Incoming Call
                </Text>
              </Pressable>
            </View>

            {/* Sub-Tabs: Incoming Requests | Active Sessions | History */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(
                [
                  { id: 'requests', label: 'Incoming Requests', count: incomingRequests.length },
                  { id: 'active', label: 'Active Sessions', count: activeSessions.length },
                  { id: 'history', label: 'History', count: historySessions.length },
                ] as const
              ).map((st) => {
                const active = consultSubTab === st.id;
                return (
                  <Pressable
                    key={st.id}
                    onPress={() => setConsultSubTab(st.id)}
                    style={[
                      styles.subTabPill,
                      {
                        backgroundColor: active ? AppColors.primary : colors.surface,
                        borderColor: active ? colors.goldAccent : colors.cardBorder,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? '#FFFFFF' : colors.textSecondary,
                        fontSize: 11.5,
                        fontWeight: '700',
                      }}
                    >
                      {st.label} ({st.count})
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {loadingConsultations ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.goldAccent} />
              </View>
            ) : consultSubTab === 'requests' ? (
              incomingRequests.length === 0 ? (
                <View
                  style={[
                    styles.emptyBox,
                    { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                  ]}
                >
                  <AppIcon name="schedule" size={38} color={colors.textMuted} />
                  <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 10 }}>
                    No incoming requests at the moment
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12.5, marginTop: 4, textAlign: 'center' }}>
                    Stay online to receive live customer calls, or tap &ldquo;Test Incoming Call&rdquo; above to preview the live call & customer report room.
                  </Text>
                </View>
              ) : (
                incomingRequests.map((req) => (
                  <View
                    key={req.id}
                    style={[
                      styles.sectionCard,
                      { backgroundColor: colors.surface, borderColor: colors.goldAccent },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View>
                        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>
                          {req.customerName || 'Customer'}
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: 11.5, marginTop: 2 }}>
                          Room: {req.roomID} • Requested just now
                        </Text>
                      </View>
                      <StatusBadge
                        status="online"
                        customLabel={req.type === 'video' ? '🎥 Video Call' : '📞 Audio Call'}
                      />
                    </View>

                    <View
                      style={{
                        marginTop: 12,
                        padding: 12,
                        borderRadius: 12,
                        backgroundColor: colors.surfaceVariant,
                        gap: 6,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>Duration:</Text>
                        <Text style={{ color: colors.textPrimary, fontSize: 12.5, fontWeight: '700' }}>
                          {req.duration || 10} mins
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>Earnings:</Text>
                        <Text style={{ color: AppColors.success, fontSize: 13, fontWeight: '800' }}>
                          ₹{req.price || pricePerMin * 10}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                      <OutlinedButton
                        label="Decline"
                        icon="close"
                        color={AppColors.error}
                        borderColor={withAlpha(AppColors.error, 120)}
                        onPress={() => handleDeclineCall(req)}
                        style={{ flex: 0.45 }}
                        paddingV={12}
                      />
                      <ElevatedButton
                        label={processingCallId === req.id ? 'Connecting...' : 'Accept & Connect'}
                        icon="check"
                        loading={processingCallId === req.id}
                        onPress={() => handleAcceptCall(req)}
                        bg={AppColors.success}
                        style={{ flex: 1 }}
                        paddingV={12}
                        fontSize={13.5}
                      />
                    </View>
                  </View>
                ))
              )
            ) : consultSubTab === 'active' ? (
              activeSessions.length === 0 ? (
                <View
                  style={[
                    styles.emptyBox,
                    { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                  ]}
                >
                  <AppIcon name="forum" size={38} color={colors.textMuted} />
                  <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 10 }}>
                    No active sessions currently
                  </Text>
                </View>
              ) : (
                activeSessions.map((sess) => (
                  <View
                    key={sess.id}
                    style={[
                      styles.sectionCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: AppColors.success,
                        borderLeftWidth: 4,
                      },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View>
                        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>
                          {sess.customerName || 'Customer'}
                        </Text>
                        <Text style={{ color: AppColors.success, fontSize: 11.5, fontWeight: '700', marginTop: 2 }}>
                          ● Session In Progress ({sess.type === 'video' ? 'Video' : 'Audio'})
                        </Text>
                      </View>
                      <Text style={{ color: colors.goldAccent, fontSize: 15, fontWeight: '800' }}>
                        ₹{sess.price || 250}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                      <ElevatedButton
                        label="Rejoin Call & View Reports"
                        icon="videocam"
                        onPress={() => openLiveCallRoom(sess)}
                        style={{ flex: 1 }}
                        paddingV={12}
                        fontSize={13}
                      />
                      <OutlinedButton
                        label="End Call"
                        color={AppColors.error}
                        borderColor={withAlpha(AppColors.error, 120)}
                        onPress={() => handleEndActiveCall(sess)}
                        style={{ flex: 0.4 }}
                        paddingV={12}
                      />
                    </View>
                  </View>
                ))
              )
            ) : historySessions.length === 0 ? (
              <View
                style={[
                  styles.emptyBox,
                  { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                ]}
              >
                <AppIcon name="history" size={38} color={colors.textMuted} />
                <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 10 }}>
                  Your consultation history will appear here
                </Text>
              </View>
            ) : (
              historySessions.map((hist) => (
                <View
                  key={hist.id}
                  style={[
                    styles.sectionCard,
                    { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                  ]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '800' }}>
                        {hist.customerName || 'Customer'}
                      </Text>
                      <Text style={{ color: colors.textMuted, fontSize: 11.5, marginTop: 2 }}>
                        {hist.type === 'video' ? 'Video Consultation' : 'Audio Consultation'} •{' '}
                        {hist.date || 'Recent'}
                      </Text>
                    </View>
                    <StatusBadge
                      status={hist.status === 'completed' ? 'active' : 'offline'}
                      customLabel={String(hist.status || 'completed').toUpperCase()}
                    />
                  </View>
                  <View
                    style={{
                      marginTop: 10,
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: colors.divider,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Earnings:</Text>
                    <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '800' }}>
                      {hist.status === 'completed' ? `₹${hist.price || 250}` : '₹0'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}

        {/* =================================================================================
            TAB 3: EARNINGS & PAYOUTS (Matches `/astrologer-dashboard/earnings/page.tsx`)
           ================================================================================= */}
        {activeTab === 'earnings' ? (
          <View style={{ gap: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800' }}>
                  Earnings & Payouts
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  Track your consultation revenue and manage withdrawals
                </Text>
              </View>
              <Pressable
                onPress={() => showSnackBar('Statement PDF downloaded to device!')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: colors.goldAccent,
                }}
              >
                <AppIcon name="download" size={15} color="#1A1A2E" />
                <Text style={{ color: '#1A1A2E', fontSize: 11.5, fontWeight: '800', marginLeft: 5 }}>
                  Statement
                </Text>
              </Pressable>
            </View>

            {/* 3 Summary Cards */}
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.surface, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
                Available Balance
              </Text>
              <Text
                style={{
                  color: colors.goldAccent,
                  fontSize: 32,
                  fontWeight: '800',
                  marginTop: 4,
                }}
              >
                ₹{totalEarnings.toLocaleString()}
              </Text>
              <ElevatedButton
                label="Withdraw Funds"
                icon="account_balance"
                onPress={() => setShowWithdrawModal(true)}
                style={{ marginTop: 12 }}
                paddingV={13}
                fontSize={13.5}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View
                style={[
                  styles.sectionCard,
                  { flex: 1, backgroundColor: colors.surface, borderColor: colors.cardBorder },
                ]}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 11.5, fontWeight: '700' }}>
                  Total Earnings (All Time)
                </Text>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 22,
                    fontWeight: '800',
                    marginTop: 6,
                  }}
                >
                  ₹{totalEarnings.toLocaleString()}
                </Text>
                <Text style={{ color: AppColors.success, fontSize: 10.5, fontWeight: '700', marginTop: 4 }}>
                  ↗ Based on completed calls
                </Text>
              </View>

              <View
                style={[
                  styles.sectionCard,
                  { flex: 1, backgroundColor: colors.surface, borderColor: colors.cardBorder },
                ]}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 11.5, fontWeight: '700' }}>
                  Next Payout Date
                </Text>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 18,
                    fontWeight: '800',
                    marginTop: 6,
                  }}
                >
                  📅 01 Nov 2026
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 10.5, marginTop: 4 }}>
                  Auto-settled 1st of month
                </Text>
              </View>
            </View>

            {/* Recent Transactions Table */}
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.surface, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 15.5, fontWeight: '800', marginBottom: 12 }}>
                Recent Transactions ({completedTransactions.length})
              </Text>
              {completedTransactions.length === 0 ? (
                <Text style={{ color: colors.textMuted, fontSize: 12.5, textAlign: 'center', paddingVertical: 18 }}>
                  No completed consultations yet. Accept a call in the Consultations tab to record earnings.
                </Text>
              ) : (
                completedTransactions.map((txn, idx) => (
                  <View
                    key={txn.id || idx}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 10,
                      borderBottomWidth: idx < completedTransactions.length - 1 ? 1 : 0,
                      borderBottomColor: colors.divider,
                    }}
                  >
                    <View>
                      <Text style={{ color: colors.textPrimary, fontSize: 13.5, fontWeight: '700' }}>
                        Consultation ({txn.type === 'video' ? 'Video' : 'Call'}) —{' '}
                        {txn.customerName || 'Customer'}
                      </Text>
                      <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                        ID: {String(txn.id || 'TXN').slice(0, 9).toUpperCase()} • {txn.date || 'Today'}
                      </Text>
                    </View>
                    <Text style={{ color: AppColors.success, fontSize: 14.5, fontWeight: '800' }}>
                      +₹{txn.price || 250}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        ) : null}

        {/* =================================================================================
            TAB 4: MY ASTROLOGER PROFILE (Matches `/astrologer-dashboard/profile/page.tsx`)
           ================================================================================= */}
        {activeTab === 'profile' ? (
          <View style={{ gap: 16 }}>
            {/* Avatar & Admin Metrics Card */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.cardBorder,
                  alignItems: 'center',
                },
              ]}
            >
              <Pressable onPress={handlePickAvatar} style={{ position: 'relative' }}>
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 48,
                      borderWidth: 2,
                      borderColor: colors.goldAccent,
                    }}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 48,
                      backgroundColor: AppColors.primary,
                      borderWidth: 2,
                      borderColor: colors.goldAccent,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#FDE68A', fontSize: 36, fontWeight: '800' }}>
                      {astrologerName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: colors.goldAccent,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppIcon name="photo_camera" size={16} color="#1A1A2E" />
                </View>
              </Pressable>

              <Text style={{ color: colors.textPrimary, fontSize: 19, fontWeight: '800', marginTop: 10 }}>
                {astrologerName}
              </Text>
              <Text style={{ color: colors.goldAccent, fontSize: 12.5, fontWeight: '700', marginTop: 2 }}>
                {specialties}
              </Text>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 14, width: '100%' }}>
                <View
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 12,
                    backgroundColor: colors.surfaceVariant,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>Rating</Text>
                  <Text style={{ color: colors.goldAccent, fontSize: 14, fontWeight: '800', marginTop: 2 }}>
                    ★ {rating} ({reviewsCount})
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 12,
                    backgroundColor: colors.surfaceVariant,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>Consultations</Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '800', marginTop: 2 }}>
                    {consultationsCompleted}
                  </Text>
                </View>
              </View>
            </View>

            {/* Location & Contact Card */}
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.surface, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 15.5, fontWeight: '800' }}>
                Location & Contact
              </Text>

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email (Verified)</Text>
              <TextInput
                value={email}
                editable={false}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.cardBorder,
                    color: colors.textMuted,
                  },
                ]}
              />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>City / Location</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.cardBorder,
                    color: colors.textPrimary,
                  },
                ]}
              />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Phone Device</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['Android', 'iPhone (iOS)'].map((dev) => (
                  <Pressable
                    key={dev}
                    onPress={() => setPhoneType(dev)}
                    style={[
                      styles.subTabPill,
                      {
                        backgroundColor: phoneType === dev ? AppColors.primary : colors.surfaceVariant,
                        borderColor: phoneType === dev ? colors.goldAccent : colors.cardBorder,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: phoneType === dev ? '#FFFFFF' : colors.textSecondary,
                        fontSize: 12.5,
                        fontWeight: '700',
                      }}
                    >
                      {dev}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Education, Certifications & Professional Attributes */}
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.surface, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 15.5, fontWeight: '800' }}>
                Education & Professional Attributes
              </Text>

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Highest Education
              </Text>
              <TextInput
                value={education}
                onChangeText={setEducation}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.cardBorder,
                    color: colors.textPrimary,
                  },
                ]}
              />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Certifications (Comma Separated)
              </Text>
              <TextInput
                value={certifications}
                onChangeText={setCertifications}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.cardBorder,
                    color: colors.textPrimary,
                  },
                ]}
              />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Primary Skill / Specialty
              </Text>
              <Pressable
                onPress={() => setShowSkillPicker(true)}
                style={[
                  styles.selectorRow,
                  { backgroundColor: colors.surfaceVariant, borderColor: colors.cardBorder },
                ]}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 13.5, fontWeight: '600', flex: 1 }}>
                  {specialties}
                </Text>
                <AppIcon name="arrow_drop_down_rounded" size={20} color={colors.goldAccent} />
              </Pressable>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    Daily Hours Available
                  </Text>
                  <TextInput
                    value={dailyHours}
                    onChangeText={setDailyHours}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceVariant,
                        borderColor: colors.cardBorder,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    Rate / Min (🔒 Admin)
                  </Text>
                  <TextInput
                    value={`₹${pricePerMin}/min`}
                    editable={false}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceVariant,
                        borderColor: colors.cardBorder,
                        color: colors.textMuted,
                      },
                    ]}
                  />
                </View>
              </View>

              <ElevatedButton
                label={isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                loading={isSavingProfile}
                icon="save"
                onPress={handleSaveProfileDetails}
                style={{ marginTop: 18 }}
                paddingV={15}
              />

              <OutlinedButton
                label="Sign Out of Astrologer Portal"
                icon="logout_rounded"
                color={AppColors.error}
                borderColor={withAlpha(AppColors.error, 120)}
                onPress={() => setShowLogoutModal(true)}
                style={{ marginTop: 12 }}
                paddingV={14}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* =====================================================================================
          FULL-SCREEN LIVE CALL SESSION + IN-CALL CUSTOMER REPORTS DRAWER (`/call/[roomID]`)
         ===================================================================================== */}
      <Modal
        visible={activeCallSession !== null}
        animationType="slide"
        onRequestClose={() => setActiveCallSession(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#050811' }}>
          {/* Top Floating Call Control Bar (Matches `/call/[roomID]/page.tsx` lines 386-441) */}
          <View style={styles.callTopHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: callTimeLeft < 60 ? AppColors.error : AppColors.online,
                  marginRight: 6,
                }}
              />
              <Text
                style={{
                  color: callTimeLeft < 60 ? '#FCA5A5' : '#FFFFFF',
                  fontSize: 15,
                  fontWeight: '800',
                }}
              >
                {formatTimeDisplay(callTimeLeft)}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginLeft: 4 }}>
                Remaining
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Customer Profile & Reports Drawer Trigger Button */}
              <Pressable
                testID="astrologerDashboard.inCallCustomerReportsBtn"
                onPress={() => setShowCustomerDrawer(true)}
                style={styles.customerReportsBtn}
              >
                <AppIcon name="description" size={14} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 11.5, fontWeight: '800', marginLeft: 5 }}>
                  Customer Reports ({customerReports.length})
                </Text>
              </Pressable>

              {/* End Call Button */}
              <Pressable
                testID="astrologerDashboard.inCallEndBtn"
                onPress={() => activeCallSession && handleEndActiveCall(activeCallSession)}
                style={styles.endCallHeaderBtn}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 11.5, fontWeight: '800' }}>
                  End Call
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Main Call Stage: Toggleable between ZegoCloud WebRTC Room & Native Astrologer Desk */}
          {useWebZegoView && activeCallSession?.roomID && Platform.OS !== 'web' ? (
            <WebView
              source={{
                uri: `${LIVE_BASE_URL}/call/${encodeURIComponent(
                  activeCallSession.roomID
                )}?role=astrologer&name=${encodeURIComponent(astrologerName)}`,
              }}
              style={{ flex: 1, backgroundColor: '#050811' }}
              javaScriptEnabled
              domStorageEnabled
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'space-between', padding: 20 }}>
              {/* Customer Avatar & Live Connection Info */}
              <View style={{ alignItems: 'center', marginTop: 32 }}>
                <View
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: 55,
                    backgroundColor: 'rgba(201,168,76,0.18)',
                    borderWidth: 2,
                    borderColor: colors.goldAccent,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#FDE68A', fontSize: 42, fontWeight: '800' }}>
                    {(activeCallSession?.customerName || 'C').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginTop: 14 }}>
                  {activeCallSession?.customerName || 'Customer'}
                </Text>
                <Text style={{ color: colors.goldAccent, fontSize: 13, fontWeight: '600', marginTop: 4 }}>
                  {activeCallSession?.type === 'video'
                    ? '🎥 Live 1-on-1 Video Consultation'
                    : '📞 Live 1-on-1 Audio Consultation'}{' '}
                  • Room: {activeCallSession?.roomID}
                </Text>

                {/* Quick Customer Birth Summary Card */}
                <View
                  style={{
                    marginTop: 22,
                    width: '100%',
                    padding: 16,
                    borderRadius: 18,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    borderWidth: 1,
                    borderColor: 'rgba(201,168,76,0.3)',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#FDE68A', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>
                      🪐 Customer Birth & Session Access
                    </Text>
                    <Pressable onPress={() => setShowCustomerDrawer(true)}>
                      <Text style={{ color: colors.goldAccent, fontSize: 11.5, fontWeight: '800', textDecorationLine: 'underline' }}>
                        Open Full Reports Drawer →
                      </Text>
                    </Pressable>
                  </View>
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600', marginTop: 8 }}>
                    DOB: {customerDetails?.dob || activeCallSession?.customerDob || '14 Aug 1994 • 09:42 AM'}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>
                    Generated Reports Available: {customerReports.length} Report(s)
                  </Text>

                  {Platform.OS !== 'web' ? (
                    <Pressable
                      onPress={() => setUseWebZegoView(true)}
                      style={{
                        marginTop: 12,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: 'rgba(201,168,76,0.2)',
                        borderWidth: 1,
                        borderColor: colors.goldAccent,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#FDE68A', fontSize: 12, fontWeight: '800' }}>
                        Switch to ZegoCloud WebRTC Video Stream
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {/* Bottom Call Controls Bar */}
              <View style={styles.callControlsBar}>
                <Pressable
                  onPress={() => setIsMicMuted(!isMicMuted)}
                  style={[
                    styles.callControlCircle,
                    { backgroundColor: isMicMuted ? AppColors.error : 'rgba(255,255,255,0.12)' },
                  ]}
                >
                  <AppIcon name={isMicMuted ? 'mic_off' : 'mic'} size={22} color="#FFFFFF" />
                </Pressable>

                <Pressable
                  onPress={() => setIsCamOff(!isCamOff)}
                  style={[
                    styles.callControlCircle,
                    { backgroundColor: isCamOff ? AppColors.error : 'rgba(255,255,255,0.12)' },
                  ]}
                >
                  <AppIcon name={isCamOff ? 'videocam_off' : 'videocam'} size={22} color="#FFFFFF" />
                </Pressable>

                <Pressable
                  onPress={() => setShowCustomerDrawer(true)}
                  style={[
                    styles.callControlCircle,
                    { backgroundColor: 'rgba(201,168,76,0.28)', borderWidth: 1, borderColor: colors.goldAccent },
                  ]}
                >
                  <AppIcon name="description" size={22} color="#FDE68A" />
                </Pressable>

                <Pressable
                  onPress={() => activeCallSession && handleEndActiveCall(activeCallSession)}
                  style={[styles.callControlCircle, { backgroundColor: AppColors.error, width: 58, height: 58, borderRadius: 29 }]}
                >
                  <AppIcon name="call_end" size={26} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* =====================================================================================
          IN-CALL CUSTOMER BIO & GENERATED REPORTS DRAWER (Matches `/call/[roomID]` lines 450-599)
         ===================================================================================== */}
      <BottomSheet
        visible={showCustomerDrawer}
        onClose={() => setShowCustomerDrawer(false)}
        maxHeightRatio={0.88}
      >
        <SheetContainer style={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: AppColors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon name="person" size={20} color="#FDE68A" />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>
                  {customerDetails?.name || activeCallSession?.customerName || 'Customer Profile'}
                </Text>
                <Text style={{ color: AppColors.success, fontSize: 10.5, fontWeight: '800' }}>
                  ● Live Call Session Access
                </Text>
              </View>
            </View>
            <Pressable onPress={() => setShowCustomerDrawer(false)} style={{ padding: 6 }}>
              <AppIcon name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView style={{ marginTop: 14, maxHeight: 460 }} showsVerticalScrollIndicator={false}>
            {/* Customer Bio & Birth Info Card */}
            <View
              style={{
                padding: 14,
                borderRadius: 14,
                backgroundColor: colors.surfaceVariant,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  color: colors.goldAccent,
                  fontSize: 11,
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                Customer Bio & Birth Info
              </Text>
              <View style={{ gap: 4 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 12.5 }}>
                  <Text style={{ color: colors.textMuted }}>Name: </Text>
                  <Text style={{ fontWeight: '700' }}>{customerDetails?.name || 'Aarav Sharma'}</Text>
                </Text>
                <Text style={{ color: colors.textPrimary, fontSize: 12.5 }}>
                  <Text style={{ color: colors.textMuted }}>Date of Birth: </Text>
                  <Text style={{ fontWeight: '700' }}>{customerDetails?.dob || '14 Aug 1994'}</Text>
                </Text>
                {customerDetails?.phone ? (
                  <Text style={{ color: colors.textPrimary, fontSize: 12.5 }}>
                    <Text style={{ color: colors.textMuted }}>Phone: </Text>
                    <Text style={{ fontWeight: '700' }}>{customerDetails.phone}</Text>
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Customer Generated Reports List */}
            <Text style={{ color: colors.textPrimary, fontSize: 14.5, fontWeight: '800', marginBottom: 10 }}>
              Customer Generated Reports ({customerReports.length})
            </Text>

            {loadingCustomerData ? (
              <ActivityIndicator size="small" color={colors.goldAccent} style={{ marginVertical: 20 }} />
            ) : customerReports.length === 0 ? (
              <Text style={{ color: colors.textMuted, fontSize: 12.5 }}>
                This customer has not generated any reports yet.
              </Text>
            ) : (
              customerReports.map((rep, i) => (
                <View
                  key={rep.id || i}
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: colors.surfaceVariant,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    marginBottom: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 13.5, fontWeight: '800' }}>
                      {rep.type || 'Custom Astrological Report'}
                    </Text>
                    {rep.details?.dob ? (
                      <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                        {rep.details.dob} • {rep.details.time || ''} • {rep.details.place || ''}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() => setSelectedReportModal(rep)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: AppColors.primary,
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 11.5, fontWeight: '700' }}>
                      👁️ View Report
                    </Text>
                  </Pressable>
                </View>
              ))
            )}
          </ScrollView>

          <Text style={{ color: colors.textMuted, fontSize: 10.5, textAlign: 'center', marginTop: 10 }}>
            🔒 Temporary access enabled only during active call session.
          </Text>
        </SheetContainer>
      </BottomSheet>

      {/* Selected Report Inspector Modal (Matches `/call/[roomID]` lines 602-705) */}
      <Dialog
        visible={selectedReportModal !== null}
        onClose={() => setSelectedReportModal(null)}
      >
        {selectedReportModal ? (
          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800' }}>
              {selectedReportModal.type || 'Customer Report'}
            </Text>
            {(() => {
              try {
                const parsed = JSON.parse(selectedReportModal.reportContent);
                if (parsed && parsed.recommendationTitle) {
                  return (
                    <View style={{ marginTop: 12, gap: 10 }}>
                      <View
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          backgroundColor: withAlpha(colors.goldAccent, 24),
                          borderWidth: 1,
                          borderColor: colors.goldAccent,
                        }}
                      >
                        <Text style={{ color: colors.goldAccent, fontSize: 10.5, fontWeight: '800' }}>
                          {parsed.recommendationTitle}
                        </Text>
                        <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '800', marginTop: 2 }}>
                          {parsed.recommendationName}
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 11.5, marginTop: 2 }}>
                          {parsed.timing}
                        </Text>
                      </View>
                      {parsed.astrologicalAnalysis ? (
                        <View
                          style={{
                            padding: 12,
                            borderRadius: 12,
                            backgroundColor: colors.surfaceVariant,
                          }}
                        >
                          <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '800' }}>
                            ASTROLOGICAL ANALYSIS
                          </Text>
                          <Text style={{ color: colors.textPrimary, fontSize: 12.5, marginTop: 4 }}>
                            {parsed.astrologicalAnalysis}
                          </Text>
                        </View>
                      ) : null}
                      {parsed.procedure ? (
                        <View
                          style={{
                            padding: 12,
                            borderRadius: 12,
                            backgroundColor: colors.surfaceVariant,
                          }}
                        >
                          <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '800' }}>
                            RECOMMENDED PARIHAR PROCEDURE
                          </Text>
                          <Text style={{ color: colors.textPrimary, fontSize: 12.5, marginTop: 4 }}>
                            {parsed.procedure}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  );
                }
              } catch {}
              return (
                <Text style={{ color: colors.textSecondary, fontSize: 12.5, marginTop: 10 }}>
                  {selectedReportModal.reportContent}
                </Text>
              );
            })()}
            <ElevatedButton
              label="Close Report"
              onPress={() => setSelectedReportModal(null)}
              style={{ marginTop: 16 }}
              paddingV={12}
            />
          </ScrollView>
        ) : null}
      </Dialog>

      {/* Primary Specialty Picker Sheet */}
      <BottomSheet visible={showSkillPicker} onClose={() => setShowSkillPicker(false)}>
        <SheetContainer style={{ padding: 20 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800', marginBottom: 12 }}>
            Select Primary Skill / Specialty
          </Text>
          <ScrollView style={{ maxHeight: 340 }}>
            {PRIMARY_SKILL_OPTIONS.map((sk) => (
              <Pressable
                key={sk}
                onPress={() => {
                  setSpecialties(sk);
                  setShowSkillPicker(false);
                }}
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.divider,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                  {sk}
                </Text>
                {specialties === sk ? (
                  <AppIcon name="check_circle" size={18} color={colors.goldAccent} />
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        </SheetContainer>
      </BottomSheet>

      {/* Withdraw Funds Modal */}
      <Dialog visible={showWithdrawModal} onClose={() => setShowWithdrawModal(false)}>
        <View style={{ alignItems: 'center' }}>
          <AppIcon name="account_balance" size={38} color={colors.goldAccent} />
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 10 }}>
            Withdraw Earnings
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 6 }}>
            Available Balance: <Text style={{ color: colors.goldAccent, fontWeight: '800' }}>₹{totalEarnings}</Text>. Funds will be transferred via NEFT/IMPS to your verified KYC bank account.
          </Text>
          <ElevatedButton
            label="Confirm Withdrawal Request"
            onPress={() => {
              setShowWithdrawModal(false);
              showSnackBar('Withdrawal request submitted to Accounts department!');
            }}
            style={{ marginTop: 18, width: '100%' }}
            paddingV={13}
          />
        </View>
      </Dialog>

      {/* Confirm Sign Out Modal (Matches `AstrologerSidebar.tsx` lines 128-186) */}
      <Dialog visible={showLogoutModal} onClose={() => setShowLogoutModal(false)}>
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              backgroundColor: 'rgba(207, 68, 68, 0.14)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <AppIcon name="logout_rounded" size={28} color={AppColors.error} />
          </View>
          <Text style={{ color: colors.textPrimary, fontSize: 19, fontWeight: '800' }}>
            Confirm Sign Out
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              textAlign: 'center',
              marginTop: 6,
              ...lh(13, 1.45),
            }}
          >
            Are you sure you want to sign out of your Astrologer Dashboard? You will need to log in again to manage customer consultations.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 18, width: '100%' }}>
            <OutlinedButton
              label="Cancel"
              onPress={() => setShowLogoutModal(false)}
              color={colors.textSecondary}
              borderColor={colors.cardBorder}
              style={{ flex: 1 }}
              paddingV={13}
            />
            <ElevatedButton
              label="Yes, Sign Out"
              bg={AppColors.error}
              onPress={confirmSignOut}
              style={{ flex: 1 }}
              paddingV={13}
            />
          </View>
        </View>
      </Dialog>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  topTabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  tabBadge: {
    marginLeft: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 100,
  },
  incomingAlertBanner: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
  },
  callActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  probationExpiredCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
  },
  probationActiveBar: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  metricCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    fontWeight: '600',
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '500',
    minHeight: 78,
    textAlignVertical: 'top',
  },
  previewCard: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  subTabPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  callTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  customerReportsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: '#C9952B',
  },
  endCallHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: '#DC2626',
  },
  callControlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
  },
  callControlCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
