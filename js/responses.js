const knowledge = [
  { keys: ["hello", "hi", "hey"], answer: "Hello! 👋 I'm AGENET AI, your intelligent conversation companion. What would you like to explore today?" },
  { keys: ["javascript", "js"], answer: "JavaScript is a programming language used to make websites interactive. A good learning path is: variables, data types, conditions, loops, functions, arrays, objects, DOM manipulation, and asynchronous JavaScript. Want me to explain one of these topics?" },
  { keys: ["html", "css"], answer: "HTML provides the structure of a webpage, while CSS controls its presentation and layout. Together, they form the foundation of frontend development. Try building a small responsive landing page to practice both." },
  { keys: ["project", "idea", "ideas"], answer: "Here are three frontend project ideas:\n\n1. Personal task planner — practice CRUD operations and LocalStorage.\n2. Expense tracker — practice forms, calculations, and charts.\n3. AI chatbot interface — practice DOM manipulation, state, and responsive layouts.\n\nChoose one and I can help you break it into steps." },
  { keys: ["email", "professional"], answer: "Here's a simple professional email structure:\n\nSubject: [Clear topic]\n\nHello [Name],\n\nI hope you're doing well. I'm writing to [state your purpose clearly].\n\n[Add the necessary details or request.]\n\nThank you for your time.\n\nBest regards,\n[Your Name]\n\nShare the situation and I can tailor it." },
  { keys: ["plan", "productive", "day"], answer: "Here's a simple productivity plan:\n\n1. Choose your three most important tasks.\n2. Start with the task that needs the most focus.\n3. Work in focused 25–50 minute sessions.\n4. Take short breaks between sessions.\n5. Review what you completed at the end of the day.\n\nKeep the plan realistic and leave room for unexpected work." },
  { keys: ["ai", "artificial intelligence"], answer: "Artificial intelligence (AI) is a field of computing focused on systems that perform tasks associated with human intelligence, such as recognizing patterns, understanding language, and making predictions. Modern AI assistants often use large language models to generate text." },
  { keys: ["thank"], answer: "You're welcome! 😊 I'm glad I could help. What else would you like to work on?" },
  { keys: ["help"], answer: "Of course. I can help with learning concepts, writing, brainstorming, planning, and frontend development. Tell me what you're trying to accomplish, and we'll take it step by step." },
  { keys: ["your founder"], answer: "I am Ai Automated Frontend Chatbot Created By Syed Yusha powered by Build With Yusha " }
];
export function generateResponse(message) {
  const text = message.toLowerCase();
  const match = knowledge.find(item => item.keys.some(key => text.includes(key)));
  if (match) return match.answer;
  return `That's an interesting question. Here's a useful way to approach it:\n\n1. Define exactly what you want to achieve.\n2. Break the problem into smaller steps.\n3. Work through one step at a time.\n4. Review the result and improve it.\n\nThis is a demonstration response from AGENET AI. A real AI model is not connected in this version, so I may not understand every question.`;
}