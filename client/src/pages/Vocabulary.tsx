import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Loader2, BookOpen, X, Search, Volume2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useUserData } from "@/lib/userData";
import { useWordDefinition } from "@/hooks/use-word-definition";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Interface for vocabulary items
interface VocabularyItem {
  word: string;
  addedAt: string;
  quizId: string;
  quizTitle: string;
}

// VocabularyCard component to handle individual word cards with definitions
function VocabularyCard({ item, onRemove }: { 
  item: VocabularyItem; 
  onRemove: (word: string) => Promise<void>;
}) {
  const { data: definition, isLoading, error } = useWordDefinition(item.word);
  const [isOpen, setIsOpen] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  // Find audio URL if available
  useEffect(() => {
    if (definition?.phonetics) {
      const audioUrl = definition.phonetics.find(p => p.audio)?.audio;
      if (audioUrl) {
        setAudio(new Audio(audioUrl));
      }
    }
  }, [definition]);

  // Play pronunciation audio if available
  const playAudio = () => {
    if (audio) {
      audio.play().catch(err => console.error("Error playing audio:", err));
    }
  };

  // Format the date from ISO string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <CardTitle className="text-lg font-bold">{item.word}</CardTitle>
            {audio && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 ml-1" 
                onClick={playAudio}
              >
                <Volume2 className="h-3.5 w-3.5" />
                <span className="sr-only">Play pronunciation</span>
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full -mt-1 -mr-1 text-gray-500 hover:text-red-500"
            onClick={() => onRemove(item.word)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove</span>
          </Button>
        </div>
        <CardDescription className="text-xs">
          Added on {formatDate(item.addedAt)}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-1">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          From quiz: {item.quizTitle}
        </p>
        
        {/* Word Definition Section */}
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden"
        >
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-between px-3 py-1.5 text-sm" 
            >
              <span>Definition</span>
              <span className="text-xs text-gray-500">
                {isOpen ? "Hide" : "Show"}
              </span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-3 pt-1 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : error || definition?.error ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                No definition found for this word.
              </p>
            ) : definition ? (
              <div className="space-y-3 text-sm">
                {definition.meanings.slice(0, 2).map((meaning, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex gap-2 items-center">
                      <Badge variant="outline" className="font-normal text-xs">
                        {meaning.partOfSpeech}
                      </Badge>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                      {meaning.definitions.slice(0, 2).map((def, defIndex) => (
                        <li key={defIndex} className="text-sm">
                          {def.definition}
                          {def.example && (
                            <p className="pl-5 text-xs italic text-gray-500 dark:text-gray-400 mt-0.5">
                              "{def.example}"
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
      
      <CardFooter className="pt-2">
        <Link href={`/quiz/${item.quizId}`}>
          <Button variant="ghost" size="sm" className="w-full justify-start text-primary-600 dark:text-primary-400">
            <BookOpen className="h-4 w-4 mr-2" />
            View in Quiz
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function Vocabulary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: userData } = useUserData();
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch vocabulary words for the user
  useEffect(() => {
    const fetchVocabulary = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const userDocRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userDocRef);
        
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          const userVocabulary = userData.vocabulary || [];
          setVocabulary(userVocabulary);
        }
      } catch (error) {
        console.error("Error fetching vocabulary:", error);
        toast({
          title: "Failed to load vocabulary",
          description: "There was an error loading your vocabulary words. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchVocabulary();
  }, [user, toast]);
  
  // Filter vocabulary based on search term
  const filteredVocabulary = vocabulary.filter(item => 
    item.word.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Remove a word from vocabulary
  const removeWord = async (wordToRemove: string) => {
    if (!user) return;
    
    try {
      // Filter out the word to remove
      const updatedVocabulary = vocabulary.filter(item => item.word !== wordToRemove);
      
      // Update in Firestore
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        vocabulary: updatedVocabulary
      });
      
      // Update local state
      setVocabulary(updatedVocabulary);
      
      toast({
        title: "Word removed",
        description: `"${wordToRemove}" has been removed from your vocabulary list.`,
      });
    } catch (error) {
      console.error("Error removing word:", error);
      toast({
        title: "Failed to remove word",
        description: "There was an error removing the word. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <>
      <MobileHeader user={user} userLevel={userData?.readingLevel || "1A"} />
      <DesktopSidebar user={user} userLevel={userData?.readingLevel || "1A"} dailyGoalProgress={2} />
      
      <main className="sm:ml-64 pt-16 sm:pt-0 pb-16 sm:pb-0 min-h-screen">
        <div className="p-4 sm:p-6 max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-4">My Vocabulary</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Words you've saved from reading passages. Add more words by selecting text in quizzes and using the right-click menu.
            </p>
            
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-4 w-4" />
              <Input 
                className="pl-10"
                placeholder="Search vocabulary..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Vocabulary Grid */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                <span className="ml-2">Loading vocabulary...</span>
              </div>
            ) : filteredVocabulary.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVocabulary.map((item, index) => (
                  <VocabularyCard 
                    key={`${item.word}-${index}`} 
                    item={item}
                    onRemove={removeWord}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
                {searchTerm ? (
                  <>
                    <p className="text-lg font-medium mb-2">No matching words found</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Try a different search term or clear the search box to see all your vocabulary.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setSearchTerm("")}
                    >
                      Clear Search
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">Your vocabulary list is empty</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Start building your vocabulary by selecting words in quizzes and using the right-click menu to add them.
                    </p>
                    <Link href="/quizzes">
                      <Button className="mt-4">
                        Go to Quizzes
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <MobileNavBar currentRoute="/vocabulary" />
    </>
  );
}