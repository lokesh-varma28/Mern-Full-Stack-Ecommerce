import { useEffect, useState } from "react";
import {
    addReview,
    getReviews,
    updateReview
} from "../api/reviewApi";

export default function ReviewForm({
    productId,
    refresh,
    editingReview,
    clearEditing
}) {

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [images, setImages] = useState([]);

    const [alreadyReviewed, setAlreadyReviewed] = useState(false);
    const [reviewId, setReviewId] = useState("");

    useEffect(() => {
        checkReview();
    }, [productId]);

    useEffect(() => {

        if (editingReview) {

            setAlreadyReviewed(true);
            setReviewId(editingReview._id);
            setRating(editingReview.rating);
            setComment(editingReview.comment);

        }

    }, [editingReview]);

    const checkReview = async () => {

        try {

            const res = await getReviews(productId);

            // ✅ Backend returns { reviews, ratingStats }
            const reviews = res.data.reviews || [];

            const user = JSON.parse(localStorage.getItem("user"));

            if (!user) return;

            const myReview = reviews.find(

                review => review.user?._id === user._id

            );

            if (myReview) {

                setAlreadyReviewed(true);
                setReviewId(myReview._id);
                setRating(myReview.rating);
                setComment(myReview.comment);

            }

            else {

                setAlreadyReviewed(false);
                setReviewId("");
                setRating(5);
                setComment("");

            }

        }

        catch (err) {

            console.log(err);

        }

    };

    const submitReview = async () => {

        if (comment.trim() === "") {

            return alert("Please write a review");

        }

        try {

            if (alreadyReviewed) {

                await updateReview(reviewId, {

                    rating,
                    comment

                });

                alert("Review Updated Successfully ✅");

            }

            else {

                const formData = new FormData();

                formData.append("productId", productId);
                formData.append("rating", rating);
                formData.append("comment", comment);

                images.forEach((image) => {

                    formData.append("images", image);

                });

                await addReview(formData);

                alert("Review Added Successfully ⭐");

            }

            refresh();

            checkReview();

            setImages([]);

            if (clearEditing) {

                clearEditing();

            }

        }

        catch (err) {

            console.log(err);

            alert(

                err.response?.data?.message ||

                "Review Failed"

            );

        }

    };

    return (

        <div className="bg-white shadow-lg rounded-xl p-6 mt-10">

            <h2 className="text-2xl font-bold mb-6">

                ⭐ {alreadyReviewed ? "Edit Review" : "Write Review"}

            </h2>

            <div className="flex gap-2 text-4xl mb-6">

                {[1,2,3,4,5].map((star)=>(

                    <span
                        key={star}
                        onClick={()=>setRating(star)}
                        className={`cursor-pointer transition ${
                            star <= rating
                                ? "text-yellow-400"
                                : "text-gray-300"
                        }`}
                    >
                        ★
                    </span>

                ))}

            </div>

            <textarea
                rows="5"
                value={comment}
                onChange={(e)=>setComment(e.target.value)}
                placeholder="Write your review..."
                className="border rounded-lg w-full p-4"
            />

            {!alreadyReviewed && (

                <div className="mt-4">

                    <label className="font-semibold">

                        Upload Review Images

                    </label>

                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e)=>setImages([...e.target.files])}
                        className="mt-2"
                    />

                </div>

            )}

            <div className="flex gap-3 mt-5">

                <button
                    onClick={submitReview}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-lg"
                >

                    {alreadyReviewed ? "Update Review" : "Submit Review"}

                </button>

                {editingReview && (

                    <button
                        onClick={() => {

                            clearEditing();

                            checkReview();

                        }}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg"
                    >

                        Cancel

                    </button>

                )}

            </div>

        </div>

    );

}