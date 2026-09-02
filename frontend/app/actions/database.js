"use server"

import { databaseAdapter } from "../../lib/database-adapter"

export async function getUserByIdAction(userId) {
  return await databaseAdapter.getUserById(userId)
}

export async function createUserAction(id, email, name) {
  return await databaseAdapter.createUser(id, email, name)
}

export async function getUserSessionsAction(userId) {
  return await databaseAdapter.getUserSessions(userId)
}

export async function getSessionChatsAction(sessionId) {
  return await databaseAdapter.getSessionChats(sessionId)
}

export async function createSessionAction(userId, title) {
  return await databaseAdapter.createSession(userId, title)
}

export async function updateSessionTitleAction(sessionId, title) {
  return await databaseAdapter.updateSessionTitle(sessionId, title)
}

export async function deleteSessionAction(sessionId) {
  return await databaseAdapter.deleteSession(sessionId)
}

export async function createChatAction(sessionId, role, content) {
  return await databaseAdapter.createChat(sessionId, role, content)
}

export async function updateChatAction(chatId, content) {
  return await databaseAdapter.updateChat(chatId, content)
}

export async function deleteChatAction(chatId) {
  return await databaseAdapter.deleteChat(chatId)
}
