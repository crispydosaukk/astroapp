/**
 * Master Dynamic CMS Configuration for 100% of AstroParihar Mobile App Screens (All 45 Screens + Bottom Tab Bar).
 * Stored in Firestore: collection `app_dynamic_content`, doc `all_screens_cms`.
 * Deep-merged with defaults so every single alphabet across the entire app is Admin-editable with zero missing keys.
 */

export const ALL_SCREENS_CMS_DOC_ID = 'all_screens_cms';

export interface AppScreensCmsConfig {
  updatedAt?: string;

  navigation: {
    tabs: Array<{
      route: string;
      label: string;
      icon: string;
      activeIcon: string;
    }>;
  };

  splash: {
    wheelImageUrl: string;
    emblemImageUrl: string;
    textLogoImageUrl: string;
    durationMs: number;
    tagline: string;
    wheelAlt: string;
    emblemAlt: string;
    logoAlt: string;
  };

  onboarding: {
    continueButton: string;
    getStartedButton: string;
    alreadyHaveAccountText: string;
    signInLinkText: string;
  };

  signIn: {
    logoImageUrl: string;
    title: string;
    subtitle: string;
    phonePlaceholder: string;
    countrySearchPlaceholder: string;
    sendOtpLabel: string;
    sendingOtpLabel: string;
    guestButtonLabel: string;
    guestToast: string;
    astrologerDividerTitle: string;
    astrologerLoginButton: string;
    notRegisteredPrompt: string;
    applyLinkLabel: string;
    consentPrefix: string;
    termsLabel: string;
    consentAnd: string;
    privacyLabel: string;
    verifyTitle: string;
    codeSentPrefix: string;
    editLabel: string;
    otpPlaceholder: string;
    resendCountdownPrefix: string;
    didNotReceiveText: string;
    resendOtpLabel: string;
    verifyButtonLabel: string;
    verifyingLabel: string;
    useDifferentNumberLabel: string;
    invalidPhoneToast: string;
    deletedAccountToast: string;
    otpSentToast: string;
    otpInvalidToast: string;
    verifiedNewUserToast: string;
    welcomeBackPrefix: string;
    countryCodes: Array<{ code: string; country: string; flag: string }>;
  };

  birthProfileSetup: {
    headerTitle: string;
    stepSubtitleTemplate: string;
    step1Title: string;
    step1Subtitle: string;
    profileTypes: Array<{ label: string; icon: string; emoji: string }>;
    step2Title: string;
    step2Subtitle: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    genderLabel: string;
    genderOptions: Array<{ label: string; icon: string }>;
    dobLabel: string;
    dobPlaceholder: string;
    timeLabel: string;
    timePlaceholder: string;
    accuracyTip: string;
    step3Title: string;
    step3Subtitle: string;
    birthPlaceLabel: string;
    birthPlacePlaceholder: string;
    backButton: string;
    continueButton: string;
    completeButton: string;
    savingLabel: string;
    successToast: string;
    validationMessages: {
      selectProfileType: string;
      enterName: string;
      selectGender: string;
      selectDob: string;
      selectTime: string;
      enterBirthPlace: string;
    };
  };

  home: {
    greetings: { morning: string; afternoon: string; evening: string };
    guestName: string;
    defaultCity: string;
    locationAlertTitle: string;
    locationAlertSourceNote: string;
    locationAlertCancel: string;
    locationAlertRefresh: string;
    languageModal: {
      title: string;
      subtitle: string;
      footerNote: string;
      languages: Array<{
        code: string;
        nativeName: string;
        englishLabel: string;
        greetingSample: string;
        flagEmoji: string;
      }>;
    };
    quickActionsHeader: string;
    quickActionsBadge: string;
    quickActions: Array<{
      id: string;
      emoji: string;
      label: string;
      route: string;
      color: string;
      badge?: string;
    }>;
    remediesTitle: string;
    remediesSubtitle: string;
    remediesViewAll: string;
    horoscopeTitle: string;
    horoscopeAiBadge: string;
    horoscopeTransitSuffix: string;
    horoscopeDefaultSign: string;
    horoscopeAskAiTemplate: string;
    horoscopeViewFullButton: string;
    horoscopeDefaultCategories: Array<{
      key: string;
      emoji: string;
      label: string;
      score: number;
      color: string;
      insight: string;
      tip: string;
    }>;
    aiPrompt: {
      title: string;
      badge: string;
      subtitle: string;
      questionPrompt: string;
      inputPlaceholder: string;
      quickPills: string[];
      ctaButton: string;
    };
    recommendedTitle: string;
    recommendedAiTitlePrefix: string;
    recommendedAiSubtitleSuffix: string;
    recommendedAiTag: string;
    recommendedRealTitlePrefix: string;
    recommendedRealOnlineTag: string;
    recommendedRealVerifiedTag: string;
    recommendedStaticCards: Array<{
      emoji: string;
      title: string;
      subtitle: string;
      tag: string;
      tagColor: string;
      route: string;
    }>;
    realAstrologers: {
      title: string;
      onlineSuffix: string;
      subtitle: string;
      viewAllLabel: string;
      connectingTitle: string;
      connectingSubtitle: string;
      verifiedBadge: string;
      consultButton: string;
    };
    aiAstrologers: {
      title: string;
      instantBadge: string;
      subtitle: string;
      viewAllLabel: string;
      replySpeedBadge: string;
      chatButton: string;
    };
    promotions: {
      title: string;
      emoji: string;
      viewAllLabel: string;
    };
    stickyCtas: {
      chatAiLabel: string;
      callHumanLabel: string;
    };
  };

  services: {
    headerTitle: string;
    heading: string;
    subtitle: string;
    searchPlaceholder: string;
    searchFoundTemplate: string;
    searchEmptyTitle: string;
    searchEmptySubtitle: string;
    fallbackTabLabel: string;
  };

  liveAstrologers: {
    realHeaderTitle: string;
    realHeaderSubtitle: string;
    aiHeaderTitle: string;
    aiHeaderSubtitle: string;
    onlineSuffix: string;
    realSearchPlaceholder: string;
    aiSearchPlaceholder: string;
    realTabLabel: string;
    aiTabLabel: string;
    categories: Array<{ label: string; emoji: string }>;
    cardOfflineBadge: string;
    cardViewProfile: string;
    cardChatAi: string;
    cardVoiceAi: string;
    cardChat: string;
    cardCall: string;
    loadingTitle: string;
    loadingSubtitle: string;
    emptyTitle: string;
    emptySubtitle: string;
    clearFiltersLabel: string;
    filterSheet: {
      title: string;
      subtitle: string;
      onlineTitle: string;
      onlineSubtitle: string;
      sortByLabel: string;
      sortOptions: string[];
      priceRangeLabel: string;
      priceOptionsInr: string[];
      priceOptionsUsd: string[];
      genderLabel: string;
      genderOptions: string[];
      languageLabel: string;
      languageOptions: string[];
      resetLabel: string;
      applyLabel: string;
    };
  };

  astrologerDetail: {
    onlineBadge: string;
    offlineBadge: string;
    onlineChip: string;
    offlineChip: string;
    statLabels: { rating: string; reviews: string; sessions: string; rate: string };
    specialisationsTitle: string;
    tabs: { about: string; reviewsPrefix: string; availability: string };
    aboutTitlePrefix: string;
    noBioText: string;
    expertiseTitle: string;
    educationTitle: string;
    educationLabels: { education: string; certification: string; learningSource: string };
    reviewsSuffix: string;
    emptyReviewsTemplate: string;
    liveStatusTitle: string;
    availabilityLabels: {
      current: string;
      onlineText: string;
      offlineText: string;
      dailyHours: string;
      location: string;
      languages: string;
    };
    ratesTitle: string;
    voiceCallBtn: string;
    videoCallBtn: string;
    startLivePrefix: string;
    offlineBtnSuffix: string;
    sheet: {
      title: string;
      withPrefix: string;
      modeHeading: string;
      videoTitle: string;
      videoSub: string;
      voiceTitle: string;
      voiceSub: string;
      durationHeading: string;
      extendableText: string;
      minLabel: string;
      walletLabel: string;
      sufficientTemplate: string;
      lowBalanceTitle: string;
      lowBalanceTemplate: string;
      quickRechargePrefix: string;
      processingRechargeLabel: string;
      offlineNotice: string;
      signInToConsultLabel: string;
      startCallPrefix: string;
      goToWalletLabel: string;
    };
  };

  horoscope: {
    headerTitle: string;
    defaultSubtitle: string;
    personalisedPrefix: string;
    defaultBadge: string;
    zodiacs: Array<{ sign: string; symbol: string; emoji: string; dates: string; element: string }>;
    dateTabs: { yesterday: string; today: string; tomorrow: string };
    overallScoreLabel: string;
    dailyGuidanceTitle: string;
    categories: Array<{ key: string; label: string; emoji: string; color: string }>;
    luckyDetailsTitle: string;
    luckyLabels: { number: string; color: string; day: string };
    cta: {
      title: string;
      subtitle: string;
      askAiButton: string;
      talkAstrologerButton: string;
    };
  };

  panchang: {
    headerTitle: string;
    defaultLocation: string;
    dateLabels: { today: string; yesterday: string; tomorrow: string };
    vikramSamvatPrefix: string;
    vikramSamvatOverrideYear: string;
    calendarSubtitle: string;
    timezoneLabel: string;
    sections: {
      detailsTitle: string;
      sunMoonTitle: string;
      timesTitle: string;
      choghadiyaTitle: string;
      choghadiyaSubtitle: string;
    };
    cardLabels: {
      tithi: string;
      nakshatra: string;
      yoga: string;
      karana: string;
      sunrise: string;
      sunset: string;
      moonrise: string;
      moonset: string;
      rahuKaal: string;
      yamaganda: string;
      gulikaKaal: string;
      abhijitMuhurat: string;
    };
    badges: { auspicious: string; avoid: string };
    buttons: {
      generateReport: string;
      generating: string;
      signInToGenerate: string;
      sharePanchang: string;
    };
    signInToast: string;
  };

  myKundli: {
    headerTitle: string;
    verifiedBadge: string;
    guestLabel: string;
    defaultDevoteeLabel: string;
    signInToViewLabel: string;
    notSpecifiedLabel: string;
    aiCardTitle: string;
    aiCardPromptTemplate: string;
    aiCardButton: string;
    sections: Array<{ title: string; icon: string }>;
    birthFieldLabels: {
      name: string;
      dob: string;
      tob: string;
      pob: string;
      lagna: string;
      moonSign: string;
      nakshatra: string;
      padaLabel: string;
    };
    lagnaLabels: {
      lagna: string;
      lagnaLord: string;
      lordDescSuffix: string;
      ascendantDescTemplate: string;
      rashiLabel: string;
      nakshatraLabel: string;
      rashiDescTemplate: string;
    };
    houseSummaryItems: Array<{ houseNumber: number; label: string; rules: string }>;
    dashaLabels: {
      mahadasha: string;
      antardasha: string;
      activeBadge: string;
      majorDesc: string;
      subDesc: string;
      summaryTemplate: string;
    };
    currentTransits: Array<{ planet: string; sign: string; house: string; effect: string }>;
    doshaLabels: {
      mangal: string;
      kaalSarp: string;
      sadeSati: string;
      present: string;
      notPresent: string;
      monitored: string;
      clear: string;
      mangalPresentDesc: string;
      mangalClearDesc: string;
      kaalSarpPresentDesc: string;
      kaalSarpClearDesc: string;
      sadeSatiDefaultDesc: string;
      beneficBadge: string;
      activeBadge: string;
    };
    defaultYogas: Array<{ name: string; description: string; benefic: boolean }>;
    planetInterpretations: Record<string, string>;
    houseInfo: Record<string, { name: string; rules: string; desc: string }>;
    genericPredictions: Record<string, string>;
    planetSheetAskAi: string;
    houseSheetClose: string;
    signInExportToast: string;
  };

  matchKundli: {
    headerTitleForm: string;
    headerTitleResults: string;
    heroEmoji: string;
    heroTitle: string;
    heroSubtitle: string;
    p1DefaultTitle: string;
    p1YouSuffix: string;
    p2Title: string;
    autoFetchedBadge: string;
    fullNameLabel: string;
    dobLabel: string;
    tobLabel: string;
    birthPlaceLabel: string;
    birthPlacePlaceholder: string;
    calculatingLabel: string;
    calculateButton: string;
    compatibilityLabel: string;
    scoreHeading: string;
    verdicts: {
      excellent: string;
      good: string;
      remedies: string;
      defaultDesc: string;
    };
    gunaMilanHeading: string;
    areasHeading: string;
    generateReportBtn: string;
    generatingReportBtn: string;
    askAiBtn: string;
    validationToast: string;
    signInReportToast: string;
  };

  remedies: {
    headerTitle: string;
    topBadgeDefault: string;
    topPersonalisedPrefix: string;
    topTitle: string;
    exploreButton: string;
    wheelTitle: string;
    wheelSubtitle: string;
    wheelTapHint: string;
    allRemediesTitle: string;
    principlesTitle: string;
    principlesSubtitle: string;
    principlesCards: Array<{
      emoji: string;
      title: string;
      accentColor: string;
      body: string;
      bullets: Array<{ boldPrefix: string; text: string }>;
    }>;
    customCtaTitle: string;
    customCtaSubtitle: string;
    customCtaButton: string;
    detailHeaders: {
      whyHelp: string;
      coreBenefits: string;
      howItWorks: string;
      suitableFor: string;
      liveMantras: string;
      navagrahaMantras: string;
      yantras: string;
      liveHomams: string;
      classicalHomams: string;
      ishtaDeities: string;
      gemstones: string;
      gemstoneWarning: string;
      rudraksha: string;
      vastu: string;
      prescribedParihar: string;
      charity: string;
      mandalaDefaultTitle: string;
      askAiButton: string;
      consultAstrologerButton: string;
    };
  };

  aiChat: {
    aiModels: Array<{ id: string; name: string; icon: string; desc: string }>;
    languages: Array<{ code: string; label: string; full: string }>;
    quickPromptsByLang: Record<string, string[]>;
    placeholdersByLang: Record<string, string>;
    authPlaceholderByLang: Record<string, string>;
    welcomeTemplatesByLang: Record<string, string>;
    subtitleByLang: Record<string, string>;
    balanceLabelByLang: Record<string, string>;
    freePromptsSuffixByLang: Record<string, string>;
    promptCostSuffixByLang: Record<string, string>;
    rechargeLabelByLang: Record<string, string>;
    audioLabelByLang: Record<string, { listen: string; stop: string }>;
    typingTipByLang: Record<string, string>;
    structuredCardStringsByLang: Record<
      string,
      {
        activeDasha: string;
        hideEvidence: string;
        viewEvidence: string;
        recommendedHomam: string;
        mantra: string;
      }
    >;
    uiLabels: {
      clearChatTitle: string;
      clearChatMessage: string;
      cancelLabel: string;
      clearLabel: string;
      signInModalTitle: string;
      signInModalSubtitle: string;
      signInModalButton: string;
      rechargeModalTitle: string;
      rechargeModalSubtitle: string;
      rechargeModalButton: string;
      selectModelTitle: string;
      selectLanguageTitle: string;
    };
    clarification: {
      shortLetterByLang: Record<string, string>;
      voiceToTextByLang: Record<string, string>;
      gibberishByLang: Record<string, string>;
      unrelatedByLang: Record<string, string>;
    };
  };

