import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useAdmin, useAuth } from "@/lib/hooks";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ChevronLeft, Plus, Trash2, ArrowUp, ArrowDown, X, GripVertical, Settings } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Component types (import from QuizBuilder or redefine here)
interface ComponentBase {
  id: string;
  type: string;
  order: number;
}

interface TitleComponent extends ComponentBase {
  type: 'title';
  content: string;
}

interface HeadingComponent extends ComponentBase {
  type: 'heading';
  content: string;
}

interface SubheadingComponent extends ComponentBase {
  type: 'subheading';
  content: string;
}

interface PassageComponent extends ComponentBase {
  type: 'passage';
  content: string;
}

interface ImageComponent extends ComponentBase {
  type: 'image';
  url: string;
  alt: string;
}

interface TableComponent extends ComponentBase {
  type: 'table';
  headers: string[];
  rows: string[][];
}

interface Option {
  id: string;
  text: string;
}

interface MultipleChoiceQuestion extends ComponentBase {
  type: 'multiple-choice';
  question: string;
  options: Option[];
  correctOption: string;
}

interface FillBlanksQuestion extends ComponentBase {
  type: 'fill-blanks';
  question: string;
  blanks: { id: string; answer: string }[];
}

interface TrueFalseQuestion extends ComponentBase {
  type: 'true-false-not-given';
  question: string;
  correctAnswer: 'true' | 'false' | 'not-given';
}

type QuizComponent = 
  | TitleComponent 
  | HeadingComponent 
  | SubheadingComponent 
  | PassageComponent 
  | ImageComponent 
  | TableComponent 
  | MultipleChoiceQuestion 
  | FillBlanksQuestion 
  | TrueFalseQuestion;

interface QuizMetadata {
  title: string;
  readingLevel: string;
  category: string;
  isRecommended: boolean;
}

