import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface Question {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
}

interface Quiz {
  id: string;
  title: string;
  passage: string;
  readingLevel: string;
  category: string;
  questions: Question[];
}

interface QuizReaderProps {
  quiz: Quiz;
  currentQuestionIndex: number;
  userAnswers: Record<string, string>;
  onAnswer: (questionId: string, answerId: string) => void;
  onNextQuestion: () => void;
  onPreviousQuestion: () => void;
  onSubmit: () => void;
}

export function QuizReader({
  quiz,
  currentQuestionIndex,
  userAnswers,
  onAnswer,
  onNextQuestion,
  onPreviousQuestion,
  onSubmit,
}: QuizReaderProps) {
  // Make sure quiz and quiz.questions exists before accessing
  if (!quiz || !quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-lg font-medium text-gray-600 dark:text-gray-400">
          This quiz has no questions available.
        </div>
        <button 
          onClick={() => window.history.back()} 
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  const currentQuestion = quiz.questions[currentQuestionIndex];
  // If currentQuestion is undefined (e.g., if index is out of bounds), show error
  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-lg font-medium text-gray-600 dark:text-gray-400">
          The requested question could not be found.
        </div>
        <button 
          onClick={() => window.history.back()} 
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold">{quiz.title}</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
            Level {quiz.readingLevel}
          </Badge>
          <Badge variant="outline" className="bg-gray-100 dark:bg-gray-700">
            {quiz.category}
          </Badge>
        </div>
      </div>
      
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-4">
        <Progress value={progress} className="flex-1 mr-4 h-2" />
        <span className="text-sm font-medium">
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </span>
      </div>
      
      {/* Reading passage */}
      <Card className="mb-6">
        <CardContent className="p-5">
          {quiz.passage && quiz.passage.split('\n').map((paragraph, index) => (
            <p key={index} className="text-base mb-4 last:mb-0">
              {paragraph}
            </p>
          ))}
          {!quiz.passage && (
            <p className="text-base text-amber-600 dark:text-amber-400">
              No reading passage available for this quiz.
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* Question */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <h3 className="text-lg font-medium mb-4">{currentQuestion.text || "Question text not available"}</h3>
          
          {currentQuestion.options && Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0 ? (
            <RadioGroup 
              className="space-y-3" 
              value={userAnswers[currentQuestion.id] || ""}
              onValueChange={(value) => onAnswer(currentQuestion.id, value)}
            >
              {currentQuestion.options.map((option) => (
                <div
                  key={option.id}
                  className={`flex items-start p-3 border ${
                    userAnswers[currentQuestion.id] === option.id
                      ? "border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                  } rounded-lg transition-colors`}
                >
                  <RadioGroupItem 
                    id={option.id} 
                    value={option.id} 
                    className="mt-0.5 mr-3" 
                  />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <div className="p-4 border border-amber-200 dark:border-amber-800 rounded-md bg-amber-50 dark:bg-amber-950">
              <p className="text-amber-600 dark:text-amber-400">
                No answer options available for this question.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onPreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        
        {isLastQuestion ? (
          <Button onClick={onSubmit}>Submit Quiz</Button>
        ) : (
          <Button onClick={onNextQuestion}>Next Question</Button>
        )}
      </div>
    </div>
  );
}
