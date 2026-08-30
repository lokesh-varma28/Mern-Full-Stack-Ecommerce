import API from "./axios";

// Ask Question
export const askQuestion = (data) =>
    API.post("/question", data);

// Get Questions
export const getQuestions = (productId) =>
    API.get(`/question/${productId}`);

// Answer Question
export const answerQuestion = (id, answer) =>
    API.put(`/question/${id}`, { answer });

// Admin Questions
export const getAllQuestions = () =>
    API.get("/admin/questions");