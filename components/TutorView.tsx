import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import { Language, LearningPlan, Message, MessageSender, ProgressData, QuizQuestion, TutorFlowStep } from '../types';
import { TEXTS, MOCKED_SUBJECTS, LEVELS } from '../constants';
import { createBlob, decode, decodeAudioData } from '../services/audioUtils';
import MicrophoneIcon from './icons/MicrophoneIcon';
import SendIcon from './icons/SendIcon';
import useLocalStorage from '../hooks/useLocalStorage';
import AiThinkingIndicator from './AiThinkingIndicator';
import Waveform from './Waveform';
import Stepper from './Stepper';
import BrainCircuitIcon from './icons/BrainCircuitIcon';

interface TutorViewProps {
  language: Language;
  onApiKeyError: () => void;
}

const TutorView: React.FC<TutorViewProps> = ({ language, onApiKeyError }) => {
  const texts = TEXTS[language];
  const [subject, setSubject] = useState<string>('');
  const [customSubject, setCustomSubject] = useState<string>('');
  
  const [currentStep, setCurrentStep] = useState<TutorFlowStep>(TutorFlowStep.SUBJECT);
  const [studentLevel, setStudentLevel] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [lessonsVisible, setLessonsVisible] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [isGeneratingObjectives, setIsGeneratingObjectives] = useState(false);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  const [isQuizMode, setIsQuizMode] = useState<boolean>(false);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [score, setScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAwaitingQuestion, setIsAwaitingQuestion] = useState<boolean>(false);
  const [answerFeedback, setAnswerFeedback] = useState<{ correct: boolean, text: string } | null>(null);

  const [learningPlan, setLearningPlan] = useLocalStorage<LearningPlan | null>('ai-tutor-plan', null);
  const [progress, setProgress] = useLocalStorage<ProgressData[]>('ai-tutor-progress', []);

  useEffect(() => {
    if (learningPlan && !selectedLesson) {
      setCurrentStep(TutorFlowStep.LESSONS);
    } else if (!learningPlan) {
      setCurrentStep(TutorFlowStep.SUBJECT);
    }
  }, [learningPlan, selectedLesson]);


  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  const startLearningSession = () => {
    const selectedSubject = customSubject.trim() || subject;
    if (selectedSubject) {
      setSubject(selectedSubject);
      setCurrentStep(TutorFlowStep.LEVEL);
    }
  };

  const abandonPlan = () => {
      setLearningPlan(null);
      setSubject('');
      setCustomSubject('');
      setMessages([]);
      setIsListening(false);
      setCurrentInput('');
      setStudentLevel('');
      setSelectedLesson('');
      setIsQuizMode(false);
      setCurrentQuestion(null);
      setScore({ correct: 0, total: 0 });
      setAnswerFeedback(null);
      setSelectedAnswer(null);
      setCurrentStep(TutorFlowStep.SUBJECT);
  };
  
  const endLesson = async () => {
    if (!learningPlan) return;
    const apiKey = sessionStorage.getItem('gemini-api-key');
    if (!apiKey) {
      onApiKeyError();
      return;
    }

    setCurrentStep(TutorFlowStep.SUMMARY);
    setIsSummarizing(true);
    const conversationHistory = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
    const summaryPrompt = `Based on the following conversation about the lesson "${selectedLesson}" for the subject "${learningPlan.subject}", please provide a concise summary of the student's progress, topics covered, and areas for improvement.\n\nConversation:\n${conversationHistory}`;

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: summaryPrompt,
      });
      const summaryText = response.text;
      
      const quizScore = score.total > 0 ? Math.round((score.correct / score.total) * 100) : undefined;
      
      const newProgress: ProgressData = {
        subject: learningPlan.subject,
        lesson: selectedLesson,
        level: learningPlan.level,
        date: new Date().toISOString(),
        summary: summaryText,
        score: quizScore,
      };
      setProgress(prev => [...prev, newProgress]);

      if (!learningPlan.completedLessons.includes(selectedLesson)) {
        setLearningPlan({
          ...learningPlan,
          completedLessons: [...learningPlan.completedLessons, selectedLesson],
        });
      }
    } catch (error: any) {
      console.error("Error generating summary:", error);
      if (error.message && error.message.includes("Requested entity was not found.")) {
        onApiKeyError();
        return;
      }
    } finally {
        setSelectedLesson('');
        setMessages([]);
        setIsQuizMode(false);
        setCurrentQuestion(null);
        setScore({ correct: 0, total: 0 });
        setIsSummarizing(false);
        setCurrentStep(TutorFlowStep.LESSONS);
    }
  };

  const initializeAudio = async () => {
    try {
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Fix: Add type annotation to the catch block variable.
    } catch (err: any) {
      console.error('Error initializing audio:', err);
    }
  };

  const getPerformanceHistory = useCallback((): string => {
    if (!learningPlan) return '';
    const history = progress.filter(p => p.subject === learningPlan.subject);
    if (history.length === 0) {
        return texts.performanceTrendDefault;
    }
    const trendText = history.map(p => `- Lesson "${p.lesson}": ${p.score !== undefined ? `Quiz Score ${p.score}%` : 'No quiz taken.'}`).join('\n');
    return `${texts.performanceTrendMessage}${trendText}`;
  }, [progress, learningPlan, texts]);

  const getSystemInstruction = useCallback((): string => {
    if (!learningPlan || !selectedLesson) return '';
    const performanceHistory = getPerformanceHistory();
    return `You are an expert, friendly, and patient AI Tutor, specializing in ${learningPlan.subject}. The student's level is ${learningPlan.level}. The current lesson is "${selectedLesson}". The student has already been shown the learning objectives for this lesson, so you can begin teaching the first concept.

Your core teaching method:
- Speak naturally and conversationally. You are bilingual and must seamlessly switch between English and Arabic based on the student's language.
- Break complex concepts into small, understandable steps.
- After explaining a step or concept, you MUST ask the student what they want to do next. Offer them choices like: (a) a real-world example, (b) a quick quiz question, or (c) a deeper explanation. This empowers the student to control their learning path.
- Always be encouraging. If the student makes a mistake, correct them politely and gently guide them to the right answer.
- When a major topic within the lesson is complete, provide a brief summary of the key takeaways before moving on to the next one.

Student's history in this subject:
${performanceHistory}

Refer to this history to provide motivating feedback. For example, if you see their quiz scores improving, mention it!`;
  }, [learningPlan, selectedLesson, getPerformanceHistory]);

  const stopVoiceSession = useCallback(() => {
    setIsListening(false);
    setIsConnecting(false);
    sessionPromiseRef.current?.then(session => session.close());
    sessionPromiseRef.current = null;
    
    scriptProcessorRef.current?.disconnect();
    mediaStreamSourceRef.current?.disconnect();
    analyserRef.current?.disconnect();
    scriptProcessorRef.current = null;
    mediaStreamSourceRef.current = null;
    analyserRef.current = null;


    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    inputAudioContextRef.current?.close();
    inputAudioContextRef.current = null;
  }, []);

  const startVoiceSession = useCallback(async () => {
    if (!learningPlan || !selectedLesson) return;

    const apiKey = sessionStorage.getItem('gemini-api-key');
    if (!apiKey) {
      onApiKeyError();
      return;
    }

    setIsListening(true);
    setIsConnecting(true);
    if (!inputAudioContextRef.current || !outputAudioContextRef.current || !streamRef.current) {
        await initializeAudio();
    }
    if (!inputAudioContextRef.current || !outputAudioContextRef.current || !streamRef.current) {
        setIsListening(false);
        setIsConnecting(false);
        return;
    }

    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = getSystemInstruction();
    
    sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: systemInstruction,
        },
        callbacks: {
            onopen: () => {
                setIsConnecting(false);
                if (!inputAudioContextRef.current || !streamRef.current) return;
                
                mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
                scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                analyserRef.current = inputAudioContextRef.current.createAnalyser();
                
                scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    const pcmBlob = createBlob(inputData);
                    sessionPromiseRef.current?.then((session) => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                };

                mediaStreamSourceRef.current.connect(analyserRef.current);
                analyserRef.current.connect(scriptProcessorRef.current);
                scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
                if (message.serverContent?.inputTranscription) {
                    const text = message.serverContent.inputTranscription.text;
                    currentInputTranscriptionRef.current += text;
                    setMessages(prev => {
                        const lastMsg = prev[prev.length - 1];
                        if (lastMsg && lastMsg.sender === MessageSender.USER) {
                            return [...prev.slice(0, -1), { ...lastMsg, text: currentInputTranscriptionRef.current }];
                        }
                        return [...prev, { id: `user-${Date.now()}`, sender: MessageSender.USER, text: currentInputTranscriptionRef.current }];
                    });
                }
                
                if (message.serverContent?.outputTranscription) {
                    const text = message.serverContent.outputTranscription.text;
                    currentOutputTranscriptionRef.current += text;
                     setMessages(prev => {
                        const lastMsg = prev[prev.length - 1];
                        if (lastMsg && lastMsg.sender === MessageSender.AI) {
                            return [...prev.slice(0, -1), { ...lastMsg, text: currentOutputTranscriptionRef.current }];
                        }
                        return [...prev, { id: `ai-${Date.now()}`, sender: MessageSender.AI, text: currentOutputTranscriptionRef.current }];
                    });
                }
                
                if (message.serverContent?.turnComplete) {
                    currentInputTranscriptionRef.current = '';
                    currentOutputTranscriptionRef.current = '';
                }

                const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                if (base64Audio && outputAudioContextRef.current) {
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                    const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                    const source = outputAudioContextRef.current.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outputAudioContextRef.current.destination);
                    source.addEventListener('ended', () => audioSourcesRef.current.delete(source));
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    audioSourcesRef.current.add(source);
                }

                if (message.serverContent?.interrupted) {
                    for (const source of audioSourcesRef.current.values()) {
                        source.stop();
                    }
                    audioSourcesRef.current.clear();
                    nextStartTimeRef.current = 0;
                }
            },
            onerror: (e: ErrorEvent) => { 
                console.error('Session error:', e);
                if (e.message && e.message.includes("Requested entity was not found.")) {
                    onApiKeyError();
                }
                stopVoiceSession();
            },
            onclose: (e: CloseEvent) => { console.log('Session closed'); },
        },
    });
  }, [learningPlan, selectedLesson, getSystemInstruction, stopVoiceSession, onApiKeyError]);

  const handleMicClick = () => {
    if (isListening) {
      stopVoiceSession();
    } else {
      startVoiceSession();
    }
  };

  const handleSendText = async () => {
    if (!currentInput.trim() || !learningPlan) return;
    
    const apiKey = sessionStorage.getItem('gemini-api-key');
    if (!apiKey) {
      onApiKeyError();
      return;
    }

    const userMessage: Message = { id: `user-text-${Date.now()}`, sender: MessageSender.USER, text: currentInput.trim() };
    setMessages(prev => [...prev, userMessage]);
    const textToSend = currentInput.trim();
    setCurrentInput('');
    setIsAiTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const fullHistory = [...messages, userMessage].map(msg => ({
        role: msg.sender === MessageSender.USER ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
      
      const systemInstruction = getSystemInstruction();

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullHistory,
        config: {
          systemInstruction: systemInstruction,
        }
      });
      
      const aiMessage: Message = { id: `ai-text-${Date.now()}`, sender: MessageSender.AI, text: response.text };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Error sending text message:", error);
      if (error.message && error.message.includes("Requested entity was not found.")) {
        onApiKeyError();
      } else {
        const errorMessage: Message = { id: `error-${Date.now()}`, sender: MessageSender.SYSTEM, text: "Sorry, I encountered an error." };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsAiTyping(false);
    }
  };

  const generateLessonPlan = async (currentSubject: string, level: string) => {
      const apiKey = sessionStorage.getItem('gemini-api-key');
      if (!apiKey) {
        onApiKeyError();
        return;
      }
      setIsGeneratingPlan(true);
      try {
          const ai = new GoogleGenAI({ apiKey });
          const schema = {
              type: Type.OBJECT,
              properties: {
                  lessons: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                  },
              },
              required: ['lessons']
          };

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `Generate a list of 10 pedagogical lesson topics for a ${level} student on the subject of ${currentSubject}. The list should start with fundamentals and progressively increase in complexity.`,
              config: {
                  responseMimeType: "application/json",
                  responseSchema: schema
              }
          });

          const lessonData = JSON.parse(response.text);
          setLearningPlan({
            subject: currentSubject,
            level: level,
            lessons: lessonData.lessons || [],
            completedLessons: [],
          });
          setCurrentStep(TutorFlowStep.LESSONS);
          setTimeout(() => setLessonsVisible(true), 100);
      } catch (error: any) {
          console.error("Error generating lessons:", error);
          if (error.message && error.message.includes("Requested entity was not found.")) {
            onApiKeyError();
          }
      } finally {
          setIsGeneratingPlan(false);
      }
  };

  const handleLevelSelect = (level: string) => {
      setStudentLevel(level);
      const currentSubject = customSubject.trim() || subject;
      generateLessonPlan(currentSubject, level);
  };
  
  const generateLessonObjectives = async (subject: string, level: string, lesson: string): Promise<string> => {
    const apiKey = sessionStorage.getItem('gemini-api-key');
    if (!apiKey) {
      throw new Error("API key not found");
    }
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a brief, encouraging introduction and 2-3 bulleted learning objectives for the lesson titled '${lesson}' for a ${level} student studying ${subject}.`,
    });
    return response.text;
  };

  const startLesson = async (lesson: string) => {
    if (!learningPlan) return;
    
    const apiKey = sessionStorage.getItem('gemini-api-key');
    if (!apiKey) {
      onApiKeyError();
      return;
    }

    setSelectedLesson(lesson);
    setCurrentStep(TutorFlowStep.CHAT);
    setIsGeneratingObjectives(true);
    try {
      const objectivesText = await generateLessonObjectives(learningPlan.subject, learningPlan.level, lesson);
      setMessages([{ id: 'objectives', sender: MessageSender.SYSTEM, text: objectivesText }]);
    } catch (e: any) {
      console.error("Error generating objectives:", e);
      if (e.message && (e.message.includes("Requested entity was not found.") || e.message.includes("API key not found"))) {
        onApiKeyError();
      } else {
        setMessages([{ id: 'welcome', sender: MessageSender.SYSTEM, text: `Starting lesson: "${lesson}" for ${learningPlan.subject}. Ask me anything to begin!` }]);
      }
    } finally {
      setIsGeneratingObjectives(false);
    }
  };

  const startQuiz = () => {
    setIsQuizMode(true);
    setScore({ correct: 0, total: 0 });
    setCurrentQuestion(null);
    setAnswerFeedback(null);
    setSelectedAnswer(null);
    setMessages(prev => [...prev, { id: 'quiz-start', sender: MessageSender.SYSTEM, text: 'Quiz mode started! Generating the first question...' }]);
    generateQuestion();
  };

  const endQuiz = () => {
    setIsQuizMode(false);
    setMessages(prev => [...prev, { id: 'quiz-end', sender: MessageSender.SYSTEM, text: `Quiz finished! Final Score: ${score.correct} / ${score.total}` }]);
    setCurrentQuestion(null);
  };
  
  const generateQuestion = async () => {
    if (!learningPlan) return;
    const apiKey = sessionStorage.getItem('gemini-api-key');
    if (!apiKey) {
      onApiKeyError();
      return;
    }

    setIsAwaitingQuestion(true);
    setAnswerFeedback(null);
    setSelectedAnswer(null);
    setCurrentQuestion(null);

    const ai = new GoogleGenAI({ apiKey });
    const schema = {
        type: Type.OBJECT,
        properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            answer: { type: Type.STRING }
        },
        required: ['question', 'options', 'answer']
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a multiple-choice question about ${learningPlan.subject} focusing on the topic of ${selectedLesson}. The response must be in JSON format. Provide 4 options. The answer must be one of the options.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const questionData: QuizQuestion = JSON.parse(response.text);
        setCurrentQuestion(questionData);
        setMessages(prev => [
            ...prev,
            {
                id: `quiz-q-${Date.now()}`,
                sender: MessageSender.AI,
                text: `Question ${score.total + 1}:\n${questionData.question}`
            }
        ]);

    } catch (error: any) {
        console.error("Error generating question:", error);
        if (error.message && error.message.includes("Requested entity was not found.")) {
            onApiKeyError();
        } else {
            setMessages(prev => [...prev, { id: 'quiz-error', sender: MessageSender.SYSTEM, text: "Sorry, I couldn't generate a question. Please end the quiz and start again." }]);
        }
    } finally {
        setIsAwaitingQuestion(false);
    }
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.answer;
    const feedbackText = isCorrect 
        ? "Correct!" 
        : `Not quite. The correct answer was: ${currentQuestion.answer}`;
    
    setMessages(prev => [
        ...prev,
        { id: `user-ans-${Date.now()}`, sender: MessageSender.USER, text: selectedAnswer },
        { id: `feedback-${Date.now()}`, sender: MessageSender.SYSTEM, text: feedbackText }
    ]);
    
    setScore(prev => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1
    }));
    
    setAnswerFeedback({ correct: isCorrect, text: feedbackText });
  };


  useEffect(() => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isAiTyping]);

  useEffect(() => {
    return () => {
      stopVoiceSession();
    };
  }, [stopVoiceSession]);

  const steps = [TutorFlowStep.SUBJECT, TutorFlowStep.LEVEL, TutorFlowStep.LESSONS, TutorFlowStep.CHAT, TutorFlowStep.SUMMARY];

  const renderInitialSetup = () => (
    <div className="w-full max-w-md p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center animate-[slideUp_0.5s_ease-out]">
      {currentStep === TutorFlowStep.SUBJECT && (
        <>
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">{texts.selectSubject}</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {MOCKED_SUBJECTS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setSubject(s); setCustomSubject(''); }}
                  className={`p-3 rounded-lg font-semibold transition-all ${
                    subject === s ? 'bg-indigo-600 text-white ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-gray-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {texts[s]}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder={texts.customSubjectPlaceholder}
              value={customSubject}
              onChange={(e) => { setCustomSubject(e.target.value); setSubject(''); }}
              onFocus={() => setSubject('')}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={startLearningSession}
            disabled={!subject && !customSubject.trim()}
            className="w-full mt-6 bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800/50 transition-colors"
          >
            {texts.startLearning}
          </button>
        </>
      )}
      {currentStep === TutorFlowStep.LEVEL && (
        <>
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">{texts.selectLevel}</h2>
            <div className="space-y-3">
              {LEVELS.map(level => (
                <button key={level} onClick={() => handleLevelSelect(level)} className="w-full p-3 rounded-lg font-semibold capitalize transition-all bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-gray-600">
                  {texts[level]}
                </button>
              ))}
            </div>
          <button onClick={() => setCurrentStep(TutorFlowStep.SUBJECT)} className="w-full mt-6 text-indigo-600 dark:text-indigo-400 font-semibold py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors">
            {texts.backToSubjects}
          </button>
        </>
      )}
    </div>
  );

  if (isGeneratingPlan) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center animate-[fadeIn_0.5s_ease-out]">
            <BrainCircuitIcon className="w-16 h-16 mx-auto text-indigo-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Tutor is preparing your lesson...</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{texts.generatingLessons}</p>
            <AiThinkingIndicator />
        </div>
      </div>
    );
  }

  const renderLessonPlan = () => {
    if (!learningPlan) return null;
    const progressPercentage = (learningPlan.completedLessons.length / learningPlan.lessons.length) * 100;
    return (
      <div className="w-full max-w-xl p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg animate-[slideUp_0.5s_ease-out]">
        <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100 capitalize">{learningPlan.subject}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{texts.selectLesson}</p>

        <div className="mb-4">
            <div className="flex justify-between mb-1">
                <span className="text-base font-medium text-indigo-700 dark:text-indigo-300">{texts.lessonsCompleted}</span>
                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{learningPlan.completedLessons.length} / {learningPlan.lessons.length}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{width: `${progressPercentage}%`}}></div>
            </div>
        </div>

        <div className={`space-y-2 max-h-80 overflow-y-auto p-1 transition-opacity duration-500 ${lessonsVisible ? 'opacity-100' : 'opacity-0'}`}>
          {learningPlan.lessons.map((lesson, index) => {
            const isCompleted = learningPlan.completedLessons.includes(lesson);
            return (
                <button 
                    key={index} 
                    onClick={() => startLesson(lesson)} 
                    className={`w-full p-3 rounded-lg text-start font-medium transition-all flex items-center space-x-3 ${
                        isCompleted ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60' : 'bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-gray-700 hover:text-indigo-700 dark:hover:text-indigo-300 border border-gray-200 dark:border-gray-700'
                    }`}
                >
                {isCompleted && (
                    <svg className="w-5 h-5 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                )}
                <span className="flex-1">{index + 1}. {lesson}</span>
                </button>
            )
          })}
        </div>
        <button onClick={abandonPlan} className="w-full mt-6 text-indigo-600 dark:text-indigo-400 font-semibold py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors">
          {texts.changeSubject}
        </button>
      </div>
    );
  };
  
  const renderChat = () => (
    <div className="flex flex-col h-[calc(100vh-10.5rem)] bg-gray-100 dark:bg-gray-900/50">
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {isGeneratingObjectives && (
            <div className="text-center text-gray-500 dark:text-gray-400 italic">{texts.generatingObjectives}</div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === MessageSender.USER ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-2xl px-4 py-2 rounded-xl shadow-sm ${
              msg.sender === MessageSender.USER ? 'bg-indigo-500 text-white' : 
              msg.sender === MessageSender.AI ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200' : 'bg-transparent text-gray-500 dark:text-gray-400 text-center w-full text-sm italic shadow-none'
            }`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isAiTyping && (
             <div className="flex justify-start">
                <div className="px-4 py-3 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm">
                    <AiThinkingIndicator />
                </div>
            </div>
        )}
        {isSummarizing && (
            <div className="text-center text-gray-500 dark:text-gray-400 italic">{texts.generatingSummary}</div>
        )}
      </div>
      <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
        { isQuizMode ? (
            <div className="text-center">
                <h3 className="font-bold text-lg mb-2">{texts.score}: {score.correct} / {score.total}</h3>
                {isAwaitingQuestion && <div className="text-center text-gray-500 dark:text-gray-400 p-4">{texts.generatingQuestion}</div>}
                {answerFeedback && (
                    <div className="text-center p-2">
                        <button onClick={generateQuestion} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition-colors">
                            {texts.nextQuestion}
                        </button>
                    </div>
                )}
                {currentQuestion && !answerFeedback && (
                    <div className="p-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                            {currentQuestion.options.map((option, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedAnswer(option)}
                                    className={`p-3 rounded-lg text-start transition-colors w-full font-medium ${selectedAnswer === option ? 'bg-indigo-600 text-white ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-gray-800' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                                >
                                   {option}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleSubmitAnswer}
                            disabled={!selectedAnswer}
                            className="w-full mt-2 bg-emerald-500 text-white font-bold py-3 rounded-lg hover:bg-emerald-600 disabled:bg-emerald-300 transition-colors"
                        >
                            {texts.submitAnswer}
                        </button>
                    </div>
                )}
            </div>
        ) : (
            <>
            <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                    <input
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                    placeholder={texts.typeMessage}
                    className="w-full py-3 pe-12 ps-4 bg-gray-100 dark:bg-gray-700 rounded-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button onClick={handleSendText} className="absolute end-3 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                    <SendIcon className="w-6 h-6"/>
                    </button>
                </div>
                <button onClick={handleMicClick} className={`relative p-3 rounded-full transition-colors ${isListening ? 'bg-red-500' : 'bg-indigo-500'} text-white`}>
                    {isListening && (
                        <span className="absolute inset-0 rounded-full bg-red-500" style={{ animation: 'pulse-ring 1.25s cubic-bezier(0.215, 0.61, 0.355, 1) infinite' }}></span>
                    )}
                    <MicrophoneIcon className={`w-6 h-6 relative ${isListening ? 'animate-pulse' : ''}`} style={{ animation: 'pulse-dot 1.25s cubic-bezier(0.455, 0.03, 0.515, 0.955) -.4s infinite' }} />
                </button>
            </div>
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2 h-10 flex items-center justify-center">
             {isConnecting ? texts.connecting : isListening ? <Waveform analyser={analyserRef.current} /> : <p>{texts.startSpeaking}</p>}
            </div>
            </>
        )}
        <div className="flex items-center justify-center space-x-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
             <button onClick={endLesson} className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-semibold hover:bg-red-600 transition-colors">
                {texts.endSession}
            </button>
             {!isQuizMode ? (
                <button onClick={startQuiz} className="px-4 py-2 bg-emerald-500 text-white rounded-full text-sm font-semibold hover:bg-emerald-600 transition-colors">
                    {texts.startQuiz}
                </button>
            ) : (
                <button onClick={endQuiz} className="px-4 py-2 bg-yellow-600 text-white rounded-full text-sm font-semibold hover:bg-yellow-700 transition-colors">
                    {texts.endQuiz}
                </button>
            )}
        </div>
      </div>
    </div>
  );
  
  if (currentStep === TutorFlowStep.CHAT) {
      return (
        <div className="w-full max-w-4xl mx-auto pt-4 animate-[fadeIn_0.5s_ease-out]">
            <Stepper steps={steps} currentStep={currentStep} language={language} />
            <div className="mt-4 rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
             {renderChat()}
            </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-300">
        <div className="w-full max-w-xl mx-auto">
            <Stepper steps={steps} currentStep={currentStep} language={language} />
            <div className="mt-4">
                {currentStep === TutorFlowStep.LESSONS ? renderLessonPlan() : renderInitialSetup()}
            </div>
        </div>
         <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `}</style>
    </div>
  )
};

export default TutorView;