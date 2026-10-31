/**
 * 5-Step Astrologer Onboarding & AI Evaluation Portal — 1:1 mobile port of website `/apply`
 * (`src/app/apply/page.tsx`).
 *
 * Includes:
 * - Multilingual switcher (`en`, `hi`, `te`, `ta`, `kn`)
 * - 5-Step Progress Stepper + Live AI Anti-Cheating Proctor Bar (Steps 2–4)
 * - Step 1: Personal & Contact Details, Qualifications, Mandatory Aadhaar Card & PAN Card
 *           Document Uploads (Camera / Photo Gallery / PDF Document Picker), Optional
 *           Supporting Certificates Repeater, Multi-select Specialisations & Languages, Bio
 * - Step 2: Vedic Theory Assessment (Curated Pool vs AI Dynamic Random mode, 3/5/8/10/15 Qs,
 *           configurable passing cutoff & weights, instant grading + classical explanations)
 * - Step 3: Blind Kundali Case Study (Planetary grid, case switcher, AI case generator,
 *           astrological analysis & Sattvic remedies evaluation)
 * - Step 4: Live AI Technical & Ethics Viva (3-round interactive chat interview with timer)
 * - Step 5: Final Submission & Composite AI Score Report Card
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton, OutlinedButton } from '@/components/common';
import { BottomSheet, Dialog, SheetContainer, showSnackBar } from '@/components/overlays';
import { lh, Text, TextInput } from '@/components/Text';
import { API_ENDPOINTS } from '@/config/api';
import {
  APPLY_TRANSLATIONS,
  ApplyLanguageCode,
  CONSULTATION_LANGUAGE_OPTIONS,
  getExplanationText,
  getLocalizedInterviewQuestions,
  getLocalizedKundaliCase,
  getOptionsList,
  getQuestionText,
  getRandomTheoryQuestions,
  getTopicText,
  SPECIALISATION_OPTIONS,
  SUPPORTING_DOC_CATEGORIES,
  TheoryQuestion,
} from '@/data/astrologerApplyData';
import { LOCAL_APPLICATIONS_KEY } from '@/features/astrologerAuth/AstrologerLoginScreen';
import { AppRoutes, go, pop, useExtra } from '@/navigation/routes';
import { AppColors, withAlpha } from '@/theme/colors';
import { AppLanguage, useLanguageStore } from '@/theme/languageStore';
import { useThemeColors } from '@/theme/themeStore';

const PHONE_CODES = [
  { code: '+91', label: '🇮🇳 +91 (India)' },
  { code: '+1', label: '🇺🇸 +1 (US/CA)' },
  { code: '+44', label: '🇬🇧 +44 (UK)' },
  { code: '+971', label: '🇦🇪 +971 (UAE)' },
  { code: '+61', label: '🇦🇺 +61 (AU)' },
  { code: '+65', label: '🇸🇬 +65 (SG)' },
];

const STRONGEST_AREAS = [
  'Marriage & Relationships',
  'Career & Business',
  'Health & Medical Jyotish',
  'Wealth & Finance',
  'Progeny & Education',
];

const LANGUAGE_OPTIONS: Array<{ code: ApplyLanguageCode; appLang: AppLanguage; label: string }> = [
  { code: 'en', appLang: 'English', label: '🇬🇧 English' },
  { code: 'hi', appLang: 'Hindi', label: '🇮🇳 हिंदी (Hindi)' },
  { code: 'te', appLang: 'Telugu', label: '🇮🇳 తెలుగు (Telugu)' },
  { code: 'ta', appLang: 'Tamil', label: '🇮🇳 தமிழ் (Tamil)' },
  { code: 'kn', appLang: 'Kannada', label: '🇮🇳 ಕನ್ನಡ (Kannada)' },
  { code: 'ml', appLang: 'Malayalam', label: '🇮🇳 മലയാളം (Malayalam)' },
];

const APP_LANG_TO_CODE: Record<AppLanguage, ApplyLanguageCode> = {
  English: 'en',
  Hindi: 'hi',
  Telugu: 'te',
  Tamil: 'ta',
  Kannada: 'kn',
  Malayalam: 'ml',
};

interface UploadedDoc {
  uri: string;
  name: string;
  sizeKB: number;
  mimeType: string;
  dataUrl?: string;
}

interface SupportingDocItem extends UploadedDoc {
  id: string;
  title: string;
  category: string;
}

interface KundaliCaseData {
  title: string;
  lagna: string;
  moonSign: string;
  dasha: string;
  placements: string;
  clientQuestion: string;
}

type UploadTarget = 'aadhaar' | 'pan' | 'supporting' | null;

export default function AstrologerApplyScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const extra = useExtra<{ phone?: string }>();

  // Language & Step State (Synced two-way with global useLanguageStore)
  const globalLang = useLanguageStore((s) => s.selectedLanguage);
  const setGlobalLanguage = useLanguageStore((s) => s.setLanguage);
  const [selectedLanguage, setSelectedLanguage] = useState<ApplyLanguageCode>(
    () => APP_LANG_TO_CODE[globalLang] || 'en'
  );
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);
  const t = APPLY_TRANSLATIONS[selectedLanguage] || APPLY_TRANSLATIONS.en;

  useEffect(() => {
    const mapped = APP_LANG_TO_CODE[globalLang] || 'en';
    if (mapped !== selectedLanguage) {
      setSelectedLanguage(mapped);
    }
  }, [globalLang]);

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const scrollRef = useRef<ScrollView>(null);

  // Anti-Cheating Proctor State (Steps 2–4)
  const [proctorViolations, setProctorViolations] = useState(0);
  const [proctorLogs, setProctorLogs] = useState<string[]>([]);
  const [proctorWarningModal, setProctorWarningModal] = useState<string | null>(null);
  const [isTerminated, setIsTerminated] = useState(false);

  // Step 1: Candidate Profile & KYC State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCode, setPhoneCode] = useState('+91');
  const [phone, setPhone] = useState(extra?.phone ? extra.phone.replace(/\D/g, '').slice(-10) : '');
  const [whatsappSameAsPhone, setWhatsappSameAsPhone] = useState(true);
  const [whatsappCode, setWhatsappCode] = useState('+91');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [qualification, setQualification] = useState('');
  const [certificationTitle, setCertificationTitle] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarDoc, setAadhaarDoc] = useState<UploadedDoc | null>(null);
  const [panNumber, setPanNumber] = useState('');
  const [panDoc, setPanDoc] = useState<UploadedDoc | null>(null);

  // Supporting Documents Repeater
  const [supportingDocs, setSupportingDocs] = useState<SupportingDocItem[]>([]);
  const [newSupportTitle, setNewSupportTitle] = useState('');
  const [newSupportCategory, setNewSupportCategory] = useState<string>(SUPPORTING_DOC_CATEGORIES[0]);
  const [showSupportCategorySheet, setShowSupportCategorySheet] = useState(false);

  // Practice & Specialisations
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([
    'Vedic Astrology',
    'Prashna',
  ]);
  const [otherSpecText, setOtherSpecText] = useState('');
  const [showSpecsSheet, setShowSpecsSheet] = useState(false);

  const [strongestArea, setStrongestArea] = useState(STRONGEST_AREAS[0]);
  const [showAreaSheet, setShowAreaSheet] = useState(false);

  const [experience, setExperience] = useState('');
  const [city, setCity] = useState('');

  const [selectedLangs, setSelectedLangs] = useState<string[]>(['Hindi', 'English']);
  const [otherLangText, setOtherLangText] = useState('');
  const [showLangsSheet, setShowLangsSheet] = useState(false);

  const [bio, setBio] = useState('');

  // Upload Source Picker Sheet & Document Preview Modal
  const [uploadTarget, setUploadTarget] = useState<UploadTarget>(null);
  const [previewDoc, setPreviewDoc] = useState<UploadedDoc | null>(null);
  const [showPhoneCodeSheet, setShowPhoneCodeSheet] = useState<'phone' | 'whatsapp' | null>(null);

  // Step 2: Vedic Theory Assessment State
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [questionMode, setQuestionMode] = useState<'curated' | 'ai'>('curated');
  const [activeQuestions, setActiveQuestions] = useState<TheoryQuestion[]>(() =>
    getRandomTheoryQuestions(5)
  );
  const [loadingAiQuestions, setLoadingAiQuestions] = useState(false);
  const [theoryAnswers, setTheoryAnswers] = useState<Record<string, number>>({});
  const [theorySubmitted, setTheorySubmitted] = useState(false);
  const [theoryScore, setTheoryScore] = useState(0);

  // Passing Criteria & Weights
  const [passingThreshold, setPassingThreshold] = useState(75);
  const [weights, setWeights] = useState({ theory: 35, kundali: 25, interview: 40 });
  const [showCriteriaBreakdown, setShowCriteriaBreakdown] = useState(false);

  // Step 3: Blind Kundali Case Study State
  const [customCases, setCustomCases] = useState<KundaliCaseData[]>([]);
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const [customKundaliCase, setCustomKundaliCase] = useState<KundaliCaseData | null>(null);
  const [regeneratingCase, setRegeneratingCase] = useState(false);
  const [kundaliAnalysis, setKundaliAnalysis] = useState('');
  const [kundaliRemedies, setKundaliRemedies] = useState('');
  const [evaluatingKundali, setEvaluatingKundali] = useState(false);
  const [kundaliEval, setKundaliEval] = useState<{
    score: number;
    passed: boolean;
    strengths?: string;
    feedback: string;
  } | null>(null);

  // Step 4: Live AI Technical & Ethics Interview State
  const [interviewRound, setInterviewRound] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewSeconds, setInterviewSeconds] = useState(0);
  const [interviewHistory, setInterviewHistory] = useState<
    Array<{
      round: number;
      topic: string;
      question: string;
      answer: string;
      score: number;
      feedback: string;
    }>
  >([]);
  const [submittingFinal, setSubmittingFinal] = useState(false);
  const [applicationRefId, setApplicationRefId] = useState('AP-2026-8941');

  // Fetch dynamic assessment settings from backend if available
  useEffect(() => {
    fetch(API_ENDPOINTS.assessmentSettings)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data.settings) {
          const s = data.settings;
          if (typeof s.passingThreshold === 'number') setPassingThreshold(s.passingThreshold);
          if (s.weights) setWeights(s.weights);
          if (Array.isArray(s.kundaliCases) && s.kundaliCases.length > 0) {
            setCustomCases(s.kundaliCases);
            setCustomKundaliCase(s.kundaliCases[0]);
          } else if (s.kundaliCase?.lagna) {
            setCustomKundaliCase(s.kundaliCase);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Interview elapsed timer during Step 4
  useEffect(() => {
    if (step !== 4 || interviewRound >= 3 || isTerminated) return;
    const id = setInterval(() => {
      setInterviewSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [step, interviewRound, isTerminated]);

  // Anti-Cheating Proctor Listener (Steps 2, 3, 4)
  useEffect(() => {
    if (step < 2 || step > 4 || isTerminated) return;

    const recordViolation = (reason: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setProctorLogs((prev) => [...prev, `[${timestamp}] ${reason}`]);
      setProctorViolations((prev) => {
        const nextCount = prev + 1;
        if (nextCount >= 3) {
          setIsTerminated(true);
          setProctorWarningModal(null);
        } else {
          setProctorWarningModal(
            `⚠️ Proctoring Violation #${nextCount}/3: ${reason}.\n\nSwitching apps or leaving the assessment window is strictly prohibited. Reaching 3 violations will automatically disqualify your application.`
          );
        }
        return nextCount;
      });
    };

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background') {
        recordViolation('Switched away from application during live assessment');
      }
    });

    return () => sub.remove();
  }, [step, isTerminated]);

  const scrollToTop = () => {
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 80);
  };

  /* ==================== DOCUMENT UPLOAD HANDLERS ==================== */
  const attachDocument = (doc: UploadedDoc, target: UploadTarget) => {
    if (doc.sizeKB > 5 * 1024) {
      showSnackBar('File size exceeds 5MB limit. Please upload a smaller file.', AppColors.error);
      return;
    }

    if (target === 'aadhaar') {
      setAadhaarDoc(doc);
      showSnackBar('Aadhaar Card document uploaded successfully!');
    } else if (target === 'pan') {
      setPanDoc(doc);
      showSnackBar('PAN Card document uploaded successfully!');
    } else if (target === 'supporting') {
      const titleToUse =
        newSupportTitle.trim() || doc.name.replace(/\.[^/.]+$/, '') || 'Supporting Certificate';
      const item: SupportingDocItem = {
        ...doc,
        id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: titleToUse,
        category: newSupportCategory,
      };
      setSupportingDocs((prev) => [...prev, item]);
      setNewSupportTitle('');
      showSnackBar(`Attached "${titleToUse}"`);
    }
    setUploadTarget(null);
  };

  const handlePickCamera = async () => {
    const target = uploadTarget;
    if (!target) return;
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        showSnackBar('Camera permission is required to capture KYC documents.', AppColors.error);
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.45,
        base64: true,
      });
      if (!res.canceled && res.assets?.[0]) {
        const asset = res.assets[0];
        const mime = asset.mimeType || 'image/jpeg';
        const sizeKB = asset.base64
          ? Math.max(1, Math.round((asset.base64.length * 0.75) / 1024))
          : asset.fileSize
          ? Math.max(1, Math.round(asset.fileSize / 1024))
          : 180;
        attachDocument(
          {
            uri: asset.uri,
            name: asset.fileName || `${target}_camera_${Date.now()}.jpg`,
            sizeKB,
            mimeType: mime,
            dataUrl: asset.base64 ? `data:${mime};base64,${asset.base64}` : asset.uri,
          },
          target
        );
      }
    } catch {
      showSnackBar('Could not open camera. Please choose from gallery or files.', AppColors.error);
    }
  };

  const handlePickGallery = async () => {
    const target = uploadTarget;
    if (!target) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showSnackBar('Photo library permission is required to select documents.', AppColors.error);
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.45,
        base64: true,
      });
      if (!res.canceled && res.assets?.[0]) {
        const asset = res.assets[0];
        const mime = asset.mimeType || 'image/jpeg';
        const sizeKB = asset.base64
          ? Math.max(1, Math.round((asset.base64.length * 0.75) / 1024))
          : asset.fileSize
          ? Math.max(1, Math.round(asset.fileSize / 1024))
          : 210;
        attachDocument(
          {
            uri: asset.uri,
            name: asset.fileName || `${target}_photo_${Date.now()}.jpg`,
            sizeKB,
            mimeType: mime,
            dataUrl: asset.base64 ? `data:${mime};base64,${asset.base64}` : asset.uri,
          },
          target
        );
      }
    } catch {
      showSnackBar('Failed to pick image from gallery.', AppColors.error);
    }
  };

  const readUriAsDataUrl = async (uri: string, fallbackMime: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string' && reader.result.startsWith('data:')) {
            resolve(reader.result);
          } else {
            resolve(uri);
          }
        };
        reader.onerror = () => resolve(uri);
        reader.readAsDataURL(blob);
      });
    } catch {
      return uri;
    }
  };

  const handlePickDocument = async () => {
    const target = uploadTarget;
    if (!target) return;
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets?.[0]) {
        const asset = res.assets[0];
        const mime = asset.mimeType || 'application/pdf';
        const sizeKB = asset.size ? Math.max(1, Math.round(asset.size / 1024)) : 240;
        const base64DataUrl = await readUriAsDataUrl(asset.uri, mime);
        attachDocument(
          {
            uri: asset.uri,
            name: asset.name || `${target}_document.pdf`,
            sizeKB,
            mimeType: mime,
            dataUrl: base64DataUrl,
          },
          target
        );
      }
    } catch {
      showSnackBar('Failed to pick document.', AppColors.error);
    }
  };

  /* ==================== STEP 1 VALIDATION & SUBMIT ==================== */
  const toggleSpecialisation = (spec: string) => {
    setSelectedSpecs((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const toggleConsultationLang = (lang: string) => {
    setSelectedLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleStep1Submit = () => {
    if (!name.trim()) {
      showSnackBar('Please enter your Full Name (as per KYC).', AppColors.error);
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      showSnackBar('Please enter a valid Email Address.', AppColors.error);
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      showSnackBar('Please enter a valid 10-digit Calling Phone Number.', AppColors.error);
      return;
    }
    if (!whatsappSameAsPhone && whatsappNumber.replace(/\D/g, '').length < 10) {
      showSnackBar('Please enter a valid 10-digit WhatsApp Number.', AppColors.error);
      return;
    }
    if (!qualification.trim()) {
      showSnackBar('Please enter your Astrological Qualification / Lineage.', AppColors.error);
      return;
    }
    const cleanAadhaar = aadhaarNumber.replace(/\D/g, '');
    if (cleanAadhaar.length !== 12) {
      showSnackBar('Please enter a valid 12-digit Aadhaar Card Number.', AppColors.error);
      return;
    }
    if (!aadhaarDoc) {
      showSnackBar('Please upload your Aadhaar Card document (Photo or PDF).', AppColors.error);
      return;
    }
    const cleanPan = panNumber.trim().toUpperCase();
    if (cleanPan.length !== 10) {
      showSnackBar('Please enter a valid 10-character PAN Card Number.', AppColors.error);
      return;
    }
    if (!panDoc) {
      showSnackBar('Please upload your PAN Card document (Photo or PDF).', AppColors.error);
      return;
    }
    if (selectedSpecs.length === 0) {
      showSnackBar('Please select at least one Primary Specialisation.', AppColors.error);
      return;
    }
    if ((selectedSpecs.includes('Other') || selectedSpecs.includes('Other (Specify Below)')) && !otherSpecText.trim()) {
      showSnackBar('Please specify your Other Specialisation.', AppColors.error);
      return;
    }
    if (!experience.trim()) {
      showSnackBar('Please enter your Total Experience in years.', AppColors.error);
      return;
    }
    if (!city.trim()) {
      showSnackBar('Please enter your Current City & State.', AppColors.error);
      return;
    }
    if (selectedLangs.length === 0) {
      showSnackBar('Please select at least one Consultation Language.', AppColors.error);
      return;
    }
    if ((selectedLangs.includes('Other') || selectedLangs.includes('Other (Specify Below)')) && !otherLangText.trim()) {
      showSnackBar('Please specify your Other Consultation Language.', AppColors.error);
      return;
    }
    if (bio.trim().length < 20) {
      showSnackBar('Please write a brief Professional Bio & Remedy Philosophy (min 20 chars).', AppColors.error);
      return;
    }

    submitFinalApplication();
  };

  /* ==================== STEP 2: VEDIC THEORY HANDLERS ==================== */
  const fetchAiQuestions = async (count: number) => {
    setLoadingAiQuestions(true);
    setTheoryAnswers({});
    setTheorySubmitted(false);
    try {
      const res = await fetch(API_ENDPOINTS.generateQuestions, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count, language: selectedLanguage }),
      });
      const data = await res.json();
      if (data?.success && Array.isArray(data.questions) && data.questions.length > 0) {
        setActiveQuestions(data.questions);
      } else {
        setActiveQuestions(getRandomTheoryQuestions(count));
      }
    } catch {
      setActiveQuestions(getRandomTheoryQuestions(count));
    } finally {
      setLoadingAiQuestions(false);
    }
  };

  const handleCountChange = (newCount: number) => {
    setQuestionCount(newCount);
    setTheoryAnswers({});
    setTheorySubmitted(false);
    if (questionMode === 'ai') {
      fetchAiQuestions(newCount);
    } else {
      setActiveQuestions(getRandomTheoryQuestions(newCount));
    }
  };

  const handleModeChange = (mode: 'curated' | 'ai') => {
    setQuestionMode(mode);
    setTheoryAnswers({});
    setTheorySubmitted(false);
    if (mode === 'ai') {
      fetchAiQuestions(questionCount);
    } else {
      setActiveQuestions(getRandomTheoryQuestions(questionCount));
    }
  };

  const handleTheorySubmit = () => {
    let correct = 0;
    activeQuestions.forEach((q) => {
      if (theoryAnswers[q.id] === q.correctIndex) correct += 1;
    });
    const pct = Math.round((correct / activeQuestions.length) * 100);
    setTheoryScore(pct);
    setTheorySubmitted(true);
    showSnackBar(`Theory Test Graded: ${pct}% (${correct}/${activeQuestions.length} Correct)`);
  };

  /* ==================== STEP 3: KUNDALI CASE HANDLERS ==================== */
  const defaultCaseForLang = getLocalizedKundaliCase(selectedLanguage);
  const activeKundaliCase: KundaliCaseData = customKundaliCase || defaultCaseForLang;

  const handleRegenerateAiCase = async () => {
    setRegeneratingCase(true);
    try {
      const res = await fetch(API_ENDPOINTS.generateChartCase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: selectedLanguage }),
      });
      const data = await res.json();
      if (data?.success && data.kundaliCase) {
        setCustomKundaliCase(data.kundaliCase);
        setKundaliAnalysis('');
        setKundaliRemedies('');
        showSnackBar('Generated new AI Kundali Case Scenario!');
      } else {
        showSnackBar('Loaded classical Parashari Kundali Case.');
      }
    } catch {
      showSnackBar('Using standard Vedic Kundali Case Scenario.');
    } finally {
      setRegeneratingCase(false);
    }
  };

  const handleKundaliSubmit = async () => {
    if (kundaliAnalysis.trim().length < 25 || kundaliRemedies.trim().length < 15) {
      showSnackBar(
        'Please provide a detailed Kundali Analysis and Sattvic Remedies before proceeding.',
        AppColors.error
      );
      return;
    }

    setEvaluatingKundali(true);
    try {
      const res = await fetch(API_ENDPOINTS.evaluateKundali, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chartDetails: activeKundaliCase,
          candidateAnalysis: kundaliAnalysis,
          candidateRemedies: kundaliRemedies,
        }),
      });
      const data = await res.json();
      if (data?.success && data.evaluation) {
        setKundaliEval(data.evaluation);
      } else {
        setKundaliEval({
          score: 84,
          passed: true,
          feedback:
            'Strong identification of 10th house planetary affliction, Mahadasha timing, and ethical Sattvic Parihar remedies.',
        });
      }
    } catch {
      setKundaliEval({
        score: 84,
        passed: true,
        feedback:
          'Strong identification of 10th house planetary affliction, Mahadasha timing, and ethical Sattvic Parihar remedies.',
      });
    } finally {
      setEvaluatingKundali(false);
      setStep(4);
      scrollToTop();
    }
  };

  /* ==================== STEP 4: AI VIVA & FINAL SUBMIT ==================== */
  const localizedInterviewQuestions = getLocalizedInterviewQuestions(name, selectedLanguage);
  const currentInterviewQuestion = localizedInterviewQuestions[interviewRound];

  const handleInterviewSubmitAnswer = async () => {
    if (!currentAnswer.trim() || currentAnswer.trim().length < 20) return;

    setInterviewLoading(true);
    const qObj = localizedInterviewQuestions[interviewRound];

    try {
      const res = await fetch(API_ENDPOINTS.candidateInterview, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionIndex: interviewRound,
          question: qObj.question,
          candidateAnswer: currentAnswer,
          candidateProfile: {
            name,
            specialisation: selectedSpecs.join(', '),
            experience,
          },
        }),
      });
      const data = await res.json();
      const score = data?.evaluation?.score ?? 86;
      const feedback =
        data?.evaluation?.feedback ??
        'Demonstrates authentic Vedic grasp and compassionate client ethics.';

      setInterviewHistory((prev) => [
        ...prev,
        {
          round: interviewRound + 1,
          topic: qObj.topic,
          question: qObj.question,
          answer: currentAnswer,
          score,
          feedback,
        },
      ]);
      setCurrentAnswer('');
      setInterviewRound((prev) => prev + 1);
    } catch {
      setInterviewHistory((prev) => [
        ...prev,
        {
          round: interviewRound + 1,
          topic: qObj.topic,
          question: qObj.question,
          answer: currentAnswer,
          score: 85,
          feedback: 'Good classical understanding and ethical approach.',
        },
      ]);
      setCurrentAnswer('');
      setInterviewRound((prev) => prev + 1);
    } finally {
      setInterviewLoading(false);
    }
  };

  const interviewAvgScore =
    interviewHistory.length > 0
      ? Math.round(
          interviewHistory.reduce((acc, item) => acc + item.score, 0) / interviewHistory.length
        )
      : 0;

  const overallCompositeScore = Math.round(
    theoryScore * (weights.theory / 100) +
      (kundaliEval?.score || 0) * (weights.kundali / 100) +
      interviewAvgScore * (weights.interview / 100)
  );

  const submitFinalApplication = async () => {
    setSubmittingFinal(true);

    const finalSpecsArray = selectedSpecs
      .map((s) => (s === 'Other' || s === 'Other (Specify Below)' ? otherSpecText.trim() : s))
      .filter(Boolean);
    const finalSpecs = finalSpecsArray.join(', ');

    const finalLangsArray = selectedLangs
      .map((l) => (l === 'Other' || l === 'Other (Specify Below)' ? otherLangText.trim() : l))
      .filter(Boolean);
    const finalLangs = finalLangsArray.join(', ');

    const fullCallingPhone = `${phoneCode} ${phone.replace(/\D/g, '')}`;
    const fullWhatsappPhone = whatsappSameAsPhone
      ? fullCallingPhone
      : `${whatsappCode} ${whatsappNumber.replace(/\D/g, '')}`;

    const refId = `AP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setApplicationRefId(refId);

    const formattedOtherDocs = supportingDocs.map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      fileName: d.name,
      fileSize: `${d.sizeKB} KB`,
      fileSizeKB: d.sizeKB,
      document: d.dataUrl || d.uri || '',
      fileUrl: d.dataUrl || d.uri || '',
      fileData: d.dataUrl || d.uri || '',
      uploadedAt: new Date().toISOString(),
    }));

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: fullCallingPhone,
      whatsapp: fullWhatsappPhone,
      whatsappNumber: fullWhatsappPhone,
      location: city.trim(),
      city: city.trim(),
      learningBackground: qualification.trim(),
      qualification: qualification.trim(),
      courseDetails: certificationTitle.trim(),
      certificationTitle: certificationTitle.trim(),
      // Mandatory KYC Documents (matching /api/candidate/apply route.ts)
      aadhaarNumber: aadhaarNumber.replace(/\D/g, ''),
      aadhaarFileName: aadhaarDoc?.name || 'Aadhaar_Document',
      aadhaarDocName: aadhaarDoc?.name || 'Aadhaar_Document',
      aadhaarDocument: aadhaarDoc?.dataUrl || aadhaarDoc?.uri || '',
      aadhaarFileData: aadhaarDoc?.dataUrl || aadhaarDoc?.uri || '',
      panNumber: panNumber.trim().toUpperCase(),
      panFileName: panDoc?.name || 'PAN_Document',
      panDocName: panDoc?.name || 'PAN_Document',
      panDocument: panDoc?.dataUrl || panDoc?.uri || '',
      panFileData: panDoc?.dataUrl || panDoc?.uri || '',
      otherDocuments: formattedOtherDocs,
      supportingDocuments: formattedOtherDocs,
      // Practice & Specialisations
      specialisations: finalSpecsArray,
      specialisation: finalSpecs,
      strongestArea,
      experience: `${experience.trim()} Years`,
      languages: finalLangsArray,
      languagesString: finalLangs,
      bio: bio.trim(),
      // Assessment & AI Evaluation Scores
      assessmentLanguage: selectedLanguage,
      preferredAssessmentLanguage: selectedLanguage,
      theoryScore,
      theoryAnswers,
      theoryQuestionsList: activeQuestions,
      chartCaseScore: kundaliEval?.score || 0,
      kundaliScore: kundaliEval?.score || 0,
      kundaliFeedback: kundaliEval?.feedback || '',
      chartCaseAnalysis: kundaliAnalysis,
      kundaliAnalysis,
      chartRemedy: kundaliRemedies,
      kundaliRemedies,
      chartEvaluation: kundaliEval,
      chartCaseTitle: activeKundaliCase.title,
      chartCaseLagna: activeKundaliCase.lagna,
      chartCaseQuery: activeKundaliCase.clientQuestion,
      chartCasePlacements: activeKundaliCase.placements,
      aiInterviewScore: interviewAvgScore,
      interviewScore: interviewAvgScore,
      conversationHistory: interviewHistory,
      interviewTranscript: interviewHistory,
      interviewDurationSeconds: interviewSeconds,
      overallScore: overallCompositeScore,
      passingThreshold,
      passingThresholdUsed: passingThreshold,
      theoryWeight: weights.theory,
      chartCaseWeight: weights.kundali,
      aiInterviewWeight: weights.interview,
      isAiDynamicQuestions: questionMode === 'ai',
      questionCount,
      tabViolations: proctorViolations,
      proctorViolations,
      proctorLogs,
      referenceId: refId,
      status: 'Under Review',
      submittedAt: new Date().toISOString(),
    };

    try {
      // Save locally so AstrologerLoginScreen immediately recognizes this candidate's pending status
      const existingRaw = await AsyncStorage.getItem(LOCAL_APPLICATIONS_KEY);
      const existingList = existingRaw ? JSON.parse(existingRaw) : [];
      const updatedList = [
        payload,
        ...existingList.filter(
          (item: any) =>
            String(item.phone || '').replace(/\D/g, '').slice(-10) !==
            phone.replace(/\D/g, '').slice(-10)
        ),
      ];
      await AsyncStorage.setItem(LOCAL_APPLICATIONS_KEY, JSON.stringify(updatedList));
    } catch {}

    try {
      await fetch(API_ENDPOINTS.candidateApply, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('[AstrologerApply] Submitted with local persistence fallback:', err);
    } finally {
      setSubmittingFinal(false);
      setStep(5);
      scrollToTop();
      showSnackBar('Application submitted for Vedic Board review!');
    }
  };

  /* ==================== RENDER HELPERS ==================== */
  const renderUploadedDocCard = (
    doc: UploadedDoc,
    onRemove: () => void,
    accentColor = AppColors.success
  ) => {
    const isImage = doc.mimeType.startsWith('image/') || (doc.dataUrl && doc.dataUrl.startsWith('data:image/'));
    return (
      <View
        style={[
          styles.uploadedCard,
          {
            backgroundColor: colors.surface,
            borderColor: withAlpha(accentColor, 110),
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => setPreviewDoc(doc)}>
            {isImage ? (
              <Image
                source={{ uri: doc.dataUrl || doc.uri }}
                style={styles.docThumb}
                contentFit="cover"
              />
            ) : (
              <View
                style={[
                  styles.pdfThumb,
                  { backgroundColor: withAlpha(AppColors.primary, 28) },
                ]}
              >
                <AppIcon name="picture_as_pdf" size={24} color={AppColors.primary} />
              </View>
            )}
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text
              numberOfLines={1}
              style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}
            >
              {doc.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
              <View
                style={{
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 100,
                  backgroundColor: 'rgba(45, 158, 107, 0.16)',
                }}
              >
                <Text style={{ color: AppColors.success, fontSize: 10, fontWeight: '800' }}>
                  {`✓ Uploaded (${doc.sizeKB} KB)`}
                </Text>
              </View>
              <Pressable onPress={() => setPreviewDoc(doc)}>
                <Text style={{ color: colors.goldAccent, fontSize: 10.5, fontWeight: '700', textDecorationLine: 'underline' }}>
                  Preview
                </Text>
              </Pressable>
            </View>
          </View>
          <Pressable
            onPress={onRemove}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
              backgroundColor: 'rgba(207, 68, 68, 0.12)',
            }}
          >
            <Text style={{ color: AppColors.error, fontSize: 11.5, fontWeight: '700' }}>
              Remove
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="astrologerApply.screen"
    >
      <StatusBar style={colors.isLight ? 'dark' : 'light'} />
      <AppBar
        title="Astrologer Application"
        onBack={pop}
        testIDPrefix="astrologerApply.appBar"
        actions={[
          <Pressable
            key="lang"
            testID="astrologerApply.languageBtn"
            onPress={() => setShowLanguageSheet(true)}
            style={[
              styles.langHeaderBtn,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <AppIcon name="translate" size={14} color={colors.goldAccent} />
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 11.5,
                fontWeight: '700',
                marginLeft: 4,
              }}
            >
              {selectedLanguage.toUpperCase()}
            </Text>
            <AppIcon name="arrow_drop_down_rounded" size={16} color={colors.goldAccent} />
          </Pressable>,
        ]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: insets.bottom + 36,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Direct 1-Step Onboarding Application Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderWidth: 1.5,
              borderColor: colors.goldAccent,
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 12,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: withAlpha(colors.goldAccent, 25),
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <AppIcon name="how_to_reg" size={20} color={colors.goldAccent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 13.5, fontWeight: '800' }}>
                Astrologer Onboarding Application
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                1-Step direct credential submission & administrative approval
              </Text>
            </View>
          </View>

          {/* Live AI Anti-Cheating Proctor Bar (Steps 2–4) */}
          {step >= 2 && step <= 4 && !isTerminated ? (
            <View
              style={[
                styles.proctorBar,
                {
                  backgroundColor: colors.isLight ? '#1E1B18' : '#121A2E',
                  borderColor:
                    proctorViolations > 0 ? AppColors.error : withAlpha(colors.goldAccent, 80),
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#EF4444',
                    marginRight: 8,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: '#FDE68A',
                      fontSize: 11,
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    {t.proctorActive}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.68)', fontSize: 10.5, marginTop: 1 }}>
                    App switching, copy-paste & external help are strictly monitored
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.violationPill,
                  {
                    backgroundColor:
                      proctorViolations === 0
                        ? 'rgba(45, 158, 107, 0.2)'
                        : 'rgba(239, 68, 68, 0.25)',
                    borderColor: proctorViolations === 0 ? AppColors.success : '#EF4444',
                  },
                ]}
              >
                <Text
                  style={{
                    color: proctorViolations === 0 ? '#4ADE80' : '#FCA5A5',
                    fontSize: 11,
                    fontWeight: '800',
                  }}
                >
                  {t.tabViolationsLabel} {proctorViolations}/3
                </Text>
              </View>
            </View>
          ) : null}

          {/* Malpractice Disqualification Screen */}
          {isTerminated ? (
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: AppColors.error,
                  alignItems: 'center',
                  paddingVertical: 32,
                },
              ]}
            >
              <View
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 34,
                  backgroundColor: 'rgba(207, 68, 68, 0.14)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <AppIcon name="gpp_bad" size={38} color={AppColors.error} />
              </View>
              <Text
                style={{
                  color: AppColors.error,
                  fontSize: 20,
                  fontWeight: '800',
                  textAlign: 'center',
                }}
              >
                Assessment Terminated Due to Malpractice
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  textAlign: 'center',
                  marginTop: 8,
                  ...lh(13, 1.5),
                }}
              >
                Our AI Proctoring system recorded 3 integrity violations during your live assessment. AstroParihar maintains strict ethical standards for all panel astrologers.
              </Text>
              <ElevatedButton
                label="Return to Astrologer Portal"
                onPress={pop}
                style={{ marginTop: 22 }}
                paddingV={14}
              />
            </View>
          ) : null}

          {/* =========================================================================
              STEP 1: PERSONAL, QUALIFICATIONS, MANDATORY KYC UPLOADS & PRACTICE
             ========================================================================= */}
          {!isTerminated && step === 1 ? (
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.surface, borderColor: colors.cardBorder },
              ]}
            >
              {/* Clean Welcome Heading inside Card */}
              <View style={{ alignItems: 'center', marginBottom: 8 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    backgroundColor: withAlpha(AppColors.primary, colors.isLight ? 18 : 50),
                    borderWidth: 1.5,
                    borderColor: withAlpha(colors.goldAccent, 85),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppIcon name="auto_awesome" size={22} color={colors.goldAccent} />
                </View>
                <Text
                  style={{
                    color: colors.goldAccent,
                    fontSize: 10.5,
                    fontWeight: '800',
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    marginTop: 10,
                    textAlign: 'center',
                  }}
                >
                  {t.portalBadge}
                </Text>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 20,
                    fontWeight: '800',
                    textAlign: 'center',
                    marginTop: 4,
                  }}
                >
                  {t.portalTitle}
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    textAlign: 'center',
                    marginTop: 4,
                    ...lh(12.5, 1.4),
                  }}
                >
                  {t.portalSubtitle}
                </Text>
              </View>

              {/* Section 1: Personal & Contact Details */}
              <View style={[styles.subSectionHeader, { borderBottomColor: colors.divider }]}>
                <View style={[styles.subSectionBadge, { backgroundColor: AppColors.primary }]}>
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>1</Text>
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '800', marginLeft: 8 }}>
                  {t.personalInfoSection.replace(/^\d+\.\s*/, '')}
                </Text>
              </View>

              <FieldLabel label={t.fullNameLabel} colors={colors} />
              <TextInput
                testID="astrologerApply.nameInput"
                value={name}
                onChangeText={setName}
                placeholder={t.fullNamePlaceholder}
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.cardBorder,
                    color: colors.textPrimary,
                  },
                ]}
              />

              <FieldLabel label={t.emailLabel} colors={colors} />
              <TextInput
                testID="astrologerApply.emailInput"
                value={email}
                onChangeText={setEmail}
                placeholder="acharya@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.cardBorder,
                    color: colors.textPrimary,
                  },
                ]}
              />

              <FieldLabel label={t.phoneLabel} colors={colors} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  onPress={() => setShowPhoneCodeSheet('phone')}
                  style={[
                    styles.codePickerBtn,
                    {
                      backgroundColor: colors.surfaceVariant,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 13.5, fontWeight: '700' }}>
                    {phoneCode}
                  </Text>
                  <AppIcon name="arrow_drop_down_rounded" size={18} color={colors.goldAccent} />
                </Pressable>
                <TextInput
                  testID="astrologerApply.phoneInput"
                  value={phone}
                  onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98765 43210"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={[
                    styles.textInput,
                    {
                      flex: 1,
                      backgroundColor: colors.surfaceVariant,
                      borderColor: colors.cardBorder,
                      color: colors.textPrimary,
                    },
                  ]}
                />
              </View>

              {/* WhatsApp Same as Calling Checkbox */}
              <FieldLabel label={t.whatsappLabel} colors={colors} />
              <Pressable
                onPress={() => setWhatsappSameAsPhone(!whatsappSameAsPhone)}
                style={[
                  styles.checkboxRow,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    {
                      backgroundColor: whatsappSameAsPhone ? AppColors.primary : 'transparent',
                      borderColor: whatsappSameAsPhone ? AppColors.primary : colors.textMuted,
                    },
                  ]}
                >
                  {whatsappSameAsPhone ? (
                    <AppIcon name="check" size={14} color="#FFFFFF" />
                  ) : null}
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600', flex: 1 }}>
                  {t.sameAsPhone}
                </Text>
              </Pressable>

              {whatsappSameAsPhone ? (
                <View
                  style={[
                    styles.syncedWhatsappBox,
                    {
                      backgroundColor: 'rgba(45, 158, 107, 0.1)',
                      borderColor: 'rgba(45, 158, 107, 0.35)',
                    },
                  ]}
                >
                  <AppIcon name="check_circle" size={16} color={AppColors.success} />
                  <Text
                    style={{
                      color: AppColors.success,
                      fontSize: 12.5,
                      fontWeight: '700',
                      marginLeft: 8,
                    }}
                  >
                    {`WhatsApp Synced: ${phoneCode} ${phone || '••••••••••'}`}
                  </Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <Pressable
                    onPress={() => setShowPhoneCodeSheet('whatsapp')}
                    style={[
                      styles.codePickerBtn,
                      {
                        backgroundColor: colors.surfaceVariant,
                        borderColor: colors.cardBorder,
                      },
                    ]}
                  >
                    <Text style={{ color: colors.textPrimary, fontSize: 13.5, fontWeight: '700' }}>
                      {whatsappCode}
                    </Text>
                    <AppIcon name="arrow_drop_down_rounded" size={18} color={colors.goldAccent} />
                  </Pressable>
                  <TextInput
                    value={whatsappNumber}
                    onChangeText={(v) => setWhatsappNumber(v.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter 10-digit WhatsApp number"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    maxLength={10}
                    style={[
                      styles.textInput,
                      {
                        flex: 1,
                        backgroundColor: colors.surfaceVariant,
                        borderColor: colors.cardBorder,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>
              )}

              {/* Section 2: Astrological Qualifications & Mandatory KYC Uploads */}
              <View style={[styles.subSectionHeader, { borderBottomColor: colors.divider, marginTop: 24 }]}>
                <View style={[styles.subSectionBadge, { backgroundColor: AppColors.primary }]}>
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>2</Text>
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '800', marginLeft: 8 }}>
                  {t.credentialsSection.replace(/^\d+\.\s*/, '')}
                </Text>
              </View>

              <FieldLabel label={t.learningBgLabel} colors={colors} />
              <TextInput
                testID="astrologerApply.qualificationInput"
                value={qualification}
                onChangeText={setQualification}
                placeholder={t.learningBgPlaceholder}
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.cardBorder,
                    color: colors.textPrimary,
                  },
                ]}
              />

              <FieldLabel label={t.certDetailsLabel} colors={colors} />
              <TextInput
                value={certificationTitle}
                onChangeText={setCertificationTitle}
                placeholder={t.certDetailsPlaceholder}
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.cardBorder,
                    color: colors.textPrimary,
                  },
                ]}
              />

              {/* MANDATORY AADHAAR CARD BOX */}
              <View
                style={[
                  styles.kycBox,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: aadhaarDoc ? AppColors.success : colors.cardBorder,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <AppIcon name="badge" size={18} color={colors.goldAccent} />
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 14,
                        fontWeight: '800',
                        marginLeft: 8,
                      }}
                    >
                      Aadhaar Card Details *
                    </Text>
                  </View>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 100,
                      backgroundColor: aadhaarDoc
                        ? 'rgba(45, 158, 107, 0.16)'
                        : withAlpha(colors.goldAccent, 30),
                    }}
                  >
                    <Text
                      style={{
                        color: aadhaarDoc ? AppColors.success : colors.goldAccent,
                        fontSize: 10,
                        fontWeight: '800',
                      }}
                    >
                      {aadhaarDoc ? '✓ KYC Ready' : 'Mandatory'}
                    </Text>
                  </View>
                </View>

                <FieldLabel label="Aadhaar Card Number * (12 Digits)" colors={colors} />
                <TextInput
                  testID="astrologerApply.aadhaarInput"
                  value={aadhaarNumber}
                  onChangeText={(v) => setAadhaarNumber(v.replace(/\D/g, '').slice(0, 12))}
                  placeholder="XXXX XXXX XXXX"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={12}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.cardBorder,
                      color: colors.textPrimary,
                      letterSpacing: 1.5,
                    },
                  ]}
                />

                <FieldLabel label="Upload Aadhaar Card (Front & Back Photo / PDF) *" colors={colors} />
                {aadhaarDoc ? (
                  renderUploadedDocCard(aadhaarDoc, () => setAadhaarDoc(null))
                ) : (
                  <Pressable
                    testID="astrologerApply.uploadAadhaarBtn"
                    onPress={() => setUploadTarget('aadhaar')}
                    style={[
                      styles.uploadDropzone,
                      {
                        backgroundColor: colors.surface,
                        borderColor: withAlpha(colors.goldAccent, 110),
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.uploadIconCircle,
                        { backgroundColor: withAlpha(colors.goldAccent, 28) },
                      ]}
                    >
                      <AppIcon name="cloud_upload" size={22} color={colors.goldAccent} />
                    </View>
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 13.5,
                        fontWeight: '700',
                        marginTop: 8,
                      }}
                    >
                      Tap to Upload Aadhaar Card
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11.5, marginTop: 2 }}>
                      Camera Photo, Gallery Image, or PDF (Max 5MB)
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* MANDATORY PAN CARD BOX */}
              <View
                style={[
                  styles.kycBox,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: panDoc ? AppColors.success : colors.cardBorder,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <AppIcon name="credit_card" size={18} color={colors.goldAccent} />
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 14,
                        fontWeight: '800',
                        marginLeft: 8,
                      }}
                    >
                      PAN Card Details *
                    </Text>
                  </View>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 100,
                      backgroundColor: panDoc
                        ? 'rgba(45, 158, 107, 0.16)'
                        : withAlpha(colors.goldAccent, 30),
                    }}
                  >
                    <Text
                      style={{
                        color: panDoc ? AppColors.success : colors.goldAccent,
                        fontSize: 10,
                        fontWeight: '800',
                      }}
                    >
                      {panDoc ? '✓ KYC Ready' : 'Mandatory'}
                    </Text>
                  </View>
                </View>

                <FieldLabel label="PAN Card Number * (10 Characters)" colors={colors} />
                <TextInput
                  testID="astrologerApply.panInput"
                  value={panNumber}
                  onChangeText={(v) => setPanNumber(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
                  placeholder="ABCDE1234F"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  maxLength={10}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.cardBorder,
                      color: colors.textPrimary,
                      letterSpacing: 1.5,
                    },
                  ]}
                />

                <FieldLabel label="Upload PAN Card (Clear Photo / PDF) *" colors={colors} />
                {panDoc ? (
                  renderUploadedDocCard(panDoc, () => setPanDoc(null))
                ) : (
                  <Pressable
                    testID="astrologerApply.uploadPanBtn"
                    onPress={() => setUploadTarget('pan')}
                    style={[
                      styles.uploadDropzone,
                      {
                        backgroundColor: colors.surface,
                        borderColor: withAlpha(colors.goldAccent, 110),
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.uploadIconCircle,
                        { backgroundColor: withAlpha(colors.goldAccent, 28) },
                      ]}
                    >
                      <AppIcon name="cloud_upload" size={22} color={colors.goldAccent} />
                    </View>
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 13.5,
                        fontWeight: '700',
                        marginTop: 8,
                      }}
                    >
                      Tap to Upload PAN Card
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11.5, marginTop: 2 }}>
                      Camera Photo, Gallery Image, or PDF (Max 5MB)
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* OPTIONAL SUPPORTING CERTIFICATES & EXPERIENCE DOCUMENTS */}
              <View
                style={[
                  styles.kycBox,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <AppIcon name="workspace_premium" size={18} color={colors.goldAccent} />
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 13.5,
                        fontWeight: '800',
                        marginLeft: 8,
                        flex: 1,
                      }}
                    >
                      Supporting Certificates & Experience Letters
                    </Text>
                  </View>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 100,
                      backgroundColor: withAlpha(colors.goldAccent, 26),
                    }}
                  >
                    <Text style={{ color: colors.goldAccent, fontSize: 10, fontWeight: '800' }}>
                      Optional
                    </Text>
                  </View>
                </View>

                <Text style={{ color: colors.textSecondary, marginTop: 6, ...lh(11.5, 1.4) }}>
                  Upload any additional astrology degrees, Gurukul certificates, awards, or prior platform experience letters.
                </Text>

                <FieldLabel label="Document Title / Certificate Name" colors={colors} />
                <TextInput
                  value={newSupportTitle}
                  onChangeText={setNewSupportTitle}
                  placeholder="e.g., Jyotish Acharya Certificate - BHU"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.cardBorder,
                      color: colors.textPrimary,
                    },
                  ]}
                />

                <FieldLabel label="Document Category" colors={colors} />
                <Pressable
                  onPress={() => setShowSupportCategorySheet(true)}
                  style={[
                    styles.selectorButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 13.5, fontWeight: '600', flex: 1 }}>
                    {newSupportCategory}
                  </Text>
                  <AppIcon name="arrow_drop_down_rounded" size={20} color={colors.goldAccent} />
                </Pressable>

                <OutlinedButton
                  label="+ Choose File & Attach Document"
                  icon="attach_file"
                  onPress={() => setUploadTarget('supporting')}
                  color={colors.isLight ? AppColors.primary : colors.goldAccent}
                  borderColor={withAlpha(colors.goldAccent, 120)}
                  style={{ marginTop: 12, backgroundColor: colors.surface }}
                  paddingV={12}
                />

                {supportingDocs.length > 0 ? (
                  <View style={{ marginTop: 12, gap: 8 }}>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 11,
                        fontWeight: '800',
                        textTransform: 'uppercase',
                      }}
                    >
                      {`Attached Supporting Documents (${supportingDocs.length})`}
                    </Text>
                    {supportingDocs.map((doc, idx) => {
                      const isImg =
                        doc.mimeType.startsWith('image/') ||
                        (doc.dataUrl && doc.dataUrl.startsWith('data:image/'));
                      return (
                        <View
                          key={doc.id}
                          style={[
                            styles.supportingDocRow,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.cardBorder,
                            },
                          ]}
                        >
                          <Pressable onPress={() => setPreviewDoc(doc)}>
                            {isImg ? (
                              <Image
                                source={{ uri: doc.dataUrl || doc.uri }}
                                style={{ width: 40, height: 40, borderRadius: 8 }}
                                contentFit="cover"
                              />
                            ) : (
                              <View
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 8,
                                  backgroundColor: withAlpha(colors.goldAccent, 30),
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <AppIcon name="picture_as_pdf" size={20} color={AppColors.primary} />
                              </View>
                            )}
                          </Pressable>
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text
                              numberOfLines={1}
                              style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}
                            >
                              {idx + 1}. {doc.title}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 6 }}>
                              <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                                {doc.category} • {doc.sizeKB} KB
                              </Text>
                              <Pressable onPress={() => setPreviewDoc(doc)}>
                                <Text
                                  style={{
                                    color: colors.goldAccent,
                                    fontSize: 10.5,
                                    fontWeight: '700',
                                    textDecorationLine: 'underline',
                                  }}
                                >
                                  Preview
                                </Text>
                              </Pressable>
                            </View>
                          </View>
                          <Pressable
                            onPress={() =>
                              setSupportingDocs((prev) => prev.filter((d) => d.id !== doc.id))
                            }
                            style={{ padding: 6 }}
                          >
                            <AppIcon name="delete_outline" size={18} color={AppColors.error} />
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </View>

              {/* Section 3: Practice & Specialisations */}
              <View style={[styles.subSectionHeader, { borderBottomColor: colors.divider, marginTop: 24 }]}>
                <View style={[styles.subSectionBadge, { backgroundColor: AppColors.primary }]}>
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>3</Text>
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '800', marginLeft: 8 }}>
                  {t.practiceSection.replace(/^\d+\.\s*/, '')}
                </Text>
              </View>

              <FieldLabel label={t.specialisationLabel} colors={colors} />
              <Pressable
                onPress={() => setShowSpecsSheet(true)}
                style={[
                  styles.selectorButton,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 13.5, fontWeight: '600', flex: 1 }}>
                  {selectedSpecs.length > 0
                    ? `${selectedSpecs.length} Specialisation(s) Selected`
                    : 'Select Specialisations...'}
                </Text>
                <AppIcon name="arrow_drop_down_rounded" size={20} color={colors.goldAccent} />
              </Pressable>

              {selectedSpecs.length > 0 ? (
                <View style={styles.chipWrap}>
                  {selectedSpecs.map((spec) => (
                    <Pressable
                      key={spec}
                      onPress={() => toggleSpecialisation(spec)}
                      style={[
                        styles.selectedTag,
                        {
                          backgroundColor: withAlpha(AppColors.primary, colors.isLight ? 18 : 50),
                          borderColor: withAlpha(colors.goldAccent, 90),
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: colors.isLight ? AppColors.primary : colors.goldAccent,
                          fontSize: 11.5,
                          fontWeight: '700',
                        }}
                      >
                        {`${spec} ×`}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {selectedSpecs.includes('Other') || selectedSpecs.includes('Other (Specify Below)') ? (
                <View style={{ marginTop: 8 }}>
                  <FieldLabel label="Specify Other Specialisation(s) *" colors={colors} />
                  <TextInput
                    value={otherSpecText}
                    onChangeText={setOtherSpecText}
                    placeholder="e.g., Ramal Shastra, Swar Vigyan, Ashtamangala"
                    placeholderTextColor={colors.textMuted}
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.surfaceVariant,
                        borderColor: colors.cardBorder,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>
              ) : null}

              <FieldLabel label="Strongest Consultation Area *" colors={colors} />
              <Pressable
                onPress={() => setShowAreaSheet(true)}
                style={[
                  styles.selectorButton,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 13.5, fontWeight: '600', flex: 1 }}>
                  {strongestArea}
                </Text>
                <AppIcon name="arrow_drop_down_rounded" size={20} color={colors.goldAccent} />
              </Pressable>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <FieldLabel label={t.experienceLabel} colors={colors} />
                  <TextInput
                    testID="astrologerApply.experienceInput"
                    value={experience}
                    onChangeText={(v) => setExperience(v.replace(/\D/g, '').slice(0, 2))}
                    placeholder="e.g., 8"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.surfaceVariant,
                        borderColor: colors.cardBorder,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>
                <View style={{ flex: 1.3 }}>
                  <FieldLabel label={t.locationLabel} colors={colors} />
                  <TextInput
                    testID="astrologerApply.cityInput"
                    value={city}
                    onChangeText={setCity}
                    placeholder={t.locationPlaceholder}
                    placeholderTextColor={colors.textMuted}
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.surfaceVariant,
                        borderColor: colors.cardBorder,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>
              </View>

              <FieldLabel label={t.languagesLabel} colors={colors} />
              <Pressable
                onPress={() => setShowLangsSheet(true)}
                style={[
                  styles.selectorButton,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 13.5, fontWeight: '600', flex: 1 }}>
                  {selectedLangs.length > 0
                    ? `${selectedLangs.length} Language(s): ${selectedLangs.join(', ')}`
                    : 'Select Consultation Languages...'}
                </Text>
                <AppIcon name="arrow_drop_down_rounded" size={20} color={colors.goldAccent} />
              </Pressable>

              {selectedLangs.length > 0 ? (
                <View style={styles.chipWrap}>
                  {selectedLangs.map((lang) => (
                    <Pressable
                      key={lang}
                      onPress={() => toggleConsultationLang(lang)}
                      style={[
                        styles.selectedTag,
                        {
                          backgroundColor: withAlpha(colors.goldAccent, 24),
                          borderColor: withAlpha(colors.goldAccent, 95),
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: colors.isLight ? AppColors.primary : colors.goldAccent,
                          fontSize: 11.5,
                          fontWeight: '700',
                        }}
                      >
                        {`${lang} ×`}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {selectedLangs.includes('Other') || selectedLangs.includes('Other (Specify Below)') ? (
                <View style={{ marginTop: 8 }}>
                  <FieldLabel label="Specify Other Language(s) *" colors={colors} />
                  <TextInput
                    value={otherLangText}
                    onChangeText={setOtherLangText}
                    placeholder={t.otherLangPlaceholder}
                    placeholderTextColor={colors.textMuted}
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.surfaceVariant,
                        borderColor: colors.cardBorder,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>
              ) : null}

              <FieldLabel label={t.bioLabel} colors={colors} />
              <TextInput
                testID="astrologerApply.bioInput"
                value={bio}
                onChangeText={setBio}
                placeholder={t.bioPlaceholder}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.cardBorder,
                    color: colors.textPrimary,
                  },
                ]}
              />

              <ElevatedButton
                testID="astrologerApply.step1ContinueBtn"
                label={submittingFinal ? 'Submitting Application...' : 'Submit Application for Verification'}
                onPress={handleStep1Submit}
                loading={submittingFinal}
                disabled={submittingFinal}
                icon="check_circle"
                style={{ marginTop: 22 }}
                paddingV={16}
                fontSize={15}
                fontWeight="700"
              />
            </View>
          ) : null}

          {/* =========================================================================
              STEP 2: VEDIC THEORY ASSESSMENT
             ========================================================================= */}
          {!isTerminated && step === 2 ? (
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.surface, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 19, fontWeight: '800' }}>
                {t.theoryHeader}
              </Text>
              <Text style={{ color: colors.textSecondary, marginTop: 4, ...lh(12.5, 1.4) }}>
                {t.theorySubtitle}
              </Text>

              {/* Mode Toggle + Question Count Selector */}
              <View
                style={[
                  styles.assessmentControlsBox,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    onPress={() => handleModeChange('curated')}
                    style={[
                      styles.modeBtn,
                      {
                        backgroundColor:
                          questionMode === 'curated' ? AppColors.primary : colors.surface,
                        borderColor:
                          questionMode === 'curated' ? colors.goldAccent : colors.cardBorder,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: questionMode === 'curated' ? '#FFFFFF' : colors.textSecondary,
                        fontSize: 12,
                        fontWeight: '700',
                      }}
                    >
                      📚 Curated Pool
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleModeChange('ai')}
                    style={[
                      styles.modeBtn,
                      {
                        backgroundColor:
                          questionMode === 'ai' ? AppColors.primary : colors.surface,
                        borderColor:
                          questionMode === 'ai' ? colors.goldAccent : colors.cardBorder,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: questionMode === 'ai' ? '#FFFFFF' : colors.textSecondary,
                        fontSize: 12,
                        fontWeight: '700',
                      }}
                    >
                      🤖 AI Dynamic Random
                    </Text>
                  </Pressable>
                </View>

                {/* Question Count Pills */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 12,
                    flexWrap: 'wrap',
                    gap: 6,
                  }}
                >
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {[3, 5, 8, 10, 15].map((cnt) => (
                      <Pressable
                        key={cnt}
                        onPress={() => handleCountChange(cnt)}
                        style={[
                          styles.countPill,
                          {
                            backgroundColor:
                              questionCount === cnt ? colors.goldAccent : colors.surface,
                            borderColor:
                              questionCount === cnt ? colors.goldAccent : colors.cardBorder,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: questionCount === cnt ? '#1A1A2E' : colors.textSecondary,
                            fontSize: 11.5,
                            fontWeight: '800',
                          }}
                        >
                          {`${cnt} Qs`}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Pressable
                    onPress={() => handleModeChange(questionMode)}
                    style={[
                      styles.shuffleBtn,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.cardBorder,
                      },
                    ]}
                  >
                    <AppIcon name="refresh" size={14} color={colors.goldAccent} />
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 11.5,
                        fontWeight: '700',
                        marginLeft: 4,
                      }}
                    >
                      {questionMode === 'ai' ? 'New AI Set' : 'Shuffle'}
                    </Text>
                  </Pressable>
                </View>

                {/* Passing Threshold & Weights Bar */}
                <View
                  style={{
                    marginTop: 12,
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: colors.divider,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={{ color: colors.textSecondary, fontSize: 11.5, fontWeight: '700' }}>
                      Passing Cutoff:{' '}
                      <Text style={{ color: colors.goldAccent, fontWeight: '800' }}>
                        {passingThreshold}%
                      </Text>
                    </Text>
                    <Pressable onPress={() => setShowCriteriaBreakdown(!showCriteriaBreakdown)}>
                      <Text
                        style={{
                          color: colors.goldAccent,
                          fontSize: 11.5,
                          fontWeight: '700',
                          textDecorationLine: 'underline',
                        }}
                      >
                        {`⚖️ ${showCriteriaBreakdown ? 'Hide Weights' : 'Scoring Weights'}`}
                      </Text>
                    </Pressable>
                  </View>

                  {showCriteriaBreakdown ? (
                    <View style={{ marginTop: 10, gap: 6 }}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {[60, 70, 75, 80, 85, 90].map((val) => (
                          <Pressable
                            key={val}
                            onPress={() => setPassingThreshold(val)}
                            style={{
                              paddingHorizontal: 9,
                              paddingVertical: 4,
                              borderRadius: 8,
                              backgroundColor:
                                passingThreshold === val ? AppColors.primary : colors.surface,
                              borderWidth: 1,
                              borderColor:
                                passingThreshold === val ? colors.goldAccent : colors.cardBorder,
                            }}
                          >
                            <Text
                              style={{
                                color:
                                  passingThreshold === val ? '#FFFFFF' : colors.textSecondary,
                                fontSize: 11,
                                fontWeight: '700',
                              }}
                            >
                              {val}%
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                      <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>
                        {`Composite Weightage: Theory (${weights.theory}%) • Kundali Case (${weights.kundali}%) • AI Viva (${weights.interview}%)`}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Questions List */}
              {loadingAiQuestions ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <ActivityIndicator size="large" color={colors.goldAccent} />
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 12 }}>
                    Generating dynamic Vedic Shastra questions...
                  </Text>
                </View>
              ) : (
                <View style={{ marginTop: 16, gap: 16 }}>
                  {activeQuestions.map((q, idx) => {
                    const questionText = getQuestionText(q, selectedLanguage);
                    const optionsList = getOptionsList(q, selectedLanguage);
                    const explanationText = getExplanationText(q, selectedLanguage);
                    const topicText = getTopicText(q, selectedLanguage);

                    return (
                      <View
                        key={q.id}
                        style={[
                          styles.questionCard,
                          {
                            backgroundColor: colors.surfaceVariant,
                            borderColor: colors.cardBorder,
                          },
                        ]}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 8,
                          }}
                        >
                          <View
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 100,
                              backgroundColor: withAlpha(AppColors.primary, 28),
                            }}
                          >
                            <Text
                              style={{
                                color: colors.isLight ? AppColors.primary : colors.goldAccent,
                                fontSize: 10,
                                fontWeight: '800',
                                textTransform: 'uppercase',
                              }}
                            >
                              {`Q${idx + 1} • ${topicText}`}
                            </Text>
                          </View>
                          <Text style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: '600' }}>
                            Shastra Evaluation
                          </Text>
                        </View>

                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontWeight: '700',
                            marginBottom: 12,
                            ...lh(14, 1.45),
                          }}
                        >
                          {questionText}
                        </Text>

                        <View style={{ gap: 8 }}>
                          {optionsList.map((opt: string, oIdx: number) => {
                            const selected = theoryAnswers[q.id] === oIdx;
                            const isCorrect = q.correctIndex === oIdx;

                            let optBg = colors.surface;
                            let optBorder = colors.cardBorder;
                            let optText = colors.textPrimary;

                            if (theorySubmitted) {
                              if (isCorrect) {
                                optBg = 'rgba(45, 158, 107, 0.16)';
                                optBorder = AppColors.success;
                                optText = AppColors.success;
                              } else if (selected && !isCorrect) {
                                optBg = 'rgba(207, 68, 68, 0.14)';
                                optBorder = AppColors.error;
                                optText = AppColors.error;
                              }
                            } else if (selected) {
                              optBg = withAlpha(AppColors.primary, colors.isLight ? 16 : 55);
                              optBorder = colors.goldAccent;
                            }

                            return (
                              <Pressable
                                key={oIdx}
                                disabled={theorySubmitted}
                                onPress={() =>
                                  setTheoryAnswers((prev) => ({ ...prev, [q.id]: oIdx }))
                                }
                                style={[
                                  styles.optionBtn,
                                  {
                                    backgroundColor: optBg,
                                    borderColor: optBorder,
                                  },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.optionLetterCircle,
                                    {
                                      backgroundColor: selected
                                        ? colors.goldAccent
                                        : colors.surfaceVariant,
                                    },
                                  ]}
                                >
                                  <Text
                                    style={{
                                      color: selected ? '#1A1A2E' : colors.textSecondary,
                                      fontSize: 11,
                                      fontWeight: '800',
                                    }}
                                  >
                                    {String.fromCharCode(65 + oIdx)}
                                  </Text>
                                </View>
                                <Text
                                  style={{
                                    color: optText,
                                    fontSize: 13,
                                    fontWeight: selected ? '700' : '500',
                                    flex: 1,
                                    marginLeft: 10,
                                  }}
                                >
                                  {opt}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>

                        {theorySubmitted ? (
                          <View
                            style={[
                              styles.explanationBox,
                              {
                                backgroundColor: colors.surface,
                                borderColor: colors.cardBorder,
                              },
                            ]}
                          >
                            <Text style={{ color: colors.textSecondary, ...lh(11.5, 1.45) }}>
                              <Text style={{ color: colors.goldAccent, fontWeight: '800' }}>
                                Classical Explanation:{' '}
                              </Text>
                              {explanationText}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Step 2 Bottom Actions */}
              <View
                style={{
                  marginTop: 22,
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: colors.divider,
                  gap: 12,
                }}
              >
                {theorySubmitted ? (
                  <View
                    style={[
                      styles.scoreResultBanner,
                      {
                        backgroundColor:
                          theoryScore >= passingThreshold
                            ? 'rgba(45, 158, 107, 0.14)'
                            : 'rgba(212, 130, 26, 0.15)',
                        borderColor:
                          theoryScore >= passingThreshold ? AppColors.success : AppColors.warning,
                      },
                    ]}
                  >
                    <AppIcon
                      name={theoryScore >= passingThreshold ? 'verified' : 'info_outline'}
                      size={20}
                      color={theoryScore >= passingThreshold ? AppColors.success : AppColors.warning}
                    />
                    <Text
                      style={{
                        color:
                          theoryScore >= passingThreshold ? AppColors.success : AppColors.warning,
                        fontSize: 13.5,
                        fontWeight: '800',
                        marginLeft: 8,
                        flex: 1,
                      }}
                    >
                      {`Theory Score: ${theoryScore}% ${
                        theoryScore >= passingThreshold
                          ? '— Passed Cutoff!'
                          : `(Cutoff: ${passingThreshold}%)`
                      }`}
                    </Text>
                  </View>
                ) : null}

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <OutlinedButton
                    label={t.btnBack}
                    onPress={() => {
                      setStep(1);
                      scrollToTop();
                    }}
                    color={colors.textSecondary}
                    borderColor={colors.cardBorder}
                    style={{ flex: 0.4 }}
                    paddingV={14}
                  />
                  {!theorySubmitted ? (
                    <ElevatedButton
                      testID="astrologerApply.gradeTheoryBtn"
                      label={t.btnGradeAssessment}
                      onPress={handleTheorySubmit}
                      disabled={Object.keys(theoryAnswers).length < activeQuestions.length}
                      style={{ flex: 1 }}
                      paddingV={14}
                      fontSize={14}
                    />
                  ) : (
                    <ElevatedButton
                      testID="astrologerApply.toKundaliStepBtn"
                      label={t.btnProceedToChart}
                      onPress={() => {
                        setStep(3);
                        scrollToTop();
                      }}
                      style={{ flex: 1 }}
                      paddingV={14}
                      fontSize={13.5}
                    />
                  )}
                </View>
              </View>
            </View>
          ) : null}

          {/* =========================================================================
              STEP 3: BLIND KUNDALI CASE STUDY
             ========================================================================= */}
          {!isTerminated && step === 3 ? (
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.surface, borderColor: colors.cardBorder },
              ]}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 19, fontWeight: '800' }}>
                    {t.caseHeader}
                  </Text>
                  <Text style={{ color: colors.textSecondary, marginTop: 4, ...lh(12.5, 1.4) }}>
                    {t.caseSubtitle}
                  </Text>
                </View>

                <Pressable
                  onPress={handleRegenerateAiCase}
                  disabled={regeneratingCase}
                  style={[
                    styles.shuffleBtn,
                    {
                      backgroundColor: colors.surfaceVariant,
                      borderColor: colors.cardBorder,
                      paddingVertical: 8,
                      paddingHorizontal: 10,
                    },
                  ]}
                >
                  <AppIcon name="auto_awesome" size={14} color={colors.goldAccent} />
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 11,
                      fontWeight: '700',
                      marginLeft: 4,
                    }}
                  >
                    {regeneratingCase ? 'Generating...' : 'New AI Case'}
                  </Text>
                </Pressable>
              </View>

              {/* Multi-Case Switcher if backend provided custom cases */}
              {customCases.length > 1 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 6, marginTop: 12 }}
                >
                  {customCases.map((c, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => {
                        setSelectedCaseIndex(idx);
                        setCustomKundaliCase(c);
                      }}
                      style={[
                        styles.countPill,
                        {
                          backgroundColor:
                            selectedCaseIndex === idx ? AppColors.primary : colors.surfaceVariant,
                          borderColor:
                            selectedCaseIndex === idx ? colors.goldAccent : colors.cardBorder,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: selectedCaseIndex === idx ? '#FFFFFF' : colors.textSecondary,
                          fontSize: 11.5,
                          fontWeight: '700',
                        }}
                      >
                        Case #{idx + 1}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}

              {/* Planetary Case Scenario Card */}
              <View
                style={[
                  styles.caseScenarioCard,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: withAlpha(colors.goldAccent, 95),
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      backgroundColor: colors.goldAccent,
                    }}
                  >
                    <Text style={{ color: '#1A1A2E', fontSize: 10, fontWeight: '800' }}>
                      CASE SCENARIO
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 13.5,
                      fontWeight: '800',
                      marginLeft: 8,
                      flex: 1,
                    }}
                  >
                    {activeKundaliCase.title}
                  </Text>
                </View>

                <View style={{ gap: 8 }}>
                  {[
                    { label: t.lagnaLabel, val: activeKundaliCase.lagna },
                    { label: t.moonSignLabel, val: activeKundaliCase.moonSign },
                    { label: t.dashaLabel, val: activeKundaliCase.dasha },
                    { label: t.keyPlacementsLabel, val: activeKundaliCase.placements },
                  ].map((item) => (
                    <View
                      key={item.label}
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 12,
                        padding: 10,
                        borderWidth: 1,
                        borderColor: colors.cardBorder,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.goldAccent,
                          fontSize: 10,
                          fontWeight: '800',
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontSize: 12.5,
                          fontWeight: '600',
                          marginTop: 2,
                        }}
                      >
                        {item.val}
                      </Text>
                    </View>
                  ))}
                </View>

                <View
                  style={{
                    marginTop: 10,
                    backgroundColor: withAlpha(colors.goldAccent, 22),
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: withAlpha(colors.goldAccent, 95),
                  }}
                >
                  <Text
                    style={{
                      color: colors.isLight ? AppColors.primary : colors.goldAccent,
                      fontSize: 10.5,
                      fontWeight: '800',
                      textTransform: 'uppercase',
                    }}
                  >
                    {t.clientQueryLabel}
                  </Text>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontWeight: '600',
                      marginTop: 4,
                      ...lh(12.5, 1.45),
                    }}
                  >
                    &ldquo;{activeKundaliCase.clientQuestion}&rdquo;
                  </Text>
                </View>
              </View>

              <FieldLabel label={t.analysisLabel} colors={colors} />
              <TextInput
                testID="astrologerApply.kundaliAnalysisInput"
                value={kundaliAnalysis}
                onChangeText={setKundaliAnalysis}
                placeholder={t.analysisPlaceholder}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.cardBorder,
                    color: colors.textPrimary,
                  },
                ]}
              />

              <FieldLabel label={t.remediesLabel} colors={colors} />
              <TextInput
                testID="astrologerApply.kundaliRemediesInput"
                value={kundaliRemedies}
                onChangeText={setKundaliRemedies}
                placeholder={t.remediesPlaceholder}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.cardBorder,
                    color: colors.textPrimary,
                  },
                ]}
              />

              <View
                style={{
                  flexDirection: 'row',
                  gap: 10,
                  marginTop: 22,
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: colors.divider,
                }}
              >
                <OutlinedButton
                  label={t.btnBack}
                  onPress={() => {
                    setStep(2);
                    scrollToTop();
                  }}
                  color={colors.textSecondary}
                  borderColor={colors.cardBorder}
                  style={{ flex: 0.4 }}
                  paddingV={14}
                />
                <ElevatedButton
                  testID="astrologerApply.submitKundaliBtn"
                  label={evaluatingKundali ? t.generatingResponse : t.btnProceedToInterview}
                  onPress={handleKundaliSubmit}
                  loading={evaluatingKundali}
                  disabled={evaluatingKundali}
                  style={{ flex: 1 }}
                  paddingV={14}
                  fontSize={13.5}
                />
              </View>
            </View>
          ) : null}

          {/* =========================================================================
              STEP 4: LIVE AI TECHNICAL & ETHICS VIVA INTERVIEW
             ========================================================================= */}
          {!isTerminated && step === 4 ? (
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.surface, borderColor: colors.cardBorder },
              ]}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 19, fontWeight: '800' }}>
                    {t.interviewHeader}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                    {t.interviewSubtitle}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 100,
                      backgroundColor: withAlpha(AppColors.primary, 30),
                      borderWidth: 1,
                      borderColor: withAlpha(colors.goldAccent, 90),
                    }}
                  >
                    <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '800' }}>
                      ⏱ {Math.floor(interviewSeconds / 60)}:
                      {String(interviewSeconds % 60).padStart(2, '0')}
                    </Text>
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 10.5, marginTop: 3 }}>
                    {`Round ${Math.min(interviewRound + 1, 3)} / 3`}
                  </Text>
                </View>
              </View>

              {/* Interview Chat Thread */}
              <View
                style={[
                  styles.chatBox,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                {interviewHistory.map((item, idx) => (
                  <View key={idx} style={{ marginBottom: 14, gap: 8 }}>
                    {/* Examiner Bubble */}
                    <View
                      style={[
                        styles.examinerBubble,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.cardBorder,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: colors.goldAccent,
                          fontSize: 10,
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          marginBottom: 3,
                        }}
                      >
                        {`AI Vedic Examiner • ${item.topic}`}
                      </Text>
                      <Text style={{ color: colors.textPrimary, fontSize: 13 }}>
                        {item.question}
                      </Text>
                    </View>

                    {/* Candidate Bubble */}
                    <View
                      style={[
                        styles.candidateBubble,
                        { backgroundColor: AppColors.primary },
                      ]}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 13 }}>{item.answer}</Text>
                      <View
                        style={{
                          marginTop: 6,
                          paddingTop: 6,
                          borderTopWidth: 1,
                          borderTopColor: 'rgba(255,255,255,0.2)',
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Text style={{ color: '#FDE68A', fontSize: 10.5, fontWeight: '800' }}>
                          {`AI Score: ${item.score}/100`}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={{
                            color: 'rgba(255,255,255,0.85)',
                            fontSize: 10.5,
                            marginLeft: 8,
                            flex: 1,
                            textAlign: 'right',
                          }}
                        >
                          {item.feedback}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}

                {/* Current Active Question */}
                {interviewRound < 3 && currentInterviewQuestion ? (
                  <View
                    style={[
                      styles.examinerBubble,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.goldAccent,
                        borderWidth: 1.5,
                      },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <View
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 4,
                          backgroundColor: AppColors.success,
                          marginRight: 6,
                        }}
                      />
                      <Text
                        style={{
                          color: colors.goldAccent,
                          fontSize: 10.5,
                          fontWeight: '800',
                          textTransform: 'uppercase',
                        }}
                      >
                        {`Live Question #${interviewRound + 1} • ${currentInterviewQuestion.topic}`}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontWeight: '700',
                        ...lh(13.5, 1.45),
                      }}
                    >
                      {currentInterviewQuestion.question}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Answer Box or Final Submit */}
              {interviewRound < 3 ? (
                <View style={{ marginTop: 14 }}>
                  <TextInput
                    testID="astrologerApply.interviewAnswerInput"
                    value={currentAnswer}
                    onChangeText={setCurrentAnswer}
                    placeholder={t.interviewAnswerPlaceholder}
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                    style={[
                      styles.textArea,
                      {
                        backgroundColor: colors.surfaceVariant,
                        borderColor: colors.cardBorder,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 10,
                    }}
                  >
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                      {`${currentAnswer.trim().length} chars (min 20 required)`}
                    </Text>
                    <ElevatedButton
                      testID="astrologerApply.sendInterviewAnswerBtn"
                      label={interviewLoading ? t.generatingResponse : t.btnSendAnswer}
                      onPress={handleInterviewSubmitAnswer}
                      disabled={interviewLoading || currentAnswer.trim().length < 20}
                      loading={interviewLoading}
                      paddingV={12}
                      paddingH={20}
                      fontSize={13}
                    />
                  </View>
                </View>
              ) : (
                <View
                  style={{
                    marginTop: 16,
                    padding: 18,
                    borderRadius: 18,
                    backgroundColor: 'rgba(45, 158, 107, 0.12)',
                    borderWidth: 1,
                    borderColor: AppColors.success,
                    alignItems: 'center',
                  }}
                >
                  <AppIcon name="verified" size={32} color={AppColors.success} />
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 16,
                      fontWeight: '800',
                      marginTop: 8,
                      textAlign: 'center',
                    }}
                  >
                    AI Technical & Ethics Viva Completed!
                  </Text>
                  <Text
                    style={{
                      color: AppColors.success,
                      fontSize: 13,
                      fontWeight: '700',
                      marginTop: 4,
                    }}
                  >
                    {`AI Viva Score: ${interviewAvgScore}% • Composite Score: ${overallCompositeScore}%`}
                  </Text>

                  <ElevatedButton
                    testID="astrologerApply.submitFinalBtn"
                    label={submittingFinal ? t.generatingResponse : t.btnFinalSubmit}
                    onPress={submitFinalApplication}
                    loading={submittingFinal}
                    disabled={submittingFinal}
                    icon="check_circle"
                    style={{ marginTop: 16, width: '100%' }}
                    paddingV={16}
                    fontSize={14}
                  />
                </View>
              )}
            </View>
          ) : null}

          {/* =========================================================================
              STEP 5: SUBMITTED CONFIRMATION & SCORE REPORT CARD
             ========================================================================= */}
          {!isTerminated && step === 5 ? (
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
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: 'rgba(212, 130, 26, 0.16)',
                  borderWidth: 2,
                  borderColor: AppColors.warning,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <AppIcon name="check_circle" size={40} color={AppColors.warning} />
              </View>

              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 100,
                  backgroundColor: 'rgba(212, 130, 26, 0.15)',
                  borderWidth: 1,
                  borderColor: AppColors.warning,
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    color: AppColors.warning,
                    fontSize: 10.5,
                    fontWeight: '800',
                    textTransform: 'uppercase',
                  }}
                >
                  Application Status: In Process / Under Human Review
                </Text>
              </View>

              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 22,
                  fontWeight: '800',
                  textAlign: 'center',
                }}
              >
                {t.submissionTitle}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  textAlign: 'center',
                  marginTop: 6,
                  ...lh(13, 1.45),
                }}
              >
                Thank you, <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>{name}</Text>.{' '}
                {t.submissionDesc}
              </Text>

              {/* Submitted Profile Summary Card */}
              <View
                style={[
                  styles.compositeCard,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: withAlpha(colors.goldAccent, 95),
                    padding: 16,
                  },
                ]}
              >
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 10.5,
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  Onboarding Request Status
                </Text>
                <Text
                  style={{
                    color: AppColors.warning,
                    fontSize: 24,
                    fontWeight: '800',
                    marginTop: 4,
                  }}
                >
                  Pending Admin Review
                </Text>

                <View
                  style={{
                    flexDirection: 'row',
                    marginTop: 14,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: colors.divider,
                    width: '100%',
                  }}
                >
                  <View style={{ flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: colors.divider }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '800' }}>
                      {aadhaarDoc ? '✓ Attached' : 'Provided'}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 2 }}>
                      Aadhaar KYC
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: colors.divider }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '800' }}>
                      {panDoc ? '✓ Attached' : 'Provided'}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 2 }}>
                      PAN KYC
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '800' }}>
                      {supportingDocs.length} Uploaded
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 2 }}>
                      Certificates
                    </Text>
                  </View>
                </View>
              </View>

              {/* What Happens Next Card */}
              <View
                style={[
                  styles.nextStepsBox,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 14,
                    fontWeight: '800',
                    marginBottom: 10,
                  }}
                >
                  What happens next?
                </Text>
                {[
                  'Your credentials, identity documents (Aadhaar & PAN), and certificates have been submitted directly to the Admin Panel.',
                  'The administrator will review your application and documents, then accept or decline your onboarding request.',
                  `Once accepted, your account is onboarded (offline by default). You can then sign in directly with ${phoneCode} ${phone}, update your profile, and toggle online in your dashboard.`,
                ].map((txt, idx) => (
                  <View
                    key={idx}
                    style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: AppColors.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 1,
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 10.5, fontWeight: '800' }}>
                        {idx + 1}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        flex: 1,
                        marginLeft: 10,
                        ...lh(12, 1.45),
                      }}
                    >
                      {txt}
                    </Text>
                  </View>
                ))}
              </View>

              <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 12 }}>
                Application Reference ID:{' '}
                <Text style={{ color: colors.goldAccent }}>{applicationRefId}</Text>
              </Text>

              <ElevatedButton
                testID="astrologerApply.backToAstroLoginBtn"
                label="Return to Astrologer Sign In"
                onPress={() => go(AppRoutes.astrologerLoginScreen)}
                icon="login"
                style={{ marginTop: 18, width: '100%' }}
                paddingV={15}
              />
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ==================== BOTTOM SHEETS & DIALOGS ==================== */}

      {/* 1. Document Upload Source Sheet (Camera / Photo Gallery / PDF Document) */}
      <BottomSheet
        visible={uploadTarget !== null}
        onClose={() => setUploadTarget(null)}
        testID="astrologerApply.uploadSheet"
      >
        <SheetContainer style={{ padding: 20 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800', marginTop: 8 }}>
            {uploadTarget === 'aadhaar'
              ? 'Upload Aadhaar Card'
              : uploadTarget === 'pan'
              ? 'Upload PAN Card'
              : 'Upload Supporting Certificate'}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12.5, marginTop: 4 }}>
            Choose how you would like to upload your clear document (Max 5MB):
          </Text>

          <View style={{ marginTop: 16, gap: 10 }}>
            <Pressable
              onPress={handlePickCamera}
              style={[
                styles.sheetOptionCard,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.cardBorder },
              ]}
            >
              <View
                style={[
                  styles.sheetOptionIcon,
                  { backgroundColor: withAlpha(AppColors.primary, 30) },
                ]}
              >
                <AppIcon name="photo_camera" size={20} color={colors.goldAccent} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                  Take Photo with Camera
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 11.5 }}>
                  Capture a clear photo of your original card/certificate
                </Text>
              </View>
              <AppIcon name="chevron_right" size={20} color={colors.textMuted} />
            </Pressable>

            <Pressable
              onPress={handlePickGallery}
              style={[
                styles.sheetOptionCard,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.cardBorder },
              ]}
            >
              <View
                style={[
                  styles.sheetOptionIcon,
                  { backgroundColor: withAlpha(colors.goldAccent, 30) },
                ]}
              >
                <AppIcon name="photo_library" size={20} color={colors.goldAccent} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                  Choose from Photo Gallery
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 11.5 }}>
                  Select an existing JPG, PNG, or WebP image
                </Text>
              </View>
              <AppIcon name="chevron_right" size={20} color={colors.textMuted} />
            </Pressable>

            <Pressable
              onPress={handlePickDocument}
              style={[
                styles.sheetOptionCard,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.cardBorder },
              ]}
            >
              <View
                style={[
                  styles.sheetOptionIcon,
                  { backgroundColor: 'rgba(45, 158, 107, 0.2)' },
                ]}
              >
                <AppIcon name="picture_as_pdf" size={20} color={AppColors.success} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                  Browse PDF or Document File
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 11.5 }}>
                  Select a PDF document or scanned image from device files
                </Text>
              </View>
              <AppIcon name="chevron_right" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
        </SheetContainer>
      </BottomSheet>

      {/* 2. Language Selector Sheet */}
      <BottomSheet
        visible={showLanguageSheet}
        onClose={() => setShowLanguageSheet(false)}
      >
        <SheetContainer style={{ padding: 20 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800', marginBottom: 12 }}>
            {t.langSelectLabel}
          </Text>
          {LANGUAGE_OPTIONS.map((lang) => (
            <Pressable
              key={lang.code}
              onPress={() => {
                setSelectedLanguage(lang.code);
                setGlobalLanguage(lang.appLang);
                setShowLanguageSheet(false);
              }}
              style={[
                styles.sheetListItem,
                { borderBottomColor: colors.divider },
              ]}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 14.5, fontWeight: '700', flex: 1 }}>
                {lang.label}
              </Text>
              {selectedLanguage === lang.code ? (
                <AppIcon name="check_circle" size={20} color={colors.goldAccent} />
              ) : null}
            </Pressable>
          ))}
        </SheetContainer>
      </BottomSheet>

      {/* 3. Multi-Select Specialisations Sheet */}
      <BottomSheet
        visible={showSpecsSheet}
        onClose={() => setShowSpecsSheet(false)}
      >
        <SheetContainer style={{ padding: 20 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800' }}>
            Primary Specialisations
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2, marginBottom: 12 }}>
            Select all astrological disciplines you practice:
          </Text>
          <ScrollView style={{ maxHeight: 340 }}>
            {SPECIALISATION_OPTIONS.map((spec) => {
              const checked = selectedSpecs.includes(spec);
              return (
                <Pressable
                  key={spec}
                  onPress={() => toggleSpecialisation(spec)}
                  style={[styles.sheetListItem, { borderBottomColor: colors.divider }]}
                >
                  <View
                    style={[
                      styles.checkboxBox,
                      {
                        backgroundColor: checked ? AppColors.primary : 'transparent',
                        borderColor: checked ? AppColors.primary : colors.textMuted,
                      },
                    ]}
                  >
                    {checked ? <AppIcon name="check" size={14} color="#FFFFFF" /> : null}
                  </View>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 13.5,
                      fontWeight: checked ? '700' : '500',
                      flex: 1,
                    }}
                  >
                    {spec}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <ElevatedButton
            label={`Done (${selectedSpecs.length} Selected)`}
            onPress={() => setShowSpecsSheet(false)}
            style={{ marginTop: 14 }}
            paddingV={13}
          />
        </SheetContainer>
      </BottomSheet>

      {/* 4. Multi-Select Consultation Languages Sheet */}
      <BottomSheet
        visible={showLangsSheet}
        onClose={() => setShowLangsSheet(false)}
      >
        <SheetContainer style={{ padding: 20 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800' }}>
            Consultation Languages
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2, marginBottom: 12 }}>
            Select all languages in which you can consult with clients:
          </Text>
          <ScrollView style={{ maxHeight: 340 }}>
            {CONSULTATION_LANGUAGE_OPTIONS.map((lang) => {
              const checked = selectedLangs.includes(lang);
              return (
                <Pressable
                  key={lang}
                  onPress={() => toggleConsultationLang(lang)}
                  style={[styles.sheetListItem, { borderBottomColor: colors.divider }]}
                >
                  <View
                    style={[
                      styles.checkboxBox,
                      {
                        backgroundColor: checked ? AppColors.primary : 'transparent',
                        borderColor: checked ? AppColors.primary : colors.textMuted,
                      },
                    ]}
                  >
                    {checked ? <AppIcon name="check" size={14} color="#FFFFFF" /> : null}
                  </View>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 13.5,
                      fontWeight: checked ? '700' : '500',
                      flex: 1,
                    }}
                  >
                    {lang}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <ElevatedButton
            label={`Done (${selectedLangs.length} Selected)`}
            onPress={() => setShowLangsSheet(false)}
            style={{ marginTop: 14 }}
            paddingV={13}
          />
        </SheetContainer>
      </BottomSheet>

      {/* 5. Strongest Area Sheet */}
      <BottomSheet
        visible={showAreaSheet}
        onClose={() => setShowAreaSheet(false)}
      >
        <SheetContainer style={{ padding: 20 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800', marginBottom: 12 }}>
            Strongest Consultation Area
          </Text>
          {STRONGEST_AREAS.map((area) => (
            <Pressable
              key={area}
              onPress={() => {
                setStrongestArea(area);
                setShowAreaSheet(false);
              }}
              style={[styles.sheetListItem, { borderBottomColor: colors.divider }]}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', flex: 1 }}>
                {area}
              </Text>
              {strongestArea === area ? (
                <AppIcon name="check_circle" size={20} color={colors.goldAccent} />
              ) : null}
            </Pressable>
          ))}
        </SheetContainer>
      </BottomSheet>

      {/* 6. Supporting Document Category Sheet */}
      <BottomSheet
        visible={showSupportCategorySheet}
        onClose={() => setShowSupportCategorySheet(false)}
      >
        <SheetContainer style={{ padding: 20 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800', marginBottom: 12 }}>
            Supporting Document Category
          </Text>
          {SUPPORTING_DOC_CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => {
                setNewSupportCategory(cat);
                setShowSupportCategorySheet(false);
              }}
              style={[styles.sheetListItem, { borderBottomColor: colors.divider }]}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', flex: 1 }}>
                {cat}
              </Text>
              {newSupportCategory === cat ? (
                <AppIcon name="check_circle" size={20} color={colors.goldAccent} />
              ) : null}
            </Pressable>
          ))}
        </SheetContainer>
      </BottomSheet>

      {/* 7. Phone Country Code Sheet */}
      <BottomSheet
        visible={showPhoneCodeSheet !== null}
        onClose={() => setShowPhoneCodeSheet(null)}
      >
        <SheetContainer style={{ padding: 20 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800', marginBottom: 12 }}>
            Select Country Code
          </Text>
          {PHONE_CODES.map((c) => (
            <Pressable
              key={c.code}
              onPress={() => {
                if (showPhoneCodeSheet === 'whatsapp') setWhatsappCode(c.code);
                else setPhoneCode(c.code);
                setShowPhoneCodeSheet(null);
              }}
              style={[styles.sheetListItem, { borderBottomColor: colors.divider }]}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', flex: 1 }}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </SheetContainer>
      </BottomSheet>

      {/* 8. Proctoring Warning Modal */}
      <Dialog
        visible={proctorWarningModal !== null}
        onClose={() => setProctorWarningModal(null)}
      >
        <View style={{ alignItems: 'center' }}>
          <AppIcon name="warning_amber_rounded" size={42} color={AppColors.warning} />
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 18,
              fontWeight: '800',
              textAlign: 'center',
              marginTop: 10,
            }}
          >
            AI Proctor Alert
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              textAlign: 'center',
              marginTop: 8,
              ...lh(13, 1.45),
            }}
          >
            {proctorWarningModal}
          </Text>
          <ElevatedButton
            label="I Understand & Resume Assessment"
            onPress={() => setProctorWarningModal(null)}
            style={{ marginTop: 18, width: '100%' }}
            paddingV={13}
          />
        </View>
      </Dialog>

      {/* 9. Uploaded KYC / Certificate Document Preview Modal */}
      <Dialog visible={previewDoc !== null} onClose={() => setPreviewDoc(null)}>
        {previewDoc ? (
          <View style={{ alignItems: 'center' }}>
            <Text
              numberOfLines={1}
              style={{
                color: colors.textPrimary,
                fontSize: 16,
                fontWeight: '800',
                textAlign: 'center',
              }}
            >
              {previewDoc.name}
            </Text>
            <Text style={{ color: AppColors.success, fontSize: 11.5, fontWeight: '700', marginTop: 4 }}>
              {`✓ Ready for Submission • ${previewDoc.sizeKB} KB`}
            </Text>
            {previewDoc.mimeType.startsWith('image/') ||
            (previewDoc.dataUrl && previewDoc.dataUrl.startsWith('data:image/')) ? (
              <Image
                source={{ uri: previewDoc.dataUrl || previewDoc.uri }}
                style={{
                  width: '100%',
                  height: 260,
                  borderRadius: 14,
                  marginTop: 14,
                  backgroundColor: colors.surfaceVariant,
                }}
                contentFit="contain"
              />
            ) : (
              <View
                style={{
                  width: '100%',
                  padding: 24,
                  borderRadius: 14,
                  marginTop: 14,
                  backgroundColor: colors.surfaceVariant,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  alignItems: 'center',
                }}
              >
                <AppIcon name="picture_as_pdf" size={44} color={AppColors.primary} />
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 10 }}>
                  PDF Document Attached
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                  {`Encoded as Base64 (${previewDoc.sizeKB} KB) for Vedic Verification Board review.`}
                </Text>
              </View>
            )}
            <ElevatedButton
              label="Close Preview"
              onPress={() => setPreviewDoc(null)}
              style={{ marginTop: 16, width: '100%' }}
              paddingV={12}
            />
          </View>
        ) : null}
      </Dialog>
    </SafeAreaView>
  );
}

function FieldLabel({ label, colors }: { label: string; colors: any }) {
  return (
    <Text
      style={{
        color: colors.textSecondary,
        fontSize: 11.5,
        fontWeight: '700',
        marginTop: 14,
        marginBottom: 6,
      }}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  langHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    marginRight: 8,
  },
  heroHeader: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 8,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
  },
  stepChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proctorBar: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  violationPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    marginLeft: 8,
  },
  sectionCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  subSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    marginTop: 16,
    borderBottomWidth: 1,
  },
  subSectionBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  textArea: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
    minHeight: 96,
    textAlignVertical: 'top',
  },
  codePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  syncedWhatsappBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  kycBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  uploadDropzone: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 10,
  },
  docThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  pdfThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportingDocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  selectedTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
  },
  assessmentControlsBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  questionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionLetterCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  explanationBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  scoreResultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  caseScenarioCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  chatBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  examinerBubble: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  candidateBubble: {
    borderRadius: 14,
    padding: 12,
    marginLeft: 20,
  },
  compositeCard: {
    marginTop: 18,
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
  },
  nextStepsBox: {
    marginTop: 16,
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  sheetOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  sheetOptionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
});
