import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertQuizSchema, insertQuestionSchema, insertUserQuizSchema } from "@shared/schema";

// Validation schemas
const firebaseUserSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  photoURL: z.string().optional(),
});

// For quiz generation request
const generateQuizRequestSchema = z.object({
  prompt: z.string(),
  readingLevel: z.string(),
  category: z.string(),
  questionCount: z.number().int().min(1).max(10),
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // ====== User Authentication/Management Routes ======
  
  // Create or update user with Firebase auth info
  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = firebaseUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByUid(validatedData.uid);
      
      if (existingUser) {
        // Update user
        const updatedUser = await storage.updateUser(existingUser.id, {
          email: validatedData.email,
          displayName: validatedData.displayName || existingUser.displayName,
          photoURL: validatedData.photoURL || existingUser.photoURL,
        });
        
        return res.status(200).json(updatedUser);
      } else {
        // Create new user
        const newUser = await storage.createUser({
          uid: validatedData.uid,
          email: validatedData.email,
          displayName: validatedData.displayName || null,
          photoURL: validatedData.photoURL || null,
          role: "user",
          readingLevel: "1A",
          knowledgePoints: 0,
        });
        
        return res.status(201).json(newUser);
      }
    } catch (error) {
      console.error("Error creating/updating user:", error);
      return res.status(400).json({ error: "Invalid request data" });
    }
  });
  
  // Check if user is admin
  app.get("/api/users/check-admin", async (req, res) => {
    try {
      // This would normally use the authenticated user's info
      // For demo purposes, we'll just return a mock response
      return res.status(200).json({ isAdmin: true });
    } catch (error) {
      console.error("Error checking admin status:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });
  
  // Get user stats
  app.get("/api/user/stats", async (req, res) => {
    try {
      // This would normally fetch actual user stats
      // For demo purposes, we'll return mock data
      const mockUserStats = {
        readingLevel: "8B",
        previousLevel: "7A",
        quizzesCompleted: 24,
        quizzesThisWeek: 3,
        knowledgePoints: 1250,
        pointsToNextLevel: 1500,
        weeklyActivity: [
          { day: "Mon", count: 1, isActive: false },
          { day: "Tue", count: 3, isActive: false },
          { day: "Wed", count: 2, isActive: false },
          { day: "Thu", count: 2, isActive: false },
          { day: "Fri", count: 4, isActive: true },
          { day: "Sat", count: 1, isActive: false },
          { day: "Sun", count: 0, isActive: false },
        ],
        readingLevels: [
          { id: "1", label: "6A", status: "completed" },
          { id: "2", label: "7A", status: "completed" },
          { id: "3", label: "8B", status: "current" },
          { id: "4", label: "9A", status: "upcoming" },
          { id: "5", label: "10A", status: "goal" },
        ],
        currentProgress: 78,
      };
      
      return res.status(200).json(mockUserStats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });
  
  // ====== Quiz Management Routes ======
  
  // Get all quizzes
  app.get("/api/quizzes", async (req, res) => {
    try {
      const quizzes = await storage.getAllQuizzes();
      return res.status(200).json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });
  
  // Get recommended quizzes
  app.get("/api/quizzes/recommended", async (req, res) => {
    try {
      // This would normally fetch recommended quizzes based on user's level
      // For demo purposes, we'll return mock data
      const mockRecommendedQuizzes = [
        {
          id: "1",
          title: "The Wonders of Marine Biology",
          description: "Explore the fascinating world beneath the ocean's surface...",
          image: "",
          readingLevel: "8B",
          category: "Science",
        },
        {
          id: "2",
          title: "Space Exploration: Past and Future",
          description: "The history and future prospects of human space travel...",
          image: "",
          readingLevel: "8A",
          category: "History/Science",
        },
        {
          id: "3",
          title: "Modern Architecture and Design",
          description: "Exploring the principles behind contemporary buildings...",
          image: "",
          readingLevel: "8B",
          category: "Arts",
        }
      ];
      
      return res.status(200).json(mockRecommendedQuizzes);
    } catch (error) {
      console.error("Error fetching recommended quizzes:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });
  
  // Get single quiz
  app.get("/api/quizzes/:id", async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }
      
      const quiz = await storage.getQuizById(quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      
      // Fetch questions for this quiz
      const questions = await storage.getQuestionsByQuizId(quizId);
      
      return res.status(200).json({
        ...quiz,
        questions,
      });
    } catch (error) {
      console.error("Error fetching quiz:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });
  
  // Submit quiz answers
  app.post("/api/quizzes/:id/submit", async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }
      
      // This would normally validate the submitted answers and calculate score
      // For demo purposes, we'll just return a mock response
      
      return res.status(200).json({
        success: true,
        score: 0.8,
        correctAnswers: 4,
        totalQuestions: 5,
        pointsEarned: 150,
      });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });
  
  // Get quiz results
  app.get("/api/quizzes/:id/results", async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }
      
      // This would normally fetch actual quiz results
      // For demo purposes, we'll return mock data
      const mockResults = {
        title: "Marine Biology: Ocean Ecosystems",
        score: 0.8,
        correctAnswers: 4,
        totalQuestions: 5,
        pointsEarned: 150,
        timeSpent: 265, // seconds
        averageTime: 310, // seconds
        levelImproved: true,
        nextLevel: "9A",
      };
      
      return res.status(200).json(mockResults);
    } catch (error) {
      console.error("Error fetching quiz results:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });
  
  // ====== Achievement Routes ======
  
  // Get user achievements
  app.get("/api/user/achievements", async (req, res) => {
    try {
      // This would normally fetch actual user achievements
      // For demo purposes, we'll return mock data
      const mockAchievements = [
        {
          id: "1",
          title: "5-Day Streak",
          description: "Completed quizzes for 5 days in a row",
          icon: "fire",
          bgClass: "bg-gradient-to-br from-primary-500 to-secondary-600",
        },
        {
          id: "2",
          title: "Knowledge Master",
          description: "Scored 100% on 5 consecutive quizzes",
          icon: "brain",
          bgClass: "bg-gradient-to-br from-green-500 to-emerald-600",
        },
        {
          id: "3",
          title: "Level Up",
          description: "Advanced to reading level 8B",
          icon: "rocket",
          bgClass: "bg-gradient-to-br from-amber-500 to-orange-600",
        },
        {
          id: "4",
          title: "Bookworm",
          description: "Completed 20 reading passages",
          icon: "book",
          bgClass: "bg-gradient-to-br from-blue-500 to-cyan-600",
        }
      ];
      
      return res.status(200).json(mockAchievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });
  
  // Get all achievements (including progress on unearned ones)
  app.get("/api/user/achievements/all", async (req, res) => {
    try {
      // This would normally fetch all achievements with progress
      // Mock data is returned in the component
      return res.status(200).json([]);
    } catch (error) {
      console.error("Error fetching all achievements:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });
  
  // ====== History Routes ======
  
  // Get user quiz history
  app.get("/api/user/history", async (req, res) => {
    try {
      // This would normally fetch user's quiz history
      // Mock data is returned in the component
      return res.status(200).json([]);
    } catch (error) {
      console.error("Error fetching quiz history:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });
  
  // ====== Admin Routes ======
  
  // Get admin dashboard stats
  app.get("/api/admin/stats", async (req, res) => {
    try {
      // This would normally fetch actual admin stats
      // For demo purposes, we'll return mock data
      const mockAdminStats = {
        activeUsers: 1245,
        userChangePercentage: 12,
        quizzesTaken: 8376,
        quizChangePercentage: 8,
        averageLevel: "6B",
        mostCommonRange: "5A-7B",
        issuesReported: 12,
        newIssues: 3,
      };
      
      return res.status(200).json(mockAdminStats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });
  
  // Get all users for admin
  app.get("/api/admin/users", async (req, res) => {
    try {
      // This would normally fetch all users
      // Mock data is returned in the component
      return res.status(200).json([]);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });
  
  // Get all passages for admin
  app.get("/api/admin/passages", async (req, res) => {
    try {
      // This would normally fetch all passages
      // Mock data is returned in the component
      return res.status(200).json([]);
    } catch (error) {
      console.error("Error fetching passages:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });
  
  // Delete passage (admin)
  app.delete("/api/admin/passages/:id", async (req, res) => {
    try {
      const passageId = parseInt(req.params.id);
      if (isNaN(passageId)) {
        return res.status(400).json({ error: "Invalid passage ID" });
      }
      
      // This would normally delete the passage and related questions
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting passage:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });
  
  // Generate quiz with Gemini API (admin)
  app.post("/api/admin/generate-quiz", async (req, res) => {
    try {
      const { prompt, readingLevel, category, questionCount } = generateQuizRequestSchema.parse(req.body);
      
      // In a real app, this would use the Gemini API to generate content
      // For demo purposes, we'll return a mock response
      const mockGeneratedQuiz = {
        title: "The Marvels of Deep Ocean Exploration",
        passage: "The deep ocean remains one of Earth's last frontiers. Despite covering more than 70% of our planet's surface, we have explored less than 5% of the ocean. The deep sea, typically defined as ocean depths below 200 meters (656 feet), presents extreme conditions including near-freezing temperatures, crushing pressure, and complete darkness. Yet, remarkably, life thrives in this seemingly inhospitable environment.\n\nDeep-sea exploration has revealed ecosystems of extraordinary diversity. Hydrothermal vents, discovered in 1977, host communities of organisms that derive energy from chemicals rather than sunlight through a process called chemosynthesis. Giant tube worms, ghostly white crabs, and unique microorganisms have adapted to these extreme conditions. These discoveries have revolutionized our understanding of where and how life can exist.\n\nModern deep-sea exploration relies on advanced technology. Remotely operated vehicles (ROVs) and autonomous underwater vehicles (AUVs) can reach depths that would crush human divers. These sophisticated robots are equipped with high-definition cameras, sampling tools, and various sensors that collect environmental data. In 2012, filmmaker James Cameron made history by piloting the Deepsea Challenger to the Mariana Trench's bottom, reaching the deepest known point in Earth's oceans at nearly 11,000 meters (36,000 feet).\n\nThe importance of deep-sea research extends beyond scientific curiosity. The ocean regulates our climate, provides resources, and holds potential for medical and technological breakthroughs. Compounds from deep-sea organisms are being studied for their potential in treating cancer and other diseases. Additionally, understanding deep-sea ecosystems is crucial for their protection, as activities like deep-sea mining and bottom trawling pose significant threats to these fragile habitats.",
        questions: [
          {
            text: "What percentage of the ocean has been explored according to the passage?",
            options: [
              { id: "a", text: "A. Less than 5%" },
              { id: "b", text: "B. More than 70%" },
              { id: "c", text: "C. About 20%" },
              { id: "d", text: "D. Approximately 50%" }
            ],
            correctAnswer: "a"
          },
          {
            text: "What process do organisms near hydrothermal vents use to derive energy?",
            options: [
              { id: "a", text: "A. Photosynthesis" },
              { id: "b", text: "B. Respiration" },
              { id: "c", text: "C. Chemosynthesis" },
              { id: "d", text: "D. Fermentation" }
            ],
            correctAnswer: "c"
          },
          {
            text: "When were hydrothermal vents discovered?",
            options: [
              { id: "a", text: "A. 1957" },
              { id: "b", text: "B. 1967" },
              { id: "c", text: "C. 1977" },
              { id: "d", text: "D. 1987" }
            ],
            correctAnswer: "c"
          },
          {
            text: "What is the approximate depth of the Mariana Trench according to the passage?",
            options: [
              { id: "a", text: "A. 1,100 meters" },
              { id: "b", text: "B. 11,000 meters" },
              { id: "c", text: "C. 110,000 meters" },
              { id: "d", text: "D. 200 meters" }
            ],
            correctAnswer: "b"
          },
          {
            text: "Which of the following is NOT mentioned as a potential benefit of deep-sea research?",
            options: [
              { id: "a", text: "A. Medical breakthroughs" },
              { id: "b", text: "B. Climate regulation understanding" },
              { id: "c", text: "C. Military applications" },
              { id: "d", text: "D. Protection of fragile habitats" }
            ],
            correctAnswer: "c"
          }
        ],
        readingLevel,
        category
      };
      
      return res.status(200).json(mockGeneratedQuiz);
    } catch (error) {
      console.error("Error generating quiz:", error);
      return res.status(500).json({ error: "Failed to generate quiz" });
    }
  });
  
  // Generate quiz with Gemini API (user-facing endpoint)
  app.post("/api/generate-quiz", async (req, res) => {
    try {
      const { prompt, readingLevel, category, questionCount } = generateQuizRequestSchema.parse(req.body);
      
      // This endpoint would use the same Gemini API to generate content
      // Just forwarding to the admin endpoint for demo purposes
      const mockGeneratedQuiz = {
        title: "The Marvels of Deep Ocean Exploration",
        passage: "The deep ocean remains one of Earth's last frontiers. Despite covering more than 70% of our planet's surface, we have explored less than 5% of the ocean. The deep sea, typically defined as ocean depths below 200 meters (656 feet), presents extreme conditions including near-freezing temperatures, crushing pressure, and complete darkness. Yet, remarkably, life thrives in this seemingly inhospitable environment.\n\nDeep-sea exploration has revealed ecosystems of extraordinary diversity. Hydrothermal vents, discovered in 1977, host communities of organisms that derive energy from chemicals rather than sunlight through a process called chemosynthesis. Giant tube worms, ghostly white crabs, and unique microorganisms have adapted to these extreme conditions. These discoveries have revolutionized our understanding of where and how life can exist.\n\nModern deep-sea exploration relies on advanced technology. Remotely operated vehicles (ROVs) and autonomous underwater vehicles (AUVs) can reach depths that would crush human divers. These sophisticated robots are equipped with high-definition cameras, sampling tools, and various sensors that collect environmental data. In 2012, filmmaker James Cameron made history by piloting the Deepsea Challenger to the Mariana Trench's bottom, reaching the deepest known point in Earth's oceans at nearly 11,000 meters (36,000 feet).\n\nThe importance of deep-sea research extends beyond scientific curiosity. The ocean regulates our climate, provides resources, and holds potential for medical and technological breakthroughs. Compounds from deep-sea organisms are being studied for their potential in treating cancer and other diseases. Additionally, understanding deep-sea ecosystems is crucial for their protection, as activities like deep-sea mining and bottom trawling pose significant threats to these fragile habitats.",
        questions: [
          {
            text: "What percentage of the ocean has been explored according to the passage?",
            options: [
              { id: "a", text: "A. Less than 5%" },
              { id: "b", text: "B. More than 70%" },
              { id: "c", text: "C. About 20%" },
              { id: "d", text: "D. Approximately 50%" }
            ],
            correctAnswer: "a"
          },
          {
            text: "What process do organisms near hydrothermal vents use to derive energy?",
            options: [
              { id: "a", text: "A. Photosynthesis" },
              { id: "b", text: "B. Respiration" },
              { id: "c", text: "C. Chemosynthesis" },
              { id: "d", text: "D. Fermentation" }
            ],
            correctAnswer: "c"
          },
          {
            text: "When were hydrothermal vents discovered?",
            options: [
              { id: "a", text: "A. 1957" },
              { id: "b", text: "B. 1967" },
              { id: "c", text: "C. 1977" },
              { id: "d", text: "D. 1987" }
            ],
            correctAnswer: "c"
          },
          {
            text: "What is the approximate depth of the Mariana Trench according to the passage?",
            options: [
              { id: "a", text: "A. 1,100 meters" },
              { id: "b", text: "B. 11,000 meters" },
              { id: "c", text: "C. 110,000 meters" },
              { id: "d", text: "D. 200 meters" }
            ],
            correctAnswer: "b"
          },
          {
            text: "Which of the following is NOT mentioned as a potential benefit of deep-sea research?",
            options: [
              { id: "a", text: "A. Medical breakthroughs" },
              { id: "b", text: "B. Climate regulation understanding" },
              { id: "c", text: "C. Military applications" },
              { id: "d", text: "D. Protection of fragile habitats" }
            ],
            correctAnswer: "c"
          }
        ],
        readingLevel,
        category
      };
      
      return res.status(200).json(mockGeneratedQuiz);
    } catch (error) {
      console.error("Error generating quiz:", error);
      return res.status(500).json({ error: "Failed to generate quiz" });
    }
  });

  return httpServer;
}
