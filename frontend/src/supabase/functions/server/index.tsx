import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-4e0538b1/health", (c) => {
  return c.json({ status: "ok" });
});

// User Profile endpoints
app.get("/make-server-4e0538b1/profile/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const profile = await kv.get(`user_profile:${userId}`);
    
    if (!profile) {
      return c.json({ error: "Profile not found" }, 404);
    }
    
    return c.json(profile);
  } catch (error) {
    console.log("Error fetching profile:", error);
    return c.json({ error: "Failed to fetch profile" }, 500);
  }
});

app.post("/make-server-4e0538b1/profile", async (c) => {
  try {
    const profileData = await c.req.json();
    const userId = profileData.userId || crypto.randomUUID();
    
    const profile = {
      ...profileData,
      userId,
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(`user_profile:${userId}`, profile);
    return c.json({ success: true, userId, profile });
  } catch (error) {
    console.log("Error saving profile:", error);
    return c.json({ error: "Failed to save profile" }, 500);
  }
});

app.put("/make-server-4e0538b1/profile/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const updates = await c.req.json();
    
    const existingProfile = await kv.get(`user_profile:${userId}`);
    if (!existingProfile) {
      return c.json({ error: "Profile not found" }, 404);
    }
    
    const updatedProfile = {
      ...existingProfile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`user_profile:${userId}`, updatedProfile);
    return c.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.log("Error updating profile:", error);
    return c.json({ error: "Failed to update profile" }, 500);
  }
});

// Meal Records endpoints
app.get("/make-server-4e0538b1/meals/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const date = c.req.query("date");
    
    if (date) {
      // Get meals for specific date
      const meals = await kv.get(`meals:${userId}:${date}`);
      return c.json(meals || []);
    } else {
      // Get all meals for user (last 30 days)
      const results = await kv.getByPrefix(`meals:${userId}:`);
      return c.json(results || []);
    }
  } catch (error) {
    console.log("Error fetching meals:", error);
    return c.json({ error: "Failed to fetch meals" }, 500);
  }
});

app.post("/make-server-4e0538b1/meals", async (c) => {
  try {
    const mealData = await c.req.json();
    const { userId, date, mealType, foodName, calories, protein, carbs, fat, restaurantLink } = mealData;
    
    // Get existing meals for the date
    const existingMeals = await kv.get(`meals:${userId}:${date}`) || [];
    
    const newMeal = {
      id: crypto.randomUUID(),
      mealType,
      foodName,
      calories,
      protein,
      carbs,
      fat,
      restaurantLink,
      timestamp: new Date().toISOString(),
    };
    
    const updatedMeals = [...existingMeals, newMeal];
    await kv.set(`meals:${userId}:${date}`, updatedMeals);
    
    return c.json({ success: true, meal: newMeal });
  } catch (error) {
    console.log("Error saving meal:", error);
    return c.json({ error: "Failed to save meal" }, 500);
  }
});

app.delete("/make-server-4e0538b1/meals/:userId/:date/:mealId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const date = c.req.param("date");
    const mealId = c.req.param("mealId");
    
    const meals = await kv.get(`meals:${userId}:${date}`) || [];
    const updatedMeals = meals.filter((meal: any) => meal.id !== mealId);
    
    await kv.set(`meals:${userId}:${date}`, updatedMeals);
    return c.json({ success: true });
  } catch (error) {
    console.log("Error deleting meal:", error);
    return c.json({ error: "Failed to delete meal" }, 500);
  }
});

// Community Posts endpoints
app.get("/make-server-4e0538b1/community/posts", async (c) => {
  try {
    const posts = await kv.getByPrefix("community_post:");
    // Sort by timestamp, newest first
    const sortedPosts = posts.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return c.json(sortedPosts);
  } catch (error) {
    console.log("Error fetching community posts:", error);
    return c.json({ error: "Failed to fetch posts" }, 500);
  }
});

app.post("/make-server-4e0538b1/community/posts", async (c) => {
  try {
    const postData = await c.req.json();
    const postId = crypto.randomUUID();
    
    const post = {
      id: postId,
      ...postData,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: [],
    };
    
    await kv.set(`community_post:${postId}`, post);
    return c.json({ success: true, post });
  } catch (error) {
    console.log("Error creating post:", error);
    return c.json({ error: "Failed to create post" }, 500);
  }
});

