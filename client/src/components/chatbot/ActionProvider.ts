class ActionProvider {
  createChatBotMessage: any;
  setState: any;
  createClientMessage: any;

  constructor(
    createChatBotMessage: any,
    setStateFunc: any,
    createClientMessage: any
  ) {
    this.createChatBotMessage = createChatBotMessage;
    this.setState = setStateFunc;
    this.createClientMessage = createClientMessage;
  }

  // Default greeting handler
  handleGreeting = () => {
    const message = this.createChatBotMessage(
      "Hello! How can I assist you with your construction needs today?"
    );
    this.updateChatbotState(message);
  };

  // Services information handler
  handleServices = () => {
    const message = this.createChatBotMessage(
      "We offer a wide range of construction services. Here are some of our main services:",
      {
        widget: "servicesList",
      }
    );
    this.updateChatbotState(message);
  };

  // Projects information handler
  handleProjects = () => {
    const message = this.createChatBotMessage(
      "Take a look at some of our featured projects:",
      {
        widget: "projectsList",
      }
    );
    this.updateChatbotState(message);
  };

  // Contact information handler
  handleContact = () => {
    const message = this.createChatBotMessage(
      "You can reach us through any of the following methods:",
      {
        widget: "contactOptions",
      }
    );
    this.updateChatbotState(message);
  };

  // Testimonials information handler
  handleTestimonials = () => {
    const message = this.createChatBotMessage(
      "Our clients speak highly of our work. You can view testimonials on our testimonials page or submit your own experience working with us."
    );
    this.updateChatbotState(message);
  };

  // Quote request handler
  handleQuoteRequest = () => {
    const message = this.createChatBotMessage(
      "We'd be happy to provide a quote for your project. Please fill out our contact form with details about your project, and our team will get back to you within 24-48 hours."
    );
    this.updateChatbotState(message);
  };

  // Default fallback handler
  handleDefault = () => {
    const message = this.createChatBotMessage(
      "I'm not sure I understand. Would you like to know about our services, projects, or how to contact us?",
      {
        withAvatar: true,
      }
    );
    this.updateChatbotState(message);
  };

  // Function to update the chatbot state with new messages
  updateChatbotState = (message: any) => {
    this.setState((prevState: any) => ({
      ...prevState,
      messages: [...prevState.messages, message],
    }));
  };
}

export default ActionProvider;