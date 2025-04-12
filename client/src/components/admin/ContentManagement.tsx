import { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PencilIcon, TrashIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { GenerateQuizRequest } from '@/lib/gemini';
import { useToast } from '@/hooks/use-toast';

interface Passage {
  id: string;
  title: string;
  level: string;
  category: string;
  questionCount: number;
}

interface Quiz {
  id: string;
  title: string;
  readingLevel: string;
  category: string;
  questionCount: number;
  createdAt?: any;
}

interface ContentManagementProps {
  passages: Passage[];
  quizzes?: Quiz[];
  onEditPassage: (id: string) => void;
  onDeletePassage: (id: string) => void;
  onEditQuiz?: (id: string) => void;
  onDeleteQuiz?: (id: string) => void;
  onGenerateQuiz: (request: GenerateQuizRequest) => Promise<void>;
  onViewAllPassages: () => void;
  onViewAllQuizzes?: () => void;
}

export function ContentManagement({ 
  passages, 
  quizzes = [],
  onEditPassage, 
  onDeletePassage,
  onEditQuiz,
  onDeleteQuiz, 
  onGenerateQuiz,
  onViewAllPassages,
  onViewAllQuizzes
}: ContentManagementProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizRequest, setQuizRequest] = useState<GenerateQuizRequest>({
    readingLevel: '',
    category: '',
    keywords: '',
    questionCount: 5
  });

  // Handle form input changes
  const handleInputChange = (field: keyof GenerateQuizRequest, value: string | number) => {
    setQuizRequest(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!quizRequest.readingLevel || !quizRequest.category) {
      toast({
        title: 'Missing information',
        description: 'Please select both a reading level and a category.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      await onGenerateQuiz(quizRequest);
      // Reset form after successful generation
      setQuizRequest({
        readingLevel: '',
        category: '',
        keywords: '',
        questionCount: 5
      });
      
      toast({
        title: 'Quiz generated successfully',
        description: 'The quiz has been created and is now available.',
      });
    } catch (error) {
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Failed to generate quiz',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Reading Passages List */}
      <Card>
        <CardHeader className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-heading text-lg font-medium">Reading Passages</h3>
        </CardHeader>
        
        <CardContent className="p-5">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {passages.map((passage) => (
              <li key={passage.id} className="py-3 flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{passage.title}</h4>
                  <div className="flex space-x-2 text-xs mt-1">
                    <span className="text-gray-500 dark:text-gray-400">Level {passage.level}</span>
                    <span className="text-gray-500 dark:text-gray-400">•</span>
                    <span className="text-gray-500 dark:text-gray-400">{passage.category}</span>
                    <span className="text-gray-500 dark:text-gray-400">•</span>
                    <span className="text-gray-500 dark:text-gray-400">{passage.questionCount} questions</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    onClick={() => onEditPassage(passage.id)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    onClick={() => onDeletePassage(passage.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          
          <Button 
            variant="outline" 
            className="mt-4 w-full"
            onClick={onViewAllPassages}
          >
            View All Passages
          </Button>
        </CardContent>
      </Card>
      
      {/* AI Content Generation */}
      <Card>
        <CardHeader className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-heading text-lg font-medium">AI Content Generation</h3>
        </CardHeader>
        
        <CardContent className="p-5">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <Label htmlFor="readingLevel" className="block text-sm font-medium mb-2">
                Reading Level
              </Label>
              <Select 
                value={quizRequest.readingLevel}
                onValueChange={(value) => handleInputChange('readingLevel', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>Select level...</SelectItem>
                  <SelectItem value="5A">Level 5A (Basic)</SelectItem>
                  <SelectItem value="6B">Level 6B (Intermediate)</SelectItem>
                  <SelectItem value="8B">Level 8B (Advanced)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="mb-4">
              <Label htmlFor="category" className="block text-sm font-medium mb-2">
                Topic Category
              </Label>
              <Select 
                value={quizRequest.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>Select category...</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="History">History</SelectItem>
                  <SelectItem value="Literature">Literature</SelectItem>
                  <SelectItem value="Social Studies">Social Studies</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="mb-4">
              <Label htmlFor="keywords" className="block text-sm font-medium mb-2">
                Topic Keywords (optional)
              </Label>
              <Input 
                id="keywords"
                placeholder="e.g., ocean, planets, dinosaurs" 
                value={quizRequest.keywords}
                onChange={(e) => handleInputChange('keywords', e.target.value)}
              />
            </div>
            
            <div className="mb-4">
              <Label htmlFor="questionCount" className="block text-sm font-medium mb-2">
                Number of Questions
              </Label>
              <Select 
                value={quizRequest.questionCount.toString()}
                onValueChange={(value) => handleInputChange('questionCount', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 questions</SelectItem>
                  <SelectItem value="5">5 questions</SelectItem>
                  <SelectItem value="7">7 questions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Reading & Questions'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quizzes List */}
      <Card>
        <CardHeader className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-heading text-lg font-medium">Quizzes</h3>
        </CardHeader>
        
        <CardContent className="p-5">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {quizzes.map((quiz) => (
              <li key={quiz.id} className="py-3 flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{quiz.title}</h4>
                  <div className="flex space-x-2 text-xs mt-1">
                    <span className="text-gray-500 dark:text-gray-400">Level {quiz.readingLevel}</span>
                    <span className="text-gray-500 dark:text-gray-400">•</span>
                    <span className="text-gray-500 dark:text-gray-400">{quiz.category}</span>
                    <span className="text-gray-500 dark:text-gray-400">•</span>
                    <span className="text-gray-500 dark:text-gray-400">{quiz.questionCount} questions</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    onClick={() => onEditQuiz && onEditQuiz(quiz.id)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    onClick={() => onDeleteQuiz && onDeleteQuiz(quiz.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          
          <Button 
            variant="outline" 
            className="mt-4 w-full"
            onClick={onViewAllQuizzes}
          >
            View All Quizzes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
