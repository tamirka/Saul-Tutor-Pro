import React, { useState, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Language, ProgressData, View, LearningPlan } from '../types';
import { TEXTS, LEVELS } from '../constants';
import UserIcon from './icons/UserIcon';
import TrophyIcon from './icons/TrophyIcon';
import SparklesIcon from './icons/SparklesIcon';
import BookOpenIcon from './icons/BookOpenIcon';

interface DashboardViewProps {
  language: Language;
  setCurrentView: (view: View) => void;
}

interface PerformanceChartProps {
  data: { date: string, score: number }[];
  language: Language;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data, language }) => {
  const texts = TEXTS[language];
  const isDark = document.documentElement.classList.contains('dark');

  if (data.length < 2) {
    return <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg"><p className="text-gray-500 dark:text-gray-400">{texts.noScoreData}</p></div>;
  }
  
  const textColor = isDark ? "#9ca3af" : "#6b7280";
  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const lineColor = isDark ? "#a5b4fc" : "#6366f1";
  const pointColor = isDark ? "#818cf8" : "#4f46e5";

  const width = 500;
  const height = 200;
  const margin = { top: 20, right: 20, bottom: 30, left: 30 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const dates = data.map(d => new Date(d.date).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);

  const xScale = (date: number) => ((date - minDate) / (maxDate - minDate || 1)) * chartWidth;
  const yScale = (score: number) => chartHeight - (score / 100) * chartHeight;

  const path = data.map(d => `${xScale(new Date(d.date).getTime())},${yScale(d.score)}`).join('L');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {/* Y Axis */}
        {[0, 25, 50, 75, 100].map(tick => (
          <g key={tick} transform={`translate(0, ${yScale(tick)})`}>
            <text x="-5" y="4" textAnchor="end" fontSize="10" fill={textColor}>{tick}%</text>
            <line x1="0" y1="0" x2={chartWidth} y2="0" stroke={gridColor} strokeDasharray="2" />
          </g>
        ))}
        {/* X Axis - only draw bottom line */}
        <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke={gridColor} />

        {/* Line */}
        <path d={`M${path}`} fill="none" stroke={lineColor} strokeWidth="2" />
        
        {/* Points */}
        {data.map((d, i) => (
          <circle key={i} cx={xScale(new Date(d.date).getTime())} cy={yScale(d.score)} r="3" fill={pointColor} />
        ))}
      </g>
    </svg>
  );
};

