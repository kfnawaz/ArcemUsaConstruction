class MessageParser {
  actionProvider: any;
  state: any;

  constructor(actionProvider: any, state: any) {
    this.actionProvider = actionProvider;
    this.state = state;
  }

  parse(message: string) {
    const lowerCaseMessage = message.toLowerCase();

    // Check for greetings
    if (
      lowerCaseMessage.includes("hi") ||
      lowerCaseMessage.includes("hello") ||
      lowerCaseMessage.includes("hey")
    ) {
      return this.actionProvider.handleGreeting();
    }

    // Check for services related queries
    if (
      lowerCaseMessage.includes("service") ||
      lowerCaseMessage.includes("offer") ||
      lowerCaseMessage.includes("provide") ||
      lowerCaseMessage.includes("do you do")
    ) {
      return this.actionProvider.handleServices();
    }

    // Check for project related queries
    if (
      lowerCaseMessage.includes("project") ||
      lowerCaseMessage.includes("portfolio") ||
      lowerCaseMessage.includes("work") ||
      lowerCaseMessage.includes("built") ||
      lowerCaseMessage.includes("examples")
    ) {
      return this.actionProvider.handleProjects();
    }

    // Check for contact related queries
    if (
      lowerCaseMessage.includes("contact") ||
      lowerCaseMessage.includes("reach") ||
      lowerCaseMessage.includes("email") ||
      lowerCaseMessage.includes("phone") ||
      lowerCaseMessage.includes("call") ||
      lowerCaseMessage.includes("talk to")
    ) {
      return this.actionProvider.handleContact();
    }

    // Check for testimonial related queries
    if (
      lowerCaseMessage.includes("testimonial") ||
      lowerCaseMessage.includes("review") ||
      lowerCaseMessage.includes("feedback") ||
      lowerCaseMessage.includes("client")
    ) {
      return this.actionProvider.handleTestimonials();
    }

    // Check for quote related queries
    if (
      lowerCaseMessage.includes("quote") ||
      lowerCaseMessage.includes("estimate") ||
      lowerCaseMessage.includes("cost") ||
      lowerCaseMessage.includes("price") ||
      lowerCaseMessage.includes("pricing") ||
      lowerCaseMessage.includes("how much")
    ) {
      return this.actionProvider.handleQuoteRequest();
    }

    // Default fallback for unrecognized queries
    return this.actionProvider.handleDefault();
  }
}

export default MessageParser;