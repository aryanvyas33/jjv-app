import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../lib/i18n';
import {
  X,
  Camera,
  Home,
  PlusCircle,
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  Upload,
  Check,
  AlertTriangle,
  Sparkles,
  Trash2,
  Globe
} from 'lucide-react';
import { compressImage } from '../lib/storage';

export default function MobileSimulatorModal({ isOpen, onClose, animals, onAddAnimal }) {
  if (!isOpen) return null;

  const { lang: globalLang, toggleLanguage: toggleGlobalLang } = useTranslation();
  const [mobileLang, setMobileLang] = useState(globalLang || 'hi'); // 'hi' or 'en'
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home', 'dogs', 'cows', 'add', 'detail'
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  // Synchronize if global language toggle is used outside
  useEffect(() => {
    if (globalLang) {
      setMobileLang(globalLang);
    }
  }, [globalLang]);

  const toggleMobileLang = () => {
    const next = mobileLang === 'hi' ? 'en' : 'hi';
    setMobileLang(next);
    if (toggleGlobalLang && next !== globalLang) {
      toggleGlobalLang();
    }
  };

  // New rescue form state for mobile
  const [mobForm, setMobForm] = useState({
    animal_type: 'dog',
    name: '',
    date_of_rescue: new Date().toISOString().split('T')[0],
    location_of_rescue: '',
    condition_at_rescue: 'Moderate',
    treatment_details: '',
    recovery_time: '',
    status: 'Under Treatment',
    before_image_url: null,
    after_image_url: null
  });

  // Live Camera state
  const [activeCameraType, setActiveCameraType] = useState(null); // 'before' | 'after' | null
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' (back) | 'user' (front)
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputBeforeRef = useRef(null);
  const fileInputAfterRef = useRef(null);

  const dogs = animals.filter((a) => a.animal_type === 'dog');
  const cows = animals.filter((a) => a.animal_type === 'cow');

  // Search & Filter state for Dogs and Cows lists in simulator
  const [mobDogSearch, setMobDogSearch] = useState('');
  const [mobDogStatusFilter, setMobDogStatusFilter] = useState('All');
  const [mobCowSearch, setMobCowSearch] = useState('');
  const [mobCowStatusFilter, setMobCowStatusFilter] = useState('All');

  const filterMobList = (list, query, status) => {
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

  const filteredMobDogs = filterMobList(dogs, mobDogSearch, mobDogStatusFilter);
  const filteredMobCows = filterMobList(cows, mobCowSearch, mobCowStatusFilter);

  const mobDogCounts = {
    all: dogs.length,
    underTreatment: dogs.filter((d) => d.status === 'Under Treatment').length,
    critical: dogs.filter((d) => d.status === 'Critical').length,
    recovered: dogs.filter((d) => d.status === 'Recovered').length
  };

  const mobCowCounts = {
    all: cows.length,
    underTreatment: cows.filter((c) => c.status === 'Under Treatment').length,
    critical: cows.filter((c) => c.status === 'Critical').length,
    recovered: cows.filter((c) => c.status === 'Recovered').length
  };

  const MOB_STATUS_CHIPS = [
    { key: 'All', labelEn: 'All', labelHi: 'सभी', color: '#6b94b8' },
    { key: 'Under Treatment', labelEn: 'Under Treatment', labelHi: 'उपचाराधीन', color: '#c9a355' },
    { key: 'Critical', labelEn: 'Critical', labelHi: 'गंभीर', color: '#b55e5e' },
    { key: 'Recovered', labelEn: 'Recovered', labelHi: 'स्वस्थ', color: '#c27a66' }
  ];

  // Start hardware camera stream
  const startCamera = async (type, facing = 'environment') => {
    setActiveCameraType(type);
    setCameraFacing(facing);
    setCameraError(null);
    setCameraLoading(true);

    // Stop existing stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        mobileLang === 'hi'
          ? 'कैमरा API इस ब्राउज़र में उपलब्ध नहीं है। कृपया फ़ाइल अपलोड विकल्प का उपयोग करें।'
          : 'Live Camera API not supported in this browser. Please use the file upload option.'
      );
      setCameraLoading(false);
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('High-res camera constraint failed, attempting basic video stream', err);
      try {
        const streamFallback = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = streamFallback;
        if (videoRef.current) {
          videoRef.current.srcObject = streamFallback;
          await videoRef.current.play().catch(() => {});
        }
      } catch (fallbackErr) {
        console.error('Camera access completely denied or unavailable', fallbackErr);
        setCameraError(
          mobileLang === 'hi'
            ? 'कैमरा एक्सेस उपलब्ध नहीं है। डिवाइस कैमरा या गैलरी से फोटो चुनने के लिए नीचे टैप करें।'
            : 'Camera access denied or unavailable. Tap below to capture via device camera or file upload.'
        );
      }
    } finally {
      setCameraLoading(false);
    }
  };

  // Turn off hardware camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setActiveCameraType(null);
    setCameraError(null);
  };

  // Snap photo from live camera feed
  const capturePhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);

      if (activeCameraType === 'before') {
        setMobForm((prev) => ({ ...prev, before_image_url: dataUrl }));
      } else if (activeCameraType === 'after') {
        setMobForm((prev) => ({ ...prev, after_image_url: dataUrl }));
      }
    } catch (err) {
      console.error('Failed to capture frame from video', err);
    } finally {
      stopCamera();
    }
  };

  // Flip between front/back camera
  const flipCamera = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    startCamera(activeCameraType, nextFacing);
  };

  // Process native camera / gallery file upload
  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 800, 0.82);
      if (type === 'before') {
        setMobForm((prev) => ({ ...prev, before_image_url: compressed }));
      } else {
        setMobForm((prev) => ({ ...prev, after_image_url: compressed }));
      }
    } catch (err) {
      console.error('File compression error', err);
    }
  };

  // Clean up camera on unmount or modal close
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Handle hardware / keyboard Escape key back navigation to mirror Android back button
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (selectedAnimal) {
          setSelectedAnimal(null);
        } else if (activeCameraType) {
          stopCamera();
        } else if (currentScreen !== 'home') {
          setCurrentScreen('home');
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnimal, activeCameraType, currentScreen, onClose]);

  const handleMobileSave = (e) => {
    e.preventDefault();
    if (!mobForm.name.trim() || !mobForm.location_of_rescue.trim()) {
      alert(
        mobileLang === 'hi'
          ? 'कृपया जानवर का नाम और बचाव का स्थान भरें।'
          : 'Please enter animal name and rescue location.'
      );
      return;
    }

    onAddAnimal(mobForm);
    alert(
      mobileLang === 'hi'
        ? `नया ${mobForm.animal_type === 'dog' ? 'कुत्ता' : 'गाय'} प्रोफ़ाइल फोटो के साथ सुरक्षित हो गया!`
        : `New ${mobForm.animal_type} profile saved successfully with photos!`
    );
    setCurrentScreen('home');
    setMobForm({
      animal_type: 'dog',
      name: '',
      date_of_rescue: new Date().toISOString().split('T')[0],
      location_of_rescue: '',
      condition_at_rescue: 'Moderate',
      treatment_details: '',
      recovery_time: '',
      status: 'Under Treatment',
      before_image_url: null,
      after_image_url: null
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Critical':
        return 'text-[#b55e5e] bg-[#421d1d]/30 border-[#5c2727]/50';
      case 'Under Treatment':
        return 'text-[#c9a355] bg-[#4d3e1b]/30 border-[#6b5626]/50';
      case 'Recovered':
        return 'text-[#c27a66] bg-[#3d221a]/30 border-[#543024]/50';
      case 'Stable':
      default:
        return 'text-[#6b94b8] bg-[#1a2d3d]/30 border-[#2b4b66]/50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      {/* Hidden file inputs with mobile camera capture support */}
      <input
        ref={fileInputBeforeRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'before')}
      />
      <input
        ref={fileInputAfterRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'after')}
      />

      {/* Container with top close bar */}
      <div className="flex flex-col items-center">
        
        <div className="w-full max-w-sm flex items-center justify-between mb-3 text-xs text-muted">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c27a66] animate-pulse"></span>
            <span className="font-semibold text-foreground">
              {mobileLang === 'hi' ? 'वर्कर मोबाइल ऐप व्यू और कैमरा' : 'Worker Mobile App & Camera'}
            </span>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-[#262220] text-muted hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Phone Mockup Frame */}
        <div className="w-[360px] h-[680px] rounded-[36px] border-[6px] border-[#332e2b] bg-[#141110] shadow-2xl relative flex flex-col overflow-hidden select-none">
          
          {/* Status Bar */}
          <div className="px-5 pt-2 pb-1 flex justify-between items-center text-[10px] text-muted bg-[#1a1714]">
            <span className="font-bold text-foreground">09:41</span>
            <div className="w-16 h-3.5 bg-[#120f0d] rounded-full mx-auto"></div>
            <div className="flex items-center space-x-1">
              <span>5G</span>
              <span>92% 🔋</span>
            </div>
          </div>

          {/* Top Mobile App Header with Language Switcher */}
          <header className="px-4 py-2 bg-[#1a1714] border-b border-border flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-base">🐾</span>
              <div>
                <h4 className="text-xs font-bold text-foreground leading-tight">Jeev Jantu Vihar</h4>
                <p className="text-[9px] text-[#c27a66]">
                  {mobileLang === 'hi' ? 'फील्ड साथी और कैमरा' : 'Field Companion & Camera'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {/* Language Switcher Toggle */}
              <button
                type="button"
                data-testid="mobile-lang-toggle"
                onClick={toggleMobileLang}
                className="px-2 py-0.5 rounded-lg border border-[#332e2b] bg-[#262220] hover:bg-[#332e2b] text-[10px] text-[#6b94b8] font-bold flex items-center gap-1 transition shadow-sm cursor-pointer"
                title="Switch Mobile Language / भाषा बदलें"
              >
                <Globe className="w-3 h-3 text-[#6b94b8]" />
                <span>{mobileLang === 'hi' ? 'English' : 'हिन्दी'}</span>
              </button>

              <span className="text-[10px] bg-[#262220] px-2 py-0.5 rounded-full text-muted">
                {mobileLang === 'hi' ? 'निखिल (स्टाफ)' : 'Nikhil (Staff)'}
              </span>
            </div>
          </header>

          {/* LIVE IN-APP CAMERA VIEWFINDER OVERLAY */}
          {activeCameraType && (
            <div className="absolute inset-0 z-40 bg-black flex flex-col justify-between">
              
              {/* Top Viewfinder Bar */}
              <div className="p-3 bg-black/70 flex items-center justify-between z-10 text-white">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></div>
                  <span className="text-xs font-bold">
                    {activeCameraType === 'before'
                      ? (mobileLang === 'hi' ? '📸 बचाव पूर्व फोटो' : '📸 Before Photo')
                      : (mobileLang === 'hi' ? '✨ स्वास्थ्य लाभ फोटो' : '✨ After Photo')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Viewfinder Stream Area */}
              <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-[#0d0b0a]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Focus Target Overlay */}
                <div className="absolute inset-8 border-2 border-white/40 border-dashed rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                  <span className="text-[9px] bg-black/60 text-white px-2 py-0.5 rounded self-start">
                    {activeCameraType === 'before'
                      ? (mobileLang === 'hi' ? 'बचाव पूर्व फोटो लें' : 'Aim at Animal (Before Rescue)')
                      : (mobileLang === 'hi' ? 'स्वास्थ्य लाभ फोटो लें' : 'Aim at Animal (After Recovery)')}
                  </span>
                  <span className="text-[9px] bg-black/60 text-white/80 px-2 py-0.5 rounded self-center">
                    {mobileLang === 'hi' ? 'फोटो लेने के लिए शटर दबाएं' : 'Tap Shutter to Snap'}
                  </span>
                </div>

                {cameraLoading && (
                  <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center space-y-2 text-white">
                    <div className="w-8 h-8 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span className="text-xs">
                      {mobileLang === 'hi' ? 'कैमरा शुरू हो रहा है...' : 'Starting Camera...'}
                    </span>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-4 p-4 rounded-xl bg-black/85 border border-rose-800 text-center flex flex-col items-center justify-center space-y-3">
                    <AlertTriangle className="w-8 h-8 text-rose-400" />
                    <p className="text-xs text-rose-200">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeCameraType === 'before') {
                          fileInputBeforeRef.current?.click();
                        } else {
                          fileInputAfterRef.current?.click();
                        }
                        stopCamera();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#6b94b8] text-white font-bold text-xs shadow flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{mobileLang === 'hi' ? 'डिवाइस कैमरा / गैलरी खोलें' : 'Use Device Camera / Gallery'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Viewfinder Control Dock */}
              <div className="p-4 bg-black/80 flex items-center justify-around z-10 text-white">
                {/* Flip Camera */}
                <button
                  type="button"
                  onClick={flipCamera}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
                  title={mobileLang === 'hi' ? 'कैमरा पलटें (आगे/पीछे)' : 'Flip Camera (Front/Back)'}
                >
                  <RefreshCw className="w-5 h-5" />
                </button>

                {/* Shutter Capture Button */}
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full border-4 border-white bg-red-600 hover:bg-red-500 active:scale-95 transition shadow-2xl flex items-center justify-center"
                  title={mobileLang === 'hi' ? 'फोटो खींचें' : 'Capture Photo'}
                >
                  <Camera className="w-7 h-7 text-white" />
                </button>

                {/* Direct File Picker Fallback */}
                <button
                  type="button"
                  onClick={() => {
                    if (activeCameraType === 'before') {
                      fileInputBeforeRef.current?.click();
                    } else {
                      fileInputAfterRef.current?.click();
                    }
                    stopCamera();
                  }}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
                  title={mobileLang === 'hi' ? 'गैलरी / फाइल से चुनें' : 'Open Gallery / Files'}
                >
                  <Upload className="w-5 h-5" />
                </button>
              </div>

            </div>
          )}

          {/* SCREEN CONTENT AREA (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-3.5 pb-16 space-y-3.5">
            
            {/* SCREEN 1: HOME */}
            {currentScreen === 'home' && (
              <div className="space-y-3">
                {/* Welcome Summary Banner */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-[#4a7194]/30 to-[#1a1714] border border-[#6b94b8]/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[9px] text-[#6b94b8] font-medium">
                        {mobileLang === 'hi' ? 'आज का स्टेटस (Today)' : "Today's Census"}
                      </p>
                      <h3 className="text-sm font-bold text-foreground mt-0.5">
                        {animals.length} {mobileLang === 'hi' ? 'जानवर शेल्टर में' : 'Animals in Shelter'}
                      </h3>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#c27a66]/20 text-[#c27a66] font-semibold">
                      {mobileLang === 'hi' ? 'सभी को भोजन ✓' : 'All Fed ✓'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div className="bg-[#141110] p-2 rounded-lg border border-border">
                      <span className="text-[10px] text-muted block">
                        {mobileLang === 'hi' ? 'कुत्ते (Dogs)' : 'Dogs'}
                      </span>
                      <span className="font-extrabold text-[#c27a66] text-base">{dogs.length}</span>
                    </div>
                    <div className="bg-[#141110] p-2 rounded-lg border border-border">
                      <span className="text-[10px] text-muted block">
                        {mobileLang === 'hi' ? 'गायें (Cows)' : 'Cows'}
                      </span>
                      <span className="font-extrabold text-[#6b94b8] text-base">{cows.length}</span>
                    </div>
                  </div>
                </div>

                {/* Big Action Buttons */}
                <button
                  onClick={() => setCurrentScreen('add')}
                  className="w-full p-3 rounded-xl bg-gradient-to-r from-[#6b94b8] to-[#8f5c48] text-white shadow-md flex items-center justify-between active:scale-95 transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xl">📸</span>
                    <div className="text-left">
                      <p className="text-xs font-bold">
                        {mobileLang === 'hi' ? 'नया रेस्क्यू + कैमरा फोटो' : 'New Rescue + Camera Photos'}
                      </p>
                      <p className="text-[9px] text-[#ede8e3]/80">
                        {mobileLang === 'hi' ? 'बचाव पूर्व और बाद की फोटो लें' : 'Capture Before & After Photos'}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold">→</span>
                </button>

                {/* Section Navigation Cards */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCurrentScreen('dogs')}
                    className="p-3 rounded-xl bg-[#1a1714] border border-border text-left hover:border-[#6b94b8]"
                  >
                    <span className="text-xl block mb-1">🐕</span>
                    <span className="text-xs font-bold text-foreground block">
                      {mobileLang === 'hi' ? 'कुत्तों की सूची' : 'Dog Profiles'}
                    </span>
                    <span className="text-[10px] text-muted">
                      {mobileLang === 'hi' ? `${dogs.length} कुत्ते दर्ज` : `${dogs.length} Dogs Registered`}
                    </span>
                  </button>

                  <button
                    onClick={() => setCurrentScreen('cows')}
                    className="p-3 rounded-xl bg-[#1a1714] border border-border text-left hover:border-[#6b94b8]"
                  >
                    <span className="text-xl block mb-1">🐄</span>
                    <span className="text-xs font-bold text-foreground block">
                      {mobileLang === 'hi' ? 'गौशाला सूची' : 'Gaushala Cows'}
                    </span>
                    <span className="text-[10px] text-muted">
                      {mobileLang === 'hi' ? `${cows.length} गायें दर्ज` : `${cows.length} Cows Registered`}
                    </span>
                  </button>
                </div>

                {/* Recent Rescues List */}
                <div>
                  <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
                    {mobileLang === 'hi' ? 'हाल के भोपाल रेस्क्यू' : 'Recent Bhopal Rescues'}
                  </h4>
                  <div className="space-y-2">
                    {animals.length > 0 ? (
                      animals.slice(0, 3).map((a) => (
                        <div
                          key={a.id}
                          onClick={() => {
                            setSelectedAnimal(a);
                            setCurrentScreen('detail');
                          }}
                          className="p-2.5 rounded-xl bg-[#1a1714] border border-border flex items-center justify-between text-xs cursor-pointer hover:border-[#6b94b8]/50"
                        >
                          <div className="flex items-center space-x-2">
                            {a.before_image_url ? (
                              <img src={a.before_image_url} alt={a.name} className="w-8 h-8 rounded-lg object-cover" />
                            ) : (
                              <span className="text-base">{a.animal_type === 'dog' ? '🐕' : '🐄'}</span>
                            )}
                            <div>
                              <span className="font-bold text-foreground block">{a.name}</span>
                              <span className="text-[9px] text-muted">{a.location_of_rescue}</span>
                            </div>
                          </div>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full border ${getStatusBadge(a.status)}`}>
                            {a.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center text-[11px] text-muted bg-[#1a1714] rounded-xl border border-dashed border-border">
                        {mobileLang === 'hi'
                          ? 'अभी कोई जानवर दर्ज नहीं है। नया रेस्क्यू दर्ज करने के लिए ऊपर टैप करें!'
                          : 'No animals logged yet. Tap above to register your first rescue!'}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* SCREEN 2: DOGS */}
            {currentScreen === 'dogs' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <button onClick={() => setCurrentScreen('home')} className="text-xs text-[#6b94b8] hover:underline">
                      {mobileLang === 'hi' ? '← वापस' : '← Back'}
                    </button>
                    <h4 className="text-xs font-bold text-foreground">
                      🐕 {mobileLang === 'hi' ? 'कुत्ते' : 'Dogs'} ({filteredMobDogs.length}{filteredMobDogs.length !== dogs.length ? ` / ${dogs.length}` : ''})
                    </h4>
                  </div>
                  <button
                    onClick={() => {
                      setMobForm((prev) => ({ ...prev, animal_type: 'dog' }));
                      setCurrentScreen('add');
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-[#6b94b8] text-white hover:bg-[#5b84a8] transition"
                  >
                    + {mobileLang === 'hi' ? 'कुत्ता जोड़ें' : 'Add Dog'}
                  </button>
                </div>

                {/* Search Input Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={mobDogSearch}
                    onChange={(e) => setMobDogSearch(e.target.value)}
                    placeholder={mobileLang === 'hi' ? 'नाम, ID, नस्ल या स्थान खोजें...' : 'Search by name, ID, breed, location...'}
                    className="w-full bg-[#1a1714] border border-border rounded-lg pl-8 pr-7 py-1 text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:border-[#6b94b8]"
                  />
                  {mobDogSearch && (
                    <button
                      type="button"
                      onClick={() => setMobDogSearch('')}
                      className="absolute right-2 top-1.5 text-muted hover:text-foreground text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Status Filter Chips */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {MOB_STATUS_CHIPS.map((chip) => {
                    const isActive = mobDogStatusFilter === chip.key;
                    const count =
                      chip.key === 'All'
                        ? mobDogCounts.all
                        : chip.key === 'Under Treatment'
                        ? mobDogCounts.underTreatment
                        : chip.key === 'Critical'
                        ? mobDogCounts.critical
                        : mobDogCounts.recovered;

                    return (
                      <button
                        key={chip.key}
                        type="button"
                        onClick={() => setMobDogStatusFilter(chip.key)}
                        className={`text-[10px] px-2.5 py-0.5 rounded-full whitespace-nowrap border font-medium transition ${
                          isActive
                            ? 'text-white border-transparent'
                            : 'bg-[#1a1714] text-muted border-border hover:text-foreground'
                        }`}
                        style={isActive ? { backgroundColor: chip.color, borderColor: chip.color } : undefined}
                      >
                        {mobileLang === 'hi' ? chip.labelHi : chip.labelEn} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  {dogs.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted">
                      {mobileLang === 'hi' ? 'कोई कुत्ता दर्ज नहीं है।' : 'No dog profiles registered yet.'}
                    </div>
                  ) : filteredMobDogs.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted bg-[#1a1714] rounded-xl border border-dashed border-border p-3 space-y-2">
                      <p>{mobileLang === 'hi' ? 'कोई मेल खाने वाला कुत्ता नहीं मिला।' : 'No matching dog profiles found.'}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setMobDogSearch('');
                          setMobDogStatusFilter('All');
                        }}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#262220] text-[#6b94b8] border border-[#6b94b8]"
                      >
                        {mobileLang === 'hi' ? 'फ़िल्टर हटाएं (Reset)' : 'Reset Filters'}
                      </button>
                    </div>
                  ) : (
                    filteredMobDogs.map((dog) => (
                      <div
                        key={dog.id}
                        onClick={() => {
                          setSelectedAnimal(dog);
                          setCurrentScreen('detail');
                        }}
                        className="p-2.5 rounded-xl bg-[#1a1714] border border-border space-y-1.5 cursor-pointer hover:border-[#6b94b8]"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            {dog.before_image_url ? (
                              <img src={dog.before_image_url} alt={dog.name} className="w-8 h-8 rounded-lg object-cover" />
                            ) : (
                              <span className="text-base">🐕</span>
                            )}
                            <div>
                              <span className="font-bold text-foreground text-xs">{dog.name}</span>
                              <span className="text-[10px] text-muted block">{dog.location_of_rescue}</span>
                            </div>
                          </div>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full border ${getStatusBadge(dog.status)}`}>
                            {dog.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#b5aea8] truncate">{dog.treatment_details}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* SCREEN 3: COWS */}
            {currentScreen === 'cows' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <button onClick={() => setCurrentScreen('home')} className="text-xs text-[#6b94b8] hover:underline">
                      {mobileLang === 'hi' ? '← वापस' : '← Back'}
                    </button>
                    <h4 className="text-xs font-bold text-foreground">
                      🐄 {mobileLang === 'hi' ? 'गायें (गौशाला)' : 'Cows (Gaushala)'} ({filteredMobCows.length}{filteredMobCows.length !== cows.length ? ` / ${cows.length}` : ''})
                    </h4>
                  </div>
                  <button
                    onClick={() => {
                      setMobForm((prev) => ({ ...prev, animal_type: 'cow' }));
                      setCurrentScreen('add');
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-[#6b94b8] text-white hover:bg-[#5b84a8] transition"
                  >
                    + {mobileLang === 'hi' ? 'गाय जोड़ें' : 'Add Cow'}
                  </button>
                </div>

                {/* Search Input Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={mobCowSearch}
                    onChange={(e) => setMobCowSearch(e.target.value)}
                    placeholder={mobileLang === 'hi' ? 'नाम, ID, नस्ल या स्थान खोजें...' : 'Search by name, ID, breed, location...'}
                    className="w-full bg-[#1a1714] border border-border rounded-lg pl-8 pr-7 py-1 text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:border-[#6b94b8]"
                  />
                  {mobCowSearch && (
                    <button
                      type="button"
                      onClick={() => setMobCowSearch('')}
                      className="absolute right-2 top-1.5 text-muted hover:text-foreground text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Status Filter Chips */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {MOB_STATUS_CHIPS.map((chip) => {
                    const isActive = mobCowStatusFilter === chip.key;
                    const count =
                      chip.key === 'All'
                        ? mobCowCounts.all
                        : chip.key === 'Under Treatment'
                        ? mobCowCounts.underTreatment
                        : chip.key === 'Critical'
                        ? mobCowCounts.critical
                        : mobCowCounts.recovered;

                    return (
                      <button
                        key={chip.key}
                        type="button"
                        onClick={() => setMobCowStatusFilter(chip.key)}
                        className={`text-[10px] px-2.5 py-0.5 rounded-full whitespace-nowrap border font-medium transition ${
                          isActive
                            ? 'text-white border-transparent'
                            : 'bg-[#1a1714] text-muted border-border hover:text-foreground'
                        }`}
                        style={isActive ? { backgroundColor: chip.color, borderColor: chip.color } : undefined}
                      >
                        {mobileLang === 'hi' ? chip.labelHi : chip.labelEn} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  {cows.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted">
                      {mobileLang === 'hi' ? 'कोई गाय दर्ज नहीं है।' : 'No cow profiles registered yet.'}
                    </div>
                  ) : filteredMobCows.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted bg-[#1a1714] rounded-xl border border-dashed border-border p-3 space-y-2">
                      <p>{mobileLang === 'hi' ? 'कोई मेल खाने वाली गाय नहीं मिली।' : 'No matching cow profiles found.'}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setMobCowSearch('');
                          setMobCowStatusFilter('All');
                        }}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#262220] text-[#6b94b8] border border-[#6b94b8]"
                      >
                        {mobileLang === 'hi' ? 'फ़िल्टर हटाएं (Reset)' : 'Reset Filters'}
                      </button>
                    </div>
                  ) : (
                    filteredMobCows.map((cow) => (
                      <div
                        key={cow.id}
                        onClick={() => {
                          setSelectedAnimal(cow);
                          setCurrentScreen('detail');
                        }}
                        className="p-2.5 rounded-xl bg-[#1a1714] border border-border space-y-1.5 cursor-pointer hover:border-[#6b94b8]"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            {cow.before_image_url ? (
                              <img src={cow.before_image_url} alt={cow.name} className="w-8 h-8 rounded-lg object-cover" />
                            ) : (
                              <span className="text-base">🐄</span>
                            )}
                            <div>
                              <span className="font-bold text-foreground text-xs">{cow.name}</span>
                              <span className="text-[10px] text-muted block">{cow.location_of_rescue}</span>
                            </div>
                          </div>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full border ${getStatusBadge(cow.status)}`}>
                            {cow.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#b5aea8] truncate">{cow.treatment_details}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* SCREEN 4: ADD RESCUE (WITH CAMERA & BEFORE/AFTER PHOTOS) */}
            {currentScreen === 'add' && (
              <form onSubmit={handleMobileSave} className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-foreground">
                    {mobileLang === 'hi' ? 'नया रेस्क्यू दर्ज करें' : 'Log New Animal Rescue'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('home')}
                    className="text-[11px] text-muted hover:text-foreground"
                  >
                    {mobileLang === 'hi' ? '✕ रद्द करें' : '✕ Cancel'}
                  </button>
                </div>

                {/* Dog / Cow Toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMobForm({ ...mobForm, animal_type: 'dog' })}
                    className={`py-1.5 rounded-lg font-bold border transition ${
                      mobForm.animal_type === 'dog'
                        ? 'bg-[#c27a66] text-white border-[#c27a66]'
                        : 'bg-[#1a1714] text-muted border-border'
                    }`}
                  >
                    🐕 {mobileLang === 'hi' ? 'कुत्ता (Dog)' : 'Dog'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobForm({ ...mobForm, animal_type: 'cow' })}
                    className={`py-1.5 rounded-lg font-bold border transition ${
                      mobForm.animal_type === 'cow'
                        ? 'bg-[#6b94b8] text-white border-[#6b94b8]'
                        : 'bg-[#1a1714] text-muted border-border'
                    }`}
                  >
                    🐄 {mobileLang === 'hi' ? 'गाय (Cow)' : 'Cow'}
                  </button>
                </div>

                <div>
                  <label className="text-[10px] text-muted block mb-0.5">
                    {mobileLang === 'hi' ? 'नाम (Name) *' : 'Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={mobForm.name}
                    onChange={(e) => setMobForm({ ...mobForm, name: e.target.value })}
                    className="w-full bg-[#1a1714] border border-border p-2 rounded-lg text-foreground text-xs placeholder:text-[#5c544e]"
                    placeholder={mobileLang === 'hi' ? 'उदा. शेरू, कालू' : 'e.g. Bruno, Shadow'}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-muted block mb-0.5">
                    {mobileLang === 'hi' ? 'बचाव का स्थान (भोपाल) *' : 'Rescue Location (Bhopal) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={mobForm.location_of_rescue}
                    onChange={(e) => setMobForm({ ...mobForm, location_of_rescue: e.target.value })}
                    className="w-full bg-[#1a1714] border border-border p-2 rounded-lg text-foreground text-xs placeholder:text-[#5c544e]"
                    placeholder={mobileLang === 'hi' ? 'उदा. करोंद मंडी, एमपी नगर' : 'e.g. Karond Mandi, MP Nagar'}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-muted block mb-0.5">
                    {mobileLang === 'hi' ? 'बचाव के समय स्थिति (Condition)' : 'Condition at Rescue'}
                  </label>
                  <select
                    value={mobForm.condition_at_rescue}
                    onChange={(e) => setMobForm({ ...mobForm, condition_at_rescue: e.target.value })}
                    className="w-full bg-[#1a1714] border border-border p-2 rounded-lg text-foreground text-xs"
                  >
                    <option value="Critical">
                      {mobileLang === 'hi' ? 'Critical (अत्यंत गंभीर)' : 'Critical'}
                    </option>
                    <option value="Severe">
                      {mobileLang === 'hi' ? 'Severe (गंभीर चोट)' : 'Severe'}
                    </option>
                    <option value="Moderate">
                      {mobileLang === 'hi' ? 'Moderate (मध्यम)' : 'Moderate'}
                    </option>
                    <option value="Mild">
                      {mobileLang === 'hi' ? 'Mild (हल्की चोट)' : 'Mild'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-muted block mb-0.5">
                    {mobileLang === 'hi' ? 'उपचार / दवाइयाँ (Treatment)' : 'Treatment / Medications'}
                  </label>
                  <textarea
                    rows={2}
                    value={mobForm.treatment_details}
                    onChange={(e) => setMobForm({ ...mobForm, treatment_details: e.target.value })}
                    className="w-full bg-[#1a1714] border border-border p-2 rounded-lg text-foreground text-xs placeholder:text-[#5c544e]"
                    placeholder={mobileLang === 'hi' ? 'घाव की ड्रेसिंग, बैंडेज, इंजेक्शन...' : 'Wound dressing, splints, antibiotics...'}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-muted block mb-0.5">
                    {mobileLang === 'hi' ? 'अनुमानित रिकवरी समय (Recovery Time)' : 'Estimated Recovery Time'}
                  </label>
                  <input
                    type="text"
                    value={mobForm.recovery_time}
                    onChange={(e) => setMobForm({ ...mobForm, recovery_time: e.target.value })}
                    className="w-full bg-[#1a1714] border border-border p-2 rounded-lg text-foreground text-xs placeholder:text-[#5c544e]"
                    placeholder={mobileLang === 'hi' ? 'उदा. 15 दिन, 3 सप्ताह, Ongoing' : 'e.g. 15 Days, 3 Weeks, Ongoing'}
                  />
                </div>

                {/* CAMERA CAPTURE SECTION FOR BEFORE & AFTER PHOTOS */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] text-muted block font-semibold">
                    {mobileLang === 'hi'
                      ? '📸 रेस्क्यू फोटो (Before & After Camera Photos)'
                      : '📸 Rescue Photos (Before & After Camera Photos)'}
                  </label>
                  
                  <div className="grid grid-cols-2 gap-2">
                    
                    {/* Before Photo Card */}
                    <div className="bg-[#1a1714] border border-dashed border-[#c27a66]/50 rounded-xl p-2 text-center flex flex-col items-center justify-center relative overflow-hidden min-h-[110px]">
                      {mobForm.before_image_url ? (
                        <div className="w-full relative group">
                          <img
                            src={mobForm.before_image_url}
                            alt="Before"
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <div className="absolute top-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-bold text-[#c9a355] flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> {mobileLang === 'hi' ? 'Before ✓' : 'Before ✓'}
                          </div>
                          <div className="flex gap-1 mt-1.5 justify-center">
                            <button
                              type="button"
                              onClick={() => startCamera('before')}
                              className="text-[9px] px-2 py-0.5 rounded bg-[#262220] hover:bg-[#332e2b] text-[#c27a66] border border-[#c27a66]/30 flex items-center gap-0.5"
                            >
                              <Camera className="w-2.5 h-2.5" /> {mobileLang === 'hi' ? 'पुनः लें' : 'Retake'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setMobForm((prev) => ({ ...prev, before_image_url: null }))}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-900/30"
                              title="Delete photo"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 py-1 w-full">
                          <span className="text-xl block">📸</span>
                          <span className="text-[10px] font-bold text-[#c27a66] block leading-tight">
                            {mobileLang === 'hi' ? 'Before Photo' : 'Before Photo'}
                          </span>
                          <span className="text-[8px] text-muted block">
                            {mobileLang === 'hi' ? 'बचाव के समय (घायल अवस्था)' : 'At Rescue (Initial)'}
                          </span>
                          <div className="flex gap-1 justify-center pt-1 w-full">
                            <button
                              type="button"
                              onClick={() => startCamera('before')}
                              className="flex-1 px-1.5 py-1 rounded bg-[#c27a66] hover:bg-[#a86b56] text-white font-bold text-[9px] flex items-center justify-center gap-1 shadow"
                              title="Open Camera"
                            >
                              <Camera className="w-2.5 h-2.5" /> {mobileLang === 'hi' ? 'कैमरा' : 'Camera'}
                            </button>
                            <button
                              type="button"
                              onClick={() => fileInputBeforeRef.current?.click()}
                              className="px-1.5 py-1 rounded bg-[#262220] text-muted hover:text-white text-[9px] border border-border"
                              title="Upload Photo"
                            >
                              <Upload className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* After Photo Card */}
                    <div className="bg-[#1a1714] border border-dashed border-[#6b94b8]/50 rounded-xl p-2 text-center flex flex-col items-center justify-center relative overflow-hidden min-h-[110px]">
                      {mobForm.after_image_url ? (
                        <div className="w-full relative group">
                          <img
                            src={mobForm.after_image_url}
                            alt="After"
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <div className="absolute top-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-bold text-emerald-400 flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> {mobileLang === 'hi' ? 'After ✓' : 'After ✓'}
                          </div>
                          <div className="flex gap-1 mt-1.5 justify-center">
                            <button
                              type="button"
                              onClick={() => startCamera('after')}
                              className="text-[9px] px-2 py-0.5 rounded bg-[#262220] hover:bg-[#332e2b] text-[#6b94b8] border border-[#6b94b8]/30 flex items-center gap-0.5"
                            >
                              <Camera className="w-2.5 h-2.5" /> {mobileLang === 'hi' ? 'पुनः लें' : 'Retake'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setMobForm((prev) => ({ ...prev, after_image_url: null }))}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-900/30"
                              title="Delete photo"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 py-1 w-full">
                          <span className="text-xl block">✨</span>
                          <span className="text-[10px] font-bold text-[#6b94b8] block leading-tight">
                            {mobileLang === 'hi' ? 'After Photo' : 'After Photo'}
                          </span>
                          <span className="text-[8px] text-muted block">
                            {mobileLang === 'hi' ? 'स्वास्थ्य लाभ के बाद' : 'Post Recovery'}
                          </span>
                          <div className="flex gap-1 justify-center pt-1 w-full">
                            <button
                              type="button"
                              onClick={() => startCamera('after')}
                              className="flex-1 px-1.5 py-1 rounded bg-[#6b94b8] hover:bg-[#5a82a6] text-white font-bold text-[9px] flex items-center justify-center gap-1 shadow"
                              title="Open Camera"
                            >
                              <Camera className="w-2.5 h-2.5" /> {mobileLang === 'hi' ? 'कैमरा' : 'Camera'}
                            </button>
                            <button
                              type="button"
                              onClick={() => fileInputAfterRef.current?.click()}
                              className="px-1.5 py-1 rounded bg-[#262220] text-muted hover:text-white text-[9px] border border-border"
                              title="Upload Photo"
                            >
                              <Upload className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#8f5c48] hover:bg-[#a86b56] text-white font-bold text-xs shadow mt-2 transition"
                >
                  {mobileLang === 'hi' ? 'जानवर प्रोफ़ाइल सेव करें ✓' : 'Save Animal Profile ✓'}
                </button>
              </form>
            )}

            {/* SCREEN 5: DETAIL VIEW */}
            {currentScreen === 'detail' && selectedAnimal && (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <button onClick={() => setCurrentScreen('home')} className="text-xs text-[#6b94b8]">
                    {mobileLang === 'hi' ? '← वापस' : '← Back'}
                  </button>
                  <span className="text-xs font-bold text-foreground">{selectedAnimal.name}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border ${getStatusBadge(selectedAnimal.status)}`}>
                    {selectedAnimal.status}
                  </span>
                </div>

                {/* Photos */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#1a1714] p-2 rounded-lg border border-border text-center">
                    <span className="text-[9px] text-[#c9a355] block mb-1">
                      {mobileLang === 'hi' ? 'बचाव पूर्व फोटो' : 'Before Photo'}
                    </span>
                    {selectedAnimal.before_image_url ? (
                      <img src={selectedAnimal.before_image_url} alt="Before" className="w-full h-24 object-cover rounded" />
                    ) : (
                      <div className="w-full h-24 bg-[#120f0d] rounded flex flex-col items-center justify-center text-muted">
                        <Camera className="w-5 h-5 mb-1 text-muted" />
                        <span className="text-[9px]">
                          {mobileLang === 'hi' ? 'फोटो उपलब्ध नहीं' : 'No photo'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="bg-[#1a1714] p-2 rounded-lg border border-border text-center">
                    <span className="text-[9px] text-[#c27a66] block mb-1">
                      {mobileLang === 'hi' ? 'स्वास्थ्य लाभ फोटो' : 'After Photo'}
                    </span>
                    {selectedAnimal.after_image_url ? (
                      <img src={selectedAnimal.after_image_url} alt="After" className="w-full h-24 object-cover rounded" />
                    ) : (
                      <div className="w-full h-24 bg-[#120f0d] rounded flex flex-col items-center justify-center text-muted">
                        <Sparkles className="w-5 h-5 mb-1 text-muted" />
                        <span className="text-[9px]">
                          {mobileLang === 'hi' ? 'फोटो उपलब्ध नहीं' : 'No photo'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Card */}
                <div className="p-3 bg-[#1a1714] rounded-lg border border-border space-y-1.5">
                  <p>
                    <span className="text-muted">{mobileLang === 'hi' ? 'आईडी (ID):' : 'ID:'}</span>{' '}
                    <span className="font-mono text-[#c9a355]">{selectedAnimal.animal_id}</span>
                  </p>
                  <p>
                    <span className="text-muted">{mobileLang === 'hi' ? 'स्थान:' : 'Location:'}</span>{' '}
                    {selectedAnimal.location_of_rescue}
                  </p>
                  <p>
                    <span className="text-muted">{mobileLang === 'hi' ? 'बचाव दिनांक:' : 'Rescue Date:'}</span>{' '}
                    {selectedAnimal.date_of_rescue}
                  </p>
                  <p>
                    <span className="text-muted">{mobileLang === 'hi' ? 'उपचार:' : 'Treatment:'}</span>{' '}
                    {selectedAnimal.treatment_details}
                  </p>
                  {selectedAnimal.recovery_time && (
                    <p>
                      <span className="text-muted">{mobileLang === 'hi' ? 'स्वास्थ्य लाभ समय:' : 'Recovery:'}</span>{' '}
                      {selectedAnimal.recovery_time}
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Bottom Mobile Navigation Dock */}
          <nav className="absolute bottom-0 left-0 right-0 bg-[#1a1714] border-t border-border px-4 py-2 flex justify-around items-center z-10 text-[10px]">
            <button
              onClick={() => {
                stopCamera();
                setCurrentScreen('home');
              }}
              className={`flex flex-col items-center ${currentScreen === 'home' ? 'text-[#6b94b8]' : 'text-muted'}`}
            >
              <Home className="w-4 h-4" />
              <span>{mobileLang === 'hi' ? 'होम' : 'Home'}</span>
            </button>
            <button
              onClick={() => {
                stopCamera();
                setCurrentScreen('dogs');
              }}
              className={`flex flex-col items-center ${currentScreen === 'dogs' ? 'text-[#6b94b8]' : 'text-muted'}`}
            >
              <span className="text-sm">🐕</span>
              <span>{mobileLang === 'hi' ? 'कुत्ते' : 'Dogs'}</span>
            </button>
            <button
              onClick={() => {
                stopCamera();
                setCurrentScreen('cows');
              }}
              className={`flex flex-col items-center ${currentScreen === 'cows' ? 'text-[#6b94b8]' : 'text-muted'}`}
            >
              <span className="text-sm">🐄</span>
              <span>{mobileLang === 'hi' ? 'गायें' : 'Cows'}</span>
            </button>
            <button
              type="button"
              data-testid="mobile-nav-add"
              onClick={() => {
                stopCamera();
                setCurrentScreen('add');
              }}
              className={`flex flex-col items-center ${currentScreen === 'add' ? 'text-[#c27a66]' : 'text-muted'}`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>{mobileLang === 'hi' ? 'जोड़ें' : 'Add'}</span>
            </button>
          </nav>

        </div>

      </div>
    </div>
  );
}
