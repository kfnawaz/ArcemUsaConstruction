import { createChatBotConfig } from 'react-chatbot-kit';
import BotAvatar from './BotAvatar';
import ServicesList from './widgets/ServicesList';
import ProjectsList from './widgets/ProjectsList';
import ContactOptions from './widgets/ContactOptions';

const config = createChatBotConfig({
  botName: 'ARCEMUSA Support',
  initialMessages: [
    {
      message: 'Hello! Welcome to ARCEMUSA Construction. How can I help you today?',
      type: 'bot',
    },
  ],
  customStyles: {
    botMessageBox: {
      backgroundColor: '#C09E5E',
    },
    chatButton: {
      backgroundColor: '#C09E5E',
    },
  },
  customComponents: {
    botAvatar: (props) => <BotAvatar {...props} />,
  },
  widgets: [
    {
      widgetName: 'servicesList',
      widgetFunc: (props) => <ServicesList {...props} />,
      mapStateToProps: ['services'],
    },
    {
      widgetName: 'projectsList',
      widgetFunc: (props) => <ProjectsList {...props} />,
      mapStateToProps: ['projects'],
    },
    {
      widgetName: 'contactOptions',
      widgetFunc: (props) => <ContactOptions {...props} />,
    },
  ],
  state: {
    services: [],
    projects: [],
  },
});

export default config;