  consultation: {
    connectingAiText: string;
    callingAstrologerText: string;
    tabs: { stream: string; chart: string };
    defaultReplies: string[];
    controlLabels: {
      mute: string;
      unmute: string;
      speaker: string;
      video: string;
      chat: string;
      language: string;
      endCall: string;
      holdToSpeak: string;
      listening: string;
      send: string;
      close: string;
    };
    uiLabels: {
      liveBadge: string;
      balanceLabel: string;
      voiceInputTitle: string;
      voiceInputPlaceholder: string;
      endCallTitle: string;
      endCallSubtitle: string;
      endCallConfirm: string;
      endCallCancel: string;
      lowBalanceTitle: string;
      lowBalanceSubtitle: string;
      lowBalanceRechargeBtn: string;
      reviewTitle: string;
      reviewSubtitle: string;
      reviewTags: string[];
      reviewCommentPlaceholder: string;
      reviewSubmitBtn: string;
      reviewSkipBtn: string;
      listenLabel: string;
      stopLabel: string;
    };
  };

  birthProfiles: {
    headerTitle: string;
    infoBanner: string;
    emptyText: string;
    activeBadge: string;
    popularCities: string[];
    fieldLabels: {
      dob: string;
      time: string;
      place: string;
      rashi: string;
      nakshatra: string;
      viewKundli: string;
      addProfileBtn: string;
    };
    menuLabels: {
      setActive: string;
      edit: string;
      delete: string;
    };
    sheet: {
      addTitle: string;
      editTitle: string;
      subtitle: string;
      relationshipLabel: string;
      fullNameLabel: string;
      fullNamePlaceholder: string;
      dobLabel: string;
      dobPlaceholder: string;
      timeLabel: string;
      timePlaceholder: string;
      placeLabel: string;
      placePlaceholder: string;
      savingLabel: string;
      saveBtn: string;
      updateBtn: string;
    };
  };

  kundliReports: {
    headerTitle: string;
    tabs: { myReports: string; mahadashaGuides: string; purchasedGuides: string };
    walletBalancePrefix: string;
    addMoneyLabel: string;
    signInReportsTitle: string;
    signInReportsSubtitle: string;
    signInButton: string;
    syncingReportsText: string;
    emptyReportsTitle: string;
    emptyReportsSubtitle: string;
    exploreServicesBtn: string;
    latestReportBadge: string;
    readyBadge: string;
    viewReportBtn: string;
    shareBtn: string;
    unlockedBadge: string;
    lifetimeAccessBadge: string;
    pdfGuideLabel: string;
    purchasedLabel: string;
    readGuideBtn: string;
    pdfBtn: string;
    downloadPdfBtn: string;
    readInAppBtn: string;
    unlockPrefix: string;
    processingLabel: string;
    signInPurchasedTitle: string;
    emptyPurchasedTitle: string;
    emptyPurchasedSubtitle: string;
    exploreGuidesBtn: string;
    purchaseModal: {
      badge: string;
      priceLabel: string;
      balanceLabel: string;
      afterBalanceLabel: string;
      features: string[];
      confirmPrefix: string;
      unlockingLabel: string;
      cancelLabel: string;
      insufficientPrefix: string;
      rechargeBtn: string;
    };
    reportViewer: {
      verifiedLabel: string;
      generatedOnPrefix: string;
      sharePdfBtn: string;
      summaryHeading: string;
      analysisHeading: string;
      remediesHeading: string;
      closeBtn: string;
    };
    reader: {
      chapterPrefix: string;
      ofLabel: string;
      chShort: string;
      mantraHeading: string;
      meaningPrefix: string;
      instructionsPrefix: string;
      prevPrefix: string;
      nextPrefix: string;
      finishBtn: string;
    };
  };

  matchReports: {
    headerTitle: string;
    newMatchButton: string;
    heroTitle: string;
    heroSubtitle: string;
    signInTitle: string;
    signInSubtitle: string;
    signInButton: string;
    loadingText: string;
    emptyTitle: string;
    emptySubtitle: string;
    emptyButton: string;
    statusLabels: { excellent: string; good: string; remedies: string };
    viewGunaBtn: string;
    shareDownloadBtn: string;
    sheet: {
      totalMatchPrefix: string;
      breakdownHeading: string;
      remediesHeading: string;
      defaultRemedies: string[];
      closeBtn: string;
      exportPdfBtn: string;
    };
  };

  savedAstrologers: {
    headerTitle: string;
    findMoreLabel: string;
    loadingText: string;
    chipSaved: string;
    chipOnline: string;
    emptyTitle: string;
    emptySubtitle: string;
    emptyButton: string;
    recommendedHeading: string;
    chatButton: string;
    callButton: string;
    removedToastTemplate: string;
    savedToastTemplate: string;
  };

  consultationHistory: {
    headerTitle: string;
    tabs: { allSessions: string; analytics: string };
    summaryLabels: { sessions: string; talkTime: string; totalSpent: string };
    syncingText: string;
    signInTitle: string;
    signInSubtitle: string;
    signInButton: string;
    emptyTitle: string;
    emptySubtitle: string;
    talkAstrologerBtn: string;
    tryAiBtn: string;
    topicPrefix: string;
    freeLabel: string;
    viewReportBtn: string;
    consultAiBtn: string;
    bookAgainBtn: string;
    analytics: {
      modesTitle: string;
      inquiriesTitle: string;
      modeLabels: { chat: string; voice: string; video: string; aiChat: string };
      inquiryLabels: string[];
    };
    reportModal: {
      title: string;
      verifiedBadge: string;
      summaryHeading: string;
      diagnosisHeading: string;
      remediesHeading: string;
      openReportsBtn: string;
      sharePdfBtn: string;
    };
  };

  wallet: {
    headerTitle: string;
    tabs: { wallet: string; transactions: string };
    inrPillLabel: string;
    usdPillLabel: string;
    availableBalanceLabel: string;
    statLabels: { totalAdded: string; totalSpent: string; bonusEarned: string };
    addMoneyHeading: string;
    addButtonTemplate: string;
    processingLabel: string;
    paymentMethodsHeading: string;
    paymentMethodsInr: Array<{ emoji: string; title: string; subtitle: string; method: string }>;
    paymentMethodsUsd: Array<{ emoji: string; title: string; subtitle: string; method: string }>;
    couponCard: {
      enabled: boolean;
      emoji: string;
      title: string;
      subtitle: string;
      code: string;
      buttonLabel: string;
      bonusInr: number;
      appliedToastTemplate: string;
    };
    recentTransactionsHeading: string;
    emptyTxTitle: string;
    emptyTxAuthSubtitle: string;
    emptyTxGuestSubtitle: string;
    creditedLabel: string;
    debitedLabel: string;
    checkoutSheet: {
      inrGatewayLabel: string;
      usdGatewayLabel: string;
      sslBadge: string;
      methodsInr: Array<{ label: string; method: string }>;
      methodsUsd: Array<{ label: string; method: string }>;
    };
  };

  astrologerLogin: {
    appBarTitle: string;
    step1Kicker: string;
    step1Title: string;
    step1Subtitle: string;
    step2Kicker: string;
    step2Title: string;
    step2SubtitlePrefix: string;
    mobileLabel: string;
    mobilePlaceholder: string;
    adminSupportEmail: string;
    countryCodes: Array<{ code: string; country: string; flag: string }>;
    portalLanguages: Array<{ code: string; label: string }>;
    sendOtpBtn: string;
    sendingOtpBtn: string;
    notOnboardedPrompt: string;
    applyButton: string;
    resendPrefix: string;
    resendBtn: string;
    verifyBtn: string;
    verifyingBtn: string;
    editMobileBtn: string;
    banners: {
      notRegisteredTitle: string;
      applyNowBtn: string;
      contactAdminBtn: string;
      pendingTitle: string;
      pendingNote: string;
      suspendedTitle: string;
      deactivatedTitle: string;
      rejectedTitle: string;
      rejectedNote: string;
      contactAdminSupportBtn: string;
    };
    successDialog: {
      namastePrefix: string;
      namasteSuffix: string;
      subtitle: string;
    };
    languageSheetTitle: string;
  };

  astrologerApply: {
    appBarTitle: string;
    heroSubtitle: string;
    phoneCodes: Array<{ code: string; label: string }>;
    strongestAreas: string[];
    specialisations: string[];
    consultationLanguages: string[];
    supportingDocCategories: string[];
    proctorBannerText: string;
    proctorDisqualifiedTitle: string;
    proctorDisqualifiedMessage: string;
    submitButtonLabel: string;
    languageSheetTitle: string;
  };

  astrologerDashboard: {
    headerTitle: string;
    mainTabs: { overview: string; consultations: string; earnings: string; profile: string };
    consultSubTabs: { requests: string; active: string; history: string };
    primarySkillOptions: string[];
    onlineLabel: string;
    offlineLabel: string;
    directoryVisibleLabel: string;
    directoryHiddenLabel: string;
    probationBannerTitle: string;
    fullTimeBannerTitle: string;
    withdrawButtonLabel: string;
    saveProfileButtonLabel: string;
    savingProfileLabel: string;
    logoutModalTitle: string;
    logoutModalMessage: string;
    logoutConfirmBtn: string;
    logoutCancelBtn: string;
    blockedSuspendedTitle: string;
    blockedDeactivatedTitle: string;
    blockedReturnLoginBtn: string;
    blockedContactSupportBtn: string;
  };

  cmsMicroLabels: {
    notificationsInbox: {
      allTab: string;
      unreadTab: string;
      readAllBtn: string;
      clearBtn: string;
      clearAllBtn: string;
      clearDialogTitle: string;
      clearDialogMessage: string;
      cancelBtn: string;
      confirmClearBtn: string;
      syncingText: string;
      tapToViewText: string;
      settingsBtnLabel: string;
      enableBtnLabel: string;
    };
    notificationSettings: {
      settingsBtnLabel: string;
      allowBtnLabel: string;
      sendingTestLabel: string;
    };
    preferences: {
      languages: Array<{ name: string; native: string; flag: string }>;
      accents: Array<{ name: string; displayName: string; color: string }>;
    };
    helpCentre: {
      faqsSuffix: string;
      showAllLabel: string;
    };
    contactSupport: {
      submittingLabel: string;
      validationToast: string;
    };
    muhurat: {
      tithiLabel: string;
      nakshatraLabel: string;
      yogaLabel: string;
      karanaLabel: string;
      varaLabel: string;
      loadingText: string;
      todayPrefix: string;
      calculatingText: string;
    };
  };
}

