import { useEffect, useState } from "react";
import {
    getAllQuestions,
    answerQuestion
} from "../../api/questionApi";

export default function AdminQuestions() {

    const [questions, setQuestions] = useState([]);

    const [answers, setAnswers] = useState({});

    useEffect(() => {

        loadQuestions();

    }, []);

    const loadQuestions = async () => {

        try {

            const res = await getAllQuestions();

            setQuestions(res.data.questions);

        }

        catch (err) {

            console.log(err);

        }

    };

    const submitAnswer = async (id) => {

        if (!answers[id]) {

            return alert("Please enter answer");

        }

        try {

            await answerQuestion(id, answers[id]);

            alert("Answer Added Successfully");

            loadQuestions();

        }

        catch (err) {

            console.log(err);

            alert("Failed");

        }

    };

    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-6">
            <div>
                <h1 className="text-2xl lg:text-[26px] font-bold text-gray-900 tracking-tight">
                    Customer Questions
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Review and answer customer inquiries on products.
                </p>
            </div>

            {

                questions.map(question => (

                    <div
                        key={question._id}
                        className="bg-white shadow rounded-lg p-6 mb-6"
                    >

                        <h2 className="font-bold text-xl">

                            {question.product?.title}

                        </h2>

                        <p className="mt-3">

                            <b>Customer:</b>

                            {" "}

                            {question.user?.name}

                        </p>

                        <p className="mt-2">

                            <b>Question:</b>

                            {" "}

                            {question.question}

                        </p>

                        {

                            question.isAnswered ?

                            (

                                <div className="bg-green-100 p-4 rounded mt-5">

                                    <b>Answer</b>

                                    <p className="mt-2">

                                        {question.answer}

                                    </p>

                                </div>

                            )

                            :

                            (

                                <div className="mt-5">

                                    <textarea

                                        rows="4"

                                        placeholder="Write Answer..."

                                        className="border rounded-lg w-full p-3"

                                        onChange={(e)=>

                                            setAnswers({

                                                ...answers,

                                                [question._id]:e.target.value

                                            })

                                        }

                                    />

                                    <button

                                        onClick={()=>

                                            submitAnswer(question._id)

                                        }

                                        className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded"

                                    >

                                        Reply

                                    </button>

                                </div>

                            )

                        }

                    </div>

                ))

            }

        </div>

    );

}