// Sidebar component to add new quiz elements (reuse from QuizBuilder)
const ComponentSidebar = ({ onAddComponent }) => {
  return (
    <Card className="sticky top-4">
      <CardContent className="p-4">
        <h3 className="font-medium mb-3">Add Components</h3>
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            onClick={() => onAddComponent('title')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Title
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            onClick={() => onAddComponent('heading')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Heading
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            onClick={() => onAddComponent('subheading')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Subheading
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            onClick={() => onAddComponent('passage')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Passage
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            onClick={() => onAddComponent('image')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Image
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            onClick={() => onAddComponent('table')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Table
          </Button>
          
          <div className="pt-2 border-t">
            <h4 className="text-sm font-medium mb-2">Question Types</h4>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => onAddComponent('multiple-choice')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Multiple Choice
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start mt-2" 
              onClick={() => onAddComponent('fill-blanks')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Fill in the Blanks
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start mt-2" 
              onClick={() => onAddComponent('true-false-not-given')}
            >
              <Plus className="h-4 w-4 mr-2" />
              True/False/Not Given
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Component renderer (reuse from QuizBuilder)
const ComponentRenderer = ({ component, onEdit, onDelete, onMove, isFirst, isLast }) => {
  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(component.id);
  };
  
  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(component.id);
  };
  
  const handleMoveUp = (e) => {
    e.stopPropagation();
    onMove(component.id, 'up');
  };
  
  const handleMoveDown = (e) => {
    e.stopPropagation();
    onMove(component.id, 'down');
  };
  
  const renderComponent = () => {
    switch (component.type) {
      case 'title':
        return (
          <div className="text-2xl font-bold mb-2">
            {component.content}
          </div>
        );
      
      case 'heading':
        return (
          <div className="text-xl font-semibold mb-2">
            {component.content}
          </div>
        );
        
      case 'subheading':
        return (
          <div className="text-lg font-medium mb-2">
            {component.content}
          </div>
        );
        
      case 'passage':
        return (
          <div className="prose dark:prose-invert max-w-none mb-2">
            {component.content.split('\n').map((paragraph, idx) => (
              <p key={idx} className="mb-2">{paragraph}</p>
            ))}
          </div>
        );
        
      case 'image':
        return (
          <div className="mb-2">
            <img 
              src={component.url} 
              alt={component.alt} 
              className="max-w-full rounded-md" 
            />
            {component.alt && <p className="text-sm text-gray-500 mt-1">{component.alt}</p>}
          </div>
        );
        
      case 'table':
        return (
          <div className="mb-2 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {component.headers.map((header, idx) => (
                    <th key={idx} className="border px-4 py-2 bg-gray-100 dark:bg-gray-700">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {component.rows.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="border px-4 py-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        
      case 'multiple-choice':
        return (
          <div className="mb-4">
            <div className="font-medium mb-2">{component.question}</div>
            <div className="space-y-2">
              {component.options.map((option) => (
                <div key={option.id} className={`flex items-center p-2 rounded-md border ${
                  option.id === component.correctOption ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'
                }`}>
                  <div className={`h-4 w-4 rounded-full mr-2 ${
                    option.id === component.correctOption ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                  <span>{option.text}</span>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'fill-blanks':
        return (
          <div className="mb-4">
            <div className="font-medium mb-2">{component.question.split('___').map((part, i, arr) => (
              <>
                {part}
                {i < arr.length - 1 && (
                  <span className="inline-block bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded mx-1 border border-blue-200 dark:border-blue-800">
                    {component.blanks[i]?.answer || '_____'}
                  </span>
                )}
              </>
            ))}</div>
          </div>
        );
        
      case 'true-false-not-given':
        return (
          <div className="mb-4">
            <div className="font-medium mb-2">{component.question}</div>
            <div className="flex space-x-4">
              <div className={`px-3 py-1.5 rounded-md ${
                component.correctAnswer === 'true' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-medium' : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                True
              </div>
              <div className={`px-3 py-1.5 rounded-md ${
                component.correctAnswer === 'false' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 font-medium' : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                False
              </div>
              <div className={`px-3 py-1.5 rounded-md ${
                component.correctAnswer === 'not-given' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 font-medium' : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                Not Given
              </div>
            </div>
          </div>
        );
        
      default:
        return <div>Unknown component type: {component.type}</div>;
    }
  };
  
  return (
    <motion.div
      className="relative group border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4 bg-white dark:bg-gray-800"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onClick={handleEdit}
    >
      <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleEdit} className="h-7 w-7">
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit Component</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleDelete} className="h-7 w-7 text-red-500">
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete Component</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {!isFirst && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleMoveUp} className="h-7 w-7">
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Move Up</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {!isLast && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleMoveDown} className="h-7 w-7">
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Move Down</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <div className="absolute top-1/2 -left-2 -translate-y-1/2 hidden group-hover:block cursor-move">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      
      <div className="pl-3">
        {renderComponent()}
      </div>
    </motion.div>
  );
};

// Component edit dialogs (reuse from QuizBuilder)
const ComponentEditor = ({ component, onSave, onClose }) => {
  const [editedComponent, setEditedComponent] = useState(component);
  
  const handleChange = (field, value) => {
    setEditedComponent({
      ...editedComponent,
      [field]: value
    });
  };
  
  const handleSave = () => {
    onSave(editedComponent);
    onClose();
  };
  
  const renderEditor = () => {
    switch (component.type) {
      case 'title':
      case 'heading':
      case 'subheading':
        return (
          <>
            <div className="mb-4">
              <Label htmlFor="content">Content</Label>
              <Input
                id="content"
                value={editedComponent.content}
                onChange={(e) => handleChange('content', e.target.value)}
                className="mt-1"
              />
            </div>
          </>
        );
        
      case 'passage':
        return (
          <>
            <div className="mb-4">
              <Label htmlFor="content">Passage Text</Label>
              <Textarea
                id="content"
                value={editedComponent.content}
                onChange={(e) => handleChange('content', e.target.value)}
                className="mt-1 min-h-[200px]"
              />
            </div>
          </>
        );
        
      case 'image':
        return (
          <>
            <div className="mb-4">
              <Label htmlFor="url">Image URL</Label>
              <Input
                id="url"
                value={editedComponent.url}
                onChange={(e) => handleChange('url', e.target.value)}
                className="mt-1"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="mb-4">
              <Label htmlFor="alt">Alt Text</Label>
              <Input
                id="alt"
                value={editedComponent.alt}
                onChange={(e) => handleChange('alt', e.target.value)}
                className="mt-1"
                placeholder="Description of the image"
              />
            </div>
            {editedComponent.url && (
              <div className="mb-4 border p-2 rounded">
                <img 
                  src={editedComponent.url} 
                  alt={editedComponent.alt} 
                  className="max-w-full max-h-[200px] mx-auto rounded" 
                />
              </div>
            )}
          </>
        );
        
      case 'table':
        return (
          <>
            <div className="mb-4">
              <Label>Headers</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {editedComponent.headers.map((header, index) => (
                  <div key={index} className="flex items-center">
                    <Input
                      value={header}
                      onChange={(e) => {
                        const newHeaders = [...editedComponent.headers];
                        newHeaders[index] = e.target.value;
                        handleChange('headers', newHeaders);
                      }}
                      className="w-[150px]"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newHeaders = editedComponent.headers.filter((_, i) => i !== index);
                        const newRows = editedComponent.rows.map(row => 
                          row.filter((_, i) => i !== index)
                        );
                        setEditedComponent({
                          ...editedComponent,
                          headers: newHeaders,
                          rows: newRows
                        });
                      }}
                      className="ml-1 text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newHeaders = [...editedComponent.headers, ''];
                    const newRows = editedComponent.rows.map(row => [...row, '']);
                    setEditedComponent({
                      ...editedComponent,
                      headers: newHeaders,
                      rows: newRows
                    });
                  }}
                >
                  Add Column
                </Button>
              </div>
            </div>
            
            <div className="mb-4">
              <Label>Table Data</Label>
              <div className="mt-1 border rounded overflow-hidden">
                {editedComponent.rows.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex border-b last:border-0">
                    {row.map((cell, colIndex) => (
                      <div key={colIndex} className="flex-1 border-r last:border-0 p-1">
                        <Input
                          value={cell}
                          onChange={(e) => {
                            const newRows = [...editedComponent.rows];
                            newRows[rowIndex][colIndex] = e.target.value;
                            handleChange('rows', newRows);
                          }}
                          className="w-full border-0 focus-visible:ring-0 p-1 h-8"
                        />
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newRows = editedComponent.rows.filter((_, i) => i !== rowIndex);
                        handleChange('rows', newRows);
                      }}
                      className="m-1 h-8 w-8 text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newRow = Array(editedComponent.headers.length).fill('');
                  const newRows = [...editedComponent.rows, newRow];
                  handleChange('rows', newRows);
                }}
                className="mt-2"
              >
                Add Row
              </Button>
            </div>
          </>
        );
        
      case 'multiple-choice':
        return (
          <>
            <div className="mb-4">
              <Label htmlFor="question">Question</Label>
              <Textarea
                id="question"
                value={editedComponent.question}
                onChange={(e) => handleChange('question', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="mb-4">
              <Label>Options</Label>
              <div className="space-y-2 mt-1">
                {editedComponent.options.map((option) => (
                  <div key={option.id} className="flex items-center">
                    <RadioGroup 
                      value={editedComponent.correctOption}
                      onValueChange={(value) => handleChange('correctOption', value)}
                      className="flex items-center"
                    >
                      <RadioGroupItem value={option.id} id={option.id} />
                    </RadioGroup>
                    <Input
                      value={option.text}
                      onChange={(e) => {
                        const newOptions = editedComponent.options.map(o => 
                          o.id === option.id ? { ...o, text: e.target.value } : o
                        );
                        handleChange('options', newOptions);
                      }}
                      className="ml-2 flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (editedComponent.options.length <= 2) {
                          return; // Don't allow fewer than 2 options
                        }
                        
                        const newOptions = editedComponent.options.filter(o => o.id !== option.id);
                        let newCorrectOption = editedComponent.correctOption;
                        
                        // If we're removing the correct option, select the first available option
                        if (newCorrectOption === option.id) {
                          newCorrectOption = newOptions[0].id;
                        }
                        
                        setEditedComponent({
                          ...editedComponent,
                          options: newOptions,
                          correctOption: newCorrectOption
                        });
                      }}
                      className="ml-1 text-red-500"
                      disabled={editedComponent.options.length <= 2}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newOption = {
                    id: uuidv4(),
                    text: `Option ${editedComponent.options.length + 1}`
                  };
                  handleChange('options', [...editedComponent.options, newOption]);
                }}
                className="mt-2"
              >
                Add Option
              </Button>
            </div>
          </>
        );
        
      case 'fill-blanks':
        return (
          <>
            <div className="mb-4">
              <Label htmlFor="question">Question Text (use ___ for blanks)</Label>
              <Textarea
                id="question"
                value={editedComponent.question}
                onChange={(e) => {
                  const newQuestion = e.target.value;
                  handleChange('question', newQuestion);
                  
                  // Count blanks and update blank answers array if needed
                  const blankCount = (newQuestion.match(/___/g) || []).length;
                  let newBlanks = [...(editedComponent.blanks || [])];
                  
                  // Add blanks if we need more
                  while (newBlanks.length < blankCount) {
                    newBlanks.push({ id: uuidv4(), answer: '' });
                  }
                  
                  // Remove blanks if we have too many
                  if (newBlanks.length > blankCount) {
                    newBlanks = newBlanks.slice(0, blankCount);
                  }
                  
                  handleChange('blanks', newBlanks);
                }}
                className="mt-1"
                placeholder="The capital of France is ___."
              />
            </div>
            
            {editedComponent.blanks && editedComponent.blanks.length > 0 && (
              <div className="mb-4">
                <Label>Answers</Label>
                <div className="space-y-2 mt-1">
                  {editedComponent.blanks.map((blank, index) => (
                    <div key={blank.id} className="flex items-center">
                      <div className="mr-2 text-sm text-gray-500">Blank {index + 1}:</div>
                      <Input
                        value={blank.answer}
                        onChange={(e) => {
                          const newBlanks = editedComponent.blanks.map((b, i) => 
                            i === index ? { ...b, answer: e.target.value } : b
                          );
                          handleChange('blanks', newBlanks);
                        }}
                        className="flex-1"
                        placeholder="Answer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );
        
      case 'true-false-not-given':
        return (
          <>
            <div className="mb-4">
              <Label htmlFor="question">Statement</Label>
              <Textarea
                id="question"
                value={editedComponent.question}
                onChange={(e) => handleChange('question', e.target.value)}
                className="mt-1"
                placeholder="According to the passage, Earth is the third planet from the Sun."
              />
            </div>
            
            <div className="mb-4">
              <Label>Correct Answer</Label>
              <RadioGroup 
                value={editedComponent.correctAnswer}
                onValueChange={(value) => handleChange('correctAnswer', value)}
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="true" />
                  <Label htmlFor="true" className="cursor-pointer">True</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="false" />
                  <Label htmlFor="false" className="cursor-pointer">False</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="not-given" id="not-given" />
                  <Label htmlFor="not-given" className="cursor-pointer">Not Given</Label>
                </div>
              </RadioGroup>
            </div>
          </>
        );
        
      default:
        return <div>Unknown component type: {component.type}</div>;
    }
  };
  
  return (
    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          Edit {component.type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
        </DialogTitle>
      </DialogHeader>
      
      <div className="py-4">
        {renderEditor()}
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </DialogFooter>
    </DialogContent>
  );
};

// Helper function to convert Firestore flat table format back to 2D array
const convertFirestoreTableData = (component) => {
  if (component.type === 'table' && component.flatRows) {
    const { flatRows, rowCount, colCount } = component;
    const rows = [];
    
    for (let i = 0; i < rowCount; i++) {
      const row = [];
      for (let j = 0; j < colCount; j++) {
        row.push(flatRows[`${i}_${j}`] || '');
      }
      rows.push(row);
    }
    
    // Create a new component with the 2D array
    return {
      ...component,
      rows,
      // Remove the flat representation
      flatRows: undefined,
      rowCount: undefined,
      colCount: undefined
    };
  }
  
  return component;
};

// Quiz Edit Component
export default function EditQuiz() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  
  // Quiz state
  const [metadata, setMetadata] = useState<QuizMetadata>({
    title: "",
    readingLevel: "",
    category: "",
    isRecommended: false
  });
  
  const [components, setComponents] = useState<QuizComponent[]>([]);
  const [editingComponent, setEditingComponent] = useState<QuizComponent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Available reading levels and categories
  const readingLevels = ["5A", "5B", "6A", "6B", "7A", "7B", "8A", "8B", "9A", "9B"];
  const categories = ["Science", "History", "Literature", "Social Studies", "Arts", "Technology"];
  
  // Load quiz data from Firestore
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!id || !isAdmin) return;
      
      try {
        setIsLoading(true);
        
        const quizRef = doc(db, "quizzes", id);
        const quizSnap = await getDoc(quizRef);
        
        if (!quizSnap.exists()) {
          toast({
            title: "Quiz not found",
            description: "The requested quiz could not be found.",
            variant: "destructive",
          });
          setLocation('/admin');
          return;
        }
        
        const quizData = quizSnap.data();
        
        // Set metadata
        setMetadata({
          title: quizData.title || "Untitled Quiz",
          readingLevel: quizData.readingLevel || "8B",
          category: quizData.category || "Science",
          isRecommended: quizData.isRecommended || false
        });
        
        // Process components (restore tables from flatRows, etc)
        if (quizData.components && Array.isArray(quizData.components)) {
          const processedComponents = quizData.components.map(convertFirestoreTableData);
          setComponents(processedComponents);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading quiz:", error);
        toast({
          title: "Error loading quiz",
          description: error instanceof Error ? error.message : "Failed to load quiz data",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };
    
    fetchQuiz();
  }, [id, isAdmin, setLocation, toast]);
  
  // Handle metadata change
  const handleMetadataChange = (field: keyof QuizMetadata, value: any) => {
    setMetadata(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Add new component
  const handleAddComponent = (type: string) => {
    let newComponent: QuizComponent;
    const order = components.length;
    
    switch (type) {
      case 'title':
        newComponent = {
          id: uuidv4(),
          type: 'title',
          order,
          content: "Quiz Title"
        } as TitleComponent;
        break;
        
      case 'heading':
        newComponent = {
          id: uuidv4(),
          type: 'heading',
          order,
          content: "Section Heading"
        } as HeadingComponent;
        break;
        
      case 'subheading':
        newComponent = {
          id: uuidv4(),
          type: 'subheading',
          order,
          content: "Subsection Heading"
        } as SubheadingComponent;
        break;
        
      case 'passage':
        newComponent = {
          id: uuidv4(),
          type: 'passage',
          order,
          content: "Enter the reading passage text here..."
        } as PassageComponent;
        break;
        
      case 'image':
        newComponent = {
          id: uuidv4(),
          type: 'image',
          order,
          url: "",
          alt: ""
        } as ImageComponent;
        break;
        
      case 'table':
        newComponent = {
          id: uuidv4(),
          type: 'table',
          order,
          headers: ["Header 1", "Header 2"],
          rows: [["Cell 1", "Cell 2"], ["Cell 3", "Cell 4"]]
        } as TableComponent;
        break;
        
      case 'multiple-choice':
        newComponent = {
          id: uuidv4(),
          type: 'multiple-choice',
          order,
          question: "Enter your question here?",
          options: [
            { id: uuidv4(), text: "Option A" },
            { id: uuidv4(), text: "Option B" },
            { id: uuidv4(), text: "Option C" },
            { id: uuidv4(), text: "Option D" }
          ],
          correctOption: ""
        } as MultipleChoiceQuestion;
        // Set the first option as correct by default
        (newComponent as MultipleChoiceQuestion).correctOption = 
          (newComponent as MultipleChoiceQuestion).options[0].id;
        break;
        
      case 'fill-blanks':
        newComponent = {
          id: uuidv4(),
          type: 'fill-blanks',
          order,
          question: "The capital of France is ___.",
          blanks: [{ id: uuidv4(), answer: "Paris" }]
        } as FillBlanksQuestion;
        break;
        
      case 'true-false-not-given':
        newComponent = {
          id: uuidv4(),
          type: 'true-false-not-given',
          order,
          question: "According to the passage, Earth is the third planet from the Sun.",
          correctAnswer: 'true'
        } as TrueFalseQuestion;
        break;
        
      default:
        console.error(`Unknown component type: ${type}`);
        return;
    }
    
    setComponents(prev => [...prev, newComponent]);
    setEditingComponent(newComponent);
  };
  
  // Edit component
  const handleEditComponent = (id: string) => {
    const component = components.find(c => c.id === id);
    if (component) {
      setEditingComponent(component);
    }
  };
  
  // Update component
  const handleUpdateComponent = (updatedComponent: QuizComponent) => {
    setComponents(prev => 
      prev.map(c => c.id === updatedComponent.id ? updatedComponent : c)
    );
    setEditingComponent(null);
  };
  
  // Delete component
  const handleDeleteComponent = (id: string) => {
    setComponents(prev => {
      const filtered = prev.filter(c => c.id !== id);
      // Update order of remaining components
      return filtered.map((c, index) => ({ ...c, order: index }));
    });
  };
  
  // Move component up or down
  const handleMoveComponent = (id: string, direction: 'up' | 'down') => {
    setComponents(prev => {
      const index = prev.findIndex(c => c.id === id);
      if (index === -1) return prev;
      
      // Don't move if already at the top or bottom
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === prev.length - 1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      const newComponents = [...prev];
      
      // Swap components
      const temp = newComponents[index];
      newComponents[index] = newComponents[newIndex];
      newComponents[newIndex] = temp;
      
      // Update order
      return newComponents.map((c, i) => ({ ...c, order: i }));
    });
  };
  
  // Update quiz in Firebase
  const handleUpdateQuiz = async () => {
    if (!id) return;
    
    try {
      // Validation
      if (!metadata.title.trim()) {
        toast({
          title: "Error",
          description: "Please enter a quiz title",
          variant: "destructive",
        });
        return;
      }
      
      // Check if we have a passage
      const hasPassage = components.some(c => c.type === 'passage');
      if (!hasPassage) {
        toast({
          title: "Error",
          description: "Quiz must include at least one reading passage",
          variant: "destructive",
        });
        return;
      }
      
      // Count questions
      const questionCount = components.filter(c => 
        c.type === 'multiple-choice' || 
        c.type === 'fill-blanks' || 
        c.type === 'true-false-not-given'
      ).length;
      
      if (questionCount === 0) {
        toast({
          title: "Error",
          description: "Quiz must include at least one question",
          variant: "destructive",
        });
        return;
      }
      
      setIsSaving(true);
      
      // Find the first passage component to use as the main passage
      const passageComponent = components.find(c => c.type === 'passage') as PassageComponent;
      const passageText = passageComponent ? passageComponent.content : "";
      
      // Extract questions and prepare for Firestore (avoiding nested arrays)
      const questions = components
        .filter(c => 
          c.type === 'multiple-choice' || 
          c.type === 'fill-blanks' || 
          c.type === 'true-false-not-given'
        )
        .map(c => {
          if (c.type === 'multiple-choice') {
            const mc = c as MultipleChoiceQuestion;
            return {
              type: 'multiple-choice',
              text: mc.question,
              options: mc.options,
              correctAnswer: mc.correctOption
            };
          } else if (c.type === 'fill-blanks') {
            const fb = c as FillBlanksQuestion;
            return {
              type: 'fill-blanks',
              text: fb.question,
              blanks: fb.blanks
            };
          } else {
            const tf = c as TrueFalseQuestion;
            return {
              type: 'true-false-not-given',
              text: tf.question,
              correctAnswer: tf.correctAnswer
            };
          }
        });
      
      // Prepare components data for Firestore (avoiding nested arrays)
      const componentsForFirestore = components.map(component => {
        // Make a copy of the component that we can modify
        const firestoreComponent = {...component};
        
        // Handle the table component specifically to convert the nested arrays
        if (component.type === 'table') {
          const tableComponent = component as TableComponent;
          // Convert the 2D array to a flat format that Firestore can handle
          const flatRows = {};
          tableComponent.rows.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
              flatRows[`${rowIndex}_${colIndex}`] = cell;
            });
          });
          
          // Replace the nested array with our flat object
          firestoreComponent['flatRows'] = flatRows;
          firestoreComponent['rowCount'] = tableComponent.rows.length;
          firestoreComponent['colCount'] = tableComponent.headers.length;
          
          // Remove the original nested array
          delete firestoreComponent['rows'];
        }
        
        return firestoreComponent;
      });
      
      // Update the quiz document in Firestore
      const quizData = {
        title: metadata.title,
        passage: passageText,
        readingLevel: metadata.readingLevel,
        category: metadata.category,
        questionCount,
        isPublished: true,
        isRecommended: metadata.isRecommended,
        lastUpdated: serverTimestamp(),
        components: componentsForFirestore,
        questions: questions
      };
      
      // Update in Firestore
      const quizRef = doc(db, "quizzes", id);
      await updateDoc(quizRef, quizData);
      
      toast({
        title: "Success",
        description: "Quiz updated successfully!",
      });
      
      // Redirect back to admin page
      setLocation('/admin');
    } catch (error) {
      console.error("Error updating quiz:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update quiz",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Redirect if not admin
  if (!adminLoading && !isAdmin) {
    setLocation('/');
    return null;
  }
  
  // Show loading state
  if (adminLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <span className="ml-2">Loading quiz...</span>
      </div>
    );
  }
  
  return (
    <>
      <MobileHeader user={user} userLevel={user?.displayName ? user.displayName.charAt(0) : "U"} />
      <DesktopSidebar user={user} userLevel="8B" dailyGoalProgress={2} />
      <MobileNavBar currentRoute="/admin" />
      
      <main className="sm:ml-64 pt-16 sm:pt-0 pb-16 sm:pb-0 min-h-screen">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setLocation('/admin')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">Edit Quiz</h1>
            </div>
            
            <Button 
              onClick={handleUpdateQuiz}
              className="flex items-center gap-1"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
          
          {/* Quiz Metadata */}
          <Card className="mb-6">
            <CardContent className="p-5">
              <h2 className="text-lg font-medium mb-4">Quiz Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Quiz Title</Label>
                  <Input
                    id="title"
                    value={metadata.title}
                    onChange={(e) => handleMetadataChange('title', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Subject Category</Label>
                  <Select 
                    value={metadata.category}
                    onValueChange={(value) => handleMetadataChange('category', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="readingLevel">Reading Level</Label>
                  <Select 
                    value={metadata.readingLevel}
                    onValueChange={(value) => handleMetadataChange('readingLevel', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select reading level" />
                    </SelectTrigger>
                    <SelectContent>
                      {readingLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          Level {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center mt-6">
                  <Checkbox
                    id="isRecommended"
                    checked={metadata.isRecommended}
                    onCheckedChange={(checked) => 
                      handleMetadataChange('isRecommended', Boolean(checked))
                    }
                  />
                  <Label 
                    htmlFor="isRecommended" 
                    className="ml-2 cursor-pointer"
                  >
                    Mark as recommended quiz
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Quiz Builder UI */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar with component options */}
            <div className="md:col-span-1 order-2 md:order-1">
              <ComponentSidebar onAddComponent={handleAddComponent} />
            </div>
            
            {/* Main editing area */}
            <div className="md:col-span-3 order-1 md:order-2">
              {components.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                  <h3 className="text-lg font-medium mb-2">Start Building Your Quiz</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Add components from the sidebar to create your quiz
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => handleAddComponent('passage')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Reading Passage
                  </Button>
                </div>
              ) : (
                <div>
                  {components
                    .sort((a, b) => a.order - b.order)
                    .map((component, index) => (
                      <ComponentRenderer
                        key={component.id}
                        component={component}
                        onEdit={handleEditComponent}
                        onDelete={handleDeleteComponent}
                        onMove={handleMoveComponent}
                        isFirst={index === 0}
                        isLast={index === components.length - 1}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Component Edit Dialog */}
      <Dialog 
        open={!!editingComponent} 
        onOpenChange={(open) => {
          if (!open) setEditingComponent(null);
        }}
      >
        {editingComponent && (
          <ComponentEditor
            component={editingComponent}
            onSave={handleUpdateComponent}
            onClose={() => setEditingComponent(null)}
          />
        )}
      </Dialog>
    </>
  );
}