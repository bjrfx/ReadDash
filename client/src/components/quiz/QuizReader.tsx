import { useState, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { VocabularyContextMenu } from "@/components/ui/vocabulary-context-menu";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, arrayUnion, updateDoc } from "firebase/firestore";
import { useAuth } from "@/lib/hooks";

interface Question {
  id?: string;
  text: string;
  type: string;
  options?: { id: string; text: string }[];
  correctAnswer?: string;
  blanks?: { id: string; answer: string }[];
}

interface Quiz {
  id: string;
  title: string;
  passage: string;
  readingLevel: string;
  category: string;
  questions?: Question[];
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
  // State for fill-in-the-blank answers
  const [blankAnswers, setBlankAnswers] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { user } = useAuth();
  const passageContainerRef = useRef<HTMLDivElement>(null);
  
  // State for vocabulary context menu
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    selectedWord: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    selectedWord: '',
  });
  
  // Handle right-click on the passage
  const handlePassageContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    
    // Get the selected text
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    // Only show the context menu if text is selected
    if (selectedText && selectedText.length > 0) {
      setContextMenu({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        selectedWord: selectedText,
      });
    }
  }, []);
  
  // Handle closing the context menu
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);
  
  // Handle adding a word to vocabulary
  const handleAddToVocabulary = useCallback(async (word: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to add words to your vocabulary.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        vocabulary: arrayUnion({
          word,
          addedAt: new Date().toISOString(),
          quizId: quiz.id,
          quizTitle: quiz.title,
        }),
      });
      
      toast({
        title: "Word added",
        description: `"${word}" has been added to your vocabulary list.`,
      });
    } catch (error) {
      console.error("Error adding word to vocabulary:", error);
      toast({
        title: "Failed to add word",
        description: "There was an error adding the word to your vocabulary. Please try again.",
        variant: "destructive",
      });
    }
  }, [user, quiz, toast]);

  // Handle highlighting selected text
  const handleHighlight = useCallback((color: string) => {
    if (!passageContainerRef.current) return;
    const container = passageContainerRef.current;
    // Temporarily make passage contenteditable
    const prevEditable = container.getAttribute('contenteditable');
    container.setAttribute('contenteditable', 'true');
    container.focus();
    try {
      document.execCommand('styleWithCSS', false, 'true');
      document.execCommand('hiliteColor', false, color);
    } catch (e) {
      // fallback: do nothing
    }
    // Restore previous contenteditable state
    if (prevEditable === null) {
      container.removeAttribute('contenteditable');
    } else {
      container.setAttribute('contenteditable', prevEditable);
    }
    window.getSelection()?.removeAllRanges();
  }, []);
  
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
  
  // Render different question types
  const renderQuestion = () => {
    const questionId = currentQuestion.id || '';
    
    switch (currentQuestion.type) {
      case 'multiple-choice':
        return (
          <RadioGroup 
            className="space-y-3" 
            value={userAnswers[questionId] || ""}
            onValueChange={(value) => onAnswer(questionId, value)}
          >
            {currentQuestion.options && currentQuestion.options.map((option) => (
              <div
                key={option.id}
                className={`flex items-start p-3 border ${
                  userAnswers[questionId] === option.id
                    ? "border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-700/70 dark:hover:text-gray-200"
                } rounded-lg transition-colors`}
              >
                <RadioGroupItem 
                  id={option.id} 
                  value={option.id} 
                  className="mt-0.5 mr-3 border-gray-400 dark:border-gray-500 dark:text-white" 
                />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
        
      case 'fill-blanks':
        if (!currentQuestion.blanks || !currentQuestion.blanks.length) {
          return (
            <div className="p-4 border border-amber-200 dark:border-amber-800 rounded-md bg-amber-50 dark:bg-amber-950">
              <p className="text-amber-600 dark:text-amber-400">
                No blank fields available for this question.
              </p>
            </div>
          );
        }
        
        // Split text by underscores to find blanks
        const parts = currentQuestion.text.split('___');
        
        return (
          <div className="space-y-4">
            <div className="text-lg leading-relaxed">
              {parts.map((part, i) => (
                <span key={i}>
                  {part}
                  {i < parts.length - 1 && (
                    <Input
                      className="inline-block w-32 mx-1 px-2 py-0 h-8 border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 border-primary-400 dark:border-primary-500 bg-transparent focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
                      value={blankAnswers[`${questionId}-${i}`] || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const blankId = currentQuestion.blanks && currentQuestion.blanks[i] ? 
                          currentQuestion.blanks[i].id : '';
                          
                        // Update both the blanks state and call onAnswer to record the answer
                        setBlankAnswers(prev => ({
                          ...prev,
                          [`${questionId}-${i}`]: value
                        }));
                        
                        onAnswer(questionId, blankId);
                      }}
                      placeholder="_____________"
                    />
                  )}
                </span>
              ))}
            </div>
          </div>
        );
        
      case 'true-false-not-given':
        return (
          <RadioGroup 
            className="space-y-3" 
            value={userAnswers[questionId] || ""}
            onValueChange={(value) => onAnswer(questionId, value)}
          >
            <div
              className={`flex items-start p-3 border ${
                userAnswers[questionId] === 'true'
                  ? "border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-700/70 dark:hover:text-gray-200"
              } rounded-lg transition-colors`}
            >
              <RadioGroupItem 
                id={`${questionId}-true`} 
                value="true" 
                className="mt-0.5 mr-3 border-gray-400 dark:border-gray-500 dark:text-white" 
              />
              <Label htmlFor={`${questionId}-true`} className="flex-1 cursor-pointer">
                True
              </Label>
            </div>
            <div
              className={`flex items-start p-3 border ${
                userAnswers[questionId] === 'false'
                  ? "border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-700/70 dark:hover:text-gray-200"
              } rounded-lg transition-colors`}
            >
              <RadioGroupItem 
                id={`${questionId}-false`} 
                value="false" 
                className="mt-0.5 mr-3 border-gray-400 dark:border-gray-500 dark:text-white" 
              />
              <Label htmlFor={`${questionId}-false`} className="flex-1 cursor-pointer">
                False
              </Label>
            </div>
            <div
              className={`flex items-start p-3 border ${
                userAnswers[questionId] === 'not-given'
                  ? "border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-700/70 dark:hover:text-gray-200"
              } rounded-lg transition-colors`}
            >
              <RadioGroupItem 
                id={`${questionId}-not-given`} 
                value="not-given" 
                className="mt-0.5 mr-3 border-gray-400 dark:border-gray-500 dark:text-white" 
              />
              <Label htmlFor={`${questionId}-not-given`} className="flex-1 cursor-pointer">
                Not Given
              </Label>
            </div>
          </RadioGroup>
        );

      case 'yes-no-not-given':
        return (
          <RadioGroup 
            className="space-y-3" 
            value={userAnswers[questionId] || ""}
            onValueChange={(value) => onAnswer(questionId, value)}
          >
            <div
              className={`flex items-start p-3 border ${
                userAnswers[questionId] === 'yes'
                  ? "border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-700/70 dark:hover:text-gray-200"
              } rounded-lg transition-colors`}
            >
              <RadioGroupItem 
                id={`${questionId}-yes`} 
                value="yes" 
                className="mt-0.5 mr-3 border-gray-400 dark:border-gray-500 dark:text-white" 
              />
              <Label htmlFor={`${questionId}-yes`} className="flex-1 cursor-pointer">
                Yes
              </Label>
            </div>
            <div
              className={`flex items-start p-3 border ${
                userAnswers[questionId] === 'no'
                  ? "border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-700/70 dark:hover:text-gray-200"
              } rounded-lg transition-colors`}
            >
              <RadioGroupItem 
                id={`${questionId}-no`} 
                value="no" 
                className="mt-0.5 mr-3 border-gray-400 dark:border-gray-500 dark:text-white" 
              />
              <Label htmlFor={`${questionId}-no`} className="flex-1 cursor-pointer">
                No
              </Label>
            </div>
            <div
              className={`flex items-start p-3 border ${
                userAnswers[questionId] === 'not-given'
                  ? "border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-700/70 dark:hover:text-gray-200"
              } rounded-lg transition-colors`}
            >
              <RadioGroupItem 
                id={`${questionId}-not-given`} 
                value="not-given" 
                className="mt-0.5 mr-3 border-gray-400 dark:border-gray-500 dark:text-white" 
              />
              <Label htmlFor={`${questionId}-not-given`} className="flex-1 cursor-pointer">
                Not Given
              </Label>
            </div>
          </RadioGroup>
        );

      case 'sentence-completion':
        // Split text by underscores to find blanks
        const sentenceParts = currentQuestion.text.split('________');
        
        return (
          <div className="space-y-4">
            <div className="text-lg leading-relaxed">
              {sentenceParts.map((part, i) => (
                <span key={i}>
                  {part}
                  {i < sentenceParts.length - 1 && (
                    <Input
                      className="inline-block w-40 mx-1 px-2 py-0 h-8 border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 border-primary-400 dark:border-primary-500 bg-transparent focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
                      value={userAnswers[questionId] || ''}
                      onChange={(e) => {
                        // Store the user's answer directly in the parent component
                        onAnswer(questionId, e.target.value);
                      }}
                      placeholder="_____________"
                    />
                  )}
                </span>
              ))}
            </div>
          </div>
        );
        
      default:
        return (
          <div className="p-4 border border-amber-200 dark:border-amber-800 rounded-md bg-amber-50 dark:bg-amber-950">
            <p className="text-amber-600 dark:text-amber-400">
              Unknown question type: {currentQuestion.type}
            </p>
          </div>
        );
    }
  };

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
      
      {/* Reading passage with context menu */}
      <Card className="mb-6 relative">
        <CardContent 
          ref={passageContainerRef}
          className="p-5 select-text" 
          onContextMenu={handlePassageContextMenu}
        >
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
          
          {/* Vocabulary Context Menu */}
          {contextMenu.visible && (
            <VocabularyContextMenu 
              x={contextMenu.x}
              y={contextMenu.y}
              selectedWord={contextMenu.selectedWord}
              onAddToVocabulary={handleAddToVocabulary}
              onHighlight={handleHighlight}
              onClose={handleCloseContextMenu}
              containerRef={passageContainerRef}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Question */}
      <Card className="mb-6">
        <CardContent className="p-5">
          {currentQuestion.type === 'sentence-completion' || currentQuestion.type === 'fill-blanks' ? (
            <div>
              {renderQuestion()}
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-medium mb-4">{currentQuestion.text || "Question text not available"}</h3>
              {renderQuestion()}
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
