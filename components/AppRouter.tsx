import React, { Suspense, lazy } from "react";
import { 
  Screen, 
  RunSession, 
  WeatherData, 
  Language, 
  UnitSystem,
  AudioCuesSettings 
} from "../types";

// Lazy-loaded components
const Dashboard = lazy(() => import("./Dashboard"));
const RunScreen = lazy(() => import("./RunScreen"));
const HistoryScreen = lazy(() => import("./HistoryScreen"));
const SummaryScreen = lazy(() => import("./SummaryScreen"));
const ProfileScreen = lazy(() => import("./ProfileScreen"));
const CalorieScreen = lazy(() => import("./CalorieDeficitProgram"));
const AboutScreen = lazy(() => import("./AboutScreen"));
const TermsScreen = lazy(() => import("./TermsScreen"));
const WorkoutScreen = lazy(() => import("./WorkoutScreen"));
const ChatScreen = lazy(() => import("./ChatScreen"));

const LoadingScreen = () => (
  <div className="loader-container">
    <div className="loader">
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
    </div>
  </div>
);

export interface AppRouterProps {
  currentScreen: Screen;
  t: any;
  userName: string;
  weather: WeatherData | null;
  isOnline: boolean;
  isStable: boolean;
  profilePhoto: string | null;
  runHistory: RunSession[];
  unitSystem: UnitSystem;
  language: Language;
  isWeatherLoading: boolean;
  isInitialLoad: boolean;
  isRefreshing: boolean;
  updateInfo: any;
  dashboardUpdateSeen: boolean;
  settingsUpdateSeen: boolean;
  currentLocation: any;
  path: any[];
  isRunning: boolean;
  isFollowingUser: boolean;
  isZenMode: boolean;
  isGPSSearching: boolean;
  elapsedTime: number;
  distance: number;
  currentPace: number;
  totalGain: number;
  isSheetExpanded: boolean;
  gpsError: string | null;
  selectedSession: RunSession | null;
  isConfirmingBack: boolean;
  isDarkMode: boolean;
  appVersion: string;
  userProfile: any;
  audioCues: AudioCuesSettings;
  selectedRunType: string;
  selectedPresetName: string | null;
  targetPace: number | null;
  showExitToast: boolean;
  isExportDialogOpen: boolean;
  exportDialogMsg: string;
  exportDialogType: "success" | "danger" | "info";
  isImportDialogOpen: boolean;
  importDialogMsg: string;
  importDialogType: "success" | "danger" | "info";
  sheetVelocity: number;
  sheetHeightPx: number;
  hasSeenTour: boolean;
  setHasSeenTour: (seen: boolean) => void;

  // Handlers
  onNavigate: (screen: Screen) => void;
  onBack: () => void;
  onRefresh: () => Promise<void>;
  setDashboardUpdateSeen: (seen: boolean) => void;
  setSettingsUpdateSeen: (seen: boolean) => void;
  onHistorySelect: (session: RunSession) => void;
  onDeleteSession: (id: string) => void;
  onSaveWorkout: (workoutData: any) => void;
  onExportData: () => Promise<void>;
  onImportData: (file: File) => void;
  onProfileUpdate: (shouldResetHistory?: boolean | 'workouts_only') => void;
  onAckUpdate?: () => void;
  onToggleFollow: () => void;
  onToggleZenMode: () => void;
  onStartRun: () => void;
  onToggleRun: () => void;
  onFinishRun: () => void;
  onConfirmCancelRun: () => void;
  onCloseConfirmBack: () => void;
  onToggleSheet: () => void;
  getTranslatedRunType: (type: string) => string;
  setUserName: (name: string) => void;
  setProfilePhoto: (photo: string | null) => void;
  setIsDarkMode: (isDark: boolean) => void;
  setLanguage: (lang: Language) => void;
  setUnitSystem: (unit: UnitSystem) => void;
  setAudioCues: (settings: AudioCuesSettings) => void;
  setShowExitToast: (show: boolean) => void;
  setExportDialogOpen: (open: boolean) => void;
  setImportDialogOpen: (open: boolean) => void;
  setIsSheetExpanded: (expanded: boolean) => void;
  setSheetVelocity: (v: number) => void;
  setSheetHeightPx: (h: number) => void;

