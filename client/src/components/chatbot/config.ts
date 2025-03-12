import { createChatBotMessage } from 'react-chatbot-kit';
import { IConfig, IWidget } from 'react-chatbot-kit/build/src/interfaces/IConfig';

// Dynamically import widgets to avoid JSX in TypeScript file
const createWidget = (Component: any) => {
  return {
    widgetName: Component.name.toLowerCase(),
    widgetFunc: (props: any) => Component(props),
    mapStateToProps: [],
  };
};

// Define the configuration object with TypeScript annotations
const config: IConfig = {
  botName: 'ARCEMUSA Support',
  initialMessages: [
    createChatBotMessage('Hello! Welcome to ARCEMUSA Construction. How can I help you today?'),
  ],
  customStyles: {
    botMessageBox: {
      backgroundColor: '#1E90DB',
    },
    chatButton: {
      backgroundColor: '#1E90DB',
    },
  },
  widgets: [
    {
      widgetName: 'servicesList',
      widgetFunc: (props) => import('./widgets/ServicesList').then(module => module.default(props)),
      mapStateToProps: [],
    },
    {
      widgetName: 'projectsList',
      widgetFunc: (props) => import('./widgets/ProjectsList').then(module => module.default(props)),
      mapStateToProps: [],
    },
    {
      widgetName: 'contactOptions',
      widgetFunc: (props) => import('./widgets/ContactOptions').then(module => module.default(props)),
      mapStateToProps: [],
    },
    {
      widgetName: 'quoteOptions',
      widgetFunc: (props) => import('./widgets/QuoteOptions').then(module => module.default(props)),
      mapStateToProps: [],
    },
    {
      widgetName: 'newsletterOptions',
      widgetFunc: (props) => import('./widgets/NewsletterOptions').then(module => module.default(props)),
      mapStateToProps: [],
    },
  ] as IWidget[],
  state: {
    services: [],
    projects: [],
  },
};

export default config;