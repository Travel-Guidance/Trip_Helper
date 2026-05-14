import { apiPost } from './apiClient'

export async function sendChatMessage(message, history = []) {
  const data = await apiPost('/chatbot', { message, history })
  return data.reply
}
