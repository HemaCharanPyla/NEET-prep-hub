
// server/storage.js
import { db } from './db.js';
import { users, studySessions, chatMessages } from '../shared/schema.js';
import { eq, desc, and, gte, lte } from 'drizzle-orm';

class DatabaseStorage {
  async getUser(id) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async getUserByUsername(username) {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0] || null;
  }

  async getUserByGoogleId(googleId) {
    const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
    return result[0] || null;
  }

  async createUser(insertUser) {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getStudySessionsByUser(userId, limit = 50) {
    return await db.select()
      .from(studySessions)
      .where(eq(studySessions.userId, userId))
      .orderBy(desc(studySessions.createdAt))
      .limit(limit);
  }

  async getStudySessionsByUserAndDate(userId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db.select()
      .from(studySessions)
      .where(
        and(
          eq(studySessions.userId, userId),
          gte(studySessions.createdAt, startOfDay),
          lte(studySessions.createdAt, endOfDay)
        )
      )
      .orderBy(desc(studySessions.createdAt));
  }

  async createStudySession(session) {
    const result = await db.insert(studySessions).values(session).returning();
    return result[0];
  }

  async getChatMessagesByUser(userId, limit = 50) {
    return await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  async createChatMessage(message) {
    const result = await db.insert(chatMessages).values(message).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();


// shared/schema.js
import { pgTable, serial, text, timestamp, integer, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).unique(),
  email: varchar('email', { length: 100 }).unique(),
  googleId: varchar('google_id', { length: 50 }).unique(),
  displayName: varchar('display_name', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const studySessions = pgTable('study_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  subject: varchar('subject', { length: 50 }).notNull(),
  task: text('task'),
  duration: integer('duration').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  message: text('message').notNull(),
  response: text('response'),
  sender: varchar('sender', { length: 20 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