  // Refs & Layout
  sheetRef: React.RefObject<HTMLDivElement | null>;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

const AppRouter: React.FC<AppRouterProps> = (props) => {
  const { currentScreen, t } = props;

  return (
    <Suspense fallback={<LoadingScreen />}>
      {currentScreen === "dashboard" && (
        <Dashboard
          t={t}
          userName={props.userName}
          weather={props.weather}
          isOnline={props.isOnline}
          isStable={props.isStable}
          profilePhoto={props.profilePhoto}
          runHistory={props.runHistory}
          unitSystem={props.unitSystem}
          language={props.language}
          isLoading={props.isInitialLoad || props.isWeatherLoading}
          isRefreshing={props.isRefreshing}
          updateInfo={props.updateInfo}
          hasUpdate={props.updateInfo?.hasUpdate}
          onNavigate={props.onNavigate}
          onRefresh={props.onRefresh}
          onOpenProfile={() => props.onNavigate("profile")}
          onNavigateHistory={() => props.onNavigate("history")}
          onPrepareRun={() => props.onNavigate("run")}
          onStartWorkout={() => props.onNavigate("workout")}
          onHistorySelect={props.onHistorySelect}
          getTranslatedRunType={props.getTranslatedRunType}
          sheetRef={props.sheetRef}
          isSheetExpanded={props.isSheetExpanded}
          onToggleSheet={props.onToggleSheet}
          onTouchStart={props.onTouchStart}
          onTouchMove={props.onTouchMove}
          onTouchEnd={props.onTouchEnd}
          sheetVelocity={props.sheetVelocity}
          sheetHeightPx={props.sheetHeightPx}
          isDarkMode={props.isDarkMode}
          hasSeenTour={props.hasSeenTour}
          setHasSeenTour={props.setHasSeenTour}
        />
      )}

      {currentScreen === "run" && (
        <RunScreen
          t={t}
          unitSystem={props.unitSystem}
          currentLocation={props.currentLocation}
          path={props.path}
          isRunning={props.isRunning}
          isFollowingUser={props.isFollowingUser}
          isZenMode={props.isZenMode}
          isGPSSearching={props.isGPSSearching}
          elapsedTime={props.elapsedTime}
          distance={props.distance}
          currentPace={props.currentPace}
          totalGain={props.totalGain}
          isSheetExpanded={props.isSheetExpanded}
          gpsError={props.gpsError}
          onBack={props.onBack}
          onToggleFollow={props.onToggleFollow}
          onToggleZenMode={props.onToggleZenMode}
          onToggleRun={props.onToggleRun}
          onFinishRun={props.onFinishRun}
          isConfirmingBack={props.isConfirmingBack}
          onCloseConfirmBack={props.onCloseConfirmBack}
          onConfirmCancelRun={props.onConfirmCancelRun}
          onStartRun={props.onStartRun}
          onToggleSheet={props.onToggleSheet}
          selectedRunType={props.selectedRunType}
          selectedPresetName={props.selectedPresetName}
          targetPace={props.targetPace}
          getTranslatedRunType={props.getTranslatedRunType}
          isDarkMode={props.isDarkMode}
        />
      )}

      {currentScreen === "history" && (
        <HistoryScreen
          t={t}
          runHistory={props.runHistory}
          unitSystem={props.unitSystem}
          onBack={props.onBack}
          onHistorySelect={props.onHistorySelect}
          onDeleteSession={props.onDeleteSession}
          onExportData={props.onExportData}
          onImportData={props.onImportData}
          getTranslatedRunType={props.getTranslatedRunType}
          language={props.language}
        />
      )}

      {currentScreen === "summary" && (
        <SummaryScreen
          t={t}
          session={props.selectedSession!}
          unitSystem={props.unitSystem}
          language={props.language}
          onBack={props.onBack}
          userName={props.userName}
          profilePhoto={props.profilePhoto}
        />
      )}

      {currentScreen === "profile" && (
        <ProfileScreen
          t={t}
          userName={props.userName}
          profilePhoto={props.profilePhoto}
          isDarkMode={props.isDarkMode}
          language={props.language}
          unitSystem={props.unitSystem}
          audioCues={props.audioCues}
          appVersion={props.appVersion}
          updateInfo={props.updateInfo}
          onBack={props.onBack}
          setUserName={props.setUserName}
          setProfilePhoto={props.setProfilePhoto}
          setIsDarkMode={props.setIsDarkMode}
          setLanguage={props.setLanguage}
          setUnitSystem={props.setUnitSystem}
          setAudioCues={props.setAudioCues}
          onProfileUpdate={props.onProfileUpdate}
          onAckUpdate={props.onAckUpdate}
          onOpenAbout={() => props.onNavigate("about")}
          customDistanceUnit={props.unitSystem === "metric" ? "km" : "mi"}
          setCustomDistanceUnit={() => {}} // Not in App state yet
          customAltitudeUnit={props.unitSystem === "metric" ? "m" : "ft"}
          setCustomAltitudeUnit={() => {}} // Not in App state yet
          paceZones={[]} // Not in App state yet
          setPaceZones={() => {}} // Not in App state yet
          onClearCache={() => {}} // Not in App state yet
        />
      )}

      {currentScreen === "calorie" && (
        <CalorieScreen
          t={t}
          onBack={props.onBack}
          userProfile={props.userProfile}
          onProfileUpdate={props.onProfileUpdate}
        />
      )}

      {currentScreen === "workout" && (
        <WorkoutScreen
          t={t}
          onBack={props.onBack}
          onSaveWorkout={props.onSaveWorkout}
          onOpenCalorie={() => props.onNavigate("calorie")}
          onProfileUpdate={props.onProfileUpdate}
          runHistory={props.runHistory}
        />
      )}

      {currentScreen === "about" && (
        <AboutScreen
          t={t}
          onBack={props.onBack}
          onNavigate={props.onNavigate}
          appVersion={props.appVersion}
        />
      )}

      {currentScreen === "terms" && (
        <TermsScreen
          t={t}
          onBack={props.onBack}
        />
      )}

      {currentScreen === "chatbot" && (
        <ChatScreen
          t={t}
          language={props.language}
          userName={props.userName}
          onBack={props.onBack}
          isDarkMode={props.isDarkMode}
        />
      )}
    </Suspense>
  );
};

export default AppRouter;
