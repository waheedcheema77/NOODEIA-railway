"use server"

import { neo4jService } from "../../lib/neo4j"

export async function checkAnswerAction(sessionId, questionIndex, userAnswer) {
  const session = neo4jService.getSession()
  try {
    const result = await session.run(
      `MATCH (qs:QuizSession {id: $sessionId})
       RETURN qs.answers[$index] as correctAnswer`,
      { sessionId, index: questionIndex }
    )
    
    if (result.records.length === 0) return null;
    
    const correctAnswer = neo4jService.toNumber(result.records[0].get('correctAnswer'))
    return {
      correct: correctAnswer === userAnswer,
      correctAnswer
    }
  } catch (error) {
    console.error("Error checking answer:", error)
    return null
  } finally {
    await session.close()
  }
}
