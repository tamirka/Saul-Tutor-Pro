import React from 'react';
import { Language, TutorFlowStep } from '../types';
import { TEXTS } from '../constants';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface StepperProps {
    steps: TutorFlowStep[];
    currentStep: TutorFlowStep;
    language: Language;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep, language }) => {
    const texts = TEXTS[language];
    const currentIndex = steps.indexOf(currentStep);

    const getStepName = (step: TutorFlowStep) => {
        switch (step) {
            case TutorFlowStep.SUBJECT: return texts.selectSubject.split(' ')[1]; // "Subject"
            case TutorFlowStep.LEVEL: return texts.selectLevel.split(' ')[2]; // "Level"
            case TutorFlowStep.LESSONS: return "Lessons";
            case TutorFlowStep.CHAT: return "Chat";
            case TutorFlowStep.SUMMARY: return texts.sessionSummary.split(' ')[1]; // "Summary"
            default: return "";
        }
    };
    
    return (
        <nav aria-label="Progress">
            <ol role="list" className="flex items-center">
                {steps.map((step, stepIdx) => (
                    <li key={step} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                        {stepIdx < currentIndex ? (
                            <>
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="h-0.5 w-full bg-indigo-600" />
                                </div>
                                <a href="#" className="relative flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-900">
                                    <CheckCircleIcon className="h-5 w-5 text-white" aria-hidden="true" />
                                    <span className="sr-only">{getStepName(step)}</span>
                                </a>
                            </>
                        ) : stepIdx === currentIndex ? (
                             <>
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="h-0.5 w-full bg-gray-200 dark:bg-gray-700" />
                                </div>
                                <a href="#" className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-600 bg-white dark:bg-gray-800" aria-current="step">
                                     <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" aria-hidden="true" />
                                     <span className="sr-only">{getStepName(step)}</span>
                                </a>
                            </>
                        ) : (
                             <>
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="h-0.5 w-full bg-gray-200 dark:bg-gray-700" />
                                </div>
                                <a href="#" className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400">
                                    <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300" aria-hidden="true" />
                                    <span className="sr-only">{getStepName(step)}</span>
                                </a>
                            </>
                        )}
                        <span className="absolute -bottom-6 text-xs font-semibold text-gray-600 dark:text-gray-400 capitalize">{getStepName(step)}</span>
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default Stepper;