app.post("/make-server-4e0538b1/community/posts/:postId/like", async (c) => {
  try {
    const postId = c.req.param("postId");
    const post = await kv.get(`community_post:${postId}`);
    
    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }
    
    const updatedPost = {
      ...post,
      likes: (post.likes || 0) + 1,
    };
    
    await kv.set(`community_post:${postId}`, updatedPost);
    return c.json({ success: true, post: updatedPost });
  } catch (error) {
    console.log("Error liking post:", error);
    return c.json({ error: "Failed to like post" }, 500);
  }
});

app.post("/make-server-4e0538b1/community/posts/:postId/comment", async (c) => {
  try {
    const postId = c.req.param("postId");
    const { userId, userName, content } = await c.req.json();
    const post = await kv.get(`community_post:${postId}`);
    
    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }
    
    const comment = {
      id: crypto.randomUUID(),
      userId,
      userName,
      content,
      timestamp: new Date().toISOString(),
    };
    
    const updatedPost = {
      ...post,
      comments: [...(post.comments || []), comment],
    };
    
    await kv.set(`community_post:${postId}`, updatedPost);
    return c.json({ success: true, post: updatedPost });
  } catch (error) {
    console.log("Error adding comment:", error);
    return c.json({ error: "Failed to add comment" }, 500);
  }
});

// AI Chat endpoint (mock - in production, would integrate with OpenAI)
app.post("/make-server-4e0538b1/chat", async (c) => {
  try {
    const { userId, message, userProfile } = await c.req.json();
    
    // Save chat history
    const chatHistory = await kv.get(`chat_history:${userId}`) || [];
    
    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };
    
    // Mock AI response (in production, would call OpenAI API)
    let aiResponse = "";
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes("추천") || lowerMessage.includes("메뉴")) {
      aiResponse = `${userProfile?.name || '고객'}님의 목표 칼로리는 ${userProfile?.targetCalories || 2000}kcal이시네요! 오늘 ${userProfile?.currentCalories || 0}kcal를 섭취하셨으니, 약 ${(userProfile?.targetCalories || 2000) - (userProfile?.currentCalories || 0)}kcal 남았습니다.\n\n추천 메뉴:\n🥗 닭가슴살 샐러드 (350kcal)\n🍚 현미밥 + 연어구이 (480kcal)\n🥙 아보카도 랩 (420kcal)\n\n단백질이 풍부한 식사를 권장드립니다!`;
    } else if (lowerMessage.includes("칼로리") || lowerMessage.includes("열량")) {
      aiResponse = `오늘 섭취한 칼로리는 ${userProfile?.currentCalories || 0}kcal입니다. 목표 ${userProfile?.targetCalories || 2000}kcal 대비 ${userProfile?.targetCalories ? ((userProfile.currentCalories / userProfile.targetCalories) * 100).toFixed(1) : 0}% 달성하셨네요! 💪`;
    } else if (lowerMessage.includes("운동")) {
      aiResponse = `식단 관리와 함께 규칙적인 운동도 중요해요! 오늘의 추천 운동:\n\n🏃‍♂️ 유산소: 30분 조깅 (약 300kcal 소모)\n💪 근력: 스쿼트 3세트 x 15회\n🧘‍♀️ 스트레칭: 10분`;
    } else {
      aiResponse = `안녕하세요! 건강한 식단 관리를 도와드리는 AI 비서입니다. 😊\n\n다음과 같은 도움을 드릴 수 있어요:\n• 식사 메뉴 추천\n• 칼로리 분석\n• 영양 상담\n• 운동 조언\n\n무엇을 도와드릴까요?`;
    }
    
    const aiMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: aiResponse,
      timestamp: new Date().toISOString(),
    };
    
    const updatedHistory = [...chatHistory, userMessage, aiMessage];
    await kv.set(`chat_history:${userId}`, updatedHistory);
    
    return c.json({ success: true, message: aiMessage });
  } catch (error) {
    console.log("Error in chat:", error);
    return c.json({ error: "Failed to process chat" }, 500);
  }
});

app.get("/make-server-4e0538b1/chat/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const chatHistory = await kv.get(`chat_history:${userId}`) || [];
    return c.json(chatHistory);
  } catch (error) {
    console.log("Error fetching chat history:", error);
    return c.json({ error: "Failed to fetch chat history" }, 500);
  }
});

Deno.serve(app.fetch);
