import { 
  users, type User, type InsertUser, 
  quizzes, type Quiz, type InsertQuiz,
  questions, type Question, type InsertQuestion,
  userQuizzes, type UserQuiz, type InsertUserQuiz,
  achievements, type Achievement, type InsertAchievement,
  userAchievements, type UserAchievement, type InsertUserAchievement 
} from "@shared/schema";

// Storage interface with all necessary CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUid(uid: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<Omit<User, 'id'>>): Promise<User>;
  
  // Quiz methods
  getAllQuizzes(): Promise<Quiz[]>;
  getQuizById(id: number): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  updateQuiz(id: number, quizData: Partial<Omit<Quiz, 'id'>>): Promise<Quiz>;
  deleteQuiz(id: number): Promise<boolean>;
  
  // Question methods
  getQuestionsByQuizId(quizId: number): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  
  // User Quiz methods
  getUserQuizzesByUserId(userId: number): Promise<UserQuiz[]>;
  createUserQuiz(userQuiz: InsertUserQuiz): Promise<UserQuiz>;
  
  // Achievement methods
  getAllAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: number): Promise<{achievement: Achievement, earnedAt: Date}[]>;
  addUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private quizzes: Map<number, Quiz>;
  private questions: Map<number, Question>;
  private userQuizzes: Map<number, UserQuiz>;
  private achievements: Map<number, Achievement>;
  private userAchievements: Map<number, UserAchievement>;
  
  private currentIds: {
    users: number;
    quizzes: number;
    questions: number;
    userQuizzes: number;
    achievements: number;
    userAchievements: number;
  };

  constructor() {
    this.users = new Map();
    this.quizzes = new Map();
    this.questions = new Map();
    this.userQuizzes = new Map();
    this.achievements = new Map();
    this.userAchievements = new Map();
    
    this.currentIds = {
      users: 1,
      quizzes: 1,
      questions: 1,
      userQuizzes: 1,
      achievements: 1,
      userAchievements: 1
    };
    
    // Initialize with some default achievements
    this.initDefaultAchievements();
  }
  
  private initDefaultAchievements() {
    const defaultAchievements: InsertAchievement[] = [
      {
        title: "5-Day Streak",
        description: "Completed quizzes for 5 days in a row",
        icon: "flame",
        backgroundColor: "bg-gradient-to-br from-primary-500 to-secondary-600",
      },
      {
        title: "Knowledge Master",
        description: "Scored 100% on 5 consecutive quizzes",
        icon: "brain",
        backgroundColor: "bg-gradient-to-br from-green-500 to-emerald-600",
      },
      {
        title: "Bookworm",
        description: "Completed 20 reading passages",
        icon: "book",
        backgroundColor: "bg-gradient-to-br from-blue-500 to-cyan-600",
      }
    ];
    
    defaultAchievements.forEach(achievement => {
      this.createAchievement(achievement);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUid(uid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.uid === uid,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    // Create a new user object with all required fields explicitly set
    const user: User = { 
      id,
      uid: insertUser.uid,
      email: insertUser.email,
      displayName: insertUser.displayName ?? null,
      photoURL: insertUser.photoURL ?? null,
      role: insertUser.role ?? "user",
      readingLevel: insertUser.readingLevel ?? "1A",
      knowledgePoints: insertUser.knowledgePoints ?? 0,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<Omit<User, 'id'>>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Quiz methods
  async getAllQuizzes(): Promise<Quiz[]> {
    return Array.from(this.quizzes.values());
  }
  
  async getQuizById(id: number): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }
  
  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const id = this.currentIds.quizzes++;
    // Create a new quiz object with all required fields explicitly set
    const newQuiz: Quiz = {
      id,
      title: quiz.title,
      passage: quiz.passage,
      readingLevel: quiz.readingLevel,
      category: quiz.category,
      questionCount: quiz.questionCount,
      isPublished: quiz.isPublished ?? true,
      createdAt: new Date()
    };
    this.quizzes.set(id, newQuiz);
    return newQuiz;
  }
  
  async updateQuiz(id: number, quizData: Partial<Omit<Quiz, 'id'>>): Promise<Quiz> {
    const quiz = await this.getQuizById(id);
    if (!quiz) {
      throw new Error(`Quiz with ID ${id} not found`);
    }
    
    const updatedQuiz = { ...quiz, ...quizData };
    this.quizzes.set(id, updatedQuiz);
    return updatedQuiz;
  }
  
  async deleteQuiz(id: number): Promise<boolean> {
    const exists = this.quizzes.has(id);
    if (exists) {
      this.quizzes.delete(id);
      // Also delete related questions
      const quizQuestions = await this.getQuestionsByQuizId(id);
      quizQuestions.forEach(question => {
        this.questions.delete(question.id);
      });
      return true;
    }
    return false;
  }
  
  // Question methods
  async getQuestionsByQuizId(quizId: number): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(
      question => question.quizId === quizId
    );
  }
  
  async createQuestion(question: InsertQuestion): Promise<Question> {
    const id = this.currentIds.questions++;
    const newQuestion: Question = { ...question, id };
    this.questions.set(id, newQuestion);
    return newQuestion;
  }
  
  // User Quiz methods
  async getUserQuizzesByUserId(userId: number): Promise<UserQuiz[]> {
    return Array.from(this.userQuizzes.values()).filter(
      userQuiz => userQuiz.userId === userId
    );
  }
  
  async createUserQuiz(userQuiz: InsertUserQuiz): Promise<UserQuiz> {
    const id = this.currentIds.userQuizzes++;
    // Create a new userQuiz object with all required fields explicitly set
    const newUserQuiz: UserQuiz = {
      id,
      userId: userQuiz.userId,
      quizId: userQuiz.quizId,
      score: userQuiz.score,
      correctAnswers: userQuiz.correctAnswers,
      totalQuestions: userQuiz.totalQuestions,
      answers: userQuiz.answers,
      timeSpent: userQuiz.timeSpent,
      completedAt: new Date()
    };
    this.userQuizzes.set(id, newUserQuiz);
    return newUserQuiz;
  }
  
  // Achievement methods
  async getAllAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }
  
  private async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const id = this.currentIds.achievements++;
    // Create a new achievement object with all required fields explicitly set
    const newAchievement: Achievement = {
      id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      backgroundColor: achievement.backgroundColor
    };
    this.achievements.set(id, newAchievement);
    return newAchievement;
  }
  
  async getUserAchievements(userId: number): Promise<{achievement: Achievement, earnedAt: Date}[]> {
    const userAchievements = Array.from(this.userAchievements.values()).filter(
      ua => ua.userId === userId
    );
    
    return userAchievements.map(ua => {
      const achievement = this.achievements.get(ua.achievementId);
      if (!achievement) {
        throw new Error(`Achievement with ID ${ua.achievementId} not found`);
      }
      return {
        achievement,
        earnedAt: ua.earnedAt
      };
    });
  }
  
  async addUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const id = this.currentIds.userAchievements++;
    // Create a new userAchievement object with all required fields explicitly set
    const newUserAchievement: UserAchievement = {
      id,
      userId: userAchievement.userId,
      achievementId: userAchievement.achievementId,
      earnedAt: new Date()
    };
    this.userAchievements.set(id, newUserAchievement);
    return newUserAchievement;
  }
}

export const storage = new MemStorage();
