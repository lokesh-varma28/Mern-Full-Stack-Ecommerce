import { useState } from "react";
import { askQuestion } from "../api/questionApi";

export default function QuestionForm({
    productId,
    refresh
}) {

    const [question, setQuestion] = useState("");

    const submitQuestion = async () => {

        if (question.trim() === "") {

            return alert("Please enter your question");

        }

        try {

            await askQuestion({

                productId,

                question

            });

            alert("Question Submitted Successfully");

            setQuestion("");

            refresh();

        }

        catch (err) {

            console.log(err);

            alert(

                err.response?.data?.message ||

                "Failed"

            );

        }

    };

    return (

        <div className="bg-white shadow rounded-xl p-6 mt-10">

            <h2 className="text-2xl font-bold mb-5">

                ❓ Ask a Question

            </h2>

            <textarea

                rows="4"

                value={question}

                onChange={(e)=>setQuestion(e.target.value)}

                placeholder="Ask about this product..."

                className="border rounded-lg w-full p-4"

            />

            <button

                onClick={submitQuestion}

                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"

            >

                Submit Question

            </button>

        </div>

    );

}