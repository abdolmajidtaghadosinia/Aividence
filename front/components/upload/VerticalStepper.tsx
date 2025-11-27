import React from 'react';
import { CheckIcon } from '../Icons';
import { toPersianDigits } from '../../constants';

interface VerticalStepperProps {
    currentStep: number;
    steps: string[];
}

const VerticalStepper: React.FC<VerticalStepperProps> = ({ currentStep, steps }) => {
    return (
        <div className="w-full lg:w-48 p-4">
            <div className="flex lg:flex-col justify-center gap-4 lg:gap-0">
                {steps.map((step, index) => (
                    <React.Fragment key={index}>
                        <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-4 w-full">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 ${currentStep > index ? 'bg-sky-500 border-sky-500 text-white' : currentStep === index ? 'border-sky-500 text-sky-500' : 'border-gray-300 text-gray-400'}`}>
                               {currentStep > index ? <CheckIcon className="w-6 h-6"/> : toPersianDigits(index + 1)}
                            </div>
                            <p className={`font-semibold text-center lg:text-right ${currentStep >= index ? 'text-sky-600' : 'text-gray-500'}`}>{step}</p>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`w-12 lg:w-0.5 h-0.5 lg:h-12 my-2 lg:ml-[82px] ${currentStep > index ? 'bg-sky-500' : 'bg-gray-300'}`}></div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default VerticalStepper;