// Interface for quiz generation request
export interface GenerateQuizRequest {
  readingLevel: string;
  category: string;
  keywords?: string;
  questionCount: number;
}

// Interface for quiz generation response
export interface GenerateQuizResponse {
  title: string;
  passage: string;
  questions: {
    text: string;
    options: string[];
    correctAnswer: string;
  }[];
  readingLevel: string;
  category: string;
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// Function to generate a reading passage and questions using Gemini API
export const generateQuiz = async ({
  readingLevel,
  category,
  keywords = "",
  questionCount,
}: GenerateQuizRequest): Promise<GenerateQuizResponse> => {
  try {
    // First, check if we have an API key
    if (!API_KEY) {
      // If no API key, we'll throw an error that we can handle in the UI
      throw new Error("No Gemini API key provided");
    }

    const keywordsText = keywords ? `with focus on ${keywords}` : "";
    
    // Create a prompt for Gemini
    const prompt = `
      Create an educational reading comprehension passage appropriate for a ${readingLevel} reading level student. 
      The passage should be about ${category} ${keywordsText}.
      
      The passage should be informative, engaging, and appropriate for the reading level.
      
      After the passage, create ${questionCount} multiple-choice questions that test comprehension of the passage. 
      Each question should have 4 options (A, B, C, D) with exactly one correct answer.
      
      Format your response as JSON with the following structure:
      {
        "title": "The title of the passage",
        "passage": "The full text of the passage...",
        "questions": [
          {
            "text": "Question 1 text?",
            "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
            "correctAnswer": "A"
          },
          ...
        ],
        "readingLevel": "${readingLevel}",
        "category": "${category}"
      }
    `;

    // Call our backend API, which will make the secure Gemini API request
    const response = await fetch('/api/generate-quiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        readingLevel,
        category,
        questionCount,
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to generate quiz');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error generating quiz with Gemini:", error);
    throw error;
  }
};