export const DEFAULT_APP_SCREENS_CMS: AppScreensCmsConfig = {
  navigation: {
    tabs: [
      { route: 'home-dashboard-screen', label: 'Home', icon: 'home_outlined', activeIcon: 'home_rounded' },
      { route: 'ai-chat-screen', label: 'AI Astro', icon: 'auto_awesome_outlined', activeIcon: 'auto_awesome' },
      { route: 'live-astrologers-screen', label: 'Astrologers', icon: 'people_outline', activeIcon: 'people_rounded' },
      { route: 'services-screen', label: 'Services', icon: 'grid_view_outlined', activeIcon: 'grid_view_rounded' },
      { route: 'profile-screen', label: 'Profile', icon: 'person_outline_rounded', activeIcon: 'person_rounded' },
    ],
  },

  splash: {
    wheelImageUrl: '',
    emblemImageUrl: '',
    textLogoImageUrl: '',
    durationMs: 3100,
    tagline: '',
    wheelAlt: 'Ashta Parihar 8 Remedies Wheel',
    emblemAlt: 'AstroParihar Center Sacred Emblem',
    logoAlt: 'AstroParihar Text Logo',
  },

  onboarding: {
    continueButton: 'Continue',
    getStartedButton: 'Get Started',
    alreadyHaveAccountText: 'Already have an account?',
    signInLinkText: 'Sign In',
  },

  signIn: {
    logoImageUrl: '',
    title: 'Sign In or Register',
    subtitle: 'Enter your mobile number to receive a secure SMS verification code.',
    phonePlaceholder: 'Enter mobile number',
    countrySearchPlaceholder: 'Search country or code...',
    sendOtpLabel: 'Get Verification Code',
    sendingOtpLabel: 'Sending Code...',
    guestButtonLabel: 'Continue as Guest →',
    guestToast: 'Exploring AstroParihar as Guest',
    astrologerDividerTitle: 'Astrologer Partner Portal',
    astrologerLoginButton: 'Astrologer Sign In',
    notRegisteredPrompt: 'Not a registered astrologer yet?',
    applyLinkLabel: 'Apply to Join Panel →',
    consentPrefix: "By continuing, you agree to AstroParihar's",
    termsLabel: 'Terms of Service',
    consentAnd: 'and',
    privacyLabel: 'Privacy Policy',
    verifyTitle: 'Verify Code',
    codeSentPrefix: 'Code sent to',
    editLabel: 'Edit',
    otpPlaceholder: '• • • •',
    resendCountdownPrefix: 'Resend in',
    didNotReceiveText: "Didn't receive code?",
    resendOtpLabel: 'Resend OTP',
    verifyButtonLabel: 'Verify & Continue',
    verifyingLabel: 'Verifying...',
    useDifferentNumberLabel: 'Use different phone number',
    invalidPhoneToast: 'Please enter a valid mobile number',
    deletedAccountToast: 'This number account is already deleted. Please try with another number.',
    otpSentToast: 'OTP sent successfully to your mobile!',
    otpInvalidToast: 'Invalid OTP code. Try again.',
    verifiedNewUserToast: 'Mobile verified! Set up your cosmic birth profile.',
    welcomeBackPrefix: 'Welcome back,',
    countryCodes: [
      { code: '+91', country: 'India', flag: '🇮🇳' },
      { code: '+1', country: 'USA / Canada', flag: '🇺🇸' },
      { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
      { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
      { code: '+61', country: 'Australia', flag: '🇦🇺' },
      { code: '+65', country: 'Singapore', flag: '🇸🇬' },
      { code: '+977', country: 'Nepal', flag: '🇳🇵' },
      { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
      { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
      { code: '+974', country: 'Qatar', flag: '🇶🇦' },
      { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
      { code: '+968', country: 'Oman', flag: '🇴🇲' },
      { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
      { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
      { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
      { code: '+49', country: 'Germany', flag: '🇩🇪' },
      { code: '+33', country: 'France', flag: '🇫🇷' },
      { code: '+39', country: 'Italy', flag: '🇮🇹' },
      { code: '+34', country: 'Spain', flag: '🇪🇸' },
      { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
      { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
      { code: '+46', country: 'Sweden', flag: '🇸🇪' },
      { code: '+47', country: 'Norway', flag: '🇳🇴' },
      { code: '+45', country: 'Denmark', flag: '🇩🇰' },
      { code: '+353', country: 'Ireland', flag: '🇮🇪' },
      { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
      { code: '+27', country: 'South Africa', flag: '🇿🇦' },
      { code: '+81', country: 'Japan', flag: '🇯🇵' },
      { code: '+82', country: 'South Korea', flag: '🇰🇷' },
      { code: '+852', country: 'Hong Kong', flag: '🇭🇰' },
      { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
      { code: '+66', country: 'Thailand', flag: '🇹🇭' },
      { code: '+63', country: 'Philippines', flag: '🇵🇭' },
      { code: '+230', country: 'Mauritius', flag: '🇲🇺' },
      { code: '+254', country: 'Kenya', flag: '🇰🇪' },
      { code: '+55', country: 'Brazil', flag: '🇧🇷' },
      { code: '+52', country: 'Mexico', flag: '🇲🇽' },
      { code: '+20', country: 'Egypt', flag: '🇪🇬' },
      { code: '+90', country: 'Turkey', flag: '🇹🇷' },
      { code: '+30', country: 'Greece', flag: '🇬🇷' },
      { code: '+351', country: 'Portugal', flag: '🇵🇹' },
      { code: '+43', country: 'Austria', flag: '🇦🇹' },
      { code: '+32', country: 'Belgium', flag: '🇧🇪' },
      { code: '+48', country: 'Poland', flag: '🇵🇱' },
      { code: '+7', country: 'Russia / Kazakhstan', flag: '🇷🇺' },
    ],
  },

  birthProfileSetup: {
    headerTitle: 'Birth Profile',
    stepSubtitleTemplate: 'Step {step} of 3 • Mandatory',
    step1Title: 'Who is this\nprofile for?',
    step1Subtitle: 'Create profiles for yourself and your loved ones.',
    profileTypes: [
      { label: 'Myself', icon: 'person_rounded', emoji: '🧘' },
      { label: 'Partner', icon: 'favorite_rounded', emoji: '❤️' },
      { label: 'Child', icon: 'child_care_rounded', emoji: '👶' },
      { label: 'Family', icon: 'family_restroom_rounded', emoji: '👨‍👩‍👧' },
      { label: 'Other', icon: 'people_alt_rounded', emoji: '✨' },
    ],
    step2Title: 'Your Birth\nDetails',
    step2Subtitle: 'Accurate details help us generate your precise Kundli.',
    fullNameLabel: 'Full Name',
    fullNamePlaceholder: 'Enter your full name',
    genderLabel: 'Gender',
    genderOptions: [
      { label: 'Male', icon: 'male' },
      { label: 'Female', icon: 'female' },
      { label: 'Other', icon: 'transgender' },
    ],
    dobLabel: 'Date of Birth',
    dobPlaceholder: 'Select date of birth',
    timeLabel: 'Birth Time',
    timePlaceholder: 'Select birth time',
    accuracyTip: 'Accurate birth time helps us provide more personalised insights.',
    step3Title: 'Your Birth\nPlace',
    step3Subtitle: 'Enter the city and country where you were born.',
    birthPlaceLabel: 'Birth Place (City, State, Country)',
    birthPlacePlaceholder: 'Enter birth place (e.g. Mumbai)',
    backButton: 'Back',
    continueButton: 'Continue',
    completeButton: 'Complete Setup',
    savingLabel: 'Saving...',
    successToast: 'Cosmic Birth Profile successfully registered!',
    validationMessages: {
      selectProfileType: 'Please select who this profile is for',
      enterName: 'Please enter your full name',
      selectGender: 'Please select your gender',
      selectDob: 'Please select your date of birth',
      selectTime: 'Please select your birth time',
      enterBirthPlace: 'Please enter your birth place / location',
    },
  },

  home: {
    greetings: {
      morning: 'Good Morning',
      afternoon: 'Good Afternoon',
      evening: 'Good Evening',
    },
    guestName: 'Guest',
    defaultCity: 'Mumbai',
    locationAlertTitle: 'Current Location',
    locationAlertSourceNote: '(Detected via Google Maps)',
    locationAlertCancel: 'Cancel',
    locationAlertRefresh: 'Refresh GPS',
    languageModal: {
      title: 'Select Language',
      subtitle: 'Choose your preferred language for horoscope readings, panchang & AI consultations.',
      footerNote: '✦ Entire app and AI Chat will update to your selected language instantly.',
      languages: [
        { code: 'Telugu', nativeName: 'తెలుగు', englishLabel: 'Telugu', greetingSample: 'నమస్కారం', flagEmoji: '☀️' },
        { code: 'Hindi', nativeName: 'हिन्दी', englishLabel: 'Hindi', greetingSample: 'नमस्ते', flagEmoji: '🕉️' },
        { code: 'English', nativeName: 'English', englishLabel: 'English', greetingSample: 'Namaste', flagEmoji: '✨' },
        { code: 'Tamil', nativeName: 'தமிழ்', englishLabel: 'Tamil', greetingSample: 'வணக்கம்', flagEmoji: '🪷' },
        { code: 'Kannada', nativeName: 'ಕನ್ನಡ', englishLabel: 'Kannada', greetingSample: 'ನಮಸ್ಕಾರ', flagEmoji: '🌿' },
        { code: 'Malayalam', nativeName: 'മലയാളം', englishLabel: 'Malayalam', greetingSample: 'നമസ്കാരം', flagEmoji: '🌙' },
      ],
    },
    quickActionsHeader: 'Quick Actions',
    quickActionsBadge: 'Vedic & AI Tools',
    quickActions: [
      { emoji: '✋', label: 'Remedies', route: '/remedies-screen', color: '#713B32', id: 'remedies', badge: '8 in 1' },
      { emoji: '🔮', label: 'AI Astrologer', route: '/(tabs)/ai-chat-screen', color: '#1A3D5C', id: 'aiAstrologer', badge: 'AI Guru' },
      { emoji: '👨‍🔮', label: 'Live Astrologers', route: '/(tabs)/live-astrologers-screen', color: '#1A3D1A', id: 'liveAstrologers', badge: 'Live' },
      { emoji: '📜', label: 'My Kundli', route: '/my-kundli-screen', color: '#3D1A2A', id: 'myKundli' },
      { emoji: '💫', label: 'Kundli Match', route: '/match-kundli-screen', color: '#2A1A3D', id: 'matchKundli' },
      { emoji: '📅', label: 'Panchang', route: '/panchang-screen', color: '#2A2A1A', id: 'panchang' },
    ],
    remediesTitle: 'Sacred Vedic Remedies',
    remediesSubtitle: 'अष्ट परिहार • Ashta-Digbandhana (8 Directions)',
    remediesViewAll: 'Explore All 8 ↗',
    horoscopeTitle: "Today's Horoscope",
    horoscopeAiBadge: '✦ AstroParihar AI',
    horoscopeTransitSuffix: '• Live Vedic Transit',
    horoscopeDefaultSign: 'Aries',
    horoscopeAskAiTemplate: 'Ask AI Astrologer about your {category}',
    horoscopeViewFullButton: 'View Full 12 Signs Horoscope',
    horoscopeDefaultCategories: [
      {
        key: 'love',
        emoji: '❤️',
        label: 'Love',
        score: 82,
        color: '#713B32',
        insight: 'Venus favours romantic connections today. Express your feelings openly — the stars support heartfelt conversations.',
        tip: 'Wear rose quartz or light a rose-scented lamp for enhanced love energy',
      },
      {
        key: 'career',
        emoji: '💼',
        label: 'Career',
        score: 84,
        color: '#1A3D5C',
        insight: "Jupiter's transit through your 10th house brings career advancement. A senior may recognise your contributions.",
        tip: 'Offer water to the rising Sun before starting key work proposals',
      },
      {
        key: 'money',
        emoji: '💰',
        label: 'Money',
        score: 76,
        color: '#2A2A1A',
        insight: 'Financial clarity improves through patient planning. Review long-term savings and avoid impulsive spending.',
        tip: 'Recite Lakshmi Stotra in the morning for steady abundance',
      },
      {
        key: 'health',
        emoji: '🏥',
        label: 'Health',
        score: 88,
        color: '#1A3D1A',
        insight: 'Your vitality is strong. Morning sunlight, pranayama, and warm sattvic meals support physical balance.',
        tip: 'Drink warm saffron or turmeric milk before sleep for restorative rest',
      },
      {
        key: 'family',
        emoji: '👨‍👩‍👧',
        label: 'Family',
        score: 80,
        color: '#2A1A3D',
        insight: "Mercury's influence brings harmonious family communication. Shared meals and elders' blessings bring peace.",
        tip: 'Light a pure cow ghee lamp at the family altar at dusk',
      },
    ],
    aiPrompt: {
      title: 'Ask AstroParihar AI',
      badge: 'AI 2.0',
      subtitle: 'Powered by Sacred Vedic Ephemeris & AI',
      questionPrompt: 'Have a question about your life or future?',
      inputPlaceholder: 'Ask about career, love, marriage, remedies...',
      quickPills: ['💼 Job Promotion Timing?', '💍 Marriage Timing?', '🪐 Shani Sade Sati Remedy'],
      ctaButton: 'Ask AI Astrologer',
    },
    recommendedTitle: 'Recommended For You',
    recommendedAiTitlePrefix: 'Talk to AI Astrologer:',
    recommendedAiSubtitleSuffix: 'Instant Answers with AstroParihar AI',
    recommendedAiTag: 'AI Guru',
    recommendedRealTitlePrefix: 'Live Consultation:',
    recommendedRealOnlineTag: 'Live Now',
    recommendedRealVerifiedTag: 'Verified Guru',
    recommendedStaticCards: [
      {
        emoji: '🪐',
        title: 'Planetary Transit & Dasha Remedies',
        subtitle: 'Explore Ashta-Digbandhana remedies tailored to your active Dasha',
        tag: 'Dasha Alert',
        tagColor: '#CF4444',
        route: '/remedies-screen',
      },
      {
        emoji: '❤️',
        title: '36 Guna Kundli Milan & Compatibility',
        subtitle: 'Check Ashtakoot planetary harmony for marriage',
        tag: 'Recommended',
        tagColor: '#1A3D5C',
        route: '/match-kundli-screen',
      },
    ],
    realAstrologers: {
      title: 'Talk to Astrologers',
      onlineSuffix: 'Online',
      subtitle: 'Verified Vedic Astrologers & Live Consultations',
      viewAllLabel: 'View All ›',
      connectingTitle: 'Connecting Gurus...',
      connectingSubtitle: 'Loading Vedic profiles',
      verifiedBadge: 'Verified',
      consultButton: 'Consult Now',
    },
    aiAstrologers: {
      title: '✦ 24/7 AI Astrologers',
      instantBadge: 'Instant',
      subtitle: 'Sub-Second Vedic Calculations Powered by AstroParihar AI',
      viewAllLabel: 'Chat AI ›',
      replySpeedBadge: '<1s reply',
      chatButton: 'Chat AI',
    },
    promotions: {
      title: 'Promotions & Offers',
      emoji: '🎁',
      viewAllLabel: 'View All Offers',
    },
    stickyCtas: {
      chatAiLabel: 'Chat with AI Astrologer',
      callHumanLabel: 'Call Astrologer',
    },
  },

  services: {
    headerTitle: 'Services',
    heading: 'Vedic Services & Sacred Solutions',
    subtitle: 'Tap any category to view and launch individual Vedic services',
    searchPlaceholder: 'Search Vedic services, remedies, guides...',
    searchFoundTemplate: 'Found {count} services matching "{query}"',
    searchEmptyTitle: 'No matching services found',
    searchEmptySubtitle: 'Try searching for Kundli, Panchang, Remedies, or Tarot.',
    fallbackTabLabel: 'Services',
  },

  liveAstrologers: {
    realHeaderTitle: 'Verified Real Astrologers',
    realHeaderSubtitle: 'Authentic Vedic Masters for Live Voice & Video Consultations',
    aiHeaderTitle: '24/7 AI Astrologers',
    aiHeaderSubtitle: 'Autonomous Astronomical Engine with AstroParihar AI',
    onlineSuffix: 'Online',
    realSearchPlaceholder: 'Search real astrologers by name or specialty...',
    aiSearchPlaceholder: 'Search AI astrological guides...',
    realTabLabel: 'Real Astrologers',
    aiTabLabel: 'AI Astrologers',
    categories: [
      { label: 'All', emoji: '✦' },
      { label: 'Remedies', emoji: '🪔' },
      { label: 'Love', emoji: '❤️' },
      { label: 'Marriage', emoji: '💍' },
      { label: 'Career', emoji: '💼' },
      { label: 'Vedic', emoji: '🕉️' },
      { label: 'Finance', emoji: '💰' },
      { label: 'Numerology', emoji: '🔢' },
      { label: 'Vastu', emoji: '🏛️' },
      { label: 'Spirituality', emoji: '🧘' },
      { label: 'Tarot', emoji: '🃏' },
      { label: 'KP', emoji: '📐' },
      { label: 'Nadi', emoji: '📜' },
      { label: 'Gemstones', emoji: '💎' },
      { label: 'Rudraksha', emoji: '📿' },
      { label: 'Yantra', emoji: '🔯' },
      { label: 'Mantra', emoji: '🔔' },
      { label: 'Homa', emoji: '🔥' },
      { label: 'Devata', emoji: '🪔' },
      { label: 'Dāna & Seva', emoji: '🤲' },
    ],
    cardOfflineBadge: '🔴 OFFLINE',
    cardViewProfile: 'View Profile →',
    cardChatAi: 'Chat AI',
    cardVoiceAi: 'Voice AI',
    cardChat: 'Chat',
    cardCall: 'Call',
    loadingTitle: 'Connecting with Vedic Astrologers...',
    loadingSubtitle: 'Loading verified astrological profiles',
    emptyTitle: 'No astrologers found',
    emptySubtitle: 'Try adjusting your search or filters',
    clearFiltersLabel: 'Clear Filters',
    filterSheet: {
      title: 'Filter Astrologers',
      subtitle: 'Refine verified masters & consultations',
      onlineTitle: 'Show Online Only',
      onlineSubtitle: 'Only display masters currently ready to consult',
      sortByLabel: 'Sort By',
      sortOptions: ['Top Rated', 'Price: Low', 'Price: High', 'Most Consulted', 'Experience'],
      priceRangeLabel: 'Price Range',
      priceOptionsInr: ['All', 'Under ₹20', '₹20–₹40', '₹40–₹60', '₹60+'],
      priceOptionsUsd: ['All', 'Under $0.25', '$0.25–$0.50', '$0.50–$0.75', '$0.75+'],
      genderLabel: 'Gender',
      genderOptions: ['All', 'Male', 'Female'],
      languageLabel: 'Language',
      languageOptions: [
        'All',
        'Hindi',
        'English',
        'Tamil',
        'Telugu',
        'Kannada',
        'Malayalam',
        'Bengali',
        'Marathi',
        'Gujarati',
        'Punjabi',
        'Odia',
      ],
      resetLabel: 'Reset',
      applyLabel: 'Apply Filters',
    },
  },

  astrologerDetail: {
    onlineBadge: 'Online • Instant Connect',
    offlineBadge: 'Currently Offline',
    onlineChip: 'Online Now',
    offlineChip: 'Offline',
    statLabels: { rating: 'Rating', reviews: 'Reviews', sessions: 'Sessions', rate: 'Rate' },
    specialisationsTitle: 'Specialisations',
    tabs: { about: 'About', reviewsPrefix: 'Reviews', availability: 'Availability' },
    aboutTitlePrefix: 'About',
    noBioText: 'No bio added by the astrologer yet.',
    expertiseTitle: 'Areas of Expertise',
    educationTitle: 'Education & Credentials',
    educationLabels: {
      education: 'Education',
      certification: 'Certification',
      learningSource: 'Learning Source',
    },
    reviewsSuffix: 'reviews',
    emptyReviewsTemplate: 'No customer reviews submitted yet for {name}.',
    liveStatusTitle: 'Live Status',
    availabilityLabels: {
      current: 'Current Availability',
      onlineText: '🟢 Online — Ready for Calls',
      offlineText: '🔴 Offline — Unavailable',
      dailyHours: 'Daily Hours',
      location: 'Location',
      languages: 'Languages',
    },
    ratesTitle: 'Dynamic Consultation Rates',
    voiceCallBtn: 'Voice Call',
    videoCallBtn: 'Video Call',
    startLivePrefix: '⚡ Start Live Consultation with',
    offlineBtnSuffix: 'is Currently Offline',
    sheet: {
      title: 'Instant 1-on-1 Consultation',
      withPrefix: 'with',
      modeHeading: 'SELECT CONSULTATION MODE',
      videoTitle: 'Live Video Call',
      videoSub: 'Face-to-Face HD',
      voiceTitle: 'Live Voice Call',
      voiceSub: 'Direct Voice Line',
      durationHeading: 'SELECT INITIAL DURATION',
      extendableText: 'Extendable during call',
      minLabel: 'Min 5 min',
      walletLabel: 'Your Wallet',
      sufficientTemplate: '✓ Sufficient balance for ~{mins} minutes of live consultation.',
      lowBalanceTitle: 'Low Wallet Balance',
      lowBalanceTemplate: 'Minimum 5-minute balance ({min}) required to connect. Please add {needed} or more.',
      quickRechargePrefix: '⚡ Quick Recharge',
      processingRechargeLabel: 'Processing Recharge...',
      offlineNotice: '🔴 Astrologer is Currently Offline',
      signInToConsultLabel: '🔐 Sign In to Consult Astrologer ↗',
      startCallPrefix: 'Start Live',
      goToWalletLabel: 'Go to Wallet & Transaction History →',
    },
  },

  horoscope: {
    headerTitle: 'Daily Horoscope',
    defaultSubtitle: 'Personalised cosmic guidance',
    personalisedPrefix: 'Personalised for',
    defaultBadge: 'Vedic',
    zodiacs: [
      { sign: 'Aries', symbol: '♈', emoji: '🐏', dates: 'Mar 21 – Apr 19', element: 'Fire' },
      { sign: 'Taurus', symbol: '♉', emoji: '🐂', dates: 'Apr 20 – May 20', element: 'Earth' },
      { sign: 'Gemini', symbol: '♊', emoji: '👯', dates: 'May 21 – Jun 20', element: 'Air' },
      { sign: 'Cancer', symbol: '♋', emoji: '🦀', dates: 'Jun 21 – Jul 22', element: 'Water' },
      { sign: 'Leo', symbol: '♌', emoji: '🦁', dates: 'Jul 23 – Aug 22', element: 'Fire' },
      { sign: 'Virgo', symbol: '♍', emoji: '👩‍🌾', dates: 'Aug 23 – Sep 22', element: 'Earth' },
      { sign: 'Libra', symbol: '♎', emoji: '⚖️', dates: 'Sep 23 – Oct 22', element: 'Air' },
      { sign: 'Scorpio', symbol: '♏', emoji: '🦂', dates: 'Oct 23 – Nov 21', element: 'Water' },
      { sign: 'Sagittarius', symbol: '♐', emoji: '🏹', dates: 'Nov 22 – Dec 21', element: 'Fire' },
      { sign: 'Capricorn', symbol: '♑', emoji: '🐐', dates: 'Dec 22 – Jan 19', element: 'Earth' },
      { sign: 'Aquarius', symbol: '♒', emoji: '🏺', dates: 'Jan 20 – Feb 18', element: 'Air' },
      { sign: 'Pisces', symbol: '♓', emoji: '🐟', dates: 'Feb 19 – Mar 20', element: 'Water' },
    ],
    dateTabs: { yesterday: 'Yesterday', today: 'Today', tomorrow: 'Tomorrow' },
    overallScoreLabel: 'Overall Score',
    dailyGuidanceTitle: 'Daily Guidance',
    categories: [
      { key: 'love', label: 'Love', emoji: '💕', color: '#E91E8C' },
      { key: 'career', label: 'Career', emoji: '💼', color: '#4FC3F7' },
      { key: 'money', label: 'Money', emoji: '💰', color: '#2D9E6B' },
      { key: 'health', label: 'Health', emoji: '🌿', color: '#66BB6A' },
      { key: 'family', label: 'Family', emoji: '🏠', color: '#FFB347' },
    ],
    luckyDetailsTitle: 'Lucky Details',
    luckyLabels: { number: 'Number', color: 'Colour', day: 'Day' },
    cta: {
      title: '🔮 Want deeper insights?',
      subtitle: 'Ask AstroParihar AI for personalised guidance based on your birth chart',
      askAiButton: '✨ Ask AI Astrologer',
      talkAstrologerButton: '👨‍🔮 Talk to Astrologer',
    },
  },

  panchang: {
    headerTitle: 'Panchang',
    defaultLocation: 'New Delhi, India',
    dateLabels: { today: 'Today', yesterday: 'Yesterday', tomorrow: 'Tomorrow' },
    vikramSamvatPrefix: 'Vikram Samvat',
    vikramSamvatOverrideYear: '',
    calendarSubtitle: 'Vedic Calendar',
    timezoneLabel: 'IST (UTC+5:30)',
    sections: {
      detailsTitle: 'Panchang Details',
      sunMoonTitle: 'Sun & Moon Timings',
      timesTitle: 'Auspicious & Inauspicious Times',
      choghadiyaTitle: "Today's Choghadiya",
      choghadiyaSubtitle: 'Day Choghadiya (Sunrise to Sunset)',
    },
    cardLabels: {
      tithi: 'Tithi',
      nakshatra: 'Nakshatra',
      yoga: 'Yoga',
      karana: 'Karana',
      sunrise: 'Sunrise',
      sunset: 'Sunset',
      moonrise: 'Moonrise',
      moonset: 'Moonset',
      rahuKaal: 'Rahu Kaal',
      yamaganda: 'Yamaganda',
      gulikaKaal: 'Gulika Kaal',
      abhijitMuhurat: 'Abhijit Muhurat',
    },
    badges: { auspicious: 'Auspicious', avoid: 'Avoid' },
    buttons: {
      generateReport: 'Generate Panchang & Muhurat Report',
      generating: 'Generating Almanac...',
      signInToGenerate: '🔒 Sign In to Generate Panchang Report',
      sharePanchang: "Share Today's Panchang",
    },
    signInToast: 'Please sign in to generate and save your Panchang report',
  },

  myKundli: {
    headerTitle: 'My Kundli',
    verifiedBadge: 'Vedic Verified',
    guestLabel: 'Guest',
    defaultDevoteeLabel: 'Devotee',
    signInToViewLabel: 'Sign in to view',
    notSpecifiedLabel: 'Not specified',
    aiCardTitle: 'Ask AstroParihar AI',
    aiCardPromptTemplate: '"How does my {mahadasha} Mahadasha affect my career and growth this year?"',
    aiCardButton: 'Ask AI About My Kundli',
    sections: [
      { title: 'Birth Details', icon: 'person_outline_rounded' },
      { title: 'Lagna / Ascendant', icon: 'star_outline' },
      { title: 'Rashi & Nakshatra', icon: 'nights_stay_outlined' },
      { title: 'Planetary Positions', icon: 'public' },
      { title: 'Houses', icon: 'home_outlined' },
      { title: 'Mahadasha & Antardasha', icon: 'timeline' },
      { title: 'Current Transits', icon: 'swap_horiz' },
      { title: 'Doshas', icon: 'warning_amber_rounded' },
      { title: 'Yogas', icon: 'self_improvement' },
      { title: 'Career', icon: 'work_outline' },
      { title: 'Marriage', icon: 'favorite_border' },
      { title: 'Finance', icon: 'account_balance_outlined' },
      { title: 'Family', icon: 'people_outline' },
      { title: 'Spirituality', icon: 'spa_outlined' },
    ],
    birthFieldLabels: {
      name: 'Name',
      dob: 'Date of Birth',
      tob: 'Time of Birth',
      pob: 'Birth Place',
      lagna: 'Ascendant (Lagna)',
      moonSign: 'Moon Sign (Rashi)',
      nakshatra: 'Nakshatra',
      padaLabel: 'Pada',
    },
    lagnaLabels: {
      lagna: 'Lagna',
      lagnaLord: 'Lagna Lord',
      lordDescSuffix: '(Governs vitality & life path)',
      ascendantDescTemplate:
        '{sign} ascendant endows you with deep determination, strategic acumen, and keen intuition. Governed by {lord}, you possess transformative resilience.',
      rashiLabel: 'Moon Sign (Rashi)',
      nakshatraLabel: 'Nakshatra',
      rashiDescTemplate:
        'Your Moon in {moonSign} grants profound emotional sensitivity and intuitive wisdom. The {nakshatra} nakshatra inspires continuous renewal, spiritual protection, and enduring fortune.',
    },
    houseSummaryItems: [
      { houseNumber: 1, label: '1st House', rules: 'Self, Vitality & Appearance' },
      { houseNumber: 2, label: '2nd House', rules: 'Wealth, Family & Speech' },
      { houseNumber: 4, label: '4th House', rules: 'Home, Mother & Happiness' },
      { houseNumber: 7, label: '7th House', rules: 'Marriage, Partnerships & Spousal Bliss' },
      { houseNumber: 10, label: '10th House', rules: 'Career, Profession & Social Status' },
    ],
    dashaLabels: {
      mahadasha: 'Current Mahadasha',
      antardasha: 'Current Antardasha',
      activeBadge: 'Active',
      majorDesc: 'Active Major Planetary Period',
      subDesc: 'Sub-Period Alignment',
      summaryTemplate:
        'You are currently navigating the {mahadasha} Mahadasha and {antardasha} Antardasha. This period emphasizes karmic expansion, professional milestones, and spiritual discipline.',
    },
    currentTransits: [
      { planet: 'Saturn', sign: 'Pisces', house: 'Transiting Cosmic Discipline Axis', effect: 'Structured growth & patience' },
      { planet: 'Jupiter', sign: 'Gemini', house: 'Expanding Wisdom & Learning', effect: 'Spiritual clarity & career growth' },
      { planet: 'Rahu-Ketu', sign: 'Aquarius-Leo', house: 'Karmic Innovation Axis', effect: 'Creative breakthroughs & detachment' },
    ],
    doshaLabels: {
      mangal: 'Mangal Dosha',
      kaalSarp: 'Kaal Sarp Dosha',
      sadeSati: 'Shani Sade Sati',
      present: 'Present',
      notPresent: 'Not Present',
      monitored: 'Monitored',
      clear: 'Clear',
      mangalPresentDesc: 'Mars influence observed in relationship houses. Vedic Parihar remedies pacify energy.',
      mangalClearDesc: 'Mars is favorably placed in your chart without adverse dosha affliction.',
      kaalSarpPresentDesc: 'Planetary axis enclosed between Rahu and Ketu. Mahamrityunjaya Japa pacifies this configuration.',
      kaalSarpClearDesc: 'All planets are free from Rahu-Ketu enclosure; no Kaal Sarp Dosha.',
      sadeSatiDefaultDesc: 'Active Saturn transit observed relative to natal Moon.',
      beneficBadge: 'Benefic',
      activeBadge: 'Active',
    },
    defaultYogas: [
      {
        name: 'Gaja Kesari Yoga',
        description: 'Jupiter and Moon in Kendra quadrants bestow wisdom, high reputation, and steady prosperity.',
        benefic: true,
      },
      {
        name: 'Budhaditya Yoga',
        description: 'Sun and Mercury conjunction sharpens intellect, communications, and administrative skills.',
        benefic: true,
      },
    ],
    planetInterpretations: {
      Sun: 'Sun signifies soul purpose, confidence, vitality, and natural leadership abilities in your chart.',
      Moon: 'Moon governs emotional depth, intuition, inner peace, and nurturing relationships.',
      Mars: 'Mars imparts courage, willpower, strategic drive, and transformative energy.',
      Mercury: 'Mercury enhances intellect, analytical clarity, eloquence, and practical business wisdom.',
      Jupiter: 'Jupiter blesses your chart with dharmic fortune, higher learning, and expanding prosperity.',
      Venus: 'Venus nurtures harmony, artistic refinement, devotion, and fulfilling partnerships.',
      Saturn: 'Saturn builds enduring career mastery through discipline, integrity, and steady perseverance.',
      Rahu: 'Rahu amplifies ambition, innovation, unconventional opportunities, and global outlook.',
      Ketu: 'Ketu awakens past-life spiritual wisdom, intuition, and liberation from illusion.',
    },
    houseInfo: {
      '1': { name: 'First House (Lagna)', rules: 'Self, Personality, Physical Body', desc: 'The Ascendant house represents your outer personality, vitality, and life direction.' },
      '2': { name: 'Second House (Dhana)', rules: 'Wealth, Family, Speech', desc: 'The house of accumulated assets, family values, and early foundation.' },
      '3': { name: 'Third House (Sahaja)', rules: 'Siblings, Communication, Courage', desc: 'Governs initiative, short journeys, communication, and personal courage.' },
      '4': { name: 'Fourth House (Sukha)', rules: 'Home, Mother, Happiness', desc: 'The house of domestic harmony, mother, property, and inner peace.' },
      '5': { name: 'Fifth House (Putra)', rules: 'Creativity, Children, Purva Punya', desc: 'Governs intelligence, devotion, children, and past-life merit.' },
      '6': { name: 'Sixth House (Ari)', rules: 'Health, Service, Discipline', desc: 'Governs daily routines, overcoming obstacles, and resilience.' },
      '7': { name: 'Seventh House (Yuvati)', rules: 'Marriage, Partnerships, Alliances', desc: 'Governs marriage, spouse, business partnerships, and public dealings.' },
      '8': { name: 'Eighth House (Randhra)', rules: 'Transformation, Research, Longevity', desc: 'Governs deep occult knowledge, longevity, and karmic transformation.' },
      '9': { name: 'Ninth House (Dharma)', rules: 'Luck, Higher Learning, Spirituality', desc: 'The house of fortune, spiritual teachers, pilgrimage, and divine grace.' },
      '10': { name: 'Tenth House (Karma)', rules: 'Career, Status, Authority', desc: 'The house of profession, social stature, and public achievements.' },
      '11': { name: 'Eleventh House (Labha)', rules: 'Gains, Social Network, Aspirations', desc: 'The house of profits, income flow, and fulfillment of high ambitions.' },
      '12': { name: 'Twelfth House (Vyaya)', rules: 'Liberation, Foreign Lands, Spirituality', desc: 'The house of moksha, meditation, and spiritual elevation.' },
    },
    genericPredictions: {
      Career: "Saturn and Jupiter's alignment indicates a steady, respected career path in leadership, strategy, or specialized enterprise.",
      Marriage: 'Venus and 7th house influences support a devoted, harmonious partnership built on mutual respect.',
      Finance: 'Favorable 2nd and 11th house energies indicate steady financial growth through ethical enterprise and wise savings.',
      Family: 'Moon and 4th house placements bring warm family bonds and domestic peace.',
      Spirituality: 'Ketu and 9th/12th house resonance indicate deep spiritual insight and divine protection.',
    },
    planetSheetAskAi: 'Ask AI About This Planet',
    houseSheetClose: 'Close',
    signInExportToast: 'Please sign in to export or download your Vedic birth chart',
  },

  matchKundli: {
    headerTitleForm: 'Match Kundli',
    headerTitleResults: 'Compatibility Results',
    heroEmoji: '❤️',
    heroTitle: 'Match Your Kundli',
    heroSubtitle: 'Discover compatibility using traditional Vedic astrology and the ancient science of Guna Milan.',
    p1DefaultTitle: 'Person 1 (Self)',
    p1YouSuffix: '(You)',
    p2Title: 'Person 2 (Partner)',
    autoFetchedBadge: 'Auto-Fetched',
    fullNameLabel: 'Full Name',
    dobLabel: 'Date of Birth',
    tobLabel: 'Time of Birth',
    birthPlaceLabel: 'Birth Place (City, State, Country)',
    birthPlacePlaceholder: 'Enter birth place (e.g. Mumbai)',
    calculatingLabel: 'Calculating Compatibility...',
    calculateButton: 'Calculate Compatibility ✨',
    compatibilityLabel: 'Compatibility',
    scoreHeading: 'Your Compatibility Score',
    verdicts: {
      excellent: 'Excellent Match ✨',
      good: 'Good Match 👍',
      remedies: 'Requires Remedies ⚠️',
      defaultDesc: 'A score above 28 indicates an excellent match. This couple shares strong spiritual, emotional, and practical compatibility.',
    },
    gunaMilanHeading: 'Guna Milan (36 Points)',
    areasHeading: 'Compatibility Areas',
    generateReportBtn: 'Generate Detailed Compatibility Report',
    generatingReportBtn: 'Generating Report...',
    askAiBtn: '🤖 Ask AI About This Match',
    validationToast: 'Please enter names for both partners',
    signInReportToast: 'Please sign in to save and download your compatibility report',
  },

  remedies: {
    headerTitle: 'Sacred Vedic Remedies',
    topBadgeDefault: 'Sacred Remedies',
    topPersonalisedPrefix: 'Personalised for',
    topTitle: 'Ashta-Digbandhana Remedies',
    exploreButton: 'Explore',
    wheelTitle: 'Ashta-Digbandhana',
    wheelSubtitle: 'The 8 Sacred Directions of Vedic Remedies',
    wheelTapHint: 'Tap wheel to consult AI or explore each remedy below',
    allRemediesTitle: 'All Remedies',
    principlesTitle: 'Sacred Ashta Parihar Principles',
    principlesSubtitle: 'Ancient Vedic sciences for mitigating planetary doshas & karmic debts',
    principlesCards: [
      {
        emoji: '🛡️',
        title: 'The 8-Fold Shield (Ashta-Digbandhana)',
        accentColor: '#C9A84C',
        body: 'Each of the 8 directions is governed by an Ashta-Dikpala and corresponding planetary vibrations. By harmonizing Mantras (North), Yantras (North-East), Homa (East), Upasana (South-East), Ratna (South), Rudraksha (South-West), Vastu (West), and Dāna (North-West), a protective spiritual shield is established around your auric field.',
        bullets: [],
      },
      {
        emoji: '🪔',
        title: 'Rules of Effective Remedy Practice',
        accentColor: '#81C784',
        body: '',
        bullets: [
          { boldPrefix: 'Brahma Muhurta:', text: 'Chanting & meditation between 4:00 AM – 6:00 AM yields 100x spiritual efficacy.' },
          { boldPrefix: 'Sattvic Mindset:', text: 'Maintain dietary purity and observe non-violence during remedy cycles.' },
          { boldPrefix: 'Sankalpa:', text: 'Clear, heartfelt intention dedicated to the divine ensures karmic dissipation.' },
        ],
      },
    ],
    customCtaTitle: 'Need Custom Prescription?',
    customCtaSubtitle: 'Get an astrologer to analyze your Mahadasha, Dasha Sandhi & doshas.',
    customCtaButton: 'Consult Now',
    detailHeaders: {
      whyHelp: 'Why This Remedy May Help',
      coreBenefits: 'Core Spiritual Benefits',
      howItWorks: 'How It Works in Vedic Science',
      suitableFor: 'Who It Is Suitable For',
      liveMantras: 'Sacred Maha Mantras (Live Shlokas)',
      navagrahaMantras: 'Navagraha Sacred Japa Mantras',
      yantras: 'Popular Sacred Yantras',
      liveHomams: 'Prescribed Sacred Homams (Live)',
      classicalHomams: 'Classical Sacred Homams',
      ishtaDeities: 'Personal Ishta Deities',
      gemstones: 'Navagraha Gemstone Therapy',
      gemstoneWarning: '⚠️ Gemstone recommendations are chart-specific. Always consult an astrologer before wearing.',
      rudraksha: 'Sacred Mukhi Rudrakshas',
      vastu: '8-Directional Vastu Science (Ashta-Digbandhana)',
      prescribedParihar: 'Prescribed Parihar',
      charity: 'Vedic Planetary Charity Guide',
      mandalaDefaultTitle: '48-Day Sacred Mandala Parihar Protocol',
      askAiButton: '🤖 Ask AI Astrologer About This Remedy',
      consultAstrologerButton: '👨‍🔮 Consult Live Astrologer',
    },
  },

  aiChat: {
    aiModels: [
      { id: 'auto', name: 'Auto (Recommended)', icon: '⚡', desc: 'Optimal Astrological Synthesis & Fast Calculations' },
      { id: 'vedika-ai', name: 'Vedic Ephemeris AI', icon: '🔮', desc: 'High-Precision Vedic Ephemeris & Kundli Calculations' },
      { id: 'openai-gpt4o', name: 'Deep Synthesis AI', icon: '🧠', desc: 'Deep Astrological Synthesis & Sacred Counsel' },
    ],
    languages: [
      { code: 'Telugu', label: 'తెలుగు', full: 'తెలుగు (Telugu)' },
      { code: 'Hindi', label: 'हिन्दी', full: 'हिन्दी (Hindi)' },
      { code: 'Tamil', label: 'தமிழ்', full: 'தமிழ் (Tamil)' },
      { code: 'Kannada', label: 'ಕನ್ನಡ', full: 'ಕನ್ನಡ (Kannada)' },
      { code: 'Malayalam', label: 'മലയാളം', full: 'മലയാളം (Malayalam)' },
      { code: 'English', label: 'English', full: 'English (EN)' },
    ],
    quickPromptsByLang: {
      Telugu: [
        '🕉️ మంత్ర పరిహారం: నా గ్రహ శాంతికి ఏ నిత్య వేద మంత్రం & జప విధానం పాటించాలి?',
        '⬡ యంత్ర పరిహారం: దోష నివారణ మరియు సంపద కోసం ఏ సిద్ధి యంత్రాన్ని ఇంట్లో పూజించాలి?',
        '🔥 హోమ పరిహారం: నా జన్మ కుండలి శుద్ధికి ఏ పవిత్ర వైదిక హోమం లేదా హవనం చేయించాలి?',
        '🪔 ఇష్ట దేవత: నా ఇష్ట దేవత & కులదైవం ఎవరు? ఏ పుణ్యక్షేత్ర దర్శనం చేయాలి?',
        '💎 రత్న ధారణ: నా జాతక బలానికి ఏ భాగ్య రత్నం (Ratna) & లోహం ధరించాలి?',
        '📿 రుద్రాక్ష పరిహారం: నా నక్షత్రం, ఆరోగ్యం & మానసిక శాంతికి ఏ ముఖి రుద్రాక్ష అనుకూలం?',
        '🏠 వాస్తు పరిహారం: నా గృహం లేదా వ్యాపారంలో దోష నివారణకు ఏ వాస్తు పరిహారాలు చేయాలి?',
        '🤲 దానం & సేవ: కర్మ దోష విముక్తికి ఏ విధమైన దానం మరియు సేవ చేయాలి?',
      ],
      Hindi: [
        '🕉️ मंत्र परिहार: ग्रह शांति और आत्मिक बल हेतु मुझे कौन सा दैनिक वैदिक मंत्र जपना चाहिए?',
        '⬡ यंत्र परिहार: घर में सुख-समृद्धि एवं दोष निवारण हेतु कौन सा सिद्ध यंत्र स्थापित करें?',
        '🔥 होम परिहार: जन्म पत्रिका के ग्रह दोष शांति हेतु कौन सा वैदिक हवन/होम अनुष्ठान करवाएं?',
        '🪔 इष्ट देवता: मेरी कुंडली के अनुसार मेरे इष्ट देव कौन हैं और कौन सा तीर्थ परिहार करें?',
        '💎 रत्न धारण: कुंडली के शुभ ग्रहों को बल देने हेतु कौन सा भाग्यशाली रत्न व धातु धारण करें?',
        '📿 रुद्राक्ष परिहार: मेरे नक्षत्र, आरोग्य एवं मानसिक शांति हेतु कौन सा मुखी रुद्राक्ष शुभ है?',
        '🏠 वास्तु परिहार: घर और कार्यक्षेत्र में सकारात्मक ऊर्जा हेतु कौन से वास्तु उपाय करें?',
        '🤲 दान एवं सेवा: कर्म दोष निवारण एवं पुण्य फल प्राप्ति हेतु क्या दान व सेवा करनी चाहिए?',
      ],
      Tamil: [
        '🕉️ மந்திர பரிகாரம்: கிரக தோஷ நிவர்த்திக்கு நான் தினமும் ஜபிக்க வேண்டிய வேத மந்திரம் எது?',
        '⬡ எந்திர பரிகாரம்: வீட்டில் தோஷங்களை நீக்கி நலம் பெற எந்த சக்திவாய்ந்த எந்திரத்தை நிறுவ வேண்டும்?',
        '🔥 ஹோம பரிகாரம்: எனது ஜாதக தோஷ பரிகாரத்திற்கு எந்த புனித ஹோமம் செய்ய வேண்டும்?',
        '🪔 இஷ்ட தெய்வம்: எனது இஷ்ட தெய்வம் மற்றும் குலதெய்வம் யார்? எந்த கோவில் பரிகாரம் செய்ய வேண்டும்?',
        '💎 ரத்தின பரிகாரம்: எனது ஜாதகத்திற்கு அதிர்ஷ்டம் தரும் ராசிக் கல் மற்றும் உலோகம் எது?',
        '📿 ருத்ராட்ச பரிகாரம்: எனது நட்சத்திரம் மற்றும் ஆரோக்கியத்திற்கு உகந்த முக ருத்ராட்சம் எது?',
        '🏠 வாஸ்து பரிகாரம்: வீட்டில் நேர்மறை ஆற்றலை அதிகரிக்க என்ன வாஸ்து பரிகாரங்கள் செய்ய வேண்டும்?',
        '🤲 தானம் & சேவை: கர்ம வினைகள் நீங்க நான் செய்ய வேண்டிய முக்கிய தானங்கள் மற்றும் சேவைகள் என்ன?',
      ],
      Kannada: [
        '🕉️ ಮಂತ್ರ ಪರಿಹಾರ: ಗ್ರಹ ಶಾಂತಿಗಾಗಿ ನಾನು ನಿತ್ಯ ಜಪಿಸಬೇಕಾದ ವೈದಿಕ ಮಂತ್ರ ಯಾವುದು?',
        '⬡ ಯಂತ್ರ ಪರಿಹಾರ: ದೋಷ ನಿವಾರಣೆ ಮತ್ತು ಸಮೃದ್ಧಿಗಾಗಿ ಮನೆಯಲ್ಲಿ ಯಾವ ಸಿದ್ಧ ಯಂತ್ರ ಸ್ಥಾಪಿಸಬೇಕು?',
        '🔥 ಹೋಮ ಪರಿಹಾರ: ಕುಂಡಲಿ ದೋಷ ನಿವಾರಣೆಗೆ ಯಾವ ಪವಿತ್ರ ಹೋಮ/ಹವನ ಮಾಡಿಸಬೇಕು?',
        '🪔 ಇಷ್ಟ ದೇವತೆ: ನನ್ನ ಇಷ್ಟ ದೇವತೆ ಯಾರು ಮತ್ತು ಯಾವ ಪುಣ್ಯಕ್ಷೇತ್ರ ಪರಿಹಾರ ದರ್ಶಿಸಬೇಕು?',
        '💎 ರತ್ನ ಧಾರಣೆ: ನನ್ನ ಜನ್ಮ ಕುಂಡಲಿಗೆ ಶುಭ ನೀಡುವ ಅದೃಷ್ಟ ರತ್ನ ಮತ್ತು ಲೋಹ ಯಾವುದು?',
        '📿 ರುದ್ರಾಕ್ಷಿ ಪರಿಹಾರ: ನನ್ನ ನಕ್ಷತ್ರ ಮತ್ತು ಆರೋಗ್ಯಕ್ಕೆ ಯಾವ ಮುಖಿ ರುದ್ರಾಕ್ಷಿ ಧರಿಸಬೇಕು?',
        '🏠 ವಾಸ್ತು ಪರಿಹಾರ: ಮನೆ ಮತ್ತು ಕಾರ್ಯಸ್ಥಳದಲ್ಲಿ ಸುಖ-ಶಾಂತಿಗೆ ಯಾವ ವಾಸ್ತು ಪರಿಹಾರ ಮಾಡಬೇಕು?',
        '🤲 ದಾನ & ಸೇವೆ: ಕರ್ಮ ದೋಷ ಪರಿಹಾರಕ್ಕೆ ಯಾವ ವಿಶೇಷ ದಾನ ಮತ್ತು ಸೇವೆ ಮಾಡಬೇಕು?',
      ],
      Malayalam: [
        '🕉️ മന്ത്ര പരിഹാരം: ഗ്രഹദോഷ ശാന്തിക്കായി ഞാൻ നിത്യവും ജപിക്കേണ്ട വേദ മന്ത്രം ഏതാണ്?',
        '⬡ യന്ത്ര പരിഹാരം: ഗൃഹദോഷങ്ങൾ നീക്കി ഐശ്വര്യം വരാൻ ഏത് യന്ത്രമാണ് പ്രതിഷ്ഠിക്കേണ്ടത്?',
        '🔥 ഹോമ പരിഹാരം: ജാതക ദോഷ പരിഹാരത്തിനായി ചെയ്യേണ്ട വിശുദ്ധ ഹോമം ഏതാണ്?',
        '🪔 ഇഷ്ടദേവത: എന്റെ ഇഷ്ടദേവതയും കുലദേവതയും ആരാണ്? ഏത് ക്ഷേത്ര പരിഹാരമാണ് വേണ്ടത്?',
        '💎 രത്ന ധാരണം: എന്റെ കുണ്ഡലിക്ക് അനുയോജ്യമായ ഭാഗ്യ രത്നവും ലോഹവും ഏതാണ്?',
        '📿 രുദ്രാക്ഷ പരിഹാരം: എന്റെ നക്ഷത്രത്തിനും ആരോഗ്യത്തിനും ഉചിതമായ മുഖി രുദ്രാക്ഷം ഏതാണ്?',
        '🏠 വാസ്തു പരിഹാരം: വീട്ടിലെ ഊർജ്ജ സന്തുലനത്തിനായി എന്തെല്ലാം വാസ്തു പരിഹാരങ്ങൾ ചെയ്യണം?',
        '🤲 ദാനം & സേവ: കർമ്മദോഷ നിവാരണത്തിനായി എന്തെല്ലാം ദാനങ്ങളും സേവകളുമാണ് ചെയ്യേണ്ടത്?',
      ],
      English: [
        '🕉️ Mantra: What daily Vedic mantra & Japa protocol should I chant for planetary peace?',
        '⬡ Yantra: Which energized Yantra should I install at home to remove doshas & attract prosperity?',
        '🔥 Homa: Which sacred Vedic Homa (Navagraha/Ganapathi/Chandi) is recommended for my chart?',
        '🪔 Ishta Devata: Who is my Ishta Devata & Kuladevata, and which temple pariharam should I visit?',
        '💎 Gemstone: Which lucky Ratna (gemstone) and metal should I wear according to my Kundli?',
        '📿 Rudraksha: Which Mukhi Rudraksha is most auspicious for my nakshatra, health & mind?',
        '🏠 Vastu: What Vastu dosha remedies should I apply to balance energy in my living space?',
        '🤲 Dana & Seva: What specific charity (food, clothes, grains) should I perform for karmic balance?',
      ],
    },
    placeholdersByLang: {
      Telugu: 'జ్యోతిష్య ప్రశ్నను అడగండి...',
      Hindi: 'वैदिक प्रश्न यहाँ पूछें...',
      Tamil: 'உங்கள் கேள்வியைக் கேளுங்கள்...',
      Kannada: 'ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ...',
      Malayalam: 'നിങ്ങളുടെ ചോദ്യം ചോദിക്കുക...',
      English: 'Ask Acharya Devavrat...',
    },
    authPlaceholderByLang: {
      Telugu: 'ప్రశ్నలు అడగడానికి సైన్ ఇన్ చేయండి...',
      Hindi: 'प्रश्न पूछने के लिए साइन इन करें...',
      Tamil: 'கேள்விகள் கேட்க உள்நுழையவும்...',
      Kannada: 'ಪ್ರಶ್ನೆ ಕೇಳಲು ಸೈನ್ ಇನ್ ಮಾಡಿ...',
      Malayalam: 'ചോദ്യങ്ങൾ ചോദിക്കാൻ സൈൻ ഇൻ ചെയ്യുക...',
      English: 'Sign in to ask questions...',
    },
    welcomeTemplatesByLang: {
      Telugu:
        '**నమస్కారం మరియు శుభాశీస్సులు, {name}!** 🙏\n\nనేను **{astroName}**, మీ వ్యక్తిగత వేద జ్యోతిష్య మార్గదర్శకుడిని. {year} సంవత్సరానికి సంబంధించి మీ **కుండలి, కెరీర్, వివాహం, ఆర్థిక స్థితి లేదా వేద పరిహారాల** గురించి ఏదైనా అడగండి. ఈరోజు మీకు ఎలా సహాయపడగలను?',
      Hindi:
        '**नमस्ते एवं आशीर्वाद, {name}!** 🙏\n\nमैं **{astroName}** हूँ, आपका व्यक्तिगत वैदिक ज्योतिषी एवं आध्यात्मिक मार्गदर्शक। वर्ष {year} के लिए अपनी **कुंडली, करियर, विवाह, धन या वैदिक उपायों** के बारे में कोई भी प्रश्न पूछें। आज मैं आपका किस प्रकार मार्गदर्शन करूँ?',
      Tamil:
        '**வணக்கம் மற்றும் ஆசிகள், {name}!** 🙏\n\nநான் **{astroName}**, உங்கள் தனிப்பட்ட வேத ஜோதிடர் மற்றும் ஆன்மீக வழிகாட்டி. {year} ஆம் ஆண்டிற்கான உங்கள் **ஜாதகம், தொழில், திருமணம் அல்லது பரிகாரங்கள்** பற்றி என்னிடம் கேளுங்கள். இன்று உங்களுக்கு எவ்வாறு உதவ முடியும்?',
      Kannada:
        '**ನಮಸ್ಕಾರ ಮತ್ತು ಶುಭಾಶೀರ್ವಾದಗಳು, {name}!** 🙏\n\nನಾನು **{astroName}**, ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ವೈದಿಕ ಜ್ಯೋತಿಷಿ ಮತ್ತು ಆಧ್ಯಾತ್ಮಿಕ ಮಾರ್ಗದರ್ಶಕ. {year} ವರ್ಷಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ನಿಮ್ಮ **ಕುಂಡಲಿ, ವೃತ್ತಿ, ವಿವಾಹ ಅಥವಾ ಪರಿಹಾರಗಳ** ಬಗ್ಗೆ ಕೇಳಿ. ಇಂದು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
      Malayalam:
        '**നമസ്കാരം, അനുഗ്രഹങ്ങൾ, {name}!** 🙏\n\nഞാൻ **{astroName}**, നിങ്ങളുടെ വ്യക്തിഗത വൈദിക ജ്യോതിഷിയും ആത്മീയ വഴികാട്ടിയും. {year} വർഷത്തെ നിങ്ങളുടെ **ജാതകം, തൊഴിൽ, വിവാഹം അല്ലെങ്കിൽ പരിഹാരങ്ങൾ** സംബന്ധിച്ച് എന്തും ചോദിക്കാം. ഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കണം?',
      English:
        '**Namaste and blessings, {name}!** 🙏\n\nI am **{astroName}**, your personal Vedic Astrologer & spiritual guide. Ask me any question about your **Kundli, career, marriage, finances, planetary dashas, or daily remedies** for {year}. How may I guide your chart today?',
    },
    subtitleByLang: {
      Telugu: 'ఆన్‌లైన్ • సర్టిఫైడ్ వేద AI జ్యోతిష్యులు',
      Hindi: 'ऑनलाइन • प्रमाणित वैदिक एआई ज्योतिषी',
      Tamil: 'ஆன்லைன் • சான்றளிக்கப்பட்ட வேத AI ஜோதிடர்',
      Kannada: 'ಆನ್‌ಲೈನ್ • ಪ್ರಮಾಣೀಕೃತ ವೈದಿಕ AI ಜ್ಯೋತಿಷಿ',
      Malayalam: 'ഓൺലൈൻ • സർട്ടിഫൈഡ് വൈദിക AI ജ്യോതിഷി',
      English: 'Online • Certified Vedic AI Astrologer',
    },
    balanceLabelByLang: {
      Telugu: 'బ్యాలెన్స్: ',
      Hindi: 'बैलेंस: ',
      Tamil: 'இருப்பு: ',
      Kannada: 'ಬ್ಯಾಲೆನ್ಸ್: ',
      Malayalam: 'ബാലൻസ്: ',
      English: 'Balance: ',
    },
    freePromptsSuffixByLang: {
      Telugu: 'ఉచిత ప్రశ్నలు',
      Hindi: 'मुफ्त प्रश्न',
      Tamil: 'இலவச கேள்விகள்',
      Kannada: 'ಉಚಿತ ಪ್ರಶ್ನೆಗಳು',
      Malayalam: 'സൗജന്യ ചോദ്യങ്ങൾ',
      English: 'Free Prompts',
    },
    promptCostSuffixByLang: {
      Telugu: '/ ప్రశ్న',
      Hindi: '/ प्रश्न',
      Tamil: '/ கேள்வி',
      Kannada: '/ ಪ್ರಶ್ನೆ',
      Malayalam: '/ ചോദ്യം',
      English: '/ prompt',
    },
    rechargeLabelByLang: {
      Telugu: '+ రీఛార్జ్ ↗',
      Hindi: '+ रिचार्ज ↗',
      Tamil: '+ ரீசார்ஜ் ↗',
      Kannada: '+ ರೀಚಾರ್ಜ್ ↗',
      Malayalam: '+ റീചാർജ് ↗',
      English: '+ Recharge ↗',
    },
    audioLabelByLang: {
      Telugu: { listen: 'వినండి', stop: 'ఆపండి' },
      Hindi: { listen: 'सुनें', stop: 'रोकें' },
      Tamil: { listen: 'கேளுங்கள்', stop: 'நிறுத்து' },
      Kannada: { listen: 'ಕೇಳಿ', stop: 'ನಿಲ್ಲಿಸಿ' },
      Malayalam: { listen: 'കേൾക്കുക', stop: 'നിർത്തുക' },
      English: { listen: 'Listen', stop: 'Stop' },
    },
    typingTipByLang: {
      Telugu: 'మీ జన్మ కుండలి మరియు గ్రహ గోచారాలను విశ్లేషిస్తున్నారు...',
      Hindi: 'आपकी जन्म कुंडली और ग्रह गोचर का विश्लेषण हो रहा है...',
      Tamil: 'உங்கள் ஜாதகம் மற்றும் கிரக பெயர்ச்சிகளை ஆராய்கிறது...',
      Kannada: 'ನಿಮ್ಮ ಜನ್ಮ ಕುಂಡಲಿ ಮತ್ತು ಗ್ರಹ ಗೋಚಾರವನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...',
      Malayalam: 'നിങ്ങളുടെ ജാതകവും ഗ്രഹ സഞ്ചാരവും വിശകലനം ചെയ്യുന്നു...',
      English: 'Analyzing your Janam Kundli & planetary transits...',
    },
    structuredCardStringsByLang: {
      Telugu: {
        activeDasha: '✦ ప్రస్తుత దశ:',
        hideEvidence: '▲ జ్యోతిష్య ఆధారాలను దాచు',
        viewEvidence: '▼ జ్యోతిష్య ఆధారాన్ని చూడండి',
        recommendedHomam: '🕉️ సూచించిన హోమం:',
        mantra: 'మంత్రం:',
      },
      Hindi: {
        activeDasha: '✦ सक्रिय दशा:',
        hideEvidence: '▲ ज्योतिषीय प्रमाण छिपाएं',
        viewEvidence: '▼ ज्योतिषीय आधार देखें',
        recommendedHomam: '🕉️ अनुशंसित हवन / होम:',
        mantra: 'मंत्र:',
      },
      Tamil: {
        activeDasha: '✦ தற்போதைய தசை:',
        hideEvidence: '▲ ஜோதிட ஆதாரங்களை மறைக்கவும்',
        viewEvidence: '▼ ஜோதிட அடிப்படையைக் காண்க',
        recommendedHomam: '🕉️ பரிந்துரைக்கப்பட்ட ஹோமம்:',
        mantra: 'மந்திரம்:',
      },
      Kannada: {
        activeDasha: '✦ ಪ್ರಸ್ತುತ ದಶೆ:',
        hideEvidence: '▲ ಜ್ಯೋತಿಷ್ಯ ಪುರಾವೆ ಮರೆಮಾಡಿ',
        viewEvidence: '▼ ಜ್ಯೋತಿಷ್ಯ ಆಧಾರ ನೋಡಿ',
        recommendedHomam: '🕉️ ಸೂಚಿಸಿದ ಹೋಮ:',
        mantra: 'ಮಂತ್ರ:',
      },
      Malayalam: {
        activeDasha: '✦ നിലവിലെ ദശ:',
        hideEvidence: '▲ ജ്യോതിഷ തെളിവുകൾ മറയ്ക്കുക',
        viewEvidence: '▼ ജ്യോതിഷ അടിസ്ഥാനം കാണുക',
        recommendedHomam: '🕉️ നിർദ്ദേശിച്ച ഹോമം:',
        mantra: 'മന്ത്രം:',
      },
      English: {
        activeDasha: '✦ Active Dasha:',
        hideEvidence: '▲ Hide Astrological Evidence',
        viewEvidence: '▼ View Astrological Basis',
        recommendedHomam: '🕉️ Recommended Homam:',
        mantra: 'Mantra:',
      },
    },
    uiLabels: {
      clearChatTitle: 'Start New Consultation?',
      clearChatMessage: 'This will clear the current chat history and start a fresh reading.',
      cancelLabel: 'Cancel',
      clearLabel: 'Start Fresh',
      signInModalTitle: 'Sign In to Ask AstroParihar AI',
      signInModalSubtitle: 'Sign in so we can personalize every prediction to your exact birth chart.',
      signInModalButton: 'Sign In Now',
      rechargeModalTitle: 'Low Wallet Balance',
      rechargeModalSubtitle: 'Your free prompts are used. Recharge your wallet to continue chatting with AI Astrologers.',
      rechargeModalButton: 'Recharge Wallet',
      selectModelTitle: 'Select AI Reasoning Engine',
      selectLanguageTitle: 'Select Consultation Language',
    },
    clarification: {
      shortLetterByLang: {
        English: 'Could you please clarify what you mean by "{query}"? Are you asking about your birth chart, career, marriage timing, or Vedic remedies?',
        Hindi: 'क्या आप स्पष्ट कर सकते हैं कि "{query}" से आपका क्या तात्पर्य है? क्या आप अपनी जन्म कुंडली, करियर, विवाह या वैदिक उपायों के बारे में पूछना चाहते हैं?',
        Telugu: 'దయచేసి "{query}" అంటే ఏమిటో స్పష్టం చేయగలరా? మీ జన్మ కుండలి, కెరీర్, వివాహం లేదా వేద పరిహారాల గురించి ఏదైనా అడగాలనుకుంటున్నారా?',
        Tamil: 'தயவுசெய்து "{query}" என்பதன் மூலம் நீங்கள் என்ன குறிப்பிடுகிறீர்கள் என்பதை விளக்க முடியுமா? உங்கள் ஜாதகம், தொழில், திருமணம் அல்லது பரிகாரங்கள் பற்றி கேட்க விரும்புகிறீர்களா?',
        Kannada: '"{query}" ಎಂಬುದರ ಅರ್ಥವೇನು ಎಂಬುದನ್ನು ದಯವಿಟ್ಟು ಸ್ಪಷ್ಟಪಡಿಸಬಹುದೇ? ನಿಮ್ಮ ಜನ್ಮ ಕುಂಡಲಿ, ವೃತ್ತಿ, ವಿವಾಹ ಅಥವಾ ಪರಿಹಾರಗಳ ಬಗ್ಗೆ ತಿಳಿಯಲು ಬಯಸುತ್ತೀರಾ?',
        Malayalam: '"{query}" എന്നതുകൊണ്ട് നിങ്ങൾ എന്താണ് ഉദ്ദേശിച്ചതെന്ന് ദയവായി വ്യക്തമാക്കാമോ? നിങ്ങളുടെ ജാതകം, തൊഴിൽ, വിവാഹം അല്ലെങ്കിൽ പരിഹാരങ്ങളെക്കുറിച്ചാണോ ചോദിക്കുന്നത്?',
      },
      voiceToTextByLang: {
        English: 'Do you mean "{query}" as a name, or is this a voice-to-text spelling? Could you please clarify what you would like to know about your astrology chart?',
        Hindi: 'क्या आप "{query}" किसी नाम के रूप में पूछ रहे हैं या यह वॉइस-टू-टेक्स्ट टाइपिंग है? कृपया स्पष्ट करें कि आप अपनी कुंडली के बारे में क्या जानना चाहते हैं।',
        Telugu: 'మీరు "{query}" అని ఒక పేరుగా అడుగుతున్నారా, లేదా మైక్ వాయిస్-టు-టెక్స్ట్ వల్ల అలా వచ్చిందా? దయచేసి మీ జ్యోతిష్య ప్రశ్నను మరింత స్పష్టంగా తెలియజేయండి.',
        Tamil: 'நீங்கள் "{query}" என்பதை ஒரு பெயராகக் கேட்கிறீர்களா அல்லது இது குரல் பதிவு எழுத்துப் பிழையா? உங்கள் ஜாதகம் பற்றி நீங்கள் என்ன தெரிந்து கொள்ள விரும்புகிறீர்கள் என்பதைத் தெளிவுபடுத்தவும்.',
        Kannada: 'ನೀವು "{query}" ಎಂಬುದನ್ನು ಹೆಸರಾಗಿ ಹೇಳುತ್ತಿದ್ದೀರಾ ಅಥವಾ ಇದು ವಾಯ್ಸ್-ಟು-ಟೆಕ್ಸ್ಟ್ ಅಕ್ಷರದೋಷವೇ? ನಿಮ್ಮ ಜಾತಕದ ಬಗ್ಗೆ ನೀವು ಏನು ತಿಳಿಯಲು ಬಯಸುತ್ತೀರಿ ಎಂದು ಸ್ಪಷ್ಟಪಡಿಸಿ.',
        Malayalam: 'നിങ്ങൾ "{query}" എന്നത് ഒരു പേരായി പറയുകയാണോ അതോ വോയ്‌സ്-ടു-ടെക്‌സ്‌റ്റ് ടൈപ്പിംഗ് പിഴവാണോ? നിങ്ങളുടെ ജാതകത്തെക്കുറിച്ച് എന്താണ് അറിയേണ്ടതെന്ന് ദയവായി വ്യക്തമാക്കാമോ?',
      },
      gibberishByLang: {
        English: 'I received "{query}", which looks like an accidental tap or unclear input. Please ask a clear question about your Kundli, career, marriage, or remedies.',
      },
      unrelatedByLang: {
        English: 'I noticed you asked "{query}". As {astroName}, I specialize in Vedic astrology, Janam Kundli, planetary transits, and sacred remedies. How may I guide your chart today?',
      },
    },
  },

  consultation: {
    connectingAiText: 'Connecting to AI Astrologer...',
    callingAstrologerText: 'Calling Astrologer... Waiting for acceptance',
    tabs: { stream: 'Live Call', chart: 'My Kundli' },
    defaultReplies: [
      'I can see the planetary positions clearly. Let me analyse this for you.',
      'Your question is very important. The stars indicate a significant period ahead.',
      'Based on your birth chart, I see strong Jupiter influence here.',
      'This is a favourable time for the matter you are asking about.',
    ],
    controlLabels: {
      mute: 'Mute',
      unmute: 'Unmute',
      speaker: 'Speaker',
      video: 'Camera',
      chat: 'Chat',
      language: 'Language',
      endCall: 'End',
      holdToSpeak: 'Hold to Speak',
      listening: 'Listening...',
      send: 'Send',
      close: 'Close',
    },
    uiLabels: {
      liveBadge: 'LIVE',
      balanceLabel: 'Balance',
      voiceInputTitle: 'Ask Your Astrologer',
      voiceInputPlaceholder: 'Type or speak your question...',
      endCallTitle: 'End Consultation?',
      endCallSubtitle: 'Ending the call will finalize billing and generate your Vedic consultation summary report.',
      endCallConfirm: 'End Call',
      endCallCancel: 'Stay on Call',
      lowBalanceTitle: 'Low Wallet Balance',
      lowBalanceSubtitle: 'Please recharge your wallet to continue this live consultation.',
      lowBalanceRechargeBtn: 'Recharge Wallet',
      reviewTitle: 'Rate Your Consultation',
      reviewSubtitle: 'Share how helpful your Vedic consultation was',
      reviewTags: [
        'Accurate Prediction 🎯',
        'Calm & Compassionate 🙏',
        'Clear Remedies 🕉️',
        'Deep Kundli Analysis 📜',
      ],
      reviewCommentPlaceholder: 'Write a short review (optional)...',
      reviewSubmitBtn: 'Submit Review',
      reviewSkipBtn: 'Return Home',
      listenLabel: 'Listen',
      stopLabel: 'Stop',
    },
  },

  birthProfiles: {
    headerTitle: 'Birth Profiles',
    infoBanner:
      'Manage family birth charts. Switching the active profile recalibrates your Kundli, daily horoscope, and remedies across the entire app.',
    emptyText: 'No birth profiles yet. Add one below!',
    activeBadge: 'Active',
    popularCities: [
      'New Delhi, India',
      'Mumbai, India',
      'Bengaluru, India',
      'Hyderabad, India',
      'Chennai, India',
      'Kolkata, India',
      'London, UK',
      'New York, USA',
    ],
    fieldLabels: {
      dob: 'Date of Birth',
      time: 'Birth Time',
      place: 'Birth Place',
      rashi: 'Rashi',
      nakshatra: 'Nakshatra',
      viewKundli: 'View Kundli Chart',
      addProfileBtn: 'Add Family Birth Profile',
    },
    menuLabels: {
      setActive: 'Set as Active Chart',
      edit: 'Edit Profile',
      delete: 'Delete',
    },
    sheet: {
      addTitle: 'Add Family Birth Chart',
      editTitle: 'Edit Birth Profile',
      subtitle: 'Sacred Vedic kundli details',
      relationshipLabel: 'Relationship',
      fullNameLabel: 'Full Name',
      fullNamePlaceholder: 'e.g. Rahul Sharma',
      dobLabel: 'Birth Date',
      dobPlaceholder: 'Select Date',
      timeLabel: 'Birth Time',
      timePlaceholder: 'Select Time',
      placeLabel: 'Birth Place (City, State, Country)',
      placePlaceholder: 'Enter birth place (e.g. Hyderabad, Guntur)',
      savingLabel: 'Calculating Chart...',
      saveBtn: 'Save Birth Profile',
      updateBtn: 'Update Profile Details',
    },
  },

  kundliReports: {
    headerTitle: 'Reports & Guides Vault',
    tabs: {
      myReports: 'My Reports',
      mahadashaGuides: 'Mahadasha Guides',
      purchasedGuides: 'Purchased Guides',
    },
    walletBalancePrefix: 'Wallet Balance:',
    addMoneyLabel: '+ Add Money',
    signInReportsTitle: 'Please Sign In to Access Your Reports',
    signInReportsSubtitle:
      'All your personalized Vedic reports, Vastu analyses, and Parihara plans generated across the website and mobile app will appear here.',
    signInButton: 'Sign In Now',
    syncingReportsText: 'Syncing reports from AstroParihar Cloud...',
    emptyReportsTitle: 'No Generated Reports Yet',
    emptyReportsSubtitle:
      'Generate deep Vedic remedies, Vastu analysis, or personalized Parihara plans from the Services tab to view them here.',
    exploreServicesBtn: 'Explore Vedic Services',
    latestReportBadge: '✨ LATEST CONSULTATION REPORT',
    readyBadge: 'Ready',
    viewReportBtn: 'View Report',
    shareBtn: 'Share',
    unlockedBadge: 'UNLOCKED ✓',
    lifetimeAccessBadge: 'LIFETIME ACCESS ✓',
    pdfGuideLabel: 'PDF & In-App Guide',
    purchasedLabel: 'Purchased',
    readGuideBtn: 'Read Guide',
    pdfBtn: 'PDF',
    downloadPdfBtn: 'Download PDF',
    readInAppBtn: 'Read In-App',
    unlockPrefix: 'Unlock •',
    processingLabel: 'Processing...',
    signInPurchasedTitle: 'Please Sign In to Access Your Purchased Guides',
    emptyPurchasedTitle: 'No Purchased Guides Yet',
    emptyPurchasedSubtitle:
      'Unlock any Rahu or Sani Mahadasha guide from the Official Guides tab to read anytime with lifetime access.',
    exploreGuidesBtn: 'Explore Mahadasha Guides',
    purchaseModal: {
      badge: '🕉️ OFFICIAL VEDIC MAHADASHA PROTOCOL',
      priceLabel: 'Protocol Price',
      balanceLabel: 'Current Wallet Balance',
      afterBalanceLabel: 'Balance After Purchase',
      features: [
        '✓ Complete In-App Reader with all Chapters',
        '✓ Downloadable & Shareable High-Res PDF Guide',
        '✓ Lifetime Access across all your devices & sessions',
        '✓ Immediate Activation in your Purchased Guides Vault',
      ],
      confirmPrefix: 'Confirm & Unlock •',
      unlockingLabel: 'Unlocking Guide...',
      cancelLabel: 'Cancel',
      insufficientPrefix: 'Insufficient Balance: Needs',
      rechargeBtn: 'Recharge Wallet Now ↗',
    },
    reportViewer: {
      verifiedLabel: 'Verified Vedic Ephemeris Analysis',
      generatedOnPrefix: 'Generated on',
      sharePdfBtn: 'Share PDF',
      summaryHeading: 'EXECUTIVE SUMMARY',
      analysisHeading: 'PLANETARY & LAGNA ANALYSIS',
      remediesHeading: 'PRESCRIBED VEDIC REMEDIES & PARIHARAS',
      closeBtn: 'Close Report',
    },
    reader: {
      chapterPrefix: 'Chapter',
      ofLabel: 'of',
      chShort: 'Ch.',
      mantraHeading: '🕉️ CONSECRATED SANSKRIT MANTRA',
      meaningPrefix: 'Meaning:',
      instructionsPrefix: 'Instructions:',
      prevPrefix: '← Chapter',
      nextPrefix: 'Chapter',
      finishBtn: 'Finish Reading ✓',
    },
  },

  matchReports: {
    headerTitle: 'Match Reports',
    newMatchButton: 'New Match',
    heroTitle: 'Ashtakoot Kundli Matching',
    heroSubtitle: 'Vedic 36 Guna Milan analysis for marital longevity, mental harmony, and progeny.',
    signInTitle: 'Please Sign In to View Match Reports',
    signInSubtitle: 'Sign in to access your saved 36-Guna Kundli compatibility reports and Ashtakoot breakdowns.',
    signInButton: 'Sign In to Your Account',
    loadingText: 'Loading your compatibility reports...',
    emptyTitle: 'No Match Reports Generated Yet',
    emptySubtitle:
      'Enter birth details for both partners in the Match Kundli calculator to generate a 36-Guna Ashtakoot compatibility dossier.',
    emptyButton: 'Match New Kundli ✨',
    statusLabels: { excellent: 'Excellent', good: 'Good', remedies: 'Needs Remedies' },
    viewGunaBtn: 'View Guna Milan',
    shareDownloadBtn: 'Share / Download',
    sheet: {
      totalMatchPrefix: 'Total Match:',
      breakdownHeading: 'Ashtakoot 8-Koota Breakdown',
      remediesHeading: 'Prescribed Matrimonial Remedies:',
      defaultRemedies: [
        'Perform Gauri-Shankar Puja before wedding muhurat',
        'Jointly recite Vishnu Sahasranama on Thursdays',
      ],
      closeBtn: 'Close',
      exportPdfBtn: 'Export / Share PDF',
    },
  },

  savedAstrologers: {
    headerTitle: 'Saved Astrologers',
    findMoreLabel: 'Find More',
    loadingText: 'Loading saved astrologers...',
    chipSaved: 'Saved',
    chipOnline: 'Online Now',
    emptyTitle: 'No Saved Astrologers Yet',
    emptySubtitle: 'Bookmark your trusted Vedic Acharyas\nfor fast 1-tap chat and live calls.',
    emptyButton: 'Browse All Astrologers',
    recommendedHeading: 'Recommended Vedic Astrologers',
    chatButton: 'Chat',
    callButton: 'Call',
    removedToastTemplate: 'Removed {name} from saved astrologers',
    savedToastTemplate: 'Saved {name} to bookmarks!',
  },

  consultationHistory: {
    headerTitle: 'Consultation History',
    tabs: { allSessions: 'All Sessions', analytics: 'Analytics' },
    summaryLabels: { sessions: 'Sessions', talkTime: 'Talk Time', totalSpent: 'Total Spent' },
    syncingText: 'Syncing Consultations from AstroParihar Cloud...',
    signInTitle: 'Sign In Required',
    signInSubtitle: 'Please sign in to view your verified consultation logs, voice calls, chats, and AI consultations.',
    signInButton: 'Sign In to AstroParihar',
    emptyTitle: 'No Consultations Found',
    emptySubtitle: 'You have not conducted any consultations yet. Connect with our expert Vedic Astrologers or consult our AI Guides.',
    talkAstrologerBtn: 'Talk to Astrologer',
    tryAiBtn: 'Try AI Astrologer',
    topicPrefix: 'Topic:',
    freeLabel: 'Free',
    viewReportBtn: 'View Report',
    consultAiBtn: 'Consult AI',
    bookAgainBtn: 'Book Again',
    analytics: {
      modesTitle: 'Consultation Modes',
      inquiriesTitle: 'Key Life Inquiries',
      modeLabels: { chat: 'Chat', voice: 'Voice Call', video: 'Video Call', aiChat: 'AI Chat' },
      inquiryLabels: ['Career & Job', 'Marriage & Love', 'Dosha & Parihar', 'Health & Wealth'],
    },
    reportModal: {
      title: 'Consultation Summary Report',
      verifiedBadge: 'Verified Ready',
      summaryHeading: 'EXECUTIVE ASTROLOGICAL SUMMARY',
      diagnosisHeading: 'COSMIC DIAGNOSIS & PLANETARY SYNTHESIS',
      remediesHeading: 'PRESCRIBED VEDIC PARIHARAM & REMEDIES',
      openReportsBtn: 'Open in My Reports',
      sharePdfBtn: 'Share PDF',
    },
  },

  wallet: {
    headerTitle: 'Wallet',
    tabs: { wallet: 'Wallet', transactions: 'Transactions' },
    inrPillLabel: '₹ INR (India)',
    usdPillLabel: '$ USD (Abroad)',
    availableBalanceLabel: 'Available Balance',
    statLabels: { totalAdded: 'Total Added', totalSpent: 'Total Spent', bonusEarned: 'Bonus Earned' },
    addMoneyHeading: 'Add Money',
    addButtonTemplate: 'Add {amount} to Wallet',
    processingLabel: 'Processing Payment...',
    paymentMethodsHeading: 'Payment Methods',
    paymentMethodsInr: [
      { emoji: '📱', title: 'UPI (Google Pay, PhonePe, Paytm)', subtitle: 'Instant recharge via any UPI app', method: 'UPI' },
      { emoji: '💳', title: 'Credit / Debit Card', subtitle: 'Visa, Mastercard, RuPay', method: 'Card' },
      { emoji: '🏦', title: 'Net Banking', subtitle: 'All major Indian banks supported', method: 'Net Banking' },
    ],
    paymentMethodsUsd: [
      { emoji: '💳', title: 'Credit / Debit Card (Stripe)', subtitle: 'Visa, Mastercard, American Express', method: 'Card' },
      { emoji: '🌐', title: 'PayPal / Apple Pay / Google Pay', subtitle: 'Instant global checkout', method: 'Digital Wallet' },
      { emoji: '🏦', title: 'International Bank Transfer', subtitle: 'Direct international wire', method: 'Wire' },
    ],
    couponCard: {
      enabled: true,
      emoji: '🎟️',
      title: 'Have a Coupon?',
      subtitle: 'Use code ASTRO50 for extra bonus',
      code: 'ASTRO50',
      buttonLabel: 'Apply',
      bonusInr: 50,
      appliedToastTemplate: 'Coupon {code} applied! {bonus} extra bonus on next recharge',
    },
    recentTransactionsHeading: 'Recent Transactions',
    emptyTxTitle: 'No Transactions Yet',
    emptyTxAuthSubtitle: 'Your recharge and consultation billing records will show here.',
    emptyTxGuestSubtitle: 'Sign in to access your wallet transactions and history.',
    creditedLabel: 'Credited',
    debitedLabel: 'Debited',
    checkoutSheet: {
      inrGatewayLabel: 'Razorpay Secure Checkout',
      usdGatewayLabel: 'Stripe Global Checkout',
      sslBadge: '🔒 256-Bit SSL',
      methodsInr: [
        { label: '📱 Google Pay / PhonePe / Paytm (UPI)', method: 'UPI' },
        { label: '💳 Credit / Debit Card (Visa, RuPay)', method: 'Card' },
        { label: '🏦 Net Banking (SBI, HDFC, ICICI, Axis)', method: 'Net Banking' },
      ],
      methodsUsd: [
        { label: '💳 Credit / Debit Card (Visa, Master, Amex)', method: 'Card' },
        { label: '🌐 PayPal / Apple Pay / Google Pay', method: 'Digital Wallet' },
        { label: '🏦 International Wire Transfer', method: 'Wire' },
      ],
    },
  },

  astrologerLogin: {
    appBarTitle: 'Astrologer Portal',
    step1Kicker: 'Welcome to Astrologer Portal',
    step1Title: 'Sign In for Astrologers',
    step1Subtitle: 'Enter your registered mobile number to receive a 4-digit verification code.',
    step2Kicker: 'OTP Verification',
    step2Title: 'Enter Verification OTP',
    step2SubtitlePrefix: 'Verification code sent to',
    mobileLabel: 'Registered Mobile Number',
    mobilePlaceholder: '98765 43210',
    adminSupportEmail: 'astropariharuk@gmail.com',
    countryCodes: [
      { code: '+91', country: 'India', flag: '🇮🇳' },
      { code: '+1', country: 'USA / Canada', flag: '🇺🇸' },
      { code: '+44', country: 'UK', flag: '🇬🇧' },
      { code: '+971', country: 'UAE', flag: '🇦🇪' },
      { code: '+61', country: 'Australia', flag: '🇦🇺' },
      { code: '+65', country: 'Singapore', flag: '🇸🇬' },
      { code: '+977', country: 'Nepal', flag: '🇳🇵' },
      { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
    ],
    portalLanguages: [
      { code: 'English', label: 'English' },
      { code: 'Hindi', label: 'हिन्दी (Hindi)' },
      { code: 'Telugu', label: 'తెలుగు (Telugu)' },
      { code: 'Tamil', label: 'தமிழ் (Tamil)' },
      { code: 'Kannada', label: 'ಕನ್ನಡ (Kannada)' },
      { code: 'Malayalam', label: 'മലയാളം (Malayalam)' },
    ],
    sendOtpBtn: 'Send Verification OTP',
    sendingOtpBtn: 'Checking & Sending OTP...',
    notOnboardedPrompt: 'Not an onboarded astrologer yet?',
    applyButton: 'Apply to Join Astrologer Panel →',
    resendPrefix: 'Resend OTP in',
    resendBtn: 'Resend Verification OTP',
    verifyBtn: 'Verify & Enter Portal',
    verifyingBtn: 'Verifying...',
    editMobileBtn: '← Edit mobile number',
    banners: {
      notRegisteredTitle: 'Account Not Found — You are not a registered astrologer',
      applyNowBtn: 'Apply to Join Panel',
      contactAdminBtn: 'Contact Admin',
      pendingTitle: 'Application Pending Approval',
      pendingNote:
        'Our Vedic panel typically reviews applications within 24–48 hours. Once approved, you can log in directly using this mobile number.',
      suspendedTitle: 'Account Suspended by Admin',
      deactivatedTitle: 'Account Deactivated by Admin',
      rejectedTitle: 'Application Rejected',
      rejectedNote:
        'Your astrologer application was reviewed and declined by the administrative committee. If you feel this was in error, please contact admin support.',
      contactAdminSupportBtn: 'Contact Admin Support',
    },
    successDialog: {
      namastePrefix: 'Namaste,',
      namasteSuffix: 'Ji! 🙏',
      subtitle: 'OTP Verified Successfully. Entering your Astrologer Portal...',
    },
    languageSheetTitle: 'Select Language',
  },

  astrologerApply: {
    appBarTitle: 'Join Astrologer Panel',
    heroSubtitle: 'Complete our 5-step Vedic verification & AI evaluation to join the AstroParihar panel.',
    phoneCodes: [
      { code: '+91', label: '🇮🇳 +91 (India)' },
      { code: '+1', label: '🇺🇸 +1 (US/CA)' },
      { code: '+44', label: '🇬🇧 +44 (UK)' },
      { code: '+971', label: '🇦🇪 +971 (UAE)' },
      { code: '+61', label: '🇦🇺 +61 (AU)' },
      { code: '+65', label: '🇸🇬 +65 (SG)' },
    ],
    strongestAreas: [
      'Marriage & Relationships',
      'Career & Business',
      'Health & Medical Jyotish',
      'Wealth & Finance',
      'Progeny & Education',
    ],
    specialisations: [
      'Vedic Astrology',
      'KP Astrology',
      'Nadi Astrology',
      'Lal Kitab',
      'Tarot',
      'Numerology',
      'Palmistry',
      'Vastu',
      'Face Reading',
      'Reiki',
      'Angel Reading',
      'Prashna',
      'Psychic Reading',
      'Pendulum Dowsing',
      'Other',
    ],
    consultationLanguages: [
      'Hindi',
      'English',
      'Telugu',
      'Tamil',
      'Kannada',
      'Malayalam',
      'Marathi',
      'Gujarati',
      'Bengali',
      'Punjabi',
      'Odia',
      'Sanskrit',
      'Other',
    ],
    supportingDocCategories: [
      'Astrology Certificate / Degree',
      'Experience Letter',
      'Gurukul / Lineage Certificate',
      'Business / Registration Proof',
      'Other Supporting Document',
    ],
    proctorBannerText: 'AI Anti-Cheating Proctor Active • Do not switch apps during assessment',
    proctorDisqualifiedTitle: 'Assessment Terminated',
    proctorDisqualifiedMessage:
      'Your assessment was automatically terminated due to 3 proctoring violations (switching apps during the live exam).',
    submitButtonLabel: 'Submit Final Application',
    languageSheetTitle: 'Select Assessment Language',
  },

  astrologerDashboard: {
    headerTitle: 'Astrologer Dashboard',
    mainTabs: {
      overview: 'Overview',
      consultations: 'Consults',
      earnings: 'Earnings',
      profile: 'Profile',
    },
    consultSubTabs: {
      requests: 'Requests',
      active: 'Active',
      history: 'History',
    },
    primarySkillOptions: [
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
    ],
    onlineLabel: 'Online',
    offlineLabel: 'Offline',
    directoryVisibleLabel: 'Visible on Customer Directory',
    directoryHiddenLabel: 'Hidden from Directory',
    probationBannerTitle: 'Probation Audit Track',
    fullTimeBannerTitle: 'Verified Full-Time Acharya',
    withdrawButtonLabel: 'Withdraw Funds',
    saveProfileButtonLabel: 'Save Profile & Directory Changes',
    savingProfileLabel: 'Saving Changes...',
    logoutModalTitle: 'Sign Out of Astrologer Portal?',
    logoutModalMessage: 'You will be marked Offline and signed out of your Astrologer Dashboard on this device.',
    logoutConfirmBtn: 'Sign Out',
    logoutCancelBtn: 'Cancel',
    blockedSuspendedTitle: 'Account Suspended',
    blockedDeactivatedTitle: 'Account Deactivated',
    blockedReturnLoginBtn: 'Return to Astrologer Login',
    blockedContactSupportBtn: 'Contact Admin Support',
  },

  cmsMicroLabels: {
    notificationsInbox: {
      allTab: 'All',
      unreadTab: 'Unread',
      readAllBtn: 'Read All',
      clearBtn: 'Clear',
      clearAllBtn: 'Clear All Notifications',
      clearDialogTitle: 'Clear All Notifications?',
      clearDialogMessage: 'This will remove all current notifications from your inbox.',
      cancelBtn: 'Cancel',
      confirmClearBtn: 'Clear All',
      syncingText: 'Syncing celestial alerts...',
      tapToViewText: 'Tap to view details',
      settingsBtnLabel: 'Settings',
      enableBtnLabel: 'Enable',
    },
    notificationSettings: {
      settingsBtnLabel: 'Settings',
      allowBtnLabel: 'Allow',
      sendingTestLabel: 'Sending Test Alert...',
    },
    preferences: {
      languages: [
        { name: 'Telugu', native: 'తెలుగు (Telugu)', flag: '🇮🇳' },
        { name: 'Hindi', native: 'हिन्दी (Hindi)', flag: '🇮🇳' },
        { name: 'Tamil', native: 'தமிழ் (Tamil)', flag: '🇮🇳' },
        { name: 'Kannada', native: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
        { name: 'Malayalam', native: 'മലയാളം (Malayalam)', flag: '🇮🇳' },
        { name: 'English', native: 'English (EN)', flag: '🇬🇧' },
      ],
      accents: [
        { name: 'Sacred Gold', displayName: 'Sacred Gold', color: '#C9A84C' },
        { name: 'Cosmic Purple', displayName: 'Cosmic Purple', color: '#9370DB' },
        { name: 'Divine Red', displayName: 'Divine Red', color: '#713B32' },
        { name: 'Celestial Blue', displayName: 'Celestial Blue', color: '#4FC3F7' },
        { name: 'Emerald', displayName: 'Emerald', color: '#2D9E6B' },
        { name: 'Saffron', displayName: 'Saffron', color: '#FFB347' },
      ],
    },
    helpCentre: {
      faqsSuffix: 'FAQs',
      showAllLabel: '✕ Show All',
    },
    contactSupport: {
      submittingLabel: 'Submitting Ticket...',
      validationToast: 'Please enter both Subject and Description to submit your ticket.',
    },
    muhurat: {
      tithiLabel: 'Tithi',
      nakshatraLabel: 'Nakshatra',
      yogaLabel: 'Yoga',
      karanaLabel: 'Karana',
      varaLabel: 'Vara',
      loadingText: 'Loading...',
      todayPrefix: 'Today:',
      calculatingText: 'Calculating...',
    },
  },
};

export type AppScreensCmsSectionKey = Exclude<keyof AppScreensCmsConfig, 'updatedAt'>;

/**
 * Recursive plain-object deep merge where arrays are replaced cleanly by incoming non-empty arrays,
 * while nested objects preserve defaults for any newly introduced fields.
 */
function deepMergePlain(base: any, override: any): any {
  if (override === undefined || override === null) return base;
  if (Array.isArray(base)) {
    return Array.isArray(override) ? override : base;
  }
  if (typeof base === 'object' && base !== null && typeof override === 'object' && !Array.isArray(override)) {
    const out: Record<string, any> = { ...base };
    for (const key of Object.keys(override)) {
      if (override[key] !== undefined) {
        out[key] = key in base ? deepMergePlain(base[key], override[key]) : override[key];
      }
    }
    return out;
  }
  return override;
}

export function mergeAppScreensCms(partial?: Partial<AppScreensCmsConfig> | null): AppScreensCmsConfig {
  if (!partial || typeof partial !== 'object') {
    return DEFAULT_APP_SCREENS_CMS;
  }
  return deepMergePlain(DEFAULT_APP_SCREENS_CMS, partial) as AppScreensCmsConfig;
}
