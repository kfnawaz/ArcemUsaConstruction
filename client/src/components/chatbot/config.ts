import { createChatBotMessage } from 'react-chatbot-kit';

// Define the configuration object with TypeScript annotations
const config = {
  botName: 'ARCEMUSA Support',
  initialMessages: [
    createChatBotMessage('Hello! Welcome to ARCEMUSA Construction. How can I help you today?'),
  ],
  customStyles: {
    botMessageBox: {
      backgroundColor: '#C09E5E',
    },
    chatButton: {
      backgroundColor: '#C09E5E',
    },
  },
  widgets: [],
  state: {
    services: [],
    projects: [],
  },
};

export default config;