const DashboardView: React.FC<DashboardViewProps> = ({ language, setCurrentView }) => {
  const [progress] = useLocalStorage<ProgressData[]>('ai-tutor-progress', []);
  const [learningPlan] = useLocalStorage<LearningPlan | null>('ai-tutor-plan', null);
  const [userName, setUserName] = useLocalStorage<string>('ai-tutor-username', 'Student');
  const [tempName, setTempName] = useState(userName);
  const [isEditingName, setIsEditingName] = useState(false);

  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');

  const texts = TEXTS[language];

  const uniqueSubjects = useMemo(() => ['all', ...Array.from(new Set(progress.map(p => p.subject)))], [progress]);
  const uniqueLevels = useMemo(() => ['all', ...LEVELS], []);

  const filteredProgress = useMemo(() => {
    return progress
      .filter(p => selectedSubject === 'all' || p.subject === selectedSubject)
      .filter(p => selectedLevel === 'all' || p.level === selectedLevel);
  }, [progress, selectedSubject, selectedLevel]);

  const chartData = useMemo(() => {
    return filteredProgress
      .filter(p => typeof p.score === 'number')
      .map(p => ({ date: p.date, score: p.score as number }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredProgress]);

  const nextLesson = useMemo(() => {
    if (!learningPlan) return null;
    const next = learningPlan.lessons.find(l => !learningPlan.completedLessons.includes(l));
    return next ? { ...learningPlan, nextLesson: next } : null;
  }, [learningPlan]);

  const badges = useMemo(() => {
    const earned = [];
    if (progress.length >= 5) {
      earned.push({ id: '5lessons', title: texts.badge5Lessons, desc: texts.badge5LessonsDesc, icon: <BookOpenIcon className="w-6 h-6"/> });
    }
    if (progress.some(p => p.score === 100)) {
      earned.push({ id: 'perfectScore', title: texts.badgePerfectScore, desc: texts.badgePerfectScoreDesc, icon: <TrophyIcon className="w-6 h-6"/> });
    }
    if (new Set(progress.map(p => p.subject)).size > 1) {
      earned.push({ id: 'multiSubject', title: texts.badgeMultiSubject, desc: texts.badgeMultiSubjectDesc, icon: <SparklesIcon className="w-6 h-6"/> });
    }
    return earned;
  }, [progress, texts]);
  
  const handleSaveName = () => {
    setUserName(tempName);
    setIsEditingName(false);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center transition-transform hover:scale-[1.02] duration-300">
            <div className="w-24 h-24 mx-auto bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mb-4">
              <UserIcon className="w-16 h-16 text-indigo-500 dark:text-indigo-400" />
            </div>
            {isEditingName ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={handleSaveName} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{texts.save}</button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{texts.hello}, {userName}!</h2>
                <button onClick={() => { setIsEditingName(true); setTempName(userName); }} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">{texts.editProfile}</button>
              </>
            )}
          </div>

          {/* Badges Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-transform hover:scale-[1.02] duration-300">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{texts.myBadges}</h3>
            <div className="space-y-4">
              {badges.length > 0 ? badges.map(badge => (
                <div key={badge.id} className="flex items-center space-x-4">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-500 dark:text-emerald-400 rounded-full">
                    {badge.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{badge.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{badge.desc}</p>
                  </div>
                </div>
              )) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Complete lessons and quizzes to earn badges!</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
           {/* Continue Learning Card */}
           {nextLesson && (
            <div className="bg-gradient-to-r from-indigo-600 to-emerald-500 text-white rounded-xl shadow-lg p-6 flex flex-col sm:flex-row items-center justify-between transition-transform hover:scale-[1.02] duration-300">
              <div>
                <h3 className="text-xl font-bold">{texts.continueLearning}</h3>
                <p className="opacity-90 capitalize">{nextLesson.subject}: {nextLesson.nextLesson}</p>
              </div>
              <button onClick={() => setCurrentView(View.TUTOR)} className="mt-4 sm:mt-0 bg-white text-indigo-600 font-bold py-2 px-6 rounded-full hover:bg-indigo-50 transition-transform hover:scale-105">
                {texts.tutor}
              </button>
            </div>
           )}

          {/* Performance Chart Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-transform hover:scale-[1.02] duration-300">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{texts.performanceChart}</h3>
            <PerformanceChart data={chartData} language={language} />
          </div>

          {/* Progress History */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">{texts.progressTitle}</h2>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-6">
                  <div className="flex-1">
                      <label htmlFor="subject-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{texts.filterBySubject}</label>
                      <select id="subject-filter" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md capitalize">
                          {uniqueSubjects.map(s => <option key={s} value={s}>{s === 'all' ? texts.allSubjects : s}</option>)}
                      </select>
                  </div>
                  <div className="flex-1">
                      <label htmlFor="level-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{texts.filterByLevel}</label>
                      <select id="level-filter" value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md capitalize">
                          {uniqueLevels.map(l => <option key={l} value={l}>{l === 'all' ? texts.allLevels : texts[l as keyof typeof texts] || l}</option>)}
                      </select>
                  </div>
              </div>

              {/* Progress List */}
              {filteredProgress.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">{texts.noProgress}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProgress.slice().reverse().map((item, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-transform hover:scale-[1.01] duration-300">
                      <div className="flex flex-col sm:flex-row justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">{item.subject}</h3>
                          <p className="text-md text-gray-700 dark:text-gray-300 capitalize font-medium">{item.lesson}</p>
                          <div className="flex items-center flex-wrap gap-2 mt-2">
                             <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300 capitalize">
                                {texts[item.level as keyof typeof texts] || item.level}
                            </span>
                             <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(item.date).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
                          </div>
                        </div>
                        {item.score !== undefined && (
                          <div className="text-lg font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50 px-3 py-1 rounded-full mt-2 sm:mt-0">
                            {texts.score}: {item.score}%
                          </div>
                        )}
                      </div>
                      <p className="mt-4 text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{item.summary}</p>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>
       <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default DashboardView;