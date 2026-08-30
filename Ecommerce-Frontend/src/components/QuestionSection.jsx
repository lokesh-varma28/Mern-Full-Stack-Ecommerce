import { useEffect, useState } from "react";
import {
    askQuestion,
    getQuestions
} from "../api/questionApi";

export default function QuestionSection({ productId }) {

    const [question, setQuestion] = useState("");
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {

        loadQuestions();

    }, [productId]);

    const loadQuestions = async () => {

        try {

            const res = await getQuestions(productId);

            setQuestions(res.data.questions || []);

        }

        catch (err) {

            console.log(err);

        }

    };

    const submitQuestion = async () => {

        if (!question.trim()) {

            return alert("Please enter your question");

        }

        try {

            setLoading(true);

            await askQuestion(productId, {
                question
            });

            alert("Question Submitted Successfully");

            setQuestion("");

            loadQuestions();

        }

        catch (err) {

            console.log(err);

            alert(
                err.response?.data?.message ||
                "Failed"
            );

        }

        finally {

            setLoading(false);

        }

    };

    return (

        <div className="bg-white rounded-xl shadow-lg p-6 mt-12">

            <h2 className="text-3xl font-bold mb-6">

                ❓ Questions & Answers

            </h2>

            <div className="flex gap-3">

                <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask a question about this product..."
                    className="border flex-1 rounded-lg p-3"
                />

                <button
                    onClick={submitQuestion}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg"
                >

                    {loading ? "Sending..." : "Ask"}

                </button>

            </div>

            <div className="mt-8">

                {

                    questions.length === 0 ?

                    (

                        <p className="text-gray-500">

                            No Questions Yet.

                        </p>

                    )

                    :

                    questions.map(item => (

                        <div
                            key={item._id}
                            className="border-b py-5"
                        >

                            <p className="font-bold">

                                Q. {item.question}

                            </p>

                            <p className="text-gray-500 text-sm mt-1">

                                Asked by {item.user?.name}

                            </p>

                            {

                                item.isAnswered ?

                                (

                                    <div className="mt-3 bg-green-50 rounded-lg p-4">

                                        <p className="font-semibold text-green-700">

                                            ✔ Seller Answer

                                        </p>

                                        <p className="mt-2">

                                            {item.answer}

                                        </p>

                                    </div>

                                )

                                :

                                (

                                    <p className="mt-3 text-orange-600">

                                        Waiting for seller response...

                                    </p>

                                )

                            }

                        </div>

                    ))

                }

            </div>

        </div>

    );

}